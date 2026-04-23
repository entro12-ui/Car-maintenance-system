-- Add labor types + job order labor charge entries

CREATE TABLE IF NOT EXISTS labor_types (
    labor_type_id SERIAL PRIMARY KEY,
    labor_type_name VARCHAR(120) NOT NULL UNIQUE,
    hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labor_types_is_active ON labor_types(is_active);

CREATE TABLE IF NOT EXISTS job_order_labor_charges (
    labor_charge_id SERIAL PRIMARY KEY,
    job_order_id INTEGER NOT NULL REFERENCES job_orders(job_order_id) ON DELETE CASCADE,
    labor_type_id INTEGER NOT NULL REFERENCES labor_types(labor_type_id),

    technician_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,

    hours_worked NUMERIC(10,2) NOT NULL,
    hourly_rate NUMERIC(10,2) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,

    remark TEXT NULL,

    recorded_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_order_labor_charges_job_order_id ON job_order_labor_charges(job_order_id);
CREATE INDEX IF NOT EXISTS idx_job_order_labor_charges_labor_type_id ON job_order_labor_charges(labor_type_id);
CREATE INDEX IF NOT EXISTS idx_job_order_labor_charges_technician_employee_id ON job_order_labor_charges(technician_employee_id);
