import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getFeaturedListings } from "../lib/api/listings";
import TypeBadge from "../components/listings/TypeBadge";

export const metadata: Metadata = {
  title: "App3R — แพลตฟอร์มเครื่องใช้ไฟฟ้าครบวงจร",
  description:
    "ซื้อขายเครื่องใช้ไฟฟ้ามือสอง จ้างซ่อม จัดบำรุงรักษา ง่ายๆ ในแพลตฟอร์มเดียว",
};

const stats = [
  { value: "12,000+", label: "ประกาศทั้งหมด" },
  { value: "3,500+", label: "ร้านค้า/บริษัท" },
  { value: "8,200+", label: "ช่างที่ลงทะเบียน" },
  { value: "98%", label: "ความพึงพอใจ" },
];

const howItWorks = [
  {
    step: "1",
    icon: "📝",
    title: "ลงประกาศ",
    desc: "สมัคร WeeeU ฟรี → ลงประกาศขาย/ซ่อม/บำรุงรักษาได้ทันที",
  },
  {
    step: "2",
    icon: "🤝",
    title: "รับ Offer",
    desc: "ร้านค้าและช่างที่ผ่านการตรวจสอบจะยื่น offer ให้คุณเลือก",
  },
  {
    step: "3",
    icon: "⚡",
    title: "จัดการครบ",
    desc: "ยืนยัน → ระบบ Escrow ป้องกันเงิน → งานเสร็จได้รับเงินคืน",
  },
];

const userTypes = [
  {
    icon: "👤",
    name: "WeeeU",
    title: "ผู้ใช้ทั่วไป",
    desc: "สมัครฟรี ลงประกาศขาย/จ้างซ่อม/จ้างบำรุงรักษาเครื่องใช้ไฟฟ้าของคุณ",
    cta: "สมัครฟรี",
    href: "http://localhost:3002/register",
    color: "bg-blue-50 border-blue-200",
    btnColor: "bg-blue-600 hover:bg-blue-700",
  },
  {
    icon: "🏪",
    name: "WeeeR",
    title: "ร้านค้า / บริษัท",
    desc: "ลงทะเบียนร้านซ่อม/บำรุงรักษา รับงานผ่านแพลตฟอร์ม ขยายธุรกิจ",
    cta: "สมัคร WeeeR",
    href: "/register/weeer",
    color: "bg-green-50 border-green-200",
    btnColor: "bg-green-600 hover:bg-green-700",
  },
  {
    icon: "🔧",
    name: "WeeeT",
    title: "ช่าง",
    desc: "เข้าร่วมทีมของร้าน รับมอบหมายงานผ่านแอป บันทึกผลงาน",
    cta: "ดาวน์โหลดแอป",
    href: "/download",
    color: "bg-orange-50 border-orange-200",
    btnColor: "bg-orange-600 hover:bg-orange-700",
  },
];

export default function HomePage() {
  const featuredListings = getFeaturedListings(4);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-purple-700/50 border border-purple-500/50 px-4 py-1.5 rounded-full text-sm">
            <span className="text-yellow-400">⚡</span>
            <span>แพลตฟอร์มเครื่องใช้ไฟฟ้าครบวงจรแห่งแรกในไทย</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            ซื้อ-ขาย ซ่อม บำรุงรักษา
            <br />
            <span className="text-yellow-400">เครื่องใช้ไฟฟ้า</span> ในที่เดียว
          </h1>
          <p className="text-lg sm:text-xl text-purple-200 max-w-2xl mx-auto">
            เชื่อมต่อผู้ใช้ ร้านซ่อม และช่างมืออาชีพ ด้วยระบบ Escrow ที่ปลอดภัย
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              href="http://localhost:3002/register"
              className="bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-xl hover:bg-yellow-300 transition text-lg"
            >
              เริ่มใช้งานฟรี →
            </Link>
            <Link
              href="/listings/resell"
              className="border border-white/50 text-white px-8 py-3 rounded-xl hover:bg-white/10 transition text-lg"
            >
              ดูประกาศทั้งหมด
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-700">{s.value}</div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ประกาศล่าสุด</h2>
            <p className="text-gray-500 text-sm mt-1">ประกาศที่ถูกโพสต์ล่าสุดจากผู้ใช้ทั่วประเทศ</p>
          </div>
          <div className="hidden sm:flex gap-2">
            <Link
              href="/listings/resell"
              className="text-sm text-purple-700 border border-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50"
            >
              ขายมือสอง
            </Link>
            <Link
              href="/listings/repair"
              className="text-sm text-purple-700 border border-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50"
            >
              ซ่อม
            </Link>
            <Link
              href="/listings/maintain"
              className="text-sm text-purple-700 border border-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50"
            >
              บำรุงรักษา
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredListings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/resell/${listing.id}`}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="relative h-44 bg-gray-100">
                <Image
                  src={listing.images[0]}
                  alt={listing.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-4 space-y-2">
                <TypeBadge type="resell" />
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-purple-700 transition-colors">
                  {listing.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <span>{listing.location}</span>
                  <span>{listing.postedAt}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="font-bold text-purple-700 text-sm">{listing.priceLabel}</span>
                  <span className="text-xs text-purple-700 font-medium">ดูรายละเอียด →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/listings/resell"
            className="inline-block bg-purple-700 text-white px-8 py-3 rounded-xl hover:bg-purple-800 transition font-medium"
          >
            ดูประกาศทั้งหมด →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-purple-50 py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">วิธีใช้งาน App3R</h2>
            <p className="text-gray-500 mt-2">ง่าย รวดเร็ว ปลอดภัย ใน 3 ขั้นตอน</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-700 text-white rounded-full text-3xl">
                  {step.icon}
                </div>
                <div className="font-bold text-gray-900 text-lg">{step.title}</div>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">สมาชิก App3R มีกี่ประเภท?</h2>
          <p className="text-gray-500 mt-2">เลือกประเภทที่ตรงกับคุณ</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {userTypes.map((u) => (
            <div
              key={u.name}
              className={`border rounded-2xl p-6 space-y-4 ${u.color}`}
            >
              <div className="text-4xl">{u.icon}</div>
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {u.name}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{u.title}</h3>
                <p className="text-gray-600 text-sm mt-2">{u.desc}</p>
              </div>
              <Link
                href={u.href}
                className={`inline-block text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition ${u.btnColor}`}
              >
                {u.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="text-3xl font-extrabold">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
          <p className="text-purple-200 text-lg">
            สมัครฟรี เริ่มลงประกาศ รับ offer จากร้านค้าที่ผ่านการรับรอง
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="http://localhost:3002/register"
              className="bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-xl hover:bg-yellow-300 transition"
            >
              สมัคร WeeeU ฟรี
            </Link>
            <Link
              href="/register/weeer"
              className="bg-white text-purple-700 font-bold px-8 py-3 rounded-xl hover:bg-purple-50 transition"
            >
              สมัคร WeeeR
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
