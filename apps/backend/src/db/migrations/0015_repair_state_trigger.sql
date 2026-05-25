-- Migration: 0015_repair_state_trigger
-- Transition Guard Trigger: Auto-log state changes ของ repair jobs
-- Prereq: 0013_repair_workflow (repair_job_state_transitions table)
--
-- Open Question 4 (README): "Transition guard trigger — Round 2 migration vs separate"
-- Resolution: แยกเป็น migration ของตัวเอง (0015) เพื่อ rollback แยกได้
--
-- Trigger: fn_repair_job_state_log()
--   AFTER UPDATE OF "status" ON "services"
--   WHERE service_type = 'repair'
--   → INSERT row ใหม่ใน repair_job_state_transitions
--
-- ⚠️ Note: trigger ทำงานได้เฉพาะ status change ผ่าน UPDATE (services table)
--   ไม่รับ INSERT (initial state ต้อง insert โดย app layer ตอน job สร้าง)

-- ── Trigger function ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_repair_job_state_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- เฉพาะ service_type = 'repair' และ status เปลี่ยนจริง
  IF NEW.service_type = 'repair' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO "repair_job_state_transitions" (
      "repair_job_id",
      "from_status",
      "to_status",
      "trigger_event",
      "triggered_by",
      "context",
      "transitioned_at"
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      -- trigger_event: ไม่ทราบ event ชื่อ (app layer ใส่ผ่าน context ได้)
      -- ใช้ 'status_update' เป็น default event name
      'status_update',
      -- triggered_by: ไม่สามารถรู้ได้จาก trigger โดยตรง
      -- app layer ต้องใช้ API ที่ INSERT repair_job_state_transitions โดยตรง
      -- สำหรับ trigger นี้ = NULL (system-level change)
      NULL,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'source', 'trigger'
      ),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ── Trigger attachment ────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_repair_job_state_log ON "services";

CREATE TRIGGER trg_repair_job_state_log
  AFTER UPDATE OF "status" ON "services"
  FOR EACH ROW
  EXECUTE FUNCTION fn_repair_job_state_log();

-- ── Comments ──────────────────────────────────────────────────────────────────
COMMENT ON FUNCTION fn_repair_job_state_log() IS
  'Auto-logs status changes of repair jobs into repair_job_state_transitions. '
  'triggered_by = NULL (system trigger); app layer should INSERT transitions directly '
  'for user-initiated changes to capture triggered_by + trigger_event accurately.';

COMMENT ON TRIGGER trg_repair_job_state_log ON "services" IS
  'Fires AFTER UPDATE OF status on services where service_type = repair. '
  'Acts as safety net; primary logging = app layer direct INSERT.';

-- ── Rollback (manual) ─────────────────────────────────────────────────────────
-- DROP TRIGGER IF EXISTS trg_repair_job_state_log ON "services";
-- DROP FUNCTION IF EXISTS fn_repair_job_state_log();
