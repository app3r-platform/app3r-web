// ⚠️ MOCK SEED — Sub-5a D80 Admin Lists Foundation
// Sub-5a T+1 | 80 records | Thai context

export interface ServiceRecord {
  id: string
  customerName: string
  technicianName: string
  serviceType: 'repair' | 'maintain' | 'resell' | 'scrap'
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: string
}

const customerNames = ['สมชาย ใจดี','อนุวัต วงศ์ไทย','ประภา รักดี','วิชัย สุขสันต์','สุดา มานะ',
  'รัตนา ธนชัย','พิมพ์ชนก ศิริ','ชัยวัฒน์ นภา','กนกวรรณ สวัสดิ์','อภิชาต วรรณา',
  'นารี ทองดี','มานะ ชัยมงคล','สุภาพ รุ่งเรือง','จิรายุ เกียรติ','พรชัย บุญมี']

const techNames = ['ช่างสมศักดิ์','ช่างวิรัตน์','ช่างธนกร','ช่างประเสริฐ','ช่างอนุรักษ์',
  'ช่างพิทักษ์','ช่างสุรชัย','ช่างนิรันดร์','ช่างจักรพงษ์','ช่างอดิศร']

const serviceTypes: ServiceRecord['serviceType'][] = ['repair','maintain','resell','scrap']
const statuses: ServiceRecord['status'][] = ['requested','accepted','in_progress','completed','cancelled']

function isoDate(daysAgo: number) {
  const d = new Date('2026-05-17')
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export const servicesSeed: ServiceRecord[] = Array.from({ length: 80 }, (_, i) => ({
  id: `SVC-${String(i + 1).padStart(3, '0')}`,
  customerName: customerNames[i % customerNames.length],
  technicianName: techNames[i % techNames.length],
  serviceType: serviceTypes[i % 4],
  status: statuses[i % 5],
  createdAt: isoDate(i),
}))
