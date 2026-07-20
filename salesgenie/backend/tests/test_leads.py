"""Integration tests for the leads CRUD and activity endpoints."""


class TestListLeads:
    def test_empty_list(self, client):
        resp = client.get("/api/leads")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_with_data(self, client, seed_multi_leads):
        resp = client.get("/api/leads")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3
        # Each lead should have ml_prob and category injected
        for lead in data:
            assert "ml_prob" in lead
            assert "category" in lead

    def test_filter_by_industry(self, client, seed_multi_leads):
        resp = client.get("/api/leads?industry=Technology")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["company"] == "TechCorp"

    def test_filter_by_stage(self, client, seed_multi_leads):
        resp = client.get("/api/leads?stage=Lead")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["company"] == "FinanceFlow"

    def test_search_by_company(self, client, seed_multi_leads):
        resp = client.get("/api/leads?search=Health")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["company"] == "HealthInc"

    def test_sort_by_score_desc(self, client, seed_multi_leads):
        resp = client.get("/api/leads?sort_by=score&sort_order=desc")
        scores = [l["score"] for l in resp.json()]
        assert scores == sorted(scores, reverse=True)

    def test_sort_by_company_asc(self, client, seed_multi_leads):
        resp = client.get("/api/leads?sort_by=company&sort_order=asc")
        companies = [l["company"] for l in resp.json()]
        assert companies == sorted(companies)


class TestGetLead:
    def test_get_existing(self, client, seed_lead):
        lid = seed_lead
        resp = client.get(f"/api/leads/{lid}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["company"] == "Acme Corp"
        assert data["contact_name"] == "Alice Wonder"
        assert data["ml_prob"] is not None
        assert data["category"] == "Hot Lead"
        assert data["decision_maker_type"] == "Technical Decision Maker"
        assert data["tech_alignment"]["score"] > 0
        assert len(data["similar_deals"]) >= 0  # may be empty with only 1 lead
        assert len(data["activities"]) >= 1
        assert "next_action" in data

    def test_get_not_found(self, client):
        resp = client.get("/api/leads/999")
        assert resp.status_code == 404


class TestCreateLead:
    CREATE_PAYLOAD = {
        "company": "NewCo",
        "contact_name": "Bob Builder",
        "designation": "CEO",
        "email": "bob@newco.com",
        "phone": "+1-555-0200",
        "industry": "Software",
        "employees": 80,
        "revenue": "$5M",
        "location": "Austin",
        "funding": "Seed",
        "technology": "Python, AWS",
        "pain_point": "Slow growth",
        "email_opens": 4,
        "website_visits": 6,
        "demo_request": 0,
        "converted": 0,
        "stage": "Lead",
    }

    def test_create_success(self, client):
        resp = client.post("/api/leads", json=self.CREATE_PAYLOAD)
        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "Lead created successfully"
        assert data["lead_id"] > 0
        assert data["score"] >= 0

    def test_create_then_fetch(self, client):
        create_resp = client.post("/api/leads", json=self.CREATE_PAYLOAD)
        lid = create_resp.json()["lead_id"]
        fetch_resp = client.get(f"/api/leads/{lid}")
        assert fetch_resp.status_code == 200
        assert fetch_resp.json()["company"] == "NewCo"

    def test_create_logs_initial_activity(self, client):
        resp = client.post("/api/leads", json=self.CREATE_PAYLOAD)
        lid = resp.json()["lead_id"]
        detail = client.get(f"/api/leads/{lid}").json()
        activities = detail["activities"]
        assert any(a["activity"] == "Lead Registered" for a in activities)


class TestUpdateLead:
    def test_update_success(self, client, seed_lead):
        lid = seed_lead
        payload = {
            "company": "Acme Updated",
            "contact_name": "Alice Wonder",
            "designation": "CTO",
            "email": "alice@acme.com",
            "phone": "+1-555-0100",
            "industry": "Technology",
            "employees": 200,
            "revenue": "$50M",
            "location": "San Francisco",
            "funding": "Series C",
            "technology": "AWS, Python, React",
            "pain_point": "Scaling infra costs",
            "email_opens": 15,
            "website_visits": 25,
            "demo_request": 1,
            "converted": 1,
            "stage": "Closed Won",
        }
        resp = client.put(f"/api/leads/{lid}", json=payload)
        assert resp.status_code == 200
        assert resp.json()["score"] == 100  # max score

        # Verify persisted
        detail = client.get(f"/api/leads/{lid}").json()
        assert detail["company"] == "Acme Updated"
        assert detail["stage"] == "Closed Won"

    def test_update_not_found(self, client):
        resp = client.put("/api/leads/999", json={
            "company": "X", "contact_name": "X", "designation": "X",
            "email": "x@x.com", "phone": "X", "industry": "Tech",
            "employees": 10, "revenue": "X", "location": "X",
            "funding": "X", "technology": "X",
        })
        assert resp.status_code == 404


class TestDeleteLead:
    def test_delete_success(self, client, seed_lead):
        lid = seed_lead
        resp = client.delete(f"/api/leads/{lid}")
        assert resp.status_code == 200
        assert resp.json()["message"] == "Lead deleted successfully"

        # Verify gone
        resp = client.get(f"/api/leads/{lid}")
        assert resp.status_code == 404

    def test_delete_not_found(self, client):
        resp = client.delete("/api/leads/999")
        assert resp.status_code == 404


class TestActivityLogging:
    def test_log_call_activity(self, client, seed_lead):
        lid = seed_lead
        resp = client.post(f"/api/leads/{lid}/activities", json={
            "activity": "Log Outgoing Phone Call", "status": "Completed",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["new_score"] is not None
        assert data["stage"] is not None

        # Verify activity appears in detail
        detail = client.get(f"/api/leads/{lid}").json()
        activities = [a["activity"] for a in detail["activities"]]
        assert "Log Outgoing Phone Call" in activities

    def test_activity_side_effects_close_won(self, client, seed_lead):
        lid = seed_lead
        resp = client.post(f"/api/leads/{lid}/activities", json={
            "activity": "Closed Won - Contract Signed", "status": "Completed",
        })
        assert resp.status_code == 200
        assert resp.json()["stage"] == "Closed Won"

    def test_activity_side_effects_demo(self, client, seed_lead):
        lid = seed_lead
        resp = client.post(f"/api/leads/{lid}/activities", json={
            "activity": "Product Demonstration Done", "status": "Completed",
        })
        assert resp.status_code == 200
        # Stage stays at Negotiation because auto-promotion only applies
        # when current stage is Lead or Contacted, not Negotiation.
        assert resp.json()["stage"] == "Negotiation"
        assert resp.json()["new_score"] is not None  # score recalculated

    def test_activity_not_found(self, client):
        resp = client.post("/api/leads/999/activities", json={
            "activity": "Call", "status": "Completed",
        })
        assert resp.status_code == 404
