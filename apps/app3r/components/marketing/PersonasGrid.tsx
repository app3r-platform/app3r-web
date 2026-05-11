import Link from 'next/link';

const personas = [
  {
    icon: '👤',
    name: 'WeeeU',
    title: 'ลูกค้า',
    desc: 'ลงประกาศ ซื้อ-ขาย ว่าจ้างซ่อม และจัดบำรุงรักษาเครื่องใช้ไฟฟ้าในบ้าน',
    cta: 'สมัครเป็นลูกค้า',
    href: 'http://localhost:3002/register',
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700',
    btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    icon: '🏪',
    name: 'WeeeR',
    title: 'ร้านซ่อม',
    desc: 'รับงาน ส่งข้อเสนอ บริหารช่าง และขยายธุรกิจผ่านแพลตฟอร์มดิจิทัล',
    cta: 'สมัครร้านซ่อม',
    href: '/register/weeer',
    color: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-700',
    btnColor: 'bg-green-600 hover:bg-green-700 text-white',
  },
  {
    icon: '🔧',
    name: 'WeeeT',
    title: 'ช่าง',
    desc: 'รับงานจากร้าน ออกไปบ้านลูกค้า บันทึกผล และสร้างประวัติการทำงาน',
    cta: 'เป็นช่าง WeeeT',
    href: '/download',
    color: 'bg-orange-50 border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-700',
    btnColor: 'bg-orange-600 hover:bg-orange-700 text-white',
  },
];

export default function PersonasGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-14">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-900">สมาชิก App3R มีกี่ประเภท?</h2>
        <p className="text-gray-500 mt-2">เลือกประเภทที่ตรงกับบทบาทของคุณ</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {personas.map((p) => (
          <div
            key={p.name}
            className={`border rounded-2xl p-6 space-y-4 ${p.color}`}
          >
            <div className="text-4xl">{p.icon}</div>
            <div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.badgeColor}`}>
                {p.name}
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-2">{p.title}</h3>
              <p className="text-gray-600 text-sm mt-2">{p.desc}</p>
            </div>
            <Link
              href={p.href}
              className={`inline-block px-5 py-2.5 rounded-lg text-sm font-semibold transition ${p.btnColor}`}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
