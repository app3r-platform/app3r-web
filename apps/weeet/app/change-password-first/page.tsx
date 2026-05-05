"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ChangePasswordFirstPage() {
  const router = useRouter();
  const { auth, logout, changePassword, clearForceChange } = useAuth();

  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Guard: only rented WeeeT with forceChangePassword should see this
  useEffect(() => {
    if (!auth.isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!auth.forceChangePassword) {
      router.replace("/dashboard");
    }
  }, [auth.isAuthenticated, auth.forceChangePassword, router]);

  const validate = (): string | null => {
    if (!current) return "กรุณากรอกรหัสผ่านปัจจุบัน";
    if (newPass.length < 8) return "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร";
    if (newPass === current) return "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม";
    if (newPass !== confirm) return "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validErr = validate();
    if (validErr) {
      setError(validErr);
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const ok = changePassword(current, newPass);
    if (!ok) {
      setError("รหัสผ่านปัจจุบันไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    // Clear force-change flag, then force logout → redirect to login with success
    clearForceChange();
    logout();
    router.push("/login?changed=1");
  };

  const strengthScore = (() => {
    if (!newPass) return 0;
    let score = 0;
    if (newPass.length >= 8) score++;
    if (newPass.length >= 12) score++;
    if (/[A-Z]/.test(newPass)) score++;
    if (/[0-9]/.test(newPass)) score++;
    if (/[^A-Za-z0-9]/.test(newPass)) score++;
    return score;
  })();

  const strengthLabel = ["", "อ่อนมาก", "อ่อน", "ปานกลาง", "ดี", "แข็งแกร่ง"][strengthScore];
  const strengthColor = [
    "",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ][strengthScore];

  if (!auth.isAuthenticated || !auth.forceChangePassword) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <span className="text-gray-400">กำลังโหลด...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-orange-600/10 border-b border-orange-800/50 px-4 py-4 flex items-center gap-3">
        <span className="text-2xl">🔐</span>
        <div>
          <h1 className="font-bold text-white">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-xs text-orange-300">กรุณาเปลี่ยนรหัสผ่านก่อนเข้าใช้งาน</p>
        </div>
      </div>

      {/* Notice */}
      <div className="px-4 pt-5">
        <div className="bg-amber-950/40 border border-amber-700 rounded-xl p-4 text-sm text-amber-200 space-y-1">
          <p className="font-semibold flex items-center gap-2">
            <span>⚠️</span> บัญชีประเภท Rented
          </p>
          <p className="text-xs text-amber-300/80">
            บัญชีนี้ถูกสร้างโดยร้านของคุณ คุณต้องเปลี่ยนรหัสผ่านก่อนเข้าใช้งานครั้งแรก
          </p>
          <p className="text-xs text-amber-300/80">
            หลังเปลี่ยนสำเร็จ ระบบจะออกจากระบบอัตโนมัติ — กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 pt-5 pb-8 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current password */}
          <div className="space-y-1.5">
            <label className="text-sm text-gray-300 font-medium">รหัสผ่านปัจจุบัน</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="รหัสผ่านที่ได้รับจากร้าน"
                required
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-lg"
              >
                {showCurrent ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <label className="text-sm text-gray-300 font-medium">รหัสผ่านใหม่</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                required
                minLength={8}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-lg"
              >
                {showNew ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Strength bar */}
            {newPass.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1.5 rounded-full transition-all ${
                        i <= strengthScore ? strengthColor : "bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  ความแข็งแกร่ง:{" "}
                  <span
                    className={
                      strengthScore >= 4
                        ? "text-green-400"
                        : strengthScore >= 3
                        ? "text-blue-400"
                        : strengthScore >= 2
                        ? "text-yellow-400"
                        : "text-red-400"
                    }
                  >
                    {strengthLabel}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className="text-sm text-gray-300 font-medium">ยืนยันรหัสผ่านใหม่</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                required
                className={`w-full bg-gray-800 border rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
                  confirm && newPass !== confirm
                    ? "border-red-600 focus:border-red-500 focus:ring-red-500"
                    : confirm && newPass === confirm
                    ? "border-green-600 focus:border-green-500 focus:ring-green-500"
                    : "border-gray-600 focus:border-orange-500 focus:ring-orange-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-lg"
              >
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>
            {confirm && newPass === confirm && (
              <p className="text-xs text-green-400">✅ รหัสผ่านตรงกัน</p>
            )}
            {confirm && newPass !== confirm && (
              <p className="text-xs text-red-400">❌ รหัสผ่านไม่ตรงกัน</p>
            )}
          </div>

          {/* Requirements */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-xs text-gray-400 space-y-1">
            <p className="font-medium text-gray-300">เงื่อนไขรหัสผ่าน</p>
            <div className={newPass.length >= 8 ? "text-green-400" : ""}>
              {newPass.length >= 8 ? "✅" : "⬜"} อย่างน้อย 8 ตัวอักษร
            </div>
            <div className={newPass !== current || !newPass ? "" : "text-green-400"}>
              {newPass && newPass !== current ? "✅" : "⬜"} ไม่ซ้ำกับรหัสผ่านเดิม
            </div>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || newPass.length < 8 || newPass !== confirm || newPass === current}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                กำลังบันทึก...
              </>
            ) : (
              <>🔐 บันทึกรหัสผ่านใหม่</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
