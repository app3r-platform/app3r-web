"use client";
// ============================================================
// components/listings/AreaSelect.tsx — Client Component
// QF4 fix: แยก <select onChange> ออกจาก Server Component
// Root cause: Server Component ใน Next.js 15 ห้าม event handler props
// Pattern: useRouter + useSearchParams (ต้อง wrap ด้วย <Suspense>)
// ============================================================
import { useRouter, useSearchParams } from "next/navigation";

interface AreaSelectProps {
  areas: string[];
  current?: string;
  accentColor?: "blue" | "orange";
}

export default function AreaSelect({ areas, current, accentColor = "blue" }: AreaSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("area", e.target.value);
    } else {
      params.delete("area");
    }
    router.push(`?${params.toString()}`);
  };

  const ringColor = accentColor === "blue" ? "focus:ring-blue-500" : "focus:ring-orange-500";

  return (
    <select
      value={current ?? ""}
      onChange={handleChange}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ringColor}`}
    >
      <option value="">ทุกจังหวัด</option>
      {areas.map((area) => (
        <option key={area} value={area}>
          {area}
        </option>
      ))}
    </select>
  );
}
