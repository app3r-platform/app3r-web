// RC-1: Mock fallback data สำหรับ resell API (dev/offline)
import type { UsedAppliance, Listing, Offer, ResellTransaction } from "./types";

function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

export const MOCK_RESELL_INVENTORY: UsedAppliance[] = [
  {
    id: "ua-mock-001", shopId: "shop-mock-001",
    name: "แอร์ Daikin 12000 BTU มือสอง", brand: "Daikin", model: "FTKF35TV2S",
    category: "AC", condition: "good", costPrice: 3000, suggestedPrice: 4500,
    imageUrl: "https://picsum.photos/seed/ua001/300/200",
    status: "in_stock",
    createdAt: addDays(new Date(), -10).toISOString(), updatedAt: addDays(new Date(), -5).toISOString(),
  },
  {
    id: "ua-mock-002", shopId: "shop-mock-001",
    name: "ตู้เย็น Samsung 2 ประตู 14 คิว", brand: "Samsung", model: "RT35K5559S8",
    category: "Refrigerator", condition: "fair", costPrice: 2000, suggestedPrice: 3200,
    imageUrl: "https://picsum.photos/seed/ua002/300/200",
    status: "listed",
    createdAt: addDays(new Date(), -15).toISOString(), updatedAt: addDays(new Date(), -3).toISOString(),
  },
];

export const MOCK_RESELL_LISTINGS: Listing[] = [
  {
    id: "L001", sellerId: "shop-mock-001", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "แอร์ Daikin 12000 BTU มือสอง", applianceBrand: "Daikin",
    price: 4500, deliveryMethods: ["นัดรับ"], status: "receiving_offers",
    expiresAt: addDays(new Date(), 21).toISOString(),
    createdAt: addDays(new Date(), -7).toISOString(), updatedAt: addDays(new Date(), -1).toISOString(),
    offerCount: 2,
    description: "สภาพดี อายุ 3 ปี ยังใช้งานได้ดี",
    terms3: { shipping: "ผู้ซื้อรับผิดชอบ", usedWarranty: "7 วัน", liability: "ผู้ขายรับผิด" },
  },
  {
    id: "L002", sellerId: "shop-mock-001", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "ตู้เย็น Samsung 14 คิว", applianceBrand: "Samsung",
    price: 3200, deliveryMethods: ["นัดรับ", "จัดส่ง"], status: "receiving_offers",
    expiresAt: addDays(new Date(), 14).toISOString(),
    createdAt: addDays(new Date(), -3).toISOString(), updatedAt: addDays(new Date(), -1).toISOString(),
    offerCount: 0,
    terms3: { shipping: "ผู้ขายรับผิดชอบ", usedWarranty: "7 วัน", liability: "ผู้ขายรับผิด" },
  },
];

export const MOCK_RESELL_DASHBOARD = {
  total_inventory: 2,
  total_listings_active: 2,
  total_offers_pending: 2,
  total_revenue: 0,
  recent_listings: MOCK_RESELL_LISTINGS,
};

export const MOCK_MARKETPLACE_LISTINGS: Listing[] = [
  {
    id: "r001", sellerId: "shop-001", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "แอร์ Daikin 12000 BTU มือสอง", applianceBrand: "Daikin",
    price: 4500, deliveryMethods: ["นัดรับ"], status: "receiving_offers",
    expiresAt: addDays(new Date(), 21).toISOString(),
    createdAt: addDays(new Date(), -5).toISOString(), updatedAt: addDays(new Date(), -1).toISOString(),
    offerCount: 0,
    description: "แอร์ Daikin 12000 BTU มือสอง สภาพดี อายุ 3 ปี",
    terms3: { shipping: "ผู้ซื้อรับผิดชอบ", usedWarranty: "7 วัน", liability: "ผู้ขายรับผิด" },
  },
  {
    id: "r002", sellerId: "shop-002", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "ตู้เย็น Samsung 2 ประตู 14 คิว", applianceBrand: "Samsung",
    price: 3200, deliveryMethods: ["นัดรับ", "จัดส่ง"], status: "receiving_offers",
    expiresAt: addDays(new Date(), 14).toISOString(),
    createdAt: addDays(new Date(), -3).toISOString(), updatedAt: addDays(new Date(), -1).toISOString(),
    offerCount: 2,
    terms3: { shipping: "ผู้ขายรับผิดชอบ", usedWarranty: "7 วัน", liability: "ผู้ขายรับผิด" },
  },
  {
    id: "MKT001", sellerId: "U999", sellerType: "WeeeU", listingType: "used_appliance",
    applianceName: 'Sony Bravia XR 55" A80K', applianceBrand: "Sony", applianceModel: "XR55A80K",
    price: 16500, deliveryMethods: ["ส่ง Kerry", "รับเอง"], status: "receiving_offers",
    expiresAt: addDays(new Date(), 7).toISOString(),
    createdAt: addDays(new Date(), -8).toISOString(), updatedAt: addDays(new Date(), -2).toISOString(),
    description: "สภาพ 90% มีรีโมท มีกล่อง ขาตั้งครบ",
    warranty: { sourceWarranty: 4, additionalWarranty: 0 },
    terms3: { shipping: "ผู้ซื้อรับผิดชอบ", usedWarranty: "14 วัน", liability: "ผู้ขายรับผิด" },
    offerCount: 1,
  },
];

export const MOCK_MY_OFFERS: Offer[] = [
  {
    id: "O3", listingId: "L002", buyerId: "S1", buyerType: "WeeeR",
    offerPrice: 8500, deliveryMethod: "รับเอง", status: "selected",
    expiresAt: addDays(new Date(), 7).toISOString(), createdAt: addDays(new Date(), -3).toISOString(),
    listingTitle: "Dyson V15 Detect", buyerName: "ร้านของฉัน",
    message: "ราคาตามประกาศ",
  },
  {
    id: "O5", listingId: "MKT001", buyerId: "S1", buyerType: "WeeeR",
    offerPrice: 15000, deliveryMethod: "ส่ง Kerry", status: "pending",
    expiresAt: addDays(new Date(), 7).toISOString(), createdAt: addDays(new Date(), -2).toISOString(),
    listingTitle: 'Sony Bravia XR 55"', buyerName: "ร้านของฉัน",
  },
  {
    id: "O6", listingId: "MKT002", buyerId: "S1", buyerType: "WeeeR",
    offerPrice: 5200, deliveryMethod: "รับเอง", status: "rejected",
    expiresAt: addDays(new Date(), -1).toISOString(), createdAt: addDays(new Date(), -6).toISOString(),
    listingTitle: 'iPad Pro 11" M2', buyerName: "ร้านของฉัน",
  },
];

export const MOCK_LISTING_OFFERS: Offer[] = [
  {
    id: "LO-mock-001", listingId: "L001", buyerId: "u-buyer-001", buyerType: "WeeeU",
    offerPrice: 4200, deliveryMethod: "นัดรับ", status: "pending",
    expiresAt: addDays(new Date(), 3).toISOString(), createdAt: addDays(new Date(), -1).toISOString(),
    listingTitle: "แอร์ Daikin 12000 BTU", buyerName: "คุณสมชาย",
    message: "ราคาต่อลงได้ไหมครับ",
  },
  {
    id: "LO-mock-002", listingId: "L001", buyerId: "u-buyer-002", buyerType: "WeeeU",
    offerPrice: 4500, deliveryMethod: "นัดรับ", status: "pending",
    expiresAt: addDays(new Date(), 5).toISOString(), createdAt: addDays(new Date(), -2).toISOString(),
    listingTitle: "แอร์ Daikin 12000 BTU", buyerName: "คุณวิไล",
  },
];

export const MOCK_RESELL_TRANSACTIONS: ResellTransaction[] = [
  {
    id: "TXN-mock-001", listingId: "L001",
    applianceName: "แอร์ Daikin 12000 BTU มือสอง",
    sellerName: "ร้านของฉัน", buyerName: "คุณสมชาย รักช่าง",
    price: 4500, status: "in_progress", deliveryMethod: "นัดรับ",
    createdAt: addDays(new Date(), -3).toISOString(), updatedAt: addDays(new Date(), -1).toISOString(),
    role: "seller",
  },
];
