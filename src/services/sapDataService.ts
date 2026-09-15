import { SAP_MATERIAL_MASTER, SAP_SALES_ORDER_ITEM, SAP_VENDOR_MATERIAL } from "@/data/mock/sapData";
import type { ChatQueryResult } from "@/types";

const SOURCE = {
  materialMaster: "ai_dataops_poc.sap_demo.sap_material_master",
  vendorMaterial: "ai_dataops_poc.sap_demo.sap_vendor_material",
  salesOrderItem: "ai_dataops_poc.sap_demo.sap_sales_order_item",
} as const;

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * SAP table access for the chat assistant. Mock implementation today reads
 * the in-memory sample rows; a real `ApiSapDataService` would run these same
 * methods as Databricks SQL / Genie queries against the tables named above,
 * returning the same ChatQueryResult shape so chatService never changes.
 */
export interface SapDataService {
  getMaterialCount(): Promise<number>;
  listMaterials(limit?: number): Promise<ChatQueryResult>;
  topMaterialsByStandardCost(limit?: number): Promise<ChatQueryResult>;
  getVendorsForMaterial(materialId: string): Promise<ChatQueryResult>;
  getProcurementForMaterial(materialId: string): Promise<ChatQueryResult>;
  getOpenSalesOrders(country?: string): Promise<ChatQueryResult>;
  topMaterialsBySalesQuantity(limit?: number): Promise<ChatQueryResult>;
}

class MockSapDataService implements SapDataService {
  async getMaterialCount(): Promise<number> {
    return delay(SAP_MATERIAL_MASTER.length);
  }

  async listMaterials(limit = 10): Promise<ChatQueryResult> {
    const rows = SAP_MATERIAL_MASTER.slice(0, limit).map((m) => [
      m.materialId,
      m.description,
      m.materialType,
      `${m.standardCost.toFixed(2)} ${m.currency}`,
      m.country,
    ]);
    return delay({
      sourceTable: SOURCE.materialMaster,
      columns: ["Material ID", "Description", "Type", "Standard Cost", "Country"],
      rows,
    });
  }

  async topMaterialsByStandardCost(limit = 5): Promise<ChatQueryResult> {
    const sorted = [...SAP_MATERIAL_MASTER].sort((a, b) => b.standardCost - a.standardCost).slice(0, limit);
    return delay({
      sourceTable: SOURCE.materialMaster,
      columns: ["Material ID", "Description", "Standard Cost", "Country"],
      rows: sorted.map((m) => [m.materialId, m.description, `${m.standardCost.toFixed(2)} ${m.currency}`, m.country]),
      generatedSql: `SELECT material_id, description, standard_cost, country FROM ${SOURCE.materialMaster} ORDER BY standard_cost DESC LIMIT ${limit}`,
    });
  }

  async getVendorsForMaterial(materialId: string): Promise<ChatQueryResult> {
    const matches = SAP_VENDOR_MATERIAL.filter((v) => v.materialId.toUpperCase() === materialId.toUpperCase());
    return delay({
      sourceTable: SOURCE.vendorMaterial,
      columns: ["Vendor ID", "Vendor", "Purchase Price", "Currency"],
      rows: matches.map((v) => [v.vendorId, v.vendorName, v.purchasePrice.toFixed(2), v.currency]),
      generatedSql: `SELECT vendor_id, vendor_name, purchase_price, currency FROM ${SOURCE.vendorMaterial} WHERE material_id = '${materialId.toUpperCase()}'`,
    });
  }

  async getProcurementForMaterial(materialId: string): Promise<ChatQueryResult> {
    const material = SAP_MATERIAL_MASTER.find((m) => m.materialId.toUpperCase() === materialId.toUpperCase());
    const vendors = SAP_VENDOR_MATERIAL.filter((v) => v.materialId.toUpperCase() === materialId.toUpperCase());
    return delay({
      sourceTable: SOURCE.vendorMaterial,
      columns: ["Material", "Vendor", "Purchase Price", "Standard Cost"],
      rows: vendors.map((v) => [
        material?.description ?? materialId,
        v.vendorName,
        `${v.purchasePrice.toFixed(2)} ${v.currency}`,
        material ? `${material.standardCost.toFixed(2)} ${material.currency}` : "—",
      ]),
    });
  }

  async getOpenSalesOrders(country?: string): Promise<ChatQueryResult> {
    const open = SAP_SALES_ORDER_ITEM.filter((o) => o.status === "OPEN" && (!country || o.country === country));
    return delay({
      sourceTable: SOURCE.salesOrderItem,
      columns: ["Order ID", "Material", "Customer", "Quantity", "Country"],
      rows: open.map((o) => [o.orderId, o.materialId, o.customer, o.quantity, o.country]),
      generatedSql: `SELECT order_id, material_id, customer, quantity, country FROM ${SOURCE.salesOrderItem} WHERE status = 'OPEN'${country ? ` AND country = '${country}'` : ""}`,
    });
  }

  async topMaterialsBySalesQuantity(limit = 5): Promise<ChatQueryResult> {
    const totals = new Map<string, number>();
    for (const o of SAP_SALES_ORDER_ITEM) {
      totals.set(o.materialId, (totals.get(o.materialId) ?? 0) + o.quantity);
    }
    const ranked = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    return delay({
      sourceTable: SOURCE.salesOrderItem,
      columns: ["Material ID", "Description", "Total Quantity Sold"],
      rows: ranked.map(([materialId, qty]) => [
        materialId,
        SAP_MATERIAL_MASTER.find((m) => m.materialId === materialId)?.description ?? "—",
        qty,
      ]),
    });
  }
}

export const sapDataService: SapDataService = new MockSapDataService();
