# Phase 3 Coverage Matrix — 55 Cases × DevNav Path
> Advisor Gen 94 CMD 36c813ec-7277-8179 · Task E · HUB Gen 33 · 2026-05-26
>
> ✅ = DevNav path ไล่ได้ครบ | ⚠️ = Partial/หน้าจอมีแต่ไม่มี DevNav link | ❌ = ขาด | (auto) = SoT ระบุไม่มี screen แยก

---

## MODULE A: REPAIR (C1–C10)

| Case | ชื่อ | Apps ที่ cover | DevNav path | Status | หมายเหตุ |
|------|------|----------------|-------------|--------|-----------|
| C1 | Walk-in / ซ่อมจบหน้างาน | WeeeR, WeeeT, WeeeU | R: walk-in/[id] → T: jobs/diagnose → jobs/repair → U: progress | ✅ | |
| C2 | ยกเครื่อง (Pickup) | WeeeR, WeeeT | T: jobs/diagnose → jobs/pickup | ✅ | |
| C3 | รออะไหล่ นัดใหม่ | WeeeT | T: jobs/diagnose → jobs/schedule | ✅ | |
| C4 | เสนอซาก (Repair→Scrap) | WeeeT, WeeeU, WeeeR | T: jobs/diagnose → jobs/scrap-offer · U: repair/progress → scrap-offer | ✅ | S12 cross-module |
| C5 | Fee Settle (ปฏิเสธซาก) | WeeeU | U: repair/scrap-offer → repair/fee-settle | ✅ | |
| C6 | ร้านปฏิเสธรับซ่อม | WeeeT | T: jobs/[id] → branch → /jobs (list) | ✅ | |
| C7 | ลูกค้ายุติงาน (abort) | WeeeU | U: repair/progress page (C7 abort modal built-in) | ✅ | UI embedded in progress page |
| C8 | No-show (ช่างไม่ถึง / ลูกค้าไม่อยู่ Repair) | — | **ไม่มี DevNav link** สำหรับกรณี Repair No-show | ❌ | ขาด DevNav path — รายงาน Advisor |
| C9 | Admin Intervene (dispute) | Admin | A: repair/disputes/[id] → C9 ruling form | ✅ | |
| C10 | WeeeR ถอนงานหลังยืนยัน | WeeeR | R: repair/jobs/[id] → branch ถอน-C10 | ✅ | |

**Repair: ✅ 9/10 · ❌ 1 (C8)**

---

## MODULE B: MAINTAIN (M1–M9)

| Case | ชื่อ | Apps ที่ cover | DevNav path | Status | หมายเหตุ |
|------|------|----------------|-------------|--------|-----------|
| M1 | จอง Maintain | WeeeU | U: maintain/book → maintain/book/confirm | ✅ | |
| M2 | หมดอายุ (booking expired) | WeeeU | หน้า `/maintain/jobs/[id]/mockup/m2-expired` มีแต่ **ไม่มี DevNav link** | ⚠️ | หน้ามีแต่ไม่ถึงด้วย DevNav |
| M3 | เลื่อนนัด | WeeeU, WeeeT | U: jobs/[id] → jobs/reschedule · T: ไม่มี explicit M3 link | ✅ | WeeeU covered |
| M4 | พบปัญหาเพิ่ม / extra cost | WeeeT, WeeeU, WeeeR | T: jobs/inspect → jobs/issue · U: jobs/extra-cost (A/B) · R: cross-link | ✅ | ครบ 3 app |
| M5 | ลูกค้ายกเลิกก่อนช่างถึง | WeeeU | หน้า `/maintain/jobs/[id]/withdraw` มีแต่ **ไม่มี DevNav link** | ⚠️ | หน้ามีแต่ไม่ถึงด้วย DevNav |
| M6 | WeeeR ถอนงาน | WeeeR | R: maintain/jobs/[id] → branch M6 ถอน | ✅ | |
| M7 | WeeeT ปฏิเสธรับ | WeeeT | T: jobs/[id] → branch ไม่รับ → /jobs | ✅ | |
| M8 | Admin Dispute (Maintain) | Admin | **ไม่มี Admin DevNav path** สำหรับ Maintain dispute | ❌ | Admin DevNav ไม่มี maintain/disputes |
| M9 | ยุติงานกลางคัน (in-progress) | WeeeU, WeeeR | U: jobs/[id] → jobs/cancel · R: jobs/[id]/cancel | ✅ | |

**Maintain: ✅ 6/9 · ⚠️ 2 (M2, M5) · ❌ 1 (M8)**

---

## MODULE C: RESELL (R1–R12)

| Case | ชื่อ | Apps ที่ cover | DevNav path | Status | หมายเหตุ |
|------|------|----------------|-------------|--------|-----------|
| R1 | ผู้ซื้อรับของ ตรงปก | WeeeU, WeeeR | U: purchases/inspect → complete · R: purchases/inspect → confirm | ✅ | |
| R2 | ลงประกาศขาย (Seller) | WeeeU | U: /sell/new → /listings/r001 | ✅ | |
| R3 | ผู้ซื้อยื่นข้อเสนอ (Pair3) | WeeeR, WeeeU | R: marketplace/[id]/offer · U: marketplace/[id]/offer | ✅ | |
| R4 | WeeeU ยกเลิกประกาศ | WeeeU | U DevNav: "→ [C] ยกเลิกประกาศ (R-04)" อยู่ใน repair section แต่ label บอก R-04 | ⚠️ | ตรวจ label ซ้ำซ้อน — อาจอยู่ผิด forPath |
| R5 | Seller ถอนการเลือก | WeeeU | U: listings/confirm → branch B → listings/offers | ✅ | |
| R6 | นัดพบ / Coordination step | — | **ไม่มี DevNav path** สำหรับ R6 | ❌ | ถ้า SoT บอก "auto" → ✅ intentional |
| R7 | ส่งมอบแล้ว (auto-complete) | WeeeU | U: listings/confirm → branch A → listings/complete | ✅ (auto) | SoT: R7 auto — no separate screen |
| R8 | Dispute ไม่ตรงปก | WeeeU, WeeeR, Admin | U: purchases/inspect → dispute · R: purchases/dispute · A: resell/disputes/[id] | ✅ | ครบ 3 |
| R9 | Admin ตัดสิน dispute | Admin | A: resell/disputes/[id] → A/B/C ruling | ✅ | |
| R10 | Auto-trigger (escrow release) | — | ✅ (auto) | ✅ (auto) | SoT: R10 auto — no screen |
| R11 | ? (ไม่ทราบ spec) | — | ไม่มี DevNav — ขอ Advisor confirm spec | ⚠️ | ต้องการ spec ชัดเจน |
| R12 | Mutual cancel (both agree) | WeeeU | U: listings/confirm → branch C → listings | ✅ | |

**Resell: ✅ 8/12 · ⚠️ 3 (R4, R11 + spec) · ❌ 1 (R6 — ขึ้นอยู่กับ SoT)**

---

## MODULE D: SCRAP (S1–S12)

| Case | ชื่อ | Apps ที่ cover | DevNav path | Status | หมายเหตุ |
|------|------|----------------|-------------|--------|-----------|
| S1 | เจ้าของเลือกขาย (มีราคา) | WeeeU, WeeeR | U: scrap/offers → [A] confirm · R: announcements → offer → jobs/decision S1 | ✅ | |
| S2 | เจ้าของเลือกทิ้งฟรี | WeeeU, WeeeR | U: scrap/offers → [B] confirm · R: jobs → แยกอะไหล่ S2 | ✅ | |
| S3 | WeeeR ซ่อมขาย | WeeeR | R: scrap/jobs/[id] → repair-and-sell | ✅ | |
| S4 | ทิ้ง + E-Waste Cert | WeeeR, Admin, WeeeU | R: jobs → dispose · A: scrap/certificates · U: scrap/certificate | ✅ | ครบ 3 |
| S5 | เจ้าของไม่เลือกใคร | WeeeU | U: scrap/offers → [C] ไม่เลือก | ✅ | |
| S6 | WeeeT ถึงหน้างาน (รับซาก) | WeeeT | T: jobs/s001 → jobs/pickup → jobs/inspect | ✅ | |
| S7 | WeeeR ถอนหลังยืนยัน | WeeeR | R: scrap/jobs/[id] → branch ถอน S7 | ✅ | |
| S8 | ของไม่ตรงประกาศ | WeeeT | T: jobs/inspect → jobs/mismatch | ✅ | |
| S9 | No-show (ลูกค้าไม่อยู่) | WeeeT | T: jobs/pickup → branch S9 → /jobs | ✅ | |
| S10 | ยกเลิกหลัง T รับซาก | WeeeU | U: scrap/[id] → branch S10 → /scrap | ✅ | |
| S11 | Dispute (escrow) | Admin | A: scrap/disputes/[id] → A/B ruling | ✅ | |
| S12 | Cross-module Repair→Scrap | WeeeU, WeeeT, WeeeR | U: repair/scrap-offer → [A] scrap/new · T: jobs/scrap-offer | ✅ | C4↔S12 same flow |

**Scrap: ✅ 12/12 · ❌ 0 🎉**

---

## MODULE E: PARTS (P1–P12)

| Case | ชื่อ | Apps ที่ cover | DevNav path | Status | หมายเหตุ |
|------|------|----------------|-------------|--------|-----------|
| P1 | ลงขาย (Seller B5) | WeeeR | R: parts/my-listings → my-listings/new | ✅ | |
| P2 | ค้นหา / ดูสินค้า | WeeeR | R: parts/marketplace → marketplace/[id] | ✅ | |
| P3 | SmartPicker B4 | WeeeR | R: parts/marketplace/[id] → smart-pick | ✅ | |
| P4 | สั่งซื้อ | WeeeR | R: marketplace/[id] → my-orders/new | ✅ | |
| P5 | ผู้ขาย ยืนยัน order | WeeeR | R: parts/orders/[id] → branch ยืนยัน | ✅ | |
| P6 | ยกเลิก order | WeeeR | R: parts/orders/[id] → branch ยกเลิก | ✅ | |
| P7 | Dispute | WeeeR→Admin | R: my-orders/[id] cross-app → Admin disputes/[id] | ✅ | |
| P8 | WeeeT Logistics | — | ✅ (intentional) | ✅ (auto) | ผัง Gen 80 ตัด logistics ออก — ไม่มี screen |
| P9 | (ต้องการ SoT spec) | — | ไม่มีข้อมูล | ⚠️ | รอ Advisor confirm |
| P10 | (ต้องการ SoT spec) | — | ไม่มีข้อมูล | ⚠️ | รอ Advisor confirm |
| P11 | (ต้องการ SoT spec) | — | ไม่มีข้อมูล | ⚠️ | รอ Advisor confirm |
| P12 | (ต้องการ SoT spec) | — | ไม่มีข้อมูล | ⚠️ | รอ Advisor confirm |

**Parts: ✅ 8/12 · ⚠️ 4 (P9-P12 ขอ spec) · ❌ 0**

---

## SUMMARY

| Module | Total | ✅ | ⚠️ | ❌ | (auto) |
|--------|-------|----|----|----|----|
| Repair C1-C10 | 10 | 9 | 0 | 1 | 0 |
| Maintain M1-M9 | 9 | 6 | 2 | 1 | 0 |
| Resell R1-R12 | 12 | 8 | 3 | 1 | 2 |
| Scrap S1-S12 | 12 | 12 | 0 | 0 | 0 |
| Parts P1-P12 | 12 | 8 | 4 | 0 | 1 |
| **TOTAL** | **55** | **43** | **9** | **3** | **3** |

### ❌ CONFIRMED GAPS (ต้องเพิ่ม DevNav) — 3 cases
1. **C8** — Repair No-show: ช่างไม่ถึง หรือลูกค้าไม่อยู่ (Repair module) → ไม่มี WeeeR/WeeeT DevNav link
2. **M8** — Maintain Admin Dispute: Admin ไม่มี DevNav path สำหรับ maintain/disputes
3. **R6** — Resell นัดพบ/coordination step → ขึ้นอยู่กับ SoT ว่า auto หรือมี screen

### ⚠️ PARTIAL (หน้ามีแต่ไม่มี DevNav link) — 2 cases
1. **M2** — Maintain หมดอายุ: หน้า mockup/m2-expired มี แต่ไม่มี DevNav link ไปถึง
2. **M5** — Maintain ลูกค้ายกเลิก: หน้า /withdraw มี แต่ไม่มี DevNav link

### ⚠️ ต้องการ Spec ชัดเจน — 6 cases
- R4, R11 (Resell) — label/spec ไม่ชัดเจนใน DevNav ปัจจุบัน
- P9, P10, P11, P12 (Parts) — ไม่มีข้อมูล spec

---
*Generated: HUB Gen 33 · 2026-05-26 · git HEAD be4a9b6 + Phase 3 commits*
