-- docker/init/06-settings.sql
-- Migración incremental: agrega el schema `settings` con el perfil de la
-- empresa (usado en el comprobante) y el permiso para editarlo.
--
-- Como tu base YA está corriendo, este archivo no se auto-ejecuta solo
-- (el mecanismo de docker/init/ solo corre en la primera creación del
-- volumen) — hay que aplicarlo a mano una vez:
--
--   docker exec -i rider_store_pg psql -U admin_rider -d rider_store_db < docker\init\06-settings.sql
--
-- Es idempotente: correrlo de nuevo no duplica ni rompe nada.

CREATE SCHEMA IF NOT EXISTS settings;

-- ---------------------------------------------------------------------
-- Perfil de empresa — SINGLETON real: solo existe una fila, con id fijo
-- (el UUID nulo, 000...000). Nunca se hace INSERT de una fila nueva
-- después del seed inicial, solo UPDATE sobre esta — así queda
-- garantizado a nivel de aplicación que nunca hay dos "empresas".
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings.company_profile (
    id                UUID PRIMARY KEY,
    business_name     VARCHAR(200) NOT NULL,
    trade_name        VARCHAR(200),
    tax_id            VARCHAR(20) NOT NULL,
    address           TEXT,
    phone             VARCHAR(20),
    email             CITEXT,
    currency_code     VARCHAR(3) NOT NULL DEFAULT 'PEN',
    default_tax_rate  NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by        UUID REFERENCES identity.users(id)
);

-- CREATE OR REPLACE TRIGGER existe desde Postgres 14 — hace que este
-- bloque sea seguro de re-ejecutar (a diferencia de CREATE TRIGGER a
-- secas, que fallaría la segunda vez).
CREATE OR REPLACE TRIGGER trg_company_profile_updated_at
    BEFORE UPDATE ON settings.company_profile
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Fila única. currency_code/default_tax_rate quedan en su default por
-- ahora — no hay ninguna pantalla todavía que los use, así que no tiene
-- sentido pedírselos al usuario recién (ver nota en el form del frontend).
INSERT INTO settings.company_profile (id, business_name, tax_id)
VALUES ('00000000-0000-0000-0000-000000000000', 'Mi Empresa', '00000000000')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- Permiso nuevo — solo ADMINISTRADOR debería poder tocar los datos
-- legales/fiscales del negocio, ni VENDEDOR ni ALMACENERO ni TECNICO.
-- ---------------------------------------------------------------------
INSERT INTO identity.permissions (code, module, description)
VALUES ('settings.manage', 'settings', 'Editar el perfil de la empresa (razón social, RUC, dirección)')
ON CONFLICT (code) DO NOTHING;

INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-4000-8000-000000000001', p.id
FROM identity.permissions p
WHERE p.code = 'settings.manage'
ON CONFLICT DO NOTHING;