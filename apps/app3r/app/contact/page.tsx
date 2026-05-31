import type { Metadata } from "next";
import Link from "next/link";
import { getContactPage } from "@/lib/content-api";
import ContactInfoCard from "@/components/contact/ContactInfoCard";
import ContactForm from "@/components/contact/ContactForm";

// W-3-C Sub-C.3: ISR revalidate 300s (CMS public read)
export const revalidate = 300;

export const metadata: Metadata = {
  title: "ติดต่อเรา — App3R",
  description: "ติดต่อทีม App3R สำหรับคำถาม ร้องเรียน สมัคร WeeeR หรือพาร์ทเนอร์ชิป",
};

export default async function ContactPage() {
  // W-3-C: ดึงข้อมูล contact จาก CMS · fallback → static stub
  const page = await getContactPage();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-website-brand-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{page.title}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{page.title}</h1>
      <p className="text-gray-500 mb-10">ทีม App3R พร้อมช่วยเหลือคุณในทุกเรื่อง</p>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: ContactInfoCard */}
        <div className="lg:col-span-2">
          <ContactInfoCard info={page.info} />
        </div>

        {/* Right: ContactForm (D78 = defer per W-3-C CMD — keep existing UI) */}
        <div className="lg:col-span-3">
          <ContactForm />
        </div>
      </div>

      {page.source === 'static' && (
        <p className="mt-6 text-[10px] text-gray-300 italic text-right" title="กำลังแสดงเนื้อหา fallback (static) — CMS ไม่ตอบสนอง">
          · static fallback
        </p>
      )}
    </div>
  );
}
