-- docker/init/03-seed-catalog.sql
-- Se ejecuta automáticamente después de 02-seed.sql en un volumen nuevo.
-- Para reaplicarlo en un contenedor existente, corré el archivo a mano
-- con psql — todos los INSERT son ON CONFLICT DO NOTHING (idempotente).

-- ---------------------------------------------------------------------
-- Marcas — las más comunes en el mercado peruano de motos/repuestos.
-- Ajustá esta lista a lo que realmente vendas; esto es punto de partida,
-- no un catálogo cerrado.
-- ---------------------------------------------------------------------
INSERT INTO catalog.brands (name, country_origin) VALUES
    ('Honda', 'Japón'),
    ('Yamaha', 'Japón'),
    ('Bajaj', 'India'),
    ('TVS', 'India'),
    ('Zongshen', 'China'),
    ('Genérico', NULL) -- para repuestos/accesorios sin marca específica
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- Categorías — un padre por cada product_type (usa IDs fijos para que
-- las categorías hijas de abajo puedan referenciarlos directo, sin
-- necesidad de sub-queries) y sus hijas típicas del rubro.
-- ---------------------------------------------------------------------
INSERT INTO catalog.categories (id, parent_id, name, slug, applies_to, display_order) VALUES
    ('c1000000-0000-4000-8000-000000000001', NULL, 'Motos',       'motos',       'MOTO',       1),
    ('c1000000-0000-4000-8000-000000000002', NULL, 'Motocargas',  'motocargas',  'MOTOCARGA',  2),
    ('c1000000-0000-4000-8000-000000000003', NULL, 'Mototaxis',   'mototaxis',   'MOTOTAXI',   3),
    ('c1000000-0000-4000-8000-000000000004', NULL, 'Repuestos',   'repuestos',   'REPUESTO',   4),
    ('c1000000-0000-4000-8000-000000000005', NULL, 'Accesorios',  'accesorios',  'ACCESORIO',  5),
    ('c1000000-0000-4000-8000-000000000006', NULL, 'Fluidos',     'fluidos',     'FLUIDO',     6),
    ('c1000000-0000-4000-8000-000000000007', NULL, 'Servicios',   'servicios',   'SERVICIO',   7)
ON CONFLICT (slug) DO NOTHING;

-- Subcategorías de Motos
INSERT INTO catalog.categories (parent_id, name, slug, applies_to, display_order) VALUES
    ('c1000000-0000-4000-8000-000000000001', 'Lineales', 'motos-lineales', 'MOTO', 1),
    ('c1000000-0000-4000-8000-000000000001', 'De trabajo', 'motos-trabajo', 'MOTO', 2)
ON CONFLICT (slug) DO NOTHING;

-- Subcategorías de Repuestos — las que más rotan en un taller de motos
INSERT INTO catalog.categories (parent_id, name, slug, applies_to, display_order) VALUES
    ('c1000000-0000-4000-8000-000000000004', 'Motor', 'repuestos-motor', 'REPUESTO', 1),
    ('c1000000-0000-4000-8000-000000000004', 'Frenos', 'repuestos-frenos', 'REPUESTO', 2),
    ('c1000000-0000-4000-8000-000000000004', 'Transmisión', 'repuestos-transmision', 'REPUESTO', 3),
    ('c1000000-0000-4000-8000-000000000004', 'Suspensión', 'repuestos-suspension', 'REPUESTO', 4),
    ('c1000000-0000-4000-8000-000000000004', 'Eléctrico', 'repuestos-electrico', 'REPUESTO', 5)
ON CONFLICT (slug) DO NOTHING;

-- Subcategorías de Accesorios
INSERT INTO catalog.categories (parent_id, name, slug, applies_to, display_order) VALUES
    ('c1000000-0000-4000-8000-000000000005', 'Cascos', 'accesorios-cascos', 'ACCESORIO', 1),
    ('c1000000-0000-4000-8000-000000000005', 'Indumentaria', 'accesorios-indumentaria', 'ACCESORIO', 2),
    ('c1000000-0000-4000-8000-000000000005', 'Alarmas y seguridad', 'accesorios-alarmas', 'ACCESORIO', 3)
ON CONFLICT (slug) DO NOTHING;

-- Subcategorías de Fluidos
INSERT INTO catalog.categories (parent_id, name, slug, applies_to, display_order) VALUES
    ('c1000000-0000-4000-8000-000000000006', 'Aceites de motor', 'fluidos-aceites', 'FLUIDO', 1),
    ('c1000000-0000-4000-8000-000000000006', 'Refrigerantes', 'fluidos-refrigerantes', 'FLUIDO', 2),
    ('c1000000-0000-4000-8000-000000000006', 'Líquido de frenos', 'fluidos-liquido-frenos', 'FLUIDO', 3)
ON CONFLICT (slug) DO NOTHING;