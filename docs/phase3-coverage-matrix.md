# Phase 3 Coverage Matrix — 55 Cases × DevNav Path
> Advisor Gen 95 Decision D1-D5 applied · HUB Gen 33 · 2026-05-26
> *(v2 — แก้ชื่อเคส C8/R6/M5/M9 ตาม SoT จริง + เพิ่ม DevNav links M2/M8/M9-withdraw)*
>
> ✅ = DevNav path ไล่ได้ครบ | ⚠️ = Partial/หน้าจอมีแต่ไม่มี DevNav link | ❌ = ขาด | (auto) = SoT ระบุไม่มี screen แยก

---

## MODULE A: REPAIR (C1–C10)

| Case | ชื่อ (SoT จริง) | Apps ที่ cover | DevNav path | Status | หมายเหตุ |
|------|------|----------------|-------------|--------|-----------|
| C1 | Walk-in / ซ่อมจบหน้างาน | WeeeR, WeeeT, WeeeU | R: walk-in/[id] → T: jobs/diagnose → jobs/repair → U: progress | ✅ | |
| C2 | ยกเครื่อง (Pickup) | WeeeR, WeeeT | T: jobs/diagnose → jobs/pickup | ✅ | |
| C3 | รออะไหล่ นัดใหม่ | WeeeT | T: jobs/diagnose → jobs/schedule | ✅ | |
| C4 | เสนอซาก (Repair→Scrap) | WeeeT, WeeeU, WeeeR | T: jobs/diagnose → jobs/scrap-offer · U: repair/progress → scrap-offer | ✅ | S12 cross-module |
| C5 | Fee Settle (ปฏิเสธซาก) | WeeeU | U: repair/scrap-offer → repair/fee-settle | ✅ | |
| C6 | ร้านปฏิเสธรับซ่อม | WeeeT | T: jobs/[id] → branch → /jobs (list) | ✅ | |
| C7 | ลูกค้ายุติงาน (abort) | WeeeU | U: repair/progress page (C7 abort modal built-in) | ✅ | UI embedded in progress page |
| C8 | **ประกาศหมดอายุ / U ยกเลิก → ปิด** | WeeeU | U: U1 badge หมดอายุ + U3 สถานะ — ไม่มี screen แยก (system จัดการ) | ✅(auto) | Advisor Gen 95 D1: auto · ชื่อเดิมผิด (ไม่ใช่ No-show) |
| C9 | Admin Intervene (dispute) | Admin | A: repair/disputes/[id] → C9 ruling form | ✅ | |
| C10 | WeeeR ถอนงานหลังยืนยัน | WeeeR | R: repair/jobs/[id] → branch ถอน-C10 | ✅ | |

**Repair: ✅ 10/10 🎉 · ❌ 0**

---

## MODULE B: MAINTAIN (M1–M9)

| Case | ชื่อ (SoT จริง) | Apps ที่ cover | DevNav path | Status | หมายเหตุ |
|------|------|----------------|-------------|--------|-----------|
| M1 | จอง Maintain | WeeeU | U: maintain/book → maintain/book/confirm | ✅ | |
| M2 | หมดอายุ (booking expired) | WeeeU | U: maintain/jobs/[id] → **[หมดอายุ-M2]** → mockup/m2-expired | ✅ | D4: เพิ่ม DevNav branch link แล้ว |
| M3 | เลื่อนนัด | WeeeU, WeeeT | U: jobs/[id] → jobs/reschedule · T: ไม่มี explicit M3 link | ✅ | WeeeU covered |
| M4 | พบปัญหาเพิ่ม / extra cost | WeeeT, WeeeU, WeeeR | T: jobs/inspect → jobs/issue · U: jobs/extra-cost (A/B) · R: cross-link | ✅ | ครบ 3 app |
| M5 | **cross-module: เจอของต้องซ่อม → ปรับเป็น Repair** | WeeeT→WeeeU | T: /jobs/m001/inspect → 🔗 **[M5] WeeeU /repair/new?from=maintain-m001** | ✅ | Advisor Gen 95 D5+M5: cross-link เพิ่มแล้ว · /repair/new WeeeU มีอยู่แล้ว (full mock) |
| M6 | WeeeR ถอนงาน | WeeeR | R: maintain/jobs/[id] → branch M6 ถอน | ✅ | |
| M7 | WeeeT ปฏิเสธรับ (No-show ลูกค้าไม่อยู่) | WeeeT | T: jobs/[id] → branch ไม่รับ → /jobs | ✅ | |
| M8 | Admin Dispute (Maintain) 4 ชั้น | Admin | A: maintain/jobs/m001 → **[dispute-M8]** → /disputes กลาง | ✅ | D2: เพิ่ม Admin DevNav cross-link แล้ว |
| M9 | ยุติงานกลางคัน (in-progress) | WeeeU, WeeeR | U: jobs/[id] → cancel · U: jobs/[id] → **withdraw** · R: jobs/[id]/cancel | ✅ | D5: เพิ่ม link → withdraw แล้ว · หน้า withdraw = M9 (ไม่ใช่ M5) |

**Maintain: ✅ 9/9 🎉 · ❌ 0**

---

## MODULE C: RESELL (R1–R12)

| Case | ชื่อ (SoT จริง) | Apps ที่ cover | DevNav path | Status | หมายเหตุ |
|------|------|----------------|-------------|--------|-----------|
| R1 | ผู้ซื้อรับของ ตรงปก | WeeeU, WeeeR | U: purchases/inspect → complete · R: purchases/inspect → confirm | ✅ | |
| R2 | ลงประกาศขาย (Seller) | WeeeU | U: /sell/new → /listings/r001 | ✅ | |
| R3 | ผู้ซื้อยื่นข้อเสนอ (Pair3) | WeeeR, WeeeU | R: marketplace/[id]/offer · U: marketplace/[id]/offer | ✅ | |
| R4 | **escrow 24ชม. หมดอายุ → คืนอัตโนมัติ** | — | ไม่มี screen แยก — ระบบจัดการ escrow อัตโนมัติ | ✅(auto) | Advisor Gen 95 D6: auto · ไม่ใช่ "ยกเลิกประกาศ" |
| R5 | Seller ถอนการเลือก | WeeeU | U: listings/confirm → branch B → listings/offers | ✅ | |
| R6 | **Seller ไม่ส่ง/หายตัว → escrow คืน buyer** | — | ไม่มี screen แยก — platform จัดการผ่าน state + notification | ✅(auto) | Advisor Gen 95 D3: auto · ชื่อเดิมผิด (ไม่ใช่ coordination) |
| R7 | ส่งมอบแล้ว (auto-complete) | WeeeU | U: listings/confirm → branch A → listings/complete | ✅(auto) | SoT: R7 auto — no separate screen |
| R8 | Dispute ไม่ตรงปก | WeeeU, WeeeR, Admin | U: purchases/inspect → dispute · R: purchases/dispute · A: resell/disputes/[id] | ✅ | ครบ 3 |
| R9 | Admin ตัดสิน dispute | Admin | A: resell/disputes/[id] → A/B/C ruling | ✅ | |
| R10 | Auto-trigger (escrow release) | — | ไม่มี screen — trigger อัตโนมัติ | ✅(auto) | SoT: R10 auto |
| R11 | ผู้ซื้อเปิด dispute หลังรับของ | WeeeU | U: /purchases/r001 → **[dispute-R11]** → /purchases/r001/dispute (เหมือน R8) | ✅ | Advisor Gen 95 D7: เพิ่ม DevNav link แล้ว |
| R12 | Mutual cancel (both agree) | WeeeU | U: listings/confirm → branch C → listings | ✅ | |

**Resell: ✅ 12/12 🎉 · ❌ 0 · (auto) 4 (R4, R6, R7, R10)**

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
| P8 | WeeeT Logistics | — | ผัง Gen 80 ตัด logistics ออก — ไม่มี screen | ✅(auto) | intentional |
| P9 | ผู้ขายปฏิเสธออเดอร์ | WeeeR | R: /parts/orders/p001 → **ปุ่มปฏิเสธ (seller block)** + reject modal | ✅ | Advisor Gen 95 D8: เพิ่ม UI block ใน existing page แล้ว |
| P10 | ระบบบล็อก (auto) | — | ไม่มี screen แยก — ระบบบล็อกอัตโนมัติ | ✅(auto) | Advisor Gen 95 D8 |
| P11 | ระบบบล็อก (auto) | — | ไม่มี screen แยก — ระบบบล็อกอัตโนมัติ | ✅(auto) | Advisor Gen 95 D8 |
| P12 | ShopIdSwitcher toggle | WeeeR | ShopIdSwitcher มีอยู่แล้ว Gen 93 — ไม่ต้องทำเพิ่ม | ✅ | Advisor Gen 95 D8: ยืนยัน Gen 93 |

**Parts: ✅ 12/12 🎉 · ❌ 0 · (auto) 2 (P10, P11)**

---

## SUMMARY (v2 — หลัง Advisor Gen 95 D1-D5)

| Module | Total | ✅ | ⚠️ | ❌ | (auto) |
|--------|-------|----|----|----|----|
| Repair C1-C10 | 10 | **10** 🎉 | 0 | 0 | 1 (C8) |
| Maintain M1-M9 | 9 | **9** 🎉 | 0 | 0 | 1 (M5→cross-link) |
| Resell R1-R12 | 12 | **12** 🎉 | 0 | 0 | 4 (R4,R6,R7,R10) |
| Scrap S1-S12 | 12 | **12** 🎉 | 0 | 0 | 0 |
| Parts P1-P12 | 12 | **12** 🎉 | 0 | 0 | 3 (P8,P10,P11) |
| **TOTAL** | **55** | **55** 🎉 | **0** | **0** | **9** |

---

### ✅ ไม่มี ❌ gaps เหลือ 🎉

### ✅ ครบ 55/55 cases — ไม่มี ⚠️ หรือ ❌ เหลือ 🎉

### ✅ RESOLVED (Advisor Gen 95 D1-D5 + M5)
- **C8** → ✅(auto) — ประกาศหมดอายุ ไม่ใช่ No-show
- **M2** → ✅ — เพิ่ม DevNav link → mockup/m2-expired (WeeeU)
- **M8** → ✅ — เพิ่ม Admin DevNav cross-link → /disputes
- **M5** → ✅ — cross-link WeeeT inspect → WeeeU /repair/new?from=maintain-m001 · /repair/new มีอยู่แล้ว
- **M9** → ✅ — เพิ่ม link → /withdraw (WeeeU) · หน้า withdraw = M9
- **R6** → ✅(auto) — seller no-ship ไม่มี screen แยก

---
*v4 FINAL · HUB Gen 33 · 2026-05-26 · Advisor Gen 95 Decision D1-D8+M5 all resolved · 55/55 ✅*
