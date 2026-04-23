-- Garage Invoices + Discount Rate Entry (HillMaster-SRV manual section 7)

CREATE TABLE IF NOT EXISTS garage_invoices (
    invoice_id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(40) UNIQUE NOT NULL,

    job_order_id INTEGER NOT NULL REFERENCES job_orders(job_order_id),
    invoice_type VARCHAR(10) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'Issued', -- Issued | Cancelled | Returned

    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    labor_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    parts_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    charges_total NUMERIC(12, 2) NOT NULL DEFAULT 0,

    discount_rate NUMERIC(6, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,

    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,

    is_collected BOOLEAN NOT NULL DEFAULT FALSE,
    collected_at TIMESTAMPTZ NULL,
    cleared_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,

    issued_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,

    cancel_reason TEXT NULL,
    cancel_letter_reference VARCHAR(120) NULL,
    cancelled_at TIMESTAMPTZ NULL,
    cancelled_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,

    return_reason TEXT NULL,
    return_letter_reference VARCHAR(120) NULL,
    returned_at TIMESTAMPTZ NULL,
    returned_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One invoice record per status per job order (prevents multiple active Issued invoices)
CREATE UNIQUE INDEX IF NOT EXISTS uq_garage_invoices_job_order_status ON garage_invoices(job_order_id, status);

CREATE INDEX IF NOT EXISTS idx_garage_invoices_status_created_at ON garage_invoices(status, created_at);

CREATE INDEX IF NOT EXISTS idx_garage_invoices_is_collected ON garage_invoices(is_collected);


CREATE TABLE IF NOT EXISTS discount_rate_entries (
    discount_entry_id SERIAL PRIMARY KEY,

    scope VARCHAR(20) NOT NULL, -- JobOrder | Customer
    job_order_id INTEGER NULL REFERENCES job_orders(job_order_id) ON DELETE CASCADE,
    customer_id INTEGER NULL REFERENCES customers(customer_id) ON DELETE CASCADE,

    discount_rate NUMERIC(6, 2) NOT NULL,
    remark TEXT NULL,
    authority_name VARCHAR(200) NULL,

    valid_from DATE NULL,
    valid_to DATE NULL,

    recorded_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_rate_entries_scope ON discount_rate_entries(scope);

CREATE INDEX IF NOT EXISTS idx_discount_rate_entries_job_order ON discount_rate_entries(job_order_id, created_at);

CREATE INDEX IF NOT EXISTS idx_discount_rate_entries_customer ON discount_rate_entries(customer_id, created_at);
