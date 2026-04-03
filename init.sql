-- =============================================================
-- LastSignal — Script de inicialización de base de datos
-- PostgreSQL 16
-- =============================================================

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

-- =============================================================
-- TABLAS
-- =============================================================

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(80)  UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role_enum NOT NULL DEFAULT 'ASTRONAUT',
    display_name    VARCHAR(120),
    avatar_url      TEXT,
    level           INTEGER NOT NULL DEFAULT 1,
    experience_pts  INTEGER NOT NULL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS resources (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(120) NOT NULL,
    category       resource_category_enum NOT NULL,
    unit           resource_unit_enum NOT NULL,
    current_amount FLOAT NOT NULL,
    min_threshold  FLOAT NOT NULL,
    is_critical    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP DEFAULT NOW(),
    user_id        UUID NOT NULL REFERENCES users(id)
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

CREATE TABLE IF NOT EXISTS resource_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type        resource_log_type_enum NOT NULL,
    amount      FLOAT NOT NULL,
    reason      VARCHAR(255),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW(),
    resource_id UUID NOT NULL REFERENCES resources(id),
    trip_id     UUID REFERENCES trips(id)
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
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount         FLOAT NOT NULL,
    supply_drop_id UUID NOT NULL REFERENCES supply_drops(id),
    resource_id    UUID NOT NULL REFERENCES resources(id)
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

-- UUIDs fijos para poder referenciarlos entre tablas
-- Usuario astronauta principal
INSERT INTO users (id, username, password_hash, role, display_name, level, experience_pts)
VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'nova',
    '$2b$12$placeholder_hash_not_used_keycloak_handles_auth',
    'ASTRONAUT',
    'Cdr. Nova',
    3,
    420
);

-- Usuario admin (para gestión de suministros NASA)
INSERT INTO users (id, username, password_hash, role, display_name, level, experience_pts)
VALUES (
    'a1000000-0000-0000-0000-000000000002',
    'houston',
    '$2b$12$placeholder_hash_not_used_keycloak_handles_auth',
    'ADMIN',
    'Houston Control',
    1,
    0
);

-- -------------------------------------------------------------
-- RECURSOS
-- -------------------------------------------------------------

INSERT INTO resources (id, name, category, unit, current_amount, min_threshold, is_critical, user_id)
VALUES
    -- Críticos (siempre visibles en CriticalResourceBar)
    ('b1000000-0000-0000-0000-000000000001', 'Oxígeno',        'VITAL',     'PERCENTAGE', 78.5,  20.0, TRUE,  'a1000000-0000-0000-0000-000000000001'),
    ('b1000000-0000-0000-0000-000000000002', 'Agua',           'VITAL',     'LITERS',     42.0,  10.0, TRUE,  'a1000000-0000-0000-0000-000000000001'),
    ('b1000000-0000-0000-0000-000000000003', 'Raciones',       'FOOD',      'CALORIES',   9500,  2000, TRUE,  'a1000000-0000-0000-0000-000000000001'),
    -- No críticos
    ('b1000000-0000-0000-0000-000000000004', 'Combustible',    'FUEL',      'LITERS',     55.0,  15.0, FALSE, 'a1000000-0000-0000-0000-000000000001'),
    ('b1000000-0000-0000-0000-000000000005', 'Botiquín',       'MEDICAL',   'UNITS',      8.0,   2.0,  FALSE, 'a1000000-0000-0000-0000-000000000001'),
    ('b1000000-0000-0000-0000-000000000006', 'Baterías',       'EQUIPMENT', 'UNITS',      12.0,  3.0,  FALSE, 'a1000000-0000-0000-0000-000000000001'),
    -- Recurso en alerta (bajo el umbral para probar alertas)
    ('b1000000-0000-0000-0000-000000000007', 'Píldoras Radio', 'MEDICAL',   'UNITS',      1.0,   3.0,  FALSE, 'a1000000-0000-0000-0000-000000000001');

-- -------------------------------------------------------------
-- BITÁCORA
-- -------------------------------------------------------------

INSERT INTO logbook_entries (id, photo_url, description, classification, danger_level, ai_confidence, is_ai_reviewed, user_id)
VALUES
    (
        'c1000000-0000-0000-0000-000000000001',
        'https://placeholder.lastsignal/photos/entry1.jpg',
        'Criatura de cuatro extremidades con piel azul traslúcida. Se mueve lentamente entre las rocas y emite destellos bioluminiscentes cuando se siente amenazada.',
        'ANIMAL',
        'UNKNOWN',
        0.87,
        TRUE,
        'a1000000-0000-0000-0000-000000000001'
    ),
    (
        'c1000000-0000-0000-0000-000000000002',
        'https://placeholder.lastsignal/photos/entry2.jpg',
        'Formación vegetal de color naranja intenso con hojas en espiral. Crece en zonas húmedas cerca del cráter norte. No reacciona al contacto.',
        'PLANT',
        'FRIENDLY',
        0.92,
        TRUE,
        'a1000000-0000-0000-0000-000000000001'
    ),
    (
        'c1000000-0000-0000-0000-000000000003',
        'https://placeholder.lastsignal/photos/entry3.jpg',
        'Hongo gigante de aproximadamente 2 metros de altura. Libera esporas al caminar cerca. Efecto en sistemas biológicos desconocido.',
        'FUNGI',
        'DANGEROUS',
        0.78,
        FALSE,
        'a1000000-0000-0000-0000-000000000001'
    ),
    (
        'c1000000-0000-0000-0000-000000000004',
        'https://placeholder.lastsignal/photos/entry4.jpg',
        'Mineral cristalino de color verde con estructura hexagonal perfecta. Alta conductividad eléctrica detectada con el escáner.',
        'MINERAL',
        'FRIENDLY',
        0.95,
        TRUE,
        'a1000000-0000-0000-0000-000000000001'
    ),
    (
        'c1000000-0000-0000-0000-000000000005',
        'https://placeholder.lastsignal/photos/entry5.jpg',
        'Organismo sin clasificación clara. Estructura celular visible pero no coincide con ninguna categoría conocida. Requiere análisis adicional.',
        'UNKNOWN_ORGANISM',
        'UNKNOWN',
        0.34,
        FALSE,
        'a1000000-0000-0000-0000-000000000001'
    );

-- -------------------------------------------------------------
-- VIAJES
-- -------------------------------------------------------------

INSERT INTO trips (id, destination, notes, started_at, ended_at, initial_oxygen, oxygen_consumed, status, user_id)
VALUES
    (
        'd1000000-0000-0000-0000-000000000001',
        'Cráter Norte',
        'Exploración de la zona húmeda. Se encontró la planta naranja y el hongo gigante.',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '3 days' + INTERVAL '4 hours',
        100.0,
        22.5,
        'COMPLETED',
        'a1000000-0000-0000-0000-000000000001'
    ),
    (
        'd1000000-0000-0000-0000-000000000002',
        'Llanura Este',
        'Reconocimiento de nueva zona. Señal débil de suministro NASA detectada.',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day' + INTERVAL '2 hours',
        100.0,
        11.0,
        'COMPLETED',
        'a1000000-0000-0000-0000-000000000001'
    );

-- Log de consumo de oxígeno del primer viaje
INSERT INTO resource_logs (resource_id, type, amount, reason, trip_id)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'EXPENSE', 22.5, 'Consumo durante viaje a Cráter Norte', 'd1000000-0000-0000-0000-000000000001'),
    ('b1000000-0000-0000-0000-000000000004', 'EXPENSE', 8.0,  'Combustible usado en viaje a Cráter Norte', 'd1000000-0000-0000-0000-000000000001'),
    ('b1000000-0000-0000-0000-000000000001', 'EXPENSE', 11.0, 'Consumo durante viaje a Llanura Este', 'd1000000-0000-0000-0000-000000000002'),
    -- Recargas de base
    ('b1000000-0000-0000-0000-000000000002', 'INTAKE',  5.0,  'Recolección de agua en condensador', NULL),
    ('b1000000-0000-0000-0000-000000000003', 'EXPENSE', 500,  'Consumo diario de raciones', NULL);

-- -------------------------------------------------------------
-- SUPPLY DROPS
-- -------------------------------------------------------------

INSERT INTO supply_drops (id, latitude, longitude, status)
VALUES
    ('e1000000-0000-0000-0000-000000000001', 14.2350,  -87.2030, 'AVAILABLE'),
    ('e1000000-0000-0000-0000-000000000002', 14.2510,  -87.1890, 'AVAILABLE'),
    ('e1000000-0000-0000-0000-000000000003', 14.2180,  -87.2210, 'COLLECTED');

-- Contenido de los supply drops
INSERT INTO supply_drop_items (supply_drop_id, resource_id, amount)
VALUES
    -- Drop 1: agua + raciones
    ('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 10.0),
    ('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 3000),
    -- Drop 2: botiquín + baterías
    ('e1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005', 3.0),
    ('e1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000006', 4.0),
    -- Drop 3 (ya recolectado): combustible
    ('e1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 20.0);

-- Marcar drop 3 como recolectado
UPDATE supply_drops
SET
    status       = 'COLLECTED',
    collected_by = 'a1000000-0000-0000-0000-000000000001',
    collected_at = NOW() - INTERVAL '2 days',
    trip_id      = 'd1000000-0000-0000-0000-000000000001'
WHERE id = 'e1000000-0000-0000-0000-000000000003';

-- -------------------------------------------------------------
-- LOGROS
-- -------------------------------------------------------------

INSERT INTO achievements (id, key, name, description)
VALUES
    ('f1000000-0000-0000-0000-000000000001', 'FIRST_DISCOVERY', 'Primera Descubrimiento',  'Registraste tu primera forma de vida en la bitácora'),
    ('f1000000-0000-0000-0000-000000000002', 'TEN_ENTRIES',     'Explorador Dedicado',      'Registraste 10 formas de vida'),
    ('f1000000-0000-0000-0000-000000000003', 'EXPLORER_25',     'Explorador Experto',       'Registraste 25 formas de vida'),
    ('f1000000-0000-0000-0000-000000000004', 'FIRST_TRIP',      'Primer Viaje',             'Completaste tu primer viaje de exploración'),
    ('f1000000-0000-0000-0000-000000000005', 'VETERAN_TRIPS',   'Veterano',                 'Completaste 5 viajes de exploración'),
    ('f1000000-0000-0000-0000-000000000006', 'SURVIVOR',        'Superviviente',            'Mantuviste todos los recursos críticos por encima del mínimo');

-- Nova ya desbloqueó dos logros
INSERT INTO user_achievements (user_id, achievement_id, earned_at)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days'),
    ('a1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000004', NOW() - INTERVAL '3 days');