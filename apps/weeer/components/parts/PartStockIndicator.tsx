"use client";

export function PartStockIndicator({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">หมดสต็อก</span>;
  if (stock <= 3)
    return <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">เหลือ {stock} ชิ้น</span>;
  return <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">มีสต็อก {stock} ชิ้น</span>;
}
