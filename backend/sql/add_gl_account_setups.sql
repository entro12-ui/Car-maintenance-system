CREATE TABLE IF NOT EXISTS gl_account_setups (
    setup_id SERIAL PRIMARY KEY,
    material_type VARCHAR(30) NOT NULL,
    parts_group_code VARCHAR(80),
    service_type_id INTEGER REFERENCES service_types(service_type_id) ON DELETE SET NULL,
    maintenance_section VARCHAR(120),
    job_type VARCHAR(120),
    garage_location VARCHAR(120),
    stock_account_id INTEGER REFERENCES gl_accounts(account_id) ON DELETE SET NULL,
    wip_account_id INTEGER REFERENCES gl_accounts(account_id) ON DELETE SET NULL,
    cgs_account_id INTEGER REFERENCES gl_accounts(account_id) ON DELETE SET NULL,
    sales_account_id INTEGER REFERENCES gl_accounts(account_id) ON DELETE SET NULL,
    discount_account_id INTEGER REFERENCES gl_accounts(account_id) ON DELETE SET NULL,
    vat_account_id INTEGER REFERENCES gl_accounts(account_id) ON DELETE SET NULL,
    created_by_user_id INTEGER REFERENCES user_accounts(user_id) ON DELETE SET NULL,
    updated_by_user_id INTEGER REFERENCES user_accounts(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gl_account_setup_scope UNIQUE (
        material_type,
        parts_group_code,
        service_type_id,
        maintenance_section,
        job_type,
        garage_location
    )
);

CREATE INDEX IF NOT EXISTS idx_gl_account_setups_material_type ON gl_account_setups(material_type);
