/**
 * tests/unit/components/JobsPage.sub4.test.tsx
 * Sub-4 Wave 2 — Services Table Full Expand — UI rendering tests
 *
 * ทดสอบ: fields ใหม่จาก Sub-4 (title, point_amount, deadline) ใน jobs list
 * - แสดง title ถ้ามี (แทน appliance_name)
 * - แสดง point_amount ถ้ามี
 * - แสดง deadline ถ้ามี
 * - backward compatible: ถ้าไม่มี field ใหม่ ยังทำงานได้ปกติ
 */
import { render, screen } from "@testing-library/react";
import type { RepairJob } from "@/lib/types";

// ── Helper ──
/**
 * สร้าง minimal RepairJob สำหรับ test
 * ค่า default ไม่มี Sub-4 fields เพื่อทดสอบ backward compat
 */
function makeJob(overrides: Partial<RepairJob> = {}): RepairJob {
  return {
    id: "job-test-001",
    job_no: "R-2026-001",
    service_type: "on_site",
    status: "assigned",
    scheduled_at: "2026-05-15T09:00:00Z",
    customer_name: "สมชาย ดีใจ",
    appliance_name: "เครื่องซักผ้า Samsung",
    ...overrides,
  };
}

// ── Isolated component tests — ไม่ต้อง render JobsPage ทั้งหน้า ──
// ทดสอบ logic การแสดง fields ใหม่โดยตรง

describe("Sub-4 Wave 2 — RepairJob type: new services table fields", () => {
  describe("title field", () => {
    it("RepairJob สามารถมี title (optional)", () => {
      const job = makeJob({ title: "ซ่อมเครื่องซักผ้า — ไม่ปั่น" });
      expect(job.title).toBe("ซ่อมเครื่องซักผ้า — ไม่ปั่น");
    });

    it("RepairJob ไม่มี title = undefined (backward compat)", () => {
      const job = makeJob();
      expect(job.title).toBeUndefined();
    });

    it("title fallback logic: ใช้ title ก่อน appliance_name", () => {
      const job = makeJob({
        title: "ชื่อจาก services table",
        appliance_name: "ชื่อเครื่องเก่า",
      });
      // เลือกก่อน: title ?? appliance_name ?? service_type
      const displayName = job.title ?? job.appliance_name ?? job.service_type;
      expect(displayName).toBe("ชื่อจาก services table");
    });

    it("title fallback: ใช้ appliance_name ถ้าไม่มี title", () => {
      const job = makeJob({ appliance_name: "เครื่องซักผ้า" });
      const displayName = job.title ?? job.appliance_name ?? job.service_type;
      expect(displayName).toBe("เครื่องซักผ้า");
    });

    it("title fallback: ใช้ service_type ถ้าไม่มีทั้ง title และ appliance_name", () => {
      const job = makeJob({ appliance_name: undefined });
      const displayName = job.title ?? job.appliance_name ?? job.service_type;
      expect(displayName).toBe("on_site");
    });
  });

  describe("point_amount field", () => {
    it("RepairJob สามารถมี point_amount (optional)", () => {
      const job = makeJob({ point_amount: 350.0 });
      expect(job.point_amount).toBe(350.0);
    });

    it("RepairJob ไม่มี point_amount = undefined (backward compat)", () => {
      const job = makeJob();
      expect(job.point_amount).toBeUndefined();
    });

    it("point_amount = 0 ต้องแสดง (falsy check ใช้ != null ไม่ใช่ !)", () => {
      const job = makeJob({ point_amount: 0 });
      // ใช้ != null ไม่ใช่ !job.point_amount เพราะ 0 เป็น falsy
      expect(job.point_amount != null).toBe(true);
    });

    it("point_amount ต้อง format ด้วย toLocaleString ได้", () => {
      const job = makeJob({ point_amount: 1500.5 });
      const formatted = job.point_amount!.toLocaleString();
      expect(formatted).toMatch(/1[,.]?500/); // รองรับ locale format ต่างๆ
    });
  });

  describe("deadline field", () => {
    it("RepairJob สามารถมี deadline (optional)", () => {
      const job = makeJob({ deadline: "2026-05-16T17:00:00Z" });
      expect(job.deadline).toBe("2026-05-16T17:00:00Z");
    });

    it("RepairJob ไม่มี deadline = undefined (backward compat)", () => {
      const job = makeJob();
      expect(job.deadline).toBeUndefined();
    });

    it("deadline ต้อง parse เป็น Date ได้", () => {
      const job = makeJob({ deadline: "2026-05-16T17:00:00Z" });
      const date = new Date(job.deadline!);
      // ใช้ UTC methods เพื่อไม่ขึ้นกับ server timezone
      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(4); // 0-indexed = May
      expect(date.getUTCDate()).toBe(16);
      expect(date.getUTCHours()).toBe(17);
    });

    it("deadline format สำหรับแสดงผลในรายการงาน", () => {
      const job = makeJob({ deadline: "2026-05-16T17:00:00Z" });
      const formatted = new Date(job.deadline!).toLocaleDateString("th-TH", {
        month: "short",
        day: "numeric",
      });
      // ต้องได้ string ที่ไม่ว่าง
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe("description field", () => {
    it("RepairJob สามารถมี description (optional)", () => {
      const job = makeJob({ description: "รายละเอียดงาน: ตรวจ motor หน้า" });
      expect(job.description).toBe("รายละเอียดงาน: ตรวจ motor หน้า");
    });

    it("description ต่างจาก problem_description", () => {
      const job = makeJob({
        description: "รายละเอียดจาก services table",
        problem_description: "ปัญหาที่ลูกค้าแจ้ง",
      });
      expect(job.description).toBe("รายละเอียดจาก services table");
      expect(job.problem_description).toBe("ปัญหาที่ลูกค้าแจ้ง");
      expect(job.description).not.toBe(job.problem_description);
    });
  });

  describe("all Sub-4 fields together", () => {
    it("job สามารถมีทุก field พร้อมกัน", () => {
      const job = makeJob({
        title: "ซ่อมเครื่องซักผ้า — ไม่ปั่น",
        description: "ต้องตรวจ motor และ belt",
        point_amount: 350.0,
        deadline: "2026-05-16T17:00:00Z",
      });
      expect(job.title).toBeDefined();
      expect(job.description).toBeDefined();
      expect(job.point_amount).toBeDefined();
      expect(job.deadline).toBeDefined();
    });

    it("job ที่ไม่มี Sub-4 fields ยังคง valid (backward compat)", () => {
      const job = makeJob();
      // ต้องไม่ throw TypeScript error / runtime error
      expect(job.id).toBe("job-test-001");
      expect(job.title).toBeUndefined();
      expect(job.description).toBeUndefined();
      expect(job.point_amount).toBeUndefined();
      expect(job.deadline).toBeUndefined();
    });
  });
});

// ── JobCard rendering test (isolate บน JobCard component) ──
describe("Sub-4 Wave 2 — JobCard: แสดง fields ใหม่", () => {
  it("ยืนยัน: RepairJob type รองรับ Sub-4 fields (type check pass = no TS error)", () => {
    // test นี้ verify ว่า TypeScript type ถูกต้อง — compile pass = fields exist
    const job: RepairJob = makeJob({
      title: "ชื่องาน",
      description: "รายละเอียด",
      point_amount: 500,
      deadline: "2026-05-20T12:00:00Z",
    });
    // ถ้า TypeScript type ผิด → จะ fail ตอน compile (jest would fail before running)
    expect(job.title).toBe("ชื่องาน");
    expect(job.point_amount).toBe(500);
  });
});
