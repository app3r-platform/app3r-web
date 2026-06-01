import Link from 'next/link';
import { TermTooltip } from '@/components/common';

export default function SignUpCTA() {
  return (
    <section className="bg-gradient-to-r from-website-brand-700 to-website-brand-900 text-white py-16 px-4">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-3xl font-extrabold">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
        <p className="text-website-brand-200 text-lg inline-flex flex-wrap items-center justify-center gap-x-1">
          สมัครฟรี เริ่มลงประกาศ รับ
          <TermTooltip term="offer" />
          จากร้านค้าที่ผ่านการรับรอง
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="http://localhost:3002/register"
            className="bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-xl hover:bg-yellow-300 transition text-base"
          >
            สมัครเป็นลูกค้า (WeeeU)
          </Link>
          <Link
            href="/register/weeer"
            className="bg-white text-website-brand-700 font-bold px-8 py-3 rounded-xl hover:bg-website-brand-50 transition text-base"
          >
            สมัครเป็นร้านซ่อม (WeeeR)
          </Link>
        </div>
        <p className="text-website-brand-300 text-sm">
          ช่างสมัครผ่านร้านซ่อมที่อนุมัติแล้ว
        </p>
      </div>
    </section>
  );
}
