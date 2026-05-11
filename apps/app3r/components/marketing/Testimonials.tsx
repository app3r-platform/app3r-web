const testimonials = [
  {
    name: 'คุณสมหญิง ว.',
    role: 'ลูกค้า WeeeU — กรุงเทพฯ',
    stars: '★★★★★',
    text: 'หาช่างแอร์ได้ง่ายมาก ราคาสมเหตุสมผล ช่างมาตรงเวลา ทำงานสะอาด แนะนำให้ทุกคนลองใช้ App3R',
    avatar: '👩‍🦱',
  },
  {
    name: 'ร้านซ่อมคุณวิชัย',
    role: 'เจ้าของร้านซ่อม WeeeR — เชียงใหม่',
    stars: '★★★★★',
    text: 'รับงานเพิ่มขึ้น 30% หลังเข้าร่วม App3R ระบบจัดการง่าย ลูกค้าชำระเงินผ่าน Escrow ปลอดภัยทั้งสองฝ่าย',
    avatar: '👨‍🔧',
  },
  {
    name: 'ช่างสมชาย ต.',
    role: 'ช่าง WeeeT — นนทบุรี',
    stars: '★★★★☆',
    text: 'กำหนดการงานชัดเจน มีแผนที่นำทางในแอป บันทึกผลงานง่าย เงินโอนเร็ว ไม่ต้องรอนาน',
    avatar: '👷',
  },
  {
    name: 'คุณประภา น.',
    role: 'ผู้ขายเครื่องใช้ไฟฟ้า WeeeU — สมุทรปราการ',
    stars: '★★★★★',
    text: 'ขายตู้เย็นเก่าได้ราคาดี ลงประกาศง่ายมาก มีผู้สนใจติดต่อเข้ามาภายใน 2 ชั่วโมง ปิดดีลได้วันเดียว',
    avatar: '👩‍💼',
  },
];

export default function Testimonials() {
  return (
    <section className="bg-purple-50 py-14 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">เสียงจากผู้ใช้งานจริง</h2>
          <p className="text-gray-500 mt-2">ทุกรีวิวมาจากผู้ใช้งานที่ผ่านการยืนยันในระบบ</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{t.avatar}</span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
              <div className="text-yellow-400 text-sm">{t.stars}</div>
              <p className="text-gray-600 text-sm leading-relaxed">{t.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
