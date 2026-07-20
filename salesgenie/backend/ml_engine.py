import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
from sklearn.tree import DecisionTreeClassifier

from database import fetchall, fetchone

# Define our product stack to match with prospects' stack
OUR_PRODUCT_STACK = {"AWS", "Python", "React", "PostgreSQL", "Salesforce", "Kubernetes"}

# Global ML Model reference
_ml_model: DecisionTreeClassifier = None


# ---------------------------------------------------------------------------
# Rule-Based Scoring for B2B Leads CRM
# ---------------------------------------------------------------------------

def calculate_rule_score(employees: int, industry: str,
                          website_visits: int, email_opens: int,
                          demo_request: int) -> int:
    """Compute a lead score out of 100 based on B2B criteria."""
    # 1. Company Size (max 25)
    if employees >= 200:
        size_score = 25
    elif employees >= 100:
        size_score = 20
    elif employees >= 50:
        size_score = 15
    else:
        size_score = 10

    # 2. Industry Weight (max 22)
    ind = industry.lower()
    if "technology" in ind or "tech" in ind or "finance" in ind:
        ind_score = 22
    elif "healthcare" in ind or "health" in ind:
        ind_score = 18
    else:
        ind_score = 12

    # 3. Demo Request (max 20)
    demo_score = 20 if demo_request == 1 else 0

    # 4. Engagement (visits and opens)
    if website_visits >= 18:
        visits_score = 18
    elif website_visits >= 10:
        visits_score = 14
    elif website_visits >= 4:
        visits_score = 10
    elif website_visits >= 1:
        visits_score = 5
    else:
        visits_score = 0

    if email_opens >= 12:
        opens_score = 15
    elif email_opens >= 6:
        opens_score = 11
    elif email_opens >= 2:
        opens_score = 7
    elif email_opens >= 0:
        opens_score = 3
    else:
        opens_score = 0

    return size_score + ind_score + demo_score + visits_score + opens_score


def get_category(score: int) -> str:
    if score >= 80:
        return "Hot Lead"
    elif score >= 60:
        return "Warm Lead"
    elif score >= 40:
        return "Cold Lead"
    return "Low Priority"


def get_next_action(score: int) -> str:
    if score >= 80:
        return "Schedule a live product demonstration and prepare the contract draft."
    elif score >= 60:
        return "Send a personalized proposal with ROI analysis."
    elif score >= 40:
        return "Nurture lead with case studies and check weekly."
    return "Add to monthly newsletter distribution list."


# ---------------------------------------------------------------------------
# Decision Tree Classifier (Conversion Prediction)
# ---------------------------------------------------------------------------

def retrain_ml_model():
    """Train DecisionTreeClassifier from live CRM lead engagement logs."""
    global _ml_model

    rows = fetchall("SELECT email_opens, website_visits, demo_request, converted FROM leads")
    rows = [tuple(r) for r in rows]

    if len(rows) >= 5:
        X = np.array([[r[0], r[1], r[2]] for r in rows])
        y = np.array([r[3] for r in rows])
        if len(np.unique(y)) > 1:
            _ml_model = DecisionTreeClassifier(random_state=42)
            _ml_model.fit(X, y)
            print(f"ML DecisionTree Model retrained successfully on {len(rows)} leads.")
            return

    # Synthetic fallback model
    X_fallback = np.array([
        [15, 25, 1], [3, 4, 0], [10, 15, 1], [2, 2, 0], [12, 18, 1],
        [8, 12, 1], [4, 5, 0], [9, 14, 1], [1, 2, 0], [14, 20, 1],
        [6, 8, 0], [5, 6, 0], [11, 16, 1], [0, 1, 0], [7, 10, 0]
    ])
    y_fallback = np.array([1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0])
    _ml_model = DecisionTreeClassifier(random_state=42)
    _ml_model.fit(X_fallback, y_fallback)
    print("Fallback ML model fitted.")


def get_ml_probability(email_opens: int, website_visits: int,
                       demo_request: int) -> float:
    global _ml_model
    if _ml_model is None:
        retrain_ml_model()
    try:
        prob = _ml_model.predict_proba(
            [[email_opens, website_visits, demo_request]]
        )[0][1]
        return float(prob * 100)
    except Exception:
        return 100.0 if demo_request == 1 else 15.0


# ---------------------------------------------------------------------------
# Technical Stack Alignment
# ---------------------------------------------------------------------------

def get_tech_alignment(tech_string: str):
    if not tech_string:
        return {"matched": [], "score": 0}
    techs = {t.strip() for t in tech_string.split(",") if t.strip()}
    matched = list(techs.intersection(OUR_PRODUCT_STACK))
    score = int((len(matched) / len(OUR_PRODUCT_STACK)) * 100) if OUR_PRODUCT_STACK else 0
    return {"matched": matched, "score": score}


# ---------------------------------------------------------------------------
# Decision Maker Classification
# ---------------------------------------------------------------------------

def get_decision_maker_info(designation: str):
    des = designation.lower()
    if "cto" in des or "cio" in des or "it" in des or "technology" in des:
        return "Technical Decision Maker"
    elif "cfo" in des or "finance" in des:
        return "Financial Decision Maker"
    elif "ceo" in des or "founder" in des or "president" in des:
        return "Executive Sponsor / Decision Maker"
    else:
        return "Business Influencer"


# ---------------------------------------------------------------------------
# TF-IDF Similar Converted Deals Finder
# ---------------------------------------------------------------------------

def find_similar_deals(lead_id: int, limit: int = 3):
    rows = fetchall(
        "SELECT id, company, industry, technology, location, pain_point, stage FROM leads"
    )
    leads = [dict(r) for r in rows]

    if len(leads) <= 1:
        return []

    target_idx = None
    features = []
    lead_ids = []

    for idx, lead in enumerate(leads):
        lead_ids.append(lead['id'])
        if lead['id'] == lead_id:
            target_idx = idx
        desc = f"{lead.get('industry', '')} {lead.get('technology', '')} {lead.get('location', '')} {lead.get('pain_point', '')}"
        features.append(desc)

    if target_idx is None:
        return []

    try:
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(features)
        cosine_sim = linear_kernel(
            tfidf_matrix[target_idx:target_idx + 1], tfidf_matrix
        ).flatten()
        similar_indices = cosine_sim.argsort()[::-1]

        similar_deals = []
        for idx in similar_indices:
            if len(similar_deals) >= limit:
                break
            curr_id = lead_ids[idx]
            if curr_id == lead_id:
                continue
            if leads[idx]['stage'] == 'Closed Won':
                lead_info = leads[idx].copy()
                lead_info['similarity'] = round(float(cosine_sim[idx]) * 100, 1)
                similar_deals.append(lead_info)

        # Fallback to non-closed deals if needed
        if len(similar_deals) < limit:
            for idx in similar_indices:
                if len(similar_deals) >= limit:
                    break
                curr_id = lead_ids[idx]
                if curr_id == lead_id:
                    continue
                if leads[idx]['stage'] != 'Closed Won':
                    lead_info = leads[idx].copy()
                    lead_info['similarity'] = round(float(cosine_sim[idx]) * 100, 1)
                    similar_deals.append(lead_info)

        return similar_deals
    except Exception as e:
        print("Error calculating similar deals:", e)
        return [l for l in leads if l['id'] != lead_id][:limit]


# ---------------------------------------------------------------------------
# Lead augmentation helper (used by routers)
# ---------------------------------------------------------------------------

def augment_lead(lead: dict, include_activities: bool = False) -> dict:
    """Add computed fields to a lead dict."""
    lead['ml_prob'] = round(
        get_ml_probability(lead['email_opens'], lead['website_visits'], lead['demo_request']), 1
    )
    lead['category'] = get_category(lead['score'])
    lead['decision_maker_type'] = get_decision_maker_info(lead['designation'])
    lead['tech_alignment'] = get_tech_alignment(lead['technology'])
    lead['next_action'] = get_next_action(lead['score'])
    lead['similar_deals'] = find_similar_deals(lead['id'], limit=3)

    if include_activities:
        activities = fetchall(
            "SELECT * FROM activities WHERE lead_id = ? ORDER BY date DESC",
            (lead['id'],)
        )
        lead['activities'] = [dict(a) for a in activities]

    return lead
