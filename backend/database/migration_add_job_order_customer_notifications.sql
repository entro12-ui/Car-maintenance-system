-- Job Order Customer Notification Entry (manual section 10.13)

CREATE TABLE IF NOT EXISTS job_order_customer_notifications (
    notification_entry_id SERIAL PRIMARY KEY,

    job_order_id INTEGER NOT NULL REFERENCES job_orders(job_order_id) ON DELETE CASCADE,
    customer_id INTEGER NULL REFERENCES customers(customer_id) ON DELETE SET NULL,

    notice_date DATE NOT NULL,
    contact_name VARCHAR(200) NULL,
    contact_phone VARCHAR(30) NULL,

    notice_type VARCHAR(100) NOT NULL,
    remark TEXT NULL,

    recorded_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_order_customer_notifications_job_order_id ON job_order_customer_notifications(job_order_id);
CREATE INDEX IF NOT EXISTS idx_job_order_customer_notifications_customer_id ON job_order_customer_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_job_order_customer_notifications_notice_date ON job_order_customer_notifications(notice_date);
