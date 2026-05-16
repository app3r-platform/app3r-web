import type { Metadata } from 'next';
import Link from 'next/link';
import { getFaqItems } from '@/lib/content-api';
import type { FAQItem } from '@/lib/content/types';

export const revalidate = 60; // ISR — อัปเดตทุก 60 วินาที

export const metadata: Metadata = {
  title: 'คำถามที่พบบ่อย — App3R',
  description: 'คำถามที่พบบ่อยเกี่ยวกับ App3R ระบบ Escrow การสมัครสมาชิก WeeeR WeeeU WeeeT และบริการต่างๆ',
};

const categoryLabels: Record<FAQItem['category'], string> = {
  general: 'ทั่วไป',
  weeeu: 'WeeeU (ลูกค้า)',
  weeer: 'WeeeR (ร้านซ่อม)',
  weeet: 'WeeeT (ช่าง)',
  payment: 'การชำระเงิน',
  service: 'บริการ',
};

const categoryOrder: FAQItem['category'][] = ['general', 'weeeu', 'weeer', 'weeet', 'payment', 'service'];

export default async function FAQPage() {
  // ดึง FAQ items จาก CMS — fallback → static ถ้า API ไม่ตอบสนอง
  const items = await getFaqItems();

  const grouped = categoryOrder.reduce<Record<string, FAQItem[]>>((acc, cat) => {
    acc[cat] = items.filter((f) => f.category === cat).sort((a, b) => a.order - b.order);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">คำถามที่พบบ่อย</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">คำถามที่พบบ่อย</h1>
      <p className="text-gray-500 mb-10">รวมคำตอบสำหรับคำถามที่ผู้ใช้งานถามบ่อยที่สุด</p>

      {/* Category navigation pills */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categoryOrder.map((cat) => (
          <a
            key={cat}
            href={`#${cat}`}
            className="px-4 py-1.5 rounded-full text-sm font-medium border border-purple-300 text-purple-700 hover:bg-purple-700 hover:text-white transition"
          >
            {categoryLabels[cat]}
          </a>
        ))}
      </div>

      {/* FAQ Sections */}
      <div className="space-y-10">
        {categoryOrder.map((cat) => {
          const catItems = grouped[cat];
          if (!catItems || catItems.length === 0) return null;
          return (
            <section key={cat} id={cat}>
              <h2 className="text-lg font-bold text-purple-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-5 bg-purple-700 rounded-full inline-block" />
                {categoryLabels[cat]}
              </h2>
              <div className="space-y-3">
                {catItems.map((item) => (
                  <details
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden group"
                  >
                    <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50 transition list-none">
                      <span>{item.question}</span>
                      <span className="text-purple-700 text-lg flex-shrink-0 ml-4 group-open:rotate-180 transition-transform">
                        ▾
                      </span>
                    </summary>
                    <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Contact CTA */}
      <div className="mt-12 bg-purple-50 border border-purple-200 rounded-2xl p-6 text-center space-y-3">
        <p className="text-gray-700 font-medium">ไม่พบคำตอบที่ต้องการ?</p>
        <Link
          href="/contact"
          className="inline-block bg-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-800 transition"
        >
          ติดต่อทีมงาน →
        </Link>
      </div>
    </div>
  );
}
