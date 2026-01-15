-- Seed Parts Inventory with Checklist Items
-- This script adds parts for all standard checklist items

-- Checklist items to add as parts:
-- 1. Engine Oil
-- 2. Oil Filter
-- 3. Air Filter
-- 4. Spark Plugs
-- 5. Throttle
-- 6. Brake Pads
-- 7. Coolant
-- 8. AGS Oil
-- 9. Gear Oil
-- 10. CV Joint Grease
-- 11. Fuel Pump
-- 12. Electrical components
-- 13. Computer diagnosis

-- Insert parts for checklist items
INSERT INTO parts_inventory (
    part_code, 
    part_name, 
    description, 
    category, 
    unit_price, 
    cost_price, 
    stock_quantity, 
    min_stock_level,
    is_active
) VALUES
    -- Engine Oil
    ('ENG-OIL-001', 'Engine Oil', 'Engine oil for vehicle maintenance', 'Fluids', 500.00, 350.00, 50, 10, true),
    
    -- Oil Filter
    ('OIL-FIL-001', 'Oil Filter', 'Engine oil filter replacement', 'Filters', 200.00, 120.00, 30, 5, true),
    
    -- Air Filter
    ('AIR-FIL-001', 'Air Filter', 'Engine air filter replacement', 'Filters', 150.00, 80.00, 25, 5, true),
    
    -- Spark Plugs
    ('SPK-PLG-001', 'Spark Plugs', 'Spark plugs set for engine', 'Engine', 800.00, 500.00, 20, 5, true),
    
    -- Throttle
    ('THR-CLN-001', 'Throttle Body Cleaning', 'Throttle body cleaning service', 'Engine', 300.00, 150.00, 999, 0, true),
    
    -- Brake Pads
    ('BRK-PAD-001', 'Brake Pads', 'Front brake pads set', 'Brakes', 1200.00, 800.00, 15, 5, true),
    ('BRK-PAD-002', 'Brake Pads Rear', 'Rear brake pads set', 'Brakes', 1000.00, 650.00, 15, 5, true),
    
    -- Coolant
    ('COOL-001', 'Coolant', 'Engine coolant/antifreeze', 'Fluids', 400.00, 250.00, 40, 10, true),
    
    -- AGS Oil (Automatic Transmission Fluid)
    ('AGS-OIL-001', 'AGS Oil', 'Automatic transmission fluid', 'Fluids', 600.00, 400.00, 30, 5, true),
    
    -- Gear Oil (Manual Transmission)
    ('GEAR-OIL-001', 'Gear Oil', 'Manual transmission oil', 'Fluids', 500.00, 320.00, 25, 5, true),
    
    -- CV Joint Grease
    ('CV-GRS-001', 'CV Joint Grease', 'CV joint grease and service', 'Other', 400.00, 200.00, 20, 5, true),
    
    -- Fuel Pump
    ('FUEL-PMP-001', 'Fuel Pump', 'Fuel pump replacement', 'Engine', 2500.00, 1800.00, 10, 3, true),
    
    -- Electrical components
    ('ELEC-001', 'Electrical Components', 'Various electrical components and wiring', 'Electrical', 500.00, 300.00, 50, 10, true),
    
    -- Computer diagnosis
    ('DIAG-001', 'Computer Diagnosis', 'ECU scan and diagnostic service', 'Other', 500.00, 200.00, 999, 0, true)

ON CONFLICT (part_code) DO NOTHING;

-- Update any existing parts with same names to ensure they're active
UPDATE parts_inventory 
SET is_active = true 
WHERE part_name IN (
    'Engine Oil', 'Oil Filter', 'Air Filter', 'Spark Plugs', 
    'Throttle Body Cleaning', 'Brake Pads', 'Brake Pads Rear', 
    'Coolant', 'AGS Oil', 'Gear Oil', 'CV Joint Grease', 
    'Fuel Pump', 'Electrical Components', 'Computer Diagnosis'
);

