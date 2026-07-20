from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from database import fetchone, fetchall, execute
from models import LeadCreate, ActivityCreate
from ml_engine import (
    calculate_rule_score,
    retrain_ml_model,
    augment_lead,
    get_ml_probability,
    get_category,
)

router = APIRouter(prefix="/api", tags=["Leads"])


# ---------------------------------------------------------------------------
# List leads
# ---------------------------------------------------------------------------

@router.get("/leads")
def get_leads(
    search: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("score"),
    sort_order: Optional[str] = Query("desc"),
):
    query = "SELECT * FROM leads WHERE 1=1"
    params = []

    if search:
        query += " AND (company LIKE ? OR contact_name LIKE ? OR designation LIKE ? OR industry LIKE ? OR location LIKE ?)"
        sp = f"%{search}%"
        params.extend([sp, sp, sp, sp, sp])

    if industry:
        query += " AND industry = ?"
        params.append(industry)

    if stage:
        query += " AND stage = ?"
        params.append(stage)

    order = "DESC" if sort_order.lower() == "desc" else "ASC"
    if sort_by == "score":
        query += f" ORDER BY score {order}"
    elif sort_by == "company":
        query += f" ORDER BY company {order}"
    elif sort_by == "location":
        query += f" ORDER BY location {order}"
    else:
        query += f" ORDER BY id {order}"

    rows = fetchall(query, tuple(params))
    leads = [dict(r) for r in rows]

    for lead in leads:
        lead['ml_prob'] = round(
            get_ml_probability(lead['email_opens'], lead['website_visits'], lead['demo_request']), 1
        )
        lead['category'] = get_category(lead['score'])

    return leads


# ---------------------------------------------------------------------------
# Single lead detail
# ---------------------------------------------------------------------------

@router.get("/leads/{lead_id}")
def get_lead(lead_id: int):
    row = fetchone("SELECT * FROM leads WHERE id = ?", (lead_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = dict(row)
    return augment_lead(lead, include_activities=True)


# ---------------------------------------------------------------------------
# Create lead
# ---------------------------------------------------------------------------

@router.post("/leads")
def create_lead(lead: LeadCreate):
    score = calculate_rule_score(
        lead.employees, lead.industry,
        lead.website_visits, lead.email_opens, lead.demo_request,
    )

    lead_id = execute(
        """INSERT INTO leads (
            company, contact_name, designation, email, phone, industry,
            employees, revenue, location, funding, technology, score,
            stage, email_opens, website_visits, demo_request, converted, pain_point
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            lead.company, lead.contact_name, lead.designation, lead.email,
            lead.phone, lead.industry, lead.employees, lead.revenue,
            lead.location, lead.funding, lead.technology, score,
            lead.stage, lead.email_opens, lead.website_visits,
            lead.demo_request, lead.converted, lead.pain_point,
        ),
    )

    execute(
        "INSERT INTO activities (lead_id, date, activity, status) VALUES (?, ?, 'Lead Registered', 'Completed')",
        (lead_id, datetime.now().strftime("%Y-%m-%d")),
    )

    retrain_ml_model()
    return {"message": "Lead created successfully", "lead_id": lead_id, "score": score}


# ---------------------------------------------------------------------------
# Update lead
# ---------------------------------------------------------------------------

@router.put("/leads/{lead_id}")
def update_lead(lead_id: int, lead: LeadCreate):
    existing = fetchone("SELECT id FROM leads WHERE id = ?", (lead_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Lead not found")

    score = calculate_rule_score(
        lead.employees, lead.industry,
        lead.website_visits, lead.email_opens, lead.demo_request,
    )

    execute(
        """UPDATE leads SET
            company=?, contact_name=?, designation=?, email=?, phone=?, industry=?,
            employees=?, revenue=?, location=?, funding=?, technology=?, score=?,
            stage=?, email_opens=?, website_visits=?, demo_request=?, converted=?, pain_point=?
        WHERE id=?""",
        (
            lead.company, lead.contact_name, lead.designation, lead.email,
            lead.phone, lead.industry, lead.employees, lead.revenue,
            lead.location, lead.funding, lead.technology, score,
            lead.stage, lead.email_opens, lead.website_visits,
            lead.demo_request, lead.converted, lead.pain_point,
            lead_id,
        ),
    )

    retrain_ml_model()
    return {"message": "Lead updated successfully", "score": score}


# ---------------------------------------------------------------------------
# Delete lead
# ---------------------------------------------------------------------------

@router.delete("/leads/{lead_id}")
def delete_lead(lead_id: int):
    existing = fetchone("SELECT id FROM leads WHERE id = ?", (lead_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Lead not found")

    execute("DELETE FROM activities WHERE lead_id = ?", (lead_id,))
    execute("DELETE FROM leads WHERE id = ?", (lead_id,))

    retrain_ml_model()
    return {"message": "Lead deleted successfully"}


# ---------------------------------------------------------------------------
# Log activity (with side-effects on metrics / stage)
# ---------------------------------------------------------------------------

@router.post("/leads/{lead_id}/activities")
def add_activity(lead_id: int, act: ActivityCreate):
    row = fetchone(
        "SELECT email_opens, website_visits, demo_request, converted, stage, employees, industry FROM leads WHERE id = ?",
        (lead_id,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")

    email_opens, website_visits, demo_request, converted, stage, employees, industry = row

    # Log the activity
    today = datetime.now().strftime("%Y-%m-%d")
    execute(
        "INSERT INTO activities (lead_id, date, activity, status) VALUES (?, ?, ?, ?)",
        (lead_id, today, act.activity, act.status),
    )

    # Side-effects based on activity content
    aname = act.activity.lower()
    if "open" in aname or "email open" in aname:
        email_opens += 1
    elif "visit" in aname or "website" in aname:
        website_visits += 1
    elif "demo" in aname or "product demo" in aname:
        demo_request = 1
        if stage in ("Lead", "Contacted"):
            stage = "Product Demo"
    elif "proposal" in aname or "send proposal" in aname:
        stage = "Proposal Sent"
    elif "negotiate" in aname or "negotiation" in aname:
        stage = "Negotiation"
    elif "won" in aname or "contract signed" in aname or "close won" in aname:
        converted = 1
        stage = "Closed Won"

    new_score = calculate_rule_score(employees, industry, website_visits, email_opens, demo_request)

    execute(
        """UPDATE leads SET
            email_opens=?, website_visits=?, demo_request=?, converted=?, stage=?, score=?
        WHERE id=?""",
        (email_opens, website_visits, demo_request, converted, stage, new_score, lead_id),
    )

    retrain_ml_model()
    return {
        "message": "Activity logged successfully",
        "new_score": new_score,
        "stage": stage,
    }
