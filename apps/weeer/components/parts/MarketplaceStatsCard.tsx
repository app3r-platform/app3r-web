"use client";

interface MarketplaceStatsCardProps {
  totalListings: number;
  totalShops: number;
  ordersActive: number;
  volumeToday: number;
}

export function MarketplaceStatsCard({
  totalListings, totalShops, ordersActive, volumeToday,
}: MarketplaceStatsCardProps) {
  const stats = [
    { icon: "📦", label: "รายการขาย",   value: totalListings,             suffix: "รายการ" },
    { icon: "🏪", label: "ร้านค้า",       value: totalShops,                suffix: "ร้าน" },
    { icon: "🔄", label: "คำสั่งซื้อ",    value: ordersActive,              suffix: "รายการ" },
    { icon: "💰", label: "ยอดวันนี้",     value: volumeToday.toLocaleString(), suffix: "pts" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
          <div className="text-xl mb-0.5">{s.icon}</div>
          <div className="text-lg font-bold text-gray-800">{s.value}</div>
          <div className="text-xs text-gray-400">{s.label} ({s.suffix})</div>
        </div>
      ))}
    </div>
  );
}
