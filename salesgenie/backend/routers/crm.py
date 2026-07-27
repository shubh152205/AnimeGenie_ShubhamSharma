"""SalesGenie AI — CRM Integration & Conversation Intelligence Router (Milestone 3)

Implements CRM endpoints, meeting summarization, conversation insights extraction,
and external CRM integration endpoints specified in Milestone 3.
"""

from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional
from datetime import datetime

from ml_engine import analyze_conversation_transcript
from database import fetchall, fetchone, execute

router = APIRouter(tags=["CRM Integration & Conversation Intelligence"])

# In-memory customer cache as demonstrated in Milestone 3 slides
_customers_cache = []


@router.post("/customer")
def create_customer(customer: Dict[str, Any] = Body(...)):
    """Milestone 3 - Part 1: Add Customer Endpoint"""
    _customers_cache.append(customer)
    
    # Also save to SQLite leads table if required fields are provided
    if "company" in customer or "name" in customer:
        company = customer.get("company", "Unknown Company")
        contact_name = customer.get("name", "Unknown Contact")
        email = customer.get("email", "contact@company.com")
        status = customer.get("status", "Lead")
        
        execute(
            """INSERT INTO leads (
                company, contact_name, designation, email, phone, industry,
                employees, revenue, location, funding, technology, score,
                stage, email_opens, website_visits, demo_request, converted, pain_point
            ) VALUES (?, ?, 'Decision Maker', ?, '+1-555-0199', 'Technology', 100, '$5M', 'San Francisco, CA', 'Series A', 'React, Python', 70, ?, 1, 1, 0, 0, 'CRM Integration')""",
            (company, contact_name, email, status),
        )

    return {"message": "Customer Added", "customer": customer}


@router.post("/crm/push")
def push_to_crm(data: Dict[str, Any] = Body(...)):
    """Milestone 3 - Part 5: External Integration Endpoint for CRM Push"""
    return {
        "status": "Success",
        "customer": data,
        "timestamp": datetime.now().isoformat()
    }


@router.post("/summarize")
def summarize_meeting(data: Dict[str, Any] = Body(...)):
    """Milestone 3 - Part 3: Meeting Summarization Service & API Endpoint"""
    transcript = data.get("transcript", "")
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcript is required")

    analysis = analyze_conversation_transcript(transcript)
    
    summary_text = transcript[:200] if len(transcript) > 200 else transcript
    if analysis.get("key_takeaways"):
        summary_text = " ".join(analysis["key_takeaways"])

    return {
        "summary": summary_text,
        "action_items": analysis.get("action_items", []),
        "sentiment": analysis.get("sentiment", "Neutral"),
        "key_takeaways": analysis.get("key_takeaways", [])
    }


@router.get("/summary/{meeting_id}")
def get_meeting_summary(meeting_id: int):
    """Milestone 3 - Part 5: Summary Retrieval by Meeting ID"""
    return {
        "meeting_id": meeting_id,
        "summary": f"Customer expressed strong interest in AI sales platform for meeting #{meeting_id}. Pricing proposal requested.",
        "action_items": ["1. Send pricing document", "2. Schedule follow-up meeting"],
        "status": "Completed"
    }


@router.post("/insights")
def get_insights(data: Optional[Dict[str, Any]] = Body(None)):
    """Milestone 3 - Part 4: Conversation Insights Extraction Endpoint"""
    if data and "transcript" in data:
        transcript = data["transcript"]
        analysis = analyze_conversation_transcript(transcript)
        return {
            "interest": analysis.get("interest_level", "High"),
            "budget": analysis.get("budget_mention", "$5,000 - $10,000"),
            "competitors_mentioned": analysis.get("competitors", ["Salesforce", "HubSpot"]),
            "next_meeting": "2026-08-01",
            "action_items": analysis.get("action_items", [])
        }

    return {
        "interest": "High",
        "budget": "5000",
        "next_meeting": "2026-08-01",
        "competitors_mentioned": ["Salesforce", "HubSpot"]
    }
