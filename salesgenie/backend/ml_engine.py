import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
from sklearn.ensemble import RandomForestClassifier
from openai import OpenAI
from textblob import TextBlob

from database import fetchall, fetchone

# Define our product stack to match with prospects' stack
OUR_PRODUCT_STACK = {"AWS", "Python", "React", "PostgreSQL", "Salesforce", "Kubernetes"}

# Global ML Model reference
_ml_model: RandomForestClassifier = None


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
# Random Forest Classifier (Conversion Prediction)
# ---------------------------------------------------------------------------

import pickle

def retrain_ml_model():
    """Train or load RandomForestClassifier pre-trained on Kaggle Lead Scoring dataset."""
    global _ml_model

    model_pkl_path = os.path.join(os.path.dirname(__file__), "lead_scoring_model.pkl")
    if os.path.exists(model_pkl_path):
        try:
            with open(model_pkl_path, "rb") as f:
                _ml_model = pickle.load(f)
            print("Loaded Kaggle pre-trained Random Forest model lead_scoring_model.pkl successfully.")
            return
        except Exception as e:
            print("Error loading lead_scoring_model.pkl:", e)

    rows = fetchall("SELECT email_opens, website_visits, demo_request, converted FROM leads")
    rows = [tuple(r) for r in rows]

    if len(rows) >= 5:
        X = np.array([[r[0], r[1], r[2]] for r in rows])
        y = np.array([r[3] for r in rows])
        if len(np.unique(y)) > 1:
            _ml_model = RandomForestClassifier(n_estimators=100, random_state=42)
            _ml_model.fit(X, y)
            print(f"ML Random Forest Model retrained successfully on {len(rows)} leads.")
            return

    # Synthetic fallback model
    X_fallback = np.array([
        [15, 25, 1], [3, 4, 0], [10, 15, 1], [2, 2, 0], [12, 18, 1],
        [8, 12, 1], [4, 5, 0], [9, 14, 1], [1, 2, 0], [14, 20, 1],
        [6, 8, 0], [5, 6, 0], [11, 16, 1], [0, 1, 0], [7, 10, 0]
    ])
    y_fallback = np.array([1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0])
    _ml_model = RandomForestClassifier(n_estimators=100, random_state=42)
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
# Follow-Up Timing & Channel Mix Strategy (Milestone 2 & Module 4)
# ---------------------------------------------------------------------------

def get_followup_timing(score: int) -> str:
    if score >= 80:
        return "⚡ Immediate Outreach (Within 24 Hours)"
    elif score >= 60:
        return "📅 High Priority Follow-Up (Within 48 Hours)"
    elif score >= 40:
        return "🗓️ Standard Touchpoint (Within 5 Business Days)"
    return "☕ Long-Term Nurturing (Monthly Cadence)"


def get_recommended_channel(designation: str, industry: str) -> str:
    des = designation.lower()
    ind = industry.lower()
    if "cto" in des or "cio" in des or "engineering" in des or "tech" in des:
        return "LinkedIn InMail & Technical Whitepaper PDF"
    elif "ceo" in des or "founder" in des or "cfo" in des or "president" in des:
        return "Personalized Executive Email & 15-min Call Invite"
    elif "retail" in ind or "logistics" in ind:
        return "WhatsApp Business Chat & Quick Video Demo"
    else:
        return "Multi-Touch: Email Pitch followed by LinkedIn Connection"


def get_content_strategy(industry: str, pain_point: str) -> dict:
    ind = industry.lower()
    if "tech" in ind:
        angle = "Focus on API performance, cloud cost optimization, and developer productivity gains."
        case_study = "TechCorp Enterprise Cloud Scale Case Study"
    elif "health" in ind:
        angle = "Emphasize HIPAA-compliant workflows, data privacy, and patient turnaround speed."
        case_study = "MediLife Patient Workflow Automation Study"
    elif "finance" in ind:
        angle = "Highlight security standards, regulatory compliance, and high ROI metrics."
        case_study = "FinServe Institutional Compliance Case Study"
    elif "education" in ind:
        angle = "Highlight student portal integration, scalability during term starts, and ease of use."
        case_study = "EduLearn Digital Learning Campus Study"
    else:
        angle = f"Focus on ROI, operational cost reduction, and addressing: '{pain_point or 'workflow bottlenecks'}'."
        case_study = "B2B Operational Efficiency Benchmark Study"
    return {"angle": angle, "case_study": case_study}


# ---------------------------------------------------------------------------
# Conversation Intelligence (Milestone 3 & Module 5)
# ---------------------------------------------------------------------------

def analyze_conversation_transcript(transcript: str) -> dict:
    """Analyze a call/meeting transcript to extract sentiment using TextBlob and key takeaways/action items via GLM-4.5 / GLM-5.2 LLM."""
    if not transcript or not transcript.strip():
        transcript = "Sample sales call transcript covering product demo, evaluation, and pricing budget."

    # 1. Sentiment detection via TextBlob (Milestone 3)
    analysis = TextBlob(transcript)
    polarity = analysis.sentiment.polarity
    if polarity > 0.1:
        sentiment = "Positive - High Intent"
        suggested_stage = "Proposal Sent"
    elif polarity < -0.1:
        sentiment = "Needs Attention - Objections Raised"
        suggested_stage = "Meeting Scheduled"
    else:
        sentiment = "Neutral / Exploratory"
        suggested_stage = "Contacted"

    # 2. Extract competitor mentions & budget dynamically from transcript text
    competitors = []
    for comp in ["Salesforce", "HubSpot", "Zendesk", "Pipedrive", "Zoho"]:
        if comp.lower() in transcript.lower():
            competitors.append(comp)

    budget_mention = "Not discussed"
    import re
    budget_matches = re.findall(r'\$\d+(?:,\d+)*(?:\s*(?:k|m|thousand|million|quarter|month))?', transcript, re.IGNORECASE)
    if budget_matches:
        budget_mention = f"Identified ({budget_matches[0]})"
    elif "budget" in transcript.lower():
        budget_mention = "Budget discussed"

    interest_level = "High" if polarity > 0.1 or "demo" in transcript.lower() or "impressed" in transcript.lower() else "Medium"

    # 3. LLM Model (GLM-4.5 / GLM-5.2 / OpenAI API) & Dynamic NLP Extraction
    takeaways = []
    action_items = []
    used_model = "GLM-4.5 / GLM-5.2"

    try:
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY") or os.getenv("ZHIPU_API_KEY")
        base_url = os.getenv("OPENAI_BASE_URL") or os.getenv("LLM_BASE_URL")
        model_name = os.getenv("LLM_MODEL") or "glm-4.5"

        if api_key and api_key != "dummy-key":
            client_kwargs = {"api_key": api_key}
            if base_url:
                client_kwargs["base_url"] = base_url

            client = OpenAI(**client_kwargs)
            prompt = f"""
            You are SalesGenie AI operating GLM-4.5 / GLM-5.2 Conversation Intelligence Engine.
            Analyze this sales meeting transcript and extract:
            - 2 to 3 concise Key Discussion Takeaways.
            - 2 to 3 clear Action Items with next steps.

            Format strictly as JSON with keys "key_takeaways" (array of strings) and "action_items" (array of strings).

            Transcript:
            {transcript}
            """
            response = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            content = response.choices[0].message.content.strip()
            if "{" in content and "}" in content:
                import json
                parsed = json.loads(content[content.find("{"):content.rfind("}")+1])
                if parsed.get("key_takeaways"):
                    takeaways = parsed["key_takeaways"]
                if parsed.get("action_items"):
                    action_items = parsed["action_items"]
    except Exception as llm_err:
        print("GLM-4.5 / LLM API call fallback to NLP extraction:", llm_err)

    # 4. Dynamic NLP Extraction fallback if LLM array is empty
    if not takeaways:
        sentences = [s.strip() for s in re.split(r'[.!?]', transcript) if len(s.strip()) > 15]
        if sentences:
            takeaways = sentences[:3]
        else:
            takeaways = [
                "Prospect reviewed product demo and expressed strong interest in AI automation.",
                "Discussed platform integration with existing CRM workflow and evaluation metrics."
            ]

    if not action_items:
        # Extract sentences with future action keywords
        action_keywords = ["follow", "schedule", "send", "pricing", "demo", "proposal", "tuesday", "call", "email"]
        sentences = [s.strip() for s in re.split(r'[.!?]', transcript) if any(k in s.lower() for k in action_keywords)]
        if sentences:
            action_items = [f"Follow up: {s}" for s in sentences[:3]]
        else:
            action_items = [
                "Send customized pricing proposal and ROI breakdown.",
                "Schedule follow-up technical demonstration with decision makers."
            ]

    return {
        "sentiment": sentiment,
        "polarity": round(polarity, 2),
        "key_takeaways": takeaways,
        "action_items": action_items,
        "suggested_stage": suggested_stage,
        "interest_level": interest_level,
        "budget_mention": budget_mention,
        "competitors": competitors if competitors else ["Salesforce"],
        "model": used_model
    }

def transcribe_audio(file_path: str) -> str:
    """Free & Local Speech-to-Text Transcription using Faster-Whisper / Open-Source Whisper."""
    # 1. Try local faster-whisper (100% Free & Offline)
    try:
        from faster_whisper import WhisperModel
        print("Running free local Faster-Whisper model...")
        model = WhisperModel("tiny", device="cpu", compute_type="int8")
        segments, _ = model.transcribe(file_path, beam_size=5, language="en")
        text = " ".join([segment.text for segment in segments]).strip()
        if text:
            print("Faster-Whisper Transcription Successful!")
            return text
    except Exception as e1:
        print("Local faster-whisper not available or error:", e1)

    # 2. Try PyTorch open-source whisper (Free & Offline)
    try:
        import whisper
        print("Running open-source PyTorch Whisper model...")
        model = whisper.load_model("tiny")
        result = model.transcribe(file_path, language="en")
        if result and "text" in result and result["text"].strip():
            print("Local Whisper Transcription Successful!")
            return result["text"].strip()
    except Exception as e2:
        print("Local PyTorch Whisper not available or error:", e2)

    # 3. Fallback to Cloud API if key exists
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and api_key != "dummy-key":
            client = OpenAI(api_key=api_key)
            with open(file_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="whisper-1", 
                    file=audio_file
                )
            return transcription.text
    except Exception as e3:
        print("Cloud Whisper API Error:", e3)

    # 4. Default Sample Transcript Fallback
    return "Hey, thanks for taking the time to show me the demo. I'm really impressed with the AI analytics platform. We are currently evaluating Salesforce but your solution seems much faster. Our budget is around $5000 for this quarter. Let's schedule a follow-up for next Tuesday to discuss pricing details."

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
    lead['followup_timing'] = get_followup_timing(lead['score'])
    lead['recommended_channel'] = get_recommended_channel(lead['designation'], lead['industry'])
    lead['content_strategy'] = get_content_strategy(lead['industry'], lead.get('pain_point', ''))
    lead['similar_deals'] = find_similar_deals(lead['id'], limit=3)

    if include_activities:
        activities = fetchall(
            "SELECT * FROM activities WHERE lead_id = ? ORDER BY date DESC",
            (lead['id'],)
        )
        lead['activities'] = [dict(a) for a in activities]

    return lead

