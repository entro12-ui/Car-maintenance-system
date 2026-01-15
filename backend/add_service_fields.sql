-- Add new fields to services table for detailed service record
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS oil_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS service_note TEXT,
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS branch VARCHAR(100),
ADD COLUMN IF NOT EXISTS serviced_by_name VARCHAR(100);

-- Create index for reference number
CREATE INDEX IF NOT EXISTS idx_service_reference ON services(reference_number);



