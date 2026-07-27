import os
import sqlite3

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
    cursor = conn.cursor()
    cursor.executemany(query, params_list)
    conn.commit()
    conn.close()
