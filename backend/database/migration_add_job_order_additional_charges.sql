-- Additional charge setups + charge entry to job orders
-- Covers manual sections:
-- 4.8 Other charges setup
-- 4.9 Fuel & lubricants
-- 4.10 Miscellaneous charge types
-- 4.11 Sublet work type maintenance (+ suppliers)
-- 6.5 Miscellaneous charge entry
-- 6.6 Lubricant & fuel charge entry
-- 6.7 Sublet work charge entry
-- 6.8 Other charges entry

CREATE TABLE IF NOT EXISTS other_charge_types (
    other_charge_type_id SERIAL PRIMARY KEY,
    charge_code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(200) NOT NULL,
    taxable BOOLEAN NOT NULL DEFAULT TRUE,
    job_type VARCHAR(50) NULL,
    section VARCHAR(100) NULL,
    unit_of_measure VARCHAR(30) NULL,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    sub_category VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_other_charge_types_is_active ON other_charge_types(is_active);

CREATE TABLE IF NOT EXISTS fuel_lubricant_items (
    fuel_lubricant_id SERIAL PRIMARY KEY,
    item_code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(200) NOT NULL,
    taxable BOOLEAN NOT NULL DEFAULT TRUE,
    section VARCHAR(100) NULL,
    unit_of_measure VARCHAR(30) NULL,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fuel_lubricant_items_is_active ON fuel_lubricant_items(is_active);

CREATE TABLE IF NOT EXISTS misc_charge_types (
    misc_charge_type_id SERIAL PRIMARY KEY,
    charge_code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(200) NOT NULL,
    taxable BOOLEAN NOT NULL DEFAULT TRUE,
    job_type VARCHAR(50) NULL,
    section VARCHAR(100) NULL,
    unit_of_measure VARCHAR(30) NULL,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    sub_category VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_misc_charge_types_is_active ON misc_charge_types(is_active);

CREATE TABLE IF NOT EXISTS sublet_work_suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(200) NOT NULL UNIQUE,
    phone VARCHAR(50) NULL,
    email VARCHAR(120) NULL,
    address VARCHAR(250) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sublet_work_suppliers_is_active ON sublet_work_suppliers(is_active);

CREATE TABLE IF NOT EXISTS sublet_work_types (
    sublet_work_type_id SERIAL PRIMARY KEY,
    work_code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(200) NOT NULL,
    taxable BOOLEAN NOT NULL DEFAULT TRUE,
    job_type VARCHAR(50) NULL,
    section VARCHAR(100) NULL,
    unit_of_measure VARCHAR(30) NULL,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    sub_category VARCHAR(100) NULL,
    supplier_id INTEGER NULL REFERENCES sublet_work_suppliers(supplier_id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sublet_work_types_is_active ON sublet_work_types(is_active);

-- Job order charge entries

CREATE TABLE IF NOT EXISTS job_order_misc_charges (
    misc_charge_entry_id SERIAL PRIMARY KEY,
    job_order_id INTEGER NOT NULL REFERENCES job_orders(job_order_id) ON DELETE CASCADE,
    misc_charge_type_id INTEGER NOT NULL REFERENCES misc_charge_types(misc_charge_type_id),
    unit_price NUMERIC(12,2) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    remark TEXT NULL,
    recorded_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_order_misc_charges_job_order_id ON job_order_misc_charges(job_order_id);

CREATE TABLE IF NOT EXISTS job_order_fuel_lubricant_charges (
    fuel_lubricant_entry_id SERIAL PRIMARY KEY,
    job_order_id INTEGER NOT NULL REFERENCES job_orders(job_order_id) ON DELETE CASCADE,
    fuel_lubricant_id INTEGER NOT NULL REFERENCES fuel_lubricant_items(fuel_lubricant_id),
    quantity NUMERIC(10,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    remark TEXT NULL,
    recorded_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_order_fuel_lubricant_charges_job_order_id ON job_order_fuel_lubricant_charges(job_order_id);

CREATE TABLE IF NOT EXISTS job_order_sublet_work_charges (
    sublet_work_entry_id SERIAL PRIMARY KEY,
    job_order_id INTEGER NOT NULL REFERENCES job_orders(job_order_id) ON DELETE CASCADE,
    sublet_work_type_id INTEGER NOT NULL REFERENCES sublet_work_types(sublet_work_type_id),
    quantity NUMERIC(10,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    remark TEXT NULL,
    recorded_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_order_sublet_work_charges_job_order_id ON job_order_sublet_work_charges(job_order_id);

CREATE TABLE IF NOT EXISTS job_order_other_charges (
    other_charge_entry_id SERIAL PRIMARY KEY,
    job_order_id INTEGER NOT NULL REFERENCES job_orders(job_order_id) ON DELETE CASCADE,
    other_charge_type_id INTEGER NOT NULL REFERENCES other_charge_types(other_charge_type_id),
    quantity NUMERIC(10,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    remark TEXT NULL,
    recorded_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_order_other_charges_job_order_id ON job_order_other_charges(job_order_id);
