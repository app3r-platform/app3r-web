// ─── Service Progress Types (D79 verbatim — App3R-Advisor Gen 23) ─────────────
// Per-app verbatim: WeeeU copy — identical across WeeeU / WeeeR / WeeeT

export type MainStage = 'posted' | 'offer_accepted' | 'in_progress' | 'completed' | 'reviewed';
export type ServiceType = 'on_site' | 'pickup' | 'walk_in' | 'parcel';

export type OnSiteSubStage =
  | 'technician_assigned' | 'technician_dispatched' | 'technician_arrived'
  | 'inspection_started' | 'inspection_logged' | 'repair_pre_check'
  | 'repair_in_progress' | 'repair_finished' | 'handover';

export type PickupSubStage =
  | 'pickup_scheduled' | 'pickup_in_transit' | 'picked_up'
  | 'in_shop_inspection' | 'in_shop_repair' | 'repair_finished'
  | 'delivery_scheduled' | 'delivery_in_transit' | 'delivered';

export type WalkInSubStage =
  | 'dropped_off' | 'in_shop_inspection' | 'in_shop_repair'
  | 'repair_finished' | 'ready_for_pickup' | 'picked_up_by_customer';

export type ParcelSubStage =
  | 'courier_to_pickup' | 'courier_pickup_done' | 'arrived_at_shop'
  | 'in_shop_inspection' | 'in_shop_repair' | 'repair_finished'
  | 'courier_to_delivery' | 'delivered_to_customer';

export interface ProgressStepMedia {
  images: Array<{
    id: string;
    url: string;          // Lorem Picsum mock URL
    caption?: string;
    uploaded_by: 'weeeu' | 'weeer' | 'weeet';
    uploaded_at: string;  // ISO-8601
  }>;
  videos: Array<{
    id: string;
    url: string;
    duration_seconds?: number;
    caption?: string;
    uploaded_by: 'weeeu' | 'weeer' | 'weeet';
    uploaded_at: string;
  }>;
}

export interface ProgressStep {
  stage: MainStage;
  subStage?: OnSiteSubStage | PickupSubStage | WalkInSubStage | ParcelSubStage;
  enteredAt: string;
  exitedAt?: string;
  recordedBy: { role: 'weeeu' | 'weeer' | 'weeet'; userId: string; name: string };
  notes?: string;
  media: ProgressStepMedia;
}

export interface ServiceProgress {
  jobId: string;
  serviceType: ServiceType;
  currentStage: MainStage;
  currentSubStage?: string;
  history: ProgressStep[];
  createdAt: string;
  updatedAt: string;
  // Stage 5: review (WeeeU authority — customer submits)
  review?: {
    rating: 1 | 2 | 3 | 4 | 5;
    comment: string;
    submittedAt: string;
  };
}
