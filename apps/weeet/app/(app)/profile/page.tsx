"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { auth, logout } = useAuth();
  const router = useRouter();
  const tech = auth.technician;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <h1 className="text-xl font-bold text-white">โปรไฟล์ / ตั้งค่า</h1>

      {/* Avatar + Info */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-orange-600 flex items-center justify-center text-3xl font-bold flex-shrink-0">
          {tech?.name?.[0] ?? "ช"}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white text-lg">{tech?.name}</h2>
          <p className="text-gray-400 text-sm">{tech?.shopName}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {tech?.specialties.map((s) => (
              <span key={s} className="text-xs bg-orange-900/50 text-orange-300 border border-orange-800 px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700">
        {[
          { label: "โทรศัพท์", value: tech?.phone, icon: "📞" },
          { label: "อีเมล", value: tech?.email, icon: "📧" },
          { label: "ร้าน", value: tech?.shopName, icon: "🏪" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 px-4 py-3">
            <span className="text-lg">{item.icon}</span>
            <div className="flex-1">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-sm text-white">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="space-y-2">
        <h2 className="font-semibold text-white text-sm">ตั้งค่า</h2>
        <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700">
          {[
            { label: "แจ้งเตือน", icon: "🔔" },
            { label: "ภาษา", icon: "🌐", value: "ไทย" },
            { label: "เกี่ยวกับแอป", icon: "ℹ️", value: "v1.0.0" },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors text-left"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-sm text-white">{item.label}</span>
              <span className="text-xs text-gray-500">{item.value ?? "›"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Impersonation info */}
      {auth.isImpersonated && (
        <div className="bg-amber-950/50 border border-amber-800 rounded-xl p-4 text-sm text-amber-200">
          <p className="font-semibold flex items-center gap-2">
            <span>👤</span> โหมด Impersonation
          </p>
          <p className="text-xs text-amber-300/70 mt-1">
            บัญชีนี้ถูกเข้าใช้งานโดย {auth.impersonatedByShop ?? "WeeeR"}
          </p>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-gray-800 hover:bg-red-950 border border-gray-700 hover:border-red-800 text-gray-300 hover:text-red-300 font-medium py-3 rounded-xl transition-colors"
      >
        🚪 ออกจากระบบ
      </button>
    </div>
  );
}
