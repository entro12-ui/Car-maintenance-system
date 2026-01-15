-- PostgreSQL Schema for Car Service Management System
-- Adapted from MySQL to PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CORE ENTITIES
-- ============================================

-- CUSTOMERS
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    national_id VARCHAR(20) UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(50),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    password_hash VARCHAR(255),
    last_login TIMESTAMP,
    CONSTRAINT chk_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_customer_email ON customers(email);
CREATE INDEX idx_customer_phone ON customers(phone);

-- VEHICLES
CREATE TABLE vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vin VARCHAR(17) UNIQUE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(30),
    engine_type VARCHAR(30),
    transmission_type VARCHAR(20) CHECK (transmission_type IN ('Manual', 'Automatic', 'CVT')),
    fuel_type VARCHAR(20) CHECK (fuel_type IN ('Petrol', 'Diesel', 'Electric', 'Hybrid')),
    current_mileage DECIMAL(10,2) DEFAULT 0.00,
    last_service_mileage DECIMAL(10,2) DEFAULT 0.00,
    next_service_mileage DECIMAL(10,2) DEFAULT 5000.00,
    purchase_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX idx_vehicle_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicle_customer ON vehicles(customer_id);
CREATE INDEX idx_vehicles_next_service ON vehicles(next_service_mileage, current_mileage);

-- ============================================
-- 2. SERVICE MANAGEMENT ENTITIES
-- ============================================

-- SERVICE_TYPES
CREATE TABLE service_types (
    service_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    base_labor_hours DECIMAL(4,2) DEFAULT 1.00,
    base_labor_cost DECIMAL(10,2) DEFAULT 0.00,
    mileage_interval INTEGER DEFAULT 5000,
    time_interval_months INTEGER DEFAULT 6,
    is_active BOOLEAN DEFAULT TRUE
);

-- SERVICE_CHECKLISTS
CREATE TABLE service_checklists (
    checklist_id SERIAL PRIMARY KEY,
    service_type_id INTEGER NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    item_description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    estimated_duration_minutes INTEGER DEFAULT 15,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (service_type_id) REFERENCES service_types(service_type_id) ON DELETE CASCADE,
    UNIQUE (service_type_id, item_name)
);

-- APPOINTMENTS
CREATE TYPE appointment_status AS ENUM ('Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show');

CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL,
    service_type_id INTEGER NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    status appointment_status DEFAULT 'Scheduled',
    notes TEXT,
    estimated_duration_minutes INTEGER DEFAULT 60,
    assigned_mechanic_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES service_types(service_type_id)
);

CREATE INDEX idx_appointment_date ON appointments(scheduled_date);
CREATE INDEX idx_appointment_status ON appointments(status);
CREATE INDEX idx_appointments_date_status ON appointments(scheduled_date, status);

-- SERVICES
CREATE TYPE payment_status AS ENUM ('Pending', 'Partial', 'Paid', 'Free Service');
CREATE TYPE payment_method AS ENUM ('Cash', 'Card', 'Mobile Payment', 'Bank Transfer');

CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    appointment_id INTEGER UNIQUE,
    vehicle_id INTEGER NOT NULL,
    service_type_id INTEGER NOT NULL,
    service_date DATE NOT NULL,
    mileage_at_service DECIMAL(10,2) NOT NULL,
    next_service_mileage DECIMAL(10,2) NOT NULL,
    next_service_date DATE,
    total_labor_hours DECIMAL(5,2) DEFAULT 0.00,
    labor_cost_per_hour DECIMAL(10,2) DEFAULT 1000.00,
    total_labor_cost DECIMAL(10,2) DEFAULT 0.00,
    total_parts_cost DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 15.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    grand_total DECIMAL(10,2) DEFAULT 0.00,
    payment_status payment_status DEFAULT 'Pending',
    payment_method payment_method,
    service_advisor_id INTEGER,
    mechanic_notes TEXT,
    customer_feedback TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    FOREIGN KEY (service_type_id) REFERENCES service_types(service_type_id)
);

CREATE INDEX idx_service_date ON services(service_date);
CREATE INDEX idx_vehicle_service ON services(vehicle_id, service_date);
CREATE INDEX idx_services_vehicle_date ON services(vehicle_id, service_date);
CREATE INDEX idx_services_date_total ON services(service_date, grand_total);
CREATE INDEX idx_services_customer_date ON services(vehicle_id, service_date, grand_total);

-- ============================================
-- 3. PARTS & INVENTORY ENTITIES
-- ============================================

-- PARTS_INVENTORY
CREATE TYPE part_category AS ENUM ('Engine', 'Brakes', 'Filters', 'Electrical', 'Tires', 'Fluids', 'Other');

CREATE TABLE parts_inventory (
    part_id SERIAL PRIMARY KEY,
    part_code VARCHAR(50) UNIQUE NOT NULL,
    part_name VARCHAR(100) NOT NULL,
    description TEXT,
    category part_category,
    unit_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    supplier_id INTEGER,
    compatible_models TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_part_code ON parts_inventory(part_code);
CREATE INDEX idx_part_category ON parts_inventory(category);
CREATE INDEX idx_parts_inventory_stock ON parts_inventory(stock_quantity, is_active);

-- SERVICE_PARTS
CREATE TABLE service_parts (
    service_part_id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL,
    part_id INTEGER NOT NULL,
    checklist_item_id INTEGER,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    was_replaced BOOLEAN DEFAULT FALSE,
    replacement_reason TEXT,
    warranty_months INTEGER DEFAULT 12,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES parts_inventory(part_id),
    FOREIGN KEY (checklist_item_id) REFERENCES service_checklists(checklist_id),
    UNIQUE (service_id, part_id, checklist_item_id)
);

CREATE INDEX idx_service_parts_service ON service_parts(service_id, was_replaced);

-- ============================================
-- 4. LOYALTY PROGRAM ENTITIES
-- ============================================

-- LOYALTY_PROGRAMS
CREATE TABLE loyalty_programs (
    program_id SERIAL PRIMARY KEY,
    program_name VARCHAR(100) UNIQUE NOT NULL,
    services_required INTEGER DEFAULT 3,
    free_service_type_id INTEGER,
    free_labor_hours DECIMAL(5,2) DEFAULT 3.00,
    free_parts_discount DECIMAL(5,2) DEFAULT 0.00,
    valid_days INTEGER DEFAULT 365,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (free_service_type_id) REFERENCES service_types(service_type_id)
);

-- CUSTOMER_LOYALTY
CREATE TABLE customer_loyalty (
    loyalty_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    program_id INTEGER NOT NULL,
    consecutive_count INTEGER DEFAULT 0,
    total_services INTEGER DEFAULT 0,
    free_services_earned INTEGER DEFAULT 0,
    free_services_used INTEGER DEFAULT 0,
    last_service_date DATE,
    next_service_expected DATE,
    current_streak_start DATE,
    free_service_available BOOLEAN DEFAULT FALSE,
    free_service_expiry DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES loyalty_programs(program_id),
    UNIQUE (customer_id, program_id)
);

CREATE INDEX idx_customer_loyalty_status ON customer_loyalty(free_service_available, free_service_expiry);

-- LOYALTY_SERVICE_HISTORY
CREATE TABLE loyalty_service_history (
    history_id SERIAL PRIMARY KEY,
    loyalty_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    counted_for_loyalty BOOLEAN DEFAULT TRUE,
    earned_free_service BOOLEAN DEFAULT FALSE,
    free_service_applied BOOLEAN DEFAULT FALSE,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loyalty_id) REFERENCES customer_loyalty(loyalty_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id),
    UNIQUE (loyalty_id, service_id)
);

-- ============================================
-- 5. EMPLOYEE & USER MANAGEMENT
-- ============================================

-- EMPLOYEES
CREATE TYPE employee_role AS ENUM ('Admin', 'Service Advisor', 'Mechanic', 'Manager', 'Receptionist');

CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    role employee_role NOT NULL,
    specialization VARCHAR(100),
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    hire_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER_ACCOUNTS
CREATE TYPE user_role AS ENUM ('Admin', 'Employee', 'Customer');

CREATE TABLE user_accounts (
    user_id SERIAL PRIMARY KEY,
    employee_id INTEGER UNIQUE,
    customer_id INTEGER UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- ============================================
-- 6. NOTIFICATION & REMINDER SYSTEM
-- ============================================

-- NOTIFICATION_TEMPLATES
CREATE TYPE template_type AS ENUM ('Email', 'SMS', 'Push');
CREATE TYPE notification_type AS ENUM ('Service Reminder', 'Appointment Confirmation', 'Payment Receipt', 'Loyalty Reward');
CREATE TYPE notification_channel AS ENUM ('Email', 'SMS', 'Both');
CREATE TYPE notification_status AS ENUM ('Pending', 'Sent', 'Failed', 'Read');

CREATE TABLE notification_templates (
    template_id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) UNIQUE NOT NULL,
    template_type template_type,
    subject VARCHAR(200),
    body TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    vehicle_id INTEGER,
    template_id INTEGER,
    notification_type notification_type,
    channel notification_channel,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    sent_at TIMESTAMP,
    status notification_status DEFAULT 'Pending',
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    FOREIGN KEY (template_id) REFERENCES notification_templates(template_id)
);

CREATE INDEX idx_notification_status ON notifications(status);
CREATE INDEX idx_notification_schedule ON notifications(scheduled_for);
CREATE INDEX idx_notifications_status_schedule ON notifications(status, scheduled_for);

-- ============================================
-- 7. AUDIT & LOGGING
-- ============================================

-- AUDIT_LOGS
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action_type);
CREATE INDEX idx_audit_date ON audit_logs(created_at);

-- SYSTEM_SETTINGS
CREATE TYPE setting_type AS ENUM ('String', 'Number', 'Boolean', 'JSON');

CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type setting_type,
    category VARCHAR(50),
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER
);

CREATE INDEX idx_setting_key ON system_settings(setting_key);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at (only for tables that have updated_at column)
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_loyalty_updated_at BEFORE UPDATE ON customer_loyalty
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_inventory_updated_at BEFORE UPDATE ON parts_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inventory update trigger
CREATE OR REPLACE FUNCTION update_inventory_after_service()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.was_replaced = TRUE THEN
        UPDATE parts_inventory
        SET stock_quantity = stock_quantity - NEW.quantity,
            updated_at = CURRENT_TIMESTAMP
        WHERE part_id = NEW.part_id;
        
        INSERT INTO audit_logs (table_name, record_id, action_type, old_values, new_values)
        VALUES (
            'parts_inventory',
            NEW.part_id,
            'STOCK_DECREASE',
            jsonb_build_object('quantity_before', (SELECT stock_quantity + NEW.quantity FROM parts_inventory WHERE part_id = NEW.part_id)),
            jsonb_build_object('quantity_after', (SELECT stock_quantity FROM parts_inventory WHERE part_id = NEW.part_id))
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_trigger AFTER INSERT ON service_parts
    FOR EACH ROW EXECUTE FUNCTION update_inventory_after_service();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Service Types
INSERT INTO service_types (type_name, description, base_labor_hours, mileage_interval, time_interval_months) VALUES
('Basic Service', 'Oil change, filter check, tire rotation', 1.5, 5000, 6),
('Major Service', 'Complete checkup with spark plugs and fluids', 3.0, 20000, 12),
('Brake Service', 'Brake pad replacement and fluid check', 2.0, 10000, 12),
('Tire Service', 'Tire rotation, balancing and alignment', 1.0, 10000, 6),
('AC Service', 'AC gas refill and system check', 1.5, 12000, 12);

-- Loyalty Programs
INSERT INTO loyalty_programs (program_name, services_required, free_labor_hours, free_parts_discount, valid_days) VALUES
('Pay 3 Get 4th Free', 3, 3.00, 0.00, 365),
('Premium Loyalty', 5, 5.00, 10.00, 365);

-- Notification Templates
INSERT INTO notification_templates (template_name, template_type, subject, body, variables) VALUES
('Service Reminder', 'SMS', 'Service Due Reminder', 
'Dear {customer_name}, your {vehicle_model} is due for service. Current: {current_km}km, Next due: {next_service_km}km. Book now!',
'["customer_name", "vehicle_model", "current_km", "next_service_km"]'::jsonb),
('Appointment Confirmation', 'Email', 'Appointment Confirmed #{appointment_id}',
'Dear {customer_name},\nYour appointment for {vehicle_model} is confirmed for {appointment_date} at {appointment_time}.\nService: {service_type}\nThank you!',
'["customer_name", "vehicle_model", "appointment_date", "appointment_time", "service_type", "appointment_id"]'::jsonb);

-- System Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('system.name', 'Car Service Management System', 'String', 'General', 'System name'),
('system.currency', 'Birr', 'String', 'General', 'Default currency'),
('labor.rate', '1000', 'Number', 'Pricing', 'Default labor rate per hour'),
('tax.rate', '15', 'Number', 'Pricing', 'Default tax rate percentage'),
('reminder.days_before', '3', 'Number', 'Notifications', 'Days before service to send reminder'),
('loyalty.program.id', '1', 'Number', 'Loyalty', 'Default loyalty program ID'),
('service.interval.default', '5000', 'Number', 'Service', 'Default service interval in km'),
('email.smtp.enabled', 'true', 'Boolean', 'Email', 'Enable email notifications'),
('sms.provider', 'twilio', 'String', 'SMS', 'SMS service provider');



