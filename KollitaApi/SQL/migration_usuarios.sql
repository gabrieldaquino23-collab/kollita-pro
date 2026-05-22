-- ============================================================
-- KOLLITA PRO — MIGRACIÓN: Sistema de Autenticación JWT v2.0
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nombre TEXT NOT NULL DEFAULT '',
    rol TEXT NOT NULL DEFAULT 'Cliente',
    sucursal TEXT NOT NULL DEFAULT '',
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ultimo_acceso TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_sucursal ON usuarios(sucursal);

-- 2. Seed: usuarios iniciales (contraseña temporal: cambio1234)
-- En producción, cada usuario cambiará su contraseña al primer login.
INSERT INTO usuarios (email, password_hash, nombre, rol, sucursal) VALUES
    ('admin@kollita.com',     '$2a$12$LJ3m4ys3Lk0TSwHCpNqrEOqZGIk/GULB7wJkSzQ8iVfHPLDqxvxSu', 'Administrador', 'Omega', ''),
    ('senior@kollita.com',    '$2a$12$LJ3m4ys3Lk0TSwHCpNqrEOqZGIk/GULB7wJkSzQ8iVfHPLDqxvxSu', 'Senior Manager', 'Senior', ''),
    ('movil@kollita.com',     '$2a$12$LJ3m4ys3Lk0TSwHCpNqrEOqZGIk/GULB7wJkSzQ8iVfHPLDqxvxSu', 'Usuario Móvil', 'Cliente', '')
ON CONFLICT (email) DO NOTHING;

-- 3. Habilitar RLS en usuarios (solo service_role puede gestionar)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios service_role full access" ON usuarios;
CREATE POLICY "Usuarios service_role full access" ON usuarios
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios pueden leer su propio registro" ON usuarios;
CREATE POLICY "Usuarios pueden leer su propio registro" ON usuarios
    FOR SELECT
    TO anon, authenticated
    USING (email = current_setting('request.jwt.claims', true)::json->>'email');
