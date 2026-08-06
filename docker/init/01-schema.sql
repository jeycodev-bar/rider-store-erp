-- =====================================================================
-- RIDER STORE ERP — Esquema de base de datos
-- PostgreSQL 17
-- Tienda de motos, motocargas, mototaxis, repuestos, accesorios,
-- fluidos y servicio técnico especializado (taller)
-- =====================================================================

-- ---------------------------------------------------------------------
-- EXTENSIONES
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- búsqueda por similitud / autocompletado
CREATE EXTENSION IF NOT EXISTS "citext";     -- emails / códigos case-insensitive

-- ---------------------------------------------------------------------
-- SCHEMAS
-- ---------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS purchasing;
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS workshop;
CREATE SCHEMA IF NOT EXISTS audit;

-- ---------------------------------------------------------------------
-- FUNCIÓN GENÉRICA: updated_at automático
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- SCHEMA: identity  (usuarios, roles, permisos — RBAC)
-- =====================================================================

CREATE TYPE identity.user_status AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');

CREATE TABLE identity.roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50) NOT NULL UNIQUE,
    description     TEXT,
    is_system       BOOLEAN NOT NULL DEFAULT FALSE, -- roles base no editables (ej. SUPERADMIN)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE identity.permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(100) NOT NULL UNIQUE, -- ej. 'sales.create', 'inventory.adjust'
    module          VARCHAR(50) NOT NULL,          -- ej. 'sales', 'inventory', 'workshop'
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE identity.role_permissions (
    role_id         UUID NOT NULL REFERENCES identity.roles(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES identity.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE identity.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        CITEXT NOT NULL UNIQUE,
    email           CITEXT NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    status          identity.user_status NOT NULL DEFAULT 'ACTIVO',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ  -- soft delete
);
CREATE INDEX idx_users_status ON identity.users(status) WHERE deleted_at IS NULL;

CREATE TABLE identity.user_roles (
    user_id         UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES identity.roles(id) ON DELETE CASCADE,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE identity.refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON identity.refresh_tokens(user_id);

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON identity.users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON identity.roles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =====================================================================
-- SCHEMA: catalog  (catálogo maestro: vehículos, repuestos, accesorios, fluidos)
-- =====================================================================

CREATE TYPE catalog.product_type AS ENUM (
    'MOTO', 'MOTOCARGA', 'MOTOTAXI', 'REPUESTO', 'ACCESORIO', 'FLUIDO', 'SERVICIO'
);

CREATE TYPE catalog.unit_of_measure AS ENUM (
    'UNIDAD', 'LITRO', 'GALON', 'KILOGRAMO', 'METRO', 'PAR', 'JUEGO'
);

CREATE TABLE catalog.brands (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    country_origin  VARCHAR(100),
    logo_url        TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categorías jerárquicas (auto-referenciadas): permite ej.
-- Repuestos > Motor > Pistones, o Motos > Lineales > 150cc
CREATE TABLE catalog.categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID REFERENCES catalog.categories(id) ON DELETE RESTRICT,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(120) NOT NULL UNIQUE,
    applies_to      catalog.product_type,  -- opcional: restringe la categoría a un tipo
    display_order   INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_parent ON catalog.categories(parent_id);

-- Producto maestro: fuente única de verdad, tanto para vehículos como
-- para repuestos/accesorios/fluidos. Los campos específicos de vehículo
-- (cilindrada, tipo de motor) viven en catalog.vehicle_specs (1:1).
CREATE TABLE catalog.products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku                 VARCHAR(50) NOT NULL UNIQUE,
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    product_type        catalog.product_type NOT NULL,
    category_id         UUID REFERENCES catalog.categories(id) ON DELETE RESTRICT,
    brand_id            UUID REFERENCES catalog.brands(id) ON DELETE RESTRICT,
    unit_of_measure     catalog.unit_of_measure NOT NULL DEFAULT 'UNIDAD',
    is_serialized       BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE para MOTO/MOTOCARGA/MOTOTAXI
    barcode             VARCHAR(50),
    base_price          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (base_price >= 0),
    base_cost           NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (base_cost >= 0),
    tax_rate            NUMERIC(5,2) NOT NULL DEFAULT 18.00, -- IGV %
    min_stock_alert     NUMERIC(12,2) NOT NULL DEFAULT 0,    -- ignorado si is_serialized
    image_url           TEXT,
    specifications      JSONB NOT NULL DEFAULT '{}'::jsonb,  -- specs flexibles no estructuradas
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT chk_serialized_matches_type CHECK (
        (is_serialized AND product_type IN ('MOTO','MOTOCARGA','MOTOTAXI'))
        OR (NOT is_serialized AND product_type NOT IN ('MOTO','MOTOCARGA','MOTOTAXI'))
    )
);
CREATE INDEX idx_products_type ON catalog.products(product_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON catalog.products(category_id);
CREATE INDEX idx_products_brand ON catalog.products(brand_id);
CREATE INDEX idx_products_active ON catalog.products(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_name_trgm ON catalog.products USING gin (name gin_trgm_ops);

-- Specs propias de vehículos (1:1 con products cuando is_serialized = TRUE)
CREATE TABLE catalog.vehicle_specs (
    product_id          UUID PRIMARY KEY REFERENCES catalog.products(id) ON DELETE CASCADE,
    model_year          SMALLINT NOT NULL,
    engine_displacement_cc SMALLINT NOT NULL,
    engine_type         VARCHAR(50),   -- ej. '4T', '2T'
    transmission        VARCHAR(50),   -- ej. 'Manual 5 velocidades'
    fuel_type           VARCHAR(30) DEFAULT 'GASOLINA',
    load_capacity_kg    NUMERIC(8,2), -- relevante para motocarga
    passenger_capacity  SMALLINT,     -- relevante para mototaxi
    color_options        TEXT[]        -- colores disponibles de fábrica
);

-- Proveedores
CREATE TABLE catalog.suppliers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name   VARCHAR(200) NOT NULL,
    tax_id          VARCHAR(20) NOT NULL UNIQUE, -- RUC
    contact_name    VARCHAR(150),
    phone           VARCHAR(20),
    email           CITEXT,
    address         TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Relación N:M producto-proveedor con costo específico por proveedor
CREATE TABLE catalog.product_suppliers (
    product_id      UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    supplier_id     UUID NOT NULL REFERENCES catalog.suppliers(id) ON DELETE CASCADE,
    supplier_sku    VARCHAR(50),
    supplier_cost   NUMERIC(12,2) NOT NULL CHECK (supplier_cost >= 0),
    lead_time_days  SMALLINT,
    is_preferred    BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (product_id, supplier_id)
);

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON catalog.products
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON catalog.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON catalog.categories
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =====================================================================
-- SCHEMA: inventory  (almacenes, stock por cantidad, unidades serializadas, kardex)
-- =====================================================================

CREATE TYPE inventory.vehicle_unit_status AS ENUM (
    'DISPONIBLE', 'RESERVADO', 'VENDIDO', 'EN_TRANSITO', 'EN_TALLER', 'BAJA'
);

CREATE TYPE inventory.movement_type AS ENUM (
    'INGRESO_COMPRA', 'INGRESO_AJUSTE', 'INGRESO_DEVOLUCION',
    'SALIDA_VENTA', 'SALIDA_AJUSTE', 'SALIDA_TALLER',
    'TRASLADO_SALIDA', 'TRASLADO_ENTRADA'
);

CREATE TABLE inventory.warehouses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(20) NOT NULL UNIQUE,
    address         TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock por cantidad: SOLO para productos NO serializados (repuestos, accesorios, fluidos)
CREATE TABLE inventory.stock_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES catalog.products(id) ON DELETE RESTRICT,
    warehouse_id    UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
    quantity        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_qty    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, warehouse_id)
);
CREATE INDEX idx_stock_items_warehouse ON inventory.stock_items(warehouse_id);

-- Unidades serializadas: UNA fila por cada moto/motocarga/mototaxi física
CREATE TABLE inventory.vehicle_units (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID NOT NULL REFERENCES catalog.products(id) ON DELETE RESTRICT,
    warehouse_id        UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
    vin_chassis_number  VARCHAR(50) NOT NULL UNIQUE, -- número de chasis / VIN
    engine_number       VARCHAR(50) NOT NULL UNIQUE,
    color               VARCHAR(50),
    status              inventory.vehicle_unit_status NOT NULL DEFAULT 'DISPONIBLE',
    purchase_cost       NUMERIC(12,2) NOT NULL CHECK (purchase_cost >= 0),
    received_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    sold_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicle_units_status ON inventory.vehicle_units(status);
CREATE INDEX idx_vehicle_units_product ON inventory.vehicle_units(product_id);

-- Kardex: INMUTABLE — nunca se actualiza ni se borra, solo se inserta
CREATE TABLE inventory.stock_movements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_type   inventory.movement_type NOT NULL,
    product_id      UUID NOT NULL REFERENCES catalog.products(id) ON DELETE RESTRICT,
    warehouse_id    UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
    vehicle_unit_id UUID REFERENCES inventory.vehicle_units(id) ON DELETE RESTRICT, -- solo si aplica
    quantity        NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit_cost       NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0),
    reference_type  VARCHAR(50),  -- ej. 'PURCHASE_ORDER', 'SALE', 'SERVICE_ORDER'
    reference_id    UUID,         -- FK polimórfica al documento origen
    notes           TEXT,
    created_by       UUID NOT NULL REFERENCES identity.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_movements_product ON inventory.stock_movements(product_id);
CREATE INDEX idx_stock_movements_warehouse ON inventory.stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_reference ON inventory.stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_created_at ON inventory.stock_movements(created_at);

-- Evita UPDATE/DELETE sobre el kardex a nivel de base de datos
CREATE OR REPLACE FUNCTION inventory.prevent_kardex_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'inventory.stock_movements es inmutable: no se permite UPDATE ni DELETE';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_movements_immutable
    BEFORE UPDATE OR DELETE ON inventory.stock_movements
    FOR EACH ROW EXECUTE FUNCTION inventory.prevent_kardex_mutation();

CREATE TRIGGER trg_vehicle_units_updated_at BEFORE UPDATE ON inventory.vehicle_units
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =====================================================================
-- SCHEMA: purchasing  (compras a proveedores)
-- =====================================================================

CREATE TYPE purchasing.purchase_order_status AS ENUM (
    'BORRADOR', 'ENVIADA', 'PARCIAL', 'RECIBIDA', 'ANULADA'
);

CREATE TABLE purchasing.purchase_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number    VARCHAR(30) NOT NULL UNIQUE,
    supplier_id     UUID NOT NULL REFERENCES catalog.suppliers(id) ON DELETE RESTRICT,
    warehouse_id    UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
    status          purchasing.purchase_order_status NOT NULL DEFAULT 'BORRADOR',
    expected_date   DATE,
    total_amount    NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    created_by      UUID NOT NULL REFERENCES identity.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_purchase_orders_supplier ON purchasing.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchasing.purchase_orders(status);

CREATE TABLE purchasing.purchase_order_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id   UUID NOT NULL REFERENCES purchasing.purchase_orders(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES catalog.products(id) ON DELETE RESTRICT,
    quantity_ordered    NUMERIC(12,2) NOT NULL CHECK (quantity_ordered > 0),
    quantity_received   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
    unit_cost           NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0)
);
CREATE INDEX idx_po_items_order ON purchasing.purchase_order_items(purchase_order_id);

CREATE TRIGGER trg_purchase_orders_updated_at BEFORE UPDATE ON purchasing.purchase_orders
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =====================================================================
-- SCHEMA: sales  (clientes, ventas, POS)
-- =====================================================================

CREATE TYPE sales.document_type AS ENUM ('BOLETA', 'FACTURA', 'NOTA_VENTA', 'COTIZACION');
CREATE TYPE sales.sale_status AS ENUM ('PENDIENTE', 'CONFIRMADA', 'ANULADA', 'ENTREGADA');
CREATE TYPE sales.payment_method AS ENUM (
    'EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'YAPE', 'PLIN', 'CREDITO', 'FINANCIAMIENTO'
);
CREATE TYPE sales.customer_type AS ENUM ('NATURAL', 'JURIDICA');

CREATE TABLE sales.customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_type   sales.customer_type NOT NULL DEFAULT 'NATURAL',
    document_type   VARCHAR(10) NOT NULL,  -- DNI / RUC / CE
    document_number VARCHAR(20) NOT NULL,
    full_name       VARCHAR(200) NOT NULL, -- razón social si es JURIDICA
    phone           VARCHAR(20),
    email           CITEXT,
    address         TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (document_type, document_number)
);
CREATE INDEX idx_customers_name_trgm ON sales.customers USING gin (full_name gin_trgm_ops);

-- Sesiones de caja (apertura / cierre) — necesario para POS
CREATE TABLE sales.pos_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id        UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
    opened_by           UUID NOT NULL REFERENCES identity.users(id),
    closed_by           UUID REFERENCES identity.users(id),
    opening_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    closing_amount      NUMERIC(12,2),
    expected_amount     NUMERIC(12,2),
    difference_amount   NUMERIC(12,2),
    opened_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at           TIMESTAMPTZ
);
CREATE INDEX idx_pos_sessions_warehouse ON sales.pos_sessions(warehouse_id);

CREATE TABLE sales.sales_orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number        VARCHAR(30) NOT NULL UNIQUE,
    document_type       sales.document_type NOT NULL,
    status               sales.sale_status NOT NULL DEFAULT 'PENDIENTE',
    customer_id         UUID NOT NULL REFERENCES sales.customers(id) ON DELETE RESTRICT,
    warehouse_id        UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
    pos_session_id      UUID REFERENCES sales.pos_sessions(id) ON DELETE RESTRICT,
    subtotal            NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount          NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount        NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    sold_by             UUID NOT NULL REFERENCES identity.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sales_orders_customer ON sales.sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales.sales_orders(status);
CREATE INDEX idx_sales_orders_created_at ON sales.sales_orders(created_at);

CREATE TABLE sales.sale_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id         UUID NOT NULL REFERENCES sales.sales_orders(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES catalog.products(id) ON DELETE RESTRICT,
    vehicle_unit_id UUID REFERENCES inventory.vehicle_units(id) ON DELETE RESTRICT, -- si es vehículo
    quantity        NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    line_total      NUMERIC(14,2) NOT NULL CHECK (line_total >= 0)
);
CREATE INDEX idx_sale_items_sale ON sales.sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sales.sale_items(product_id);

CREATE TABLE sales.payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id         UUID NOT NULL REFERENCES sales.sales_orders(id) ON DELETE RESTRICT,
    payment_method  sales.payment_method NOT NULL,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    reference_code  VARCHAR(100), -- ej. número de operación de transferencia
    paid_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_sale ON sales.payments(sale_id);

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON sales.customers
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_sales_orders_updated_at BEFORE UPDATE ON sales.sales_orders
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =====================================================================
-- SCHEMA: workshop  (taller / servicio técnico especializado)
-- =====================================================================

CREATE TYPE workshop.service_order_status AS ENUM (
    'RECIBIDO', 'DIAGNOSTICO', 'EN_REPARACION', 'ESPERA_REPUESTOS', 'LISTO', 'ENTREGADO', 'CANCELADO'
);

-- Vehículos de clientes que entran a servicio (no necesariamente comprados aquí)
CREATE TABLE workshop.customer_vehicles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         UUID NOT NULL REFERENCES sales.customers(id) ON DELETE RESTRICT,
    vehicle_unit_id     UUID REFERENCES inventory.vehicle_units(id) ON DELETE SET NULL, -- si se compró aquí
    vin_chassis_number  VARCHAR(50),
    engine_number       VARCHAR(50),
    brand_id            UUID REFERENCES catalog.brands(id),
    model_name          VARCHAR(100),
    model_year          SMALLINT,
    plate_number        VARCHAR(20),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_vehicles_customer ON workshop.customer_vehicles(customer_id);
CREATE UNIQUE INDEX idx_customer_vehicles_vin ON workshop.customer_vehicles(vin_chassis_number)
    WHERE vin_chassis_number IS NOT NULL;

-- Catálogo de mano de obra (servicios de taller, con precio estándar)
CREATE TABLE workshop.labor_catalog (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    standard_price  NUMERIC(12,2) NOT NULL CHECK (standard_price >= 0),
    estimated_hours NUMERIC(5,2),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE workshop.service_orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number        VARCHAR(30) NOT NULL UNIQUE,
    customer_vehicle_id UUID NOT NULL REFERENCES workshop.customer_vehicles(id) ON DELETE RESTRICT,
    warehouse_id        UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
    status              workshop.service_order_status NOT NULL DEFAULT 'RECIBIDO',
    reported_issue       TEXT NOT NULL,
    diagnosis           TEXT,
    assigned_technician_id UUID REFERENCES identity.users(id),
    mileage_km          INTEGER,
    labor_total          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (labor_total >= 0),
    parts_total          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (parts_total >= 0),
    total_amount         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    received_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    promised_at          TIMESTAMPTZ,
    delivered_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_service_orders_status ON workshop.service_orders(status);
CREATE INDEX idx_service_orders_vehicle ON workshop.service_orders(customer_vehicle_id);
CREATE INDEX idx_service_orders_technician ON workshop.service_orders(assigned_technician_id);

-- Mano de obra aplicada a una orden
CREATE TABLE workshop.service_order_labor (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id    UUID NOT NULL REFERENCES workshop.service_orders(id) ON DELETE CASCADE,
    labor_id            UUID NOT NULL REFERENCES workshop.labor_catalog(id) ON DELETE RESTRICT,
    price_charged        NUMERIC(12,2) NOT NULL CHECK (price_charged >= 0),
    performed_by         UUID REFERENCES identity.users(id)
);

-- Repuestos consumidos en una orden (descuenta de inventory.stock_items vía kardex)
CREATE TABLE workshop.service_order_parts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id    UUID NOT NULL REFERENCES workshop.service_orders(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES catalog.products(id) ON DELETE RESTRICT,
    quantity            NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit_price           NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0)
);
CREATE INDEX idx_so_parts_order ON workshop.service_order_parts(service_order_id);

CREATE TRIGGER trg_service_orders_updated_at BEFORE UPDATE ON workshop.service_orders
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =====================================================================
-- SCHEMA: audit  (auditoría inmutable, genérica para toda la plataforma)
-- =====================================================================

CREATE TYPE audit.action_type AS ENUM ('INSERT', 'UPDATE', 'DELETE');

CREATE TABLE audit.audit_log (
    id              BIGSERIAL PRIMARY KEY,
    table_schema    VARCHAR(50) NOT NULL,
    table_name      VARCHAR(100) NOT NULL,
    record_id       UUID NOT NULL,
    action          audit.action_type NOT NULL,
    old_data        JSONB,
    new_data        JSONB,
    performed_by    UUID REFERENCES identity.users(id),
    performed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_table ON audit.audit_log(table_schema, table_name);
CREATE INDEX idx_audit_log_record ON audit.audit_log(record_id);
CREATE INDEX idx_audit_log_performed_at ON audit.audit_log(performed_at);

-- Igual que el kardex: nunca se actualiza ni se borra
CREATE OR REPLACE FUNCTION audit.prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit.audit_log es inmutable: no se permite UPDATE ni DELETE';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_immutable
    BEFORE UPDATE OR DELETE ON audit.audit_log
    FOR EACH ROW EXECUTE FUNCTION audit.prevent_audit_mutation();

-- =====================================================================
-- FIN DEL SCHEMA BASE
-- =====================================================================