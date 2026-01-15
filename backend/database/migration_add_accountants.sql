-- Migration: Add Accountants Table
-- This script creates the accountants table for accountant role support

CREATE TABLE IF NOT EXISTS accountants (
    accountant_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(50),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accountant_email ON accountants(email);
CREATE INDEX IF NOT EXISTS idx_accountant_phone ON accountants(phone);
CREATE INDEX IF NOT EXISTS idx_accountant_active ON accountants(is_active);

-- Note: The user_role enum in user_accounts table may need to be updated
-- to include 'Accountant' if it's using an ENUM type.
-- For PostgreSQL, you may need to run:
-- ALTER TYPE user_role ADD VALUE 'Accountant';

