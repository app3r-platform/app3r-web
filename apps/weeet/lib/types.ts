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
}

export interface AuthState {
  isAuthenticated: boolean;
  technician: Technician | null;
  isImpersonated: boolean; // WeeeR logged in as this WeeeT
  impersonatedByShop?: string;
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
