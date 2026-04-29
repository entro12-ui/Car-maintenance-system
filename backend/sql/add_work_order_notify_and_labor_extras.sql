-- Run once on existing PostgreSQL databases (create_all does not ALTER tables).
ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS notify_client JSONB;

ALTER TABLE job_order_labor_charges ADD COLUMN IF NOT EXISTS mfc_hours NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE job_order_labor_charges ADD COLUMN IF NOT EXISTS repair_option VARCHAR(50);
ALTER TABLE job_order_labor_charges ADD COLUMN IF NOT EXISTS price_list_type VARCHAR(80);
ALTER TABLE job_order_labor_charges ADD COLUMN IF NOT EXISTS is_charged BOOLEAN DEFAULT FALSE;
ALTER TABLE job_order_labor_charges ADD COLUMN IF NOT EXISTS charge_code VARCHAR(40);

UPDATE job_order_labor_charges SET mfc_hours = 0 WHERE mfc_hours IS NULL;
