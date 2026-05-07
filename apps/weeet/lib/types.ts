export type JobStatus = "assigned" | "in_progress" | "completed" | "cancelled";

// --- Repair Module (Phase C-1.1) ---
export type RepairJobStatus =
  | "assigned"
  | "traveling"
  | "arrived"
  | "awaiting_entry"
  | "inspecting"
  | "awaiting_decision"
  | "awaiting_user"
  | "in_progress"
  | "completed"
  | "awaiting_review"
  | "closed"
  | "cancelled"
  | "converted_scrap";

export type RepairBranch = "B1.1" | "B1.2" | "B2.1" | "B2.2";

export interface RepairJob {
  id: string;
  job_no: string;
  service_type: "on_site" | "walk_in" | "pickup" | "parcel";
  status: RepairJobStatus;
  scheduled_at: string;
  departed_at?: string;
  arrived_at?: string;
  entry_approved_at?: string;
  weeer_approval_at?: string;
  user_approval_at?: string;
  completed_at?: string;
  closed_at?: string;
  departure_location?: { lat: number; lng: number };
  arrival_location?: { lat: number; lng: number };
  decision_branch?: RepairBranch;
  decision_notes?: string;
  original_price?: number;
  proposed_price?: number;
  final_price?: number;
  parts_added?: Array<{ name: string; qty: number; price: number }>;
  parts_used?: Array<{ name: string; qty: number }>;
  scrap_agreed_price?: number;
  arrival_files?: string[];
  pre_inspection_files?: string[];
  post_repair_files?: string[];
  deposit_amount?: number;
  deposit_action?: string;
  inspection_fee_charged?: number;
  // Display / denormalized
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_lat?: number;
  customer_lng?: number;
  appliance_name?: string;
  problem_description?: string;
  weeer_shop_name?: string;
}

export interface DiagnosePayload {
  branch: RepairBranch;
  notes: string;
  // B1.2 fields
  parts_added?: Array<{ name: string; qty: number; price: number }>;
  proposed_price?: number;
  // B2.1 fields
  cancel_reason?: string;
  cancel_category?: string;
  // B2.2 fields
  scrap_price?: number;
  scrap_weight_kg?: number;
}

export interface Job {
  id: string;
  jobNo: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  serviceType: string;
  module: string;
  scheduledAt: string;
  status: JobStatus;
  notes?: string;
  photos: { type: "before" | "after"; url: string; caption?: string }[];
  steps: { id: string; label: string; done: boolean }[];
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  email: string;
  shopName: string;
  shopId: string;
  avatarUrl?: string;
  specialties: string[];
  // Extended profile fields (R-02)
  birthDate?: string;
  address?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  educationLevel?: string;
  certificates?: string[]; // file names
}

export type AccountType = "default" | "rented";

export interface AuthState {
  isAuthenticated: boolean;
  technician: Technician | null;
  isImpersonated: boolean; // WeeeR logged in as this WeeeT
  impersonatedByShop?: string;
  accountType?: AccountType;
  forceChangePassword?: boolean; // rented only — must change on first login
}

export interface Part {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  stockQty: number;
  price: number;
}

export interface LoginLockout {
  count: number;
  lockedUntil?: number; // epoch ms
}
