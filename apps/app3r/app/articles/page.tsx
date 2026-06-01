import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "@/lib/mock/articles";
import { AdSlot } from "@/components/common";
import ArticlesClient from "./ArticlesClient";

export const metadata: Metadata = {
  title: "บทความเครื่องใช้ไฟฟ้า — App3R",
  description: "บทความความรู้เกี่ยวกับเครื่องใช้ไฟฟ้า การดูแลรักษา การซ่อม และเคล็ดลับประหยัดพลังงาน",
};

export default function ArticlesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-website-brand-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">บทความ</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">บทความ</h1>
      <p className="text-gray-500 mb-8">ความรู้และเคล็ดลับเกี่ยวกับเครื่องใช้ไฟฟ้าจาก App3R</p>

      {/* W-15 — C5 Ad banner beside/above the article cards */}
      <div className="mb-8">
        <AdSlot size="banner" label="โฆษณา · บทความ" />
      </div>

      <ArticlesClient articles={articles} />
    </div>
  );
}
