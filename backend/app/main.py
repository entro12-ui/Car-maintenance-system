from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import (
    customers, vehicles, appointments, services, 
    service_types, parts, loyalty, notifications, 
    employees, dashboard, reports, auth, customer_dashboard, admin_customers, accountant, proformas, job_orders, job_order_inventory, job_order_customer_notifications, job_order_notice_types, job_order_labor, job_order_additional_charges, job_order_sublet_orders, garage_invoices, settings, gl, enterprise_admin, company_setup, gl_account_setup, job_type_access
)

import os
from app.env import load_backend_env

load_backend_env()

# Create tables (only if database connection is available)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not connect to database: {e}")
    print("Please ensure PostgreSQL is running and database is configured correctly.")

app = FastAPI(
    title="Car Service Management API",
    description="Complete Car Service Management System API",
    version="1.0.0"
)

# CORS middleware
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,https://car-service-frontend.onrender.com,https://car-maintenance-system.onrender.com")
# Clean up origins (remove whitespace and filter empty strings)
cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods including OPTIONS
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(vehicles.router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(service_types.router, prefix="/api/service-types", tags=["Service Types"])
app.include_router(parts.router, prefix="/api/parts", tags=["Parts"])
app.include_router(loyalty.router, prefix="/api/loyalty", tags=["Loyalty"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(customer_dashboard.router, prefix="/api/customer", tags=["Customer Dashboard"])
app.include_router(admin_customers.router, prefix="/api/admin/customers", tags=["Admin Customer Management"])
app.include_router(accountant.router, prefix="/api/accountant", tags=["Accountant"])
app.include_router(proformas.router, prefix="/api", tags=["Proformas"])
app.include_router(job_orders.router, prefix="/api/job-orders", tags=["Job Orders"])
app.include_router(job_order_inventory.router, prefix="/api/job-orders", tags=["Job Orders"])
app.include_router(job_order_customer_notifications.router, prefix="/api/job-orders", tags=["Job Orders"])
app.include_router(job_order_notice_types.router, prefix="/api/job-orders", tags=["Job Orders"])
app.include_router(job_order_labor.router, prefix="/api/job-orders", tags=["Job Orders"])
app.include_router(job_order_additional_charges.router, prefix="/api/job-orders", tags=["Job Orders"])
app.include_router(job_order_sublet_orders.router, prefix="/api/job-orders", tags=["Job Orders"])
app.include_router(garage_invoices.router, prefix="/api", tags=["Garage Invoices"])
app.include_router(settings.router, prefix="/api/settings", tags=["System Settings"])
app.include_router(gl.router, prefix="/api/gl", tags=["General Ledger"])
app.include_router(enterprise_admin.router, prefix="/api/admin", tags=["Enterprise Admin"])
app.include_router(company_setup.router, prefix="/api", tags=["Company Setup"])
app.include_router(gl_account_setup.router, prefix="/api/gl-account-setup", tags=["GL Account Setup"])
app.include_router(job_type_access.router, prefix="/api", tags=["Job Type Access"])


@app.get("/")
async def root():
    return {"message": "Car Service Management API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
