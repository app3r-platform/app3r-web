"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignupSteps } from "../page";

export default function SignupVerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [otpLoading, setOtpLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Mock email: ดึงจาก sessionStorage หรือ context — ใช้ mock ชั่วคราว
  const maskedEmail = "exam***@email.com";
  const maskedPhone = "081-***-5678";

  useEffect(() => {
    const t = setInterval(() => setResendTimer((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  function handleOtp(i: number, v: string) {
    if (!/^[0-9]?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (!v && i > 0) inputs.current[i - 1]?.focus();
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length < 6) { setOtpError("กรุณากรอก OTP 6 หลักให้ครบ"); return; }
    setOtpLoading(true);
    setOtpError("");
    // POST /api/v1/auth/verify-otp
    setTimeout(() => {
      setOtpLoading(false);
      // Mock: OTP ถูก → ไปหน้าถัดไป
      router.push("/signup/business-type");
    }, 800);
  }

  function handleResend() {
    if (resendTimer > 0) return;
    setResendTimer(60);
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    inputs.current[0]?.focus();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">♻️</div>
          <h1 className="text-2xl font-bold text-green-800">ยืนยันตัวตน</h1>
          <p className="text-sm text-gray-500 mt-1">กรอก OTP และยืนยันอีเมล</p>
        </div>

        <SignupSteps current={2} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* OTP Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-700 text-white text-xs flex items-center justify-center font-bold">1</span>
              <span className="font-semibold text-gray-800">ยืนยัน OTP เบอร์โทร</span>
            </div>
            <p className="text-sm text-gray-500 pl-8">
              ส่ง OTP ไปยัง <span className="font-medium text-gray-700">{maskedPhone}</span>
              <br /><span className="text-xs text-gray-400">OTP หมดอายุใน 5 นาที (สูงสุด 5 ครั้ง/ชม.)</span>
            </p>
            <div className="flex gap-2 justify-center pl-8">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtp(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-10 h-12 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-green-500 border-gray-200"
                />
              ))}
            </div>
            {otpError && <p className="text-xs text-red-500 text-center pl-8">{otpError}</p>}
            <div className="pl-8 flex items-center gap-3">
              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading || otp.join("").length < 6}
                className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {otpLoading ? "กำลังตรวจสอบ…" : "ยืนยัน OTP"}
              </button>
              <button
                onClick={handleResend}
                disabled={resendTimer > 0}
                className="text-sm text-green-700 disabled:text-gray-400"
              >
                {resendTimer > 0 ? `ส่งใหม่ใน ${resendTimer}s` : "ส่ง OTP ใหม่"}
              </button>
            </div>
          </div>

          {/* Email Verify Section */}
          <div className="space-y-3 border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-700 text-white text-xs flex items-center justify-center font-bold">2</span>
              <span className="font-semibold text-gray-800">ยืนยันอีเมล</span>
            </div>
            <p className="text-sm text-gray-500 pl-8">
              ส่งลิงก์ยืนยันไปที่ <span className="font-medium text-gray-700">{maskedEmail}</span>
            </p>
            {emailVerified ? (
              <div className="pl-8 flex items-center gap-2 text-green-600 text-sm font-medium">
                <span>✅</span> ยืนยันอีเมลเรียบร้อยแล้ว
              </div>
            ) : (
              <div className="pl-8 space-y-2">
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <span>⏳</span> รอยืนยัน — ตรวจสอบกล่องจดหมาย
                </div>
                <button
                  onClick={() => setEmailVerified(true)} // Mock
                  className="text-sm text-green-700 hover:underline"
                >
                  ส่งอีเมลยืนยันอีกครั้ง
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            ระบบจะดำเนินการต่อหลังยืนยัน OTP เสร็จสมบูรณ์
          </p>
        </div>
      </div>
    </div>
  );
}
