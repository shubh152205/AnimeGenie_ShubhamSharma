"""Integration tests for the outreach generation endpoint."""


class TestOutreachGeneration:
    def test_generate_without_data(self, client):
        """Should 404 when the lead doesn't exist."""
        resp = client.post("/api/generate-outreach", json={
            "lead_id": 999,
            "channel": "Email",
            "tone": "Professional",
        })
        assert resp.status_code == 404

    def test_generate_email_professional(self, client, seed_lead):
        lid = seed_lead
        resp = client.post("/api/generate-outreach", json={
            "lead_id": lid,
            "channel": "Email",
            "tone": "Professional",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["channel"] == "Email"
        assert data["tone"] == "Professional"
        assert "Subject:" in data["message"]
        assert "Acme Corp" in data["message"]
        assert "Alice" in data["message"]
        assert data["subject"] is not None

    def test_generate_linkedin_persuasive(self, client, seed_lead):
        lid = seed_lead
        resp = client.post("/api/generate-outreach", json={
            "lead_id": lid,
            "channel": "LinkedIn",
            "tone": "Persuasive",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["channel"] == "LinkedIn"
        assert "Let's connect!" in data["message"]

    def test_generate_whatsapp_friendly(self, client, seed_lead):
        lid = seed_lead
        resp = client.post("/api/generate-outreach", json={
            "lead_id": lid,
            "channel": "WhatsApp",
            "tone": "Friendly",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["channel"] == "WhatsApp"
        assert "🚀" in data["message"]  # WhatsApp emoji

    def test_generate_sms_urgent(self, client, seed_lead):
        lid = seed_lead
        resp = client.post("/api/generate-outreach", json={
            "lead_id": lid,
            "channel": "SMS",
            "tone": "Urgent",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["channel"] == "SMS"
        # SMS should be shorter, text-only
        assert len(data["message"]) < 300

    def test_industry_specific_messaging(self, client, seed_lead):
        """Acme Corp is Technology → should mention TechCorp case study."""
        lid = seed_lead
        resp = client.post("/api/generate-outreach", json={
            "lead_id": lid,
            "channel": "Email",
            "tone": "Professional",
        })
        msg = resp.json()["message"]
        assert "TechCorp" in msg  # technology case study reference

    def test_healthcare_industry_messaging(self, client):
        """Create a Healthcare lead and verify healthcare-specific messaging."""
        import database
        lid = database.execute(
            """INSERT INTO leads (
                company, contact_name, designation, email, phone, industry,
                employees, revenue, location, funding, technology, score,
                stage, email_opens, website_visits, demo_request, converted, pain_point
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                "HealthPlus", "Dr Jane", "Medical Director", "jane@hp.com",
                "+1-555-0300", "Healthcare", 150, "$20M", "Boston",
                "Series A", "Salesforce, AWS", 76,
                "Negotiation", 8, 12, 1, 0, "Patient data issues",
            ),
        )
        resp = client.post("/api/generate-outreach", json={
            "lead_id": lid,
            "channel": "Email",
            "tone": "Professional",
        })
        msg = resp.json()["message"]
        assert "MediLife" in msg  # healthcare case study
        assert "patient" in msg.lower()
