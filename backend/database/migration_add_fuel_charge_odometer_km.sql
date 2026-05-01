-- Odometer / KM reading on fuel & lubricant charge lines (issue + KM correction screen)

ALTER TABLE job_order_fuel_lubricant_charges
ADD COLUMN IF NOT EXISTS odometer_km NUMERIC(14, 2) NULL;

COMMENT ON COLUMN job_order_fuel_lubricant_charges.odometer_km IS 'Vehicle odometer (KM) at fuel/lubricant issue; editable via Fuel Issue KM Editing';
