-- Labor Types (Operation Code) enhancements for manual-style two-part screen.
ALTER TABLE labor_types
  ADD COLUMN IF NOT EXISTS labor_code VARCHAR(40),
  ADD COLUMN IF NOT EXISTS taxable BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS section VARCHAR(120),
  ADD COLUMN IF NOT EXISTS allowed_for VARCHAR(120),
  ADD COLUMN IF NOT EXISTS sub_category VARCHAR(120),
  ADD COLUMN IF NOT EXISTS price_list_type VARCHAR(120);

CREATE UNIQUE INDEX IF NOT EXISTS uq_labor_types_labor_code
  ON labor_types (LOWER(labor_code))
  WHERE labor_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS labor_type_model_group_rates (
  labor_type_model_group_rate_id SERIAL PRIMARY KEY,
  labor_type_id INTEGER NOT NULL REFERENCES labor_types(labor_type_id) ON DELETE CASCADE,
  model_group_type VARCHAR(120) NOT NULL,
  std_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
  charge_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  mfc_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
  job_comp_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_labor_type_model_group UNIQUE (labor_type_id, model_group_type)
);

CREATE INDEX IF NOT EXISTS idx_labor_type_model_group_rates_labor_type_id
  ON labor_type_model_group_rates(labor_type_id);
