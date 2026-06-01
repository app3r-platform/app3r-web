// ============================================================
// app/listings/loading.tsx — Route-level skeleton for listings index pages
// W-Module-2: skeleton ที่ match layout (sidebar + grid) แทน full-screen spinner
// Brand chrome = green website-brand-* — ไม่มีสี off-brand
// ============================================================
export default function ListingsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-6" />

      {/* Header skeleton */}
      <div className="h-28 bg-gray-100 rounded-2xl animate-pulse mb-8" />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar skeleton */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
        </aside>

        {/* Grid skeleton */}
        <div className="flex-1">
          <div className="h-6 w-40 bg-gray-100 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">กำลังโหลดรายการประกาศ…</span>
    </div>
  );
}
