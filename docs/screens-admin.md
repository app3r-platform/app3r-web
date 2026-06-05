# Admin — Screen Table (P3 · 9 คอลัมน์)
> App3R-Admin · Port 3000 · navy #2C5E8C · Advisor Gen 113 · 2026-06-05
> format: รหัสจอ | ชื่อจอ/หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯ/บทบาทที่เห็น | เคส | หมายเหตุ | เปิด mockup

---

## คำอธิบายคอลัมน์

| # | คอลัมน์ | ความหมาย |
|---|---------|---------|
| 1 | **รหัสจอ** | Screen ID — ตรงกับ mockup เป๊ะ (A-xx / A-xxb / A-xxc) |
| 2 | **ชื่อจอ / หน้าที่** | ฟังก์ชันหลักของหน้านี้ |
| 3 | **มาจาก** | รหัส+ชื่อจอต้นทาง (หลายได้) |
| 4 | **เงื่อนไข/เคสที่มาถึงจอนี้** | trigger หรือ business case |
| 5 | **ไปต่อ** | รหัส+ชื่อจอปลายทาง (หลายได้) |
| 6 | **แอพฯ/บทบาทที่เห็น ณ จังหวะนี้** | cross-app: แอพฯอื่นเห็นจอไหนพร้อมกัน |
| 7 | **เคส** | C1-10 / M1-9 / R1-12 / S1-12 / P1-12 |
| 8 | **หมายเหตุ** | sample data / จ.1·จ.2 / ruling |
| 9 | **เปิด mockup** | ลิงก์ local เปิดดูจอจริง |

---

## Admin Screens (A-01 .. A-73)

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯที่เห็นด้วย | เคส | หมายเหตุ | เปิด mockup |
|--------|----------------|-------|-------------|-------|----------------|-----|---------|------------|
| **A-01** | Dashboard — ภาพรวมระบบ ผู้ใช้ล่าสุด สถิติ API | A-73 (เข้าสู่ระบบ) | เข้าสู่ระบบสำเร็จ | A-02 Repair Jobs · A-06 Maintain · A-08 Scrap · A-12 Resell · A-15 Parts Orders · A-19 KYC · A-42 Users · A-44 Points | — | — | sample: 247 users · 3 WeeeR รออนุมัติ · API Online · R2 fix: route=`/` (ไม่ใช่ /dashboard) | [http://localhost:3000/](http://localhost:3000/) |
| **A-02** | Repair Jobs — รายการงานซ่อมทั้งระบบ ค้นหา+กรองสถานะ | A-01 (sidebar) · A-03 (back) | Admin ดูงานซ่อม C1-C10 | A-03 Job Detail · A-04 Disputes · A-21 Analytics | WeeeU: U-04 ดูสถานะ · WeeeR: R-09 ดูรายการ · WeeeT: T-11 ดูงาน | C1-C10 | sample: 18 งาน active · filter: all/active/inspecting/in_progress/cancelled | [http://localhost:3000/repair/jobs](http://localhost:3000/repair/jobs) |
| **A-03** | Repair Job Detail — รายละเอียดงานซ่อม timeline สถานะ | A-02 (list) | คลิกรายการงานซ่อม | A-02 (back) · A-05 Dispute (C9) · A-03c Manual Override | WeeeU: U-06 ดูความคืบหน้า · WeeeR: R-11 ดูงาน · WeeeT: T-11 ดูงาน | C1-C10 | sample: JOB-2024-001 · สถานะ inspecting · WeeeU: สมชาย ก. · WeeeR: ร้านซ่อมดี · WeeeT: ช่างเอก | [http://localhost:3000/repair/jobs/c001](http://localhost:3000/repair/jobs/c001) |
| **A-03c** | Repair Job Manual Override — Admin บังคับเปลี่ยนสถานะ | A-03 (Job Detail) | Admin ต้องการ override สถานะ | A-03 (กลับ) | — | C1-C10 | เครื่องมือฉุกเฉิน · บันทึก audit log | [http://localhost:3000/repair/jobs/c001/manual-override](http://localhost:3000/repair/jobs/c001/manual-override) |
| **A-04** | Repair Disputes — รายการข้อพิพาทงานซ่อม | A-01 (sidebar) · A-02 (tab) | มีข้อพิพาท C9 | A-05 Dispute Detail | WeeeU: U-04 เห็นสถานะ dispute · WeeeR: R-11 เห็นสถานะ C9 | C9 | sample: 2 รายการ pending · dispute reason: "งานไม่เป็นไปตามราคา" | [http://localhost:3000/repair/disputes](http://localhost:3000/repair/disputes) |
| **A-05** | Repair Dispute Detail — Admin ตัดสิน C9 intervention | A-04 (list) | คลิกรายการข้อพิพาท | A-04 (back หลังตัดสิน) | WeeeU: U-04 รับผลตัดสิน · WeeeR: R-11 รับผลตัดสิน | C9 | Admin ตัดสิน: ผู้ซื้อชนะ/ผู้ขายชนะ/แบ่ง · Escrow ปล่อยตามผล | [http://localhost:3000/repair/disputes/c001](http://localhost:3000/repair/disputes/c001) |
| **A-06** | Maintain Jobs — รายการงานบำรุงรักษาทั้งระบบ | A-01 (sidebar) · A-07 (back) | Admin ดูงานบำรุง M1-M9 | A-07 Job Detail · A-31 Analytics · A-32 Recurring | WeeeU: U-16 ดูงาน · WeeeR: R-14 ดูงาน · WeeeT: T-11 ดูงาน | M1-M9 | sample: 12 งาน active · สถานะ: scheduled/in_progress/completed | [http://localhost:3000/maintain/jobs](http://localhost:3000/maintain/jobs) |
| **A-07** | Maintain Job Detail — รายละเอียดงานบำรุง timeline | A-06 (list) | คลิกรายการงานบำรุง | A-06 (back) · A-07c (M9 cancel state) | WeeeU: U-16 ดูงาน · WeeeR: R-14 ดูงาน · WeeeT: T-08/T-09 | M1-M9 | sample: MAINT-2024-005 · WeeeU: สมหญิง ข. · บ้านเลขที่ 55 · สัญญา 6 เดือน | [http://localhost:3000/maintain/jobs/m001](http://localhost:3000/maintain/jobs/m001) |
| **A-07c** | Maintain Job M9-Cancelled — mockup state ยกเลิก M9 | A-07 (Job Detail) | สถานะ M9 (ยกเลิก) | A-07 (back) | — | M9 | mockup แสดงสถานะ cancelled · พอยต์ทองที่ล็อกคืน WeeeU | [http://localhost:3000/maintain/jobs/m001/mockup/m9-cancelled](http://localhost:3000/maintain/jobs/m001/mockup/m9-cancelled) |
| **A-08** | Scrap Jobs — รายการงานซากทั้งระบบ | A-01 (sidebar) · A-08b (back) | Admin ดูงานซาก S1-S12 | A-08b Job Detail · A-09 Disputes | WeeeU: U-33 ดูสถานะ · WeeeR: R-27/R-28 ดูงาน · WeeeT: T-04 รับขนส่ง | S1-S12 | sample: 8 งาน · S4: ออกใบรับรอง · S6/S9: รับซาก | [http://localhost:3000/scrap/jobs](http://localhost:3000/scrap/jobs) |
| **A-08b** | Scrap Job Detail — รายละเอียดงานซาก | A-08 (list) | คลิกรายการงานซาก | A-08 (back) | WeeeU: U-33 · WeeeR: R-28 | S1-S12 | sample: SCRAP-2024-003 · น้ำหนัก 15 กก. · ราคาซาก 450 บาท | [http://localhost:3000/scrap/jobs/s001](http://localhost:3000/scrap/jobs/s001) |
| **A-09** | Scrap Disputes — รายการข้อพิพาทงานซาก | A-01 (sidebar) · A-08 (tab) | มีข้อพิพาท S11 | A-10 Dispute Ruling | WeeeU: U-33 เห็นสถานะ S11 | S11 | sample: 1 รายการ pending | [http://localhost:3000/scrap/disputes](http://localhost:3000/scrap/disputes) |
| **A-10** | Scrap Dispute Ruling — Admin ตัดสิน S11 | A-09 (list) | คลิกรายการข้อพิพาทซาก | A-09 (back หลังตัดสิน) | WeeeU: U-33 รับผล · WeeeR: R-28 รับผล | S11 | Admin ตัดสิน: น้ำหนักผิด/ถูก → ปรับราคา | [http://localhost:3000/scrap/disputes/s001](http://localhost:3000/scrap/disputes/s001) |
| **A-11** | Scrap Certificates — รายการใบรับรองการทำลาย | A-01 (sidebar) | Admin ดูใบรับรอง S4 | A-11b Cert Detail | WeeeU: U-32 ดูใบรับรอง | S4 | sample: 5 ใบรับรอง · เลขที่ CERT-2024-001..005 | [http://localhost:3000/scrap/certificates](http://localhost:3000/scrap/certificates) |
| **A-11b** | Scrap Cert Detail — รายละเอียดใบรับรองการทำลาย | A-11 (list) | คลิกรายการใบรับรอง | A-11 (back) | WeeeU: U-32 ดูใบรับรอง | S4 | sample: CERT-2024-003 · วันที่ทำลาย 2026-05-15 · ช่าง: สมศรี | [http://localhost:3000/scrap/certificates/cert001](http://localhost:3000/scrap/certificates/cert001) |
| **A-12** | Resell Listings — รายการประกาศขายมือสองทั้งระบบ | A-01 (sidebar) · A-12b (back) | Admin ดูประกาศ R2-R12 | A-12b Listing Detail · A-13 Disputes | WeeeU: U-17 ดูประกาศของตน · WeeeR: R-15 ดูประกาศ | R2-R12 | sample: 24 ประกาศ · active 18 · sold 6 | [http://localhost:3000/resell/listings](http://localhost:3000/resell/listings) |
| **A-12b** | Resell Listing Detail — รายละเอียดประกาศขาย | A-12 (list) | คลิกรายการประกาศ | A-12 (back) | WeeeU: U-20 ดูรายละเอียด · WeeeR: R-16 | R2-R12 | sample: ทีวี Samsung 55" · ราคา 8,500 บาท · รอผู้ซื้อ | [http://localhost:3000/resell/listings/r001](http://localhost:3000/resell/listings/r001) |
| **A-13** | Resell Disputes — รายการข้อพิพาทขายมือสอง | A-01 (sidebar) · A-12 (tab) | มีข้อพิพาท R8/R9 | A-14 Dispute Ruling | WeeeU: U-26 ยื่น R8 · WeeeR: R-22 รับทราบ | R8, R9 | sample: 1 dispute pending · R8: "สินค้าไม่ตรงคำอธิบาย" | [http://localhost:3000/resell/disputes](http://localhost:3000/resell/disputes) |
| **A-14** | Resell Dispute Ruling — Admin ตัดสิน R9 | A-13 (list) | คลิกรายการข้อพิพาทขาย | A-13 (back หลังตัดสิน) | WeeeU: U-26 รับผล · WeeeR: R-22 รับผล | R9 | Admin ตัดสิน: คืนสินค้า/จ่ายชดเชย · Escrow ปล่อยตามผล | [http://localhost:3000/resell/disputes/r001](http://localhost:3000/resell/disputes/r001) |
| **A-15** | Parts Orders — รายการคำสั่งซื้ออะไหล่ทั้งระบบ (P5-P7) | A-01 (sidebar) · A-16 (back) | Admin ดูคำสั่งอะไหล่ | A-16 Order Detail · A-17 Disputes | WeeeR: R-31 seller orders · WeeeR: R-33 buyer orders | P5-P7 | sample: 24 รายการ · pending 6 · confirmed 5 · shipped 5 · delivered 5 · cancelled 3 · pagination 20/page | [http://localhost:3000/parts/orders](http://localhost:3000/parts/orders) |
| **A-16** | Parts Order Detail — รายละเอียดคำสั่งซื้ออะไหล่ | A-15 (list) | คลิกรายการคำสั่งซื้อ | A-15 (back) · A-18 Dispute (P7) | WeeeR: R-32 seller · WeeeR: R-34 buyer | P5-P7 | sample: ORD-2024-001 · ปลั๊กไฟ 3 ชิ้น 450 บาท · Escrow: 450 Gold ล็อก | [http://localhost:3000/parts/orders/p001](http://localhost:3000/parts/orders/p001) |
| **A-17** | Parts Disputes — รายการข้อพิพาทอะไหล่ (P7) | A-01 (sidebar) · A-15 (tab) · R2: route=`/disputes` | มีข้อพิพาท P7 | A-18 Dispute Detail | WeeeR: R-31 เห็น dispute status | P7 | R2 URL fix: `/disputes` ไม่ใช่ `/parts/disputes` | [http://localhost:3000/disputes](http://localhost:3000/disputes) |
| **A-18** | Parts P7 Dispute — Admin ตัดสิน P7 | A-17 (list) · R2: route=`/disputes/[id]` | คลิกรายการ dispute P7 | A-17 (back หลังตัดสิน) | WeeeR: R-32 รับผลตัดสิน | P7 | Admin ตัดสิน: คืนเงิน/ไม่คืน · พอยต์ทองที่ล็อกปล่อยตามผล | [http://localhost:3000/disputes/p001](http://localhost:3000/disputes/p001) |
| **A-19** | KYC List — รายการขอยืนยัน WeeeR ที่รออนุมัติ | A-01 (sidebar) · A-20 (back) | Admin ตรวจ KYC | A-20 KYC Detail | WeeeR: R-01 รอผล KYC | KYC | sample: 3 รายการ pending · ร้าน: ร้านซ่อมดี · ร้านช่างชาย · อิเล็กทรอ | [http://localhost:3000/kyc](http://localhost:3000/kyc) |
| **A-20** | KYC Detail — ตรวจสอบและอนุมัติ/ปฏิเสธ KYC | A-19 (list) | คลิกรายการ KYC | A-19 (back หลังอนุมัติ/ปฏิเสธ) | WeeeR: R-01 ได้รับแจ้งผล | KYC | sample: ร้านซ่อมดี · เจ้าของ: นาย ก. · เลขบัตร 1234xxx · เอกสาร 3 ชิ้น | [http://localhost:3000/kyc/shop-001](http://localhost:3000/kyc/shop-001) |
| **A-21** | Repair Analytics — สถิติงานซ่อมรวม | A-01 (sidebar) · A-02 (tab) | ดูสถิติงานซ่อม | A-02 Repair Jobs | — | C1-C10 | sample: total 156 · active 18 · closed 120 · cancelled 12 · converted_scrap 6 · avg 3.2 ชม | [http://localhost:3000/repair/analytics](http://localhost:3000/repair/analytics) |
| **A-22** | Repair Parcel Queue — คิวงานซ่อม (ส่งพัสดุ C3) | A-01 (sidebar) | Admin ดูคิว parcel C3 | A-22b Parcel Detail · A-23 Disputes | WeeeR: R-07 ดู parcel queue · WeeeT: T-05 นัดส่ง | C3 | sample: 5 รายการ รอรับพัสดุ · ร้านรอตรวจสภาพ | [http://localhost:3000/repair/parcel/queue](http://localhost:3000/repair/parcel/queue) |
| **A-22b** | Repair Parcel Detail — รายละเอียดงานพัสดุ | A-22 (queue) | คลิกรายการ parcel | A-22 (back) | WeeeR: R-08 parcel detail | C3 | sample: PARCEL-2024-012 · ส่งถึงร้านแล้ว · รอตรวจสภาพ | [http://localhost:3000/repair/parcel/c001](http://localhost:3000/repair/parcel/c001) |
| **A-23** | Repair Parcel Disputes — ข้อพิพาทพัสดุ | A-01 (sidebar) | Admin ดูข้อพิพาทพัสดุ | A-22b (รายละเอียด) | — | C3 | sample: 1 dispute · ของเสียหายระหว่างส่ง | [http://localhost:3000/repair/parcel/disputes](http://localhost:3000/repair/parcel/disputes) |
| **A-24** | Repair Parcel Analytics — สถิติงานพัสดุ | A-01 (sidebar) | ดูสถิติ parcel | — | — | C3 | sample: total 45 parcel · avg transit 1.8 วัน | [http://localhost:3000/repair/parcel/analytics](http://localhost:3000/repair/parcel/analytics) |
| **A-25** | Repair Pickup Queue — คิวรับ-ส่งเครื่อง (รถรับ) | A-01 (sidebar) | Admin ดูคิว pickup | A-25b Detail · A-26 Dispatch Monitor | WeeeT: T-04 รับงานขนส่ง | S6, S9 | sample: 3 รายการ รอส่งมอบ · รถรับ: TH-1234 | [http://localhost:3000/repair/pickup/queue](http://localhost:3000/repair/pickup/queue) |
| **A-25b** | Repair Pickup Detail — รายละเอียดงานรับ-ส่ง | A-25 (queue) | คลิกรายการ pickup | A-25 (back) | — | S6, S9 | sample: PICKUP-2024-007 · ที่อยู่: 123 ถ.รัชดา · เวลานัด 10:00 | [http://localhost:3000/repair/pickup/p001](http://localhost:3000/repair/pickup/p001) |
| **A-26** | Repair Pickup Dispatch Monitor — ติดตามรถรับ-ส่ง real-time | A-25 (queue) | Admin ติดตามรถ | A-25 (back) | — | S6, S9 | sample: map mockup · รถ 2 คัน · TH-1234 กำลังเดินทาง | [http://localhost:3000/repair/pickup/dispatch-monitor](http://localhost:3000/repair/pickup/dispatch-monitor) |
| **A-27** | Repair Pickup Analytics — สถิติงานรับ-ส่ง | A-01 (sidebar) | ดูสถิติ pickup | — | — | — | sample: total 22 pickup · avg 45 นาที | [http://localhost:3000/repair/pickup/analytics](http://localhost:3000/repair/pickup/analytics) |
| **A-28** | Repair Walk-in Queue — คิวงานซ่อมแบบ walk-in (C1) | A-01 (sidebar) | Admin ดูคิว walk-in | A-28b Detail · A-29 Abandoned | WeeeR: R-05 ดู walk-in queue | C1 | sample: 4 รายการ · รอช่าง · เวลารอ avg 23 นาที | [http://localhost:3000/repair/walk-in/queue](http://localhost:3000/repair/walk-in/queue) |
| **A-28b** | Repair Walk-in Detail — รายละเอียด walk-in job | A-28 (queue) | คลิกรายการ | A-28 (back) | WeeeR: R-06 C1 walk-in | C1 | sample: WALK-2024-018 · อุปกรณ์: ทีวี 32" · อาการ: ไม่ติด | [http://localhost:3000/repair/walk-in/w001](http://localhost:3000/repair/walk-in/w001) |
| **A-29** | Walk-in Abandoned — รายการ walk-in ที่ไม่มาเก็บ | A-28 (queue) | Admin ดูรายการทิ้งงาน | A-28 (back) | — | C1 | sample: 2 รายการ เกิน 30 วัน · Admin แจ้งเตือนก่อนทำลาย | [http://localhost:3000/repair/walk-in/abandoned](http://localhost:3000/repair/walk-in/abandoned) |
| **A-30** | Walk-in Analytics — สถิติงาน walk-in | A-01 (sidebar) | ดูสถิติ walk-in | — | — | C1 | sample: total 67 · avg wait 18 นาที · abandoned 2 | [http://localhost:3000/repair/walk-in/analytics](http://localhost:3000/repair/walk-in/analytics) |
| **A-31** | Maintain Analytics — สถิติงานบำรุงรักษา | A-06 (tab) | ดูสถิติบำรุง | A-06 Maintain Jobs | — | M1-M9 | sample: total 89 · recurring 34 · cancelled 8 · avg satisfaction 4.2/5 | [http://localhost:3000/maintain/analytics](http://localhost:3000/maintain/analytics) |
| **A-32** | Maintain Recurring — รายการสัญญาบำรุงซ้ำ | A-06 (tab) | Admin ดูสัญญา recurring | A-06 (back) | WeeeU: U-12 ดูสัญญาบำรุง | M5 (M5 hybrid) | sample: 34 สัญญา · monthly 20 · quarterly 14 · ใกล้หมดอายุ 3 | [http://localhost:3000/maintain/recurring](http://localhost:3000/maintain/recurring) |
| **A-33** | Scrap Listings — รายการประกาศซากทั้งระบบ | A-01 (sidebar) | Admin ดูประกาศซาก | A-33b Listing Detail | WeeeU: U-29 สร้างประกาศ · WeeeR: R-24 ดูประกาศ | S1-S5 | sample: 15 ประกาศ · pending 5 · accepted 7 · completed 3 | [http://localhost:3000/scrap/listings](http://localhost:3000/scrap/listings) |
| **A-33b** | Scrap Listing Detail — รายละเอียดประกาศซาก | A-33 (list) | คลิกรายการประกาศซาก | A-33 (back) | — | S1-S5 | sample: เครื่องซักผ้า SHARP · น้ำหนัก 23 กก. · ราคาเสนอ 320 บาท | [http://localhost:3000/scrap/listings/s001](http://localhost:3000/scrap/listings/s001) |
| **A-34** | Resell Offers — ดูข้อเสนอซื้อทั้งระบบ | A-01 (sidebar) | Admin ดูข้อเสนอ R3-R6 | A-12b Listing Detail | WeeeU: U-18 ดูข้อเสนอ · WeeeR: R-15 | R3-R6 | sample: 8 ข้อเสนอ pending · ราคาต่อรอง avg -12% | [http://localhost:3000/resell/offers](http://localhost:3000/resell/offers) |
| **A-35** | Resell Jobs — รายการงานขายมือสองที่กำลังดำเนินการ | A-01 (sidebar) | Admin ดู resell jobs | A-35b Job Detail | — | R1-R12 | sample: 9 งาน active · R1: inspect pending 3 | [http://localhost:3000/resell/jobs](http://localhost:3000/resell/jobs) |
| **A-35b** | Resell Job Detail — รายละเอียดงานขายมือสอง | A-35 (list) | คลิกรายการงาน | A-35 (back) | — | R1-R12 | sample: JOB-RESELL-2024-005 · R1 inspect · ผู้ขาย: นาย ข. | [http://localhost:3000/resell/jobs/r001](http://localhost:3000/resell/jobs/r001) |
| **A-36** | Resell Fees — ตั้งค่าค่าธรรมเนียมการขายมือสอง | A-01 (sidebar) | Admin จัดการค่าธรรมเนียม | — | — | R1-R12 | sample: ค่าธรรมเนียม 3% · ขั้นต่ำ 50 บาท · สูงสุด 5,000 บาท | [http://localhost:3000/resell/fees](http://localhost:3000/resell/fees) |
| **A-37** | Resell Lifecycle — timeline ขั้นตอนการขายมือสอง | A-01 (sidebar) | Admin ดู lifecycle R1-R12 | — | — | R1-R12 | แผนผัง flow ครบ 12 เคส R1-R12 ใน 1 หน้า | [http://localhost:3000/resell/lifecycle](http://localhost:3000/resell/lifecycle) |
| **A-38** | Resell Analytics — สถิติการขายมือสอง | A-01 (sidebar) | ดูสถิติ resell | — | — | R1-R12 | sample: total 156 listings · GMV 1.2M · dispute rate 1.2% | [http://localhost:3000/resell/analytics](http://localhost:3000/resell/analytics) |
| **A-39** | Parts Catalog — แค็ตตาล็อกอะไหล่ทั้งระบบ | A-01 (sidebar) | Admin ดู catalog อะไหล่ | A-39b Parts Detail | WeeeR: R-30 marketplace | P1-P12 | sample: 89 รายการ · หมวด: ปลั๊กไฟ/มอเตอร์/แผงวงจร · คงเหลือ avg 12 ชิ้น | [http://localhost:3000/parts](http://localhost:3000/parts) |
| **A-39b** | Parts Detail — รายละเอียดอะไหล่ | A-39 (catalog) | คลิกรายการอะไหล่ | A-39 (back) | — | P1-P12 | sample: ปลั๊กไฟ PANASONIC · สต็อก 8 ชิ้น · ราคา 150 บาท · ร้านขาย: ร้านชลประทาน | [http://localhost:3000/parts/part001](http://localhost:3000/parts/part001) |
| **A-40** | Parts Analytics — สถิติอะไหล่และการซื้อขาย | A-01 (sidebar) | ดูสถิติ parts | — | — | P1-P12 | sample: GMV parts 85K · top seller: ร้านชลประทาน · top item: มอเตอร์ | [http://localhost:3000/parts/analytics](http://localhost:3000/parts/analytics) |
| **A-41** | Parts Movements — ประวัติการเคลื่อนไหวอะไหล่ | A-01 (sidebar) | Admin ดู movements | A-41b Movement Detail | — | P1-P12 | sample: 120 รายการ · IN 67 · OUT 53 · วันนี้ 8 รายการ | [http://localhost:3000/parts/movements](http://localhost:3000/parts/movements) |
| **A-41b** | Parts Movement Detail — รายละเอียดการเคลื่อนไหว | A-41 (list) | คลิกรายการ movement | A-41 (back) | — | P1-P12 | sample: MOV-2024-045 · OUT 3 ชิ้น มอเตอร์ MITSUBISHI · งาน JOB-2024-001 | [http://localhost:3000/parts/movements/mov001](http://localhost:3000/parts/movements/mov001) |
| **A-42** | Users — รายการผู้ใช้ทั้งระบบ (WeeeU/WeeeR/WeeeT) | A-01 (sidebar) | Admin จัดการผู้ใช้ | A-43 WeeeR KYC | — | — | sample: 247 users · WeeeU 180 · WeeeR 45 · WeeeT 22 · filter by role | [http://localhost:3000/users](http://localhost:3000/users) |
| **A-43** | User WeeeR KYC — ดู KYC ของ WeeeR รายบุคคล | A-42 (users) | คลิก WeeeR user | A-42 (back) | — | KYC | sample: ร้านซ่อมดี · เอกสาร: บัตรประชาชน/ทะเบียนพาณิชย์ · approved | [http://localhost:3000/users/weeer/shop-001/kyc](http://localhost:3000/users/weeer/shop-001/kyc) |
| **A-44** | Points — จัดการพอยต์ทอง/เงิน ภาพรวม | A-01 (sidebar) | Admin ดูพอยต์ทั้งระบบ | A-45 Manual Adjust | — | — | sample: Gold circulation 2.5M · Silver 890K · Escrow locked 156K · D75 rounding | [http://localhost:3000/points](http://localhost:3000/points) |
| **A-45** | Points Manual Adjust — ปรับพอยต์ด้วยตนเอง (Admin) | A-44 (points) | Admin ต้องการปรับพอยต์ | A-44 (back หลังบันทึก) | — | — | sample: adjust WeeeU ID-123 · +500 Gold · หมายเหตุ: คืน escrow ผิดพลาด · บันทึก audit | [http://localhost:3000/points/manual-adjust](http://localhost:3000/points/manual-adjust) |
| **A-46** | Platform Balances — ยอดคงเหลือรวมของแพลตฟอร์ม | A-01 (sidebar) | Admin ดูยอดเงินระบบ | — | — | — | sample: Admin escrow pool 156K Gold · platform fee collected 45K | [http://localhost:3000/platform/balances](http://localhost:3000/platform/balances) |
| **A-47** | Platform Gold Management — จัดการ Gold Point ระบบ | A-01 (sidebar) | Admin จัดการ Gold | — | — | — | sample: total supply 5M Gold · circulating 2.5M · locked in escrow 156K | [http://localhost:3000/platform/gold-management](http://localhost:3000/platform/gold-management) |
| **A-48** | Platform Reconciliation — กระทบยอดระดับแพลตฟอร์ม | A-01 (sidebar) | Admin กระทบยอด | — | — | — | sample: last reconcile 2026-06-01 · variance 0.00 Gold · status: OK | [http://localhost:3000/platform/reconciliation](http://localhost:3000/platform/reconciliation) |
| **A-49** | Platform Silver — จัดการ Silver Point ระบบ | A-01 (sidebar) | Admin จัดการ Silver | — | — | — | sample: total Silver 890K · การใช้: discount 650K · คงเหลือ 240K | [http://localhost:3000/platform/silver](http://localhost:3000/platform/silver) |
| **A-50** | Platform Transactions — รายการธุรกรรมทั้งระบบ | A-01 (sidebar) | Admin ดูธุรกรรม | — | — | — | sample: 1,245 transactions ล่าสุด 30 วัน · escrow 45% · topup 30% · withdrawal 25% | [http://localhost:3000/platform/transactions](http://localhost:3000/platform/transactions) |
| **A-51** | Topup — รายการเติมพอยต์ทองทั้งระบบ | A-01 (sidebar) | Admin ดูการเติมพอยต์ | — | — | — | sample: วันนี้ 12 รายการ · 45,000 Gold · ช่องทาง: SCB 8 · KBank 4 | [http://localhost:3000/topup](http://localhost:3000/topup) |
| **A-52** | Withdrawal — รายการถอน/แลกพอยต์ทั้งระบบ | A-01 (sidebar) | Admin ดูการถอนพอยต์ | — | — | — | sample: pending 3 รายการ · 12,500 Gold · รอ Admin อนุมัติโอน | [http://localhost:3000/withdrawal](http://localhost:3000/withdrawal) |
| **A-53** | Transfers Deposits — รายการฝากเงินผ่านระบบ | A-01 (sidebar) | Admin ดูการฝาก | — | — | — | sample: 89 deposits ล่าสุด · avg 3,750 บาท · bank: SCB/KBANK/BBL | [http://localhost:3000/transfers/deposits](http://localhost:3000/transfers/deposits) |
| **A-54** | Transfers Withdrawals — รายการถอนเงินออกระบบ | A-01 (sidebar) | Admin ดูการถอน | — | — | — | sample: 34 withdrawals ล่าสุด · avg 5,200 บาท · ใช้เวลา avg 1.2 วันทำการ | [http://localhost:3000/transfers/withdrawals](http://localhost:3000/transfers/withdrawals) |
| **A-55** | Reconciliation — กระทบยอดธุรกรรม | A-01 (sidebar) | Admin กระทบยอด | — | — | — | sample: last run 2026-06-01 · matched 100% · 0 discrepancies | [http://localhost:3000/reconciliation](http://localhost:3000/reconciliation) |
| **A-56** | Config — ตั้งค่าพารามิเตอร์ระบบ | A-01 (sidebar) | Admin ตั้งค่าระบบ | — | — | — | sample: escrow rate 30% · platform fee 3% · OTP expiry 5 นาที · ตั้งค่า M5 hybrid | [http://localhost:3000/config](http://localhost:3000/config) |
| **A-57** | Reference Data — ข้อมูลอ้างอิง (อาการเสีย/หมวดหมู่) | A-01 (sidebar) | Admin จัดการข้อมูลอ้างอิง | — | — | — | sample: 156 อาการเสีย · 12 หมวดหมู่สินค้า · 8 ประเภทบริการ | [http://localhost:3000/reference](http://localhost:3000/reference) |
| **A-58** | Audit Log — บันทึกการกระทำของ Admin | A-01 (sidebar) | Admin ดู audit trail | — | — | — | sample: 245 entries ล่าสุด 7 วัน · KYC อนุมัติ 3 · Manual adjust 2 | [http://localhost:3000/audit](http://localhost:3000/audit) |
| **A-59** | System Storage — ดูพื้นที่จัดเก็บไฟล์ระบบ | A-01 (sidebar) | Admin ดูพื้นที่จัดเก็บ | — | — | — | sample: 45.2 GB used · รูปภาพ 38 GB · เอกสาร 7.2 GB · limit 100 GB | [http://localhost:3000/system/storage](http://localhost:3000/system/storage) |
| **A-60** | Pricing — ตั้งราคาค่าบริการซ่อม/บำรุง | A-01 (sidebar) | Admin ตั้งราคา | — | — | C1-C10, M1-M9 | sample: ค่าเดินทาง 150-500 บาท · ค่าวินิจฉัย 200 บาท · markup max 30% | [http://localhost:3000/pricing](http://localhost:3000/pricing) |
| **A-61** | Services — จัดการประเภทบริการ | A-01 (sidebar) | Admin จัดการบริการ | — | — | — | sample: 4 ประเภท: ซ่อม/บำรุง/ซาก/ขายต่อ · sub-types 24 รายการ | [http://localhost:3000/services](http://localhost:3000/services) |
| **A-62** | Promotions — จัดการโปรโมชั่นและส่วนลด | A-01 (sidebar) | Admin จัดการโปร | — | — | — | sample: 3 โปร active · "ซ่อมฟรีค่าวินิจฉัย" / "Silver 2x" / "แนะนำเพื่อน" | [http://localhost:3000/promotions](http://localhost:3000/promotions) |
| **A-63** | Products — แค็ตตาล็อกสินค้า (เครื่องไฟฟ้า) | A-01 (sidebar) | Admin จัดการสินค้า | — | — | — | sample: 234 สินค้า · TV 45 · ตู้เย็น 38 · เครื่องซัก 52 · แอร์ 29 | [http://localhost:3000/products](http://localhost:3000/products) |
| **A-64** | Content — จัดการเนื้อหา CMS | A-01 (sidebar) | Admin จัดการ content | A-64c New · A-64b Edit | — | — | sample: 12 บทความ · 8 published · 4 draft | [http://localhost:3000/content](http://localhost:3000/content) |
| **A-64c** | Content New — สร้างเนื้อหาใหม่ | A-64 (list) | คลิกสร้างใหม่ | A-64 (back หลังบันทึก) | — | — | form: title/body/category/publish date | [http://localhost:3000/content/new](http://localhost:3000/content/new) |
| **A-64b** | Content Edit — แก้ไขเนื้อหา | A-64 (list) | คลิกแก้ไขบทความ | A-64 (back หลังบันทึก) | — | — | sample: แก้ไข "วิธีดูแลเครื่องซักผ้า" | [http://localhost:3000/content/article-001](http://localhost:3000/content/article-001) |
| **A-65** | Articles — รายการบทความ/ข่าวสาร | A-01 (sidebar) | Admin ดูบทความ | — | — | — | sample: 24 บทความ · views avg 250/บทความ | [http://localhost:3000/articles](http://localhost:3000/articles) |
| **A-66** | Contact Inbox — กล่องข้อความจากผู้ติดต่อ | A-01 (sidebar) | Admin รับข้อความ | A-66b Message Detail | — | — | sample: 5 ข้อความใหม่ · "สอบถามค่าซ่อม" · "แนะนำบริการ" | [http://localhost:3000/contact](http://localhost:3000/contact) |
| **A-66b** | Contact Message — อ่านข้อความ+ตอบกลับ | A-66 (inbox) | คลิกข้อความ | A-66 (back) | — | — | sample: สมชาย ก. · อีเมล: somchai@mail.com · "สอบถามค่าซ่อมทีวี" | [http://localhost:3000/contact/msg-001](http://localhost:3000/contact/msg-001) |
| **A-67** | Contact Info — ข้อมูลการติดต่อของแพลตฟอร์ม | A-01 (sidebar) | Admin แก้ข้อมูลติดต่อ | — | — | — | sample: โทร 02-xxx-xxxx · อีเมล info@app3r.com · LINE: @app3r | [http://localhost:3000/contact/info](http://localhost:3000/contact/info) |
| **A-68** | Testimonials — รายการรีวิวจากผู้ใช้ | A-01 (sidebar) | Admin จัดการ testimonials | A-68c New · A-68b Edit | — | — | sample: 18 testimonials · 5 ดาว 12 · 4 ดาว 6 | [http://localhost:3000/testimonials](http://localhost:3000/testimonials) |
| **A-68c** | Testimonial New — สร้าง testimonial ใหม่ | A-68 (list) | คลิกสร้างใหม่ | A-68 (back) | — | — | form: ชื่อ/เนื้อหา/คะแนน/รูปภาพ | [http://localhost:3000/testimonials/new](http://localhost:3000/testimonials/new) |
| **A-68b** | Testimonial Edit — แก้ไข testimonial | A-68 (list) | คลิกแก้ไข | A-68 (back) | — | — | sample: แก้คำรีวิว "บริการดีมาก..." | [http://localhost:3000/testimonials/t001](http://localhost:3000/testimonials/t001) |
| **A-69** | Ads — จัดการโฆษณาในแพลตฟอร์ม | A-01 (sidebar) | Admin จัดการโฆษณา | — | — | — | sample: 3 ads active · banner top / sidebar / popup · clicks 1,234 | [http://localhost:3000/ads](http://localhost:3000/ads) |
| **A-70** | Notify Download — ดาวน์โหลดรายงานการแจ้งเตือน | A-01 (sidebar) | Admin ดาวน์โหลด report | — | — | — | sample: export CSV · ช่วง: วันนี้/สัปดาห์/เดือน · ประเภท: push/SMS/email | [http://localhost:3000/notifications/download](http://localhost:3000/notifications/download) |
| **A-71** | Listings Index — ดัชนีประกาศทั้งระบบ | A-01 (sidebar) | Admin ดูประกาศรวม | A-12 Resell · A-33 Scrap | — | R, S | summary: resell 24 · scrap 15 · รวม 39 · filter หมวดหมู่ | [http://localhost:3000/listings](http://localhost:3000/listings) |
| **A-72** | Module Template — template จอ module ทั่วไป | A-01 (sidebar) | Admin เข้า module ทั่วไป | — | — | — | dynamic: `/modules/[module]` · ใช้เป็น fallback สำหรับโมดูลใหม่ | [http://localhost:3000/modules/example](http://localhost:3000/modules/example) |
| **A-73** | Login — หน้าเข้าสู่ระบบ Admin | — | ยังไม่ได้เข้าสู่ระบบ / session หมดอายุ | A-01 (เข้าสู่ระบบสำเร็จ) | — | — | จอแรกของแอพฯ · ห้ามระบุ origin · form: email/password · redirect → / | [http://localhost:3000/login](http://localhost:3000/login) |

---

## R2 — URL Fixes ที่แก้ในไฟล์นี้

| Screen | Old URL (Word เก่า) | URL จริง (code) | หมายเหตุ |
|--------|---------------------|----------------|---------|
| A-01 | `/dashboard` | `/` | dashboard route จริงคือ root `/` |
| A-17 | `/parts/disputes` | `/disputes` | top-level route ไม่ใช่ `/parts/disputes` |
| A-18 | `/parts/disputes/[id]` | `/disputes/[id]` | ตามจริง |

## R3 — Cross-App (จอเดียว ปรากฏหลายไฟล์)

จอ Admin ที่ปรากฏใน module-file ด้วย (canonical ID = A-xx):
- A-05 (Repair C9 intervene) → ปรากฏใน module-file ซ่อม (Repair)
- A-10 (Scrap S11 ruling) → ปรากฏใน module-file ซาก (Scrap)
- A-14 (Resell R9 ruling) → ปรากฏใน module-file ขายต่อ (Resell)
- A-18 (Parts P7 dispute) → ปรากฏใน module-file อะไหล่ (Parts)
- A-20 (KYC Detail) → ปรากฏใน module-file ของโมดูลที่ต้องการ KYC

## R4 — Route-ID Resolution (param → base)

| Route | Param family | Map to | หมายเหตุ |
|-------|-------------|--------|---------|
| `/repair/jobs/[id]` | `/repair/jobs/c001` | A-03 | ไม่สร้าง ID ใหม่ |
| `/repair/jobs/[id]/manual-override` | — | A-03c | variant ของ A-03 |
| `/maintain/jobs/[id]` | `/maintain/jobs/m001` | A-07 | |
| `/scrap/jobs/[id]` | `/scrap/jobs/s001` | A-08b | variant b |
| `/scrap/disputes/[id]` | — | A-10 | |
| `/scrap/certificates/[id]` | — | A-11b | variant b |
| `/resell/listings/[id]` | — | A-12b | variant b |
| `/resell/disputes/[id]` | — | A-14 | |
| `/resell/jobs/[id]` | — | A-35b | variant b |
| `/parts/orders/[id]` | — | A-16 | |
| `/parts/[id]` | — | A-39b | variant b |
| `/parts/movements/[id]` | — | A-41b | variant b |
| `/disputes/[id]` | `/disputes/p001` | A-18 | |
| `/kyc/[id]` | `/kyc/shop-001` | A-20 | |
| `/contact/[id]` | — | A-66b | variant b |
| `/content/[id]` | — | A-64b | variant b |
| `/testimonials/[id]` | — | A-68b | variant b |
| `/users/weeer/[id]/kyc` | — | A-43 | deep-link KYC |
| `/repair/parcel/[id]` | — | A-22b | variant b |
| `/repair/pickup/[id]` | — | A-25b | variant b |
| `/repair/walk-in/[id]` | — | A-28b | variant b |
| `/scrap/listings/[id]` | — | A-33b | variant b |
| `/modules/[module]` | — | A-72 | |

---

*Admin app-file · สร้างโดย App3R-Admin · HUB Gen 52 P2+P3 · 2026-06-05*
*ใช้คู่กับ: docs/phase3-screen-id-table.md (ตารางรวม 5 แอพฯ) + module-files (5 โมดูล)*
