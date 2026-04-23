-- Add blocking/release + delivery + QC sheet for Job Orders

-- 1) Extend job_orders
ALTER TABLE job_orders
    ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
    ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS blocked_by_employee_id INTEGER,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS delivered_by_employee_id INTEGER,
    ADD COLUMN IF NOT EXISTS delivered_to_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS delivered_to_phone VARCHAR(30);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_job_orders_blocked_by'
          AND table_name = 'job_orders'
    ) THEN
        ALTER TABLE job_orders
            ADD CONSTRAINT fk_job_orders_blocked_by
            FOREIGN KEY (blocked_by_employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_job_orders_delivered_by'
          AND table_name = 'job_orders'
    ) THEN
        ALTER TABLE job_orders
            ADD CONSTRAINT fk_job_orders_delivered_by
            FOREIGN KEY (delivered_by_employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_orders_blocked ON job_orders(is_blocked, status);
CREATE INDEX IF NOT EXISTS idx_job_orders_delivered ON job_orders(delivered_at);


-- 2) QC Sheet tables
CREATE TABLE IF NOT EXISTS job_order_qc_sheets (
    qc_sheet_id SERIAL PRIMARY KEY,
    job_order_id INTEGER NOT NULL UNIQUE,

    overall_status VARCHAR(20) DEFAULT 'Pending', -- Pending | Passed | Failed
    remarks TEXT,

    checked_by_employee_id INTEGER,
    checked_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (job_order_id) REFERENCES job_orders(job_order_id) ON DELETE CASCADE,
    FOREIGN KEY (checked_by_employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_job_order_qc_job ON job_order_qc_sheets(job_order_id, overall_status);


CREATE TABLE IF NOT EXISTS job_order_qc_items (
    qc_item_id SERIAL PRIMARY KEY,
    qc_sheet_id INTEGER NOT NULL,

    item_name VARCHAR(200) NOT NULL,
    passed BOOLEAN,
    remark TEXT,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (qc_sheet_id) REFERENCES job_order_qc_sheets(qc_sheet_id) ON DELETE CASCADE,
    UNIQUE (qc_sheet_id, item_name)
);

CREATE INDEX IF NOT EXISTS idx_job_order_qc_items_sheet ON job_order_qc_items(qc_sheet_id, sort_order);
