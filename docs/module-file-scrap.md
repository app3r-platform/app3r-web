# Module File — Scrap (P3)
> Scrap Chat · HUB Gen 52 CMD · Phase 3 P3 · 2026-06-05
> Canonical IDs reuse from P1 (R3 rule: 1 ID per logical screen)
> Ports: WeeeU=3002 · WeeeR=3001 · WeeeT=3003 · Admin=3000 · Website=3004

---

## §7 เงื่อนไข/เคส — คำอธิบาย

| รหัส | เงื่อนไขย่อ |
|------|-------------|
| S1 | เจ้าของซากเลือกขาย (มีราคา) WeeeR ยื่น offer → WeeeU ยอมรับ → WeeeT รับซาก |
| S2 | เจ้าของซากเลือกทิ้งฟรี WeeeR รับไปทำลาย/แยก → WeeeT รับซาก |
| S3 | WeeeR ซ่อมซากขาย (repair_and_sell) → ส่ง WeeeT ซ่อม → ขายใน Marketplace |
| S4 | WeeeR เลือก dispose → Admin ออก E-Waste cert → WeeeU รับใบรับรอง |
| S5 | ประกาศหมดอายุ ไม่มีร้านยื่น offer → WeeeU กด "ลงใหม่" |
| S6 | WeeeT ถึงที่รับซาก → ยืนยันรับ → สถานะ in_progress |
| S7 | WeeeR ถอนตัวหลังยืนยันรับซาก (canWithdraw=true) → Escrow คืน |
| S8 | WeeeT ถึงหน้างาน พบซากไม่ตรงประกาศ → แจ้ง mismatch → WeeeU ยินยอม/โต้แย้ง |
| S9 | WeeeT ถึงหน้างาน ไม่พบเจ้าของ (no-show) → WeeeU นัดใหม่/ยกเลิก |
| S10 | WeeeU ยกเลิกหลัง WeeeT รับซากแล้ว (in_progress) → อาจมีค่าปรับ |
| S11 | WeeeU/WeeeR เปิด dispute (Escrow พิพาท) → Admin ตัดสิน |
| S12 | Cross-module: Repair C4 (WeeeT วินิจฉัยซ่อมไม่คุ้ม) → WeeeU ประกาศซาก |

---

## S1 — เจ้าของเลือกขาย (มีราคา)

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข §7 | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|----------------|-------|------------|-------|------------|-----|---------|-------------|
| U-29 | ประกาศซากใหม่ | U-55 /scrap | WeeeU ต้องการขายซาก (listingType=sell) | U-41 /scrap/new/success | WeeeU (สร้าง) | S1 | ตัวอย่าง: ตู้เย็น Samsung 2 ประตู grade_B 800 pt | http://localhost:3002/scrap/new |
| U-55 | ซากของฉัน (My Listings) | U-41 success / U-01 dashboard | หลัง publish listing ใหม่ / หน้าแรก | U-33 /scrap/[id] (pending_offer) | WeeeU (เจ้าของ) | S1 | MOCK: SCR-001 pending_offer · 3 ข้อเสนอรอ | http://localhost:3002/scrap |
| R-70 | Scrap Hub (feed) | sidebar WeeeR | WeeeR ค้นหาซากที่น่าซื้อ | R-78 /scrap/browse/[id] | WeeeR (ผู้ซื้อ) | S1 | MOCK_ITEMS SC001-SC006 · กรองเกรด/ประเภท | http://localhost:3001/scrap |
| R-72 | เลือกซื้อซาก (Browse) | R-70 /scrap | WeeeR เปิด browse list | R-78 /scrap/browse/[id] | WeeeR | S1 | filter: grade_A/B/C + ราคา | http://localhost:3001/scrap/browse |
| R-78 | รายละเอียดซาก (Browse Detail) | R-72 /scrap/browse | WeeeR เลือกดูรายการ | R-28 /scrap/jobs/[id] (ซื้อ) | WeeeR (ผู้ซื้อ) · WeeeU (เจ้าของ) | S1 | "🛒 ซื้อซากนี้" → สร้าง ScrapJob | http://localhost:3001/scrap/browse/SC001 |
| R-28 | งานซาก (Job Detail) | R-78 browse / R-27 jobs | งาน pending_decision ใหม่ | R-28b/c/d/e (ตามที่เลือก) | WeeeR · WeeeU (เห็นสถานะ) | S1 | เลือก "ขายต่อซาก" → R-28b | http://localhost:3001/scrap/jobs/SJ001 |
| R-28b | ตัดสินใจ: ขายต่อซาก | R-28 | S1 เลือก resell_as_scrap | R-27 /scrap/jobs (back) | WeeeR | S1 | ลง Marketplace ขายซากต่อ | http://localhost:3001/scrap/jobs/SJ001/resell-as-scrap |
| U-30 | ข้อเสนอรับซาก | U-33 /scrap/[id] | listing status=pending_offer · มี offer ≥1 | U-31 /scrap/[id]/confirm | WeeeU (เจ้าของ) · WeeeR (ผู้ยื่น offer) | S1 | MOCK_OFFERS: 3 ร้าน · countdown 24 ชม. | http://localhost:3002/scrap/SCR-001/offers |
| U-31 | ยืนยันเลือกข้อเสนอ | U-30 /offers หรือ U-33 direct | WeeeU กด "เลือกข้อเสนอนี้" | U-55 /scrap (status→accepted) | WeeeU · WeeeR (รับแจ้ง) · WeeeT (รับ task) | S1 | Escrow: WeeeR lock Gold Point ก่อน pickup | http://localhost:3002/scrap/SCR-001/confirm |

---

## S2 — เจ้าของเลือกทิ้งฟรี

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข §7 | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|----------------|-------|------------|-------|------------|-----|---------|-------------|
| U-29 | ประกาศซากใหม่ | U-55 /scrap | WeeeU เลือก listingType=dispose (price=0) | U-41 success | WeeeU | S2 | isFree=true · grade_C แนะนำ | http://localhost:3002/scrap/new |
| R-78 | รายละเอียดซาก | R-72 /scrap/browse | WeeeR เห็น badge "🆓 ฟรี" | R-28 /scrap/jobs/[id] | WeeeR | S2 | isFree=true · SC003 LG ตู้เย็น | http://localhost:3001/scrap/browse/SC003 |
| R-28 | งานซาก | R-78 | S2: dispose option | R-28e /dispose | WeeeR | S2 | เลือก "รีไซเคิล" ฟรี → R-28e | http://localhost:3001/scrap/jobs/SJ001 |
| U-30 | ข้อเสนอรับซาก | U-33 | มี offer isFree ≥1 | U-31 confirm | WeeeU | S2 | MOCK offer type=free · ออก cert | http://localhost:3002/scrap/SCR-003/offers |

---

## S3 — WeeeR ซ่อมขาย (repair_and_sell)

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข §7 | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|----------------|-------|------------|-------|------------|-----|---------|-------------|
| R-28 | งานซาก | R-27 jobs | S3: pending_decision | R-28d /repair-and-sell | WeeeR | S3 | เลือก "ซ่อมขาย" → R-28d | http://localhost:3001/scrap/jobs/SJ003 |
| R-28d | ตัดสินใจ: ซ่อมขาย | R-28 | S3 repair_and_sell → กรอก repair job | R-27 /scrap/jobs | WeeeR · WeeeT (รับงานซ่อม) | S3 | สร้าง repair_job ย่อย → WeeeT ซ่อม | http://localhost:3001/scrap/jobs/SJ003/repair-and-sell |

---

## S4 — ทิ้ง + E-Waste Certificate

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข §7 | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|----------------|-------|------------|-------|------------|-----|---------|-------------|
| R-28 | งานซาก | R-27 jobs | S4: pending_decision | R-28e /dispose | WeeeR | S4 | เลือก "รีไซเคิล" + E-Waste | http://localhost:3001/scrap/jobs/SJ004 |
| R-28e | ตัดสินใจ: รีไซเคิล | R-28 | S4 dispose → ขอ cert จาก Admin | Admin A-11 | WeeeR · Admin | S4 | WeeeR ส่ง request ออก E-Waste cert | http://localhost:3001/scrap/jobs/SJ004/dispose |
| A-11 | ใบรับรอง E-Waste (Admin) | Admin /scrap/jobs | Admin เห็น dispose request | A-11 /scrap/certificates/[id] | Admin | S4 | Admin พิมพ์ cert EW-2026-xxxx | http://localhost:3000/scrap/certificates |
| U-32 | ใบรับรอง E-Waste (WeeeU) | U-33 /scrap/[id] | cert ออกแล้ว · WeeeU เห็นปุ่ม "ดูใบรับรอง" | — (ดาวน์โหลด PDF) | WeeeU (รับใบรับรอง) · Admin (ออก) | S4 | MOCK_CERT: EW-2026-001234 | http://localhost:3002/scrap/SCR-001/certificate |

---

## S5 — ประกาศหมดอายุ (Expired)

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข §7 | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|----------------|-------|------------|-------|------------|-----|---------|-------------|
| U-55 | ซากของฉัน | dashboard / notification | listing status=expired · ไม่มีร้านยื่น offer ภายในกำหนด | U-29 /scrap/new (ลงใหม่) | WeeeU | S5 | MOCK: SCR-003 expired 2026-05-15 · ปุ่ม "🔄 ลงใหม่" | http://localhost:3002/scrap |
| U-29 | ประกาศซากใหม่ | U-55 (กด "ลงใหม่") | S5 re-post — pre-fill ข้อมูลเดิมได้ | U-41 success | WeeeU | S5 | ระบบ reset expiry ใหม่ | http://localhost:3002/scrap/new |

---

## S6 — WeeeT ถึงหน้างาน รับซาก (Pickup Confirm)

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข §7 | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|----------------|-------|------------|-------|------------|-----|---------|-------------|
| T-04 | รับซาก (Pickup) | T-22 /scrap หรือ T-01 /jobs | WeeeT ได้รับ assignment pickup · เดินทางถึง | T-22 /scrap (กลับ list) | WeeeT (ช่าง) · WeeeU (เห็น in_progress) | S6 | label "ถึงจุดรับ" → "ใบรับของ" | http://localhost:3003/jobs/J001/pickup |
| U-33 | รายละเอียดซาก (WeeeU) | push notification | S6: status in_progress · ช่างกำลังรับ | U-55 /scrap (ปุ่มยกเลิก S10) | WeeeU (เจ้าของ) · WeeeT (ช่าง) | S6 | แสดง "🚚 ช่างกำลังเดินทางมารับ" | http://localhost:3002/scrap/SCR-002 |

---

## S7 — WeeeR ถอนตัวหลังยืนยัน (Withdraw)

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข §7 | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|----------------|-------|------------|-------|------------|-----|---------|-------------|
| R-27 | งานซากของฉัน | R-70 /scrap | MOCK SJ005: status=cancelled badge "ถอนแล้ว" | R-28 /scrap/jobs/[id] | WeeeR | S7 | canWithdraw=true ก่อนถอน · Escrow คืนให้ WeeeU | http://localhost:3001/scrap/jobs |
| R-28 | งานซาก (Job Detail) | R-27 jobs | S7: ปุ่ม "ถอนตัว" (canWithdraw=true · status=pending_pickup) | R-27 /scrap/jobs | WeeeR · WeeeU (รับ Escrow คืน) | S7 | SJ005 resell_as_scrap/cancelled | http://localhost:3001/scrap/jobs/SJ005 |

---

## S8 — ของไม่ตรงประกาศ (Mismatch)

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข §7 | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|----------------|-------|------------|-------|------------|-----|---------|-------------|
| T-10 | รายงานซากไม่ตรง (WeeeT) | T-04 /pickup (ตรวจสอบแล้วพบปัญหา) | WeeeT พบซากไม่ตรงกับประกาศ · ถ่ายรูปหลักฐาน | T-22 /scrap (หลังส่งรายงาน) | WeeeT (ช่าง) · WeeeU (รับแจ้งเตือน) | S8 | mismatch: บันทึกเหตุผล + เสนอราคาใหม่ | http://localhost:3003/jobs/J001/mismatch |
| U-33 | รายละเอียดซาก (WeeeU) | push notification | S8: mismatchReport ≠ null · แสดง banner แดง | U-30 /offers (โต้แย้ง) หรือ ยอมรับราคาใหม่ | WeeeU (ตัดสินใจ) · WeeeR (เห็นผล) | S8 | แสดง mismatchReport: ช่าง+เหตุผล+ราคาเสนอ | http://localhost:3002/scrap/SCR-002 |
| R-28 | งานซาก (WeeeR) | R-27 jobs | S8: status=pending_decision (re-offer) badge "⚠️ซากไม่ตรง" | R-28c /resell-parts | WeeeR | S8 | SJ002: pending_decision หลัง mismatch | http://localhost:3001/scrap/jobs/SJ002 |

---

## S9 — No-Show (ช่างมาไม่พบเจ้าของ)

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข §7 | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|----------------|-------|------------|-------|------------|-----|---------|-------------|
| T-04 | รับซาก — No Show | T-01 /jobs | WeeeT รอ 20 นาที ไม่พบเจ้าของ | T-22 /scrap | WeeeT (รายงาน) · WeeeU (รับแจ้ง) | S9 | label "ถึงจุดรับ" ไม่พบ → report no-show | http://localhost:3003/jobs/J001/pickup |
| U-33 | รายละเอียดซาก (WeeeU) | push notification | S9: noShowEvent ≠ null (uncomment ใน mock) | ปุ่ม "📅 นัดใหม่" / "ยกเลิก" | WeeeU (ตัดสินใจ) · WeeeT (รอ) | S9 | แสดง "🚫 ช่างมาถึงแล้ว แต่ไม่พบคุณ" | http://localhost:3002/scrap/SCR-002 |

---

## S10 — ยกเลิกหลัง WeeeT รับซากแล้ว

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข §7 | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|----------------|-------|------------|-------|------------|-----|---------|-------------|
| U-55 | ซากของฉัน | dashboard | listing status=in_progress · ปุ่ม "ยกเลิก" | U-33 /scrap/[id]?action=cancel | WeeeU | S10 | MOCK SCR-002 in_progress · link?action=cancel | http://localhost:3002/scrap |
| U-33 | รายละเอียดซาก + Cancel Dialog | U-55 (link action=cancel) | actionParam=cancel → dialog เปิดทันที | U-55 /scrap (status→cancelled) | WeeeU (ยืนยัน) · WeeeR (รับแจ้ง) · WeeeT (หยุดงาน) | S10 | dialog: กรอกเหตุผล บังคับ · อาจมีค่าปรับ | http://localhost:3002/scrap/SCR-002?action=cancel |

---

## S11 — Dispute (Escrow พิพาท)

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข §7 | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|----------------|-------|------------|-------|------------|-----|---------|-------------|
| R-27 | งานซากของฉัน | R-70 /scrap | SJ006 badge "🚨พิพาท" · escrowStatus=locked | R-28 /scrap/jobs/SJ006 | WeeeR | S11 | disputeReason: WeeeU ส่งซากผิดชิ้น | http://localhost:3001/scrap/jobs |
| R-28 | งานซาก (Dispute) | R-27 | S11: escrowStatus=locked · disputeReason ≠ null | A-09 /scrap/disputes (Admin) | WeeeR · Admin | S11 | แสดง "🚨 Escrow พิพาท" · รอ Admin ตัดสิน | http://localhost:3001/scrap/jobs/SJ006 |
| A-09 | Dispute List (Admin) | Admin sidebar | Admin เห็น dispute ที่ต้องจัดการ | A-10 /scrap/disputes/[id] | Admin | S11 | A-09: รายการ disputes รออนุมัติ | http://localhost:3000/scrap/disputes |
| A-10 | Dispute Detail (Admin) | A-09 /scrap/disputes | Admin ตรวจสอบหลักฐานทั้งสองฝ่าย | A-09 (กลับ list) | Admin · WeeeR · WeeeU | S11 | ตัดสิน: ปล่อย Escrow ให้ใคร | http://localhost:3000/scrap/disputes/D001 |

---

## S12 — Cross-module Repair→Scrap

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข §7 | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|----------------|-------|------------|-------|------------|-----|---------|-------------|
| U-07 | Repair C4 Scrap Offer | U-06 /repair/[id]/progress | WeeeT วินิจฉัย: ซ่อมไม่คุ้ม → เสนอทิ้งซาก | U-29 /scrap/new?from_repair=REP-xxx | WeeeU (ตัดสินใจ) · WeeeT (T-06) | S12 | C4 flow: WeeeT ใช้ T-06 ส่งข้อเสนอ | http://localhost:3002/repair/c001/scrap-offer |
| T-06 | Repair C4 Scrap Offer (WeeeT) | T-02 /diagnose | S12: WeeeT กรอก assessed price | T-11 /jobs/[id] | WeeeT | S12 | estimated price + weight → ส่งไป WeeeU | http://localhost:3003/jobs/c001/scrap-offer |
| U-29 | ประกาศซากใหม่ (S12 pre-fill) | U-07 /repair/c001/scrap-offer | ?from_repair=REP-xxx → banner + pre-fill | U-41 success | WeeeU | S12 | banner "🔧 งานซ่อม → แนะนำทิ้งซาก" · auto-fill grade+price | http://localhost:3002/scrap/new?from_repair=REP-0042 |
| U-55 | ซากของฉัน | U-41 success | listing มี sourceRepairJobId | U-33 /scrap/[id] | WeeeU | S12 | MOCK SCR-002 badge "🔧 งานซ่อม #REP-0042" | http://localhost:3002/scrap |
| U-33 | รายละเอียดซาก (S12) | U-55 /scrap | sourceRepairJobId ≠ null | U-30 offers / U-31 confirm | WeeeU · WeeeR | S12 | header badge "🔧 งานซ่อม #REP-0042" | http://localhost:3002/scrap/SCR-002 |
| R-70 | Scrap Hub Feed | sidebar | S12 listing มี badge "🔧 จาก Repair #xxx" | R-78 /scrap/browse/[id] | WeeeR | S12 | MOCK SC004 HP Notebook fromRepairJobId | http://localhost:3001/scrap |
| T-22 | Scrap Jobs (WeeeT) | T-01 /jobs | WeeeT เห็น scrap pickup job ที่มาจาก Repair | T-23 /scrap/[id] | WeeeT | S12 | T-22: WeeeT scrap list | http://localhost:3003/scrap |
| T-23 | Scrap Job Detail (WeeeT) | T-22 /scrap | S12 job detail · badge Repair#{id} | T-04 /jobs/[id]/pickup | WeeeT | S12 | T-23: รายละเอียด scrap job | http://localhost:3003/scrap/J001 |

---

## Screen ID Summary (Scrap Module — Canonical)

| แอพ | รหัส | Code | Route (template) | หมายเหตุ |
|-----|------|------|-----------------|---------|
| WeeeU | U-29 | SCRAP-CREATE | /scrap/new | S1-S5 entry · S12 ?from_repair |
| WeeeU | U-30 | SCRAP-S1-OFFERS | /scrap/[id]/offers | S1/S2 offer list |
| WeeeU | U-31 | SCRAP-S1-CONFIRM | /scrap/[id]/confirm | S1/S2 ยืนยัน |
| WeeeU | U-32 | SCRAP-S4-CERT | /scrap/[id]/certificate | S4 E-Waste cert |
| WeeeU | U-33 | SCRAP-DETAIL | /scrap/[id] | S1-S5·S8·S9·S10·S12 |
| WeeeU | U-41 | SCRAP-CREATE-SUCCESS | /scrap/new/success | หลัง submit S1/S2/S12 |
| WeeeU | U-55 | SCRAP-HOME | /scrap | My listings list |
| WeeeR | R-24 | SCRAP-ANNOUNCE-LIST | /scrap/announcements | → redirect R-72 /scrap/browse |
| WeeeR | R-25 | SCRAP-BID | /scrap/announcements/[id]/offer | WeeeR ยื่น offer |
| WeeeR | R-26 | SCRAP-ANNOUNCE-DETAIL | /scrap/announcements/[id] | รายละเอียดประกาศ |
| WeeeR | R-27 | SCRAP-JOBS | /scrap/jobs | งานซากทั้งหมด S1-S12 |
| WeeeR | R-28 | SCRAP-JOB-DETAIL | /scrap/jobs/[id] | ตัดสินใจ · S7·S8·S11·S12 |
| WeeeR | R-28b | SCRAP-S1-DECISION | /scrap/jobs/[id]/resell-as-scrap | S1 |
| WeeeR | R-28c | SCRAP-S2-DECISION | /scrap/jobs/[id]/resell-parts | S2 |
| WeeeR | R-28d | SCRAP-S3-DECISION | /scrap/jobs/[id]/repair-and-sell | S3 |
| WeeeR | R-28e | SCRAP-S4-DECISION | /scrap/jobs/[id]/dispose | S4 E-Waste |
| WeeeR | R-70 | SCRAP-HUB | /scrap | Public feed หน้าแรก |
| WeeeR | R-71 | SCRAP-ITEM-DETAIL | /scrap/[id] | Public item detail |
| WeeeR | R-72 | SCRAP-BROWSE | /scrap/browse | Browse with filter |
| WeeeR | R-78 | SCRAP-BROWSE-DETAIL | /scrap/browse/[id] | รายละเอียด + ปุ่มซื้อ |
| WeeeT | T-04 | SCRAP-S6-PICKUP | /jobs/[id]/pickup | S6·S9 pickup/no-show |
| WeeeT | T-06 | REPAIR-C4-SCRAP | /jobs/[id]/scrap-offer | S12 C4 assessed price |
| WeeeT | T-10 | SCRAP-S8-MISMATCH | /jobs/[id]/mismatch | S8 mismatch report |
| WeeeT | T-22 | SCRAP-HOME (T) | /scrap | WeeeT scrap list |
| WeeeT | T-23 | SCRAP-DETAIL (T) | /scrap/[id] | WeeeT scrap job detail |
| Admin | A-08 | SCRAP-JOBS-ADMIN | /scrap/jobs | Overview ทุก jobs |
| Admin | A-09 | SCRAP-DISPUTES | /scrap/disputes | S11 dispute list |
| Admin | A-10 | SCRAP-DISPUTE-DETAIL | /scrap/disputes/[id] | S11 ตัดสิน |
| Admin | A-11 | SCRAP-CERTS | /scrap/certificates | S4 E-Waste cert mgmt |

---

> หมายเหตุ R3: ID ทั้งหมดนี้ reuse จาก P1 (ห้ามสร้างใหม่ซ้ำซ้อน)
> Eng Standards 12: 35e813ec-7277-81c7-830e-fd4eb70160da
