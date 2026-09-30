-- V10__seed_data.sql: 3 Campus Gates, 10 Roles, Seed Users, Cameras, Responders
-- 1. Departments
INSERT INTO departments (id, code, name) VALUES
('d1111111-1111-1111-1111-111111111111', 'CSE', 'Computer Science & Engineering'),
('d2222222-2222-2222-2222-222222222222', 'ECE', 'Electronics & Communication'),
('d3333333-3333-3333-3333-333333333333', 'ADMIN', 'Campus Administration & Security')
ON CONFLICT (id) DO NOTHING;

-- 2. Roles
INSERT INTO roles (id, name, description) VALUES
('r1111111-1111-1111-1111-111111111111', 'ROLE_STUDENT', 'Student Role'),
('r2222222-2222-2222-2222-222222222222', 'ROLE_FACULTY', 'Faculty Member'),
('r3333333-3333-3333-3333-333333333333', 'ROLE_CLASS_COORDINATOR', 'Class Coordinator'),
('r4444444-4444-4444-4444-444444444444', 'ROLE_PROCTOR', 'Campus Proctor & Disciplinary Officer'),
('r5555555-5555-5555-5555-555555555555', 'ROLE_GATE_KEEPER', 'Gate Keeper Terminal Operator'),
('r6666666-6666-6666-6666-666666666666', 'ROLE_SECURITY_GUARD', 'Field Patrol & Rapid Response Guard'),
('r7777777-7777-7777-7777-777777777777', 'ROLE_CONTROL_ROOM_OPERATOR', 'Command Center SOC Operator'),
('r8888888-8888-8888-8888-888888888888', 'ROLE_HOD', 'Head of Department'),
('r9999999-9999-9999-9999-999999999999', 'ROLE_DEAN', 'Dean of Student Affairs & Administration'),
('raaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ROLE_SUPER_ADMIN', 'Super Administrator')
ON CONFLICT (id) DO NOTHING;

-- 3. Gates: The 3 Defined Campus Gates
INSERT INTO gates (id, gate_code, name, latitude, longitude, status, description) VALUES
('g1111111-1111-1111-1111-111111111111', 'GATE-JUBILEE', 'Jubilee Gate', 26.2195, 78.1810, 'ACTIVE', 'West Campus Entrance with Pedestrian Turnstiles'),
('g2222222-2222-2222-2222-222222222222', 'GATE-MAIN', 'Main Gate', 26.2178, 78.1832, 'ACTIVE', 'Primary Campus North Entrance & Vehicle Boom Barrier'),
('g3333333-3333-3333-3333-333333333333', 'GATE-PARKING', 'New Parking Gate', 26.2162, 78.1848, 'ACTIVE', 'South Parking & Transit Terminal')
ON CONFLICT (id) DO NOTHING;

-- 4. Geofence definition for MITS Gwalior Campus
INSERT INTO campus_geofences (id, name, type, center_latitude, center_longitude, radius_meters, coordinates_json, active) VALUES
('f1111111-1111-1111-1111-111111111111', 'MITS Main Campus Boundary', 'CIRCLE', 26.2183, 78.1828, 850.0, '[[26.215, 78.180], [26.222, 78.180], [26.222, 78.186], [26.215, 78.186]]', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Passwords: all demo users have password '$2a$10$7qYkG37F2x5sC9B1c0hJ1e3r3O1w.VqI0mK2eP0sO9aB2cD1eF3g' (BCrypt for 'password123')
INSERT INTO users (id, university_id, full_name, email, phone, password_hash, department_id, status) VALUES
('u1111111-1111-1111-1111-111111111111', 'BTCS2026-0842', 'Naman Lakhotia', 'naman.l@campus.edu', '+91 98765 43210', '$2a$10$7qYkG37F2x5sC9B1c0hJ1e3r3O1w.VqI0mK2eP0sO9aB2cD1eF3g', 'd1111111-1111-1111-1111-111111111111', 'ACTIVE'),
('u2222222-2222-2222-2222-222222222222', 'FAC-CS-104', 'Dr. Arvinder Sharma', 'asharma@campus.edu', '+91 98765 43211', '$2a$10$7qYkG37F2x5sC9B1c0hJ1e3r3O1w.VqI0mK2eP0sO9aB2cD1eF3g', 'd1111111-1111-1111-1111-111111111111', 'ACTIVE'),
('u3333333-3333-3333-3333-333333333333', 'CC-CS-302', 'Prof. Anjali Patel', 'apatel@campus.edu', '+91 98765 43212', '$2a$10$7qYkG37F2x5sC9B1c0hJ1e3r3O1w.VqI0mK2eP0sO9aB2cD1eF3g', 'd1111111-1111-1111-1111-111111111111', 'ACTIVE'),
('u4444444-4444-4444-4444-444444444444', 'PROC-SEC-01', 'Col. Rajesh Verma', 'proctor@campus.edu', '+91 98765 43213', '$2a$10$7qYkG37F2x5sC9B1c0hJ1e3r3O1w.VqI0mK2eP0sO9aB2cD1eF3g', 'd3333333-3333-3333-3333-333333333333', 'ACTIVE'),
('u5555555-5555-5555-5555-555555555555', 'GK-MG-01', 'Ramesh Singh', 'gate1@campus.edu', '+91 98765 43214', '$2a$10$7qYkG37F2x5sC9B1c0hJ1e3r3O1w.VqI0mK2eP0sO9aB2cD1eF3g', 'd3333333-3333-3333-3333-333333333333', 'ACTIVE'),
('u6666666-6666-6666-6666-666666666666', 'SEC-G02', 'Vikram Rathore', 'guard02@campus.edu', '+91 98765 43215', '$2a$10$7qYkG37F2x5sC9B1c0hJ1e3r3O1w.VqI0mK2eP0sO9aB2cD1eF3g', 'd3333333-3333-3333-3333-333333333333', 'ACTIVE'),
('u7777777-7777-7777-7777-777777777777', 'SOC-OP-01', 'Neha Gupta', 'soc@campus.edu', '+91 98765 43216', '$2a$10$7qYkG37F2x5sC9B1c0hJ1e3r3O1w.VqI0mK2eP0sO9aB2cD1eF3g', 'd3333333-3333-3333-3333-333333333333', 'ACTIVE'),
('u8888888-8888-8888-8888-888888888888', 'HOD-CS-01', 'Dr. Debabrata Mukherjee', 'hod.cs@campus.edu', '+91 98765 43217', '$2a$10$7qYkG37F2x5sC9B1c0hJ1e3r3O1w.VqI0mK2eP0sO9aB2cD1eF3g', 'd1111111-1111-1111-1111-111111111111', 'ACTIVE'),
('u9999999-9999-9999-9999-999999999999', 'DEAN-SW-01', 'Dr. Sujata Banerjee', 'dean.sw@campus.edu', '+91 98765 43218', '$2a$10$7qYkG37F2x5sC9B1c0hJ1e3r3O1w.VqI0mK2eP0sO9aB2cD1eF3g', 'd3333333-3333-3333-3333-333333333333', 'ACTIVE'),
('uaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SYS-ADM-001', 'System Administrator', 'admin@campus.edu', '+91 98765 43219', '$2a$10$7qYkG37F2x5sC9B1c0hJ1e3r3O1w.VqI0mK2eP0sO9aB2cD1eF3g', 'd3333333-3333-3333-3333-333333333333', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Map User to Roles
INSERT INTO user_roles (user_id, role_id) VALUES
('u1111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111'),
('u2222222-2222-2222-2222-222222222222', 'r2222222-2222-2222-2222-222222222222'),
('u3333333-3333-3333-3333-333333333333', 'r3333333-3333-3333-3333-333333333333'),
('u4444444-4444-4444-4444-444444444444', 'r4444444-4444-4444-4444-444444444444'),
('u5555555-5555-5555-5555-555555555555', 'r5555555-5555-5555-5555-555555555555'),
('u6666666-6666-6666-6666-666666666666', 'r6666666-6666-6666-6666-666666666666'),
('u7777777-7777-7777-7777-777777777777', 'r7777777-7777-7777-7777-777777777777'),
('u8888888-8888-8888-8888-888888888888', 'r8888888-8888-8888-8888-888888888888'),
('u9999999-9999-9999-9999-999999999999', 'r9999999-9999-9999-9999-999999999999'),
('uaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'raaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT DO NOTHING;

-- Initial Gate Keeper Assignment
INSERT INTO gate_keeper_assignments (id, gate_id, user_id, assigned_from, status) VALUES
('a1111111-1111-1111-1111-111111111111', 'g2222222-2222-2222-2222-222222222222', 'u5555555-5555-5555-5555-555555555555', CURRENT_TIMESTAMP, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Initial Security Personnel
INSERT INTO security_personnel (id, user_id, employee_code, callsign, designation, status, radio_channel, vehicle, current_latitude, current_longitude) VALUES
('p1111111-1111-1111-1111-111111111111', 'u6666666-6666-6666-6666-666666666666', 'SEC-002', 'Guard 02', 'Rapid Patrol Officer', 'AVAILABLE', 'CH-4', 'Electric Patrol Bike #2', 26.2180, 78.1824)
ON CONFLICT (id) DO NOTHING;

-- Initial User Campus Status
INSERT INTO user_campus_status (user_id, status, last_gate_id, last_changed_at) VALUES
('u1111111-1111-1111-1111-111111111111', 'INSIDE', 'g2222222-2222-2222-2222-222222222222', CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO NOTHING;

-- Seed Cameras
INSERT INTO cameras (id, camera_code, name, gate_id, building, zone, latitude, longitude, status, stream_reference, ip_address, resolution, fps, ptz_capable) VALUES
('c1111111-1111-1111-1111-111111111111', 'CAM-01', 'Main Gate - Pedestrian Entry', 'g2222222-2222-2222-2222-222222222222', 'Gate 2 Kiosk', 'Main Gate Zone', 26.2178, 78.1832, 'ONLINE', 'rtsp://stream.c3s.campus/cam01', '10.20.101.11', '1080p FHD', 30, true),
('c2222222-2222-2222-2222-222222222222', 'CAM-02', 'Main Gate - Vehicle Boom Barrier', 'g2222222-2222-2222-2222-222222222222', 'Gate 2 Vehicle Lane', 'Main Gate Zone', 26.2179, 78.1833, 'ONLINE', 'rtsp://stream.c3s.campus/cam02', '10.20.101.12', '4K UltraHD', 60, true),
('c3333333-3333-3333-3333-333333333333', 'CAM-03', 'Jubilee Gate - West Access', 'g1111111-1111-1111-1111-111111111111', 'West Security Post', 'Jubilee Gate Zone', 26.2195, 78.1810, 'OFFLINE', 'rtsp://stream.c3s.campus/cam03', '10.20.102.15', '1080p FHD', 30, false),
('c4444444-4444-4444-4444-444444444444', 'CAM-04', 'Academic Block A - Central Atrium', null, 'Academic Block A', 'Academic Zone', 26.2183, 78.1828, 'ONLINE', 'rtsp://stream.c3s.campus/cam04', '10.20.103.21', '1080p FHD', 30, true)
ON CONFLICT (id) DO NOTHING;