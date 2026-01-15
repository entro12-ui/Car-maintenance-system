-- Seed Service Checklist Items
-- This script adds the standard checklist items for all service types

-- First, get all service types
-- Then add checklist items for each service type

-- Checklist items to add (in order):
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

-- Insert checklist items for all existing service types
DO $$
DECLARE
    service_type_record RECORD;
    sort_order_val INTEGER := 0;
BEGIN
    -- Loop through all service types
    FOR service_type_record IN SELECT service_type_id FROM service_types LOOP
        sort_order_val := 0;
        
        -- Insert all checklist items for this service type
        INSERT INTO service_checklists (service_type_id, item_name, item_description, is_mandatory, estimated_duration_minutes, sort_order)
        VALUES
            (service_type_record.service_type_id, 'Engine Oil', 'Engine oil check and change', true, 15, sort_order_val),
            (service_type_record.service_type_id, 'Oil Filter', 'Oil filter replacement', true, 10, sort_order_val + 1),
            (service_type_record.service_type_id, 'Air Filter', 'Air filter inspection and replacement', true, 10, sort_order_val + 2),
            (service_type_record.service_type_id, 'Spark Plugs', 'Spark plugs inspection and replacement', false, 20, sort_order_val + 3),
            (service_type_record.service_type_id, 'Throttle', 'Throttle body cleaning and inspection', false, 15, sort_order_val + 4),
            (service_type_record.service_type_id, 'Brake Pads', 'Brake pads inspection and replacement', true, 30, sort_order_val + 5),
            (service_type_record.service_type_id, 'Coolant', 'Coolant level check and top-up', true, 10, sort_order_val + 6),
            (service_type_record.service_type_id, 'AGS Oil', 'Automatic transmission fluid check and change', false, 20, sort_order_val + 7),
            (service_type_record.service_type_id, 'Gear Oil', 'Manual transmission oil check and change', false, 15, sort_order_val + 8),
            (service_type_record.service_type_id, 'CV Joint Grease', 'CV joint inspection and greasing', false, 20, sort_order_val + 9),
            (service_type_record.service_type_id, 'Fuel Pump', 'Fuel pump inspection and testing', false, 15, sort_order_val + 10),
            (service_type_record.service_type_id, 'Electrical components', 'Electrical system inspection', false, 25, sort_order_val + 11),
            (service_type_record.service_type_id, 'Computer diagnosis', 'ECU scan and diagnostic check', false, 30, sort_order_val + 12)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- Also create a default "General Service" type if it doesn't exist and add items to it
INSERT INTO service_types (type_name, description, base_labor_hours, mileage_interval, time_interval_months)
VALUES ('General Service', 'Standard vehicle service with all checklist items', 2.0, 10000, 6)
ON CONFLICT (type_name) DO NOTHING;

-- Add checklist items to the General Service type
DO $$
DECLARE
    general_service_id INTEGER;
BEGIN
    SELECT service_type_id INTO general_service_id FROM service_types WHERE type_name = 'General Service';
    
    IF general_service_id IS NOT NULL THEN
        INSERT INTO service_checklists (service_type_id, item_name, item_description, is_mandatory, estimated_duration_minutes, sort_order)
        VALUES
            (general_service_id, 'Engine Oil', 'Engine oil check and change', true, 15, 0),
            (general_service_id, 'Oil Filter', 'Oil filter replacement', true, 10, 1),
            (general_service_id, 'Air Filter', 'Air filter inspection and replacement', true, 10, 2),
            (general_service_id, 'Spark Plugs', 'Spark plugs inspection and replacement', false, 20, 3),
            (general_service_id, 'Throttle', 'Throttle body cleaning and inspection', false, 15, 4),
            (general_service_id, 'Brake Pads', 'Brake pads inspection and replacement', true, 30, 5),
            (general_service_id, 'Coolant', 'Coolant level check and top-up', true, 10, 6),
            (general_service_id, 'AGS Oil', 'Automatic transmission fluid check and change', false, 20, 7),
            (general_service_id, 'Gear Oil', 'Manual transmission oil check and change', false, 15, 8),
            (general_service_id, 'CV Joint Grease', 'CV joint inspection and greasing', false, 20, 9),
            (general_service_id, 'Fuel Pump', 'Fuel pump inspection and testing', false, 15, 10),
            (general_service_id, 'Electrical components', 'Electrical system inspection', false, 25, 11),
            (general_service_id, 'Computer diagnosis', 'ECU scan and diagnostic check', false, 30, 12)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

