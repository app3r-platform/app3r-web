import Link from 'next/link';
import { mockResellListings } from '@/lib/mock/resell';
import { mockScrapListings } from '@/lib/mock/scrap';
import { repairJobs } from '@/lib/mock/repair-jobs';
import { maintainJobs } from '@/lib/mock/maintain-jobs';
import ListingCard from '@/components/listings/ListingCard';

export default function FeaturedListings() {
  const featuredResell = mockResellListings.filter((r) => r.featured).slice(0, 2);
  const featuredScrap = mockScrapListings.filter((s) => s.featured).slice(0, 2);

  // Repair and Maintain jobs shown as simple cards (different type)
  const featuredRepair = repairJobs.filter((r) => r.featured).slice(0, 2);
  const featuredMaintain = maintainJobs.filter((m) => m.featured).slice(0, 2);

  const hasListings = featuredResell.length + featuredScrap.length > 0;
  const hasJobs = featuredRepair.length + featuredMaintain.length > 0;

  if (!hasListings && !hasJobs) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ประกาศแนะนำ</h2>
          <p className="text-gray-500 text-sm mt-1">ประกาศคัดสรรจากทุกหมวดหมู่</p>
        </div>
        <div className="hidden sm:flex gap-2">
          <Link href="/listings/resell" className="text-sm text-purple-700 border border-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50">
            ขายมือสอง
          </Link>
          <Link href="/listings/repair" className="text-sm text-purple-700 border border-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50">
            ซ่อม
          </Link>
          <Link href="/listings/maintain" className="text-sm text-purple-700 border border-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50">
            บำรุงรักษา
          </Link>
        </div>
      </div>

      {/* Resell + Scrap */}
      {hasListings && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {featuredResell.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
          {featuredScrap.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      )}

      {/* Repair + Maintain jobs */}
      {hasJobs && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredRepair.map((job) => (
            <Link
              key={job.id}
              href={`/listings/repair/${job.id}`}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition group"
            >
              <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium mb-2">
                ซ่อม
              </span>
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-purple-700 transition mb-2">
                {job.title}
              </h3>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>📍</span> {job.area}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-purple-700 font-medium">
                งบ {job.estimatedBudget.toLocaleString()} บาท
              </div>
            </Link>
          ))}
          {featuredMaintain.map((job) => (
            <Link
              key={job.id}
              href={`/listings/maintain/${job.id}`}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition group"
            >
              <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium mb-2">
                บำรุงรักษา
              </span>
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-purple-700 transition mb-2">
                {job.title}
              </h3>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>📍</span> {job.area}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-purple-700 font-medium">
                งบ {job.estimatedBudget.toLocaleString()} บาท
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="text-center mt-8">
        <Link
          href="/listings"
          className="inline-block bg-purple-700 text-white px-8 py-3 rounded-xl hover:bg-purple-800 transition font-medium"
        >
          ดูประกาศทั้งหมด →
        </Link>
      </div>
    </section>
  );
}
