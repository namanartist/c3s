-- V3__gates.sql: Three Campus Gates and Dynamic Daily QR
CREATE TABLE IF NOT EXISTS gates (
    id UUID PRIMARY KEY,
    gate_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, MAINTENANCE
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gate_keeper_assignments (
    id UUID PRIMARY KEY,
    gate_id UUID NOT NULL REFERENCES gates(id),
    user_id UUID NOT NULL REFERENCES users(id),
    assigned_from TIMESTAMP WITH TIME ZONE NOT NULL,
    assigned_until TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gk_user_gate ON gate_keeper_assignments(user_id, gate_id);

CREATE TABLE IF NOT EXISTS gate_qr_tokens (
    id UUID PRIMARY KEY,
    gate_id UUID NOT NULL REFERENCES gates(id),
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    token_version VARCHAR(50) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, REVOKED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qr_gate_validity ON gate_qr_tokens(gate_id, status, valid_until);