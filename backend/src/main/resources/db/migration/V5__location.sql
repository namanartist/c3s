-- V5__location.sql: GPS Updates, Telemetry, and Campus Geofence
CREATE TABLE IF NOT EXISTS location_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, CLOSED
    reason VARCHAR(50) NOT NULL DEFAULT 'CAMPUS_PRESENCE' -- CAMPUS_PRESENCE, EMERGENCY
);

CREATE TABLE IF NOT EXISTS location_updates (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    provider VARCHAR(50) DEFAULT 'GPS',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    session_id UUID REFERENCES location_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_location_user_time ON location_updates(user_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS campus_geofences (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'POLYGON', -- POLYGON, CIRCLE
    center_latitude DOUBLE PRECISION,
    center_longitude DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION,
    coordinates_json TEXT, -- GeoJSON polygon coordinates
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);