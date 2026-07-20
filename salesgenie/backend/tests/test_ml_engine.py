"""Tests for the ML engine module — pure functions that don't need the DB."""

import sys
import os

# ensure backend is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from ml_engine import (
    calculate_rule_score,
    get_category,
    get_next_action,
    get_tech_alignment,
    get_decision_maker_info,
)


# ---------------------------------------------------------------------------
# calculate_rule_score
# ---------------------------------------------------------------------------

class TestCalculateRuleScore:
    def test_high_employees_tech_industry(self):
        """200+ employees + technology → size=25, industry=22 → already 47 before visits/opens."""
        score = calculate_rule_score(200, "Technology", 18, 12, 1)
        # 25 + 22 + 18 + 15 + 20 = 100
        assert score == 100

    def test_mid_range(self):
        """100 employees, finance, mid visits/opens → predictable score."""
        score = calculate_rule_score(100, "Finance", 10, 6, 0)
        # 20 + 22 + 14 + 11 + 0 = 67
        assert score == 67

    def test_low_end(self):
        """Minimal inputs → lowest score."""
        score = calculate_rule_score(10, "Other", 1, 0, 0)
        # 10 + 12 + 5 + 3 + 0 = 30
        assert score == 30

    def test_healthcare_industry_scoring(self):
        """Healthcare gets 18 industry points."""
        score = calculate_rule_score(60, "Healthcare", 4, 2, 0)
        # 15 + 18 + 10 + 7 + 0 = 50
        assert score == 50

    def test_demo_request_bonus(self):
        """demo_request=1 adds 20 points."""
        score_with = calculate_rule_score(50, "Retail", 4, 2, 1)
        score_without = calculate_rule_score(50, "Retail", 4, 2, 0)
        assert score_with - score_without == 20


# ---------------------------------------------------------------------------
# get_category
# ---------------------------------------------------------------------------

class TestGetCategory:
    def test_hot_lead(self):
        assert get_category(85) == "Hot Lead"
        assert get_category(81) == "Hot Lead"

    def test_warm_lead(self):
        assert get_category(70) == "Warm Lead"
        assert get_category(61) == "Warm Lead"

    def test_cold_lead(self):
        assert get_category(50) == "Cold Lead"
        assert get_category(41) == "Cold Lead"

    def test_low_priority(self):
        assert get_category(30) == "Low Priority"
        assert get_category(0) == "Low Priority"


# ---------------------------------------------------------------------------
# get_next_action
# ---------------------------------------------------------------------------

class TestGetNextAction:
    def test_high_score(self):
        action = get_next_action(85)
        assert "live product demonstration" in action
        assert "contract" in action

    def test_medium_score(self):
        action = get_next_action(65)
        assert "personalized proposal" in action
        assert "ROI" in action

    def test_low_score(self):
        action = get_next_action(30)
        assert "Nurture" in action or "newsletter" in action


# ---------------------------------------------------------------------------
# get_tech_alignment
# ---------------------------------------------------------------------------

class TestGetTechAlignment:
    def test_full_match(self):
        result = get_tech_alignment("AWS, Python, React, PostgreSQL, Salesforce, Kubernetes")
        assert result["score"] == 100
        assert len(result["matched"]) == 6

    def test_partial_match(self):
        result = get_tech_alignment("AWS, Python, Java, Docker")
        assert 30 <= result["score"] <= 35  # 2/6 ≈ 33%
        assert sorted(result["matched"]) == ["AWS", "Python"]

    def test_no_match(self):
        result = get_tech_alignment("Java, Docker, Go, Rust")
        assert result["score"] == 0
        assert result["matched"] == []

    def test_empty_string(self):
        result = get_tech_alignment("")
        assert result["score"] == 0
        assert result["matched"] == []

    def test_none_string(self):
        result = get_tech_alignment(None)
        assert result["score"] == 0
        assert result["matched"] == []


# ---------------------------------------------------------------------------
# get_decision_maker_info
# ---------------------------------------------------------------------------

class TestGetDecisionMakerInfo:
    def test_cto(self):
        assert "Technical" in get_decision_maker_info("CTO")

    def test_cfo(self):
        assert "Financial" in get_decision_maker_info("CFO")

    def test_ceo(self):
        assert "Executive" in get_decision_maker_info("CEO")

    def test_founder(self):
        assert "Executive" in get_decision_maker_info("Co-Founder")

    def test_manager_fallthrough(self):
        assert "Business" in get_decision_maker_info("Operations Manager")
