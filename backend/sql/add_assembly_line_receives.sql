CREATE TABLE IF NOT EXISTS assembly_line_receives (
  assembly_receive_id SERIAL PRIMARY KEY,
  reference_no VARCHAR(50) NOT NULL,
  receive_date DATE NOT NULL,
  requesting_unit VARCHAR(200) NOT NULL,
  job_order_ids JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_assembly_line_receives_ref ON assembly_line_receives (reference_no);
CREATE INDEX IF NOT EXISTS ix_assembly_line_receives_date ON assembly_line_receives (receive_date);
