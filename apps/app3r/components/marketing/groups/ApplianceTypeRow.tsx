// ============================================================
// components/marketing/groups/ApplianceTypeRow.tsx
// W-2-A: Shared row layout — แสดง 4 ประกาศ/แถว group ตามประเภทเครื่องใช้ไฟฟ้า
// รับ items + render function (จาก parent group) เพื่อยืดหยุ่นระหว่าง with-image/no-image
// ============================================================
import { ReactNode } from "react";

interface ApplianceTypeRowProps<T> {
  applianceType: string;          // เช่น "แอร์", "ตู้เย็น"
  items: T[];                     // ประกาศใน type นี้
  rowsPerType: number;            // จำนวนแถวสูงสุดต่อประเภท (1 หรือ 2)
  renderItem: (item: T) => ReactNode;
}

export default function ApplianceTypeRow<T extends { id: string }>({
  applianceType,
  items,
  rowsPerType,
  renderItem,
}: ApplianceTypeRowProps<T>) {
  // จำกัด items ตาม rowsPerType (4 per row)
  const limit = rowsPerType * 4;
  const visibleItems = items.slice(0, limit);

  if (visibleItems.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-base font-semibold text-gray-800">{applianceType}</h4>
        <span className="text-xs text-gray-400">({visibleItems.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleItems.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>
    </div>
  );
}
