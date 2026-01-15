from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app.database import get_db
from app.models.service import Appointment
from app.models.service import Service
from app.models.vehicle import Vehicle
from app.models.part import PartInventory
from app.models.notification import Notification

router = APIRouter()

@router.get("/")
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()
    
    # Today's appointments
    today_appointments = db.query(Appointment).filter(
        Appointment.scheduled_date == today
    ).count()
    
    completed_today = db.query(Appointment).filter(
        Appointment.scheduled_date == today,
        Appointment.status == "Completed"
    ).count()
    
    # Today's revenue
    today_revenue = db.query(func.sum(Service.grand_total)).filter(
        Service.service_date == today
    ).scalar() or 0
    
    # Customers served today
    customers_served = db.query(func.count(func.distinct(Vehicle.customer_id))).join(Service).filter(
        Service.service_date == today
    ).scalar() or 0
    
    # Notifications sent today
    notifications_sent = db.query(Notification).filter(
        func.date(Notification.created_at) == today,
        Notification.status == "Sent"
    ).count()
    
    # Low stock items
    low_stock_items = db.query(PartInventory).filter(
        PartInventory.stock_quantity <= PartInventory.min_stock_level,
        PartInventory.is_active == True
    ).count()
    
    return {
        "report_date": str(today),
        "today_appointments": today_appointments,
        "completed_today": completed_today,
        "today_revenue": float(today_revenue),
        "customers_served_today": customers_served,
        "notifications_sent": notifications_sent,
        "low_stock_items": low_stock_items
    }

