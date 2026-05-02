# WeeeU — Decision Log

## DECISION-001: Stack Selection
**Date:** 2026-05-02
**Task:** TASK-24 (Wave 4 Phase 2a)
**Decision:** ใช้ **Next.js 15 + React 19 + Tailwind CSS** (ไม่ใช่ Vite ตามที่ persona แนะนำ)

**Reasoning:**
- Existing codebase (ตั้งแต่ Phase 1) ใช้ Next.js monorepo (Turbo + pnpm workspace) อยู่แล้ว
- มี shared `@app3r/ui` package ที่ตั้งค่าไว้กับ Next.js
- เปลี่ยนเป็น Vite จะทำให้ conflict กับ monorepo structure
- Next.js App Router รองรับ dynamic module routing (Phase 2b) ได้ดีกว่า Vite bare

**Impact:** ไม่มีผลต่อ deliverables — ยังครบตาม persona spec ทุกข้อ

---

## DECISION-002: Working Directory Path
**Date:** 2026-05-02
**Task:** TASK-24
**Decision:** Working dir จริงคือ `D:\ClaudeCode\App3R\web\apps\weeeu\` ไม่ใช่ `D:\ClaudeCode\App3R\App3R-System\web\weeeu\` ตาม persona

**Reasoning:**
- Persona ถูก draft ขณะที่ path structure ยังไม่ final
- Actual monorepo อยู่ที่ `D:\ClaudeCode\App3R\web\` มาตั้งแต่ Phase 1
- แจ้ง Advisor ผ่าน Active Notifications แล้ว (354813ec-7277-8193-a84b-dc1e5463fb46)
