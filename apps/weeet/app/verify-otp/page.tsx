"use client";
// T-49 — OTP Verification (email_verify / password_reset)
// Wave1 Shell: wired to wave1-auth.wave1VerifyOtp() (mock adapter, d2 contract)
// Flow: /login → /verify-otp?type=email_verify&email=... → /dashboard
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { wave1RequestOtp, wave1VerifyOtp } from "@/lib/wave1-auth";

const OTP_LENGTH = 6;

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";
  const type = (searchParams.get("type") ?? "email_verify") as
    | "email_verify"
    | "password_reset"
    | "phone_verify";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState(""); // dev-only code hint
  const [success, setSuccess] = useState(false);

  // Auto-request OTP on mount
  useEffect(() => {
    if (!email) return;
    (async () => {
      const res = await wave1RequestOtp(email, type);
      if (res.code) setHint(res.code); // dev-only hint
    })();
  }, [email, type]);

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setError("");
    const res = await wave1RequestOtp(email, type);
    if (res.code) setHint(res.code);
    setResending(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== OTP_LENGTH) return;
    setLoading(true);
    setError("");

    const res = await wave1VerifyOtp(email, code, type);
    if (res.verified) {
      setSuccess(true);
      // Redirect based on type
      if (type === "password_reset") {
        router.push("/change-password-first");
      } else {
        router.push("/dashboard");
      }
    } else {
      setError("รหัส OTP ไม่ถูกต้อง กรุณาลองอีกครั้ง");
    }
    setLoading(false);
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-red-400 text-sm">ไม่พบอีเมลในพารามิเตอร์</p>
          <button
            onClick={() => router.push("/login")}
            className="text-weeet-primary text-sm"
          >
            กลับหน้าล็อกอิน
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 pb-20 pt-12">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl mb-2">📩</div>
          <h1 className="text-2xl font-bold text-white">ยืนยันตัวตน</h1>
          <p className="text-gray-400 text-sm">
            ส่งรหัส OTP ไปที่{" "}
            <span className="text-weeet-primary font-medium">{email}</span>
          </p>
        </div>

        {/* Dev hint */}
        {hint && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-xs text-gray-400">
            <p className="font-medium text-gray-300 mb-1">🧪 Dev Mode</p>
            <p>
              รหัส OTP:{" "}
              <code className="bg-gray-700 px-1 rounded text-weeet-primary font-mono">
                {hint}
              </code>
            </p>
          </div>
        )}

        {/* OTP Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300 font-medium">
              รหัส OTP (6 หลัก)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={OTP_LENGTH}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
              placeholder="123456"
              disabled={loading || success}
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-4 text-white text-center text-2xl font-mono tracking-widest placeholder-gray-600 focus:outline-none focus:border-weeet-primary focus:ring-1 focus:ring-weeet-primary transition-colors disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {success && (
            <p className="text-green-400 text-sm bg-green-950/50 border border-green-800 rounded-lg px-3 py-2">
              ✅ ยืนยันสำเร็จ กำลังนำไปยังหน้าถัดไป...
            </p>
          )}

          <button
            type="submit"
            disabled={loading || success || code.length !== OTP_LENGTH}
            className="w-full bg-weeet-primary hover:bg-weeet-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                กำลังตรวจสอบ...
              </>
            ) : (
              "ยืนยัน OTP"
            )}
          </button>
        </form>

        {/* Resend */}
        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-gray-400 hover:text-weeet-primary transition-colors disabled:opacity-50"
          >
            {resending ? "กำลังส่งรหัสใหม่..." : "ส่งรหัสใหม่"}
          </button>
        </div>

        {/* Back */}
        <div className="text-center">
          <button
            onClick={() => router.back()}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            ← กลับ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <span className="text-gray-400">กำลังโหลด...</span>
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
