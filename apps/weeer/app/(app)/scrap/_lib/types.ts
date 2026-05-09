// ── Scrap Module Types (Phase C-3.2) ───────────────────────────────────────
// D62 verbatim — ScrapItem (pre-sale entity) + ScrapJob (post-purchase pipeline)

// ── ScrapItem ─────────────────────────────────────────────────────────────
export type ConditionGrade = "grade_A" | "grade_B" | "grade_C";
export type ScrapItemStatus = "available" | "sold" | "removed";

export interface ScrapItem {
  id: string;
  sellerId: string;
  sellerType: "WeeeU";
  applianceId?: string;
  conditionGrade: ConditionGrade;
  workingParts: string[];
  description: string;
  photos: string[];
  price: number;
  status: ScrapItemStatus;
  createdAt: string;
  updatedAt: string;
}

export const CONDITION_GRADE_LABEL: Record<ConditionGrade, string> = {
  grade_A: "เกรด A",
  grade_B: "เกรด B",
  grade_C: "เกรด C",
};

export const CONDITION_GRADE_COLOR: Record<ConditionGrade, string> = {
  grade_A: "bg-green-100 text-green-700",
  grade_B: "bg-yellow-100 text-yellow-700",
  grade_C: "bg-red-100 text-red-700",
};

export const SCRAP_ITEM_STATUS_LABEL: Record<ScrapItemStatus, string> = {
  available: "พร้อมขาย",
  sold: "ขายแล้ว",
  removed: "ถอดออก",
};

export const SCRAP_ITEM_STATUS_COLOR: Record<ScrapItemStatus, string> = {
  available: "bg-green-100 text-green-700",
  sold: "bg-gray-100 text-gray-500",
  removed: "bg-red-100 text-red-500",
};

// ── ScrapJob ──────────────────────────────────────────────────────────────
export type ScrapJobOption =
  | "resell_parts"
  | "repair_and_sell"
  | "resell_as_scrap"
  | "dispose";

export type ScrapJobStatus =
  | "pending_decision"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ScrapJob {
  id: string;
  scrapItemId: string;
  buyerId: string;
  buyerType: "WeeeR";
  decision: ScrapJobOption;
  decisionAt?: string;
  status: ScrapJobStatus;
  partsCreatedIds?: string[];
  newListingId?: string;
  certificateId?: string;
  repairJobId?: string;
  createdAt: string;
  updatedAt: string;

  // denormalized for display
  scrapItemDescription?: string;
  conditionGrade?: ConditionGrade;
}

export const SCRAP_JOB_OPTION_LABEL: Record<ScrapJobOption, string> = {
  resell_parts:    "แยกอะไหล่",
  repair_and_sell: "ซ่อมขาย (รอ C-3.3)",
  resell_as_scrap: "ขายต่อซาก",
  dispose:         "รีไซเคิล",
};

export const SCRAP_JOB_STATUS_LABEL: Record<ScrapJobStatus, string> = {
  pending_decision: "รอตัดสินใจ",
  in_progress:      "กำลังดำเนินการ",
  completed:        "เสร็จสิ้น",
  cancelled:        "ยกเลิก",
};

export const SCRAP_JOB_STATUS_COLOR: Record<ScrapJobStatus, string> = {
  pending_decision: "bg-yellow-100 text-yellow-700",
  in_progress:      "bg-blue-100 text-blue-700",
  completed:        "bg-green-100 text-green-700",
  cancelled:        "bg-gray-100 text-gray-500",
};

// ── EWasteCertificate ─────────────────────────────────────────────────────
export type CertStatus = "pending" | "issued" | "rejected";

export interface EWasteCertificate {
  id: string;
  scrapJobId: string;
  issuedById: string;
  issuedAt: string;
  certNumber: string;
  itemDescription: string;
  status: CertStatus;
  htmlUrl?: string;
}

export const CERT_STATUS_LABEL: Record<CertStatus, string> = {
  pending:  "รอออกใบรับรอง",
  issued:   "ออกแล้ว",
  rejected: "ปฏิเสธ",
};

export const CERT_STATUS_COLOR: Record<CertStatus, string> = {
  pending:  "bg-yellow-100 text-yellow-700",
  issued:   "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};
