// ── lib/mock-data/maintain-jobs.ts — WeeeR Maintain Job Mock Data ─────────────
// Sub-1 D4+D5 (Phase D-4)
// Mirror ข้อมูลจาก apps/app3r/lib/mock/maintain-jobs.ts (8 jobs)
// ห้าม import จาก apps/app3r/ — ใช้ข้อมูลซ้ำแต่ import แยก (Lesson #33)
// Maintain ทุก job มี serviceType: 1 (on-site เท่านั้น)
// TODO: connect real Backend endpoint when sensitive fields added to DB schema

import type { WeeeRJobListing } from '../types/listings-jobs';

function fee(budget: number): number {
  return Math.round(budget * 0.05); // 5% (D75)
}

export const WEEER_MAINTAIN_JOBS: WeeeRJobListing[] = [
  {
    id: 'm001', jobType: 'maintain',
    title: 'ล้างแอร์ 2 เครื่อง พร้อมเช็คน้ำยา',
    applianceType: 'แอร์', area: 'กรุงเทพมหานคร', serviceType: 1,
    postedAt: '2026-05-09', status: 'ANNOUNCED', ownerId: 'user-021',
    problemDescription: 'แอร์ Daikin 2 ตัว ขนาด 12000 และ 18000 BTU ต้องการล้างทำความสะอาดประจำปี และเช็คปริมาณน้ำยา ถ้าน้ำยาน้อยให้เติมพร้อมได้เลย',
    photos: ['https://picsum.photos/400/300?seed=m001a', 'https://picsum.photos/400/300?seed=m001b'],
    estimatedBudget: 1200, feePreview: fee(1200),
    customerName: 'รอยืนยัน (Phase D)', customerPhone: '0xx-xxx-xxxx (Phase D)', featured: true,
  },
  {
    id: 'm002', jobType: 'maintain',
    title: 'ล้างเครื่องซักผ้าฝาบน Samsung พร้อมฆ่าเชื้อ',
    applianceType: 'เครื่องซักผ้า', area: 'นนทบุรี', serviceType: 1,
    postedAt: '2026-05-09', status: 'ANNOUNCED', ownerId: 'user-022',
    problemDescription: 'เครื่องซักผ้า Samsung ฝาบน 10 กก. ใช้มา 3 ปี ต้องการล้างทำความสะอาดลึก มีกลิ่นอับในถัง ต้องการให้ฆ่าเชื้อด้วย ถ่ายรูปก่อน-หลังให้ด้วย',
    photos: ['https://picsum.photos/400/300?seed=m002a'],
    estimatedBudget: 800, feePreview: fee(800),
    customerName: 'รอยืนยัน (Phase D)', customerPhone: '0xx-xxx-xxxx (Phase D)', featured: true,
  },
  {
    id: 'm003', jobType: 'maintain',
    title: 'ล้างแอร์ฝังฝ้า 18000 BTU ต้องการช่างมีประสบการณ์',
    applianceType: 'แอร์', area: 'เชียงใหม่', serviceType: 1,
    postedAt: '2026-05-08', status: 'ANNOUNCED', ownerId: 'user-023',
    problemDescription: 'แอร์ฝังฝ้า Mitsubishi 18000 BTU ในออฟฟิศ ต้องการช่างที่มีประสบการณ์ล้างแอร์ฝังฝ้าโดยเฉพาะ ไม่ให้สกปรกพื้นออฟฟิศ',
    photos: ['https://picsum.photos/400/300?seed=m003a', 'https://picsum.photos/400/300?seed=m003b'],
    estimatedBudget: 1500, feePreview: fee(1500),
    customerName: 'รอยืนยัน (Phase D)', customerPhone: '0xx-xxx-xxxx (Phase D)',
  },
  {
    id: 'm004', jobType: 'maintain',
    title: 'บำรุงตู้เย็น เปลี่ยนยางขอบ + ล้างสระระบาย',
    applianceType: 'ตู้เย็น', area: 'ขอนแก่น', serviceType: 1,
    postedAt: '2026-05-08', status: 'ANNOUNCED', ownerId: 'user-024',
    problemDescription: 'ตู้เย็น LG 2 ประตู 14 คิว ยางขอบตู้เริ่มแข็งและไม่กระชับ ต้องการเปลี่ยนยางขอบทั้ง 2 ชั้น และล้างสระระบายน้ำด้านหลัง',
    photos: ['https://picsum.photos/400/300?seed=m004a'],
    estimatedBudget: 1000, feePreview: fee(1000),
    customerName: 'รอยืนยัน (Phase D)', customerPhone: '0xx-xxx-xxxx (Phase D)',
  },
  {
    id: 'm005', jobType: 'maintain',
    title: 'ล้างพัดลมตั้งพื้น 3 ตัว + น้ำมันแกน',
    applianceType: 'พัดลม', area: 'ชลบุรี', serviceType: 1,
    postedAt: '2026-05-07', status: 'ANNOUNCED', ownerId: 'user-025',
    problemDescription: 'พัดลมตั้งพื้น 3 ตัว ยี่ห้อต่างๆ ต้องการล้างใบพัดและตะแกรง เติมน้ำมันแกนพัดลม เพื่อให้เงียบและเย็นขึ้น',
    photos: ['https://picsum.photos/400/300?seed=m005a'],
    estimatedBudget: 600, feePreview: fee(600),
    customerName: 'รอยืนยัน (Phase D)', customerPhone: '0xx-xxx-xxxx (Phase D)',
  },
  {
    id: 'm006', jobType: 'maintain',
    title: 'ล้างเครื่องดูดฝุ่น Dyson และเปลี่ยนไส้กรอง',
    applianceType: 'เครื่องดูดฝุ่น', area: 'สงขลา', serviceType: 1,
    postedAt: '2026-05-06', status: 'ANNOUNCED', ownerId: 'user-026',
    problemDescription: 'เครื่องดูดฝุ่น Dyson V8 ต้องการล้างทำความสะอาดหัวดูดทุกหัว เปลี่ยนไส้กรอง HEPA และตรวจสอบสภาพแบตเตอรี่',
    photos: ['https://picsum.photos/400/300?seed=m006a', 'https://picsum.photos/400/300?seed=m006b'],
    estimatedBudget: 900, feePreview: fee(900),
    customerName: 'รอยืนยัน (Phase D)', customerPhone: '0xx-xxx-xxxx (Phase D)',
  },
  {
    id: 'm007', jobType: 'maintain',
    title: 'ล้างแอร์แยกส่วน Carrier 3 ตัวพร้อมกัน',
    applianceType: 'แอร์', area: 'กรุงเทพมหานคร', serviceType: 1,
    postedAt: '2026-05-05', status: 'ANNOUNCED', ownerId: 'user-027',
    problemDescription: 'แอร์ Carrier แยกส่วน 3 ตัว ขนาด 9000, 12000, 12000 BTU ต้องการล้างพร้อมกัน 1 วัน ต้องการช่าง 2 คนขึ้นไป',
    photos: ['https://picsum.photos/400/300?seed=m007a'],
    estimatedBudget: 2500, feePreview: fee(2500),
    customerName: 'รอยืนยัน (Phase D)', customerPhone: '0xx-xxx-xxxx (Phase D)',
  },
  {
    id: 'm008', jobType: 'maintain',
    title: 'บำรุงเครื่องซักผ้าฝาหน้า LG ล้างถัง + ยาง',
    applianceType: 'เครื่องซักผ้า', area: 'นนทบุรี', serviceType: 1,
    postedAt: '2026-05-04', status: 'ANNOUNCED', ownerId: 'user-028',
    problemDescription: 'เครื่องซักผ้าฝาหน้า LG 9 กก. ใช้มา 5 ปี ต้องการล้างถังลึก ทำความสะอาดยางขอบประตู และตรวจสอบกรองปั๊มน้ำ มีกลิ่นอับเล็กน้อย',
    photos: ['https://picsum.photos/400/300?seed=m008a'],
    estimatedBudget: 950, feePreview: fee(950),
    customerName: 'รอยืนยัน (Phase D)', customerPhone: '0xx-xxx-xxxx (Phase D)',
  },
];

/** เรียงจากใหม่ไปเก่า */
export const WEEER_MAINTAIN_JOBS_SORTED = [...WEEER_MAINTAIN_JOBS].sort(
  (a, b) => b.postedAt.localeCompare(a.postedAt),
);

export function getMaintainJobById(id: string): WeeeRJobListing | undefined {
  return WEEER_MAINTAIN_JOBS.find((j) => j.id === id);
}
