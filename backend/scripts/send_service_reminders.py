#!/usr/bin/env python3
"""
Script to send service reminder emails to customers.
This can be run as a scheduled task (cron job) to check and send reminders daily.

Usage:
    python scripts/send_service_reminders.py

Environment variables required:
    - SMTP_SERVER: SMTP server address (default: smtp.gmail.com)
    - SMTP_PORT: SMTP server port (default: 587)
    - SMTP_USERNAME: SMTP username/email
    - SMTP_PASSWORD: SMTP password or app password
    - FROM_EMAIL: Email address to send from (default: SMTP_USERNAME)
    - EMAIL_ENABLED: Enable/disable email sending (default: true)
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.services.notification_service import check_and_send_service_reminders

def main():
    """Main function to send service reminders"""
    db = SessionLocal()
    try:
        print("=" * 60)
        print("Service Reminder Notification System")
        print("=" * 60)
        print()
        
        stats = check_and_send_service_reminders(db)
        
        print("Notification Statistics:")
        print(f"  - Vehicles checked: {stats.get('checked', 0)}")
        print(f"  - Vehicles due for service: {stats.get('due', 0)}")
        print(f"  - Notifications created: {stats.get('notifications_created', 0)}")
        print(f"  - Emails sent successfully: {stats.get('emails_sent', 0)}")
        print(f"  - Emails failed: {stats.get('emails_failed', 0)}")
        
        if 'error' in stats:
            print(f"  - Error: {stats['error']}")
        
        print()
        print("=" * 60)
        print("Process completed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()

