## 📝 สรุป PR

<!-- อธิบายสิ่งที่เปลี่ยนแปลงใน 1-3 บรรทัด -->

## 🔗 ลิงก์อ้างอิง

<!-- ลิงก์ไป Notion page ที่เกี่ยวข้อง: Sub-CMD, Decision, Issue, etc. -->

- Sub-CMD: 
- Decision: D
- Issue/Bug: 

## 🎯 ประเภทการเปลี่ยนแปลง

- [ ] Feature ใหม่
- [ ] Bug fix
- [ ] Refactor (ไม่เปลี่ยน behavior)
- [ ] Migration / Schema change
- [ ] Test / CI / Tooling
- [ ] Documentation
- [ ] Hotfix

## 📜 Engineering Protocol Self-Check (กฎเหล็ก 12 ข้อ)

<!-- Author ติ๊กเองก่อน request review -->

- [ ] ข้อ 1 — วิเคราะห์ Root Cause + Impact ก่อนเขียนโค้ด
- [ ] ข้อ 2 — Minimal Change (แก้เฉพาะที่จำเป็น)
- [ ] ข้อ 3 — ทดสอบแล้ว (unit / integration / E2E ตามขอบเขต)
- [ ] ข้อ 4 — ห้ามเดา debug — log + root cause
- [ ] ข้อ 5 — Security: Env var, RBAC, input validation
- [ ] ข้อ 6 — Performance: index / cache / N+1 / pagination
- [ ] ข้อ 7 — Documentation: README / API doc / inline comment
- [ ] ข้อ 8 — User-Centered: UX / error message ภาษาไทย
- [ ] ข้อ 9 — Lesson learned (ถ้ามี) บันทึกใน Notion
- [ ] ข้อ 10 — Risk + Rollback ระบุไว้
- [ ] ข้อ 11 — Readable (naming / formatting / no commented code)
- [ ] ข้อ 12 — Multi-role: คิดถึงมุม user / ops / security

ถ้าข้อไหนไม่ tick → อธิบายเหตุผล:
> ข้อ X: <เหตุผล>

## 🧪 สิ่งที่ test แล้ว

- [ ] รัน lint ผ่าน
- [ ] รัน type-check ผ่าน
- [ ] รัน unit test ผ่าน (ถ้ามี)
- [ ] รัน integration test ผ่าน (ถ้ามี)
- [ ] Manual smoke test ผ่าน
- [ ] Migration dry-run ผ่าน (ถ้ามี schema change)

## 🔄 Migration / Schema Change

<!-- ข้าม section นี้ถ้าไม่มี schema change -->

- [ ] Forward migration ผ่าน
- [ ] Rollback migration ผ่าน
- [ ] Data backfill plan (ถ้าจำเป็น)
- [ ] Index ติดตามฟิลด์ที่ query บ่อย

## 🔐 Security

- [ ] ไม่มี secret / credential ใน code (เช็ค `.env`, `git diff` แล้ว)
- [ ] RBAC ตรงตามตาราง role
- [ ] Input validation + sanitization
- [ ] SQL injection / XSS ป้องกัน

## ⚠️ Rollback Plan

<!-- ถ้า PR นี้ deploy แล้วเสีย จะ rollback ยังไง -->

## 📸 Screenshots / Logs (ถ้ามี)

<!-- UI change → screenshot, Backend → log / curl output -->

## 📝 Reviewer Notes

<!-- มีอะไรอยากให้ reviewer ดูเป็นพิเศษไหม? -->
