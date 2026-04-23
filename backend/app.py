import os
import sqlite3
import smtplib
from contextlib import closing
from dataclasses import dataclass
from datetime import datetime
from email.message import EmailMessage
from typing import Any, Dict, List, Tuple

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "ideal_lettings.db")


@dataclass
class Config:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    AGENCY_EMAIL: str = os.getenv("AGENCY_EMAIL", "bill-ideallettings@hotmail.com")
    AGENCY_PHONE: str = os.getenv("AGENCY_PHONE", "07738 427425")
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", os.getenv("SMTP_USERNAME", ""))
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Ideal Lettings")
    DASHBOARD_API_KEY: str = os.getenv("DASHBOARD_API_KEY", "123456")


config = Config()
app = Flask(__name__)
app.config["SECRET_KEY"] = config.SECRET_KEY
CORS(app)

PROPERTY = {
    "id": 1,
    "title": "3-Bedroom House for Rent",
    "rent_pcm": 1300,
}


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with closing(get_db_connection()) as conn:
        cur = conn.cursor()

        cur.execute("""
        CREATE TABLE IF NOT EXISTS inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            move_in_date TEXT,
            employment_status TEXT,
            message TEXT,
            property_title TEXT,
            status TEXT DEFAULT 'New',
            created_at TEXT,
            auto_reply_sent INTEGER DEFAULT 0
        )
        """)

        conn.commit()


def send_email(to_email: str, subject: str, body: str) -> Tuple[bool, str]:
    if not config.SMTP_USERNAME or not config.SMTP_PASSWORD or not config.SMTP_FROM_EMAIL:
        return False, "SMTP not configured"

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = config.SMTP_FROM_EMAIL
    msg["To"] = to_email
    msg.set_content(body)

    try:
        with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as server:
            server.starttls()
            server.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
            server.send_message(msg)
        return True, "sent"
    except Exception as exc:
        return False, str(exc)


def require_dashboard_key():
    api_key = request.headers.get("X-API-Key")
    if api_key != config.DASHBOARD_API_KEY:
        return False, (jsonify({"error": "Unauthorized"}), 401)
    return True, None


def validate_inquiry_payload(payload: Dict[str, Any]) -> List[str]:
    errors = []
    for field in ["fullName", "phone", "email"]:
        if not str(payload.get(field, "")).strip():
            errors.append(f"{field} is required")
    return errors


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/inquiries")
def create_inquiry():
    data = request.get_json(silent=True) or {}
    errors = validate_inquiry_payload(data)

    if errors:
        return {"errors": errors}, 400

    created_at = datetime.utcnow().isoformat(timespec="seconds") + "Z"

    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        cur.execute("""
        INSERT INTO inquiries (
            full_name,
            phone,
            email,
            move_in_date,
            employment_status,
            message,
            property_title,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data["fullName"],
            data["phone"],
            data["email"],
            data.get("moveInDate", ""),
            data.get("employmentStatus", ""),
            data.get("message", ""),
            f"{PROPERTY['title']} - £{PROPERTY['rent_pcm']} pcm",
            created_at
        ))
        inquiry_id = cur.lastrowid
        conn.commit()

    customer_sent, customer_result = send_email(
        data["email"],
        "Thanks for your inquiry - Ideal Lettings",
        f"""Hi {data["fullName"]},

Thanks for your interest in our {PROPERTY['title']} at £{PROPERTY['rent_pcm']} per month.

We’ve received your inquiry and a member of the Ideal Lettings team will be in touch shortly.

If you would like to arrange a viewing, just reply to this email or call us on {config.AGENCY_PHONE}.

Kind regards,
Ideal Lettings
{config.AGENCY_EMAIL}
"""
    )

    send_email(
        config.AGENCY_EMAIL,
        f"New inquiry for {PROPERTY['title']}",
        f"""New inquiry received

Name: {data["fullName"]}
Phone: {data["phone"]}
Email: {data["email"]}
Move-in date: {data.get("moveInDate", "Not provided")}
Employment status: {data.get("employmentStatus", "Not provided")}
Message: {data.get("message", "No message")}
"""
    )

    if customer_sent:
        with closing(get_db_connection()) as conn:
            conn.execute(
                "UPDATE inquiries SET auto_reply_sent = 1 WHERE id = ?",
                (inquiry_id,)
            )
            conn.commit()

    return {
        "success": True,
        "inquiryId": inquiry_id,
        "autoReplySent": customer_sent,
        "autoReplyStatus": customer_result
    }


@app.get("/api/dashboard/inquiries")
def get_inquiries():
    ok, error = require_dashboard_key()
    if not ok:
        return error

    with closing(get_db_connection()) as conn:
        rows = conn.execute("""
        SELECT
            id,
            full_name,
            phone,
            email,
            move_in_date,
            employment_status,
            message,
            property_title,
            status,
            created_at,
            auto_reply_sent
        FROM inquiries
        ORDER BY id DESC
        """).fetchall()

    return {"inquiries": [dict(r) for r in rows]}


if __name__ == "__main__":
    init_db()
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)