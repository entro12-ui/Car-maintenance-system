-- Job Type Per Hour Rate Setup (HillMaster §4.16)
-- 1) Charge Category tab fields on other_charge_types
ALTER TABLE other_charge_types
  ADD COLUMN IF NOT EXISTS charge_category_code VARCHAR(30),
  ADD COLUMN IF NOT EXISTS discount_charge_code VARCHAR(40),
  ADD COLUMN IF NOT EXISTS allow_to_journalize BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_create_journal BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_other_charge_types_charge_category_code
  ON other_charge_types(charge_category_code);

-- 2) Labour Price List tab table
CREATE TABLE IF NOT EXISTS labor_price_lists (
  labor_price_list_id SERIAL PRIMARY KEY,
  pl_id INTEGER NOT NULL UNIQUE,
  description VARCHAR(200) NOT NULL,
  rate_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_by VARCHAR(120),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labor_price_lists_pl_id ON labor_price_lists(pl_id);
