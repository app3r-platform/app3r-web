import type { Job, Technician, Part } from "./types";

export const mockTechnician: Technician = {
  id: "tech-001",
  name: "สมชาย มั่นคง",
  phone: "081-234-5678",
  email: "somchai@fixpro.th",
  shopName: "FixPro Service",
  shopId: "shop-001",
  specialties: ["แอร์", "เครื่องซักผ้า", "ตู้เย็น"],
  birthDate: "1990-05-15",
  address: "123/10 ซ.ลาดพร้าว 55",
  subDistrict: "วังทองหลาง",
  district: "วังทองหลาง",
  province: "กรุงเทพมหานคร",
  postalCode: "10310",
  educationLevel: "ปวส.",
  certificates: [],
};

// Available specialties (from WeeeR's service menu — mock)
export const availableSpecialties = [
  "แอร์", "เครื่องซักผ้า", "ตู้เย็น", "เครื่องทำน้ำอุ่น",
  "ไมโครเวฟ", "ทีวี", "พัดลม", "เครื่องดูดฝุ่น",
];

// Education levels
export const educationLevels = [
  "ประถมศึกษา", "มัธยมศึกษาตอนต้น", "มัธยมศึกษาตอนปลาย",
  "ปวช.", "ปวส.", "ปริญญาตรี", "ปริญญาโท", "อื่นๆ",
];

// Mock postal code → address lookup
export const postalCodeMap: Record<string, { subDistrict: string; district: string; province: string }> = {
  "10310": { subDistrict: "วังทองหลาง", district: "วังทองหลาง", province: "กรุงเทพมหานคร" },
  "10110": { subDistrict: "คลองเตย", district: "คลองเตย", province: "กรุงเทพมหานคร" },
  "10240": { subDistrict: "หัวหมาก", district: "บางกะปิ", province: "กรุงเทพมหานคร" },
  "10230": { subDistrict: "ลาดพร้าว", district: "ลาดพร้าว", province: "กรุงเทพมหานคร" },
  "50000": { subDistrict: "ช้างคลาน", district: "เมืองเชียงใหม่", province: "เชียงใหม่" },
  "40000": { subDistrict: "ในเมือง", district: "เมืองขอนแก่น", province: "ขอนแก่น" },
  "90000": { subDistrict: "บ่อยาง", district: "เมืองสงขลา", province: "สงขลา" },
  "20000": { subDistrict: "บางปลาสร้อย", district: "เมืองชลบุรี", province: "ชลบุรี" },
};

export const mockJobs: Job[] = [
  {
    id: "job-001",
    jobNo: "JOB-2026-0501",
    customer: {
      name: "คุณสุภา รักดี",
      phone: "089-111-2222",
      address: "123/45 ซ.รามคำแหง 24 กรุงเทพฯ 10240",
      lat: 13.7563,
      lng: 100.5018,
    },
    serviceType: "ล้างแอร์",
    module: "แอร์",
    scheduledAt: "2026-05-02T09:00:00",
    status: "in_progress",
    notes: "แอร์ไม่เย็น เสียงดัง",
    photos: [],
    steps: [
      { id: "s1", label: "ถ่ายรูปก่อนซ่อม", done: true },
      { id: "s2", label: "ตรวจสอบน้ำยา", done: true },
      { id: "s3", label: "ล้างแผ่นกรองอากาศ", done: false },
      { id: "s4", label: "ทดสอบการทำงาน", done: false },
      { id: "s5", label: "ถ่ายรูปหลังซ่อม", done: false },
    ],
  },
  {
    id: "job-002",
    jobNo: "JOB-2026-0502",
    customer: {
      name: "คุณวิชัย ใจดี",
      phone: "087-333-4444",
      address: "456 ถ.สุขุมวิท 21 กรุงเทพฯ 10110",
    },
    serviceType: "ซ่อมเครื่องซักผ้า",
    module: "เครื่องซักผ้า",
    scheduledAt: "2026-05-02T13:00:00",
    status: "assigned",
    photos: [],
    steps: [
      { id: "s1", label: "ถ่ายรูปก่อนซ่อม", done: false },
      { id: "s2", label: "ตรวจสอบมอเตอร์", done: false },
      { id: "s3", label: "เปลี่ยนอะไหล่", done: false },
      { id: "s4", label: "ทดสอบการซัก", done: false },
      { id: "s5", label: "ถ่ายรูปหลังซ่อม", done: false },
    ],
  },
  {
    id: "job-003",
    jobNo: "JOB-2026-0491",
    customer: {
      name: "คุณมาลี สวยงาม",
      phone: "084-555-6666",
      address: "789 ซ.ลาดพร้าว 15 กรุงเทพฯ 10230",
    },
    serviceType: "เติมน้ำยาแอร์",
    module: "แอร์",
    scheduledAt: "2026-05-01T10:00:00",
    status: "completed",
    photos: [
      { type: "before", url: "/mock/before1.jpg", caption: "แอร์ก่อนซ่อม" },
      { type: "after", url: "/mock/after1.jpg", caption: "แอร์หลังซ่อม" },
    ],
    steps: [
      { id: "s1", label: "ถ่ายรูปก่อนซ่อม", done: true },
      { id: "s2", label: "เติมน้ำยา R32", done: true },
      { id: "s3", label: "ตรวจรอยรั่ว", done: true },
      { id: "s4", label: "ถ่ายรูปหลังซ่อม", done: true },
    ],
  },
  {
    id: "job-004",
    jobNo: "JOB-2026-0503",
    customer: {
      name: "คุณประชา ยิ้มแย้ม",
      phone: "090-777-8888",
      address: "321 ถ.พระราม 9 กรุงเทพฯ 10310",
    },
    serviceType: "บำรุงรักษาตู้เย็น",
    module: "ตู้เย็น",
    scheduledAt: "2026-05-03T09:30:00",
    status: "assigned",
    photos: [],
    steps: [
      { id: "s1", label: "ถ่ายรูปก่อน", done: false },
      { id: "s2", label: "ทำความสะอาดคอยล์", done: false },
      { id: "s3", label: "ตรวจวัดอุณหภูมิ", done: false },
      { id: "s4", label: "ถ่ายรูปหลัง", done: false },
    ],
  },
];

export const mockParts: Part[] = [
  { id: "p001", name: "น้ำยาแอร์ R32", sku: "REF-R32-1KG", category: "น้ำยา", unit: "กระป๋อง", stockQty: 12, price: 850 },
  { id: "p002", name: "แผ่นกรองอากาศ (ทั่วไป)", sku: "FILT-GEN-01", category: "อะไหล่", unit: "ชิ้น", stockQty: 25, price: 120 },
  { id: "p003", name: "สายรัด PVC 4นิ้ว", sku: "PIPE-PVC-4IN", category: "อุปกรณ์", unit: "เมตร", stockQty: 50, price: 45 },
  { id: "p004", name: "มอเตอร์พัดลม (Universal)", sku: "MTR-FAN-UNI", category: "อะไหล่", unit: "ตัว", stockQty: 3, price: 1200 },
  { id: "p005", name: "คาปาซิเตอร์ 35/5 MFD", sku: "CAP-35-5MFD", category: "อะไหล่", unit: "ตัว", stockQty: 8, price: 180 },
  { id: "p006", name: "น้ำยาล้างคอยล์", sku: "CLN-COIL-500ML", category: "น้ำยา", unit: "ขวด", stockQty: 15, price: 95 },
];

export const todayJobs = mockJobs.filter(
  (j) => j.scheduledAt.startsWith("2026-05-02") && j.status !== "completed"
);

export const upcomingJobs = mockJobs.filter(
  (j) => j.scheduledAt > "2026-05-02" && j.status === "assigned"
);
