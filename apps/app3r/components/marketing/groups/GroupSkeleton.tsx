// ============================================================
// components/marketing/groups/GroupSkeleton.tsx
// W-01: Loading skeleton สำหรับ home listing section (Suspense fallback)
// แสดงโครง 1 แถว × 4 การ์ด (pulse) ขณะ group ฝั่ง server กำลัง resolve
// ============================================================
export default function GroupSkeleton() {
  return (
    <section className="w-full px-4 py-10 border-b border-gray-100">
      <div className="flex items-end justify-between mb-6">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-80 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          >
            <div className="h-44 bg-gray-200 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-1/3 bg-gray-200 rounded animate-pulse mt-3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
