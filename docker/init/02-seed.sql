-- docker/init/02-seed.sql
-- Se ejecuta automáticamente DESPUÉS de 01-schema.sql, solo en la
-- primera creación del volumen de Postgres (mismo mecanismo que el
-- schema). Para reaplicarlo en un contenedor que ya existe, corré el
-- contenido a mano con psql — por eso todos los INSERT usan
-- ON CONFLICT DO NOTHING: es seguro ejecutarlo más de una vez.

-- ---------------------------------------------------------------------
-- Rol administrador (rol de sistema: no editable/borrable desde la UI)
-- ---------------------------------------------------------------------
INSERT INTO identity.roles (id, name, description, is_system)
VALUES (
    'a0000000-0000-4000-8000-000000000001',
    'ADMINISTRADOR',
    'Acceso total al sistema — rol de sistema, no editable',
    TRUE
)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- Usuario administrador
--
-- Usuario:     admin
-- Contraseña:  Admin123!   ← CAMBIAR apenas hagas el primer login real;
--                            esto es solo para probar el flujo de auth.
--
-- El hash de abajo es Argon2id real (v=19, m=19456, t=2, p=1 — los
-- mismos parámetros que Argon2::default() usa del lado Rust), generado
-- y verificado contra "Admin123!" antes de entregarlo. No es un
-- placeholder: el login funciona con este hash tal cual está.
-- ---------------------------------------------------------------------
INSERT INTO identity.users (
    id, username, email, password_hash, first_name, last_name, status
)
VALUES (
    'a0000000-0000-4000-8000-000000000002',
    'admin',
    'admin@riderstore.local',
    '$argon2id$v=19$m=19456,t=2,p=1$ECgb63/2+QkFiTh2vyh3AA$1O3xewrZ4kcE43zsd/1vu7Vn6a+DflN4C73Us7CLfOs',
    'Administrador',
    'del Sistema',
    'ACTIVO'
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO identity.user_roles (user_id, role_id)
VALUES (
    'a0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001'
)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- Almacén principal — sin al menos un warehouse, ningún flujo de
-- inventario/ventas/compras se puede probar (todos piden warehouse_id).
-- ---------------------------------------------------------------------
INSERT INTO inventory.warehouses (id, name, code, address)
VALUES (
    'a0000000-0000-4000-8000-000000000003',
    'Almacén Principal',
    'ALM-01',
    NULL
)
ON CONFLICT (code) DO NOTHING;