# Repair Module — Word File (P3)
**HUB Gen 52 · base da0e3a9 · generated 2026-06-06**

Module: App3R-Repair · cases C1–C10 + M5 Hybrid B
Format: 9 columns × case-organized
Columns: รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์เปิด mockup

**App Ports:** Admin=3000 · WeeeR=3001 · WeeeU=3002 · WeeeT=3003 · Website=3004

---

## C1 — Walk-in / DROP_OFF

> ลูกค้านำเครื่องไปส่งที่ร้านซ่อมด้วยตนเอง → ร้านรับ ตรวจ ซ่อม → ลูกค้ามารับ

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ |
|---|---|---|---|---|---|---|---|---|
| U-02b | REPAIR-WALKIN-SHOP | U-02 (กด DROP_OFF) | เลือกบริการ DROP_OFF | U-03 | WeeeR R-02 | C1 | เลือกร้าน + ระยะทาง | [localhost:3002/repair/walk-in/select-shop](http://localhost:3002/repair/walk-in/select-shop) |
| U-03 | REPAIR-CREATE | U-02b | กรอกรายละเอียด + ส่งใบแจ้งซ่อม | U-38 | WeeeR R-02 | C1 | Lens A7: sample data | [localhost:3002/repair/new](http://localhost:3002/repair/new) |
| U-38 | REPAIR-CREATE-SUCCESS | U-03 (submit) | success state | U-02 | — | C1 | Lens A8: success page | [localhost:3002/repair/new/success](http://localhost:3002/repair/new/success) |
| U-05 | REPAIR-OFFERS | U-02 (listing card) | offer_count > 0 | U-04 (assigned) | WeeeR R-05 | C1 | Lens B3: Gold Lock ตัวเลขไทย | [localhost:3002/repair/[id]/offers](http://localhost:3002/repair/[id]/offers) |
| U-04 | REPAIR-DETAIL | U-05 / U-02 | state: assigned→in_progress | U-09c, U-06 | WeeeR R-11, WeeeT T-03 | C1,C2,C3,C6 | §5/§6/§8 annotated | [localhost:3002/repair/[id]](http://localhost:3002/repair/[id]) |
| R-05 | REPAIR-WALKIN-QUEUE | R-02, R-09 | DROP_OFF job assigned | R-06 | WeeeU U-04 | C1 | Queue view ร้าน | [localhost:3001/repair/walk-in/queue](http://localhost:3001/repair/walk-in/queue) |
| R-06 | REPAIR-C1-WALKIN | R-05 | receive/inspect/in-progress/ready/abandoned | R-11, T-02 | WeeeU U-06 | C1,C8 | Sub-steps: receive→inspect→progress→ready→abandoned | [localhost:3001/repair/walk-in/queue/[id]](http://localhost:3001/repair/walk-in/queue/[id]) |
| T-02 | DIAGNOSE | T-01 (jobs list) | tech assigned | T-03 | WeeeR R-11, WeeeU U-06 | C1,C2,C3,C6 | WeeeT diagnose form | [localhost:3003/jobs/[id]/diagnose](http://localhost:3003/jobs/[id]/diagnose) |
| T-03 | REPAIR IN-PROGRESS | T-02 | in_progress | T-15 | WeeeR R-11, WeeeU U-06 | C1,C2,C3,C5,C6 | — | [localhost:3003/jobs/[id]](http://localhost:3003/jobs/[id]) |
| T-15 | REPAIR-SUCCESS | T-03 | repair done | T-38 | WeeeR R-11 | C1,C2,C3,C5,C6 | success screen | [localhost:3003/jobs/[id]/repair/success](http://localhost:3003/jobs/[id]/repair/success) |
| T-38 | POST-REPAIR | T-15 | post-repair survey | WeeeR R-06 | WeeeU U-04 | C1,C2,C3,C6 | — | [localhost:3003/jobs/[id]/post-repair](http://localhost:3003/jobs/[id]/post-repair) |
| U-53e | REPAIR-WALKIN-RCPT | U-04 (notify) | state: awaiting_review, DROP_OFF | U-09 | WeeeR R-06 | C1 | ลูกค้าไปรับเครื่อง | [localhost:3002/repair/[id]/walk-in-receipt](http://localhost:3002/repair/[id]/walk-in-receipt) |
| U-09 | REPAIR-REVIEW | U-53e / U-09d | state: awaiting_review | closed | WeeeR R-11, Admin A-21 | C1,C2,C3,C6 | §5/§6/§8 annotated | [localhost:3002/repair/[id]/review](http://localhost:3002/repair/[id]/review) |

---

## C2 — Pickup / PICKUP_DELIVERY

> WeeeT ออกไปรับเครื่องถึงบ้านลูกค้า → ซ่อมที่ร้าน → WeeeT ส่งคืน

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ |
|---|---|---|---|---|---|---|---|---|
| U-02c | REPAIR-PICKUP-SCHED | U-02 (กด PICKUP) | เลือกบริการ PICKUP_DELIVERY + นัดวันเวลา | U-03 | WeeeR R-07b | C2 | นัดหมายวัน+เวลา+ที่อยู่ | [localhost:3002/repair/pickup/schedule](http://localhost:3002/repair/pickup/schedule) |
| U-03 | REPAIR-CREATE | U-02c | กรอกรายละเอียด | U-38 | WeeeR R-07b | C2 | — | [localhost:3002/repair/new](http://localhost:3002/repair/new) |
| R-07b | REPAIR-PICKUP-QUEUE | R-02, R-09 | PICKUP_DELIVERY job | R-65 | WeeeU U-04 | C2 | Queue รับ-ส่ง | [localhost:3001/repair/pickup/queue](http://localhost:3001/repair/pickup/queue) |
| R-65 | REPAIR-C2-PICKUP | R-07b | intake/diagnose/dispatch/track/ready-to-deliver | R-11, T-04 | WeeeU U-06 | C2 | Sub-steps: intake→diagnose→dispatch→track→ready | [localhost:3001/repair/pickup/queue/[id]](http://localhost:3001/repair/pickup/queue/[id]) |
| T-04 | PICKUP EN-ROUTE/ARRIVED | T-01 | en_route_pickup | WeeeR R-65 | WeeeU U-04 | C2 | แผนที่+ETA mockup | [localhost:3003/jobs/[id]](http://localhost:3003/jobs/[id]) |
| T-44 | DELIVERY sub-flow | T-38 | ready_to_deliver | WeeeU U-53b | WeeeR R-65 | C2 | ส่งคืนถึงบ้านลูกค้า | [localhost:3003/jobs/[id]](http://localhost:3003/jobs/[id]) |
| U-53b | REPAIR-PICKUP-RCPT | U-04 (notify) | delivered (WeeeT ส่งแล้ว) | U-09 | WeeeR R-65 | C2 | ยืนยันรับเครื่องคืน | [localhost:3002/repair/[id]/pickup-receipt](http://localhost:3002/repair/[id]/pickup-receipt) |

---

## C3 — Parcel / SHIPPING

> ลูกค้าส่งเครื่องไปรษณีย์ไปที่ร้าน → ซ่อม → ส่งคืนไปรษณีย์

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ |
|---|---|---|---|---|---|---|---|---|
| U-53c | REPAIR-SHIP-OUT | U-04 (assigned, SHIPPING) | กรอก tracking | U-53d | WeeeR R-07 | C3 | ลูกค้าส่งพัสดุ | [localhost:3002/repair/[id]/ship-out](http://localhost:3002/repair/[id]/ship-out) |
| U-53d | REPAIR-SHIPPING | U-53c | tracking confirmed | U-53a | WeeeR R-07 | C3 | ติดตามสถานะพัสดุ | [localhost:3002/repair/[id]/shipping-details](http://localhost:3002/repair/[id]/shipping-details) |
| R-07 | REPAIR-PARCEL-QUEUE | R-02 | SHIPPING job | R-08 | WeeeU U-04 | C3 | Queue พัสดุ | [localhost:3001/repair/parcel/queue](http://localhost:3001/repair/parcel/queue) |
| R-08 | REPAIR-C3-PARCEL | R-07 | receive/inspect/dispatch-tech/shipping-details/ship-back | R-11, T-02 | WeeeU U-06 | C3 | Sub-steps | [localhost:3001/repair/parcel/queue/[id]](http://localhost:3001/repair/parcel/queue/[id]) |
| U-53a | REPAIR-PARCEL-RCPT | U-53d (notify) | parcel_delivered | U-09 | WeeeR R-08 | C3 | ยืนยันรับพัสดุคืน | [localhost:3002/repair/[id]/parcel-receipt](http://localhost:3002/repair/[id]/parcel-receipt) |

---

## C4 — Scrap Conversion (B2 accept)

> WeeeR วินิจฉัย: ซ่อมไม่คุ้ม → B2.2 ข้อเสนอซาก → WeeeU ตกลง → Scrap job

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ |
|---|---|---|---|---|---|---|---|---|
| U-52b | REPAIR-B2-DECISION | U-04 (awaiting_user, B2.2) | decision_branch=B2.2 | U-07 (ตกลง) / U-04 cancelled (ปฏิเสธ) | WeeeR R-46, R-11 | C4 | §5/§8 annotated · Lens B2+B3 | [localhost:3002/repair/[id]/decision/b2-2](http://localhost:3002/repair/[id]/decision/b2-2) |
| U-07 | REPAIR-C4-SCRAP | U-52b (ตกลง) | scrap accepted | /scrap/new (System) | WeeeR R-46b | C4 | เลือก scrap buyer | [localhost:3002/repair/[id]/scrap-offer](http://localhost:3002/repair/[id]/scrap-offer) |
| R-46 | LISTINGS-REPAIR | R-11 (B2 proposal) | B2 scrap listing created | R-46b | WeeeU U-52b | C4 | WeeeR สร้าง scrap listing | [localhost:3001/listings/repair](http://localhost:3001/listings/repair) |
| R-46b | LISTINGS-REPAIR-DETAIL | R-46 | scrap buyer confirmed | — | WeeeU U-07 | C4 | รายละเอียดซาก | [localhost:3001/listings/repair/[id]](http://localhost:3001/listings/repair/[id]) |

---

## C5 — Re-price Accept (B1 accept)

> WeeeR พบต้องอะไหล่เพิ่ม → B1.2 ราคาใหม่ → WeeeU ตกลง → ซ่อมต่อ → fee-settle → closed

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ |
|---|---|---|---|---|---|---|---|---|
| U-52a | REPAIR-B1-DECISION | U-04 (awaiting_user, B1.2) | decision_branch=B1.2 | U-04 in_progress (ตกลง) / cancelled (ปฏิเสธ) | WeeeR R-11, WeeeT T-03 | C5,C10 | §5/§8 annotated · Lens B1+B3 | [localhost:3002/repair/[id]/decision/b1-2](http://localhost:3002/repair/[id]/decision/b1-2) |
| U-08 | REPAIR-C5-FEE | U-09d (หลัง delivery) | B1 accepted + completed | U-09 | WeeeR R-11 | C5 | ชำระส่วนต่างค่าอะไหล่ | [localhost:3002/repair/[id]/fee-settle](http://localhost:3002/repair/[id]/fee-settle) |

---

## C6 — ONSITE Happy Path

> ช่างไปบ้าน ตรวจ/ซ่อมเสร็จตรง ไม่มี B1/B2 — เคสหลัก

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ |
|---|---|---|---|---|---|---|---|---|
| U-03 | REPAIR-CREATE | U-02 | ONSITE service | U-38 | WeeeR R-02 | C6 | form + photo | [localhost:3002/repair/new](http://localhost:3002/repair/new) |
| U-38 | REPAIR-CREATE-SUCCESS | U-03 | success | U-02 | — | C6 | Lens A8 | [localhost:3002/repair/new/success](http://localhost:3002/repair/new/success) |
| U-05 | REPAIR-OFFERS | U-02 | offer_count > 0 | U-04 | WeeeR R-09 | C6 | Gold Lock acknowledge | [localhost:3002/repair/[id]/offers](http://localhost:3002/repair/[id]/offers) |
| R-04 | REPAIR-ANNOUNCE-DETAIL | R-02 | announce open | R-03 | WeeeU U-02 | C6 | WeeeR ดูรายละเอียด | [localhost:3001/repair/announcements/[id]](http://localhost:3001/repair/announcements/[id]) |
| R-03 | REPAIR-BID | R-04 | ยื่น offer | R-38 | WeeeU U-05 | C6 | 9 เงื่อนไข | [localhost:3001/repair/announcements/[id]/offer](http://localhost:3001/repair/announcements/[id]/offer) |
| R-38 | REPAIR-BID-SUCCESS | R-03 | submit offer | R-09 | — | C6 | Lens A8+A1 | [localhost:3001/repair/announcements/[id]/offer/success](http://localhost:3001/repair/announcements/[id]/offer/success) |
| R-10 | REPAIR-ASSIGN-TECH | R-11 (assigned) | assign tech | WeeeT T-01 | WeeeU U-04 | C6 | มอบหมายช่าง | [localhost:3001/repair/jobs/[id]/assign](http://localhost:3001/repair/jobs/[id]/assign) |
| R-11 | REPAIR-JOB-DETAIL | R-09 | job detail + sub-steps | R-10, T-02 | WeeeU U-04, WeeeT T-03 | C6,C1-C5 | approve/dispute/progress | [localhost:3001/repair/jobs/[id]](http://localhost:3001/repair/jobs/[id]) |
| U-09c | REPAIR-APPROVE-ENTRY | U-04 (awaiting_entry) | arrived → approve | U-04 (inspecting) | WeeeT T-02, WeeeR R-11 | C6 | ลูกค้าอนุมัติช่างเข้าบ้าน | [localhost:3002/repair/[id]/approve-entry](http://localhost:3002/repair/[id]/approve-entry) |
| U-06 | REPAIR-PROGRESS | U-04 (in_progress) | in_progress | U-04 | WeeeR R-11 | C6,C1-C5 | timeline + % | [localhost:3002/repair/[id]/progress](http://localhost:3002/repair/[id]/progress) |
| U-09d | REPAIR-DELIVERY | U-04 (awaiting_review) | ONSITE delivery confirm | U-09 | WeeeR R-11 | C6,C5 | ยืนยันส่งมอบงาน | [localhost:3002/repair/[id]/delivery-receipt](http://localhost:3002/repair/[id]/delivery-receipt) |
| R-64 | REPAIR-DASHBOARD | R-09 | WeeeR dashboard | — | — | C6 | overview stats | [localhost:3001/repair/dashboard](http://localhost:3001/repair/dashboard) |
| A-02 | REPAIR-JOBS | Admin | all repair jobs | A-03 | WeeeR R-11, WeeeU U-04 | C6,C9 | Admin view | [localhost:3000/repair/jobs](http://localhost:3000/repair/jobs) |
| A-03 | REPAIR-JOB-DETAIL | A-02 | job detail | A-03c | — | C6,C9 | — | [localhost:3000/repair/jobs/[id]](http://localhost:3000/repair/jobs/[id]) |
| A-21 | REPAIR-ANALYTICS | Admin | analytics | — | — | C6 | metrics | [localhost:3000/repair/analytics](http://localhost:3000/repair/analytics) |

---

## C7 — Cancel (before assignment)

> ลูกค้ายกเลิกก่อน WeeeR accept → state: cancelled · Escrow ไม่ถูก lock

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ |
|---|---|---|---|---|---|---|---|---|
| U-04 | REPAIR-DETAIL (cancel) | U-02 | state: open (ยังไม่ assigned) | U-02 (cancelled) | WeeeR R-02/R-04 | C7 | cancel action → confirm dialog | [localhost:3002/repair/[id]](http://localhost:3002/repair/[id]) |

---

## C8 — Walk-in Abandoned

> ซ่อมเสร็จแต่ลูกค้าไม่มารับ 7 วัน → ค่าฝาก → state: abandoned

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ |
|---|---|---|---|---|---|---|---|---|
| R-06 (ready) | REPAIR-C1-WALKIN (ready) | R-06 (in-progress) | repair done, waiting customer | R-06 (abandoned ถ้า 7 วัน) | WeeeU U-04 | C1,C8 | countdown + ค่าฝากสะสม | [localhost:3001/repair/walk-in/queue/[id]](http://localhost:3001/repair/walk-in/queue/[id]) |
| R-06 (abandoned) | REPAIR-C1-WALKIN (abandoned) | R-06 (ready, expired) | หมด grace period | — | WeeeU U-04 | C8 | trigger abandoned + storage fee | [localhost:3001/repair/walk-in/queue/[id]](http://localhost:3001/repair/walk-in/queue/[id]) |
| U-04 | REPAIR-DETAIL (abandoned) | R-06 (notify) | state: abandoned | — | WeeeR R-06 | C8 | แสดงค่าฝากถูกหัก | [localhost:3002/repair/[id]](http://localhost:3002/repair/[id]) |

---

## C9 — Dispute (Admin Intervene)

> WeeeU เปิด Dispute → Admin ตรวจสอบ → ตัดสิน

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ |
|---|---|---|---|---|---|---|---|---|
| U-09b | REPAIR-DISPUTE | U-04/U-09 (ไม่พอใจ) | คลิก 'เปิดข้อพิพาท' | U-04 (DISPUTED) | Admin A-04, WeeeR R-11 | C9 | §5/§8 annotated | [localhost:3002/repair/[id]/dispute](http://localhost:3002/repair/[id]/dispute) |
| A-04 | REPAIR-DISPUTES | Admin | DISPUTED job | A-05 | WeeeU U-04 | C9 | dispute list view | [localhost:3000/repair/disputes](http://localhost:3000/repair/disputes) |
| A-05 | REPAIR-C9-INTERVENE | A-04 | สอบสวนข้อพิพาท | A-03c | WeeeU U-04, WeeeR R-11 | C9 | หลักฐาน + เจรจา | [localhost:3000/disputes/[id]](http://localhost:3000/disputes/[id]) |
| A-03c | REPAIR-JOB-OVERRIDE | A-05 | manual-override ตัดสิน | — | WeeeU U-04 | C9 | Admin ruling | [localhost:3000/repair/jobs/[id]/manual-override](http://localhost:3000/repair/jobs/[id]/manual-override) |

---

## C10 — B1 Reject → Cancel

> WeeeR เสนอราคาใหม่ B1.2 → WeeeU ปฏิเสธ → cancelled · ค่าตรวจถูกหัก

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ |
|---|---|---|---|---|---|---|---|---|
| U-52a | REPAIR-B1-DECISION | U-04 (awaiting_user, B1.2) | B1.2 proposal received | U-04 cancelled (ปฏิเสธ) | WeeeR R-11 | C10 | Lens B1: penalty disclosure ก่อน confirm | [localhost:3002/repair/[id]/decision/b1-2](http://localhost:3002/repair/[id]/decision/b1-2) |

---

## M5B — M5 Hybrid B (in-place Repair)

> เครื่องเดียวกันที่กำลังบำรุงรักษา → WeeeT พบปัญหาเพิ่ม → WeeeR เสนอซ่อม in-place ต่อ escrow เดิม

| รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็น | เคส | หมายเหตุ | ลิงก์ |
|---|---|---|---|---|---|---|---|---|
| T-38 | POST-MAINTAIN (issue report) | T-15 (maintain done) | WeeeT พบ additional issue | WeeeR R-11 | WeeeU U-04 | M5B | report interface + รูปประกอบ | [localhost:3003/jobs/[id]/post-repair](http://localhost:3003/jobs/[id]/post-repair) |
| R-11 | REPAIR-JOB-DETAIL (M5B create) | T-38 report | additional issue → in-place proposal | WeeeU U-04 | WeeeU U-04 | M5B | WeeeR สร้าง in-place repair proposal | [localhost:3001/repair/jobs/[id]](http://localhost:3001/repair/jobs/[id]) |
| U-04 | REPAIR-DETAIL (M5B notification) | R-11 (notify) | in-place repair offer | U-05 (M5B offer) | WeeeR R-11 | M5B | Notification: ช่างพบปัญหาเพิ่ม | [localhost:3002/repair/[id]](http://localhost:3002/repair/[id]) |
| U-05 | REPAIR-OFFERS (M5B) | U-04 | in-place offer + Escrow extend | U-04 (in_progress) | WeeeR R-11, WeeeT T-02 | M5B | Gold Lock extend acknowledge | [localhost:3002/repair/[id]/offers](http://localhost:3002/repair/[id]/offers) |
| U-09 | REPAIR-REVIEW (combined) | U-09d | Maintain + Repair combined | closed | WeeeR R-11 | M5B | One settlement (Maintain+Repair) | [localhost:3002/repair/[id]/review](http://localhost:3002/repair/[id]/review) |

---

## สรุป Screen IDs ทั้งหมดในไฟล์นี้

| App | Screen IDs |
|---|---|
| WeeeU | U-02, U-02b, U-02c, U-03, U-04, U-05, U-06, U-07, U-08, U-09, U-09b, U-09c, U-09d, U-38, U-52a, U-52b, U-53a, U-53b, U-53c, U-53d, U-53e |
| WeeeR | R-03, R-04, R-05, R-06, R-07, R-07b, R-08, R-09, R-10, R-11, R-38, R-46, R-46b, R-64, R-65 |
| WeeeT | T-02, T-03, T-04, T-15, T-38, T-44 |
| Admin | A-02, A-03, A-03c, A-04, A-05, A-21 |

**หมายเหตุ:** ทุก Screen ID ในไฟล์นี้ใช้ canonical ID จาก ScreenBadge SCREEN_MAP · ห้าม mint ซ้ำ (R3)

---

*P3 Word Module-File · Repair Module · HUB Gen 52 · base da0e3a9 · 2026-06-06*
