-- V9__audit.sql: Audit Trail, Overrides, and Evidence Storage
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    actor_id UUID REFERENCES users(id),
    actor_role VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    result VARCHAR(50) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, FAILED
    metadata TEXT
);

CREATE INDEX idx_audit_time ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);

CREATE TABLE IF NOT EXISTS emergency_overrides (
    id UUID PRIMARY KEY,
    type VARCHAR(100) NOT NULL, -- CAMPUS_LOCKDOWN, EVACUATION, EMERGENCY_EXIT, GATE_CLOSURE
    reason TEXT NOT NULL,
    actor_id UUID NOT NULL REFERENCES users(id),
    scope VARCHAR(100) NOT NULL DEFAULT 'CAMPUS_WIDE',
    gate_id UUID REFERENCES gates(id),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    storage_reference VARCHAR(500) NOT NULL,
    sha256_hash VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);