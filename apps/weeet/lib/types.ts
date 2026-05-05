export type JobStatus = "assigned" | "in_progress" | "completed" | "cancelled";

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
