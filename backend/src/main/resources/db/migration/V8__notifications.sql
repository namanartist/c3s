-- V8__notifications.sql: Real-Time & Persisted In-App Alerts
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- SECURITY, SOS, INCIDENT, GATE, SYSTEM
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'NORMAL', -- CRITICAL, HIGH, NORMAL
    read BOOLEAN NOT NULL DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_recipient ON notifications(recipient_id, read);