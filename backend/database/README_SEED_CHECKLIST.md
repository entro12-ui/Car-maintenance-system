# Seed Checklist Items

This script adds the standard service checklist items to all service types in the database.

## Checklist Items Added:

1. Engine Oil
2. Oil Filter
3. Air Filter
4. Spark Plugs
5. Throttle
6. Brake Pads
7. Coolant
8. AGS Oil
9. Gear Oil
10. CV Joint Grease
11. Fuel Pump
12. Electrical components
13. Computer diagnosis

## How to Run:

```bash
# Connect to your PostgreSQL database and run:
psql -U your_username -d your_database_name -f seed_checklist_items.sql

# Or using psql directly:
psql -d your_database_name
\i backend/database/seed_checklist_items.sql
```

## What it does:

- Adds all 13 checklist items to every existing service type
- Creates a "General Service" type if it doesn't exist
- Adds all checklist items to the General Service type
- Sets proper sort order for display
- Marks mandatory items (Engine Oil, Oil Filter, Air Filter, Brake Pads, Coolant)

## Notes:

- The script uses `ON CONFLICT DO NOTHING` to avoid duplicates
- You can run it multiple times safely
- Items are ordered by sort_order (0-12)

