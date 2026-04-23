-- Job Order Item Issues (MRV) + Return Requests

-- =====================
-- Item Issues
-- =====================
CREATE TABLE IF NOT EXISTS job_order_item_issues (
    issue_id SERIAL PRIMARY KEY,
    issue_number VARCHAR(40) NOT NULL UNIQUE,

    job_order_id INTEGER NOT NULL REFERENCES job_orders(job_order_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft',

    issued_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,
    remarks TEXT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finalized_at TIMESTAMPTZ NULL,
    cancelled_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_job_order_item_issues_job_order_id ON job_order_item_issues(job_order_id);
CREATE INDEX IF NOT EXISTS idx_job_order_item_issues_status ON job_order_item_issues(status);

CREATE TABLE IF NOT EXISTS job_order_item_issue_lines (
    issue_line_id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES job_order_item_issues(issue_id) ON DELETE CASCADE,

    part_id INTEGER NOT NULL REFERENCES parts_inventory(part_id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uniq_issue_part UNIQUE (issue_id, part_id)
);

CREATE INDEX IF NOT EXISTS idx_job_order_item_issue_lines_issue_id ON job_order_item_issue_lines(issue_id);
CREATE INDEX IF NOT EXISTS idx_job_order_item_issue_lines_part_id ON job_order_item_issue_lines(part_id);

-- =====================
-- Return Requests
-- =====================
CREATE TABLE IF NOT EXISTS job_order_return_requests (
    return_request_id SERIAL PRIMARY KEY,
    return_number VARCHAR(40) NOT NULL UNIQUE,

    issue_id INTEGER NOT NULL REFERENCES job_order_item_issues(issue_id) ON DELETE CASCADE,
    job_order_id INTEGER NOT NULL REFERENCES job_orders(job_order_id) ON DELETE CASCADE,

    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    reason TEXT NULL,
    authority_name VARCHAR(200) NULL,

    requested_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ NULL,
    decided_by_employee_id INTEGER NULL REFERENCES employees(employee_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_job_order_return_requests_issue_id ON job_order_return_requests(issue_id);
CREATE INDEX IF NOT EXISTS idx_job_order_return_requests_job_order_id ON job_order_return_requests(job_order_id);
CREATE INDEX IF NOT EXISTS idx_job_order_return_requests_status ON job_order_return_requests(status);

CREATE TABLE IF NOT EXISTS job_order_return_request_lines (
    return_line_id SERIAL PRIMARY KEY,
    return_request_id INTEGER NOT NULL REFERENCES job_order_return_requests(return_request_id) ON DELETE CASCADE,

    part_id INTEGER NOT NULL REFERENCES parts_inventory(part_id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    remark TEXT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_order_return_request_lines_request_id ON job_order_return_request_lines(return_request_id);
CREATE INDEX IF NOT EXISTS idx_job_order_return_request_lines_part_id ON job_order_return_request_lines(part_id);
