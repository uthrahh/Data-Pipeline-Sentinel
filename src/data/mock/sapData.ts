/**
 * Small realistic sample rows for the three authoritative SAP source tables.
 * This is what stands in for `ai_dataops_poc.sap_demo.*` today — the chat
 * assistant queries this data, not a live warehouse. See chatService.ts for
 * how a real ApiChatService would instead delegate to Databricks/Genie.
 */

export interface MaterialMasterRow {
  materialId: string;
  description: string;
  materialType: "ROH" | "HALB" | "FERT";
  baseUom: string;
  standardCost: number;
  currency: string;
  plant: string;
  country: string;
}

export interface VendorMaterialRow {
  vendorId: string;
  vendorName: string;
  materialId: string;
  purchasePrice: number;
  currency: string;
  country: string;
}

export interface SalesOrderItemRow {
  orderId: string;
  materialId: string;
  customer: string;
  quantity: number;
  status: "OPEN" | "CLOSED";
  country: string;
  orderDate: string;
}

export const SAP_MATERIAL_MASTER: MaterialMasterRow[] = [
  { materialId: "MAT1001", description: "Steel Rod 10mm", materialType: "ROH", baseUom: "EA", standardCost: 2.1, currency: "USD", plant: "US01", country: "US" },
  { materialId: "MAT1002", description: "Steel Rod 12mm", materialType: "ROH", baseUom: "EA", standardCost: 2.45, currency: "USD", plant: "US01", country: "US" },
  { materialId: "MAT1003", description: "Aluminum Sheet", materialType: "ROH", baseUom: "KG", standardCost: 5.8, currency: "CAD", plant: "CA01", country: "CA" },
  { materialId: "MAT1004", description: "Bearing Assembly", materialType: "HALB", baseUom: "EA", standardCost: 12.3, currency: "SGD", plant: "SG01", country: "SG" },
  { materialId: "MAT1005", description: "Motor Housing", materialType: "FERT", baseUom: "EA", standardCost: 45.0, currency: "EUR", plant: "BE01", country: "BE" },
  { materialId: "MAT1006", description: "Copper Wire", materialType: "ROH", baseUom: "M", standardCost: 0.85, currency: "USD", plant: "US01", country: "US" },
  { materialId: "MAT1007", description: "Gearbox Unit", materialType: "FERT", baseUom: "EA", standardCost: 88.5, currency: "EUR", plant: "BE01", country: "BE" },
  { materialId: "MAT1008", description: "Circuit Board", materialType: "HALB", baseUom: "EA", standardCost: 15.2, currency: "SGD", plant: "SG01", country: "SG" },
  { materialId: "MAT1009", description: "Rubber Gasket", materialType: "ROH", baseUom: "EA", standardCost: 0.35, currency: "CAD", plant: "CA01", country: "CA" },
  { materialId: "MAT1010", description: "Control Panel Assembly", materialType: "FERT", baseUom: "EA", standardCost: 120.0, currency: "USD", plant: "US01", country: "US" },
];

export const SAP_VENDOR_MATERIAL: VendorMaterialRow[] = [
  { vendorId: "V1001", vendorName: "ABC Steel Supplies", materialId: "MAT1001", purchasePrice: 2.1, currency: "USD", country: "US" },
  { vendorId: "V1002", vendorName: "Global Metals Co", materialId: "MAT1001", purchasePrice: 2.05, currency: "USD", country: "US" },
  { vendorId: "V1003", vendorName: "Northern Alloys", materialId: "MAT1002", purchasePrice: 2.4, currency: "USD", country: "CA" },
  { vendorId: "V1004", vendorName: "Pacific Components", materialId: "MAT1004", purchasePrice: 11.9, currency: "SGD", country: "SG" },
  { vendorId: "V1005", vendorName: "EuroParts GmbH", materialId: "MAT1005", purchasePrice: 44.2, currency: "EUR", country: "BE" },
  { vendorId: "V1006", vendorName: "EuroParts GmbH", materialId: "MAT1007", purchasePrice: 87.0, currency: "EUR", country: "BE" },
  { vendorId: "V1007", vendorName: "Wirecraft Inc", materialId: "MAT1006", purchasePrice: 0.82, currency: "USD", country: "US" },
  { vendorId: "V1008", vendorName: "Maple Fasteners", materialId: "MAT1009", purchasePrice: 0.32, currency: "CAD", country: "CA" },
];

export const SAP_SALES_ORDER_ITEM: SalesOrderItemRow[] = [
  { orderId: "SO-90001", materialId: "MAT1001", customer: "Acme Corp", quantity: 500, status: "OPEN", country: "US", orderDate: "2026-09-14" },
  { orderId: "SO-90002", materialId: "MAT1004", customer: "Singtel Industries", quantity: 1200, status: "OPEN", country: "SG", orderDate: "2026-09-15" },
  { orderId: "SO-90003", materialId: "MAT1005", customer: "BerlinTech GmbH", quantity: 300, status: "CLOSED", country: "BE", orderDate: "2026-09-10" },
  { orderId: "SO-90004", materialId: "MAT1002", customer: "Maple Manufacturing", quantity: 800, status: "OPEN", country: "CA", orderDate: "2026-09-13" },
  { orderId: "SO-90005", materialId: "MAT1007", customer: "BerlinTech GmbH", quantity: 150, status: "OPEN", country: "BE", orderDate: "2026-09-15" },
  { orderId: "SO-90006", materialId: "MAT1001", customer: "Acme Corp", quantity: 200, status: "CLOSED", country: "US", orderDate: "2026-09-08" },
  { orderId: "SO-90007", materialId: "MAT1010", customer: "Vertex Industrial", quantity: 60, status: "OPEN", country: "US", orderDate: "2026-09-15" },
];
