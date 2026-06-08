// RC-1: Mock fallback data สำหรับ parts inventory API (dev/offline)
// หมายเหตุ: B2B mock data อยู่ใน mock-data.ts (PartListing/PartOrder/ShopMock)
import type { Part, StockMovement } from "./types";

export const MOCK_PARTS: Part[] = [
  {
    id: "mock-p-001", shopId: "shop-mock-001",
    name: "แผงวงจร PCB แอร์ Mitsubishi MSZ-GE", sku: "PCB-MIT-MSZGE",
    category: "electronic", unit: "ชิ้น", condition: "used",
    stockQty: 3, reservedQty: 0, unitPrice: 1200,
    imageUrl: "https://picsum.photos/seed/p001/200/150",
    source: { type: "disassembly" },
    createdAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
  },
  {
    id: "mock-p-002", shopId: "shop-mock-001",
    name: "มอเตอร์พัดลม Indoor 25W", sku: "MTR-FAN-25W",
    category: "mechanical", unit: "ชิ้น", condition: "new",
    stockQty: 6, reservedQty: 1, unitPrice: 450,
    source: { type: "purchase" },
    createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
  },
  {
    id: "mock-p-003", shopId: "shop-mock-001",
    name: "น้ำยาแอร์ R32 กระป๋อง 1kg", sku: "REF-R32-1KG",
    category: "consumable", unit: "กระป๋อง", condition: "new",
    stockQty: 10, reservedQty: 0, unitPrice: 550,
    source: { type: "purchase" },
    createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
  },
];

export const MOCK_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: "mov-mock-001", partId: "mock-p-001",
    type: "STOCK_IN", qty: 3, reason: "receive_from_disassembly",
    refId: "scrap-job-001", note: "แยกจากซากแอร์ SC002",
    performedBy: "shop-mock-001",
    performedAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    balanceAfter: 3,
  },
  {
    id: "mov-mock-002", partId: "mock-p-002",
    type: "STOCK_IN", qty: 6, reason: "purchase",
    note: "สั่งซื้อจากผู้จัดหน่าย",
    performedBy: "shop-mock-001",
    performedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    balanceAfter: 6,
  },
];

export const MOCK_PARTS_DASHBOARD = {
  total_skus: 3,
  total_stock_value: MOCK_PARTS.reduce((sum, p) => sum + p.stockQty * p.unitPrice, 0),
  low_stock: MOCK_PARTS.filter(p => p.stockQty - p.reservedQty <= 2),
  recent_movements: MOCK_STOCK_MOVEMENTS,
};
