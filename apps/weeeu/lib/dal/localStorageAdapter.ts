// ─── localStorageAdapter — DAL (D84) Phase C localStorage implementation ──────
// Wraps Phase C mock logic (service-progress-sync.ts + api-client.ts auth)
// ห้ามลบ logic Phase C — ยังต้อง work ตอน feature flag OFF
"use client";

import type { IDataAccessLayer, Result, Paginated, User } from "@app3r/shared/dal";
import type {
  IAuthDAL,
  IServiceProgressDAL,
  IWeeeuApplianceDAL,
  IWeeeuRepairRequestDAL,
  IWeeeuDAL,
  IUploadDAL,
  IPushDAL,
  IPaymentDAL,
  ILocationDAL,
  ITransferDAL,
  UploadPresignResult,
  UploadFinalizeResult,
  PaymentIntentResult,
  PaymentStatus,
  GeocodeResult,
  SavedLocation,
  Transfer,
  DepositInfo,
  WeeeuAppliance,
  WeeeuRepairRequest,
} from "@app3r/shared/dal/weeeu";
import type { ServiceProgress } from "@/lib/types/service-progress";
import {
  getServiceProgress,
  setServiceProgress,
  getJobProgress,
  upsertJobProgress,
  submitReview as syncSubmitReview,
} from "@/lib/utils/service-progress-sync";

// ─── Auth (การยืนยันตัวตน) ────────────────────────────────────────────────────

const TOKEN_KEY = "access_token";
const DEV_TOKEN = "dev-jwt-weeeu-mock";

const authAdapter: IAuthDAL = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  },
  getCurrentUser(): Result<User> {
    // Phase C: mock user — Phase D-2 จะ swap ไป API
    const token = authAdapter.getToken();
    if (!token) return { ok: false, error: "ไม่ได้เข้าสู่ระบบ", code: "UNAUTHENTICATED" };
    return {
      ok: true,
      data: {
        id: "u-001",
        role: "weeeu",
        name: "สมชาย ใจดี",
        phone: "081-234-5678",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    };
  },
};

// ─── Service Progress (ติดตามความคืบหน้างานซ่อม) ─────────────────────────────

const serviceProgressAdapter: IServiceProgressDAL<ServiceProgress> = {
  getAll(): Result<ServiceProgress[]> {
    try {
      return { ok: true, data: getServiceProgress() };
    } catch (e) {
      return { ok: false, error: "ไม่สามารถอ่านข้อมูลงานซ่อมได้" };
    }
  },

  getById(jobId: string): Result<ServiceProgress> {
    const job = getJobProgress(jobId);
    if (!job) return { ok: false, error: `ไม่พบงานซ่อม jobId=${jobId}`, code: "NOT_FOUND" };
    return { ok: true, data: job };
  },

  upsert(job: ServiceProgress): Result<ServiceProgress> {
    try {
      upsertJobProgress(job);
      return { ok: true, data: { ...job, updatedAt: new Date().toISOString() } };
    } catch (e) {
      return { ok: false, error: "บันทึกข้อมูลไม่สำเร็จ" };
    }
  },

  submitReview(
    jobId: string,
    rating: 1 | 2 | 3 | 4 | 5,
    comment: string,
  ): Result<ServiceProgress> {
    const ok = syncSubmitReview(jobId, rating, comment);
    if (!ok) return { ok: false, error: "ส่งรีวิวไม่สำเร็จ — ต้องอยู่ใน stage completed ก่อน" };
    const updated = getJobProgress(jobId);
    if (!updated) return { ok: false, error: "ไม่พบข้อมูลหลังส่งรีวิว" };
    return { ok: true, data: updated };
  },
};

// ─── Appliances (เครื่องใช้ไฟฟ้า) — Phase C mock ──────────────────────────────

const appliancesAdapter: IWeeeuApplianceDAL = {
  list(): Result<Paginated<WeeeuAppliance>> {
    // Phase C: mock empty — Phase D-2 จะดึงจาก API จริง
    return {
      ok: true,
      data: { items: [], total: 0, page: 1, pageSize: 20, hasNext: false },
    };
  },
  get(id: string): Result<WeeeuAppliance> {
    return { ok: false, error: `Appliance ${id} not found (Phase C mock)`, code: "NOT_FOUND" };
  },
};

// ─── Repair Requests (การแจ้งซ่อม) — Phase C mock ────────────────────────────

const repairRequestsAdapter: IWeeeuRepairRequestDAL = {
  list(): Result<Paginated<WeeeuRepairRequest>> {
    return {
      ok: true,
      data: { items: [], total: 0, page: 1, pageSize: 20, hasNext: false },
    };
  },
  get(id: string): Result<WeeeuRepairRequest> {
    return { ok: false, error: `RepairRequest ${id} not found (Phase C mock)`, code: "NOT_FOUND" };
  },
};

// ─── Upload mock (D87) — Phase C: fake presign + finalize ────────────────────

const SAVED_LOCATIONS_KEY = "weeeu_saved_locations";

const uploadAdapter: IUploadDAL = {
  async presign(params): Promise<Result<UploadPresignResult>> {
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    // Phase C mock: presignedUrl ไม่ใช่ URL จริง (PUT จะ fail ได้ แต่ flow ยังดำเนินต่อ)
    const presignedUrl = `https://mock-r2.example.com/${params.context ?? "file"}/${uploadId}/${encodeURIComponent(params.filename)}`;
    return { ok: true, data: { uploadId, presignedUrl } };
  },

  async finalize(uploadId: string): Promise<Result<UploadFinalizeResult>> {
    const fileId = `file-${uploadId}`;
    return {
      ok: true,
      data: {
        fileId,
        signedGetUrl: `https://picsum.photos/seed/${fileId}/400/300`,
        scanStatus: "clean",
      },
    };
  },

  async getScanStatus(fileId: string): Promise<Result<{ status: 'pending' | 'clean' | 'infected' }>> {
    return { ok: true, data: { status: "clean" } };
  },
};

// ─── Push mock (D88) — Phase C: no-op subscribe ───────────────────────────────

const pushAdapter: IPushDAL = {
  async subscribe(_params): Promise<Result<{ subscriptionId: string }>> {
    const subscriptionId = `sub-mock-${Date.now()}`;
    return { ok: true, data: { subscriptionId } };
  },

  async unsubscribe(_subscriptionId: string): Promise<Result<void>> {
    return { ok: true, data: undefined };
  },
};

// ─── Payment mock (D89) — Phase C: fake checkout URL ─────────────────────────

const paymentAdapter: IPaymentDAL = {
  async createIntent(params): Promise<Result<PaymentIntentResult>> {
    const intentId = `intent-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const checkoutUrl = `/payment/mock-success?intentId=${intentId}&amount=${params.amount}`;
    return { ok: true, data: { intentId, checkoutUrl } };
  },

  async getStatus(intentId: string): Promise<Result<PaymentStatus>> {
    return {
      ok: true,
      data: {
        intentId,
        status: "paid",
        paidAt: new Date().toISOString(),
        amount: 0,
        currency: "THB",
      },
    };
  },
};

// ─── Location mock (D90) — Phase C: hardcoded Bangkok locations ───────────────

const MOCK_GEOCODE: Record<string, GeocodeResult> = {
  "place-001": { placeId: "place-001", formattedAddress: "สยามพารากอน, กรุงเทพมหานคร", lat: 13.7465, lng: 100.5347 },
  "place-002": { placeId: "place-002", formattedAddress: "จตุจักร, กรุงเทพมหานคร", lat: 13.7998, lng: 100.5499 },
  "place-003": { placeId: "place-003", formattedAddress: "อนุสาวรีย์ชัยสมรภูมิ, กรุงเทพมหานคร", lat: 13.7646, lng: 100.5370 },
  "place-004": { placeId: "place-004", formattedAddress: "เซ็นทรัลเวิลด์, กรุงเทพมหานคร", lat: 13.7469, lng: 100.5390 },
  "place-005": { placeId: "place-005", formattedAddress: "ท่าอากาศยานสุวรรณภูมิ, สมุทรปราการ", lat: 13.6900, lng: 100.7501 },
};

const locationAdapter: ILocationDAL = {
  async geocode(placeId: string): Promise<Result<GeocodeResult>> {
    const result = MOCK_GEOCODE[placeId];
    if (!result) {
      // Generic fallback สำหรับ placeId ที่ไม่รู้จัก
      return {
        ok: true,
        data: { placeId, formattedAddress: "สถานที่ที่เลือก", lat: 13.7563, lng: 100.5018 },
      };
    }
    return { ok: true, data: result };
  },

  async save(params): Promise<Result<SavedLocation>> {
    if (typeof window === "undefined") return { ok: false, error: "ไม่รองรับ server-side" };
    const existing: SavedLocation[] = JSON.parse(localStorage.getItem(SAVED_LOCATIONS_KEY) ?? "[]");
    const saved: SavedLocation = {
      id: `loc-${Date.now()}`,
      userId: "u-001",
      label: params.label,
      formattedAddress: params.formattedAddress,
      lat: params.lat,
      lng: params.lng,
      createdAt: new Date().toISOString(),
    };
    existing.push(saved);
    localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(existing));
    return { ok: true, data: saved };
  },

  async list(): Promise<Result<SavedLocation[]>> {
    if (typeof window === "undefined") return { ok: true, data: [] };
    const items: SavedLocation[] = JSON.parse(localStorage.getItem(SAVED_LOCATIONS_KEY) ?? "[]");
    return { ok: true, data: items };
  },
};

// ─── Transfer mock (Decision Record C) — Phase C: manual bank transfer ────────

const TRANSFER_HISTORY_KEY = "weeeu_transfer_history";

const transferAdapter: ITransferDAL = {
  async getDepositInfo(): Promise<Result<DepositInfo>> {
    return {
      ok: true,
      data: {
        promptPayId: "0812345678",
        accountName: "บริษัท แอพ3อาร์ จำกัด",
        accountNumber: "123-4-56789-0",
        bankName: "ธนาคารกสิกรไทย",
        pointRate: 1, // 1 บาท = 1 point
      },
    };
  },

  async deposit(params): Promise<Result<Transfer>> {
    if (typeof window === "undefined") return { ok: false, error: "ไม่รองรับ server-side" };
    const transfer: Transfer = {
      id: `dep-${Date.now()}`,
      userId: "u-001",
      type: "deposit",
      amount: params.amount,
      points: params.amount, // 1:1 rate ใน Phase C
      status: "pending",
      slipFileId: params.slipFileId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const history: Transfer[] = JSON.parse(localStorage.getItem(TRANSFER_HISTORY_KEY) ?? "[]");
    history.unshift(transfer);
    localStorage.setItem(TRANSFER_HISTORY_KEY, JSON.stringify(history));
    return { ok: true, data: transfer };
  },

  async withdraw(params): Promise<Result<Transfer>> {
    if (typeof window === "undefined") return { ok: false, error: "ไม่รองรับ server-side" };
    const transfer: Transfer = {
      id: `wdr-${Date.now()}`,
      userId: "u-001",
      type: "withdraw",
      amount: params.points, // 1:1 rate ใน Phase C
      points: params.points,
      status: "pending",
      bankName: params.bankName,
      bankAccount: params.bankAccount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const history: Transfer[] = JSON.parse(localStorage.getItem(TRANSFER_HISTORY_KEY) ?? "[]");
    history.unshift(transfer);
    localStorage.setItem(TRANSFER_HISTORY_KEY, JSON.stringify(history));
    return { ok: true, data: transfer };
  },

  async history(params): Promise<Result<Transfer[]>> {
    if (typeof window === "undefined") return { ok: true, data: [] };
    const all: Transfer[] = JSON.parse(localStorage.getItem(TRANSFER_HISTORY_KEY) ?? "[]");
    const filtered = params?.type ? all.filter((t) => t.type === params.type) : all;
    return { ok: true, data: filtered };
  },
};

// ─── LocalStorageAdapter (รวมทุก module) ─────────────────────────────────────

class LocalStorageAdapter implements IDataAccessLayer, IWeeeuDAL {
  readonly adapterName = "localStorageAdapter";

  readonly auth = authAdapter;
  readonly serviceProgress = serviceProgressAdapter;
  readonly appliances = appliancesAdapter;
  readonly repairRequests = repairRequestsAdapter;
  readonly upload = uploadAdapter;
  readonly push = pushAdapter;
  readonly payment = paymentAdapter;
  readonly location = locationAdapter;
  readonly transfer = transferAdapter;

  isAvailable(): boolean {
    return typeof window !== "undefined";
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
export type { LocalStorageAdapter };
