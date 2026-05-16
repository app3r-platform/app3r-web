import type { Metadata } from 'next';
import Link from 'next/link';
import { getAboutContent } from '@/lib/content-api';

export const revalidate = 60; // ISR — อัปเดตทุก 60 วินาที

export const metadata: Metadata = {
  title: 'เกี่ยวกับเรา — App3R',
  description: 'App3R คือแพลตฟอร์มตัวกลางด้านเครื่องใช้ไฟฟ้าครบวงจรแห่งแรกในไทย เชื่อมต่อผู้ใช้งาน ร้านซ่อม และช่างมืออาชีพ',
};

export default async function AboutPage() {
  // ดึง about content จาก CMS — fallback → static ถ้า API ไม่ตอบสนอง
  const aboutContent = await getAboutContent();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">เกี่ยวกับเรา</span>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white rounded-2xl px-8 py-12 mb-10 text-center">
        <div className="text-5xl mb-4">⚡</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">{aboutContent.title}</h1>
        <p className="text-purple-200 text-lg max-w-2xl mx-auto">{aboutContent.subtitle}</p>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {aboutContent.sections.map((section, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-extrabold text-sm flex-shrink-0">
                {i + 1}
              </span>
              {section.heading}
            </h2>
            <p className="text-gray-700 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 bg-purple-50 border border-purple-200 rounded-2xl p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
        <p className="text-gray-600">สมัครฟรี เริ่มใช้งานได้ทันที</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register/weeer"
            className="bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-800 transition"
          >
            สมัคร WeeeR (ร้านซ่อม)
          </Link>
          <Link
            href="/contact"
            className="border border-purple-700 text-purple-700 px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition"
          >
            ติดต่อเรา
          </Link>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-right mt-4">อัปเดตล่าสุด: {aboutContent.updatedAt}</p>
    </div>
  );
}
