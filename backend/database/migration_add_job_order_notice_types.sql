-- Notice Types maintenance for Job Order customer notifications (manual section 10.13)

CREATE TABLE IF NOT EXISTS job_order_notice_types (
    notice_type_id SERIAL PRIMARY KEY,
    notice_type_name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_order_notice_types_active ON job_order_notice_types(is_active);
