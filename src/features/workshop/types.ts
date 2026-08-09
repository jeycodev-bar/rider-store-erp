// src/features/workshop/types.ts

export type ServiceOrderStatus =
    | "RECIBIDO"
    | "DIAGNOSTICO"
    | "EN_REPARACION"
    | "ESPERA_REPUESTOS"
    | "LISTO"
    | "ENTREGADO"
    | "CANCELADO";

export interface LaborCatalog {
    id: string;
    name: string;
    description: string | null;
    standardPrice: string;
    estimatedHours: string | null;
    isActive: boolean;
}

export interface CustomerVehicle {
    id: string;
    customerId: string;
    vehicleUnitId: string | null;
    vinChassisNumber: string | null;
    engineNumber: string | null;
    brandId: string | null;
    modelName: string | null;
    modelYear: number | null;
    plateNumber: string | null;
    createdAt: string;
}

export interface CreateCustomerVehicleInput {
    customerId: string;
    vehicleUnitId?: string | null;
    vinChassisNumber?: string | null;
    engineNumber?: string | null;
    brandId?: string | null;
    modelName?: string | null;
    modelYear?: number | null;
    plateNumber?: string | null;
}

export interface ServiceOrder {
    id: string;
    orderNumber: string;
    customerVehicleId: string;
    warehouseId: string;
    status: ServiceOrderStatus;
    reportedIssue: string;
    diagnosis: string | null;
    assignedTechnicianId: string | null;
    mileageKm: number | null;
    laborTotal: string;
    partsTotal: string;
    totalAmount: string;
    receivedAt: string;
    promisedAt: string | null;
    deliveredAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateServiceOrderInput {
    customerVehicleId: string;
    warehouseId: string;
    reportedIssue: string;
    assignedTechnicianId?: string | null;
    mileageKm?: number | null;
    promisedAt?: string | null;
}

export interface AddLaborInput {
    serviceOrderId: string;
    laborId: string;
    priceCharged: string;
    performedBy?: string | null;
}

/** Agregar un repuesto SÍ descuenta stock real del almacén de la orden. */
export interface AddPartInput {
    serviceOrderId: string;
    productId: string;
    quantity: string;
    unitPrice: string;
}