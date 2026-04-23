-- Vehicle Release Voucher (VRV) fields on job_orders

ALTER TABLE job_orders
    ADD COLUMN IF NOT EXISTS vrv_number VARCHAR(40) NULL,
    ADD COLUMN IF NOT EXISTS vrv_printed_at TIMESTAMPTZ NULL;

-- Ensure VRV number uniqueness when present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'uniq_job_orders_vrv_number'
    ) THEN
        CREATE UNIQUE INDEX uniq_job_orders_vrv_number ON job_orders(vrv_number)
        WHERE vrv_number IS NOT NULL;
    END IF;
END$$;
