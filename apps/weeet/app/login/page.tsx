"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Impersonation mode: ?mode=impersonation&shop=FixPro+Service
  const isImpersonation = searchParams.get("mode") === "impersonation";
  const shopName = searchParams.get("shop") ?? "WeeeR";

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [auth.isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600)); // simulate network

    const ok = login(email, password, isImpersonation, shopName);
    if (ok) {
      router.push("/dashboard");
    } else {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
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

      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 pt-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="text-6xl">🔧</div>
            <h1 className="text-3xl font-bold text-white">WeeeT</h1>
            <p className="text-gray-400 text-sm">แอปสำหรับช่าง | App3R Platform</p>
            {isImpersonation && (
              <span className="inline-block bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs">
                🔑 Impersonation Mode
              </span>
            )}
          </div>

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
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
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
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  กำลังเข้าสู่ระบบ...
                </>
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
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-xs text-gray-400">
            <p className="font-medium text-gray-300 mb-1">🧪 Demo Mode</p>
            <p>กรอกอีเมลใดก็ได้ + รหัสผ่านใดก็ได้ เพื่อทดสอบ</p>
            {isImpersonation && (
              <p className="text-amber-400 mt-1">⚡ Impersonation: จาก {shopName}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><span className="text-gray-400">กำลังโหลด...</span></div>}>
      <LoginForm />
    </Suspense>
  );
}
