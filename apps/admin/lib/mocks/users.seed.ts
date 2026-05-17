// ⚠️ MOCK SEED — Sub-5a D80 Admin Lists Foundation
// Sub-5a T+1 | 100 records | Thai context

export interface UserRecord {
  id: string
  name: string
  email: string
  phone: string
  role: 'weeeu' | 'weeer' | 'weeet'
  status: 'active' | 'suspended' | 'pending_verify' | 'banned'
  registeredAt: string
}

const firstNames = ['สมชาย','อนุวัต','ประภา','วิชัย','สุดา','รัตนา','พิมพ์ชนก',
  'ชัยวัฒน์','กนกวรรณ','อภิชาต','นารี','มานะ','สุภาพ','จิรายุ','พรชัย',
  'ธนชัย','วรรณา','นภา','ดวงใจ','ศิริชัย']

const lastNames = ['ใจดี','วงศ์ไทย','รักดี','สุขสันต์','มานะ','ธนชัย',
  'ศิริ','นภา','สวัสดิ์','วรรณา','ทองดี','ชัยมงคล','รุ่งเรือง','เกียรติ','บุญมี',
  'ดีงาม','ชัยดี','สมบูรณ์','เจริญ','รักไทย']

const roles: UserRecord['role'][] = ['weeeu','weeer','weeet']
const statuses: UserRecord['status'][] = ['active','active','active','suspended','pending_verify','banned']

function isoDate(daysAgo: number) {
  const d = new Date('2026-05-17')
  d.setDate(d.getDate() - daysAgo * 2)
  return d.toISOString()
}

export const usersSeed: UserRecord[] = Array.from({ length: 100 }, (_, i) => {
  const fn = firstNames[i % firstNames.length]
  const ln = lastNames[i % lastNames.length]
  return {
    id: `USR-${String(i + 1).padStart(3, '0')}`,
    name: `${fn} ${ln}`,
    email: `user${i + 1}@app3r.th`,
    phone: `08${String(i % 10)}${String(1000000 + i).slice(1)}`,
    role: roles[i % 3],
    status: statuses[i % statuses.length],
    registeredAt: isoDate(i),
  }
})
