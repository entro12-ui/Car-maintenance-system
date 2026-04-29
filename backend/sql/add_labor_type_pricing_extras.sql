-- Optional HillMaster-style labour / job-type pricing fields (see Job Type Per Hour Rate screen).
ALTER TABLE labor_types
  ADD COLUMN IF NOT EXISTS consumable_charge_code VARCHAR(40),
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS department VARCHAR(120),
  ADD COLUMN IF NOT EXISTS start_station VARCHAR(120),
  ADD COLUMN IF NOT EXISTS end_station VARCHAR(120),
  ADD COLUMN IF NOT EXISTS transfer_all_sections BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hold_section BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS take_from_third_party BOOLEAN NOT NULL DEFAULT FALSE;
