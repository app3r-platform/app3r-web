# Maintain Module — Flow Table (M1–M9)
> **วัตถุประสงค์**: ตาราง cross-app flow สำหรับโมดูล Maintain ครบทุกเคส M1–M9  
> **เวอร์ชัน**: P2+P3 Maintain Gen 4 · 2026-06-05  
> **หมายเหตุ**: ลิงก์ mockup ใช้ dev server — WeeeU :3001 · WeeeR :3002 · WeeeT :3003 · Admin :3004 · Website :3005  
> **Registry ref**: `docs/phase3-screen-id-table.md` — ใช้ canonical ID จาก R3 rule

---

## ตำนาน (Legend)
- **U** = WeeeU (ลูกค้า) · **R** = WeeeR (ร้าน/ช่าง) · **T** = WeeeT (ช่างนอกบ้าน) · **A** = Admin · **W** = Website
- 🆕 = New IDs minted (R4 rule) — ยังไม่อยู่ใน registry เดิม
- mock-anno §5 = origin · §6 = destination navigation · §8 = cross-app view

---

## M1 — Happy Path (ล้างสำเร็จไม่มีปัญหา)

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|---------------|-------|-------------|-------|------------|-----|---------|------------|
| W-09 | LISTINGS-MAINTAIN | — | M1: ลูกค้าค้นหาบริการล้าง | W-10 | Website | M1 | หน้าหลักประกาศล้างทั้งหมด | http://localhost:3005/listings/maintain |
| W-10 | LISTING-MAINTAIN-DETAIL | W-09 | M1: ดูรายละเอียดบริการ | U-11 | Website | M1 | แสดงรายละเอียด + ราคา + ร้าน | http://localhost:3005/listings/maintain/m001 |
| U-11 | MAINTAIN-BOOK | W-10 / U-12 | M1: กรอกข้อมูลงาน | U-10 | WeeeU | M1 | เลือกเครื่อง/ประเภทล้าง/ที่อยู่/วันนัด | http://localhost:3001/maintain/book |
| U-10 | MAINTAIN-BOOK-CONFIRM | U-11 | M1: ยืนยันก่อนส่ง | U-12 | WeeeU | M1 | แสดงสรุป + lock Gold Point | http://localhost:3001/maintain/book/confirm |
| U-12 | MAINTAIN-JOBS | U-10 | M1: รายการงานทั้งหมด | U-16 | WeeeU | M1-M9 | หน้า list งาน — status ทุกเคส | http://localhost:3001/maintain/jobs |
| U-16 | MAINTAIN-JOB-DETAIL | U-12 | M1: ดูสถานะงาน | — | WeeeU | M1-M9 | status track + action buttons | http://localhost:3001/maintain/jobs/m001 |
| R-12 | 🆕 MAINTAIN-QUEUE | — | M1: ร้านดูประกาศล้าง | R-12b | WeeeR | M1 | queue ประกาศที่ open | http://localhost:3002/maintain/queue |
| R-12b | 🆕 MAINTAIN-QUEUE-OFFER | R-12 | M1: ร้านยื่นข้อเสนอ | R-12c | WeeeR | M1 | กรอก offer: ราคา/ค่าเดินทาง/เงื่อนไข | http://localhost:3002/maintain/queue/m001/offer |
| R-12c | 🆕 MAINTAIN-OFFER-SUCCESS | R-12b | M1: ยืนยันส่ง offer | R-12 | WeeeR | M1 | ส่ง offer สำเร็จ | http://localhost:3002/maintain/queue/m001/offer/success |
| U-16a | 🆕 MAINTAIN-OFFERS | U-16 | M1: ลูกค้าเลือก offer | U-16 | WeeeU | M1 | list offer จาก WeeeR ทั้งหมด | http://localhost:3001/maintain/jobs/m001/offers |
| R-13 | MAINTAIN-ASSIGN-TECH | R-14 | M1: ร้านมอบหมายช่าง | R-14 | WeeeR | M1 | เลือกช่าง + confirm | http://localhost:3002/maintain/jobs/m001/assign |
| R-14 | MAINTAIN-JOB-DETAIL | R-12 | M1-M9: ร้านดูงาน | — | WeeeR | M1-M9 | job detail + status + actions | http://localhost:3002/maintain/jobs/m001 |
| T-01 | 🆕 JOBS-LIST | — | M1: ช่างดูรายการงาน | T-11 | WeeeT | M1-M9 | jobs ที่ช่างต้องทำ | http://localhost:3003/jobs |
| T-11 | 🆕 JOB-DETAIL | T-01 | M1: ช่างดูรายละเอียดงาน | T-08a | WeeeT | M1-M9 | job info + ปุ่ม depart | http://localhost:3003/jobs/m001 |
| T-08a | 🆕 MAINTAIN-DEPART | T-11 | M1: ช่างออกเดินทาง | T-08b | WeeeT | M1 | กด depart → location track | http://localhost:3003/maintain/m001/depart |
| T-08b | 🆕 MAINTAIN-ARRIVE | T-08a | M1: ช่างถึงที่ | T-08 | WeeeT | M1 | อัพโหลดรูปถึงที่ | http://localhost:3003/maintain/m001/arrive |
| T-08 | MAINTAIN-INSPECT | T-08b | M1: ตรวจสภาพก่อนล้าง | T-08c | WeeeT | M1-M5,M7 | ตรวจสภาพ — ปกติ/risk/damage/noshow | http://localhost:3003/maintain/m001/inspect |
| T-08c | 🆕 MAINTAIN-CHECKLIST | T-08 | M1: ช่างทำ checklist ล้าง | T-08d | WeeeT | M1 | checklist รายการล้าง | http://localhost:3003/maintain/m001/checklist |
| T-08d | 🆕 MAINTAIN-COMPLETE | T-08c | M1: ช่างกดเสร็จ | T-11 | WeeeT | M1 | complete + อัพโหลดรูปหลังล้าง | http://localhost:3003/maintain/m001/complete |
| U-16b | 🆕 MAINTAIN-RATE | U-16 | M1: ลูกค้า rate ร้าน | U-12 | WeeeU | M1 | ให้คะแนน + ความเห็น | http://localhost:3001/maintain/jobs/m001/rate |
| A-06 | MAINTAIN-JOBS | — | M1-M9: Admin ดู jobs | A-07 | Admin | M1-M9 | list จากทุกเคส | http://localhost:3004/maintain/jobs |
| A-07 | MAINTAIN-JOB-DETAIL | A-06 | M1-M9: Admin ดู job detail | — | Admin | M1-M9 | full detail + audit log | http://localhost:3004/maintain/jobs/m001 |

---

## M2 — Offer Expired (หมดเวลา ไม่มีร้านรับ)

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|---------------|-------|-------------|-------|------------|-----|---------|------------|
| U-16 | MAINTAIN-JOB-DETAIL | U-12 | M2: ระบบปิดประกาศอัตโนมัติเมื่อ deadline ผ่าน | U-16/m2 | WeeeU | M2 | status = expired — ปุ่ม rebook ปรากฏ | http://localhost:3001/maintain/jobs/m001 |
| U-16/m2 | 🆕 MAINTAIN-M2-EXPIRED | U-16 | M2: แสดง banner หมดอายุ | U-11 / U-12 | WeeeU | M2 | banner + ปุ่ม "ลงประกาศใหม่" | http://localhost:3001/maintain/jobs/m001/mockup/m2-expired |
| U-11 | MAINTAIN-BOOK | U-16/m2 | M2: ลงประกาศใหม่ (pre-fill) | U-10 | WeeeU | M2 | rebook=jobId → pre-fill ข้อมูลเดิม | http://localhost:3001/maintain/book?rebook=m001 |
| A-07 | MAINTAIN-JOB-DETAIL | A-06 | M2: Admin ดู job expired | — | Admin | M2 | status = expired | http://localhost:3004/maintain/jobs/m001 |

---

## M3 — Pre-inspection Risk (WeeeT พบความเสี่ยง)

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|---------------|-------|-------------|-------|------------|-----|---------|------------|
| T-08 | MAINTAIN-INSPECT | T-08b | M3: WeeeT ตรวจพบความเสี่ยง | T-08/risk | WeeeT | M3 | กด "แจ้งความเสี่ยง" → risk form | http://localhost:3003/maintain/m001/inspect |
| T-08/risk | 🆕 MAINTAIN-RISK-FORM | T-08 | M3: กรอก Risk Report (D-Maintain-1) | (notify WeeeU/R) | WeeeT | M3 | เลือกประเภทเสี่ยง + อัพโหลดรูป | http://localhost:3003/maintain/m001/inspect (mode=risk_form) |
| U-16/m3 | 🆕 MAINTAIN-M3-RISK-NOTIFY | U-16 | M3: WeeeU รับแจ้งความเสี่ยง | U-15 / (proceed) | WeeeU | M3 | 2 ตัวเลือก: ดำเนินต่อ / ยุติ | http://localhost:3001/maintain/jobs/m001/mockup/m3-risk-inspect |
| R-14/m3 | 🆕 MAINTAIN-M3-WEEER-VIEW | R-14 | M3: WeeeR เห็น risk_reported | R-12 | WeeeR | M3 | read-only · รอ WeeeU ตัดสิน | http://localhost:3002/maintain/jobs/m001/mockup/m3-risk-notify |
| U-15 | MAINTAIN-M9-CANCEL | U-16/m3 | M3: WeeeU ยุติหลังรับทราบ | U-12 | WeeeU | M3,M9 | cancel with risk settle | http://localhost:3001/maintain/jobs/m001/cancel |
| A-07 | MAINTAIN-JOB-DETAIL | A-06 | M3: Admin ดู job risk_reported | — | Admin | M3 | เห็น risk report + WeeeU decision | http://localhost:3004/maintain/jobs/m001 |

---

## M4 — Extra Cost (ค่าใช้จ่ายเพิ่ม)

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|---------------|-------|-------------|-------|------------|-----|---------|------------|
| T-08 | MAINTAIN-INSPECT | T-08b | M4: ตรวจพบงานเพิ่ม | T-09 | WeeeT | M4 | กด "แจ้งค่าใช้จ่ายเพิ่ม" | http://localhost:3003/maintain/m001/inspect |
| T-09 | MAINTAIN-M4-ISSUE | T-08 | M4: WeeeT กรอก extra cost proposal | (notify WeeeU) | WeeeT | M4 | breakdown อะไหล่+ค่าแรง | http://localhost:3003/maintain/m001/issue |
| U-14 | MAINTAIN-M4-EXTRACOST | U-16 | M4: WeeeU อนุมัติ/ปฏิเสธ | U-16 | WeeeU | M4 | A/B decision + settle preview | http://localhost:3001/maintain/jobs/m001/extra-cost |
| R-14 | MAINTAIN-JOB-DETAIL | R-12 | M4: WeeeR ดูสถานะระหว่างรออนุมัติ | — | WeeeR | M4 | status = extra_cost_pending | http://localhost:3002/maintain/jobs/m001 |
| A-07 | MAINTAIN-JOB-DETAIL | A-06 | M4: Admin เห็น extra cost request | — | Admin | M4 | breakdown + WeeeU decision | http://localhost:3004/maintain/jobs/m001 |

---

## M5 — Hybrid-A (ต้องซ่อม — เปิดงาน Repair ใหม่)

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|---------------|-------|-------------|-------|------------|-----|---------|------------|
| T-08 | MAINTAIN-INSPECT | T-08b | M5-HA: ตรวจพบเสียหายต้องซ่อม | T-08/m5 | WeeeT | M5-HA | กด "พบความเสียหาย" → D-Maintain-2 | http://localhost:3003/maintain/m001/inspect |
| T-08/m5 | 🆕 MAINTAIN-M5-CONVERT | T-08 | M5-HA: กรอก Damage Report (D-Maintain-2) | (notify WeeeU) | WeeeT | M5-HA | เลือกประเภท+รายละเอียด+รูป | http://localhost:3003/maintain/m001/mockup/m5-convert-repair |
| U-16/m5 | 🆕 MAINTAIN-M5-HA-VIEW | U-16 | M5-HA: WeeeU เห็น "ปิดงาน → เปิดซ่อมใหม่" | /repair/new | WeeeU | M5-HA | 2 ตัวเลือก: เปิด Repair / ปิดแค่นี้ | http://localhost:3001/maintain/jobs/m001/mockup/m5-hybrid-a |
| R-14 | MAINTAIN-JOB-DETAIL | R-12 | M5-HA: WeeeR เห็น closed_for_repair | R-12 | WeeeR | M5-HA | read-only — งานล้างปิด | http://localhost:3002/maintain/jobs/m001 |
| 🆕REPAIR-NEW | REPAIR-NEW (cross-module) | U-16/m5 | M5-HA: WeeeU เปิดงานซ่อมใหม่ | REPAIR-BOOK | WeeeU | M5-HA | /repair/new?from=maintain&jobId={id} — escrow ใหม่ | http://localhost:3001/repair/new?from=maintain |
| A-07 | MAINTAIN-JOB-DETAIL | A-06 | M5-HA: Admin เห็น closed_for_repair + Repair ref | A-07(Repair) | Admin | M5-HA | เชื่อม maintain↔repair job | http://localhost:3004/maintain/jobs/m001 |

---

## M5 — Hybrid-B (ต้องซ่อม — ทำ In-place ต่อ)

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|---------------|-------|-------------|-------|------------|-----|---------|------------|
| T-08 | MAINTAIN-INSPECT | T-08b | M5-HB: ตรวจพบ — ช่างซ่อม in-place | T-08c | WeeeT | M5-HB | ช่างทำงานซ่อมในที่ + ล้างต่อ | http://localhost:3003/maintain/m001/inspect |
| U-14 | MAINTAIN-M4-EXTRACOST | U-16 | M5-HB: WeeeU อนุมัติค่าซ่อม+ล้าง | U-16 | WeeeU | M5-HB | เหมือน M4 แต่ scope ซ่อมด้วย | http://localhost:3001/maintain/jobs/m001/extra-cost |
| T-08c | 🆕 MAINTAIN-CHECKLIST | T-08 | M5-HB: ล้าง+ซ่อมในที่ | T-08d | WeeeT | M5-HB | checklist รวม repair items | http://localhost:3003/maintain/m001/checklist |

---

## M6 — WeeeR Withdrew (ร้านถอนหลังยืนยัน)

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|---------------|-------|-------------|-------|------------|-----|---------|------------|
| R-14 | MAINTAIN-JOB-DETAIL | R-12 | M6: WeeeR กด "ถอนรับงาน" (status=assigned) | R-14/m6 | WeeeR | M6 | ปุ่มปรากฏเฉพาะ assigned | http://localhost:3002/maintain/jobs/m001 |
| R-14/m6 | 🆕 MAINTAIN-M6-WITHDRAW-R | R-14 | M6: WeeeR ยืนยันถอน + ระบุเหตุผล | R-12 | WeeeR | M6 | modal confirm + penalty notice | http://localhost:3002/maintain/jobs/m001/mockup/m6-withdraw |
| U-16c | 🆕 MAINTAIN-WITHDRAW | U-16 | M6: WeeeU รับแจ้ง WeeeR ถอน | U-15 / U-12 | WeeeU | M6 | 2 ตัวเลือก: หาร้านใหม่ / ยกเลิก | http://localhost:3001/maintain/jobs/m001/mockup/m6-weeer-withdrew |
| U-15 | MAINTAIN-M9-CANCEL | U-16c | M6: WeeeU เลือกยกเลิกงาน | U-12 | WeeeU | M6 | cancel หลัง WeeeR ถอน | http://localhost:3001/maintain/jobs/m001/cancel |
| A-07 | MAINTAIN-JOB-DETAIL | A-06 | M6: Admin เห็น audit log WeeeR withdraw | — | Admin | M6 | penalty + settle breakdown | http://localhost:3004/maintain/jobs/m001 |

---

## M7 — No-Show (ช่างถึงแต่ไม่พบลูกค้า)

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|---------------|-------|-------------|-------|------------|-----|---------|------------|
| T-08b | 🆕 MAINTAIN-ARRIVE | T-08a | M7: WeeeT ถึงที่ อัพโหลดรูป | T-08/m7 | WeeeT | M7 | หลังอัพ → "รอลูกค้า" stage | http://localhost:3003/maintain/m001/arrive |
| T-08/m7 | 🆕 MAINTAIN-M7-NOSHOW | T-08b | M7: กด "ลูกค้าไม่อยู่" | (notify WeeeU) | WeeeT | M7 | confirm dialog + 15min wait | http://localhost:3003/maintain/m001/mockup/m7-noshow |
| U-16 | MAINTAIN-JOB-DETAIL | — | M7: WeeeU รับ notification "no_show" | U-13 / U-15 | WeeeU | M7 | banner: หาร้านใหม่ / ยกเลิก / นัดใหม่ | http://localhost:3001/maintain/jobs/m001 |
| U-13 | MAINTAIN-M3-RESCHEDULE | U-16 | M7: WeeeU เลือกนัดใหม่ | U-16 | WeeeU | M7 | เลือกวันใหม่ + confirm | http://localhost:3001/maintain/jobs/m001/reschedule |
| R-14 | MAINTAIN-JOB-DETAIL | R-12 | M7: WeeeR เห็น no_show notification | — | WeeeR | M7 | no action required | http://localhost:3002/maintain/jobs/m001 |
| A-07 | MAINTAIN-JOB-DETAIL | A-06 | M7: Admin เห็น no-show event | — | Admin | M7 | audit log + no-show fee | http://localhost:3004/maintain/jobs/m001 |

---

## M8 — Early Cancel / Reschedule (ยกเลิก/เลื่อน ก่อนช่างออก)

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|---------------|-------|-------------|-------|------------|-----|---------|------------|
| U-16 | MAINTAIN-JOB-DETAIL | U-12 | M8: WeeeU กด "ยกเลิก" (ก่อน assigned) | U-15 | WeeeU | M8 | no charge phase = pending | http://localhost:3001/maintain/jobs/m001 |
| U-15 | MAINTAIN-M9-CANCEL | U-16 | M8: ยืนยันยกเลิก (pending/assigned) | U-12 | WeeeU | M8 | settle ตามเฟส (pending=คืนเต็ม) | http://localhost:3001/maintain/jobs/m001/cancel |
| U-13 | MAINTAIN-M3-RESCHEDULE | U-16 | M8: WeeeU เลื่อนนัด (ก่อน departed) | U-16 | WeeeU | M8 | เลือกวันใหม่ + ยืนยัน | http://localhost:3001/maintain/jobs/m001/reschedule |
| R-14 | MAINTAIN-JOB-DETAIL | — | M8: WeeeR รับแจ้งยกเลิก/เลื่อน | — | WeeeR | M8 | notification only | http://localhost:3002/maintain/jobs/m001 |
| A-07 | MAINTAIN-JOB-DETAIL | A-06 | M8: Admin ดู cancel/reschedule event | — | Admin | M8 | audit log + no charge | http://localhost:3004/maintain/jobs/m001 |

---

## M9 — Terminate Mid-Service (ยุติงานกลางคัน)

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ mockup |
|--------|---------------|-------|-------------|-------|------------|-----|---------|------------|
| U-16 | MAINTAIN-JOB-DETAIL | U-12 | M9: WeeeU กด "ยกเลิก" (ระหว่าง in_progress) | U-15 | WeeeU | M9 | ปุ่มปรากฏเมื่อ in_progress | http://localhost:3001/maintain/jobs/m001 |
| U-16/m9 | 🆕 MAINTAIN-M9-INPROGRESS | U-16 | M9: WeeeU ยืนยันยุติ + เหตุผล + settle preview | U-12 | WeeeU | M9 | settle: ค่าเดินทาง + ค่าแรงส่วน | http://localhost:3001/maintain/jobs/m001/mockup/m9-cancel-inprogress |
| U-15 | MAINTAIN-M9-CANCEL | U-16/m9 | M9: cancel page (all phases) | U-12 | WeeeU | M9 | computeSettle(phase, terms) | http://localhost:3001/maintain/jobs/m001/cancel |
| R-14/m9 | 🆕 MAINTAIN-M9-WEEER-VIEW | R-14 | M9: WeeeR รับแจ้งงานถูกยุติ | R-12 | WeeeR | M9 | settle เข้า WeeeR wallet | http://localhost:3002/maintain/jobs/m001 |
| A-07/m9 | 🆕 MAINTAIN-M9-ADMIN-AUDIT | A-07 | M9: Admin audit settle | A-06 | Admin | M9 | approve/adjust/escalate | http://localhost:3004/maintain/jobs/m001/mockup/m9-cancelled |
| A-06 | MAINTAIN-JOBS | — | M9: Admin ดู list jobs ที่ cancelled | A-07 | Admin | M9 | filter: status=cancelled | http://localhost:3004/maintain/jobs |

---

## สรุป New IDs (R4 — minted ใน P2+P3 Maintain Gen 4)

| ID | Screen Name | Route | App | เคส |
|----|------------|-------|-----|-----|
| R-12b | MAINTAIN-QUEUE-OFFER | /maintain/queue/[id]/offer | WeeeR | M1 |
| R-12c | MAINTAIN-OFFER-SUCCESS | /maintain/queue/[id]/offer/success | WeeeR | M1 |
| U-16a | MAINTAIN-OFFERS | /maintain/jobs/[id]/offers | WeeeU | M1 |
| U-16b | MAINTAIN-RATE | /maintain/jobs/[id]/rate | WeeeU | M1 |
| U-16c | MAINTAIN-WITHDRAW | /maintain/jobs/[id]/withdraw | WeeeU | M6 |
| T-08a | MAINTAIN-DEPART | /maintain/[id]/depart | WeeeT | M1 |
| T-08b | MAINTAIN-ARRIVE | /maintain/[id]/arrive | WeeeT | M1,M7 |
| T-08c | MAINTAIN-CHECKLIST | /maintain/[id]/checklist | WeeeT | M1 |
| T-08d | MAINTAIN-COMPLETE | /maintain/[id]/complete | WeeeT | M1 |
| T-08/risk | MAINTAIN-RISK-FORM | /maintain/[id]/inspect (mode=risk_form) | WeeeT | M3 |
| T-08/m5 | MAINTAIN-M5-CONVERT | /maintain/[id]/mockup/m5-convert-repair | WeeeT | M5-HA |
| T-08/m7 | MAINTAIN-M7-NOSHOW | /maintain/[id]/mockup/m7-noshow | WeeeT | M7 |
| U-16/m2 | MAINTAIN-M2-EXPIRED | /maintain/jobs/[id]/mockup/m2-expired | WeeeU | M2 |
| U-16/m3 | MAINTAIN-M3-RISK-NOTIFY | /maintain/jobs/[id]/mockup/m3-risk-inspect | WeeeU | M3 |
| R-14/m3 | MAINTAIN-M3-WEEER-VIEW | /maintain/jobs/[id]/mockup/m3-risk-notify | WeeeR | M3 |
| U-16/m5 | MAINTAIN-M5-HA-VIEW | /maintain/jobs/[id]/mockup/m5-hybrid-a | WeeeU | M5-HA |
| REPAIR-NEW | REPAIR-NEW (cross-module) | /repair/new?from=maintain | WeeeU | M5-HA |
| R-14/m6 | MAINTAIN-M6-WITHDRAW-R | /maintain/jobs/[id]/mockup/m6-withdraw | WeeeR | M6 |
| U-16/m9 | MAINTAIN-M9-INPROGRESS | /maintain/jobs/[id]/mockup/m9-cancel-inprogress | WeeeU | M9 |
| R-14/m9 | MAINTAIN-M9-WEEER-VIEW | /maintain/jobs/[id] (status=terminated) | WeeeR | M9 |
| A-07/m9 | MAINTAIN-M9-ADMIN-AUDIT | /maintain/jobs/[id]/mockup/m9-cancelled | Admin | M9 |
| T-01 | JOBS-LIST | /jobs | WeeeT | M1-M9 |
| T-11 | JOB-DETAIL | /jobs/[id] | WeeeT | M1-M9 |

> **หมายเหตุ**: IDs ที่มี "/" (เช่น T-08/risk) = sub-state ของหน้าเดิม ไม่ใช่ route ใหม่ ใช้เป็น visual stage reference เท่านั้น  
> IDs ที่เป็นตัวอักษรล้วน (R-12b, T-08a) = route ใหม่ มีไฟล์ page.tsx แยก → ต้องรายงาน HUB เพื่อ register ใน P1 Registry

---

*สร้างโดย App3R-Maintain Gen 4 · 2026-06-05 · feature/maintain-p2p3 @ wt-maintain-p2p3*
