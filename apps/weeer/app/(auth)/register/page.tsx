import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "สมัครสมาชิก — WeeeR" };

export default function RegisterPage() {
  return (
    <>
      <h2 className="text-xl font-bold text-gray-900 mb-1">สมัครสมาชิก WeeeR</h2>
      <p className="text-sm text-gray-500 mb-6">ลงทะเบียนในฐานะร้าน / บริษัท</p>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท / ร้าน <span className="text-red-500">*</span></label>
          <input type="text" placeholder="ร้าน / บริษัท ของคุณ" required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล <span className="text-red-500">*</span></label>
          <input type="email" placeholder="company@example.com" required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
          <input type="tel" placeholder="08X-XXX-XXXX" required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เลขนิติบุคคล (ถ้ามี)</label>
          <input type="text" placeholder="0-1234-56789-01-2"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน <span className="text-red-500">*</span></label>
          <input type="password" placeholder="อย่างน้อย 8 ตัวอักษร" required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน <span className="text-red-500">*</span></label>
          <input type="password" placeholder="••••••••" required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <button type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors">
          สมัครสมาชิก
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="text-green-700 font-semibold hover:underline">เข้าสู่ระบบ</Link>
      </p>
    </>
  );
}
