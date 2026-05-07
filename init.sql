-- =============================================================
-- LastSignal — Script de inicialización de base de datos
-- PostgreSQL
-- =============================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE user_role_enum AS ENUM ('ASTRONAUT', 'ADMIN');
CREATE TYPE life_form_category_enum AS ENUM ('ANIMAL', 'PLANT', 'RESOURCE', 'MINERAL', 'FUNGI', 'UNKNOWN_ORGANISM');
CREATE TYPE danger_level_enum AS ENUM ('DANGEROUS', 'FRIENDLY', 'UNKNOWN');
CREATE TYPE sync_status_enum AS ENUM ('SYNCED', 'PENDING', 'FAILED');
CREATE TYPE resource_category_enum AS ENUM ('VITAL', 'FOOD', 'EQUIPMENT', 'MEDICAL', 'FUEL');
CREATE TYPE resource_unit_enum AS ENUM ('LITERS', 'KILOGRAMS', 'UNITS', 'PERCENTAGE', 'GRAMS', 'CALORIES');
CREATE TYPE resource_log_type_enum AS ENUM ('INTAKE', 'EXPENSE');
CREATE TYPE supply_drop_status_enum AS ENUM ('AVAILABLE', 'COLLECTED');
CREATE TYPE trip_status_enum AS ENUM ('ACTIVE', 'COMPLETED');
CREATE TYPE waypoint_status_enum AS ENUM ('PENDING', 'REACHED');
CREATE TYPE danger_severity_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- =============================================================
-- TABLAS
-- =============================================================

CREATE TABLE IF NOT EXISTS ship_bases (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(120),
    latitude    FLOAT NOT NULL,
    longitude   FLOAT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(80) UNIQUE,
    role            user_role_enum NOT NULL DEFAULT 'ASTRONAUT',
    display_name    VARCHAR(120),
    avatar_url      TEXT,
    level           INTEGER NOT NULL DEFAULT 1,
    experience_pts  INTEGER NOT NULL DEFAULT 0,
    ship_base_id    UUID REFERENCES ship_bases(id),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logbook_entries (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_url        TEXT NOT NULL,
    description      TEXT NOT NULL,
    classification   life_form_category_enum NOT NULL,
    danger_level     danger_level_enum NOT NULL DEFAULT 'UNKNOWN',
    audio_url        TEXT,
    ai_confidence    FLOAT,
    ai_raw_response  TEXT,
    is_ai_reviewed   BOOLEAN NOT NULL DEFAULT FALSE,
    sync_status      sync_status_enum NOT NULL DEFAULT 'SYNCED',
    is_downloaded    BOOLEAN NOT NULL DEFAULT FALSE,
    downloaded_until TIMESTAMP,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW(),
    user_id          UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS life_form_searches (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_url        TEXT NOT NULL,
    matched_entry_id UUID REFERENCES logbook_entries(id),
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW(),
    user_id          UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS base_resources (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(120) NOT NULL,
    category      resource_category_enum NOT NULL,
    unit          resource_unit_enum NOT NULL,
    min_threshold FLOAT NOT NULL,
    is_critical   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_resources (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_resource_id UUID NOT NULL REFERENCES base_resources(id),
    current_amount   FLOAT NOT NULL,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW(),
    user_id          UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS base_storage (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_resource_id UUID NOT NULL REFERENCES base_resources(id),
    current_amount   FLOAT NOT NULL,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW(),
    ship_base_id     UUID NOT NULL REFERENCES ship_bases(id)
);

CREATE TABLE IF NOT EXISTS trips (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination     VARCHAR(255),
    notes           TEXT,
    started_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMP,
    initial_oxygen  FLOAT NOT NULL,
    oxygen_consumed FLOAT NOT NULL DEFAULT 0,
    status          trip_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    user_id         UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS trip_waypoints (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255),
    latitude    FLOAT NOT NULL,
    longitude   FLOAT NOT NULL,
    status      waypoint_status_enum NOT NULL DEFAULT 'PENDING',
    reached_at  TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW(),
    trip_id     UUID NOT NULL REFERENCES trips(id)
);

CREATE TABLE IF NOT EXISTS trip_danger_zones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description VARCHAR(255),
    latitude    FLOAT NOT NULL,
    longitude   FLOAT NOT NULL,
    severity    danger_severity_enum NOT NULL DEFAULT 'MEDIUM',
    created_at  TIMESTAMP DEFAULT NOW(),
    trip_id     UUID NOT NULL REFERENCES trips(id)
);

CREATE TABLE IF NOT EXISTS resource_logs (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type                  resource_log_type_enum NOT NULL,
    amount                FLOAT NOT NULL,
    reason                VARCHAR(255),
    created_at            TIMESTAMP DEFAULT NOW(),
    updated_at            TIMESTAMP DEFAULT NOW(),
    inventory_resource_id UUID REFERENCES inventory_resources(id),
    base_storage_id       UUID REFERENCES base_storage(id),
    trip_id               UUID REFERENCES trips(id)
);

CREATE TABLE IF NOT EXISTS supply_drops (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude     FLOAT NOT NULL,
    longitude    FLOAT NOT NULL,
    status       supply_drop_status_enum NOT NULL DEFAULT 'AVAILABLE',
    collected_at TIMESTAMP,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW(),
    trip_id      UUID REFERENCES trips(id),
    collected_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS supply_drop_items (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount           FLOAT NOT NULL,
    supply_drop_id   UUID NOT NULL REFERENCES supply_drops(id),
    base_resource_id UUID NOT NULL REFERENCES base_resources(id)
);

CREATE TABLE IF NOT EXISTS achievements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         VARCHAR(80) UNIQUE NOT NULL,
    name        VARCHAR(120) NOT NULL,
    description TEXT,
    icon_url    TEXT
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    earned_at      TIMESTAMP DEFAULT NOW(),
    user_id        UUID NOT NULL REFERENCES users(id),
    achievement_id UUID NOT NULL REFERENCES achievements(id)
);

-- =============================================================
-- DATOS DE PRUEBA
-- =============================================================

-- SHIP BASE
INSERT INTO ship_bases (id, name, latitude, longitude)
VALUES ('c3a1f4c8-5c8d-4b7e-9f02-6a3a2b6c9d01', 'Nave Sigma-7', 9.9281, -84.0907);

-- USERS
INSERT INTO users (id, username, role, display_name, level, experience_pts, ship_base_id)
VALUES ('6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111', 'nova', 'ASTRONAUT', 'Cdr. Nova', 3, 420, 'c3a1f4c8-5c8d-4b7e-9f02-6a3a2b6c9d01');

INSERT INTO users (id, username, role, display_name, level, experience_pts)
VALUES ('bb62a2d5-6c5e-4f4c-a8fa-9c17a9d2b222', 'houston', 'ADMIN', 'Houston Control', 1, 0);

-- BASE RESOURCES
INSERT INTO base_resources (id, name, category, unit, min_threshold, is_critical)
VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Oxígeno',      'VITAL',      'PERCENTAGE', 20.0, TRUE),
('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Agua',          'VITAL',      'LITERS',     10.0, TRUE),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Raciones',      'FOOD',       'CALORIES',   2000, FALSE),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'Combustible',   'FUEL',       'LITERS',     15.0, FALSE),
('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'Botiquín',      'MEDICAL',    'UNITS',       2.0, FALSE),
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'Baterías',      'EQUIPMENT',  'UNITS',       3.0, FALSE),
('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', 'Píldoras Radio','MEDICAL',    'UNITS',       3.0, FALSE);

-- INVENTORY RESOURCES (usuario nova)
INSERT INTO inventory_resources (id, base_resource_id, current_amount, user_id)
VALUES
('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 85.0,  '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111'),
('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 22.5,  '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111'),
('d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 4800.0,'6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111'),
('e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 40.0,  '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111'),
('f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 5.0,   '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111'),
('a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d', 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 8.0,   '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111'),
('b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e', 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', 6.0,   '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111');

-- BASE STORAGE (Nave Sigma-7)
INSERT INTO base_storage (id, base_resource_id, current_amount, ship_base_id)
VALUES
('c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 95.0,   'c3a1f4c8-5c8d-4b7e-9f02-6a3a2b6c9d01'),
('d6e7f8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 150.0,  'c3a1f4c8-5c8d-4b7e-9f02-6a3a2b6c9d01'),
('e7f8a9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 30000.0,'c3a1f4c8-5c8d-4b7e-9f02-6a3a2b6c9d01'),
('f8a9b0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c', 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 500.0,  'c3a1f4c8-5c8d-4b7e-9f02-6a3a2b6c9d01'),
('a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d', 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 20.0,   'c3a1f4c8-5c8d-4b7e-9f02-6a3a2b6c9d01'),
('b0c1d2e3-f4a5-4b6c-7d8e-9f0a1b2c3d4e', 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 50.0,   'c3a1f4c8-5c8d-4b7e-9f02-6a3a2b6c9d01'),
('c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', 30.0,   'c3a1f4c8-5c8d-4b7e-9f02-6a3a2b6c9d01');

-- LOGBOOK ENTRIES
INSERT INTO logbook_entries (id, photo_url, description, classification, danger_level, ai_confidence, is_ai_reviewed, sync_status, user_id)
VALUES
('d2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a',
 'https://storage.lastsignal.app/entries/flora-azul-01.jpg',
 'Planta bioluminiscente de color azul encontrada cerca de la cuenca norte. Parece fotosensible.',
 'PLANT', 'UNKNOWN', 0.87, TRUE, 'SYNCED',
 '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111'),

('e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b',
 'https://storage.lastsignal.app/entries/criatura-roca-02.jpg',
 'Organismo del tamaño de un puño camuflado entre rocas volcánicas. Emite calor.',
 'ANIMAL', 'UNKNOWN', 0.72, FALSE, 'SYNCED',
 '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111'),

('f4a5b6c7-d8e9-4f0a-1b2c-3d4e5f6a7b8c',
 'https://storage.lastsignal.app/entries/hongo-rojo-03.jpg',
 'Colonia de hongos rojizos hallada bajo la roca porosa. Olor acre y picante.',
 'FUNGI', 'DANGEROUS', 0.91, TRUE, 'SYNCED',
 '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111');

-- LIFE FORM SEARCHES
INSERT INTO life_form_searches (id, photo_url, matched_entry_id, user_id)
VALUES
('a5b6c7d8-e9f0-4a1b-2c3d-4e5f6a7b8c9d',
 'https://storage.lastsignal.app/searches/busqueda-planta-01.jpg',
 'd2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a',
 '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111'),

('b6c7d8e9-f0a1-4b2c-3d4e-5f6a7b8c9d0e',
 'https://storage.lastsignal.app/searches/busqueda-roca-02.jpg',
 NULL,
 '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111');

-- TRIPS
INSERT INTO trips (id, destination, notes, started_at, initial_oxygen, oxygen_consumed, status, user_id)
VALUES
('c7d8e9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f',
 'Cuenca Norte — Zona de exploración A',
 'Primera salida. Terreno rocoso, viento moderado del este.',
 NOW() - INTERVAL '2 days',
 90.0, 12.5, 'COMPLETED',
 '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111'),

('d8e9f0a1-b2c3-4d4e-5f6a-7b8c9d0e1f2a',
 'Cráter Secundario — Reconocimiento',
 'Misión activa. Detectadas anomalías de temperatura en sector 3.',
 NOW() - INTERVAL '4 hours',
 88.0, 3.2, 'ACTIVE',
 '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111');

-- TRIP WAYPOINTS
INSERT INTO trip_waypoints (id, name, latitude, longitude, status, reached_at, trip_id)
VALUES
('e9f0a1b2-c3d4-4e5f-6a7b-8c9d0e1f2a3b', 'Punto de partida',    9.9310, -84.0950, 'REACHED', NOW() - INTERVAL '2 days',    'c7d8e9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f'),
('f0a1b2c3-d4e5-4f6a-7b8c-9d0e1f2a3b4c', 'Cuenca Norte A-1',    9.9450, -84.1100, 'REACHED', NOW() - INTERVAL '47 hours',   'c7d8e9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Punto de retorno',    9.9285, -84.0912, 'REACHED', NOW() - INTERVAL '44 hours',   'c7d8e9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f'),
('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Base de lanzamiento', 9.9300, -84.0930, 'REACHED', NOW() - INTERVAL '4 hours',    'd8e9f0a1-b2c3-4d4e-5f6a-7b8c9d0e1f2a'),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Sector Cráter 3',     9.9600, -84.1250, 'PENDING', NULL,                          'd8e9f0a1-b2c3-4d4e-5f6a-7b8c9d0e1f2a');

-- TRIP DANGER ZONES
INSERT INTO trip_danger_zones (id, description, latitude, longitude, severity, trip_id)
VALUES
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
 'Colonia de hongos peligrosos en roca porosa',
 9.9420, -84.1080, 'HIGH',
 'c7d8e9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f'),

('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
 'Grietas con emisiones de gas desconocido',
 9.9580, -84.1220, 'MEDIUM',
 'd8e9f0a1-b2c3-4d4e-5f6a-7b8c9d0e1f2a');

-- RESOURCE LOGS
INSERT INTO resource_logs (id, type, amount, reason, inventory_resource_id, trip_id)
VALUES
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
 'EXPENSE', 12.5, 'Consumo durante misión Cuenca Norte',
 'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
 'c7d8e9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f'),

('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
 'EXPENSE', 3.2, 'Consumo parcial misión Cráter Secundario',
 'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
 'd8e9f0a1-b2c3-4d4e-5f6a-7b8c9d0e1f2a'),

('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
 'INTAKE', 5.0, 'Reabastecimiento de agua post-misión',
 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
 NULL);

-- SUPPLY DROPS
INSERT INTO supply_drops (id, latitude, longitude, status, trip_id)
VALUES
('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
 9.9480, -84.1150, 'AVAILABLE',
 'd8e9f0a1-b2c3-4d4e-5f6a-7b8c9d0e1f2a'),

('d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a',
 9.9350, -84.1000, 'COLLECTED',
 'c7d8e9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f');

UPDATE supply_drops
SET collected_at = NOW() - INTERVAL '45 hours',
    collected_by = '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111'
WHERE id = 'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a';

-- SUPPLY DROP ITEMS
INSERT INTO supply_drop_items (id, amount, supply_drop_id, base_resource_id)
VALUES
('e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', 10.0,  'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'),
('f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', 3.0,   'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b'),
('a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d', 1500.0,'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'),
('b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e', 8.0,   'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'),
('c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', 4.0,   'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c');

-- ACHIEVEMENTS
INSERT INTO achievements (id, key, name, description)
VALUES
('d6e7f8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a',
 'FIRST_ENTRY',        'Primera bitácora',
 'Registra tu primera forma de vida en el planeta.'),

('e7f8a9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b',
 'FIRST_TRIP',         'Primera expedición',
 'Completa tu primera misión de exploración.'),

('f8a9b0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c',
 'DANGER_SURVIVOR',    'Superviviente',
 'Regresa a la base tras encontrar una zona de peligro alto.'),

('a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d',
 'SUPPLY_COLLECTOR',   'Recolector',
 'Recoge tu primer supply drop durante una misión.'),

('b0c1d2e3-f4a5-4b6c-7d8e-9f0a1b2c3d4e',
 'LEVEL_5',            'Explorador veterano',
 'Alcanza el nivel 5.');

-- USER ACHIEVEMENTS
INSERT INTO user_achievements (id, earned_at, user_id, achievement_id)
VALUES
('c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
 NOW() - INTERVAL '10 days',
 '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111',
 'd6e7f8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a'),

('d2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6b',
 NOW() - INTERVAL '2 days',
 '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111',
 'e7f8a9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b'),

('e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7c',
 NOW() - INTERVAL '2 days',
 '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111',
 'f8a9b0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c'),

('f4a5b6c7-d8e9-4f0a-1b2c-3d4e5f6a7b8d',
 NOW() - INTERVAL '45 hours',
 '6c0a9b5e-0b6d-4a52-b2fd-8e77d9cfa111',
 'a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d');