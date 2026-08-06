import os
import sqlite3
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BACKEND_DIR, "sales.db")


def init_db():
    """Ensure all required tables (leads, activities, users) exist in SQLite DB."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
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
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activities(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER,
        date TEXT NOT NULL,
        activity TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'Sales Rep',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS meetings(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id INTEGER UNIQUE,
        lead_id INTEGER,
        transcript TEXT,
        summary TEXT,
        sentiment TEXT
    )
    """)
    # Seed default leads if table is empty
    cursor.execute("SELECT COUNT(*) FROM leads")
    count = cursor.fetchone()[0]
    if count == 0:
        mock_leads = [
            ("TechCorp Solutions", "John Doe", "IT Director", "john.doe@techcorp.com", "+1-555-0101", "Technology", 520, "$45M", "San Francisco", "Series B", "React, Node.js, AWS, PostgreSQL", 85, "Negotiation", 8, 14, 1, 0, "Legacy infrastructure scaling issues and high cloud hosting costs."),
            ("MediLife Care", "Priya Sharma", "IT Director", "priya.sharma@medilifecare.com", "+1-555-0102", "Healthcare", 1200, "$110M", "Boston", "Series C", "Angular, Spring Boot, Oracle, GCP", 78, "Proposal Sent", 5, 9, 1, 0, "Patient data privacy compliance and legacy EHR integration."),
            ("EduSmart Academy", "Sarah Jenkins", "CTO", "sarah.j@edusmart.edu", "+1-555-0103", "Education", 80, "$5M", "Austin", "Seed", "PHP, Laravel, MySQL, Heroku", 42, "Lead", 2, 3, 0, 0, "Student portal latency and lack of mobile app integration."),
            ("SecureBank Corp", "Robert Chen", "VP Information Security", "r.chen@securebank.com", "+1-555-0104", "Finance", 4500, "$380M", "New York", "Late Stage", "React, C#, .NET Core, Azure, MSSQL", 92, "Closed Won", 15, 28, 1, 1, "Real-time fraud detection speed and security compliance audits."),
            ("HealthCare Plus", "Emily Davis", "VP Procurement", "emily.davis@healthcareplus.org", "+1-555-0105", "Healthcare", 650, "$55M", "Chicago", "Series A", "Vue, Python, Django, AWS, PostgreSQL", 64, "Contacted", 4, 6, 0, 0, "Inefficient patient scheduling systems and long response times.")
        ]
        cursor.executemany("""
        INSERT INTO leads (company, contact_name, designation, email, phone, industry, employees, revenue, location, funding, technology, score, stage, email_opens, website_visits, demo_request, converted, pain_point)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, mock_leads)

    # Seed activities if empty (Milestone 3 — CRM Activity Log)
    cursor.execute("SELECT COUNT(*) FROM activities")
    act_count = cursor.fetchone()[0]
    if act_count == 0:
        seed_activities = [
            (1, "2026-07-28", "Initial outreach email sent and opened", "Completed"),
            (1, "2026-07-29", "Discovery call completed (45 min)", "Completed"),
            (4, "2026-07-29", "Demo scheduled for Aug 1 at 2:00 PM", "Scheduled"),
            (1, "2026-07-30", "Follow-up email opened by Sarah", "Completed"),
            (2, "2026-07-30", "Technical team very interested in API capabilities", "Note Added"),
            (4, "2026-07-27", "Contract draft sent for review", "Completed"),
            (5, "2026-07-29", "Added to nurture email campaign", "Completed"),
            (3, "2026-07-30", "Product brochure downloaded from website", "Completed"),
        ]
        cursor.executemany(
            "INSERT INTO activities (lead_id, date, activity, status) VALUES (?, ?, ?, ?)",
            seed_activities,
        )

    # Seed a sample meeting in meetings table (Milestone 3 — Conversation Intelligence)
    cursor.execute("SELECT COUNT(*) FROM meetings")
    mtg_count = cursor.fetchone()[0]
    if mtg_count == 0:
        cursor.execute(
            """INSERT INTO meetings (meeting_id, lead_id, transcript, summary, sentiment)
               VALUES (?, ?, ?, ?, ?)""",
            (
                1001,
                1,
                "Customer is interested in purchasing our AI analytics platform. They discussed data processing bottlenecks affecting customer experience. Need for real-time analytics and reporting capabilities. Budget approved for Q3 technology infrastructure upgrade. Competitive evaluation in progress with 2 other vendors. Requested pricing details. Follow-up next Tuesday.",
                "Customer expressed strong interest in AI analytics platform. Budget approved for Q3. Competitive evaluation with 2 vendors in progress. Follow-up scheduled for next Tuesday.",
                "Positive - High Intent",
            ),
        )

    # Seed default admin user (password: admin123)
    from hashlib import pbkdf2_hmac
    default_salt = b"salesgenie_salt_2026"
    default_pwd_hash = pbkdf2_hmac("sha256", "admin123".encode("utf-8"), default_salt, 100000).hex()
    cursor.execute(
        "INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
        ("admin", "admin@salesgenie.ai", default_pwd_hash, "Administrator")
    )

    conn.commit()
    conn.close()

init_db()


def get_connection(row_factory: bool = False) -> sqlite3.Connection:
    """Get a SQLite connection to the sales database."""
    conn = sqlite3.connect(DB_PATH)
    if row_factory:
        conn.row_factory = sqlite3.Row
    return conn



def fetchone(query: str, params: tuple = ()): # -> Optional[sqlite3.Row]:
    """Execute a query and return a single row (with Row factory)."""
    conn = get_connection(row_factory=True)
    cursor = conn.cursor()
    cursor.execute(query, params)
    row = cursor.fetchone()
    conn.close()
    return row


def fetchall(query: str, params: tuple = ()): # -> list[sqlite3.Row]:
    """Execute a query and return all rows (with Row factory)."""
    conn = get_connection(row_factory=True)
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return rows


def execute(query: str, params: tuple = ()) -> int:
    """Execute an INSERT/UPDATE/DELETE and return lastrowid."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id


def executemany(query: str, params_list: list):
    """Execute a query for multiple parameter sets."""
    conn = get_connection()
    cursor.executemany(query, params_list)
    conn.commit()
    conn.close()

# ---------------------------------------------------------
# SQLAlchemy Integration (Milestone 3)
# ---------------------------------------------------------

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    company = Column(String)
    status = Column(String)

class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, unique=True, index=True)
    lead_id = Column(Integer)
    transcript = Column(String)
    summary = Column(String)
    sentiment = Column(String)

# Create tables for SQLAlchemy models if they don't exist
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
