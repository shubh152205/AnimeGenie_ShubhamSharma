import os
import sqlite3

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BACKEND_DIR, "sales.db")


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
