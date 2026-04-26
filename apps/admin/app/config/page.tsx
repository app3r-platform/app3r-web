"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

// ─── Config metadata (label + unit + description) ────────────────────────────

const CONFIG_META: Record<string, { label: string; unit: string; desc: string }> = {
  fee_topup_card:          { label: "ค่าธรรมเนียมเติมเงิน (บัตร)",      unit: "%",    desc: "หักเมื่อลูกค้าเติม point ผ่านบัตรเครดิต/เดบิต" },
  fee_topup_promptpay:     { label: "ค่าธรรมเนียมเติมเงิน (PromptPay)", unit: "%",    desc: "หักเมื่อลูกค้าเติม point ผ่าน PromptPay" },
  fee_withdrawal:          { label: "ค่าธรรมเนียมถอนเงิน",              unit: "%",    desc: "หักเมื่อร้านค้าถอน point เป็นเงิน" },
  fee_listing_secondhand:  { label: "ค่าธรรมเนียมลิสต์มือสอง",          unit: "%",    desc: "platform fee สำหรับงานขายสินค้ามือสอง" },
  fee_listing_scrap:       { label: "ค่าธรรมเนียมลิสต์ซากเครื่อง",      unit: "%",    desc: "platform fee สำหรับงานขายซาก" },
  fee_listing_repair:      { label: "ค่าธรรมเนียมลิสต์งานซ่อม",         unit: "%",    desc: "platform fee สำหรับงานซ่อม" },
  fee_offer_deposit:       { label: "มัดจำเมื่อยื่น offer",              unit: "%",    desc: "ล็อค point ของ WeeeR เมื่อยื่น offer" },
  fee_purchase_percent:    { label: "ค่าธรรมเนียมธุรกรรม",              unit: "%",    desc: "platform fee หักจากยอดรวมเมื่อชำระ" },
  fee_penalty_cancel:      { label: "ค่าปรับยกเลิก",                    unit: "%",    desc: "ปรับจาก escrow เมื่อยกเลิกหลังยืนยัน" },
  inspection_period_days:  { label: "ระยะเวลาตรวจงาน",                  unit: "วัน",  desc: "เวลาที่ WeeeU มีในการตรวจงานหลังส่งมอบ" },
  dispute_window_days:     { label: "ระยะเวลาเปิด dispute",             unit: "วัน",  desc: "เวลาที่เปิด dispute ได้หลังสิ้นสุด inspection" },
  offer_deadline_days:     { label: "อายุ offer",                        unit: "วัน",  desc: "offer หมดอายุหากไม่มีการเลือกภายใน n วัน" },
  otp_max_attempts:        { label: "OTP — จำนวนครั้งสูงสุด",            unit: "ครั้ง", desc: "หากพิมพ์ผิดเกินจำนวนนี้ OTP จะถูกยกเลิก" },
  weeet_monthly_fee_points:{ label: "ค่าสมาชิกรายเดือน WeeeT",          unit: "pt",   desc: "ค่าธรรมเนียมรายเดือนของช่าง (0 = ฟรี)" },
  point_to_thb_rate:       { label: "อัตราแลก Point → บาท",             unit: "฿/pt", desc: "1 point เท่ากับกี่บาท" },
};

const GROUPS: { title: string; icon: string; keys: string[] }[] = [
  {
    title: "ค่าธรรมเนียม (Fees)",
    icon: "💳",
    keys: [
      "fee_topup_card", "fee_topup_promptpay", "fee_withdrawal",
      "fee_listing_secondhand", "fee_listing_scrap", "fee_listing_repair",
      "fee_offer_deposit", "fee_purchase_percent", "fee_penalty_cancel",
    ],
  },
  {
    title: "ระยะเวลา (Timeouts)",
    icon: "⏱️",
    keys: ["inspection_period_days", "dispute_window_days", "offer_deadline_days"],
  },
  {
    title: "OTP & สมาชิก",
    icon: "🔐",
    keys: ["otp_max_attempts", "weeet_monthly_fee_points"],
  },
  {
    title: "Point Economy",
    icon: "💰",
    keys: ["point_to_thb_rate"],
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConfigPage() {
  const router = useRouter();

  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  // editValues: key → draft value currently in input
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  // saving: key currently being saved
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    api.get<Record<string, string>>("/admin/config")
      .then((data) => {
        setConfig(data);
        setEditValues(data); // initialise draft = current
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave(key: string) {
    const newVal = editValues[key]?.trim();
    if (newVal === undefined || newVal === config[key]) return; // ไม่มีการเปลี่ยน

    if (newVal === "" || isNaN(Number(newVal))) {
      showToast("กรุณากรอกตัวเลขที่ถูกต้อง", "err");
      return;
    }

    setSaving(key);
    try {
      await api.put(`/admin/config/${key}`, { value: newVal });
      setConfig((prev) => ({ ...prev, [key]: newVal }));
      showToast(`บันทึก "${CONFIG_META[key]?.label ?? key}" สำเร็จ ✓`, "ok");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "เกิดข้อผิดพลาด", "err");
      setEditValues((prev) => ({ ...prev, [key]: config[key] })); // reset draft
    } finally {
      setSaving(null);
    }
  }

  function handleCancel(key: string) {
    setEditValues((prev) => ({ ...prev, [key]: config[key] }));
  }

  function isDirty(key: string) {
    return editValues[key] !== config[key];
  }

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />

      <main className="flex-1 p-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-1">ตั้งค่าระบบ</h1>
        <p className="text-gray-400 text-sm mb-8">
          แก้ไขค่าธรรมเนียม · ระยะเวลา · และพารามิเตอร์ต่างๆ ของ App3R
        </p>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 py-20">
            <span className="animate-spin text-xl">⟳</span> กำลังโหลด...
          </div>
        ) : (
          <div className="space-y-8">
            {GROUPS.map((group) => (
              <section key={group.title}>
                {/* Group Header */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{group.icon}</span>
                  <h2 className="text-lg font-semibold">{group.title}</h2>
                </div>

                {/* Config Rows */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  {group.keys.map((key, idx) => {
                    const meta = CONFIG_META[key];
                    const dirty = isDirty(key);
                    const isSaving = saving === key;
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-4 px-5 py-4 ${
                          idx !== 0 ? "border-t border-gray-800" : ""
                        } ${dirty ? "bg-blue-950/20" : ""} transition-colors`}
                      >
                        {/* Label + Description */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{meta?.label ?? key}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{meta?.desc}</div>
                        </div>

                        {/* Input */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="any"
                              value={editValues[key] ?? ""}
                              onChange={(e) =>
                                setEditValues((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave(key);
                                if (e.key === "Escape") handleCancel(key);
                              }}
                              className={`w-28 bg-gray-800 border text-white text-sm text-right rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                dirty ? "border-blue-600" : "border-gray-700"
                              }`}
                            />
                            {meta?.unit && (
                              <span className="absolute right-0 -mr-10 text-xs text-gray-500 w-9 text-left pl-1">
                                {meta.unit}
                              </span>
                            )}
                          </div>

                          {/* Action buttons — แสดงเมื่อค่าเปลี่ยน */}
                          <div className="w-28 flex gap-1.5 ml-2">
                            {dirty ? (
                              <>
                                <button
                                  onClick={() => handleSave(key)}
                                  disabled={isSaving}
                                  className="flex-1 px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                                >
                                  {isSaving ? "..." : "บันทึก"}
                                </button>
                                <button
                                  onClick={() => handleCancel(key)}
                                  disabled={isSaving}
                                  className="px-2 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-700 pl-1">
                                {config[key] === editValues[key] ? "—" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Hint */}
            <p className="text-xs text-gray-600 pb-4">
              💡 แก้ไขตัวเลข แล้วกด <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">บันทึก</kbd> หรือกด <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">Enter</kbd> — กด <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">Esc</kbd> เพื่อยกเลิก
            </p>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium transition-all ${
            toast.type === "ok" ? "bg-green-700 text-white" : "bg-red-700 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
