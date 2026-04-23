-- Job Order Pairings (manual section 8.9)

CREATE TABLE IF NOT EXISTS job_order_pairings (
    pairing_id SERIAL PRIMARY KEY,

    job_order_id_a INTEGER NOT NULL REFERENCES job_orders(job_order_id) ON DELETE CASCADE,
    job_order_id_b INTEGER NOT NULL REFERENCES job_orders(job_order_id) ON DELETE CASCADE,

    paired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paired_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,

    unpaired_at TIMESTAMPTZ NULL,
    unpaired_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,

    CONSTRAINT chk_job_order_pairings_ordered CHECK (job_order_id_a < job_order_id_b)
);

CREATE INDEX IF NOT EXISTS idx_job_order_pairings_a ON job_order_pairings(job_order_id_a);
CREATE INDEX IF NOT EXISTS idx_job_order_pairings_b ON job_order_pairings(job_order_id_b);

-- Prevent duplicate active pairings for the same two jobs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'uniq_job_order_pairings_active'
    ) THEN
        CREATE UNIQUE INDEX uniq_job_order_pairings_active
            ON job_order_pairings(job_order_id_a, job_order_id_b)
            WHERE unpaired_at IS NULL;
    END IF;
END$$;
