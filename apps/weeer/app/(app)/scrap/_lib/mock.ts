// RC-1: Mock fallback data สำหรับ scrap API (dev/offline)
import type { ScrapItem, ScrapJob, EWasteCertificate } from "./types";

export const MOCK_SCRAP_ITEMS: ScrapItem[] = [
  {
    id: "SC001",
    sellerId: "u-mock-001", sellerType: "WeeeU",
    applianceName: "ตู้เย็น Mitsubishi 2 ประตู ซ่อมไม่คุ้ม", applianceBrand: "Mitsubishi",
    applianceType: "refrigerator",
    conditionGrade: "grade_B",
    workingParts: ["มอเตอร์พัดลม", "คอมเพรสเซอร์"],
    description: "ตู้เย็นเก่า สภาพพอใช้ มอเตอร์และคอมเพรสเซอร์ยังใช้ได้",
    photos: ["https://picsum.photos/seed/sc001/300/200"],
    price: 1800,
    status: "available",
    createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
  },
  {
    id: "SC002",
    sellerId: "u-mock-002", sellerType: "WeeeU",
    applianceName: "แอร์ Mitsubishi 12000 BTU ซ่อมไม่คุ้ม", applianceBrand: "Mitsubishi",
    applianceType: "ac",
    conditionGrade: "grade_C",
    workingParts: ["PCB หลัก"],
    description: "แอร์เก่า คอมเพรสเซอร์แตก เหลือแต่บอร์ด",
    photos: ["https://picsum.photos/seed/sc002/300/200"],
    price: 450,
    status: "sold",
    createdAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 3600000).toISOString(),
  },
  {
    id: "SC003",
    sellerId: "u-mock-003", sellerType: "WeeeU",
    applianceName: "เครื่องซักผ้า Samsung 8kg ไม่หมุน", applianceBrand: "Samsung",
    applianceType: "washing_machine",
    conditionGrade: "grade_A",
    workingParts: ["PCB หลัก", "มอเตอร์หลัก", "จอแสดงผล"],
    description: "เพิ่งหมดประกัน ตัวถังดี PCB/motor ใช้ได้ เฉพาะ drum bearing เสีย",
    photos: ["https://picsum.photos/seed/sc003/300/200"],
    price: 2200,
    isFree: false,
    status: "available",
    createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
  },
];

export const MOCK_SCRAP_JOBS: ScrapJob[] = [
  {
    id: "SPJ-001",
    scrapItemId: "SC002",
    buyerId: "weeer-demo-001", buyerType: "WeeeR",
    decision: "resell_parts",
    status: "in_progress",
    createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    scrapItemDescription: "แอร์ Mitsubishi 12000 BTU ซ่อมไม่คุ้ม",
    conditionGrade: "grade_C",
    offerPrice: 450,
  },
  {
    id: "SPJ-002",
    scrapItemId: "SC003",
    buyerId: "weeer-demo-001", buyerType: "WeeeR",
    decision: "resell_parts",
    status: "pending_decision",
    createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    scrapItemDescription: "เครื่องซักผ้า Samsung 8kg",
    conditionGrade: "grade_A",
    offerPrice: 2200,
  },
];

export const MOCK_SCRAP_DASHBOARD = {
  availableCount: 2,
  soldCount: 1,
  activeJobs: 2,
  pendingDecisions: 1,
};

export const MOCK_EWASTE_CERTIFICATE: EWasteCertificate = {
  id: "cert-mock-001",
  scrapJobId: "SPJ-001",
  issuedById: "admin-mock-001",
  issuedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
  certNumber: "EWASTE-2026-0001",
  itemDescription: "แอร์ Mitsubishi 12000 BTU",
  status: "issued",
};
