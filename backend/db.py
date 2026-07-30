import sqlite3
import os
import json
from datetime import datetime

DB_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
DB_PATH = os.path.join(DB_DIR, 'meetings.db')


def get_conn():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS meetings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            transcript TEXT,
            summary TEXT,
            decisions TEXT,
            actions TEXT,
            timeline TEXT,
            created_at TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


def save_meeting(filename, transcript, summary='', decisions='', actions='', timeline=''):
    conn = get_conn()
    now = datetime.now().isoformat()
    cursor = conn.execute(
        'INSERT INTO meetings (filename, transcript, summary, decisions, actions, timeline, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        (filename, transcript, summary, decisions, actions, timeline, now)
    )
    meeting_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return meeting_id


def get_meetings():
    conn = get_conn()
    rows = conn.execute('SELECT * FROM meetings ORDER BY created_at DESC').fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_meeting(meeting_id):
    conn = get_conn()
    row = conn.execute('SELECT * FROM meetings WHERE id = ?', (meeting_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def update_meeting(meeting_id, **kwargs):
    conn = get_conn()
    sets = ', '.join(f'{k} = ?' for k in kwargs)
    values = list(kwargs.values()) + [meeting_id]
    conn.execute(f'UPDATE meetings SET {sets} WHERE id = ?', values)
    conn.commit()
    conn.close()


def delete_meeting(meeting_id):
    conn = get_conn()
    conn.execute('DELETE FROM meetings WHERE id = ?', (meeting_id,))
    conn.commit()
    conn.close()
