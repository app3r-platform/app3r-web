// W-17 — Mock product catalog shared by /products and /products/[id]
// Real backend integration TBD (Backend product table not yet defined).

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  priceRange: string;
  priceGoldPoint?: number; // optional Gold Point display per terminology rule
  rating: number;
  reviewCount: number;
  emoji: string;
  badge?: string;
  badgeColor?: string;
  desc: string;
  longDesc?: string;
  seller?: {
    name: string;
    location: string;
  };
}

export const PRODUCTS: Product[] = [
  {
    id: "prod001",
    name: "แอร์ Mitsubishi Electric MSY-GN13VF",
    brand: "Mitsubishi Electric",
    category: "แอร์",
    priceRange: "12,900 – 14,500 บาท",
    priceGoldPoint: 12900,
    rating: 4.8,
    reviewCount: 234,
    emoji: "❄️",
    badge: "ขายดี",
    badgeColor: "bg-red-100 text-red-700",
    desc: "แอร์อินเวอร์เตอร์ 12,000 BTU ประหยัดไฟ 5 ดาว เงียบเป็นพิเศษ",
    longDesc:
      "แอร์อินเวอร์เตอร์ Mitsubishi Electric รุ่น MSY-GN13VF ขนาด 12,000 BTU น้ำยา R32 ประหยัดไฟระดับ 5 ดาว เสียงเงียบเหมาะกับห้องนอน รับประกันคอมเพรสเซอร์ 10 ปี",
    seller: { name: "ร้าน CoolMax Electric", location: "กรุงเทพมหานคร" },
  },
  {
    id: "prod002",
    name: "เครื่องซักผ้า Samsung WW90T534DAW",
    brand: "Samsung",
    category: "เครื่องซักผ้า",
    priceRange: "13,500 – 15,800 บาท",
    priceGoldPoint: 13500,
    rating: 4.7,
    reviewCount: 189,
    emoji: "🫧",
    badge: "แนะนำ",
    badgeColor: "bg-website-brand-100 text-website-brand-700",
    desc: "เครื่องซักผ้าฝาหน้า 9 กก. AI Control + Hygiene Steam",
    longDesc:
      "เครื่องซักผ้าฝาหน้าความจุ 9 กิโลกรัม พร้อมระบบ AI Control ที่ปรับโปรแกรมตามผ้า รองรับ Hygiene Steam ฆ่าเชื้อแบคทีเรียได้ถึง 99.9%",
    seller: { name: "Samsung Brand Shop", location: "ออนไลน์ทั่วประเทศ" },
  },
  {
    id: "prod003",
    name: "ตู้เย็น LG GN-B392PLGK",
    brand: "LG",
    category: "ตู้เย็น",
    priceRange: "9,800 – 11,200 บาท",
    priceGoldPoint: 9800,
    rating: 4.6,
    reviewCount: 145,
    emoji: "🧊",
    badge: "ราคาดี",
    badgeColor: "bg-green-100 text-green-700",
    desc: "ตู้เย็น 2 ประตู 14 คิว Inverter Linear Compressor",
    longDesc:
      "ตู้เย็น 2 ประตู 14 คิว เทคโนโลยี Inverter Linear Compressor ประหยัดไฟ + เสียงเงียบ รับประกันมอเตอร์ 10 ปี",
    seller: { name: "LG Authorized Dealer", location: "นนทบุรี" },
  },
  {
    id: "prod004",
    name: "ทีวี Sony KD-55X80L 4K",
    brand: "Sony",
    category: "ทีวี",
    priceRange: "19,990 – 22,000 บาท",
    priceGoldPoint: 19990,
    rating: 4.9,
    reviewCount: 312,
    emoji: "📺",
    badge: "ยอดนิยม",
    badgeColor: "bg-blue-100 text-blue-700",
    desc: "Google TV 55 นิ้ว 4K HDR X1 Processor รองรับ Dolby Atmos",
    longDesc:
      "Google TV ขนาด 55 นิ้ว ความละเอียด 4K HDR ขับเคลื่อนด้วย X1 Processor รองรับ Dolby Atmos + Dolby Vision",
    seller: { name: "Sony Center", location: "กรุงเทพมหานคร" },
  },
];

export function getProductById(id: string): Product | null {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

export function getAllProductIds(): string[] {
  return PRODUCTS.map((p) => p.id);
}
