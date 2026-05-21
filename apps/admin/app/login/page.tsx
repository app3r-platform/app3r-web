"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveToken } from "@/lib/auth";

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
      const data = await api.post<{ access_token: string }>("/auth/admin/login", { email, password });
      saveToken(data.access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
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
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 space-y-5 border border-gray-200">

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-700 text-sm px-4 py-3 rounded-lg">
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
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:outline-none focus:border-admin-primary placeholder-gray-400"
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
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:outline-none focus:border-admin-primary placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-admin-primary hover:bg-admin-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          App3R Platform — Admin Only
        </p>
      </div>
    </main>
  );
}
