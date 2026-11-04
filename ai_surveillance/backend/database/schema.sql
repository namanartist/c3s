-- PostgreSQL Schema for AI-Powered Surveillance & SOS Evidence System
-- File: ai_surveillance/backend/database/schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Cameras Grid Table
CREATE TABLE IF NOT EXISTS cameras (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    stream_url VARCHAR(512) NOT NULL,
    location VARCHAR(256) NOT NULL,
    campus_zone VARCHAR(64) DEFAULT 'Academic Sector',
    latitude DOUBLE PRECISION DEFAULT 26.23185102,
    longitude DOUBLE PRECISION DEFAULT 78.20636481,
    floor_level INTEGER DEFAULT 0,
    status VARCHAR(32) DEFAULT 'ONLINE', -- ONLINE, OFFLINE, DEGRADED
    fps DOUBLE PRECISION DEFAULT 30.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Aggression & Violence Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    camera_id VARCHAR(64) REFERENCES cameras(id) ON DELETE SET NULL,
    category VARCHAR(64) NOT NULL, -- punching, physical_fighting, etc.
    severity VARCHAR(32) NOT NULL, -- low, medium, high, critical
    confidence DOUBLE PRECISION NOT NULL, -- 0.00 to 1.00
    location VARCHAR(256) NOT NULL,
    duration_seconds DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(32) DEFAULT 'ALERT_SENT', -- ALERT_SENT, ACKNOWLEDGED, RESOLVED, FALSE_POSITIVE
    reported_by VARCHAR(128) DEFAULT 'AI Kaggle RWF-2000 Temporal Classifier',
    notes TEXT,
    resolved_by VARCHAR(128),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Evidentiary Media Records (Images, Videos, Hashes)
CREATE TABLE IF NOT EXISTS evidence_records (
    id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) REFERENCES incidents(id) ON DELETE CASCADE,
    media_type VARCHAR(32) NOT NULL, -- ORIGINAL_SNAPSHOT, ANNOTATED_SNAPSHOT, VIDEO_CLIP
    file_path VARCHAR(512) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    pre_buffer_seconds INTEGER DEFAULT 10,
    post_buffer_seconds INTEGER DEFAULT 25,
    is_tamper_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Incident Audit Log & Chain of Custody
CREATE TABLE IF NOT EXISTS incident_audit_logs (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(64) REFERENCES incidents(id) ON DELETE CASCADE,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(64) NOT NULL, -- PROCTOR, GUARD, ADMIN, SYSTEM
    action VARCHAR(64) NOT NULL, -- TRIGGERED, REVIEWED, FALSE_POSITIVE_MARKED, RESOLVED, EVIDENCE_DOWNLOADED
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ultra-fast query performance during live emergencies
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_incident_id ON evidence_records(incident_id);
CREATE INDEX IF NOT EXISTS idx_audit_incident_id ON incident_audit_logs(incident_id);

