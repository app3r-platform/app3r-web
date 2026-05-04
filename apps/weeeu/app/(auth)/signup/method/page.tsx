import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "เลือกวิธีสมัคร" };

// D12: Social login ยังไม่เปิด (Phase 2b)
const methods = [
  {
    id: "email",
    icon: "✉️",
    label: "สมัครด้วย Email",
    desc: "ใช้ Email และตั้งรหัสผ่านได้เลย",
    href: "/signup/email",
    enabled: true,
  },
  {
    id: "google",
    icon: "🔴",
    label: "สมัครด้วย Google",
    desc: "เร็วๆ นี้จะมา (post-Phase 2b)",
    href: null,
    enabled: false,
  },
  {
    id: "facebook",
    icon: "🔵",
    label: "สมัครด้วย Facebook",
    desc: "เร็วๆ นี้จะมา (post-Phase 2b)",
    href: null,
    enabled: false,
  },
];

export default function SignupMethodPage() {
  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-2">
        {[1, 2, 3, 4, 5, 6, 7].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s === 1 ? "bg-blue-600" : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 -mt-4">ขั้นตอนที่ 1 จาก 7</p>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">สมัครสมาชิก</h2>
        <p className="text-gray-500 text-sm mt-1">เลือกวิธีที่สะดวก</p>
      </div>

      <div className="space-y-3">
        {methods.map((m) =>
          m.enabled ? (
            <Link
              key={m.id}
              href={m.href!}
              className="flex items-center gap-4 p-4 border-2 border-blue-600 rounded-2xl hover:bg-blue-50 transition-colors"
            >
              <span className="text-2xl">{m.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
              </div>
              <span className="text-blue-600 text-lg">›</span>
            </Link>
          ) : (
            <div
              key={m.id}
              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-2xl opacity-50 cursor-not-allowed select-none"
            >
              <span className="text-2xl">{m.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-400 text-sm">{m.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">เร็วๆ นี้</span>
            </div>
          )
        )}
      </div>

      <p className="text-center text-sm text-gray-500">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-800">
          เข้าสู่ระบบ
        </Link>
      </p>

      <div className="flex justify-center">
        <Link href="/welcome" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
          ‹ กลับ
        </Link>
      </div>
    </div>
  );
}
