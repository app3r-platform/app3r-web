import type { Metadata } from "next";
import Link from "next/link";
import { articles } from "@/lib/mock/articles";

export const metadata: Metadata = {
  title: "บทความเครื่องใช้ไฟฟ้า",
  description: "บทความความรู้เกี่ยวกับเครื่องใช้ไฟฟ้า การดูแลรักษา การซ่อม และเคล็ดลับประหยัดพลังงาน",
};

const categories = ["ทั้งหมด", "การบำรุงรักษา", "เครื่องใช้ไฟฟ้า", "ซื้อขายมือสอง", "ความรู้ทั่วไป"];

export default function ArticlesPage() {
  const featured = articles.filter((a) => a.featured);
  const rest = articles.filter((a) => !a.featured);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">บทความ</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">บทความ</h1>
      <p className="text-gray-500 mb-8">ความรู้และเคล็ดลับเกี่ยวกับเครื่องใช้ไฟฟ้าจาก App3R</p>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              cat === "ทั้งหมด"
                ? "bg-purple-700 text-white border-purple-700"
                : "bg-white text-gray-700 border-gray-300 hover:border-purple-500"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured articles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        {featured.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            className="bg-purple-900 text-white rounded-2xl overflow-hidden hover:opacity-90 transition group"
          >
            <div className="h-40 bg-purple-800 flex items-center justify-center text-6xl">
              {article.emoji}
            </div>
            <div className="p-5 space-y-2">
              <span className="text-xs bg-purple-600 px-2 py-0.5 rounded-full">{article.category}</span>
              <h2 className="text-lg font-bold leading-snug group-hover:underline">{article.title}</h2>
              <p className="text-purple-200 text-sm line-clamp-2">{article.excerpt}</p>
              <div className="flex items-center gap-3 text-purple-300 text-xs pt-1">
                <span>{article.date}</span>
                <span>•</span>
                <span>⏱ {article.readTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* All articles */}
      <h2 className="text-xl font-bold text-gray-900 mb-5">บทความทั้งหมด</h2>
      <div className="space-y-4">
        {rest.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4 hover:shadow-md transition group"
          >
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
              {article.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  {article.category}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition text-sm sm:text-base leading-snug">
                {article.title}
              </h3>
              <p className="text-gray-500 text-sm mt-1 line-clamp-1">{article.excerpt}</p>
              <div className="flex items-center gap-3 text-gray-400 text-xs mt-2">
                <span>{article.date}</span>
                <span>•</span>
                <span>⏱ {article.readTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
