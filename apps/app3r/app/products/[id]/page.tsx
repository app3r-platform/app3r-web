// W-17 — Product detail page (Server Component + ISR)
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById, getAllProductIds } from "../../../lib/content/products";

export const revalidate = 60; // ISR

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return getAllProductIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) {
    return { title: "ไม่พบสินค้า — App3R" };
  }
  return {
    title: `${product.name} — สินค้าแนะนำ App3R`,
    description: product.desc,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-website-brand-700">
          หน้าหลัก
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-website-brand-700">
          สินค้า
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Hero image / emoji placeholder */}
        <div className="bg-gray-50 rounded-2xl h-80 lg:h-[420px] flex items-center justify-center text-9xl relative">
          {product.emoji}
          {product.badge && (
            <span
              className={`absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full ${product.badgeColor ?? "bg-gray-200 text-gray-700"}`}
            >
              {product.badge}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            {product.brand} · {product.category}
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-snug">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-yellow-400 text-lg">★</span>
            <span className="font-semibold text-gray-700">{product.rating}</span>
            <span className="text-gray-400">({product.reviewCount} รีวิว)</span>
          </div>

          {/* Price */}
          <div className="border-t border-b border-gray-100 py-4">
            <div className="text-xs text-gray-500 mb-1">ราคา</div>
            <div className="text-2xl font-bold text-website-brand-700">
              {product.priceRange}
            </div>
            {product.priceGoldPoint && (
              <div className="text-xs text-gray-500 mt-1">
                หรือชำระด้วย{" "}
                <span className="font-semibold text-yellow-600">
                  พอยต์ทอง (Gold Point)
                </span>{" "}
                {product.priceGoldPoint.toLocaleString()} แต้ม
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">รายละเอียดสินค้า</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {product.longDesc ?? product.desc}
            </p>
          </div>

          {/* Seller */}
          {product.seller && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="text-xs text-gray-500 mb-0.5">ผู้ขาย</div>
              <div className="font-semibold text-gray-900">{product.seller.name}</div>
              <div className="text-xs text-gray-500">{product.seller.location}</div>
            </div>
          )}

          {/* CTA Stub — wires to listings until product checkout exists */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              disabled
              className="flex-1 bg-website-brand-700 text-white px-5 py-3 rounded-lg text-sm font-semibold opacity-60 cursor-not-allowed"
              title="ระบบสั่งซื้อโดยตรงยังไม่เปิดใช้งาน"
            >
              ซื้อ (เร็วๆ นี้)
            </button>
            <Link
              href="/listings/resell"
              className="flex-1 text-center border border-website-brand-700 text-website-brand-700 px-5 py-3 rounded-lg text-sm font-semibold hover:bg-website-brand-50 transition"
            >
              ดูประกาศมือสอง
            </Link>
          </div>

          <div className="text-[11px] text-gray-400">
            * ระบบพักเงินกลาง (Escrow) จะถูกใช้กับการสั่งซื้อสินค้าทุกครั้งเมื่อเปิดใช้งาน
          </div>
        </div>
      </div>
    </div>
  );
}
