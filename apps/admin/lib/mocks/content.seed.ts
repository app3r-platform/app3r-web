// ⚠️ MOCK SEED — Sub-5a D80 Admin Lists Foundation
// Sub-5a T+1 | 50 records | Thai context

export interface ContentRecord {
  id: string
  title: string
  type: 'article' | 'marketing' | 'contact'
  author: string
  status: 'draft' | 'published' | 'archived'
  createdAt: string
}

const titles = [
  'วิธีดูแลเครื่องซักผ้าให้อยู่นาน','5 เคล็ดลับซ่อมแอร์ประหยัดพลัง',
  'แนะนำช่างซ่อมมืออาชีพ','โปรโมชันซ่อมฟรีค่าแรงเดือนนี้',
  'ข้อมูลติดต่อสำนักงานใหญ่','บริการซ่อมบำรุงเครื่องใช้ไฟฟ้า',
  'รีวิวจากลูกค้า WeeeU','วิธีสมัครเป็นช่าง WeeeT',
  'App3R คืออะไร','นโยบายความเป็นส่วนตัว',
]

const authors = ['ผู้ดูแลระบบ','นักเขียนเนื้อหา ก.','ทีมการตลาด','ฝ่ายลูกค้าสัมพันธ์']
const types: ContentRecord['type'][] = ['article','marketing','contact']
const statuses: ContentRecord['status'][] = ['draft','published','published','archived']

function isoDate(daysAgo: number) {
  const d = new Date('2026-05-17')
  d.setDate(d.getDate() - daysAgo * 3)
  return d.toISOString()
}

export const contentSeed: ContentRecord[] = Array.from({ length: 50 }, (_, i) => ({
  id: `CNT-${String(i + 1).padStart(3, '0')}`,
  title: titles[i % titles.length],
  type: types[i % 3],
  author: authors[i % authors.length],
  status: statuses[i % statuses.length],
  createdAt: isoDate(i),
}))
