// ============================================================
// components/marketing/Testimonials.tsx — Dynamic Testimonials
// Phase D-4 Sub-2 — async server component, ISR 60s, fallback static
// ============================================================
import Image from 'next/image';
import { getTestimonials } from '@/lib/testimonials-api';
import type { TestimonialDto } from '@/lib/testimonials-api';

/** ตรวจสอบว่า string เป็น URL (http/https หรือ /) สำหรับ Next/Image */
function isImageUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/');
}

interface TestimonialCardProps {
  testimonial: TestimonialDto;
}

function TestimonialCard({ testimonial: t }: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        {isImageUrl(t.avatar) ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={t.avatar}
              alt={t.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <span className="text-3xl flex-shrink-0">{t.avatar}</span>
        )}
        <div>
          <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
          <div className="text-xs text-gray-500">{t.role}</div>
        </div>
      </div>
      <div className="text-yellow-400 text-sm">{t.stars}</div>
      <p className="text-gray-600 text-sm leading-relaxed">{t.text}</p>
    </div>
  );
}

export default async function Testimonials() {
  // ดึงจาก CMS — fallback → static ถ้า API ไม่ตอบสนอง
  const testimonials = await getTestimonials();

  return (
    <section className="bg-purple-50 py-14 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">เสียงจากผู้ใช้งานจริง</h2>
          <p className="text-gray-500 mt-2">ทุกรีวิวมาจากผู้ใช้งานที่ผ่านการยืนยันในระบบ</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
