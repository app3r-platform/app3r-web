"use client";

import { useState } from "react";
import type { Metadata } from "next";

// ===== Types =====
interface WeeeT {
  id: string;
  username: string;
  full_name: string;
  phone: string;
  skills: string[];
  type: "default" | "rented";
  status: "active" | "suspended";
  created_at: string;
}

// ===== Mock data =====
const MOCK_WEEET: WeeeT[] = [
  { id: "T00", username: "R001-T00", full_name: "ร้าน ABC (เจ้าของ)", phone: "021234567", skills: ["ซ่อมแอร์", "ซ่อมตู้เย็น"], type: "default", status: "active", created_at: "2026-04-01" },
  { id: "T01", username: "R001-T01", full_name: "นายวิทยา ซ่อมเก่ง",  phone: "0812345678", skills: ["ซ่อมแอร์"],          type: "rented",  status: "active",    created_at: "2026-04-15" },
  { id: "T02", username: "R001-T02", full_name: "นายสมชาย ช่างดี",    phone: "0898765432", skills: ["ซ่อมตู้เย็น", "บำรุง"], type: "rented", status: "active",    created_at: "2026-04-20" },
  { id: "T03", username: "R001-T03", full_name: "นายมาลัย ไฟฟ้า",     phone: "0876543210", skills: ["ซ่อมแอร์"],          type: "rented",  status: "suspended", created_at: "2026-04-25" },
];

const SKILL_OPTIONS = ["ซ่อมแอร์", "ซ่อมตู้เย็น", "ซ่อมเครื่องซักผ้า", "บำรุงระบบทำความเย็น", "รับซากเครื่องใช้ไฟฟ้า", "ติดตั้งแอร์"];
const GOLD_PER_WEEET = 100; // D2: yearly_tech_account_fee = 100 Gold

// ===== Components =====
function StatusBadge({ status }: { status: WeeeT["status"] }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
      {status === "active" ? "ใช้งาน" : "ระงับ"}
    </span>
  );
}
function TypeBadge({ type }: { type: WeeeT["type"] }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${type === "default" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>
      {type === "default" ? "Default" : "Rented"}
    </span>
  );
}

// ===== Add WeeeT Modal =====
function AddWeeeTModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, phone: string, skills: string[]) => void }) {
  const [form, setForm] = useState({ weeet_full_name: "", weeet_phone: "", weeet_skills: [] as string[] });
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleSkill(s: string) {
    setForm((f) => ({
      ...f,
      weeet_skills: f.weeet_skills.includes(s) ? f.weeet_skills.filter((x) => x !== s) : [...f.weeet_skills, s],
    }));
  }

  function handleConfirm() {
    const e: Record<string, string> = {};
    if (!form.weeet_full_name.trim()) e.name = "กรุณากรอกชื่อช่าง";
    if (!form.weeet_phone.match(/^0[0-9]{9}$/)) e.phone = "เบอร์โทร 10 หลัก";
    if (Object.keys(e).length) { setErrors(e); return; }
    setConfirmed(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">เพิ่ม WeeeT (รายปี)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {!confirmed ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อช่าง <span className="text-red-500">*</span></label>
                <input type="text" value={form.weeet_full_name} onChange={(e) => setForm((f) => ({ ...f, weeet_full_name: e.target.value }))}
                  placeholder="นายสมศักดิ์ ช่างแอร์" maxLength={200}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.name ? "border-red-400" : "border-gray-200"}`} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรช่าง <span className="text-red-500">*</span></label>
                <input type="tel" value={form.weeet_phone} onChange={(e) => setForm((f) => ({ ...f, weeet_phone: e.target.value.replace(/\D/g, "") }))}
                  placeholder="0812345678" maxLength={10}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.phone ? "border-red-400" : "border-gray-200"}`} />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ความเชี่ยวชาญ</label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => toggleSkill(s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.weeet_skills.includes(s) ? "bg-green-100 border-green-400 text-green-700" : "border-gray-200 text-gray-600 hover:border-green-300"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleConfirm} className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors">
                ดำเนินการต่อ
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-2">
                <div className="font-semibold">⚠️ ยืนยันการสร้างบัญชี WeeeT</div>
                <div>ชื่อช่าง: <strong>{form.weeet_full_name}</strong></div>
                <div>เบอร์โทร: <strong>{form.weeet_phone}</strong></div>
                <div className="border-t border-amber-200 pt-2 font-semibold text-amber-700">
                  จะหัก {GOLD_PER_WEEET} Gold จาก wallet ของคุณ (ค่าบัญชีรายปี)
                </div>
              </div>
              <p className="text-xs text-gray-500">
                ระบบจะสร้าง username และ password โดยอัตโนมัติ — แสดงให้คุณ 1 ครั้งหลังสร้างเสร็จ
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmed(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button onClick={() => onAdd(form.weeet_full_name, form.weeet_phone, form.weeet_skills)}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  ยืนยัน หัก {GOLD_PER_WEEET} Gold
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Credentials Modal (แสดง 1 ครั้ง) =====
function CredentialsModal({ username, password, onClose }: { username: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(`username: ${username}\npassword: ${password}`);
    setCopied(true);
  }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="p-5 text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="font-bold text-gray-900">สร้างบัญชี WeeeT สำเร็จ</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left font-mono text-sm space-y-2">
            <div><span className="text-gray-500">Username:</span> <strong>{username}</strong></div>
            <div><span className="text-gray-500">Password:</span> <strong>{password}</strong></div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
            ⚠️ บันทึก password ไว้ก่อน — ไม่สามารถดูอีกได้หลังจากปิดหน้าต่างนี้
          </div>
          <button onClick={handleCopy} className="w-full border border-green-600 text-green-700 font-medium py-2.5 rounded-xl text-sm hover:bg-green-50 transition-colors">
            {copied ? "✅ คัดลอกแล้ว" : "📋 คัดลอก username & password"}
          </button>
          <p className="text-xs text-gray-400">
            (D16: ไม่มีระบบ SMS — กรุณาส่งให้ช่างด้วยตนเอง)
          </p>
          <button onClick={onClose} className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
            รับทราบ — ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Reset Password Modal =====
function ResetPasswordModal({ weeet, onClose }: { weeet: WeeeT; onClose: () => void }) {
  const [done, setDone] = useState(false);
  // Generate random 10-char password on mount (not hardcoded)
  const [newPw] = useState(() =>
    (Math.random().toString(36).slice(2, 7) + Math.random().toString(36).slice(2, 7).toUpperCase()).slice(0, 10)
  );
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(newPw);
    setCopied(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
        <h2 className="font-bold text-gray-900">ตั้ง Password ใหม่</h2>
        <p className="text-sm text-gray-600">
          ตั้ง password ใหม่สำหรับ <strong>{weeet.username}</strong> ({weeet.full_name})
        </p>
        {!done ? (
          <>
            <p className="text-xs text-gray-400">ระบบจะสุ่ม password ใหม่ 10 หลักให้อัตโนมัติ</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">ยกเลิก</button>
              <button onClick={() => setDone(true)} className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-xl text-sm">ตั้งใหม่</button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-sm">
              Password ใหม่: <strong>{newPw}</strong>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
              ⚠️ บันทึก password ไว้ก่อน — ไม่สามารถดูอีกได้
            </div>
            <button onClick={handleCopy}
              className="w-full border border-green-600 text-green-700 font-medium py-2.5 rounded-xl text-sm hover:bg-green-50 transition-colors">
              {copied ? "✅ คัดลอกแล้ว" : "📋 คัดลอก Password ใหม่"}
            </button>
            <p className="text-xs text-gray-400 text-center">(D16: ไม่มีระบบ SMS — ส่งให้ช่างด้วยตนเอง)</p>
            <button onClick={onClose} className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-xl text-sm">ปิด</button>
          </>
        )}
      </div>
    </div>
  );
}

// ===== Switch to WeeeT Modal (HQ-7: JWT sub_account context switch) =====
function SwitchWeeeTModal({ weeet, onClose }: { weeet: WeeeT; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  function handleConfirm() {
    setLoading(true);
    // GET /api/v1/weeer/switch-to-weeet/{id} → JWT sub_account → redirect WeeeT app (HQ-7)
    setTimeout(() => {
      setLoading(false);
      onClose();
      // In production: router.push() to WeeeT app with sub_account JWT
    }, 800);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
        {/* Orange banner preview — same as WeeeT app impersonation UI */}
        <div className="bg-orange-500 text-white rounded-xl px-4 py-2.5 text-sm text-center font-medium">
          🔄 WeeeT Mode — session ชั่วคราว 30 นาที
        </div>
        <h2 className="font-bold text-gray-900">สลับเข้าบัญชี WeeeT</h2>
        <p className="text-sm text-gray-600">
          คุณกำลังจะสลับเข้าใช้งานในฐานะ <strong>{weeet.full_name}</strong>
          <span className="text-gray-400"> ({weeet.username})</span>
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 space-y-1">
          <div className="font-semibold">⚠️ หมายเหตุ</div>
          <div>• Session ชั่วคราว 30 นาที — หมดเวลาแล้ว logout อัตโนมัติ</div>
          <div>• ระบบจะออก JWT sub_account context ใหม่ (HQ-7)</div>
          <div>• คุณจะถูก redirect ไปยัง WeeeT app</div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
            ยกเลิก
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
            {loading ? "กำลังสลับ…" : "ยืนยัน — เข้า WeeeT Mode"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Main Page =====
export default function ManageTechniciansPage() {
  const [weeetList, setWeeetList] = useState<WeeeT[]>(MOCK_WEEET);
  const [showAdd, setShowAdd] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [resetTarget, setResetTarget] = useState<WeeeT | null>(null);
  const [switchTarget, setSwitchTarget] = useState<WeeeT | null>(null);
  const goldBalance = 1800;

  function handleAdd(name: string, phone: string, skills: string[]) {
    const nextId = `T0${weeetList.length}`;
    const username = `R001-T0${weeetList.length}`;
    const password = Math.random().toString(36).slice(2, 12).replace(/[^a-zA-Z0-9]/g, "x");
    const newWeeeT: WeeeT = {
      id: nextId, username, full_name: name, phone, skills,
      type: "rented", status: "active", created_at: new Date().toISOString().split("T")[0],
    };
    setWeeetList((prev) => [...prev, newWeeeT]);
    setShowAdd(false);
    setCredentials({ username, password });
  }

  function toggleStatus(id: string) {
    setWeeetList((prev) => prev.map((t) => t.id === id ? { ...t, status: t.status === "active" ? "suspended" : "active" } : t));
  }

  function handleSwitch(t: WeeeT) {
    setSwitchTarget(t);
  }

  const canAddMore = goldBalance >= GOLD_PER_WEEET;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">จัดการ WeeeT</h1>
          <p className="text-sm text-gray-500">ช่างทั้งหมด: {weeetList.length} คน · Gold: {goldBalance} pts</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          disabled={!canAddMore}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          ➕ เพิ่ม WeeeT ({GOLD_PER_WEEET} Gold)
        </button>
      </div>

      {!canAddMore && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          ⚠️ Gold ไม่เพียงพอ — ต้องการ {GOLD_PER_WEEET} Gold เพื่อเพิ่ม WeeeT
        </div>
      )}

      {/* WeeeT Table */}
      <div className="space-y-3">
        {weeetList.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl shrink-0">👷</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{t.full_name}</span>
                  <TypeBadge type={t.type} />
                  <StatusBadge status={t.status} />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {t.username} · 📞 {t.phone}
                </div>
                {t.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {t.skills.map((s) => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50">
              {/* Switch to WeeeT */}
              <button
                onClick={() => handleSwitch(t)}
                disabled={t.status === "suspended"}
                className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                🔄 สลับเข้าใช้
              </button>

              {/* Reset password (rented only) */}
              {t.type === "rented" && (
                <button
                  onClick={() => setResetTarget(t)}
                  className="text-xs border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  🔑 ตั้ง Password ใหม่
                </button>
              )}

              {/* Suspend / Reactivate (rented only) */}
              {t.type === "rented" && (
                <button
                  onClick={() => toggleStatus(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    t.status === "active"
                      ? "border border-red-200 text-red-600 hover:bg-red-50"
                      : "border border-green-200 text-green-600 hover:bg-green-50"
                  }`}
                >
                  {t.status === "active" ? "⏸️ ระงับ" : "▶️ เปิดใช้งาน"}
                </button>
              )}

              {t.type === "default" && (
                <span className="text-xs text-gray-400 py-1.5">บัญชีหลัก — ไม่สามารถลบหรือระงับได้</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-600 space-y-1">
        <div className="font-semibold text-blue-700">ℹ️ ข้อมูลบัญชี WeeeT</div>
        <div>• Default WeeeT: สร้างอัตโนมัติเมื่อได้รับอนุมัติ (D15) — ไม่มีค่าใช้จ่าย</div>
        <div>• Rented WeeeT: หัก {GOLD_PER_WEEET} Gold/ปี — ต้องต่ออายุทุกปี</div>
        <div>• สลับเข้าใช้: redirect ไป WeeeT app พร้อม session ชั่วคราว</div>
        <div>• Password: ระบบสุ่มให้ — WeeeR ส่งให้ช่างเองทาง LINE หรือโทร (D16: ไม่มี SMS)</div>
      </div>

      {/* Modals */}
      {showAdd && <AddWeeeTModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {credentials && <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />}
      {resetTarget && <ResetPasswordModal weeet={resetTarget} onClose={() => setResetTarget(null)} />}
      {switchTarget && <SwitchWeeeTModal weeet={switchTarget} onClose={() => setSwitchTarget(null)} />}
    </div>
  );
}
