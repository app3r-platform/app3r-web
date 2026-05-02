"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "หน้าแรก" },
  { href: "/jobs", icon: "🔧", label: "งาน" },
  { href: "/parts", icon: "📦", label: "อะไหล่" },
  { href: "/reports", icon: "📊", label: "รายงาน" },
  { href: "/profile", icon: "👤", label: "โปรไฟล์" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-40 safe-bottom">
      <div className="max-w-md mx-auto flex">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                isActive
                  ? "text-orange-400"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={isActive ? "font-semibold" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
