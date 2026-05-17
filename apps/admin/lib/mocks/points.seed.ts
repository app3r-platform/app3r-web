// ⚠️ MOCK SEED — Sub-5a D80 Admin Lists Foundation
// Sub-5a T+1 | 100 records | Thai context

export interface PointRecord {
  id: string
  userName: string
  type: 'gold' | 'silver'
  amount: number
  status: 'pending' | 'completed' | 'reversed'
  transactedAt: string
}

const userNames = ['สมชาย ใจดี','อนุวัต วงศ์','ประภา รักดี','วิชัย สุขสันต์','สุดา มานะ',
  'รัตนา ธน','พิมพ์ชนก ศิริ','ชัยวัฒน์ นภา','กนกวรรณ สวัสดิ์','อภิชาต วรรณา']

const types: PointRecord['type'][] = ['gold','silver']
const statuses: PointRecord['status'][] = ['pending','completed','completed','reversed']
const amounts = [50, 100, 200, 500, 1000, 150, 300, 750, 25, 400]

function isoDate(daysAgo: number) {
  const d = new Date('2026-05-17')
  d.setDate(d.getDate() - Math.floor(daysAgo / 2))
  return d.toISOString()
}

export const pointsSeed: PointRecord[] = Array.from({ length: 100 }, (_, i) => ({
  id: `TXN-${String(i + 1).padStart(3, '0')}`,
  userName: userNames[i % userNames.length],
  type: types[i % 2],
  amount: amounts[i % amounts.length],
  status: statuses[i % statuses.length],
  transactedAt: isoDate(i),
}))
