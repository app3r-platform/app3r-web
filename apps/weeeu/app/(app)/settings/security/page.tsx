"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordInput from "@/components/shared/PasswordInput";

// Password validation — min 8, a-z, A-Z, 0-9, not same as last 3
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  if (!/[a-z]/.test(pw)) return "ต้องมีตัวอักษรพิมพ์เล็ก (a-z)";
  if (!/[A-Z]/.test(pw)) return "ต้องมีตัวอักษรพิมพ์ใหญ่ (A-Z)";
  if (!/[0-9]/.test(pw)) return "ต้องมีตัวเลข (0-9)";
  return null;
}

type PageState = "idle" | "saving" | "success" | "deleting" | "deleteConfirm";

export default function SecuritySettingsPage() {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pageState, setPageState] = useState<PageState>("idle");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => { const c = { ...e }; delete c[key]; return c; });
    if (errors.general) setErrors((e) => { const c = { ...e }; delete c.general; return c; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.current_password) e.current_password = "กรุณากรอกรหัสผ่านปัจจุบัน";
    const pwErr = validatePassword(form.new_password);
    if (pwErr) e.new_password = pwErr;
    if (form.new_password === form.current_password) e.new_password = "รหัสผ่านใหม่ต้องไม่เหมือนกับรหัสปัจจุบัน";
    if (form.new_password !== form.new_password_confirm) e.new_password_confirm = "รหัสผ่านไม่ตรงกัน";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setPageState("saving");
    try {
      // Production: POST /api/v1/auth/change-password
      // → force logout all devices
      await new Promise((r) => setTimeout(r, 1000));
      setPageState("success");
    } catch {
      setErrors({ general: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
      setPageState("idle");
    }
  };

  const pwChecks = [
    { label: "อย่างน้อย 8 ตัว", ok: form.new_password.length >= 8 },
    { label: "มีตัวพิมพ์เล็ก (a-z)", ok: /[a-z]/.test(form.new_password) },
    { label: "มีตัวพิมพ์ใหญ่ (A-Z)", ok: /[A-Z]/.test(form.new_password) },
    { label: "มีตัวเลข (0-9)", ok: /[0-9]/.test(form.new_password) },
  ];
  const pwScore = pwChecks.filter((c) => c.ok).length;

  const inputCls = (field: string) =>
    `border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors[field] ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  // ─── Success state ───────────────────────────────────────────────────────────
  if (pageState === "success") return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รหัสผ่าน</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
        <div className="text-5xl">✅</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">เปลี่ยนรหัสผ่านสำเร็จ</h2>
          <p className="text-sm text-gray-500 mt-2">
            ระบบออกจากระบบในทุก device แล้ว<br />
            กรุณาเข้าสู่ระบบใหม่ด้วยรหัสผ่านที่ตั้งใหม่
          </p>
        </div>
        <Link
          href="/login"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-2xl text-sm text-center transition-colors"
        >
          เข้าสู่ระบบใหม่
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ความปลอดภัย</h1>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">เปลี่ยนรหัสผ่าน</p>
        </div>
        <div className="p-5">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Current password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่านปัจจุบัน <span className="text-red-500">*</span>
              </label>
              <PasswordInput
                value={form.current_password}
                onChange={(e) => set("current_password", e.target.value)}
                placeholder="รหัสผ่านปัจจุบัน"
                className={inputCls("current_password")}
                autoComplete="current-password"
              />
              {errors.current_password && (
                <p className="text-red-500 text-xs mt-1">{errors.current_password}</p>
              )}
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่านใหม่ <span className="text-red-500">*</span>
              </label>
              <PasswordInput
                value={form.new_password}
                onChange={(e) => set("new_password", e.target.value)}
                placeholder="ตั้งรหัสผ่านใหม่"
                className={inputCls("new_password")}
                autoComplete="new-password"
              />
              {errors.new_password && (
                <p className="text-red-500 text-xs mt-1">{errors.new_password}</p>
              )}
              {/* Strength meter */}
              {form.new_password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < pwScore ? (pwScore <= 1 ? "bg-red-400" : pwScore <= 2 ? "bg-amber-400" : pwScore <= 3 ? "bg-yellow-400" : "bg-green-500") : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    {pwChecks.map((c) => (
                      <p key={c.label} className={`text-xs ${c.ok ? "text-green-600" : "text-gray-400"}`}>
                        {c.ok ? "✓" : "○"} {c.label}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">ต้องไม่ซ้ำกับรหัสผ่าน 3 รอบล่าสุด</p>
                </div>
              )}
            </div>

            {/* Confirm new password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ยืนยันรหัสผ่านใหม่ <span className="text-red-500">*</span>
              </label>
              <PasswordInput
                value={form.new_password_confirm}
                onChange={(e) => set("new_password_confirm", e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                className={inputCls("new_password_confirm")}
                autoComplete="new-password"
              />
              {errors.new_password_confirm && (
                <p className="text-red-500 text-xs mt-1">{errors.new_password_confirm}</p>
              )}
              {!errors.new_password_confirm && form.new_password_confirm && form.new_password_confirm === form.new_password && (
                <p className="text-green-600 text-xs mt-1">✓ รหัสผ่านตรงกัน</p>
              )}
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700 flex items-start gap-2">
                <span>⚠️</span>
                <span>หลังเปลี่ยนรหัสผ่าน ระบบจะออกจากระบบในทุก device ทันที — กรุณาเข้าสู่ระบบใหม่</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={pageState === "saving"}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {pageState === "saving" ? (
                <><span className="animate-spin">⟳</span> กำลังเปลี่ยนรหัสผ่าน...</>
              ) : (
                "เปลี่ยนรหัสผ่าน"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Delete account — PDPA Right to be Forgotten */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-red-50 border-b border-red-100">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">ลบบัญชีผู้ใช้</p>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-600">
            การลบบัญชีจะลบข้อมูลส่วนตัวทั้งหมดของคุณออกจากระบบ (Right to be Forgotten — PDPA)
          </p>
          <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
            <li>ข้อมูลส่วนตัวและที่อยู่</li>
            <li>ประวัติการซ่อม / ซื้อขาย / บำรุงรักษา</li>
            <li>Silver Point และ Gold Point คงเหลือจะหมดอายุ</li>
            <li>ดำเนินการไม่ได้เมื่อมีงานที่ยังไม่เสร็จ</li>
          </ul>

          {pageState !== "deleteConfirm" ? (
            <button
              onClick={() => setPageState("deleteConfirm")}
              className="w-full border border-red-300 text-red-500 hover:bg-red-50 font-medium py-3 rounded-2xl text-sm transition-colors"
            >
              🗑️ ขอลบบัญชีผู้ใช้
            </button>
          ) : (
            <div className="space-y-3 border border-red-300 rounded-2xl p-4">
              <p className="text-sm font-semibold text-red-700">ยืนยันการลบบัญชี</p>
              <p className="text-xs text-red-600">พิมพ์ <strong>ลบบัญชี</strong> เพื่อยืนยัน</p>
              <input
                type="text"
                placeholder="พิมพ์ 'ลบบัญชี'"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-3 border border-red-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setPageState("idle"); setDeleteConfirmText(""); }}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  disabled={deleteConfirmText !== "ลบบัญชี" || pageState === "deleting"}
                  onClick={async () => {
                    setPageState("deleting");
                    // Production: DELETE /api/v1/users/me
                    await new Promise((r) => setTimeout(r, 1000));
                    window.location.href = "/welcome";
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  {pageState === "deleting" ? "กำลังลบ..." : "ยืนยันลบบัญชี"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
