-- Run once on existing PostgreSQL databases.
CREATE TABLE IF NOT EXISTS user_job_type_access (
    access_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user_accounts(user_id) ON DELETE CASCADE,
    job_type_setting_id INTEGER NOT NULL REFERENCES system_settings(setting_id) ON DELETE CASCADE,
    created_by_user_id INTEGER REFERENCES user_accounts(user_id) ON DELETE SET NULL,
    created_ws VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_job_type_access UNIQUE (user_id, job_type_setting_id)
);

CREATE INDEX IF NOT EXISTS idx_user_job_type_access_user_id ON user_job_type_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_job_type_access_job_type_id ON user_job_type_access(job_type_setting_id);

