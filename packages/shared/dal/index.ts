// ─── DAL (Data Access Layer) Contract — D84 Adapter Pattern ──────────────────
// เจ้าของ: App3R-WeeeU แต่เพียงผู้เดียว (Sub-CMD-P3 HUB NOTE-1)
// primitives.ts: stub สร้างโดย P4 WeeeR (parallel dev) — ใช้โดย weeer.types.ts

// ─── Shared Primitive Types ────────────────────────────────────────────────────

/** บทบาทผู้ใช้งานในระบบ App3R */
export type Role = 'weeeu' | 'weeer' | 'weeet' | 'admin';

/** ผู้ใช้งาน (User) พื้นฐาน */
export interface User {
  id: string;
  role: Role;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

/**
 * Result<T> — wrapper สำหรับผลลัพธ์ที่อาจ success หรือ error
 * ใช้แทน throw/try-catch ใน DAL layer
 */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

/**
 * Paginated<T> — ผลลัพธ์แบบแบ่งหน้า (pagination)
 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// ─── Base DAL Interface (high-level contract) ──────────────────────────────────

/**
 * IDataAccessLayer — สัญญาพื้นฐาน (base contract) ทุก adapter ต้อง implement
 * D84: Adapter Pattern — localStorageAdapter (Phase C) และ apiAdapter (Phase D-2)
 * ต่างก็ implement interface เดียวกัน → สลับ adapter โดยไม่ต้องแก้ UI code
 */
export interface IDataAccessLayer {
  /** ชื่อ adapter สำหรับ debug/logging */
  readonly adapterName: string;

  /**
   * health check — คืน true ถ้า adapter พร้อมใช้งาน
   * localStorageAdapter: ตรวจ typeof window !== 'undefined'
   * apiAdapter: ตรวจ API reachable
   */
  isAvailable(): boolean;
}

/**
 * NotImplementedError — ใช้ใน apiAdapter skeleton
 * D84: throw จากทุก method ที่ยังไม่ implement (รอ Phase D-2)
 */
export class NotImplementedError extends Error {
  constructor(scope: string) {
    super(`Not implemented — scope: ${scope}`);
    this.name = 'NotImplementedError';
  }
}

// ─── Re-export module types (per-app) ─────────────────────────────────────────
// แต่ละ app สร้าง types ไฟล์ของตัวเอง — import แยกกันตาม path

export type * from './weeeu.types';
export type * from './weeer.types'; // P4 App3R-WeeeR ✅ merged
export type * from './weeet.types'; // P5 App3R-WeeeT ✅ merged
export type * from './content.types'; // Phase D-4 Sub-3: Content CMS
export type * from './contact.types'; // Phase D-4 Sub-4: Contact Info + Form (D78)
export type * from './testimonial.types'; // Phase D-4 Sub-2: Testimonials API
