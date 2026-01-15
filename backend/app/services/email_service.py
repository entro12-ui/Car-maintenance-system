import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)
        self.enabled = os.getenv("EMAIL_ENABLED", "true").lower() == "true"

    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> bool:
        """
        Send an email to the specified recipient.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text email body
            html_body: Optional HTML email body
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        if not self.enabled:
            print(f"[Email Service] Email notifications are disabled. Would send to {to_email}: {subject}")
            return False

        if not self.smtp_username or not self.smtp_password:
            print(f"[Email Service] SMTP credentials not configured. Cannot send email to {to_email}")
            return False

        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["From"] = self.from_email
            msg["To"] = to_email
            msg["Subject"] = subject

            # Add plain text part
            text_part = MIMEText(body, "plain")
            msg.attach(text_part)

            # Add HTML part if provided
            if html_body:
                html_part = MIMEText(html_body, "html")
                msg.attach(html_part)

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            print(f"[Email Service] Email sent successfully to {to_email}")
            return True

        except Exception as e:
            print(f"[Email Service] Failed to send email to {to_email}: {str(e)}")
            return False

    def send_service_reminder(
        self,
        customer_name: str,
        customer_email: str,
        vehicle_make: str,
        vehicle_model: str,
        license_plate: str,
        current_mileage: float,
        next_service_mileage: float,
        mileage_remaining: float
    ) -> bool:
        """
        Send a service reminder email to a customer.
        
        Args:
            customer_name: Customer's full name
            customer_email: Customer's email address
            vehicle_make: Vehicle make
            vehicle_model: Vehicle model
            license_plate: Vehicle license plate
            current_mileage: Current vehicle mileage
            next_service_mileage: Next service mileage
            mileage_remaining: Remaining kilometers until service
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        subject = f"Service Reminder: {vehicle_make} {vehicle_model} ({license_plate})"

        # Plain text body
        body = f"""Dear {customer_name},

This is a reminder that your vehicle is due for service soon.

Vehicle Details:
- Make & Model: {vehicle_make} {vehicle_model}
- License Plate: {license_plate}
- Current Mileage: {current_mileage:,.0f} km
- Next Service Due: {next_service_mileage:,.0f} km
- Remaining: {mileage_remaining:,.0f} km

Please schedule an appointment at your earliest convenience to ensure your vehicle continues to run smoothly.

You can schedule an appointment by logging into your account or contacting us directly.

Thank you for choosing our service!

Best regards,
Car Service Management Team
"""

        # HTML body
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background-color: #4F46E5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }}
        .content {{
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }}
        .vehicle-info {{
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #4F46E5;
        }}
        .info-row {{
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }}
        .info-row:last-child {{
            border-bottom: none;
        }}
        .label {{
            font-weight: bold;
            color: #6b7280;
        }}
        .value {{
            color: #111827;
        }}
        .warning {{
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }}
        .button {{
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }}
        .footer {{
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 20px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Service Reminder</h1>
        </div>
        <div class="content">
            <p>Dear {customer_name},</p>
            
            <p>This is a reminder that your vehicle is due for service soon.</p>
            
            <div class="vehicle-info">
                <h3 style="margin-top: 0;">Vehicle Details</h3>
                <div class="info-row">
                    <span class="label">Make & Model:</span>
                    <span class="value">{vehicle_make} {vehicle_model}</span>
                </div>
                <div class="info-row">
                    <span class="label">License Plate:</span>
                    <span class="value">{license_plate}</span>
                </div>
                <div class="info-row">
                    <span class="label">Current Mileage:</span>
                    <span class="value">{current_mileage:,.0f} km</span>
                </div>
                <div class="info-row">
                    <span class="label">Next Service Due:</span>
                    <span class="value">{next_service_mileage:,.0f} km</span>
                </div>
                <div class="info-row">
                    <span class="label">Remaining:</span>
                    <span class="value" style="color: #DC2626; font-weight: bold;">{mileage_remaining:,.0f} km</span>
                </div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Action Required:</strong> Please schedule an appointment at your earliest convenience to ensure your vehicle continues to run smoothly.
            </div>
            
            <p>You can schedule an appointment by logging into your account or contacting us directly.</p>
            
            <p>Thank you for choosing our service!</p>
            
            <p>Best regards,<br>
            <strong>Car Service Management Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(customer_email, subject, body, html_body)


# Singleton instance
email_service = EmailService()

