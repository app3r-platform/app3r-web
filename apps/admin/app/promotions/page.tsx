"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Config {
  [key: string]: string;
}

interface UserSearchResult {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
}

interface PaginatedUsers {
  items: UserSearchResult[];
  total: number;
}

const REASON_CATEGORIES = [
  "แก้ไขข้อผิดพลาดของระบบ",
  "คืน Point กรณีข้อพิพาท",
  "คืนเงินนอกระบบ (เงินสด)",
  "โบนัสพิเศษจาก Admin",
  "ปรับยอดตามคำร้องขอ",
  "อื่นๆ",
];

const PROMOS = [
  {
    key: "promo_free_repair",
    label: "ฟรีค่าบริการ — ซ่อมเครื่องใช้ไฟฟ้า",
    type: "C",
    desc: "ยกเว้น Platform Fee สำหรับงานซ่อม (Type C) ทั้งผู้ประกาศและผู้ยื่นข้อเสนอ",
    color: "orange",
  },
  {
    key: "promo_free_secondhand",
    label: "ฟรีค่าบริการ — ซื้อขายเครื่องใช้ไฟฟ้ามือสอง",
    type: "A",
    desc: "ยกเว้น Platform Fee สำหรับการซื้อขายมือสอง (Type A) ทั้งผู้ประกาศและผู้ยื่นข้อเสนอ",
    color: "blue",
  },
  {
    key: "promo_free_maintenance",
    label: "ฟรีค่าบริการ — บำรุงรักษาเครื่องใช้ไฟฟ้า",
    type: "D",
    desc: "ยกเว้น Platform Fee สำหรับงานบำรุงรักษา (Type D) ทั้งผู้ประกาศและผู้ยื่นข้อเสนอ",
    color: "purple",
  },
  {
    key: "promo_free_scrap",
    label: "ฟรีค่าบริการ — ประกาศขาย/ทิ้งเครื่องใช้ไฟฟ้า",
    type: "B",
    desc: "ยกเว้น Platform Fee สำหรับการขาย/ทิ้งซาก (Type B)",
    color: "gray",
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<Config>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Manual adjust state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [adjustDirection, setAdjustDirection] = useState<"credit" | "debit">("credit");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustCategory, setAdjustCategory] = useState("");
  const [adjustDetail, setAdjustDetail] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Signup bonus local edits
  const [bonusPoints, setBonusPoints] = useState("");

  // ── Fetch config ──────────────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<Config>("/admin/config");
      setConfig(result);
      setBonusPoints(result["signup_bonus_points"] ?? "0");
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchConfig();
  }, [fetchConfig, router]);

  // ── Toggle promo ──────────────────────────────────────────────────────────
  async function togglePromo(key: string, currentValue: string) {
    const newValue = currentValue === "true" ? "false" : "true";
    setSaving(key);
    try {
      await api.put(`/admin/config/${key}`, { value: newValue });
      setConfig((prev) => ({ ...prev, [key]: newValue }));
      showToast(newValue === "true" ? "เปิดโปรโมชันแล้ว ✓" : "ปิดโปรโมชันแล้ว", "ok");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "เกิดข้อผิดพลาด", "err");
    } finally {
      setSaving(null);
    }
  }

  // ── Toggle signup bonus ───────────────────────────────────────────────────
  async function toggleSignupBonus() {
    const currentValue = config["signup_bonus_enabled"] ?? "false";
    const newValue = currentValue === "true" ? "false" : "true";
    setSaving("signup_bonus_enabled");
    try {
      await api.put("/admin/config/signup_bonus_enabled", { value: newValue });
      setConfig((prev) => ({ ...prev, signup_bonus_enabled: newValue }));
      showToast(newValue === "true" ? "เปิด Signup Bonus แล้ว ✓" : "ปิด Signup Bonus แล้ว", "ok");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "เกิดข้อผิดพลาด", "err");
    } finally {
      setSaving(null);
    }
  }

  async function saveSignupBonusPoints() {
    const val = parseInt(bonusPoints);
    if (isNaN(val) || val < 0) {
      showToast("กรุณาระบุจำนวน Point ที่ถูกต้อง", "err");
      return;
    }
    setSaving("signup_bonus_points");
    try {
      await api.put("/admin/config/signup_bonus_points", { value: String(val) });
      setConfig((prev) => ({ ...prev, signup_bonus_points: String(val) }));
      showToast(`บันทึกแล้ว: ${val} Points ต่อการสมัคร`, "ok");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "เกิดข้อผิดพลาด", "err");
    } finally {
      setSaving(null);
    }
  }

  // ── Search users for manual adjust ────────────────────────────────────────
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ search: searchQuery, limit: "10" });
      const result = await api.get<PaginatedUsers>(`/admin/users?${params}`);
      setSearchResults(result.items.filter((u) => u.role === "weeeu" || u.role === "weeer"));
    } catch {
      showToast("ค้นหาไม่สำเร็จ", "err");
    } finally {
      setSearching(false);
    }
  }

  // ── Submit manual adjust ──────────────────────────────────────────────────
  async function handleAdjust() {
    if (!selectedUser) return showToast("กรุณาเลือกผู้ใช้", "err");
    const amt = parseFloat(adjustAmount);
    if (!adjustAmount || isNaN(amt) || amt <= 0) return showToast("กรุณาระบุจำนวน Point ที่ถูกต้อง", "err");
    if (!adjustCategory) return showToast("กรุณาเลือกหมวดหมู่เหตุผล", "err");
    if (adjustDetail.trim().length < 10) return showToast("กรุณาระบุรายละเอียดอย่างน้อย 10 ตัวอักษร", "err");

    setAdjustLoading(true);
    try {
      const res = await api.post<{ success: boolean; balance_after: number; transaction_id: number }>(
        "/admin/points/manual-adjust",
        {
          user_id: selectedUser.id,
          direction: adjustDirection,
          amount: amt,
          reason_category: adjustCategory,
          reason_detail: adjustDetail.trim(),
        }
      );
      showToast(
        `${adjustDirection === "credit" ? "เพิ่ม" : "หัก"} ${amt.toLocaleString("th-TH")} Points ` +
        `สำหรับ ${selectedUser.full_name} สำเร็จ ✓  (ยอดใหม่: ${res.balance_after.toLocaleString("th-TH")} Points)`,
        "ok"
      );
      // Reset form
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
      setAdjustAmount("");
      setAdjustCategory("");
      setAdjustDetail("");
      setAdjustDirection("credit");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "เกิดข้อผิดพลาด", "err");
    } finally {
      setAdjustLoading(false);
    }
  }

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950 text-white">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center text-gray-500">
          <span className="animate-spin mr-3 text-xl">⟳</span> กำลังโหลด...
        </main>
      </div>
    );
  }

  const signupBonusOn = config["signup_bonus_enabled"] === "true";

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />

      <main className="flex-1 p-8 min-w-0 max-w-4xl">

        {/* ══ Section 1: Promotions ══════════════════════════════════════════ */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold mb-1">โปรโมชัน — ฟรีค่าบริการ</h1>
          <p className="text-gray-400 text-sm mb-6">
            เปิดเพื่อยกเว้น Platform Fee สำหรับงานประเภทนั้น ทั้งผู้ประกาศและผู้ยื่นข้อเสนอ
          </p>

          <div className="grid grid-cols-1 gap-4">
            {PROMOS.map((promo) => {
              const isOn = config[promo.key] === "true";
              const isSaving = saving === promo.key;
              return (
                <div
                  key={promo.key}
                  className={`flex items-center justify-between p-5 rounded-xl border transition-all ${
                    isOn
                      ? "bg-green-950 border-green-700"
                      : "bg-gray-900 border-gray-800"
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isOn ? "bg-green-700 text-white" : "bg-gray-700 text-gray-400"
                      }`}>
                        Type {promo.type}
                      </span>
                      <span className={`font-semibold ${isOn ? "text-white" : "text-gray-300"}`}>
                        {promo.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{promo.desc}</p>
                  </div>

                  <button
                    onClick={() => togglePromo(promo.key, config[promo.key] ?? "false")}
                    disabled={isSaving}
                    className={`flex-shrink-0 relative inline-flex h-7 w-13 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60 ${
                      isOn ? "bg-green-600" : "bg-gray-600"
                    }`}
                    style={{ width: "52px" }}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        isOn ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ Section 2: Signup Bonus ════════════════════════════════════════ */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-1">Signup Bonus</h2>
          <p className="text-gray-400 text-sm mb-5">
            เติม Point อัตโนมัติให้ WeeeU และ WeeeR ทุกคนที่สมัครใหม่
          </p>

          <div className={`p-5 rounded-xl border transition-all ${
            signupBonusOn ? "bg-blue-950 border-blue-700" : "bg-gray-900 border-gray-800"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className={`font-semibold ${signupBonusOn ? "text-white" : "text-gray-300"}`}>
                  เปิด/ปิด Signup Bonus
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {signupBonusOn
                    ? `เปิดอยู่ — สมัครใหม่ได้รับ ${config["signup_bonus_points"] ?? "0"} Points ทันที`
                    : "ปิดอยู่ — ผู้สมัครใหม่ไม่ได้รับ Point พิเศษ"}
                </div>
              </div>
              <button
                onClick={toggleSignupBonus}
                disabled={saving === "signup_bonus_enabled"}
                className={`flex-shrink-0 relative inline-flex h-7 items-center rounded-full transition-colors disabled:opacity-60 ${
                  signupBonusOn ? "bg-blue-600" : "bg-gray-600"
                }`}
                style={{ width: "52px" }}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    signupBonusOn ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-2">
                  จำนวน Point ที่มอบให้ต่อการสมัคร
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(e.target.value)}
                    className="w-40 bg-gray-800 border border-gray-700 text-white text-lg font-bold rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 text-sm">Points</span>
                </div>
              </div>
              <button
                onClick={saveSignupBonusPoints}
                disabled={saving === "signup_bonus_points"}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                {saving === "signup_bonus_points" ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>

        {/* ══ Section 3: Manual Point Adjustment ════════════════════════════ */}
        <div>
          <h2 className="text-xl font-bold mb-1">ปรับ Point ด้วยมือ</h2>
          <p className="text-gray-400 text-sm mb-5">
            เพิ่มหรือหัก Point ให้ WeeeU / WeeeR — บังคับระบุหมวดหมู่และรายละเอียดทุกครั้ง
          </p>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">

            {/* Search User */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                ค้นหาผู้ใช้ (WeeeU / WeeeR) <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="ชื่อ หรือ email หรือ เบอร์โทร..."
                  className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-4 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm rounded-lg"
                >
                  {searching ? "..." : "ค้นหา"}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && !selectedUser && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setSearchResults([]); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left border-b border-gray-700 last:border-0"
                    >
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.role === "weeeu" ? "bg-blue-900 text-blue-300" : "bg-green-900 text-green-300"
                      }`}>
                        {u.role === "weeeu" ? "WeeeU" : "WeeeR"}
                      </span>
                      <div>
                        <div className="font-medium text-white text-sm">{u.full_name}</div>
                        <div className="text-xs text-gray-500">{u.email ?? u.phone}</div>
                      </div>
                      <span className="ml-auto text-xs text-gray-600">#{u.id}</span>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !searching && !selectedUser && (
                <p className="text-sm text-gray-600">ไม่พบผู้ใช้ที่เป็น WeeeU/WeeeR ตรงกับคำค้นหา</p>
              )}

              {/* Selected User */}
              {selectedUser && (
                <div className="flex items-center gap-3 bg-blue-950 border border-blue-800 rounded-xl px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    selectedUser.role === "weeeu" ? "bg-blue-700 text-white" : "bg-green-700 text-white"
                  }`}>
                    {selectedUser.role === "weeeu" ? "WeeeU" : "WeeeR"}
                  </span>
                  <div className="flex-1">
                    <span className="font-semibold text-white">{selectedUser.full_name}</span>
                    <span className="text-gray-400 text-sm ml-2">{selectedUser.email ?? selectedUser.phone}</span>
                  </div>
                  <button
                    onClick={() => { setSelectedUser(null); setSearchQuery(""); }}
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    ✕ เปลี่ยน
                  </button>
                </div>
              )}
            </div>

            {/* Direction + Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  ประเภท <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustDirection("credit")}
                    className={`flex-1 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                      adjustDirection === "credit"
                        ? "bg-green-700 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    ➕ เพิ่ม Point
                  </button>
                  <button
                    onClick={() => setAdjustDirection("debit")}
                    className={`flex-1 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                      adjustDirection === "debit"
                        ? "bg-red-700 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    ➖ หัก Point
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  จำนวน Point <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="เช่น 100"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
                />
              </div>
            </div>

            {/* Reason Category */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                หมวดหมู่เหตุผล <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {REASON_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAdjustCategory(cat)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      adjustCategory === cat
                        ? "bg-blue-700 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Detail */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                รายละเอียด <span className="text-red-400">* (อย่างน้อย 10 ตัวอักษร)</span>
              </label>
              <textarea
                value={adjustDetail}
                onChange={(e) => setAdjustDetail(e.target.value)}
                placeholder="อธิบายเหตุผลให้ครบถ้วน เช่น เลขที่ transaction ที่เกิดปัญหา, วันที่เกิดเหตุ, การตกลงกับผู้ใช้..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 resize-none"
              />
              <div className="text-xs text-gray-600 mt-1 text-right">
                {adjustDetail.length} / 10 ตัวอักษรขั้นต่ำ
              </div>
            </div>

            {/* Preview */}
            {selectedUser && adjustAmount && adjustCategory && adjustDetail.length >= 10 && (
              <div className={`p-4 rounded-xl border text-sm ${
                adjustDirection === "credit"
                  ? "bg-green-950 border-green-800"
                  : "bg-red-950 border-red-800"
              }`}>
                <div className="font-medium mb-2 text-white">ตัวอย่างรายการที่จะบันทึก:</div>
                <div className="text-gray-300 space-y-1">
                  <div>ผู้รับ: <span className="text-white font-medium">{selectedUser.full_name}</span></div>
                  <div>
                    ประเภท:{" "}
                    <span className={adjustDirection === "credit" ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                      {adjustDirection === "credit" ? `+${parseFloat(adjustAmount || "0").toLocaleString("th-TH")}` : `-${parseFloat(adjustAmount || "0").toLocaleString("th-TH")}`} Points
                    </span>
                  </div>
                  <div>เหตุผล: <span className="text-white">[{adjustCategory}] {adjustDetail.trim()}</span></div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleAdjust}
              disabled={adjustLoading || !selectedUser || !adjustAmount || !adjustCategory || adjustDetail.length < 10}
              className={`w-full py-3 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                adjustDirection === "credit"
                  ? "bg-green-700 hover:bg-green-600 text-white"
                  : "bg-red-700 hover:bg-red-600 text-white"
              }`}
            >
              {adjustLoading
                ? "กำลังดำเนินการ..."
                : adjustDirection === "credit"
                ? "✓ ยืนยันเพิ่ม Point"
                : "✓ ยืนยันหัก Point"}
            </button>
          </div>
        </div>

      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 max-w-sm px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium ${
          toast.type === "ok" ? "bg-green-700 text-white" : "bg-red-700 text-white"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
