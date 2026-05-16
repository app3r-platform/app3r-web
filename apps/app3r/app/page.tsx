import type { Metadata } from "next";
import Hero from "@/components/marketing/Hero";
import PersonasGrid from "@/components/marketing/PersonasGrid";
import FeaturedListings from "@/components/marketing/FeaturedListings";
import Testimonials from "@/components/marketing/Testimonials";
import SignUpCTA from "@/components/marketing/SignUpCTA";
import { getHeroContent } from "@/lib/content-api";

export const revalidate = 60; // ISR — อัปเดตทุก 60 วินาที

export const metadata: Metadata = {
  title: "App3R — แพลตฟอร์มเครื่องใช้ไฟฟ้าครบวงจร",
  description:
    "ซื้อขายเครื่องใช้ไฟฟ้ามือสอง จ้างซ่อม จัดบำรุงรักษา ง่ายๆ ในแพลตฟอร์มเดียว เชื่อมต่อผู้ใช้งาน ร้านซ่อม และช่างมืออาชีพ ทั่วประเทศไทย",
};

export default async function HomePage() {
  // ดึง hero content จาก CMS — fallback → static ถ้า API ไม่ตอบสนอง
  const heroContent = await getHeroContent();

  return (
    <>
      <Hero content={heroContent} />
      <PersonasGrid />
      <FeaturedListings />
      <Testimonials />
      <SignUpCTA />
    </>
  );
}
