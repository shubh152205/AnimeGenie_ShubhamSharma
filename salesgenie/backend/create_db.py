import sqlite3
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(backend_dir, "sales.db")

# Delete existing DB if it exists to start fresh
if os.path.exists(db_path):
    os.remove(db_path)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create leads table
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

# Create activities table
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

mock_leads = [
    (
        "TechCorp Solutions", "John Doe", "IT Director", "john.doe@techcorp.com", "+1-555-0101",
        "Technology", 520, "$45M", "San Francisco", "Series B", "React, Node.js, AWS, PostgreSQL",
        85, "Negotiation", 8, 14, 1, 0, "Legacy infrastructure scaling issues and high cloud hosting costs."
    ),
    (
        "MediLife Care", "Priya Sharma", "IT Director", "priya.sharma@medilifecare.com", "+1-555-0102",
        "Healthcare", 1200, "$110M", "Boston", "Series C", "Angular, Spring Boot, Oracle, GCP",
        78, "Proposal Sent", 5, 9, 1, 0, "Patient data privacy compliance and legacy EHR integration."
    ),
    (
        "EduSmart Academy", "Sarah Jenkins", "CTO", "sarah.j@edusmart.edu", "+1-555-0103",
        "Education", 80, "$5M", "Austin", "Seed", "PHP, Laravel, MySQL, Heroku",
        42, "Lead", 2, 3, 0, 0, "Student portal latency and lack of mobile app integration."
    ),
    (
        "SecureBank Corp", "Robert Chen", "VP Information Security", "r.chen@securebank.com", "+1-555-0104",
        "Finance", 4500, "$380M", "New York", "Late Stage", "React, C#, .NET Core, Azure, MSSQL",
        92, "Closed Won", 15, 28, 1, 1, "Real-time fraud detection speed and security compliance audits."
    ),
    (
        "HealthCare Plus", "Emily Davis", "VP Procurement", "emily.davis@healthcareplus.org", "+1-555-0105",
        "Healthcare", 650, "$55M", "Chicago", "Series A", "Vue, Python, Django, AWS, PostgreSQL",
        64, "Contacted", 4, 6, 0, 0, "Inefficient patient scheduling systems and long response times."
    ),
    (
        "CloudScale Inc", "Michael Brown", "CTO", "m.brown@cloudscale.io", "+1-555-0106",
        "Technology", 150, "$18M", "Seattle", "Series A", "React, Go, Kubernetes, AWS, DynamoDB",
        52, "Contacted", 3, 5, 0, 0, "Cloud cost optimization and Kubernetes cluster orchestration."
    ),
    (
        "RetailGenius", "Jessica Taylor", "VP Operations", "jtaylor@retailgenius.com", "+1-555-0107",
        "Retail", 350, "$25M", "Denver", "Series B", "React, Ruby on Rails, AWS, Redshift",
        71, "Proposal Sent", 7, 11, 1, 0, "Real-time inventory tracking across multiple warehouses."
    ),
    (
        "GlobalLogistics", "David Wilson", "Director of Operations", "d.wilson@globallogistics.com", "+1-555-0108",
        "Logistics", 2800, "$220M", "Miami", "Public", "Angular, Java, AWS, Oracle",
        60, "Lead", 3, 4, 0, 0, "Fleet tracking delay and route optimization inefficiencies."
    ),
    (
        "BioHealth Labs", "Lisa Anderson", "Chief Medical Officer", "l.anderson@biohealth.com", "+1-555-0109",
        "Healthcare", 180, "$30M", "Los Angeles", "Series B", "React, Python, FastAPI, AWS, PostgreSQL",
        68, "Negotiation", 6, 10, 1, 0, "Lab test workflow scheduling bottlenecks and HIPAA compliance."
    ),
    (
        "FinTech Frontier", "James Thomas", "VP Finance", "jthomas@fintechfrontier.com", "+1-555-0110",
        "Finance", 410, "$35M", "Atlanta", "Series B", "React, Java, GCP, PostgreSQL",
        75, "Contacted", 5, 8, 0, 0, "Speed of multi-currency cross-border transactions and AML compliance."
    )
]

cursor.executemany("""
INSERT INTO leads (
    company, contact_name, designation, email, phone, industry,
    employees, revenue, location, funding, technology, score,
    stage, email_opens, website_visits, demo_request, converted, pain_point
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", mock_leads)

activities_list = []
for lead_id in range(1, 11):
    activities_list.extend([
        (lead_id, "2026-07-15", "Outbound Email Sent", "Completed"),
        (lead_id, "2026-07-16", "Email Link Clicked", "Completed"),
        (lead_id, "2026-07-17", "Introductory Phone Call", "Completed")
    ])

cursor.executemany("INSERT INTO activities (lead_id, date, activity, status) VALUES (?, ?, ?, ?)", activities_list)

conn.commit()
conn.close()
print("Database sales.db created and populated successfully with B2B CRM leads!")
