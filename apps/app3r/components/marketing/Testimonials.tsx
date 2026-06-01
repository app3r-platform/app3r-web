// ============================================================
// components/marketing/Testimonials.tsx — Dynamic Testimonials
// Phase D-4 Sub-2 — async server component, ISR 60s, fallback static
// ============================================================
import Image from 'next/image';
import { getTestimonials } from '@/lib/testimonials-api';
import type { TestimonialDto } from '@/lib/testimonials-api';
import { ConditionalSection } from '@/components/common';

// ============================================================
// Social links — mockup stub (ENV-overridable, ไม่ hardcode domain จริง)
// ว่าง = ไม่แสดงแถบ social (ConditionalSection)
// ============================================================
interface SocialLink {
  key: string;
  label: string;
  icon: string;
  href: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  { key: 'facebook', label: 'Facebook', icon: 'f', href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? '#' },
  { key: 'line', label: 'LINE', icon: 'L', href: process.env.NEXT_PUBLIC_SOCIAL_LINE ?? '#' },
  { key: 'instagram', label: 'Instagram', icon: 'ig', href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? '#' },
];

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

  // social ที่ตั้งค่าจริงเท่านั้น (กัน dead link "#")
  const activeSocial = SOCIAL_LINKS.filter((s) => s.href !== '#');

  // W-01: ทั้ง section ถูกซ่อนถ้าไม่มี testimonial เลย (ConditionalSection)
  return (
    <ConditionalSection data={testimonials}>
      <section className="bg-website-brand-50 py-14 px-4">
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

          {/* Social — ซ่อนทั้งแถบถ้าไม่มีช่องทางที่ตั้งค่าไว้ (ConditionalSection) */}
          <ConditionalSection data={activeSocial}>
            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="text-sm text-gray-500">ติดตามเราได้ที่</p>
              <div className="flex items-center gap-3">
                {activeSocial.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-10 h-10 rounded-full bg-white border border-website-brand-200 flex items-center justify-center text-website-brand-700 font-bold text-sm hover:bg-website-brand-100 transition"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </ConditionalSection>
        </div>
      </section>
    </ConditionalSection>
  );
}
