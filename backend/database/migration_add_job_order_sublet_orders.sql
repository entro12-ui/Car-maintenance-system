-- Sublet work order workflow
-- Covers manual sections:
-- 6.11 Sublet order entry
-- 6.12 Sublet order approval
-- 6.13 Sublet order receiving

CREATE TABLE IF NOT EXISTS job_order_sublet_orders (
    sublet_order_id SERIAL PRIMARY KEY,
    sublet_order_number VARCHAR(40) NOT NULL UNIQUE,

    job_order_id INTEGER NOT NULL REFERENCES job_orders(job_order_id) ON DELETE CASCADE,
    sublet_work_type_id INTEGER NOT NULL REFERENCES sublet_work_types(sublet_work_type_id),
    supplier_id INTEGER NULL REFERENCES sublet_work_suppliers(supplier_id) ON DELETE SET NULL,

    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,

    remark TEXT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'Draft',

    requested_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalized_at TIMESTAMPTZ NULL,

    decided_at TIMESTAMPTZ NULL,
    decided_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,
    decision_remark TEXT NULL,

    delivery_order_number VARCHAR(80) NULL,
    received_at TIMESTAMPTZ NULL,
    received_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_job_order_sublet_orders_job_order_id ON job_order_sublet_orders(job_order_id);
CREATE INDEX IF NOT EXISTS idx_job_order_sublet_orders_status ON job_order_sublet_orders(status);
CREATE INDEX IF NOT EXISTS idx_job_order_sublet_orders_supplier_id ON job_order_sublet_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_job_order_sublet_orders_sublet_work_type_id ON job_order_sublet_orders(sublet_work_type_id);
