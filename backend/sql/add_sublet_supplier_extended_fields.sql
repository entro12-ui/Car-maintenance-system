-- Sublet supplier master (HillMaster-style extended contact + GL references).
ALTER TABLE sublet_work_suppliers
  ADD COLUMN IF NOT EXISTS contact_person VARCHAR(200),
  ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(200),
  ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(200),
  ADD COLUMN IF NOT EXISTS address_line3 VARCHAR(200),
  ADD COLUMN IF NOT EXISTS po_box VARCHAR(80),
  ADD COLUMN IF NOT EXISTS fax_no VARCHAR(50),
  ADD COLUMN IF NOT EXISTS supplier_coa_1 VARCHAR(80),
  ADD COLUMN IF NOT EXISTS supplier_coa_2 VARCHAR(80),
  ADD COLUMN IF NOT EXISTS auto_approve_orders BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS account_description VARCHAR(500);
