"""Unit tests for Milestone 3 (CRM Integration & Conversation Intelligence)"""

def test_create_customer(client):
    response = client.post("/customer", json={
        "name": "John Doe",
        "email": "john@microsoft.com",
        "company": "Microsoft",
        "status": "Interested"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Customer Added"
    assert data["customer"]["company"] == "Microsoft"


def test_crm_push(client):
    response = client.post("/crm/push", json={
        "name": "Sarah Connor",
        "company": "Cyberdyne Systems",
        "lead_stage": "Demo Scheduled"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Success"
    assert data["customer"]["company"] == "Cyberdyne Systems"


def test_meeting_summarize(client):
    transcript = "Customer is interested in purchasing our AI analytics platform. Requested pricing details. Follow-up next Tuesday."
    response = client.post("/summarize", json={"transcript": transcript})
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "action_items" in data
    assert "sentiment" in data


def test_meeting_summary_by_id(client):
    response = client.get("/summary/101")
    assert response.status_code == 200
    data = response.json()
    assert data["meeting_id"] == 101
    assert "summary" in data


def test_insights_extraction(client):
    response = client.post("/insights", json={
        "transcript": "Budget is 5000 dollars. Interested in AI analytics. Mentioned Salesforce."
    })
    assert response.status_code == 200
    data = response.json()
    assert "interest" in data
    assert "budget" in data
    assert "competitors_mentioned" in data
