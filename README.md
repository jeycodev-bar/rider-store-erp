# Rider Store ERP

**Rider Store ERP** es un sistema de gestión empresarial (ERP) de alto rendimiento enfocado en la industria automotriz y de motocicletas (venta de vehículos, repuestos y gestión de talleres mecánicos). 

Está construido bajo una arquitectura híbrida de escritorio ultramoderna, segura y ligera, utilizando **Tauri 2** y **PostgreSQL** multi-esquema.

---

## Stack Tecnológico

### **Frontend & Desktop App**
* **Framework Backend (Escritorio):** [Tauri 2.0](https://tauri.app/) (Powered by **Rust**)
* **UI Library:** [React 19](https://react.dev/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Build Tool:** Vite

### **Database & Infrastructure**
* **Motor DB:** [PostgreSQL 17](https://www.postgresql.org/)
* **Contenedor:** Docker & Docker Compose
* **Arquitectura de Datos:** Diseñada multi-esquema con trazabilidad inmutable (Audit logs) e integridad referencial estricta.

---

## Arquitectura de Base de Datos (Multi-Schema)

El sistema utiliza un único contenedor PostgreSQL con esquemas aislados para garantizar escalabilidad, seguridad e integridad de dominio:

| Esquema | Propósito / Responsabilidad |
| :--- | :--- |
| **`identity`** | Usuarios, roles, permisos (RBAC) y sesiones de acceso. |
| **`catalog`** | Productos, motocicletas (VIN, modelo), repuestos y categorías. |
| **`inventory`** | Control de stock, ubicaciones en almacén y movimientos de inventario. |
| **`purchasing`** | Proveedores, órdenes de compra e ingreso de mercancía. |
| **`sales`** | Facturación, POS (Punto de Venta), clientes y caja chica. |
| **`workshop`** | Ordenes de servicio mecánico, asignación de técnicos y repuestos consumidos. |
| **`audit`** | Logs inmutables de auditoría, disparadores de cambios de datos y trazabilidad. |

---

## Estructura del Proyecto

```text
rider-store-erp/
├── src/                          # Frontend -Interfaz de usuario (React 19 + TS + Tailwind CSS 4)
│   ├── assets/
│   ├── components/
│   │   ├── ui/                   # componentes base reutilizables (Button, Input, Modal...)
│   │   └── layout/                # Sidebar, Topbar, AppShell
│   ├── features/                  # organizado por dominio, NO por tipo de archivo
│   │   ├── catalog/
│   │   │   ├── api/                # llamadas a invoke() de Tauri
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── workshop/
│   │   ├── purchasing/
│   │   └── identity/
│   ├── lib/                       # utilidades transversales (cn(), formatters, etc.)
│   ├── stores/                    # estado global (Zustand, si lo usamos)
│   ├── styles/
│   │   ├── tokens.css              # design tokens (ver abajo)
│   │   └── globals.css
│   ├── routes/                     # si usamos TanStack Router / React Router
│   ├── App.tsx
│   └── main.tsx
│
├── src-tauri/                     # Backend - Núcleo nativo (Rust + Tauri 2 configs & commands)
│   ├── src/
│   │   ├── db/                    # ← lo que ya armamos
│   │   ├── models/                # ← lo que ya armamos
│   │   ├── queries/                # ← lo que ya armamos
│   │   ├── commands/                # comandos Tauri (#[tauri::command]) por dominio
│   │   │   ├── catalog_commands.rs
│   │   │   ├── inventory_commands.rs
│   │   │   ├── sales_commands.rs
│   │   │   ├── workshop_commands.rs
│   │   │   └── mod.rs
│   │   ├── lib.rs                  # registra comandos + AppState en el builder
│   │   └── main.rs
│   ├── icons/
│   ├── capabilities/                # permisos de Tauri 2 (nuevo sistema de seguridad)
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── docker/                          # Configuración de Docker Compose y Postgres
│   ├── docker-compose.yml           # ← 
│   └── init/                        # ← Scripts SQL de inicialización automática
│       └── 01-schema.sql            # ← el schema.sql: Definición multi-esquema base
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── .env.example            # Plantilla de variables de entorno
├── .gitignore              # Reglas de exclusión unificadas (Seguridad)
└── README.md               # Documentación del proyecto
```

## Arquitectura de Base de Datos (Multi-Schema)
Prerrequisitos
Asegúrate de tener instalado en tu entorno de desarrollo:
+Node.js (v20+ recomendado)
+pnpm o npm
+Rust & Cargo
+Docker Desktop

======================================
## Pasos de Configuración
Clonar el repositorio:

git clone [https://github.com/jeycodev-bar/rider-store-erp.git](https://github.com/jeycodev-bar/rider-store-erp.git)

cd rider-store-erp

Configurar variables de entorno: (Copia la plantilla .env.example para crear tu .env local:)

cp .env.example .env

Levantar la Base de Datos (Docker):
docker compose up -d

La base de datos se desplegará en localhost:5435 con los esquemas inicializados automáticamente.

Instalar dependencias del Frontend:
pnpm install

Ejecutar la aplicación en modo desarrollo:
pnpm tauri dev

## Seguridad y Limpieza
Este repositorio sigue reglas estrictas de control de versiones:
-Las credenciales y claves privadas (.env) están ignoradas por defecto.
-Los compilados de Rust (/target/) y paquetes de Node (/node_modules/) no forman parte del control de versiones.


## Roles con diferenciación real (no todo ADMINISTRADOR): [Rol	Permisos]
ADMINISTRADOR:	los 6 (armado dinámico, hereda automáticamente cualquier permiso nuevo que agregues)
VENDEDOR     :	sales.create
ALMACENERO	 :  inventory.adjust, catalog.create, purchasing.manage
TECNICO	     :  workshop.manage
---> Para aplicar: docker exec -i rider_store_pg psql -U admin_rider -d rider_store_db < docker\init\05-seed-roles.sql