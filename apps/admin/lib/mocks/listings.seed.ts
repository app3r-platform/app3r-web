// ⚠️ MOCK SEED — Sub-5a D80 Admin Lists Foundation
// Sub-5a T+1 | 60 records | Thai context

export interface ListingRecord {
  id: string
  title: string
  sellerName: string
  listingType: 'resell' | 'scrap'
  status: 'draft' | 'active' | 'sold' | 'expired'
  listedAt: string
}

const titles = ['เครื่องซักผ้า Samsung','แอร์ Mitsubishi','ตู้เย็น LG','ทีวี Sony',
  'เครื่องดูดฝุ่น Dyson','ไมโครเวฟ Sharp','พัดลม Hatari','หม้อหุงข้าว National',
  'เครื่องทำน้ำอุ่น Panasonic','ตู้แช่ Toshiba']

const sellerNames = ['สมหญิง ว.','ร้านนายวิชัย','พ่อค้า ก.','แม่ค้า ข.',
  'ร้านของเก่า ค.','ลุงแดง เก่าดี','ป้าแก้ว ขายดี','นายดำ เชื่อถือได้',
  'ร้านเฟอร์นิเจอร์ไทย','สมาคมรีไซเคิล']

const types: ListingRecord['listingType'][] = ['resell','scrap']
const statuses: ListingRecord['status'][] = ['draft','active','sold','expired']

function isoDate(daysAgo: number) {
  const d = new Date('2026-05-17')
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export const listingsSeed: ListingRecord[] = Array.from({ length: 60 }, (_, i) => ({
  id: `LST-${String(i + 1).padStart(3, '0')}`,
  title: titles[i % titles.length],
  sellerName: sellerNames[i % sellerNames.length],
  listingType: types[i % 2],
  status: statuses[i % 4],
  listedAt: isoDate(i),
}))
