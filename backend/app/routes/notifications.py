from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.notification import Notification
from app.auth import get_current_admin
from app.services.notification_service import check_and_send_service_reminders

router = APIRouter()

@router.get("/")
def get_notifications(
    customer_id: int = None,
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if customer_id:
        query = query.filter(Notification.customer_id == customer_id)
    if status:
        query = query.filter(Notification.status == status)
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "notification_id": n.notification_id,
            "customer_id": n.customer_id,
            "vehicle_id": n.vehicle_id,
            "notification_type": n.notification_type,
            "subject": n.subject,
            "message": n.message,
            "status": n.status,
            "channel": n.channel,
            "sent_at": n.sent_at,
            "created_at": n.created_at,
        }
        for n in notifications
    ]

@router.get("/pending")
def get_pending_notifications(db: Session = Depends(get_db)):
    from datetime import datetime
    notifications = db.query(Notification).filter(
        Notification.status == "Pending"
    ).filter(
        (Notification.scheduled_for.is_(None)) | (Notification.scheduled_for <= datetime.now())
    ).limit(100).all()
    
    return [
        {
            "notification_id": n.notification_id,
            "customer_id": n.customer_id,
            "customer_email": n.customer.email,
            "customer_phone": n.customer.phone,
            "notification_type": n.notification_type,
            "subject": n.subject,
            "message": n.message,
            "channel": n.channel,
        }
        for n in notifications
    ]

@router.post("/send-reminders")
def send_service_reminders(
    background_tasks: BackgroundTasks,
    days_before: int = 3,
    mileage_threshold: float = 500,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Manually trigger service reminder notifications (Admin only).
    This can also be called by a scheduled task.
    """
    try:
        stats = check_and_send_service_reminders(db, days_before, mileage_threshold)
        return {
            "message": "Service reminders processed",
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending reminders: {str(e)}")

@router.get("/customer/{customer_id}")
def get_customer_notifications(
    customer_id: int,
    db: Session = Depends(get_db)
):
    """Get notifications for a specific customer"""
    notifications = db.query(Notification).filter(
        Notification.customer_id == customer_id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    
    return [
        {
            "notification_id": n.notification_id,
            "notification_type": n.notification_type,
            "subject": n.subject,
            "message": n.message,
            "status": n.status,
            "sent_at": n.sent_at,
            "created_at": n.created_at,
        }
        for n in notifications
    ]
