"use client";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { LoginLockout } from "@/lib/types";

const LOCKOUT_KEY = "weeet_login_lockout";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

function getLockout(): LoginLockout {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { count: 0 };
}

function saveLockout(data: LoginLockout) {
  try {
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(data));
  } catch {}
}

function clearLockout() {
  try {
    localStorage.removeItem(LOCKOUT_KEY);
  } catch {}
}

function getRemainingMinutes(lockedUntil: number): number {
  return Math.ceil((lockedUntil - Date.now()) / 60000);
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockout, setLockout] = useState<LoginLockout>({ count: 0 });
  const [tick, setTick] = useState(0);

  const isImpersonation = searchParams.get("mode") === "impersonation";
  const shopName = searchParams.get("shop") ?? "WeeeR";
  const justChanged = searchParams.get("changed") === "1";

  // Load lockout state on mount
  useEffect(() => {
    setLockout(getLockout());
  }, []);

  // Countdown ticker for lockout remaining time
  useEffect(() => {
    if (!lockout.lockedUntil) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      if (Date.now() >= (lockout.lockedUntil ?? 0)) {
        // Lockout expired
        const reset: LoginLockout = { count: 0 };
        saveLockout(reset);
        setLockout(reset);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockout.lockedUntil]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [auth.isAuthenticated, router]);

  const isLocked = lockout.lockedUntil ? Date.now() < lockout.lockedUntil : false;
  const remainingMinutes = lockout.lockedUntil ? getRemainingMinutes(lockout.lockedUntil) : 0;
  const remainingAttempts = MAX_ATTEMPTS - lockout.count;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isLocked) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const ok = login(email, password, isImpersonation, shopName);
    if (ok) {
      clearLockout();
      setLockout({ count: 0 });
      // Check if force change password (rented account)
      // auth state updates async, so check after login
      const stored = sessionStorage.getItem("weeet_auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.forceChangePassword) {
          router.push("/change-password-first");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/dashboard");
      }
    } else {
      const current = getLockout();
      const newCount = current.count + 1;
      const newLockout: LoginLockout =
        newCount >= MAX_ATTEMPTS
          ? { count: newCount, lockedUntil: Date.now() + LOCKOUT_DURATION_MS }
          : { count: newCount };
      saveLockout(newLockout);
      setLockout(newLockout);

      if (newCount >= MAX_ATTEMPTS) {
        setError("บัญชีถูกล็อกชั่วคราว 30 นาที เนื่องจากป้อนรหัสผ่านผิดหลายครั้ง");
      } else {
        setError(
          `อีเมลหรือรหัสผ่านไม่ถูกต้อง (เหลืออีก ${MAX_ATTEMPTS - newCount} ครั้ง)`
        );
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Impersonation Notice */}
      {isImpersonation && (
        <div className="bg-amber-500 text-amber-950 px-4 py-3 text-sm font-medium flex items-center gap-2">
          <span className="text-lg">👤</span>
          <div>
            <p className="font-bold">โหมดเข้าใช้งานแทนช่าง</p>
            <p className="text-xs">{shopName} กำลังเข้าสู่ระบบในฐานะช่าง</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 pt-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo */}
          <div className="text-center space-y-2">
            <Image
              src="/logo/WeeeT.png"
              alt="WeeeT"
              width={72}
              height={72}
              className="mx-auto"
              priority
            />
            <h1 className="text-3xl font-bold text-white">WeeeT</h1>
            <p className="text-gray-400 text-sm">แอปสำหรับช่าง | App3R Platform</p>
            {isImpersonation && (
              <span className="inline-block bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs">
                🔑 Impersonation Mode
              </span>
            )}
          </div>

          {/* Password changed success */}
          {justChanged && (
            <div className="bg-green-950/50 border border-green-700 rounded-xl px-4 py-3 text-sm text-green-300 flex items-center gap-2">
              <span>✅</span>
              <span>เปลี่ยนรหัสผ่านสำเร็จ — กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่</span>
            </div>
          )}

          {/* Lockout Banner */}
          {isLocked && (
            <div className="bg-red-950/60 border border-red-800 rounded-xl px-4 py-4 text-center space-y-1">
              <p className="text-red-300 font-semibold text-sm">🔒 บัญชีถูกล็อกชั่วคราว</p>
              <p className="text-red-400 text-xs">
                กรุณารอ <span className="font-bold text-red-300">{remainingMinutes} นาที</span> แล้วลองใหม่
              </p>
              <p className="text-gray-500 text-xs">ติดต่อร้านของคุณเพื่อรับรหัสผ่านใหม่ (D16)</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300 font-medium">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                disabled={isLocked}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300 font-medium">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLocked}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {/* Attempt counter warning */}
              {!isLocked && lockout.count > 0 && (
                <p className="text-xs text-amber-400">
                  ⚠️ เหลืออีก {remainingAttempts} ครั้ง ก่อนบัญชีถูกล็อก 30 นาที
                </p>
              )}
            </div>

            {/* No "forgot password" per D16 */}
            <p className="text-xs text-gray-600 text-right">
              ลืมรหัสผ่าน? ติดต่อร้านของคุณโดยตรง
            </p>

            {error && (
              <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  กำลังเข้าสู่ระบบ...
                </>
              ) : isLocked ? (
                `🔒 ล็อก (อีก ${remainingMinutes} นาที)`
              ) : (
                "เข้าสู่ระบบ"
              )}
            </button>
          </form>

          {/* Info */}
          <div className="text-center">
            <p className="text-xs text-gray-600">
              ไม่มีการสมัครสมาชิก — บัญชีช่างสร้างโดยร้านของคุณ
            </p>
          </div>

          {/* Demo hint */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-xs text-gray-400 space-y-1">
            <p className="font-medium text-gray-300 mb-1">🧪 Demo Mode</p>
            <p>กรอกอีเมลใดก็ได้ + รหัสผ่านใดก็ได้ เพื่อทดสอบ</p>
            <p className="text-orange-300">ใช้รหัส <code className="bg-gray-700 px-1 rounded">changeme123</code> เพื่อจำลอง Rented WeeeT (บังคับเปลี่ยนรหัส)</p>
            {isImpersonation && (
              <p className="text-amber-400">⚡ Impersonation: จาก {shopName}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <span className="text-gray-400">กำลังโหลด...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
