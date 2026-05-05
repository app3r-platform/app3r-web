"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const router = useRouter();
  const { auth, logout, changePassword } = useAuth();

  // GPS & Notification toggles
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [notifyJob, setNotifyJob] = useState(true);
  const [notifyParts, setNotifyParts] = useState(true);
  const [notifyPromo, setNotifyPromo] = useState(false);
  const [language, setLanguage] = useState<"th" | "en">("th");

  // Change-password modal state
  const [showChangePass, setShowChangePass] = useState(false);
  const [cpCurrent, setCpCurrent] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpError, setCpError] = useState("");
  const [cpSuccess, setCpSuccess] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const resetChangePass = () => {
    setCpCurrent(""); setCpNew(""); setCpConfirm("");
    setCpError(""); setCpSuccess(false); setCpLoading(false);
    setShowPwCurrent(false); setShowPwNew(false);
  };

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError("");
    if (!cpCurrent) { setCpError("กรุณากรอกรหัสผ่านปัจจุบัน"); return; }
    if (cpNew.length < 8) { setCpError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
    if (cpNew === cpCurrent) { setCpError("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม"); return; }
    if (cpNew !== cpConfirm) { setCpError("รหัสผ่านใหม่และยืนยันไม่ตรงกัน"); return; }

    setCpLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const ok = changePassword(cpCurrent, cpNew);
    if (!ok) { setCpError("รหัสผ่านปัจจุบันไม่ถูกต้อง"); setCpLoading(false); return; }

    setCpLoading(false);
    setCpSuccess(true);
    setTimeout(() => {
      setShowChangePass(false);
      resetChangePass();
    }, 1500);
  };

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-lg"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-white">ตั้งค่า</h1>
      </div>

      {/* Account */}
      <SettingSection title="บัญชี">
        <SettingRow
          icon="🔒"
          label="เปลี่ยนรหัสผ่าน"
          value={auth.accountType === "rented" ? "Rented" : "Default"}
          onClick={() => { setShowChangePass(true); resetChangePass(); }}
          arrow
        />
      </SettingSection>

      {/* Location */}
      <SettingSection title="ตำแหน่งที่ตั้ง">
        <SettingRow
          icon="📍"
          label="เปิด GPS ตลอดเวลา"
          description="ช่วยให้ WeeeR ติดตามตำแหน่งของคุณได้"
          value={
            <Toggle value={gpsEnabled} onChange={setGpsEnabled} />
          }
        />
      </SettingSection>

      {/* Notifications */}
      <SettingSection title="การแจ้งเตือน">
        <SettingRow
          icon="🔔"
          label="งานใหม่ / อัปเดตงาน"
          value={<Toggle value={notifyJob} onChange={setNotifyJob} />}
        />
        <SettingRow
          icon="📦"
          label="สถานะอะไหล่"
          description="เมื่ออะไหล่ที่ขอเบิกพร้อม"
          value={<Toggle value={notifyParts} onChange={setNotifyParts} />}
        />
        <SettingRow
          icon="🎉"
          label="โปรโมชัน / ข่าวสาร"
          value={<Toggle value={notifyPromo} onChange={setNotifyPromo} />}
        />
      </SettingSection>

      {/* Language */}
      <SettingSection title="ภาษา">
        <div className="px-4 py-3 flex items-center gap-3">
          <span className="text-lg">🌐</span>
          <span className="flex-1 text-sm text-white">ภาษา</span>
          <div className="flex gap-1 bg-gray-700 p-0.5 rounded-lg">
            {(["th", "en"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  language === lang
                    ? "bg-orange-600 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {lang === "th" ? "ไทย" : "EN"}
              </button>
            ))}
          </div>
        </div>
      </SettingSection>

      {/* About */}
      <SettingSection title="เกี่ยวกับแอป">
        <SettingRow icon="ℹ️" label="เวอร์ชัน" value="v1.0.0 (R-02)" />
        <SettingRow icon="🏢" label="แพลตฟอร์ม" value="App3R Platform" />
        <SettingRow icon="📋" label="Layer" value="WeeeT — ช่าง" />
        {auth.accountType && (
          <SettingRow
            icon="👤"
            label="ประเภทบัญชี"
            value={auth.accountType === "rented" ? "Rented (เช่า)" : "Default (อัตโนมัติ)"}
          />
        )}
      </SettingSection>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-gray-800 hover:bg-red-950 border border-gray-700 hover:border-red-800 text-gray-300 hover:text-red-300 font-medium py-3 rounded-xl transition-colors"
      >
        🚪 ออกจากระบบ
      </button>

      {/* No delete account, no wallet per D15 */}
      <p className="text-center text-xs text-gray-600">
        บัญชีช่างจัดการโดยร้านของคุณ — ไม่สามารถลบบัญชีได้
      </p>

      {/* Change Password Modal */}
      {showChangePass && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full max-w-md mx-auto bg-gray-900 rounded-t-2xl border-t border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">เปลี่ยนรหัสผ่าน</h2>
              <button
                onClick={() => { setShowChangePass(false); resetChangePass(); }}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            {cpSuccess ? (
              <div className="bg-green-950/50 border border-green-700 rounded-xl p-4 text-center">
                <p className="text-green-300 font-semibold">✅ เปลี่ยนรหัสผ่านสำเร็จ</p>
              </div>
            ) : (
              <form onSubmit={handleChangePass} className="space-y-3">
                {/* Current */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">รหัสผ่านปัจจุบัน</label>
                  <div className="relative">
                    <input
                      type={showPwCurrent ? "text" : "password"}
                      value={cpCurrent}
                      onChange={(e) => setCpCurrent(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                    <button type="button" onClick={() => setShowPwCurrent(!showPwCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwCurrent ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                {/* New */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</label>
                  <div className="relative">
                    <input
                      type={showPwNew ? "text" : "password"}
                      value={cpNew}
                      onChange={(e) => setCpNew(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                    <button type="button" onClick={() => setShowPwNew(!showPwNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwNew ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                {/* Confirm */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">ยืนยันรหัสผ่านใหม่</label>
                  <input
                    type="password"
                    value={cpConfirm}
                    onChange={(e) => setCpConfirm(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full bg-gray-800 border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-colors ${
                      cpConfirm && cpNew !== cpConfirm
                        ? "border-red-600"
                        : cpConfirm && cpNew === cpConfirm
                        ? "border-green-600"
                        : "border-gray-600 focus:border-orange-500"
                    }`}
                  />
                </div>

                {cpError && (
                  <p className="text-xs text-red-400 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
                    {cpError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={cpLoading || cpNew.length < 8 || cpNew !== cpConfirm}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {cpLoading ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-semibold text-white text-sm mb-2">{title}</h2>
      <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700">
        {children}
      </div>
    </div>
  );
}

function SettingRow({
  icon, label, description, value, onClick, arrow,
}: {
  icon: string;
  label: string;
  description?: string;
  value?: React.ReactNode;
  onClick?: () => void;
  arrow?: boolean;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        onClick ? "hover:bg-gray-700/50 cursor-pointer" : ""
      }`}
    >
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      {typeof value === "string" ? (
        <span className="text-xs text-gray-400">{value}</span>
      ) : (
        value
      )}
      {arrow && <span className="text-gray-500 text-sm ml-1">›</span>}
    </Wrapper>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        value ? "bg-orange-600" : "bg-gray-600"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
