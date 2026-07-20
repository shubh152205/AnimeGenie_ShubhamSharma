"""Integration tests for the analytics endpoint."""

import pytest


class TestAnalytics:
    def test_empty_db(self, client):
        resp = client.get("/api/analytics")
        assert resp.status_code == 200
        data = resp.json()
        assert data["summary"]["total_leads"] == 0
        assert data["summary"]["avg_score"] == 0.0
        assert data["summary"]["hot_leads"] == 0
        assert data["summary"]["closed_won"] == 0
        assert data["summary"]["conversion_rate"] == 0.0
        assert data["stages"] == []
        assert data["industries"] == []
        assert data["locations"] == []
        assert data["scatter_data"] == []
        assert data["industry_conversion"] == []

    def test_with_data(self, client, seed_multi_leads):
        resp = client.get("/api/analytics")
        assert resp.status_code == 200
        data = resp.json()
        s = data["summary"]

        assert s["total_leads"] == 3
        assert s["avg_score"] == pytest.approx(71.0, abs=0.5)  # (92+76+45)/3

        assert s["hot_leads"] == 1    # TechCorp 92
        assert s["closed_won"] == 1   # TechCorp
        assert s["conversion_rate"] == pytest.approx(33.3, abs=0.5)

        # Stage distribution
        stages = {r["stage"]: r["count"] for r in data["stages"]}
        assert stages["Closed Won"] == 1
        assert stages["Negotiation"] == 1
        assert stages["Lead"] == 1

        # Industry distribution
        ind = {r["industry"]: r["count"] for r in data["industries"]}
        assert ind["Technology"] == 1
        assert ind["Healthcare"] == 1
        assert ind["Finance"] == 1

        # Locations
        locs = {r["location"]: r for r in data["locations"]}
        assert locs["SF"]["avg_score"] == 92.0
        assert locs["Mumbai"]["count"] == 1

        # Scatter data
        assert len(data["scatter_data"]) == 3
        companies = [r["company"] for r in data["scatter_data"]]
        assert "TechCorp" in companies

        # Industry conversion
        conv = {r["industry"]: r["conversion_rate"] for r in data["industry_conversion"]}
        assert conv["Technology"] == 100.0  # 1/1 won
        assert conv["Healthcare"] == 0.0
        assert conv["Finance"] == 0.0
