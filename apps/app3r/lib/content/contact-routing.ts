import type { ContactTopic } from '../types/contact';

export const topicLabels: Record<ContactTopic, string> = {
  general: 'คำถามทั่วไป',
  'register-weeer': 'สมัครเป็นร้านซ่อม (WeeeR)',
  billing: 'การเงินและการชำระเงิน',
  dispute: 'ร้องเรียน / ข้อพิพาท',
  technical: 'ปัญหาการใช้งาน',
  press: 'สื่อมวลชน',
  partnership: 'พาร์ทเนอร์',
  other: 'อื่นๆ',
};

export const topicEmails: Record<ContactTopic, string> = {
  general: 'support@app3r.co.th',
  'register-weeer': 'weeer@app3r.co.th',
  billing: 'billing@app3r.co.th',
  dispute: 'dispute@app3r.co.th',
  technical: 'tech@app3r.co.th',
  press: 'press@app3r.co.th',
  partnership: 'partner@app3r.co.th',
  other: 'support@app3r.co.th',
};
