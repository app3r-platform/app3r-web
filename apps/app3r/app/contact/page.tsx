import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ติดต่อเรา",
  description: "ติดต่อทีม App3R สำหรับคำถามหรือปัญหาการใช้งาน",
};

const contactChannels = [
  {
    icon: "📧",
    title: "อีเมล",
    value: "support@app3r.com",
    desc: "ตอบกลับภายใน 1-2 วันทำการ",
    href: "mailto:support@app3r.com",
    color: "bg-purple-50 border-purple-200",
  },
  {
    icon: "💬",
    title: "LINE Official",
    value: "@app3r",
    desc: "ตอบกลับทันที ในเวลาทำการ",
    href: "https://line.me/R/ti/p/@app3r",
    color: "bg-green-50 border-green-200",
  },
  {
    icon: "📞",
    title: "โทรศัพท์",
    value: "02-XXX-XXXX",
    desc: "จันทร์-ศุกร์ 09:00-17:00 น.",
    href: "tel:02XXXXXXX",
    color: "bg-blue-50 border-blue-200",
  },
];

const faqs = [
  {
    q: "สมัคร WeeeR ใช้เวลานานแค่ไหน?",
    a: "ทีม App3R จะตรวจสอบเอกสารภายใน 3-5 วันทำการ หลังจากส่งใบสมัครครบถ้วน",
  },
  {
    q: "WeeeR ต้องเสียค่าสมัครหรือไม่?",
    a: "การสมัครฟรี แต่จะมีค่าธรรมเนียมเมื่อมีการทำธุรกรรม (fee_listing, fee_offer) ตาม D007",
  },
  {
    q: "ระบบ Escrow ทำงานอย่างไร?",
    a: "ผู้ใช้จ่าย 30% ก่อนงานเริ่ม เพื่อล็อคเงิน → ร้านทำงานเสร็จ → ผู้ใช้ยืนยัน → จ่ายส่วนที่เหลือ 70%",
  },
  {
    q: "ถ้างานไม่พอใจขอคืนเงินได้ไหม?",
    a: "ได้ ถ้าร้านไม่ทำงานหรืองานไม่เสร็จ ระบบจะคืนเงิน Escrow ตามนโยบาย Refund Policy ของ App3R",
  },
  {
    q: "ช่างต้องสมัครเองหรือไม่?",
    a: "ช่าง (WeeeT) ไม่สมัครเอง แต่ถูกสร้างโดยร้าน WeeeR ที่ผ่านการอนุมัติแล้ว",
  },
];

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ติดต่อเรา</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">ติดต่อเรา</h1>
      <p className="text-gray-500 mb-10">ทีม App3R พร้อมช่วยเหลือคุณทุกวัน</p>

      {/* Contact channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
        {contactChannels.map((ch) => (
          <a
            key={ch.title}
            href={ch.href}
            target={ch.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className={`border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition ${ch.color}`}
          >
            <span className="text-4xl">{ch.icon}</span>
            <div>
              <div className="font-semibold text-gray-900">{ch.title}</div>
              <div className="text-purple-700 font-bold">{ch.value}</div>
              <div className="text-gray-500 text-xs mt-1">{ch.desc}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Contact form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-5">ส่งข้อความหาเรา</h2>
        <form className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="ชื่อของคุณ"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              หัวข้อ <span className="text-red-500">*</span>
            </label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">เลือกหัวข้อ</option>
              <option>คำถามเกี่ยวกับการสมัคร WeeeR</option>
              <option>ปัญหาการใช้งาน</option>
              <option>ขอข้อมูลบริการ</option>
              <option>รายงานปัญหา</option>
              <option>อื่นๆ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ข้อความ <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="ระบุรายละเอียดที่ต้องการสอบถาม..."
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>
          <button
            type="submit"
            className="bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-800 transition"
          >
            ส่งข้อความ
          </button>
        </form>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-5">คำถามที่พบบ่อย</h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">❓ {faq.q}</h3>
              <p className="text-gray-600 text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
