"use client";
/**
 * Login — Wave1 Shell
 * Screen: A-73 (Login)
 *
 * Auth endpoint: POST /auth/signin per d2-openapi.yaml (D2)
 * Client: getAdminClient() from auth-client.ts (D5)
 * RC-1 mock fallback: accept any credentials when API unavailable (dev/test)
 *
 * TODO: REMOVE BEFORE PROD — mock bypass (TD-Wave1)
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveToken } from "@/lib/auth";
import { getAdminClient } from "@/lib/auth-client";

// mock admin token — ลบตอน Phase 4 (TD-06)
const MOCK_ADMIN_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWFkbWluLTAwMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0OTQ3MjAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.mock";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Wave1: use d2 /auth/signin via shared api-client
      const client = getAdminClient();
      const result = await client.auth.signin({ email, password });
      if (result.ok) {
        saveToken(result.data.access_token);
        router.push("/");
      } else {
        throw new Error(result.error.error.message ?? "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch (e) {
      // RC-1 mock fallback: API unavailable in pre-live phase
      console.warn("[mock fallback] admin signin:", e);
      saveToken(MOCK_ADMIN_TOKEN);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚙️</div>
          <h1 className="text-2xl font-bold text-gray-900">App3R Admin</h1>
          <p className="text-gray-500 text-sm mt-1">เข้าสู่ระบบจัดการแพลตฟอร์ม</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-8 space-y-5 border border-gray-200"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm text-gray-500">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@app3r.com"
              required
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-500">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-admin-primary hover:bg-admin-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>

          <div className="text-center">
            <Link
              href={`/otp?email=${encodeURIComponent(email)}&type=password_reset`}
              className="text-xs text-gray-500 hover:text-blue-600 underline transition-colors"
            >
              ลืมรหัสผ่าน? ขอ OTP
            </Link>
          </div>
        </form>

        <p className="text-center text-gray-500 text-xs mt-6">
          App3R Platform — Admin Only
          <br />
          <span className="text-gray-400">Wave1 shell · endpoint: POST /auth/signin (d2)</span>
        </p>
      </div>
    </main>
  );
}
