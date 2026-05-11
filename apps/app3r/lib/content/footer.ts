import type { FooterContent } from './types';

export const footerContent: FooterContent = {
  tagline: 'เชื่อมต่อผู้ใช้งาน ร้านซ่อม และช่างมืออาชีพ',
  copyrightTemplate: '© {year} App3R Co., Ltd. สงวนลิขสิทธิ์',
  socialLinks: [
    { platform: 'facebook', url: 'https://facebook.com/app3r', label: 'Facebook' },
    { platform: 'line', url: 'https://line.me/R/ti/p/@app3r', label: 'LINE Official' },
    { platform: 'instagram', url: 'https://instagram.com/app3r_official', label: 'Instagram' },
  ],
  legalLinks: [
    { label: 'ข้อกำหนดการใช้งาน', href: '/legal/terms' },
    { label: 'นโยบายความเป็นส่วนตัว', href: '/legal/privacy' },
    { label: 'นโยบายคุกกี้', href: '/legal/cookies' },
    { label: 'นโยบายการคืนเงิน', href: '/legal/refund-policy' },
  ],
};
