-- HillMaster-style Close Job Order screen (testing + work description). Run once on PostgreSQL.
ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS close_tested_by_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL;
ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS close_tested_on_road BOOLEAN DEFAULT FALSE;
ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS close_tested_on_test_lane BOOLEAN DEFAULT FALSE;
ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS close_work_description TEXT;
ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS close_send_email BOOLEAN DEFAULT FALSE;
ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS close_process_remark TEXT;
