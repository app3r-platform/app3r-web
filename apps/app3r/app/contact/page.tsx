import type { Metadata } from "next";
import Link from "next/link";
import { contactInfo } from "@/lib/content/contact-info";
import ContactInfoCard from "@/components/contact/ContactInfoCard";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "ติดต่อเรา — App3R",
  description: "ติดต่อทีม App3R สำหรับคำถาม ร้องเรียน สมัคร WeeeR หรือพาร์ทเนอร์ชิป",
};

export default function ContactPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ติดต่อเรา</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">ติดต่อเรา</h1>
      <p className="text-gray-500 mb-10">ทีม App3R พร้อมช่วยเหลือคุณในทุกเรื่อง</p>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: ContactInfoCard */}
        <div className="lg:col-span-2">
          <ContactInfoCard info={contactInfo} />
        </div>

        {/* Right: ContactForm */}
        <div className="lg:col-span-3">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
