# Phase 3 Review Checklist — App3R 5 แอปฯ
> Advisor Gen 94 CMD 36c813ec-7277-8179 · HUB Gen 33 · 2026-05-26
> วิธีใช้: เปิด browser ตามลำดับ URL · tick ☐ ผ่าน / ☐ แก้ · ระบุ Comment · บล็อก = ✋ ต้องแก้ก่อน
> **เปิดใช้งาน:** `NEXT_PUBLIC_DEV_NAV=true` ใน .env ทุก app

---

## 🏠 Website — Port 3004 (http://localhost:3004)

| # | Screen ID | URL | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|--------|------|---------|----------|
| W-01 | HOME | / | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-02 | ABOUT | /about | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-03 | CONTACT | /contact | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-04 | DOWNLOAD | /download | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-05 | FAQ | /faq | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-06 | LISTINGS-HUB | /listings | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-07 | LISTINGS-REPAIR | /listings/repair | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-08 | LISTING-REPAIR-DETAIL | /listings/repair/r001 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-09 | LISTINGS-MAINTAIN | /listings/maintain | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-10 | LISTING-MAINTAIN-DETAIL | /listings/maintain/m001 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-11 | LISTINGS-RESELL | /listings/resell | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-12 | LISTING-RESELL-DETAIL | /listings/resell/r001 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-13 | LISTINGS-SCRAP | /listings/scrap | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-14 | LISTING-SCRAP-DETAIL | /listings/scrap/s001 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-15 | ARTICLES | /articles | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| W-18 | REGISTER-WEEER | /register/weeer | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |

---

## 👤 WeeeU — Port 3002 (http://localhost:3002)

### Repair Flow (C1-C10)
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| U-02 | REPAIR-HOME | /repair | — | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-03 | REPAIR-CREATE | /repair/new | C1-C10 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-04 | REPAIR-DETAIL | /repair/c001 | C1-C10 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-05 | REPAIR-OFFERS | /repair/c001/offers | C1-C10 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-06 | REPAIR-PROGRESS | /repair/c001/progress | C1-C10 | ☐ | ☐ | C7 abort modal ด้วย | ☐บล็อก ☐ควรแก้ ☐nice |
| U-07 | REPAIR-C4-SCRAP | /repair/c001/scrap-offer | C4, S12 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-08 | REPAIR-C5-FEE | /repair/c001/fee-settle | C5 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-09 | REPAIR-REVIEW | /repair/c001/review | C1 end | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |

### Maintain Flow (M1-M9)
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| U-11 | MAINTAIN-BOOK | /maintain/book | M1 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-10 | MAINTAIN-BOOK-CONFIRM | /maintain/book/confirm | M1 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-12 | MAINTAIN-JOBS | /maintain/jobs | M1-M9 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-16 | MAINTAIN-JOB-DETAIL | /maintain/jobs/m001 | M1-M9 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-13 | MAINTAIN-M3 | /maintain/jobs/m001/reschedule | M3 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-14 | MAINTAIN-M4 | /maintain/jobs/m001/extra-cost | M4 | ☐ | ☐ | A/B approve/reject | ☐บล็อก ☐ควรแก้ ☐nice |
| U-15 | MAINTAIN-M9-CANCEL | /maintain/jobs/m001/cancel | M9 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |

### Resell — Seller Flow (R2-R12)
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| U-17 | RESELL-MY-LISTINGS | /listings | R2 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-20 | RESELL-LISTING-DETAIL | /listings/r001 | R2-R12 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-18 | RESELL-OFFERS-RCV | /listings/r001/offers | R3-R6 | ☐ | ☐ | ดูข้อเสนอ 3 รายการ | ☐บล็อก ☐ควรแก้ ☐nice |
| U-19 | RESELL-R7-CONFIRM | /listings/r001/confirm | R5,R7,R12 | ☐ | ☐ | Branch A/B/C | ☐บล็อก ☐ควรแก้ ☐nice |

### Resell — Buyer C2C (Pair 3)
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| U-21 | RESELL-C2C-MARKET | /marketplace | R3 | ☐ | ☐ | Grid 6 items + Picsum | ☐บล็อก ☐ควรแก้ ☐nice |
| U-23 | RESELL-PAIR3-DETAIL | /marketplace/r001 | R3 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-22 | RESELL-PAIR3-OFFER | /marketplace/r001/offer | R3 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-27 | RESELL-PURCHASE | /purchases/r001 | R1-R3 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-24 | RESELL-R1-INSPECT | /purchases/r001/inspect | R1, R8 | ☐ | ☐ | Checklist 4 items | ☐บล็อก ☐ควรแก้ ☐nice |
| U-25 | RESELL-R1-COMPLETE | /purchases/r001/complete | R1 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-26 | RESELL-R8-DISPUTE | /purchases/r001/dispute | R8 | ☐ | ☐ | Radio reason form | ☐บล็อก ☐ควรแก้ ☐nice |

### Scrap Flow (S1-S12)
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| U-29 | SCRAP-CREATE | /scrap/new | S1-S5 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-33 | SCRAP-DETAIL | /scrap/s001 | S1-S10 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-30 | SCRAP-S1-OFFERS | /scrap/s001/offers | S1,S2,S5 | ☐ | ☐ | 3 offers (2 buy+1 free) | ☐บล็อก ☐ควรแก้ ☐nice |
| U-31 | SCRAP-S1-CONFIRM | /scrap/s001/confirm | S1, S2 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| U-32 | SCRAP-S4-CERT | /scrap/s001/certificate | S4 | ☐ | ☐ | E-Waste cert card | ☐บล็อก ☐ควรแก้ ☐nice |

---

## 🏪 WeeeR — Port 3001 (http://localhost:3001)

### Repair Flow (C1-C10)
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| R-02 | REPAIR-ANNOUNCE-LIST | /repair/announcements | C1-C10 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-04 | REPAIR-ANNOUNCE-DETAIL | /repair/announcements/c001 | C1-C10 | ☐ | ☐ | Full detail + offer btn | ☐บล็อก ☐ควรแก้ ☐nice |
| R-05 | REPAIR-WALKIN-QUEUE | /repair/walk-in/queue | C1 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-06 | REPAIR-C1-WALKIN | /repair/walk-in/c001 | C1 | ☐ | ☐ | Staff assignment | ☐บล็อก ☐ควรแก้ ☐nice |
| R-07 | REPAIR-PARCEL-QUEUE | /repair/parcel/queue | C3 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-08 | REPAIR-C3-PARCEL | /repair/parcel/c001 | C3 | ☐ | ☐ | Tracking info | ☐บล็อก ☐ควรแก้ ☐nice |
| R-09 | REPAIR-JOBS | /repair/jobs | C1-C10 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-11 | REPAIR-JOB-DETAIL | /repair/jobs/c001 | C1-C10 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-10 | REPAIR-ASSIGN-TECH | /repair/jobs/c001/assign | C1-C4 | ☐ | ☐ | 3 staff radio cards | ☐บล็อก ☐ควรแก้ ☐nice |

### Maintain Flow (M1-M9)
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| R-12 | MAINTAIN-JOBS | /maintain/jobs | M1-M9 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-14 | MAINTAIN-JOB-DETAIL | /maintain/jobs/m001 | M1-M9 | ☐ | ☐ | M6 branch | ☐บล็อก ☐ควรแก้ ☐nice |

### Resell (R1-R12)
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| R-15 | RESELL-LISTINGS | /resell/listings | R2-R12 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-17 | RESELL-C2C-LIST | /resell/marketplace | R3 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-19 | RESELL-C2C-DETAIL | /resell/marketplace/r001 | R3 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-18 | RESELL-PAIR3-OFFER | /resell/marketplace/r001/offer | R3 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-20 | RESELL-PURCHASES | /resell/purchases | R1-R3 | ☐ | ☐ | Filter tabs | ☐บล็อก ☐ควรแก้ ☐nice |
| R-23 | RESELL-PURCHASE-DETAIL | /resell/purchases/r001 | R1-R3 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-21 | RESELL-R1-INSPECT | /resell/purchases/r001/inspect | R1, R8 | ☐ | ☐ | Checklist 4 items | ☐บล็อก ☐ควรแก้ ☐nice |
| R-22 | RESELL-R8-DISPUTE | /resell/purchases/r001/dispute | R8 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |

### Scrap (S1-S12)
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| R-24 | SCRAP-ANNOUNCE-LIST | /scrap/announcements | S1-S5 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-26 | SCRAP-ANNOUNCE-DETAIL | /scrap/announcements/s001 | S1-S5 | ☐ | ☐ | Offer/free-drop btns | ☐บล็อก ☐ควรแก้ ☐nice |
| R-27 | SCRAP-JOBS | /scrap/jobs | S1-S12 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-28 | SCRAP-JOB-DETAIL | /scrap/jobs/s001 | S1-S12 | ☐ | ☐ | S1-S4 decision branches | ☐บล็อก ☐ควรแก้ ☐nice |

### Parts (P1-P12)
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| R-29 | PARTS-MY-LISTINGS | /parts/my-listings | P1 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-30 | PARTS-MARKETPLACE | /parts/marketplace | P2, P3 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-31 | PARTS-ORDERS | /parts/orders | P5, P6 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-32 | PARTS-ORDER-DETAIL | /parts/orders/p001 | P5, P6 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-33 | PARTS-MY-ORDERS | /parts/my-orders | P4-P7 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| R-34 | PARTS-BUYER-ORDER | /parts/my-orders/p001 | P4-P7 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |

---

## 🔧 WeeeT — Port 3003 (http://localhost:3003)

### All Modules (Repair/Maintain/Scrap)
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| T-01 | JOBS-LIST | /jobs | All | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| T-11 | JOB-DETAIL | /jobs/c001 | C1-C10 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| T-02 | REPAIR-DIAGNOSE | /jobs/c001/diagnose | C1-C4 | ☐ | ☐ | 4 branch buttons | ☐บล็อก ☐ควรแก้ ☐nice |
| T-03 | REPAIR-C1-COMPLETE | /jobs/c001/repair | C1 | ☐ | ☐ | Notes + OTP form | ☐บล็อก ☐ควรแก้ ☐nice |
| T-05 | REPAIR-C3-SCHEDULE | /jobs/c001/schedule | C3 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| T-06 | REPAIR-C4-SCRAP | /jobs/c001/scrap-offer | C4, S12 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| T-08 | MAINTAIN-INSPECT | /jobs/m001/inspect | M4, M7 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| T-09 | MAINTAIN-M4-ISSUE | /jobs/m001/issue | M4 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| T-04 | SCRAP-S6-PICKUP | /jobs/s001/pickup | S6, S9 | ☐ | ☐ | GPS + condition check | ☐บล็อก ☐ควรแก้ ☐nice |
| T-10 | SCRAP-S8-MISMATCH | /jobs/s001/mismatch | S8 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |

---

## ⚙️ Admin — Port 3000 (http://localhost:3000)

### Repair
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| A-02 | REPAIR-JOBS | /repair/jobs | C1-C10 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| A-03 | REPAIR-JOB-DETAIL | /repair/jobs/c001 | C1-C10 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| A-04 | REPAIR-DISPUTES | /repair/disputes | C9 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| A-05 | REPAIR-C9-INTERVENE | /repair/disputes/c001 | C9 | ☐ | ☐ | 3 ruling options | ☐บล็อก ☐ควรแก้ ☐nice |

### Maintain
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| A-06 | MAINTAIN-JOBS | /maintain/jobs | M1-M9 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| A-07 | MAINTAIN-JOB-DETAIL | /maintain/jobs/m001 | M1-M9 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |

### Scrap
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| A-08 | SCRAP-JOBS | /scrap/jobs | S1-S12 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| A-09 | SCRAP-DISPUTES | /scrap/disputes | S11 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| A-10 | SCRAP-S11-RULING | /scrap/disputes/s001 | S11 | ☐ | ☐ | A/B escrow ruling | ☐บล็อก ☐ควรแก้ ☐nice |
| A-11 | SCRAP-CERTS | /scrap/certificates | S4 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |

### Resell
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| A-13 | RESELL-DISPUTES | /resell/disputes | R8, R9 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| A-14 | RESELL-DISPUTE-RULING | /resell/disputes/r001 | R9 | ☐ | ☐ | A/B/C ruling | ☐บล็อก ☐ควรแก้ ☐nice |

### Parts & KYC
| # | Screen ID | URL | Case | ☐ผ่าน | ☐แก้ | Comment | Priority |
|---|-----------|-----|------|--------|------|---------|----------|
| A-15 | PARTS-ORDERS | /parts/orders | P5-P7 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| A-16 | PARTS-ORDER-DETAIL | /parts/orders/p001 | P5-P7 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| A-17 | PARTS-DISPUTES | /disputes | P7 | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| A-18 | PARTS-P7-DISPUTE | /disputes/p001 | P7 | ☐ | ☐ | A/B/C ruling | ☐บล็อก ☐ควรแก้ ☐nice |
| A-19 | KYC-LIST | /kyc | KYC | ☐ | ☐ | | ☐บล็อก ☐ควรแก้ ☐nice |
| A-20 | KYC-DETAIL | /kyc/shop-001 | KYC | ☐ | ☐ | 4 docs review | ☐บล็อก ☐ควรแก้ ☐nice |

---

## Summary Counter (อัปเดตหลัง review)

| App | Total Screens | ผ่าน | แก้ | บล็อก |
|-----|--------------|------|-----|-------|
| Website | 16 | | | |
| WeeeU | 29 | | | |
| WeeeR | 27 | | | |
| WeeeT | 10 | | | |
| Admin | 18 | | | |
| **TOTAL** | **100** | | | |

---
*Phase 3 Checklist · HUB Gen 33 · 2026-05-26*
