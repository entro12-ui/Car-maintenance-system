from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from typing import List
from app.models.customer import Customer
from app.models.vehicle import Vehicle
from app.models.service import Service, ServiceType
from app.models.notification import Notification
from app.services.email_service import email_service

def check_and_send_service_reminders(db: Session, days_before: int = 3, mileage_threshold: float = 500) -> dict:
    """
    Check for vehicles due for service and send email notifications.
    
    Args:
        db: Database session
        days_before: Number of days before service to send reminder (default: 3)
        mileage_threshold: Mileage threshold in km to consider service due (default: 500)
        
    Returns:
        Dictionary with statistics about notifications sent
    """
    stats = {
        "checked": 0,
        "due": 0,
        "emails_sent": 0,
        "emails_failed": 0,
        "notifications_created": 0
    }

    try:
        # Get all active customers with vehicles
        customers = db.query(Customer).filter(Customer.is_active == True).all()
        
        for customer in customers:
            # Get all vehicles for this customer
            vehicles = db.query(Vehicle).filter(Vehicle.customer_id == customer.customer_id).all()
            
            for vehicle in vehicles:
                stats["checked"] += 1
                
                # Check if vehicle is due for service
                is_due = False
                mileage_remaining = float(vehicle.next_service_mileage) - float(vehicle.current_mileage)
                
                # Check mileage-based due
                if mileage_remaining <= mileage_threshold:
                    is_due = True
                
                # Check time-based due
                last_service = db.query(Service).filter(
                    Service.vehicle_id == vehicle.vehicle_id
                ).order_by(Service.service_date.desc()).first()
                
                if last_service and last_service.service_type_id:
                    service_type = db.query(ServiceType).filter(
                        ServiceType.service_type_id == last_service.service_type_id
                    ).first()
                    
                    if service_type and service_type.time_interval_months:
                        # Calculate next service date based on last service
                        next_service_date = last_service.service_date + timedelta(
                            days=service_type.time_interval_months * 30
                        )
                        days_until_service = (next_service_date - date.today()).days
                        
                        if days_until_service <= days_before and days_until_service >= 0:
                            is_due = True
                
                if is_due:
                    stats["due"] += 1
                    
                    # Check if we already sent a notification recently (within last 7 days)
                    recent_notification = db.query(Notification).filter(
                        Notification.customer_id == customer.customer_id,
                        Notification.vehicle_id == vehicle.vehicle_id,
                        Notification.notification_type == "Service Reminder",
                        Notification.created_at >= datetime.now() - timedelta(days=7)
                    ).first()
                    
                    if not recent_notification:
                        # Create notification record
                        notification = Notification(
                            customer_id=customer.customer_id,
                            vehicle_id=vehicle.vehicle_id,
                            notification_type="Service Reminder",
                            channel="Email",
                            subject=f"Service Reminder: {vehicle.make} {vehicle.model} ({vehicle.license_plate})",
                            message=f"Your vehicle {vehicle.make} {vehicle.model} ({vehicle.license_plate}) is due for service. Current mileage: {vehicle.current_mileage:,.0f} km, Next service: {vehicle.next_service_mileage:,.0f} km.",
                            status="Pending",
                            scheduled_for=datetime.now()
                        )
                        db.add(notification)
                        stats["notifications_created"] += 1
                        
                        # Send email
                        customer_name = f"{customer.first_name} {customer.last_name}"
                        email_sent = email_service.send_service_reminder(
                            customer_name=customer_name,
                            customer_email=customer.email,
                            vehicle_make=vehicle.make,
                            vehicle_model=vehicle.model,
                            license_plate=vehicle.license_plate,
                            current_mileage=float(vehicle.current_mileage),
                            next_service_mileage=float(vehicle.next_service_mileage),
                            mileage_remaining=mileage_remaining
                        )
                        
                        if email_sent:
                            notification.status = "Sent"
                            notification.sent_at = datetime.now()
                            stats["emails_sent"] += 1
                        else:
                            notification.status = "Failed"
                            stats["emails_failed"] += 1
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        print(f"[Notification Service] Error checking service reminders: {str(e)}")
        stats["error"] = str(e)
    
    return stats

def send_service_reminders_batch(db: Session) -> dict:
    """
    Process pending notifications and send emails.
    This can be called by a scheduled task.
    """
    return check_and_send_service_reminders(db)

