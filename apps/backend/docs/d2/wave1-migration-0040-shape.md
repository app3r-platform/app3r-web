# D2 Resell · Wave 1 — Migration 0040+ Shape Doc (Backend Gen 6 · LEAD)

**Status:** ⚠️ **DRAFT — ยังไม่ apply DEV** · รอ Advisor review (ruling G3: "migration 0040+ → ส่ง Advisor review ก่อน apply")
**Branch:** `feature/d2-resell-slice` @ base `e7cd3c4` · **Ruling:** `389813ec-7277-81fb` (8 จุด)
**Co-lead:** Point (review settlement/G4) · **Gate:** tsc PASS (draft compile) · ❌ no apply · ❌ no merge main

หลักการ: **additive ทั้งหมด** — ตารางใหม่ 2 ตาราง + ALTER settlements (empty DEV) · ไม่ลบ/แก้ตารางที่ chat อื่นใช้ · drizzle-kit frozen → hand-written SQL idempotent (migrate-all auto-glob + `_migration_log`).

---

## 1. `resell_fulfillment` (ใหม่ · migration 0040 · ruling G3)

ข้อมูลส่ง/ตรวจรับ ต่อ 1 transaction. Anchor `listing_meta` (1:1). ครอบ flow step 6-8 (in_progress→delivered→inspection_period).

| column | type | null | เหตุผล |
|---|---|---|---|
| `id` | uuid PK | — | gen_random_uuid |
| `listing_id` | uuid | ❌ | FK→`listing_meta.listing_id` ON DELETE CASCADE · anchor 1:1 |
| `delivery_method` | varchar(20) | ✅ | parcel\|on_site (CHECK) · จริงตอนส่ง (อาจต่างจาก offer) |
| `carrier` | varchar(50) | ✅ | ผู้ขนส่ง (parcel) · null=on_site |
| `tracking_no` | varchar(100) | ✅ | เลขพัสดุ (parcel) |
| `ship_at` | timestamptz | ✅ | seller ส่ง → delivered |
| `deliver_at` | timestamptz | ✅ | ถึง buyer |
| `inspection_deadline` | timestamptz | ✅ | **R7 auto-complete job** (Backend deadline · Gen 86 ไม่มี screen) |
| `ship_evidence` | jsonb | ✅ | file_uploads ref[] — seller pre-ship บังคับ (R6) |
| `receipt_evidence` | jsonb | ✅ | file_uploads ref[] — buyer on-receipt (R8) |
| `created_at`/`updated_at` | timestamptz | ❌ | now() |

**Constraints:** `uq_resell_fulfillment_listing` UNIQUE(listing_id · 1:1) · `idx_resell_fulfillment_deadline`(inspection_deadline · R7 job scan) · CHECK delivery_method∈{parcel,on_site}|NULL.
**evidence = file_uploads ref[]:** jsonb เก็บ array ของ file id (generic `file_uploads`) — ไม่ hard FK (multi-file · pattern เดียวกับ jsonb refs เดิม).

---

## 2. `resell_disputes` (ใหม่ · migration 0041 · ruling G3)

ข้อพิพาท ต่อ transaction. Anchor `listing_meta`. R6/R8/R10/R11. `listing_meta.state='disputed'` = overlay; ตารางนี้เก็บ detail/resolution.

| column | type | null | เหตุผล |
|---|---|---|---|
| `id` | uuid PK | — | |
| `listing_id` | uuid | ❌ | FK→`listing_meta` CASCADE · anchor |
| `raised_by_user_id` | uuid | ❌ | FK→`users` RESTRICT · ผู้เปิด (buyer/seller) |
| `dispute_type` | varchar(30) | ❌ | CHECK: not_as_described(R8)\|damaged(R8)\|not_shipped(R6)\|parcel_damage(R11)\|other |
| `reason` | text | ❌ | รายละเอียด |
| `evidence` | jsonb | ✅ | file_uploads ref[] |
| `status` | varchar(20) | ❌ | CHECK: open\|under_review\|resolved\|rejected · default 'open' |
| `resolution` | varchar(20) | ✅ | **3-way (G3): buyer\|seller\|split** · null จน resolve |
| `resolution_note` | text | ✅ | เหตุผล admin |
| `resolved_by_user_id` | uuid | ✅ | FK→`users` SET NULL · admin |
| `resolved_at` | timestamptz | ✅ | |
| `created_at`/`updated_at` | timestamptz | ❌ | now() |

**Constraints:** idx(listing_id · status · raised_by) · CHECK type/status/resolution.
**3-way resolution (ruling G3):** buyer=refund→buyer · seller=release→seller · split=แบ่ง (Wave 2 escrow-rewire จะ map resolution→escrow_holds release/refund/split + D75).

---

## 3. `settlements` ALTER (migration 0042 · ruling G4)

settlements เดิม FK service-only → block Resell. ALTER ให้ polymorphic. **settlements empty DEV (0 rows)** → ALTER ปลอดภัย.

| การเปลี่ยน | จาก | เป็น | เหตุผล |
|---|---|---|---|
| `service_id` | NOT NULL FK→services | **nullable** FK→services | resell ไม่มี services row (G4) |
| `source` | — | **text NOT NULL DEFAULT 'service'** · CHECK(service\|resell) | discriminator (G4) |
| `transaction_ref` | — | **uuid nullable** + index | resell linkage →listing_meta (polymorphic · no hard FK เหมือน escrow_holds) |
| CHECK `chk_settlements_ref` | — | source=service⇒service_id NOT NULL · source=resell⇒transaction_ref NOT NULL | integrity discriminator |

**point-layer≠THB · U↔U ไม่ over-engineer:** settlement = THB bank layer (WeeeR→THB cash-out). U↔U resell จบใน Gold wallet ตรง (ไม่มี settlement row). resell settlement เกิดเฉพาะ WeeeR seller ขอถอน THB.

> ⚠️ **Advisor confirm (beyond literal G4):** G4 ระบุแค่ "service_id nullable + source enum". `transaction_ref` + `chk_settlements_ref` = ส่วนเพิ่ม (resell linkage ขั้นต่ำ · additive nullable) → ขอ Advisor ยืนยัน/ตัดออกได้ใน review. ถ้าตัด → resell settlement จะ link ผ่าน escrow_holds.transaction_ref แทน (indirect).

---

## 4. นอก scope Wave 1 (flag → Wave 2+)

- **funding window deadline (ruling 1A · R4):** เงินล็อกจริง@buyer_confirmed ใน 24h window → ต้องเก็บ `funding_deadline` (offer-level หรือ listing-level) · **ไม่อยู่ใน Wave 1** (escrow-rewire Wave 2) · escrow_holds ไม่มี state 'pending' (D1 locked) → track นอกตาราง escrow
- **2A faultParty:** เก็บใน audit metadata (`admin_config_audit` jsonb เดิม) ไม่ต้องตารางใหม่ → code-layer Wave 2
- **G2 escrow rewire** (listing-state.ts → escrow_holds + fee@release) = Wave 2 (code, ไม่ใช่ schema)

---

## 5. Verify (gate Wave 1)
- ✅ tsc PASS (draft compile · schema .ts + index export)
- ❌ **ไม่ apply DEV** (Advisor review ก่อน · ruling G3)
- ❌ ไม่ merge main · DEV/branch only
- migrate-all = auto-glob → 0040/0041/0042 จะถูก pick ตอน apply (Wave 2 หลัง approve) · rollback section = commented (forward-only safe)

**Flow:** draft → Point review (settlement/G4) → HUB Two-eyes → **Advisor review migration** → (approve) apply DEV → Wave 2 (escrow rewire + endpoints).

---
*Backend Gen 6 · 2026-06-24 · D2 Wave 1 · base e7cd3c4 · branch feature/d2-resell-slice*
