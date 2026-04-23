-- Add Job Orders + Job Clock tables

CREATE TABLE IF NOT EXISTS job_orders (
    job_order_id SERIAL PRIMARY KEY,
    job_order_number VARCHAR(30) UNIQUE NOT NULL,

    vehicle_id INTEGER NOT NULL,
    customer_id INTEGER,
    service_type_id INTEGER,

    invoice_type VARCHAR(10) DEFAULT 'Cash',
    status VARCHAR(20) DEFAULT 'Open',

    mileage_in_km VARCHAR(30),
    remarks TEXT,

    opened_date DATE,
    expected_finish_date DATE,

    dispatched_section VARCHAR(100),
    dispatched_at TIMESTAMP,

    received_section VARCHAR(100),
    received_vehicle_location VARCHAR(200),
    received_at TIMESTAMP,

    closed_at TIMESTAMP,

    opened_by_employee_id INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
    FOREIGN KEY (service_type_id) REFERENCES service_types(service_type_id) ON DELETE SET NULL,
    FOREIGN KEY (opened_by_employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_job_orders_vehicle ON job_orders(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_job_orders_customer ON job_orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_job_orders_status ON job_orders(status);


CREATE TABLE IF NOT EXISTS job_order_tasks (
    task_id SERIAL PRIMARY KEY,
    job_order_id INTEGER NOT NULL,
    task_name VARCHAR(200) NOT NULL,
    task_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_order_id) REFERENCES job_orders(job_order_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_order_tasks_order ON job_order_tasks(job_order_id, is_active);


CREATE TABLE IF NOT EXISTS job_clocks (
    job_clock_id SERIAL PRIMARY KEY,
    job_order_id INTEGER NOT NULL,
    task_id INTEGER,
    technician_employee_id INTEGER,

    clock_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    clock_in_remark TEXT,

    clock_out_at TIMESTAMP,
    clock_out_reason VARCHAR(200),
    clock_out_remark TEXT,

    FOREIGN KEY (job_order_id) REFERENCES job_orders(job_order_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES job_order_tasks(task_id) ON DELETE SET NULL,
    FOREIGN KEY (technician_employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_job_clocks_order ON job_clocks(job_order_id, clock_out_at);
CREATE INDEX IF NOT EXISTS idx_job_clocks_technician_active ON job_clocks(technician_employee_id, clock_out_at);

-- Optional: prevent more than one active clock per technician
CREATE UNIQUE INDEX IF NOT EXISTS uniq_job_clocks_active_technician
ON job_clocks(technician_employee_id)
WHERE clock_out_at IS NULL;
