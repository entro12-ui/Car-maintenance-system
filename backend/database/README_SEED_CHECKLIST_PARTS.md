# Seed Checklist Items as Parts

This script adds all checklist items as parts in the parts inventory.

## Parts Added:

1. **Engine Oil** (ENG-OIL-001) - ETB 500.00
2. **Oil Filter** (OIL-FIL-001) - ETB 200.00
3. **Air Filter** (AIR-FIL-001) - ETB 150.00
4. **Spark Plugs** (SPK-PLG-001) - ETB 800.00
5. **Throttle Body Cleaning** (THR-CLN-001) - ETB 300.00
6. **Brake Pads** (BRK-PAD-001) - ETB 1,200.00
7. **Brake Pads Rear** (BRK-PAD-002) - ETB 1,000.00
8. **Coolant** (COOL-001) - ETB 400.00
9. **AGS Oil** (AGS-OIL-001) - ETB 600.00
10. **Gear Oil** (GEAR-OIL-001) - ETB 500.00
11. **CV Joint Grease** (CV-GRS-001) - ETB 400.00
12. **Fuel Pump** (FUEL-PMP-001) - ETB 2,500.00
13. **Electrical Components** (ELEC-001) - ETB 500.00
14. **Computer Diagnosis** (DIAG-001) - ETB 500.00

## How to Run:

### Option 1: SQL Script
```bash
psql -U your_username -d your_database_name -f backend/database/seed_checklist_parts.sql
```

### Option 2: Python Script
```bash
cd backend
python scripts/seed_checklist_parts.py
```

## What it does:

- Creates parts for all checklist items
- Sets appropriate categories (Fluids, Filters, Engine, Brakes, etc.)
- Sets default prices (you can adjust these later)
- Sets initial stock quantities
- Marks all parts as active
- Uses `ON CONFLICT DO NOTHING` to avoid duplicates (SQL)
- Updates existing parts if they exist (Python)

## Notes:

- Prices are in ETB (Ethiopian Birr)
- Stock quantities are set with reasonable defaults
- Service items (like Throttle Cleaning, Computer Diagnosis) have high stock (999) since they're services
- You can adjust prices and stock levels after running the script through the admin interface

## After Running:

1. Go to **Parts** page in admin panel
2. You should see all checklist items as parts
3. You can edit prices, stock levels, and other details as needed
4. These parts will now appear when adding services and selecting checklist items

