-- docker/init/04-seed-workshop.sql
-- Se ejecuta automáticamente después de 03-seed-catalog.sql en un volumen
-- nuevo. Para reaplicarlo en un contenedor existente, corré el archivo a
-- mano con psql.
--
-- NOTA: workshop.labor_catalog.name no tiene UNIQUE en el schema, así que
-- "ON CONFLICT DO NOTHING" no serviría acá (no hay conflicto que detectar).
-- Se usa WHERE NOT EXISTS para que sea idempotente de verdad sin tocar
-- el schema.

INSERT INTO workshop.labor_catalog (name, description, standard_price, estimated_hours)
SELECT * FROM (VALUES
    ('Cambio de aceite de motor', 'Incluye drenado, filtro y verificación de niveles', 25.00::numeric, 0.50::numeric),
    ('Revisión general', 'Chequeo de frenos, luces, niveles, presión de llantas', 30.00, 0.75),
    ('Ajuste de frenos', 'Regulación de freno delantero y trasero', 20.00, 0.50),
    ('Cambio de pastillas de freno', 'Reemplazo de pastillas delanteras o traseras', 15.00, 0.50),
    ('Cambio de llanta', 'Desmontaje, montaje y balanceo', 15.00, 0.50),
    ('Diagnóstico eléctrico', 'Revisión de sistema eléctrico y batería', 35.00, 1.00),
    ('Ajuste de cadena/transmisión', 'Tensado y lubricación de cadena', 15.00, 0.40),
    ('Reparación de motor (mano de obra base)', 'Tarifa base — se ajusta según diagnóstico', 80.00, 3.00),
    ('Cambio de bujía', 'Reemplazo e inspección de bujía', 10.00, 0.25),
    ('Lavado y engrase general', 'Limpieza completa y lubricación de puntos clave', 20.00, 0.50)
) AS v(name, description, standard_price, estimated_hours)
WHERE NOT EXISTS (
    SELECT 1 FROM workshop.labor_catalog lc WHERE lc.name = v.name
);