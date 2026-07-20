"""Shared fixtures for the SalesGenie test suite.

Creates a temporary SQLite database, seeds it with known test data,
and provides a FastAPI TestClient connected to the app.
"""

import os
import sys
import tempfile
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

# Ensure the backend directory is on sys.path so imports work
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# ---------------------------------------------------------------------------
# Fixture: temporary database path + monkeypatching
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def test_db(monkeypatch):
    """Create a temporary SQLite DB with the full schema and seed data.

    Monkeypatches ``database.DB_PATH`` so all queries hit the temp file.
    The DB is removed after each test for full isolation.
    """
    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()
    db_path = tmp.name

    # Patch the database module's DB_PATH *before* any other imports use it
    import database
    monkeypatch.setattr(database, "DB_PATH", db_path)

    # Build schema
    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS leads(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT NOT NULL,
            contact_name TEXT NOT NULL,
            designation TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            industry TEXT NOT NULL,
            employees INTEGER NOT NULL,
            revenue TEXT NOT NULL,
            location TEXT NOT NULL,
            funding TEXT NOT NULL,
            technology TEXT NOT NULL,
            score INTEGER DEFAULT 0,
            stage TEXT NOT NULL DEFAULT 'Lead',
            email_opens INTEGER DEFAULT 0,
            website_visits INTEGER DEFAULT 0,
            demo_request INTEGER DEFAULT 0,
            converted INTEGER DEFAULT 0,
            pain_point TEXT
        );

        CREATE TABLE IF NOT EXISTS activities(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id INTEGER,
            date TEXT NOT NULL,
            activity TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
        );
    """)
    conn.commit()
    conn.close()

    yield db_path

    # Cleanup
    os.unlink(db_path)


# ---------------------------------------------------------------------------
# Helper: seed a known lead
# ---------------------------------------------------------------------------

@pytest.fixture
def seed_lead():
    """Insert a single known lead and return its id."""
    import database
    lid = database.execute(
        """INSERT INTO leads (
            company, contact_name, designation, email, phone, industry,
            employees, revenue, location, funding, technology, score,
            stage, email_opens, website_visits, demo_request, converted, pain_point
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            "Acme Corp", "Alice Wonder", "CTO", "alice@acme.com",
            "+1-555-0100", "Technology", 200, "$50M", "San Francisco",
            "Series C", "AWS, Python, React, PostgreSQL", 85,
            "Negotiation", 10, 18, 1, 1, "Scaling infra costs",
        ),
    )
    # Log an activity
    database.execute(
        "INSERT INTO activities (lead_id, date, activity, status) VALUES (?, ?, ?, ?)",
        (lid, datetime.now().strftime("%Y-%m-%d"), "Initial outreach", "Completed"),
    )
    return lid


# ---------------------------------------------------------------------------
# Helper: seed multi-lead set for list / analytics tests
# ---------------------------------------------------------------------------

@pytest.fixture
def seed_multi_leads():
    """Insert 3 varied leads and return their ids."""
    import database
    ids = []

    leads_data = [
        ("TechCorp", "Sarah", "CTO", "sarah@tc.com", "+1-555-0101",
         "Technology", 250, "$50M", "SF", "Series C", "AWS, Python", 92,
         "Closed Won", 12, 20, 1, 1, "Data pipelines"),
        ("HealthInc", "Dr Amit", "Medical Dir", "amit@hi.com", "+1-555-0102",
         "Healthcare", 150, "₹25Cr", "Mumbai", "Series A",
         "Python, Salesforce", 76, "Negotiation", 8, 12, 1, 0,
         "Patient data fragmentation"),
        ("FinanceFlow", "Emily", "VP Finance", "emily@ff.io", "+1-555-0103",
         "Finance", 80, "$10M", "NYC", "Seed", "Azure, React", 45,
         "Lead", 2, 3, 0, 0, "Inefficient reporting"),
    ]

    for row in leads_data:
        lid = database.execute(
            """INSERT INTO leads (
                company, contact_name, designation, email, phone, industry,
                employees, revenue, location, funding, technology, score,
                stage, email_opens, website_visits, demo_request, converted,
                pain_point
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            row,
        )
        database.execute(
            "INSERT INTO activities (lead_id, date, activity, status) VALUES (?, ?, ?, ?)",
            (lid, "2026-07-01", "Website Visit", "Completed"),
        )
        ids.append(lid)

    return ids


# ---------------------------------------------------------------------------
# Fixture: FastAPI TestClient
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    """Return a FastAPI TestClient (no monkeypatching needed — uses test_db)."""
    # Must be imported *after* test_db fixture patch is applied
    from server import app
    with TestClient(app) as c:
        yield c
