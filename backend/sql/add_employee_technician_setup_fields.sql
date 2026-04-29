-- Run once on existing PostgreSQL databases.
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_unit VARCHAR(120);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS supervisor_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS can_dispatch_job BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS on_payroll BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS payroll_no VARCHAR(40);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_termination DATE;

