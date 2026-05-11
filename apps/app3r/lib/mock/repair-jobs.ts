// ============================================================
// lib/mock/repair-jobs.ts — 12 mock repair job postings (Thai content)
// Phase C-4.1b
// ============================================================
import type { AuthenticatedJobProjection } from '../types/listings-customer-jobs';
import { roundPoint } from '../utils/rounding';

const BUDGET_FEE_RATE = 0.05; // 5% service fee preview (D75)

function makeRepairJob(
  data: Omit<AuthenticatedJobProjection, 'feePreview' | 'jobType'>
): AuthenticatedJobProjection {
  const raw = data.estimatedBudget * BUDGET_FEE_RATE;
  return {
    ...data,
    jobType: 'repair',
    feePreview: roundPoint(raw, { fee_type: 'service_fee', app: 'website', formula: '5% of budget' }),
  };
}

export const repairJobs: AuthenticatedJobProjection[] = [
  makeRepairJob({
    id: 'r001',
    title: 'แอร์ไม่เย็น ต้องการช่างมาดูที่บ้าน',
    applianceType: 'แอร์',
    area: 'กรุงเทพมหานคร',
    serviceType: 1,
    postedAt: '2026-05-08',
    status: 'ANNOUNCED',
    ownerId: 'user-001',
    problemDescription:
      'แอร์ Daikin 12000 BTU อายุ 5 ปี เปิดแล้วลมออกแต่ไม่เย็น อาจต้องเติมน้ำยา หรือคอมเพรสเซอร์มีปัญหา ต้องการช่างมาตรวจที่บ้าน',
    photos: [
      'https://picsum.photos/400/300?seed=r001a',
      'https://picsum.photos/400/300?seed=r001b',
    ],
    estimatedBudget: 1500,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeRepairJob({
    id: 'r002',
    title: 'ทีวี Sony 55 นิ้ว จอมีเส้นดำ รับส่งซ่อมที่บ้านได้',
    applianceType: 'ทีวี',
    area: 'นนทบุรี',
    serviceType: 2,
    postedAt: '2026-05-08',
    status: 'ANNOUNCED',
    ownerId: 'user-002',
    problemDescription:
      'ทีวี Sony Bravia 55 นิ้ว มีเส้นดำแนวตั้งประมาณ 3 เส้น ปรากฏตลอดเวลา เสียงปกติ ต้องการช่างรับไปซ่อมและส่งคืน',
    photos: [
      'https://picsum.photos/400/300?seed=r002a',
      'https://picsum.photos/400/300?seed=r002b',
    ],
    estimatedBudget: 3500,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeRepairJob({
    id: 'r003',
    title: 'เครื่องซักผ้า LG ฝาบน ปั่นไม่หมุน มีเสียงดัง',
    applianceType: 'เครื่องซักผ้า',
    area: 'เชียงใหม่',
    serviceType: 1,
    postedAt: '2026-05-07',
    status: 'ANNOUNCED',
    ownerId: 'user-003',
    problemDescription:
      'เครื่องซักผ้า LG ฝาบน 10 กก. ใช้งานมา 4 ปี เริ่มมีเสียงดังผิดปกติตอนปั่น และบางครั้งถังไม่หมุน น้ำระบายปกติ ต้องการช่างมาดูที่บ้าน',
    photos: ['https://picsum.photos/400/300?seed=r003a'],
    estimatedBudget: 1200,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeRepairJob({
    id: 'r004',
    title: 'ตู้เย็น Hitachi 2 ประตู ไม่เย็น คอมเพรสเซอร์ดัง',
    applianceType: 'ตู้เย็น',
    area: 'ขอนแก่น',
    serviceType: 3,
    postedAt: '2026-05-07',
    status: 'ANNOUNCED',
    ownerId: 'user-004',
    problemDescription:
      'ตู้เย็น Hitachi 2 ประตู 14 คิว ทำงานมา 7 ปี เริ่มเย็นน้อยลง คอมเพรสเซอร์มีเสียงดัง จะนำมาซ่อมที่ร้านได้เลย ต้องการประเมินราคาก่อน',
    photos: [
      'https://picsum.photos/400/300?seed=r004a',
      'https://picsum.photos/400/300?seed=r004b',
      'https://picsum.photos/400/300?seed=r004c',
    ],
    estimatedBudget: 2500,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeRepairJob({
    id: 'r005',
    title: 'ไมโครเวฟ Panasonic ไม่ร้อน จอดับ',
    applianceType: 'ไมโครเวฟ',
    area: 'สงขลา',
    serviceType: 4,
    postedAt: '2026-05-07',
    status: 'ANNOUNCED',
    ownerId: 'user-005',
    problemDescription:
      'ไมโครเวฟ Panasonic 25 ลิตร เปิดสวิตช์แล้วจอไม่ติด ไม่ให้ความร้อน ฟิวส์อาจขาด หรือบอร์ดเสีย สามารถส่งพัสดุมาซ่อมได้',
    photos: ['https://picsum.photos/400/300?seed=r005a'],
    estimatedBudget: 800,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeRepairJob({
    id: 'r006',
    title: 'พัดลมตั้งพื้น Hatari หมุนช้า มีเสียงพัด',
    applianceType: 'พัดลม',
    area: 'ชลบุรี',
    serviceType: 3,
    postedAt: '2026-05-06',
    status: 'ANNOUNCED',
    ownerId: 'user-006',
    problemDescription:
      'พัดลมตั้งพื้น Hatari 16 นิ้ว หมุนช้าทุกสปีด มีเสียงพัดดัง น่าจะลูกปืนหรือคาปาซิเตอร์เสีย จะนำมาซ่อมที่ร้านเอง',
    photos: ['https://picsum.photos/400/300?seed=r006a'],
    estimatedBudget: 500,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeRepairJob({
    id: 'r007',
    title: 'หม้อหุงข้าว Toshiba ฝาไม่ล็อก ไม่สุก',
    applianceType: 'หม้อหุงข้าว',
    area: 'นนทบุรี',
    serviceType: 2,
    postedAt: '2026-05-06',
    status: 'ANNOUNCED',
    ownerId: 'user-007',
    problemDescription:
      'หม้อหุงข้าว Toshiba 1.8 ลิตร ฝาไม่ล็อกแน่น กดสวิตช์แล้วข้ามไปโหมด warm เลย ข้าวไม่สุก คาดว่าเทอร์โมสตัทเสีย',
    photos: ['https://picsum.photos/400/300?seed=r007a'],
    estimatedBudget: 600,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeRepairJob({
    id: 'r008',
    title: 'แอร์ Samsung Inverter รั่วน้ำ ต้องการช่างด่วน',
    applianceType: 'แอร์',
    area: 'กรุงเทพมหานคร',
    serviceType: 1,
    postedAt: '2026-05-05',
    status: 'ANNOUNCED',
    ownerId: 'user-008',
    problemDescription:
      'แอร์ Samsung Inverter 18000 BTU รุ่นใหม่อายุ 2 ปี น้ำหยดจากตัวในลงพื้นห้อง อาจท่อระบายน้ำตัน หรืออีวาพอเรเตอร์น้ำแข็งเกาะ ต้องการช่างด่วนวันนี้',
    photos: [
      'https://picsum.photos/400/300?seed=r008a',
      'https://picsum.photos/400/300?seed=r008b',
    ],
    estimatedBudget: 700,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeRepairJob({
    id: 'r009',
    title: 'เครื่องดูดฝุ่น Dyson V11 แบตเสื่อม ไม่ดูด',
    applianceType: 'เครื่องดูดฝุ่น',
    area: 'เชียงใหม่',
    serviceType: 4,
    postedAt: '2026-05-05',
    status: 'ANNOUNCED',
    ownerId: 'user-009',
    problemDescription:
      'เครื่องดูดฝุ่น Dyson V11 ใช้มา 3 ปี แบตเสื่อมชัดเจน ใช้ได้แค่ 5 นาที ต้องการเปลี่ยนแบตใหม่ หรือตรวจหัวดูดด้วย สามารถส่งพัสดุได้',
    photos: ['https://picsum.photos/400/300?seed=r009a'],
    estimatedBudget: 2000,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeRepairJob({
    id: 'r010',
    title: 'ตู้เย็น Sharp ช่องแช่แข็งไม่แข็ง น้ำแข็งละลาย',
    applianceType: 'ตู้เย็น',
    area: 'ขอนแก่น',
    serviceType: 1,
    postedAt: '2026-05-04',
    status: 'ANNOUNCED',
    ownerId: 'user-010',
    problemDescription:
      'ตู้เย็น Sharp 2 ประตู ช่องฟรีซไม่แข็ง น้ำแข็งละลายตอนกลางคืน ช่องธรรมดายังเย็นอยู่บ้าง น่าจะแก๊สรั่วหรือ defrost timer เสีย',
    photos: [
      'https://picsum.photos/400/300?seed=r010a',
      'https://picsum.photos/400/300?seed=r010b',
    ],
    estimatedBudget: 1800,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeRepairJob({
    id: 'r011',
    title: 'เครื่องซักผ้า Bosch ฝาหน้า Error E18 น้ำไม่ระบาย',
    applianceType: 'เครื่องซักผ้า',
    area: 'สงขลา',
    serviceType: 2,
    postedAt: '2026-05-04',
    status: 'ANNOUNCED',
    ownerId: 'user-011',
    problemDescription:
      'เครื่องซักผ้า Bosch ฝาหน้า 8 กก. ขึ้น Error E18 ทุกรอบ น้ำไม่ระบาย ลองทำความสะอาดกรองแล้วยังเป็นอยู่ อาจปั๊มน้ำเสีย',
    photos: ['https://picsum.photos/400/300?seed=r011a'],
    estimatedBudget: 1500,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),

  makeRepairJob({
    id: 'r012',
    title: 'ทีวี LG 43 นิ้ว เปิดไม่ติด ไฟแดงกระพริบ',
    applianceType: 'ทีวี',
    area: 'ชลบุรี',
    serviceType: 3,
    postedAt: '2026-05-03',
    status: 'ANNOUNCED',
    ownerId: 'user-012',
    problemDescription:
      'ทีวี LG Smart TV 43 นิ้ว เปิดไม่ติด ไฟ standby กระพริบแดง 3 ครั้งแล้วดับ น่าจะบอร์ดจ่ายไฟเสีย ต้องการนำมาให้ช่างดูที่ร้าน',
    photos: ['https://picsum.photos/400/300?seed=r012a'],
    estimatedBudget: 2200,
    customerName: 'รอยืนยัน (Phase D)',
    customerPhone: '0xx-xxx-xxxx (Phase D)',
  }),
];

export function getRepairJobById(id: string): AuthenticatedJobProjection | undefined {
  return repairJobs.find((j) => j.id === id);
}
