// ============================================================
// lib/mock/maintain-jobs.ts — 8 mock maintain job postings (Thai content)
// Phase C-4.1b — All serviceType: 1 (on-site only)
// ============================================================
import type { AuthenticatedJobProjection } from '../types/listings-customer-jobs';
import { roundPoint } from '../utils/rounding';

const BUDGET_FEE_RATE = 0.05; // 5% service fee preview (D75)

function makeMaintainJob(
  data: Omit<AuthenticatedJobProjection, 'feePreview' | 'jobType' | 'serviceType'>
): AuthenticatedJobProjection {
  const raw = data.estimatedBudget * BUDGET_FEE_RATE;
  return {
    ...data,
    jobType: 'maintain',
    serviceType: 1, // on-site only for maintain
    feePreview: roundPoint(raw, { fee_type: 'service_fee', app: 'website', formula: '5% of budget' }),
  };
}

export const maintainJobs: AuthenticatedJobProjection[] = [
  makeMaintainJob({
    id: 'm001',
    title: 'ล้างแอร์ 2 เครื่อง พร้อมเช็คน้ำยา',
    applianceType: 'แอร์',
    area: 'กรุงเทพมหานคร',
    postedAt: '2026-05-09',
    status: 'ANNOUNCED',
    ownerId: 'user-021',
    problemDescription:
      'แอร์ Daikin 2 ตัว ขนาด 12000 และ 18000 BTU ต้องการล้างทำความสะอาดประจำปี และเช็คปริมาณน้ำยา ถ้าน้ำยาน้อยให้เติมพร้อมได้เลย',
    photos: [
      'https://picsum.photos/400/300?seed=m001a',
      'https://picsum.photos/400/300?seed=m001b',
    ],
    estimatedBudget: 1200,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeMaintainJob({
    id: 'm002',
    title: 'ล้างเครื่องซักผ้าฝาบน Samsung พร้อมฆ่าเชื้อ',
    applianceType: 'เครื่องซักผ้า',
    area: 'นนทบุรี',
    postedAt: '2026-05-09',
    status: 'ANNOUNCED',
    ownerId: 'user-022',
    problemDescription:
      'เครื่องซักผ้า Samsung ฝาบน 10 กก. ใช้มา 3 ปี ต้องการล้างทำความสะอาดลึก มีกลิ่นอับในถัง ต้องการให้ฆ่าเชื้อด้วย ถ่ายรูปก่อน-หลังให้ด้วย',
    photos: ['https://picsum.photos/400/300?seed=m002a'],
    estimatedBudget: 800,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeMaintainJob({
    id: 'm003',
    title: 'ล้างแอร์ฝังฝ้า 18000 BTU ต้องการช่างมีประสบการณ์',
    applianceType: 'แอร์',
    area: 'เชียงใหม่',
    postedAt: '2026-05-08',
    status: 'ANNOUNCED',
    ownerId: 'user-023',
    problemDescription:
      'แอร์ฝังฝ้า Mitsubishi 18000 BTU ในออฟฟิศ ต้องการช่างที่มีประสบการณ์ล้างแอร์ฝังฝ้าโดยเฉพาะ ไม่ให้สกปรกพื้นออฟฟิศ',
    photos: [
      'https://picsum.photos/400/300?seed=m003a',
      'https://picsum.photos/400/300?seed=m003b',
    ],
    estimatedBudget: 1500,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeMaintainJob({
    id: 'm004',
    title: 'บำรุงตู้เย็น เปลี่ยนยางขอบ + ล้างสระระบาย',
    applianceType: 'ตู้เย็น',
    area: 'ขอนแก่น',
    postedAt: '2026-05-08',
    status: 'ANNOUNCED',
    ownerId: 'user-024',
    problemDescription:
      'ตู้เย็น LG 2 ประตู 14 คิว ยางขอบตู้เริ่มแข็งและไม่กระชับ ต้องการเปลี่ยนยางขอบทั้ง 2 ชั้น และล้างสระระบายน้ำด้านหลัง',
    photos: ['https://picsum.photos/400/300?seed=m004a'],
    estimatedBudget: 1000,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeMaintainJob({
    id: 'm005',
    title: 'ล้างพัดลมตั้งพื้น 3 ตัว + น้ำมันแกน',
    applianceType: 'พัดลม',
    area: 'ชลบุรี',
    postedAt: '2026-05-07',
    status: 'ANNOUNCED',
    ownerId: 'user-025',
    problemDescription:
      'พัดลมตั้งพื้น 3 ตัว ยี่ห้อต่างๆ ต้องการล้างใบพัดและตะแกรง เติมน้ำมันแกนพัดลม เพื่อให้เงียบและเย็นขึ้น',
    photos: ['https://picsum.photos/400/300?seed=m005a'],
    estimatedBudget: 600,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeMaintainJob({
    id: 'm006',
    title: 'ล้างเครื่องดูดฝุ่น Dyson และเปลี่ยนไส้กรอง',
    applianceType: 'เครื่องดูดฝุ่น',
    area: 'สงขลา',
    postedAt: '2026-05-06',
    status: 'ANNOUNCED',
    ownerId: 'user-026',
    problemDescription:
      'เครื่องดูดฝุ่น Dyson V8 ต้องการล้างทำความสะอาดหัวดูดทุกหัว เปลี่ยนไส้กรอง HEPA และตรวจสอบสภาพแบตเตอรี่',
    photos: [
      'https://picsum.photos/400/300?seed=m006a',
      'https://picsum.photos/400/300?seed=m006b',
    ],
    estimatedBudget: 900,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeMaintainJob({
    id: 'm007',
    title: 'ล้างแอร์แยกส่วน Carrier 3 ตัวพร้อมกัน',
    applianceType: 'แอร์',
    area: 'กรุงเทพมหานคร',
    postedAt: '2026-05-05',
    status: 'ANNOUNCED',
    ownerId: 'user-027',
    problemDescription:
      'แอร์ Carrier แยกส่วน 3 ตัว ขนาด 9000, 12000, 12000 BTU ต้องการล้างพร้อมกัน 1 วัน ต้องการช่าง 2 คนขึ้นไป',
    photos: ['https://picsum.photos/400/300?seed=m007a'],
    estimatedBudget: 2500,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeMaintainJob({
    id: 'm008',
    title: 'บำรุงเครื่องซักผ้าฝาหน้า LG ล้างถัง + ยาง',
    applianceType: 'เครื่องซักผ้า',
    area: 'นนทบุรี',
    postedAt: '2026-05-04',
    status: 'ANNOUNCED',
    ownerId: 'user-028',
    problemDescription:
      'เครื่องซักผ้าฝาหน้า LG 9 กก. ใช้มา 5 ปี ต้องการล้างถังลึก ทำความสะอาดยางขอบประตู และตรวจสอบกรองปั๊มน้ำ มีกลิ่นอับเล็กน้อย',
    photos: ['https://picsum.photos/400/300?seed=m008a'],
    estimatedBudget: 950,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),
];

export function getMaintainJobById(id: string): AuthenticatedJobProjection | undefined {
  return maintainJobs.find((j) => j.id === id);
}
