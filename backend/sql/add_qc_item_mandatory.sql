-- QC checklist: mandatory flag per line (HillMaster quality check sheet §8.2).
ALTER TABLE job_order_qc_items ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE job_order_qc_items SET is_mandatory = TRUE WHERE is_mandatory IS NULL;
