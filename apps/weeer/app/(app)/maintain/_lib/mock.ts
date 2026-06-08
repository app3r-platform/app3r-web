// RC-1: Mock fallback data สำหรับ maintain API (dev/offline)
import type { MaintainJob } from "./types";

export const MOCK_MAINTAIN_JOBS: MaintainJob[] = [
  {
    id: "mock-mj-001",
    serviceCode: "M-2026-001",
    customerId: "u-mock-001",
    shopId: "shop-mock-001",
    technicianId: "t-mock-001",
    status: "assigned",
    applianceType: "AC",
    cleaningType: "deep",
    serviceMethod: "on_site",
    scheduledAt: new Date(Date.now() + 24 * 3600000).toISOString(),
    estimatedDuration: 3,
    address: { lat: 13.7563, lng: 100.5018, address: "123 ถ.สาทร กรุงเทพฯ 10120" },
    totalPrice: 650,
    createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "mock-mj-002",
    serviceCode: "M-2026-002",
    customerId: "u-mock-002",
    status: "pending",
    applianceType: "WashingMachine",
    cleaningType: "general",
    serviceMethod: "on_site",
    scheduledAt: new Date(Date.now() + 48 * 3600000).toISOString(),
    estimatedDuration: 2,
    address: { lat: 13.7265, lng: 100.5252, address: "456 ถ.พระราม 4 กรุงเทพฯ" },
    totalPrice: 450,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const MOCK_MAINTAIN_QUEUE: MaintainJob[] = [
  {
    id: "mock-mq-001",
    serviceCode: "M-2026-Q01",
    customerId: "u-queue-001",
    status: "pending",
    applianceType: "AC",
    cleaningType: "sanitize",
    serviceMethod: "on_site",
    scheduledAt: new Date(Date.now() + 36 * 3600000).toISOString(),
    estimatedDuration: 4,
    address: { lat: 13.7450, lng: 100.5340, address: "789 ถ.เพชรบุรี กรุงเทพฯ" },
    totalPrice: 900,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
