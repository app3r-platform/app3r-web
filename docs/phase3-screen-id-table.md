# Phase 3 Screen ID Translation Table
> HUB Gen 33 · Advisor Gen 94 CMD 36c813ec-7277-8179 · Task F · 2026-05-26
> ภาษากลาง 3 ฝ่าย: อ.PP / Advisor / HUB
> Format: Short ID | Full Code | Route URL | Case (SoT) | App | Port

---

## WeeeU (U-XX) — Port 3002

| Short ID | Full Code | Route URL | Case | App |
|----------|-----------|-----------|------|-----|
| U-01 | DASHBOARD | /dashboard | — | WeeeU |
| U-02 | REPAIR-HOME | /repair | — | WeeeU |
| U-03 | REPAIR-CREATE | /repair/new | C1-C10 entry | WeeeU |
| U-04 | REPAIR-DETAIL | /repair/c001 | C1-C10 | WeeeU |
| U-05 | REPAIR-OFFERS | /repair/c001/offers | C1-C10 | WeeeU |
| U-06 | REPAIR-PROGRESS | /repair/c001/progress | C1-C10 | WeeeU |
| U-07 | REPAIR-C4-SCRAP | /repair/c001/scrap-offer | C4, S12 | WeeeU |
| U-08 | REPAIR-C5-FEE | /repair/c001/fee-settle | C5 | WeeeU |
| U-09 | REPAIR-REVIEW | /repair/c001/review | C1 complete | WeeeU |
| U-10 | MAINTAIN-BOOK-CONFIRM | /maintain/book/confirm | M1 | WeeeU |
| U-11 | MAINTAIN-BOOK | /maintain/book | M1 | WeeeU |
| U-12 | MAINTAIN-JOBS | /maintain/jobs | M1-M9 | WeeeU |
| U-13 | MAINTAIN-M3-RESCHEDULE | /maintain/jobs/m001/reschedule | M3 | WeeeU |
| U-14 | MAINTAIN-M4-EXTRACOST | /maintain/jobs/m001/extra-cost | M4 | WeeeU |
| U-15 | MAINTAIN-M9-CANCEL | /maintain/jobs/m001/cancel | M5, M9 | WeeeU |
| U-16 | MAINTAIN-JOB-DETAIL | /maintain/jobs/m001 | M1-M9 | WeeeU |
| U-17 | RESELL-MY-LISTINGS | /listings | R2-R12 | WeeeU |
| U-18 | RESELL-OFFERS-RCV | /listings/r001/offers | R3-R6 | WeeeU |
| U-19 | RESELL-R7-CONFIRM | /listings/r001/confirm | R5,R7,R12 | WeeeU |
| U-20 | RESELL-LISTING-DETAIL | /listings/r001 | R2-R12 | WeeeU |
| U-21 | RESELL-C2C-MARKET | /marketplace | R3 (Pair3) | WeeeU |
| U-22 | RESELL-PAIR3-OFFER | /marketplace/r001/offer | R3 | WeeeU |
| U-23 | RESELL-PAIR3-DETAIL | /marketplace/r001 | R3 | WeeeU |
| U-24 | RESELL-R1-INSPECT | /purchases/r001/inspect | R1, R8 | WeeeU |
| U-25 | RESELL-R1-COMPLETE | /purchases/r001/complete | R1 | WeeeU |
| U-26 | RESELL-R8-DISPUTE | /purchases/r001/dispute | R8 | WeeeU |
| U-27 | RESELL-PURCHASE | /purchases/r001 | R1-R3 | WeeeU |
| U-28 | RESELL-PURCHASES | /purchases | R1-R3 | WeeeU |
| U-29 | SCRAP-CREATE | /scrap/new | S1-S5 entry | WeeeU |
| U-30 | SCRAP-S1-OFFERS | /scrap/s001/offers | S1, S2, S5 | WeeeU |
| U-31 | SCRAP-S1-CONFIRM | /scrap/s001/confirm | S1, S2 | WeeeU |
| U-32 | SCRAP-S4-CERT | /scrap/s001/certificate | S4 | WeeeU |
| U-33 | SCRAP-DETAIL | /scrap/s001 | S1-S5,S10 | WeeeU |
| U-34 | APPLIANCES | /appliances | — | WeeeU |
| U-35 | PROFILE | /profile | — | WeeeU |

---

## WeeeR (R-XX) — Port 3001

| Short ID | Full Code | Route URL | Case | App |
|----------|-----------|-----------|------|-----|
| R-01 | DASHBOARD | /dashboard | — | WeeeR |
| R-02 | REPAIR-ANNOUNCE-LIST | /repair/announcements | C1-C10 | WeeeR |
| R-03 | REPAIR-BID | /repair/announcements/c001/offer | C1-C10 bid | WeeeR |
| R-04 | REPAIR-ANNOUNCE-DETAIL | /repair/announcements/c001 | C1-C10 | WeeeR |
| R-05 | REPAIR-WALKIN-QUEUE | /repair/walk-in/queue | C1 walk-in | WeeeR |
| R-06 | REPAIR-C1-WALKIN | /repair/walk-in/c001 | C1 | WeeeR |
| R-07 | REPAIR-PARCEL-QUEUE | /repair/parcel/queue | C3 parcel | WeeeR |
| R-08 | REPAIR-C3-PARCEL | /repair/parcel/c001 | C3 | WeeeR |
| R-09 | REPAIR-JOBS | /repair/jobs | C1-C10 | WeeeR |
| R-10 | REPAIR-ASSIGN-TECH | /repair/jobs/c001/assign | C1-C4 | WeeeR |
| R-11 | REPAIR-JOB-DETAIL | /repair/jobs/c001 | C1-C10 | WeeeR |
| R-12 | MAINTAIN-JOBS | /maintain/jobs | M1-M9 | WeeeR |
| R-13 | MAINTAIN-ASSIGN-TECH | /maintain/jobs/m001/assign | M1 | WeeeR |
| R-14 | MAINTAIN-JOB-DETAIL | /maintain/jobs/m001 | M1-M9 | WeeeR |
| R-15 | RESELL-LISTINGS | /resell/listings | R2-R12 | WeeeR |
| R-16 | RESELL-LISTING-DETAIL | /resell/listings/r001 | R2-R12 | WeeeR |
| R-17 | RESELL-C2C-LIST | /resell/marketplace | R3 | WeeeR |
| R-18 | RESELL-PAIR3-OFFER | /resell/marketplace/r001/offer | R3 | WeeeR |
| R-19 | RESELL-C2C-DETAIL | /resell/marketplace/r001 | R3 | WeeeR |
| R-20 | RESELL-PURCHASES | /resell/purchases | R1-R3 | WeeeR |
| R-21 | RESELL-R1-INSPECT | /resell/purchases/r001/inspect | R1, R8 | WeeeR |
| R-22 | RESELL-R8-DISPUTE | /resell/purchases/r001/dispute | R8 | WeeeR |
| R-23 | RESELL-PURCHASE-DETAIL | /resell/purchases/r001 | R1-R3 | WeeeR |
| R-24 | SCRAP-ANNOUNCE-LIST | /scrap/announcements | S1-S5 | WeeeR |
| R-25 | SCRAP-BID | /scrap/announcements/s001/offer | S1, S2 | WeeeR |
| R-26 | SCRAP-ANNOUNCE-DETAIL | /scrap/announcements/s001 | S1-S5 | WeeeR |
| R-27 | SCRAP-JOBS | /scrap/jobs | S1-S12 | WeeeR |
| R-28 | SCRAP-JOB-DETAIL | /scrap/jobs/s001 | S1-S12 | WeeeR |
| R-29 | PARTS-MY-LISTINGS | /parts/my-listings | P1 | WeeeR |
| R-30 | PARTS-MARKETPLACE | /parts/marketplace | P2, P3 | WeeeR |
| R-31 | PARTS-ORDERS | /parts/orders | P5, P6 | WeeeR |
| R-32 | PARTS-ORDER-DETAIL | /parts/orders/p001 | P5, P6 | WeeeR |
| R-33 | PARTS-MY-ORDERS | /parts/my-orders | P4-P7 | WeeeR |
| R-34 | PARTS-BUYER-ORDER | /parts/my-orders/p001 | P4-P7 | WeeeR |

---

## WeeeT (T-XX) — Port 3003

| Short ID | Full Code | Route URL | Case | App |
|----------|-----------|-----------|------|-----|
| T-01 | JOBS-LIST | /jobs | C1-C10, M1-M9, S1-S12 | WeeeT |
| T-02 | REPAIR-DIAGNOSE | /jobs/c001/diagnose | C1-C4 | WeeeT |
| T-03 | REPAIR-C1-COMPLETE | /jobs/c001/repair | C1 | WeeeT |
| T-04 | SCRAP-S6-PICKUP | /jobs/s001/pickup | S6, S9 | WeeeT |
| T-05 | REPAIR-C3-SCHEDULE | /jobs/c001/schedule | C3 | WeeeT |
| T-06 | REPAIR-C4-SCRAP | /jobs/c001/scrap-offer | C4, S12 | WeeeT |
| T-07 | JOB-COMPLETE | /jobs/c001/complete | C1-C4 complete | WeeeT |
| T-08 | MAINTAIN-INSPECT | /jobs/m001/inspect | M4, M7 | WeeeT |
| T-09 | MAINTAIN-M4-ISSUE | /jobs/m001/issue | M4 | WeeeT |
| T-10 | SCRAP-S8-MISMATCH | /jobs/s001/mismatch | S8 | WeeeT |
| T-11 | JOB-DETAIL | /jobs/c001 | All modules | WeeeT |
| T-12 | PROFILE | /profile | — | WeeeT |

---

## Admin (A-XX) — Port 3000

| Short ID | Full Code | Route URL | Case | App |
|----------|-----------|-----------|------|-----|
| A-01 | DASHBOARD | / | — | Admin |
| A-02 | REPAIR-JOBS | /repair/jobs | C1-C10 | Admin |
| A-03 | REPAIR-JOB-DETAIL | /repair/jobs/c001 | C1-C10 | Admin |
| A-04 | REPAIR-DISPUTES | /repair/disputes | C9 | Admin |
| A-05 | REPAIR-C9-INTERVENE | /repair/disputes/c001 | C9 | Admin |
| A-06 | MAINTAIN-JOBS | /maintain/jobs | M1-M9 | Admin |
| A-07 | MAINTAIN-JOB-DETAIL | /maintain/jobs/m001 | M1-M9 | Admin |
| A-08 | SCRAP-JOBS | /scrap/jobs | S1-S12 | Admin |
| A-09 | SCRAP-DISPUTES | /scrap/disputes | S11 | Admin |
| A-10 | SCRAP-S11-RULING | /scrap/disputes/s001 | S11 | Admin |
| A-11 | SCRAP-CERTS | /scrap/certificates | S4 | Admin |
| A-12 | RESELL-LISTINGS | /resell/listings | R2-R12 | Admin |
| A-13 | RESELL-DISPUTES | /resell/disputes | R8, R9 | Admin |
| A-14 | RESELL-DISPUTE-RULING | /resell/disputes/r001 | R9 | Admin |
| A-15 | PARTS-ORDERS | /parts/orders | P5-P7 | Admin |
| A-16 | PARTS-ORDER-DETAIL | /parts/orders/p001 | P5-P7 | Admin |
| A-17 | PARTS-DISPUTES | /disputes | P7 | Admin |
| A-18 | PARTS-P7-DISPUTE | /disputes/p001 | P7 | Admin |
| A-19 | KYC-LIST | /kyc | KYC | Admin |
| A-20 | KYC-DETAIL | /kyc/shop-001 | KYC | Admin |

---

## Website — App3R (W-XX) — Port 3004

| Short ID | Full Code | Route URL | Case | App |
|----------|-----------|-----------|------|-----|
| W-01 | HOME | / | — | Website |
| W-02 | ABOUT | /about | — | Website |
| W-03 | CONTACT | /contact | — | Website |
| W-04 | DOWNLOAD | /download | — | Website |
| W-05 | FAQ | /faq | — | Website |
| W-06 | LISTINGS-HUB | /listings | — | Website |
| W-07 | LISTINGS-REPAIR | /listings/repair | C1-C10 preview | Website |
| W-08 | LISTING-REPAIR-DETAIL | /listings/repair/r001 | C1-C10 C-4.1b | Website |
| W-09 | LISTINGS-MAINTAIN | /listings/maintain | M1-M9 preview | Website |
| W-10 | LISTING-MAINTAIN-DETAIL | /listings/maintain/m001 | M1-M9 C-4.1b | Website |
| W-11 | LISTINGS-RESELL | /listings/resell | R1-R12 preview | Website |
| W-12 | LISTING-RESELL-DETAIL | /listings/resell/r001 | R1-R12 | Website |
| W-13 | LISTINGS-SCRAP | /listings/scrap | S1-S12 preview | Website |
| W-14 | LISTING-SCRAP-DETAIL | /listings/scrap/s001 | S1-S12 | Website |
| W-15 | ARTICLES | /articles | — | Website |
| W-16 | ARTICLE-DETAIL | /articles/001 | — | Website |
| W-17 | PRODUCTS | /products | — | Website |
| W-18 | REGISTER-WEEER | /register/weeer | — | Website |
| W-19 | PREVIEW | /preview/token | — | Website |
