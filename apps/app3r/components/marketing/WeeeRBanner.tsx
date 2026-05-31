import Link from "next/link";

/**
 * W4 — WeeeR call-out banner
 * Reminds visitors that WeeeR (technicians) can also sell second-hand items.
 * Server Component; no client state required.
 */
export default function WeeeRBanner() {
  return (
    <section className="bg-website-brand-50 border-y border-website-brand-100">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <p className="text-website-brand-800 font-medium flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">
            🛍️
          </span>
          WeeeR ก็ขายมือสองได้ — สมัครเป็นร้านเพื่อเริ่มขายเครื่องใช้ไฟฟ้ามือสอง
        </p>
        <Link
          href="/register/weeer"
          className="bg-website-brand-700 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-website-brand-800 transition whitespace-nowrap"
        >
          สมัคร WeeeR →
        </Link>
      </div>
    </section>
  );
}
