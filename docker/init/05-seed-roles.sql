-- docker/init/05-seed-roles.sql
-- Se ejecuta automáticamente después de 04-seed-workshop.sql en un volumen
-- nuevo. Para reaplicarlo en un contenedor existente, corré el archivo a
-- mano con psql — es idempotente.

-- ---------------------------------------------------------------------
-- Catálogo de permisos — uno por acción "sensible" (crear/modificar
-- datos que afectan dinero, stock o el sistema). Las lecturas quedan
-- abiertas a cualquier usuario autenticado a propósito: en un negocio de
-- este tamaño, restringir CADA consulta añade fricción sin beneficio de
-- seguridad real — lo que importa auditar es quién ESCRIBE qué.
-- ---------------------------------------------------------------------
INSERT INTO identity.permissions (code, module, description) VALUES
    ('catalog.create', 'catalog', 'Crear productos, marcas, categorías y proveedores'),
    ('inventory.adjust', 'inventory', 'Registrar ajustes manuales de stock'),
    ('sales.create', 'sales', 'Confirmar ventas en el POS'),
    ('workshop.manage', 'workshop', 'Crear órdenes de servicio, cambiar estado, agregar mano de obra/repuestos'),
    ('purchasing.manage', 'purchasing', 'Crear órdenes de compra y registrar recepciones'),
    ('identity.manage_users', 'identity', 'Crear usuarios y asignar roles')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------
-- Roles adicionales al ADMINISTRADOR que ya existía — para que RBAC
-- tenga sentido de verdad tiene que haber roles con permisos DISTINTOS,
-- no todos con acceso total.
-- ---------------------------------------------------------------------
INSERT INTO identity.roles (id, name, description, is_system) VALUES
    ('a0000000-0000-4000-8000-000000000010', 'VENDEDOR', 'Puede vender en el POS', FALSE),
    ('a0000000-0000-4000-8000-000000000011', 'ALMACENERO', 'Gestiona inventario y compras', FALSE),
    ('a0000000-0000-4000-8000-000000000012', 'TECNICO', 'Gestiona órdenes de taller', FALSE)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- ADMINISTRADOR: todos los permisos existentes (rol de sistema ya
-- creado en 02-seed.sql). Se arma dinámicamente con un SELECT en vez de
-- listar cada código a mano — así, si mañana agregamos un permiso
-- nuevo arriba, el admin lo hereda solo sin tocar esta sección.
-- ---------------------------------------------------------------------
INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-4000-8000-000000000001', p.id
FROM identity.permissions p
ON CONFLICT DO NOTHING;

-- VENDEDOR: solo ventas
INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-4000-8000-000000000010', p.id
FROM identity.permissions p WHERE p.code = 'sales.create'
ON CONFLICT DO NOTHING;

-- ALMACENERO: inventario, catálogo (para dar de alta repuestos) y compras
INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-4000-8000-000000000011', p.id
FROM identity.permissions p
WHERE p.code IN ('inventory.adjust', 'catalog.create', 'purchasing.manage')
ON CONFLICT DO NOTHING;

-- TECNICO: solo taller
INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-4000-8000-000000000012', p.id
FROM identity.permissions p WHERE p.code = 'workshop.manage'
ON CONFLICT DO NOTHING;