import logging
from typing import List, Optional
import resend
from app.config import settings

logger = logging.getLogger("email_service")

if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

def send_status_update_email(
    to_email: str,
    resident_name: str,
    complaint_id: int,
    complaint_title: str,
    old_status: str,
    new_status: str,
    note: Optional[str] = None
) -> bool:
    """Send an email to resident when their complaint status updates."""
    status_color = "#3b82f6" if new_status == "In Progress" else ("#10b981" if new_status == "Resolved" else "#f59e0b")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; }}
            .header {{ border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 24px; }}
            .title {{ font-size: 20px; font-weight: 700; color: #38bdf8; margin: 0; }}
            .badge {{ display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 600; background-color: {status_color}; color: #ffffff; margin: 12px 0; }}
            .card {{ background: #0f172a; border-radius: 8px; padding: 18px; margin: 16px 0; border: 1px solid #334155; }}
            .note-box {{ background: #1e293b; border-left: 4px solid #38bdf8; padding: 12px 16px; margin-top: 12px; border-radius: 4px; font-style: italic; }}
            .footer {{ margin-top: 28px; font-size: 12px; color: #94a3b8; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="title">🏢 Society Maintenance Update</h1>
            </div>
            <p>Hello <strong>{resident_name}</strong>,</p>
            <p>The status of your maintenance complaint has been updated by the society administration.</p>
            
            <div class="card">
                <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Complaint #{complaint_id}</div>
                <h3 style="margin: 6px 0 12px 0; color: #f8fafc;">{complaint_title}</h3>
                <div>
                    <span style="color: #94a3b8; font-size: 14px;">Status Transition:</span>
                    <span style="color: #cbd5e1; font-weight: 500;"> {old_status} &rarr; </span>
                    <span class="badge">{new_status}</span>
                </div>
                {f'<div class="note-box"><strong>Admin Note:</strong> "{note}"</div>' if note else ''}
            </div>

            <p style="color: #cbd5e1; font-size: 14px;">
                You can log in to your society portal to review complete history and updates.
            </p>

            <div class="footer">
                This is an automated notification from your Society Maintenance Management System.
            </div>
        </div>
    </body>
    </html>
    """

    if not settings.RESEND_API_KEY:
        logger.info(f"[EMAIL SIMULATION] Status change for complaint #{complaint_id} ({old_status} -> {new_status}) to {to_email}")
        return True

    try:
        params = {
            "from": settings.FROM_EMAIL,
            "to": [to_email],
            "subject": f"Complaint #{complaint_id} Status Updated: {new_status}",
            "html": html_content,
        }
        resend.Emails.send(params)
        logger.info(f"Status update email sent to {to_email} for complaint #{complaint_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to send status update email to {to_email}: {str(e)}")
        return False

def send_important_notice_email(
    to_emails: List[str],
    notice_title: str,
    notice_content: str,
    author_name: str
) -> bool:
    """Broadcast email to residents when an important notice is posted."""
    if not to_emails:
        return True

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #dc2626; }}
            .header {{ border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 24px; }}
            .badge {{ display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; background-color: #ef4444; color: #ffffff; text-transform: uppercase; margin-bottom: 8px; }}
            .title {{ font-size: 22px; font-weight: 700; color: #f8fafc; margin: 8px 0 0 0; }}
            .content-box {{ background: #0f172a; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #334155; white-space: pre-wrap; line-height: 1.6; color: #e2e8f0; }}
            .footer {{ margin-top: 28px; font-size: 12px; color: #94a3b8; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <span class="badge">🚨 Important Society Notice</span>
                <h1 class="title">{notice_title}</h1>
                <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Posted by {author_name} (Management Office)</div>
            </div>

            <div class="content-box">{notice_content}</div>

            <p style="color: #cbd5e1; font-size: 14px;">
                Please refer to the Society Notice Board for further announcements and discussions.
            </p>

            <div class="footer">
                Official Society Notice Board broadcast. Please do not reply directly to this email.
            </div>
        </div>
    </body>
    </html>
    """

    if not settings.RESEND_API_KEY:
        logger.info(f"[EMAIL SIMULATION] Broadcast important notice '{notice_title}' to {len(to_emails)} residents")
        return True

    try:
        # Resend supports batching or single calls
        for email in to_emails:
            params = {
                "from": settings.FROM_EMAIL,
                "to": [email],
                "subject": f"🚨 IMPORTANT NOTICE: {notice_title}",
                "html": html_content,
            }
            resend.Emails.send(params)
        logger.info(f"Important notice broadcast sent to {len(to_emails)} residents")
        return True
    except Exception as e:
        logger.error(f"Failed to broadcast important notice: {str(e)}")
        return False
