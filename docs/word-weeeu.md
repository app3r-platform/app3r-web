# 📋 WeeeU — App-file Word (Acceptance Checklist Extension)
> **P3 app-file** · HUB Gen 52 CMD → WeeeU · 2026-06-05
> base `da0e3a9` · branch `feature/weeeu-p2p3`
>
> **การใช้งาน:** คลิกลิงก์คอลัมน์ 9 "เปิด mockup" เพื่อดูจอจริงที่ localhost:3002
> ไฟล์นี้เป็น **extension** ต่อจาก `Acceptance-Checklist_WeeeU.docx` (จอ U-01..U-45, U-50, U-55, U-57 อยู่ใน .docx แล้ว)
>
> **หมายเหตุ R4:** `/welcome` → U-67, `/forgot-password` → U-68 (จอ distinct · mint ใหม่ · รายงาน HUB)

---

## วิธีอ่านตาราง (9 คอลัมน์)

| คอลัมน์ | ความหมาย |
|---------|---------|
| 1 รหัสจอ | Screen ID (ตรงกับ ScreenBadge + DevNav) |
| 2 ชื่อจอ / หน้าที่ | ชื่อหน้าจอและฟังก์ชันหลัก |
| 3 มาจาก | จอ + ID ที่นำทางมายังจอนี้ |
| 4 เงื่อนไข/เคส | สถานการณ์ที่ผู้ใช้มาถึงจอนี้ |
| 5 ไปต่อ | จอ + ID ที่ออกไปได้ |
| 6 แอพฯ/บทบาทที่เห็น | แอพฯอื่นที่ active ณ จังหวะเดียวกัน (cross-app §8) |
| 7 เคส | เคสที่เกี่ยว (C=Repair / M=Maintain / R=Resell / S=Scrap / P=Parts) |
| 8 หมายเหตุ | sample data / BE จังหวะ2 / ruling |
| 9 เปิด mockup | localhost:3002`<route>` — คลิกดูจอจริง |

---

## 📱 WeeeU — จอใหม่ (R1: U-46..U-68 · ต่อจาก .docx)

### หมวด Wallet & Transaction

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯ/บทบาทที่เห็น | เคส | หมายเหตุ | เปิด mockup |
|--------|----------------|-------|------------|-------|-----------------|-----|---------|------------|
| **U-46** | รายละเอียดธุรกรรม (Transaction Detail) | U-56 ประวัติ wallet · U-37 ประวัติทั้งหมด | ผู้ใช้กดการ์ดธุรกรรมใดๆ | U-56 กลับประวัติ | — | R/S/C/M ทุกเคสที่มีธุรกรรม | sample: ธุรกรรม TX-2026050001 · amount: +2,500 Gold · type: escrow-release | [localhost:3002/transactions/t001](http://localhost:3002/transactions/t001) |
| **U-56** | ประวัติ Wallet (Wallet History) | U-57 หน้า wallet | กดดู "ประวัติการเงิน" | U-46 ดูธุรกรรม detail · U-57 กลับ | — | ทุกเคส | sample: รายการ 10 ล่าสุด · filter: ทอง/เงิน/ทั้งหมด | [localhost:3002/wallet/history](http://localhost:3002/wallet/history) |

---

### หมวด Sell (ขายมือสอง)

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯ/บทบาทที่เห็น | เคส | หมายเหตุ | เปิด mockup |
|--------|----------------|-------|------------|-------|-----------------|-----|---------|------------|
| **U-47** | หน้าหลักขาย (Sell Home) | U-01 dashboard · tab "ซื้อ-ขาย" · U-40 หลังลงประกาศ | entry point สำหรับ seller | U-47a ลงประกาศใหม่ · U-17 ดูทุกประกาศ · U-47c ดู detail | — | R2-R12 | hub สำหรับ seller flow | [localhost:3002/sell](http://localhost:3002/sell) |
| **U-47a** | ลงประกาศขาย (Sell New) | U-47 · U-17 (ปุ่มลงประกาศ) | สร้างประกาศขายใหม่ | U-40 ลงประกาศสำเร็จ | WeeeR: R-15 ดูประกาศ (หลังอนุมัติ) | R2 | ฟอร์ม: ชื่อสินค้า/ราคา/สภาพ/รูป 1-5 · sample: "แอร์ Daikin 12000 BTU" 4,500฿ | [localhost:3002/sell/new](http://localhost:3002/sell/new) |
| **U-47b** | แก้ไขประกาศ (Sell Edit) | U-47c · U-20 (ปุ่มแก้ไข) | ผู้ขายต้องการแก้ไขข้อมูล | U-47c บันทึก → กลับ detail | — | R2 | ฟอร์มเดียวกับ U-47a · pre-fill ข้อมูลเดิม | [localhost:3002/sell/r001/edit](http://localhost:3002/sell/r001/edit) |
| **U-47c** | รายละเอียดประกาศของฉัน (My Listing Detail) | U-17 · U-47 | ดูประกาศที่ตัวเองสร้าง | U-47b แก้ไข · U-18 ดูข้อเสนอ | WeeeR: R-16 RESELL-LISTING-DETAIL | R2-R12 | sample: listing r001 · status: รอผู้ซื้อ · view: 42 | [localhost:3002/sell/r001](http://localhost:3002/sell/r001) |

---

### หมวด Signup Flow

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯ/บทบาทที่เห็น | เคส | หมายเหตุ | เปิด mockup |
|--------|----------------|-------|------------|-------|-----------------|-----|---------|------------|
| **U-48** | เลือกวิธีสมัคร (Signup Method) | U-67 กด "สมัครสมาชิก" | ผู้ใช้ใหม่ยังไม่มีบัญชี | U-60 กรอก email | — | — | 2 ตัวเลือก: Email / โซเชียล (mock) | [localhost:3002/signup/method](http://localhost:3002/signup/method) |
| **U-60** | กรอก Email (Signup Email) | U-48 | ขั้นตอนที่ 1/5: กรอก email | U-61 ข้อมูลส่วนตัว | — | — | validate email format · ตรวจซ้ำ BE | [localhost:3002/signup/email](http://localhost:3002/signup/email) |
| **U-61** | ข้อมูลส่วนตัว (Signup Personal) | U-60 | ขั้นตอนที่ 2/5: ชื่อ/นามสกุล/วันเกิด/เพศ | U-62 ที่อยู่ | — | — | ชื่อ-นามสกุล · วันเกิด · เพศ | [localhost:3002/signup/personal](http://localhost:3002/signup/personal) |
| **U-62** | ที่อยู่ (Signup Address) | U-61 | ขั้นตอนที่ 3/5: ที่อยู่จัดส่ง | U-63 ยืนยัน OTP | — | — | บ้านเลขที่ / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์ | [localhost:3002/signup/address](http://localhost:3002/signup/address) |
| **U-63** | ยืนยัน OTP (Signup OTP) | U-62 | ขั้นตอนที่ 4/5: OTP ส่งไป SMS/email | U-64 ยืนยัน email · U-65 ผิด 3 ครั้ง → suspended | — | — | mock OTP: 123456 · 5 นาที · max 5 ส่ง/ชม | [localhost:3002/signup/otp](http://localhost:3002/signup/otp) |
| **U-64** | ยืนยัน Email (Signup Verify Email) | U-63 | ขั้นตอนที่ 5/5: คลิก link ใน email | U-01 dashboard | — | — | รอ email · resend ได้ · BE จังหวะ2 | [localhost:3002/signup/verify-email](http://localhost:3002/signup/verify-email) |

---

### หมวด Settings & Account

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯ/บทบาทที่เห็น | เคส | หมายเหตุ | เปิด mockup |
|--------|----------------|-------|------------|-------|-----------------|-----|---------|------------|
| **U-49** | ความปลอดภัย (Settings Security) | U-35 profile | ผู้ใช้ต้องการเปลี่ยน password / 2FA | U-35 บันทึก → กลับ profile | — | — | เปลี่ยน password · ตั้ง PIN · (2FA = BE จังหวะ2) | [localhost:3002/settings/security](http://localhost:3002/settings/security) |
| **U-66** | จัดการข้อมูลส่วนตัว (User Data Manage) | U-35 profile | ผู้ใช้ต้องการแก้ข้อมูล / ลบบัญชี | U-35 บันทึก → กลับ profile | — | — | แก้ชื่อ/นามสกุล/เบอร์/ที่อยู่ · ลบบัญชี (confirm modal) | [localhost:3002/settings/account](http://localhost:3002/settings/account) |

---

### หมวด Modules (คู่มือ)

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯ/บทบาทที่เห็น | เคส | หมายเหตุ | เปิด mockup |
|--------|----------------|-------|------------|-------|-----------------|-----|---------|------------|
| **U-51** | คู่มือโมดูล (Module Guide) | U-01 dashboard (module guide link) | ผู้ใช้กดดูคู่มือการใช้งาน | U-01 กลับ dashboard | — | ทุกโมดูล | [module] = repair / maintain / resell / scrap | [localhost:3002/modules/repair](http://localhost:3002/modules/repair) |

---

### หมวด Repair — Sub-screens

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯ/บทบาทที่เห็น | เคส | หมายเหตุ | เปิด mockup |
|--------|----------------|-------|------------|-------|-----------------|-----|---------|------------|
| **U-52a** | ตัดสินใจ B1 (Repair B1-2 Decision) | U-06 progress (C2 B1) | ช่างต้องการรายงาน B1 decision | U-06 หลังตัดสินใจ | WeeeR: R-11 | C2 | ลูกค้าตัดสินใจ: ซ่อม B1 ต่อ / ยุติ | [localhost:3002/repair/c001/decision/b1-2](http://localhost:3002/repair/c001/decision/b1-2) |
| **U-52b** | ตัดสินใจ B2 (Repair B2-2 Decision) | U-06 progress (C2 B2) | ช่างต้องการรายงาน B2 decision | U-06 หลังตัดสินใจ | WeeeR: R-11 | C2 | ลูกค้าตัดสินใจ: ซ่อม B2 ต่อ / ยุติ | [localhost:3002/repair/c001/decision/b2-2](http://localhost:3002/repair/c001/decision/b2-2) |
| **U-53a** | รับพัสดุ (Repair Parcel Receipt) | U-06 progress (C3 parcel) | ลูกค้าส่งเครื่องมาทาง EMS แล้ว | U-06 ยืนยันรับ | WeeeR: R-07 REPAIR-PARCEL-QUEUE | C3 | กรอกเลขพัสดุ · ถ่ายรูปสภาพ | [localhost:3002/repair/c001/parcel-receipt](http://localhost:3002/repair/c001/parcel-receipt) |
| **U-53b** | รับเครื่อง Pickup (Repair Pickup Receipt) | U-06 progress (C2 pickup) | ช่างไปรับเครื่องที่บ้าน | U-06 ยืนยันรับ | WeeeR: R-11 | C2 | ลายเซ็นลูกค้า + ถ่ายรูปเครื่อง (mock) | [localhost:3002/repair/c001/pickup-receipt](http://localhost:3002/repair/c001/pickup-receipt) |
| **U-53c** | จัดส่งคืน (Repair Ship Out) | U-06 (ซ่อมเสร็จ → ส่งคืน) | ส่งเครื่องคืนลูกค้าทาง EMS | U-09d delivery-receipt | WeeeR: R-11 | C3 | กรอกเลขพัสดุขาส่ง + carrier | [localhost:3002/repair/c001/ship-out](http://localhost:3002/repair/c001/ship-out) |
| **U-53d** | รายละเอียดการจัดส่ง (Repair Shipping Details) | U-06 · U-53c | ดูสถานะการจัดส่ง | U-06 กลับ | — | C3 | เลขพัสดุ / carrier / สถานะ (mock) | [localhost:3002/repair/c001/shipping-details](http://localhost:3002/repair/c001/shipping-details) |
| **U-53e** | ลูกค้ารับเครื่องคืน Walk-in (Walk-in Receipt) | U-06 (walk-in ซ่อมเสร็จ) | ลูกค้ามารับเครื่องที่ร้าน | U-09 review | WeeeR: R-06 | C1 | ลายเซ็น + ยืนยันรับเครื่อง | [localhost:3002/repair/c001/walk-in-receipt](http://localhost:3002/repair/c001/walk-in-receipt) |

---

### หมวด Maintain — Mockup Scenarios

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯ/บทบาทที่เห็น | เคส | หมายเหตุ | เปิด mockup |
|--------|----------------|-------|------------|-------|-----------------|-----|---------|------------|
| **U-54a** | หมดอายุข้อเสนอ (Maintain M2 Expired) | U-16 job-detail (M2) | ไม่มีร้านรับงานภายในเวลาที่กำหนด → หมดอายุ | U-11 จองใหม่ | — | M2 | Gold-lock ที่พักไว้ถูกปลดคืนอัตโนมัติ | [localhost:3002/maintain/jobs/m001/mockup/m2-expired](http://localhost:3002/maintain/jobs/m001/mockup/m2-expired) |
| **U-54b** | WeeeR ถอนตัว (Maintain M6 WeeeR Withdrew) | U-16 job-detail (M6) | ร้านถอนตัวหลังรับงานแล้ว | U-11 จองใหม่ | WeeeR: R-14 | M6 | แจ้งลูกค้า + ปลด Gold | [localhost:3002/maintain/jobs/m001/mockup/m6-weeer-withdrew](http://localhost:3002/maintain/jobs/m001/mockup/m6-weeer-withdrew) |
| **U-54c** | ช่างไม่มาตามนัด (Maintain M7 No-show) | U-16 job-detail (M7) | ช่างไม่มาตามนัด → ลูกค้าร้องเรียน | U-11 จองใหม่ | Admin: A-07 | M7 | ค่าชดเชย mock · แจ้ง admin | [localhost:3002/maintain/jobs/m001/mockup/m7-noshow](http://localhost:3002/maintain/jobs/m001/mockup/m7-noshow) |
| **U-54d** | ยุติกลางคันระหว่างล้าง (M9 Cancel In-progress) | U-16 job-detail (M9 กลางคัน) | ยุติงานระหว่างดำเนินการ | U-12 กลับรายการ | WeeeR: R-14 | M9 | คำนวณ settle ตาม phase: ค่าเดินทาง + แรงงาน % | [localhost:3002/maintain/jobs/m001/mockup/m9-cancel-inprogress](http://localhost:3002/maintain/jobs/m001/mockup/m9-cancel-inprogress) |

---

### หมวด Auth Flow

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯ/บทบาทที่เห็น | เคส | หมายเหตุ | เปิด mockup |
|--------|----------------|-------|------------|-------|-----------------|-----|---------|------------|
| **U-59** | เข้าสู่ระบบ (Login) | U-67 welcome · redirect จาก protected routes | ผู้ใช้มีบัญชีแล้ว | U-01 login สำเร็จ · U-68 ลืมรหัสผ่าน | — | — | mock: สมชาย@ubru.ac.th / 1234Abcd | [localhost:3002/login](http://localhost:3002/login) |
| **U-65** | บัญชีถูกระงับ (User Suspended) | U-22 (OTP ผิด 3 ครั้ง) · U-63 (OTP ผิด 3 ครั้ง) | OTP ผิดเกินกำหนด | U-67 welcome (ติดต่อ support) | Admin: หน้าจัดการ ban | — | reason param: otp / fraud / admin · ลิงก์ support | [localhost:3002/suspended?reason=otp&from=marketplace](http://localhost:3002/suspended?reason=otp&from=marketplace) |

---

### หมวด Auth Flow — U-58 (Retired)

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯ/บทบาทที่เห็น | เคส | หมายเหตุ | เปิด mockup |
|--------|----------------|-------|------------|-------|-----------------|-----|---------|------------|
| ~~U-58~~ | ~~(Retired — ไม่ใช้)~~ | — | — | — | — | — | Gen 109 ruling: `/maintain/jobs/[id]/withdraw` = state ของ U-16 ไม่ใช่จอใหม่ → U-58 เว้นว่าง | — |

---

### หมวด Auth Flow — R4 Mint IDs ใหม่

| รหัสจอ | ชื่อจอ / หน้าที่ | มาจาก | เงื่อนไข/เคส | ไปต่อ | แอพฯ/บทบาทที่เห็น | เคส | หมายเหตุ | เปิด mockup |
|--------|----------------|-------|------------|-------|-----------------|-----|---------|------------|
| **U-67** | หน้าต้อนรับ (Welcome Landing) | redirect `/` (root) · ยังไม่ login | Entry point สำหรับ new visitor | U-59 login · U-48 สมัครใหม่ | — | — | **R4 mint ใหม่** · ไม่มี ID ใน registry เดิม → mint U-67 · รายงาน HUB | [localhost:3002/welcome](http://localhost:3002/welcome) |
| **U-68** | ลืมรหัสผ่าน (Forgot Password) | U-59 login | ผู้ใช้กด "ลืมรหัสผ่าน" | U-59 reset สำเร็จ → login | — | — | **R4 mint ใหม่** · 3 phase: email/OTP/new-password · mock OTP: 123456 | [localhost:3002/forgot-password](http://localhost:3002/forgot-password) |

---

## 📊 R4 Mint Report (รายงาน HUB)

| ID ใหม่ | Route | เหตุผล |
|--------|-------|--------|
| **U-67** | `/welcome` | จอ distinct (landing page ก่อน login) · ไม่ใช่ param-variant · ไม่มีใน registry เดิม |
| **U-68** | `/forgot-password` | จอ distinct (reset password 3-phase flow) · ไม่ใช่ param-variant · ไม่มีใน registry เดิม |

> **การดำเนินการ:** เพิ่มใน `ScreenBadge.tsx` SCREEN_MAP แล้ว (commit นี้) · HUB sync registry + Word ทุกที่ที่ใช้

---

## ✅ Self-audit P3

| รายการ | สถานะ |
|--------|-------|
| ครบ 18 ID ตาม CMD (U-46..U-66 ยกเว้น U-50/55/57 ที่อยู่ใน .docx แล้ว) | ✅ |
| + U-67 / U-68 (R4 mint) | ✅ |
| 9 คอลัมน์ครบทุกแถว | ✅ |
| ลิงก์ localhost:3002 ครบทุกจอ | ✅ |
| cross-app §8 ระบุ แอพฯ+route | ✅ |
| รหัสตรง ScreenBadge.tsx | ✅ |
| U-58 retired ระบุเหตุผล (Gen 109 ruling) | ✅ |
| R4 report HUB section ครบ | ✅ |
