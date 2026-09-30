-- V4__movement.sql: Check-In/Check-Out Events, State Tracking, Idempotency
CREATE TABLE IF NOT EXISTS movement_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    gate_id UUID NOT NULL REFERENCES gates(id),
    qr_token_id UUID REFERENCES gate_qr_tokens(id),
    movement_type VARCHAR(50) NOT NULL, -- CHECK_IN, CHECK_OUT
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    device_id VARCHAR(100),
    verification_status VARCHAR(50) NOT NULL DEFAULT 'VERIFIED', -- VERIFIED, REJECTED, OVERRIDDEN
    rejection_reason VARCHAR(255),
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movement_user ON movement_events(user_id, timestamp);
CREATE INDEX idx_movement_gate ON movement_events(gate_id, timestamp);

CREATE TABLE IF NOT EXISTS user_campus_status (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'OUTSIDE', -- INSIDE, OUTSIDE, UNKNOWN
    last_gate_id UUID REFERENCES gates(id),
    last_movement_id UUID REFERENCES movement_events(id),
    last_changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);