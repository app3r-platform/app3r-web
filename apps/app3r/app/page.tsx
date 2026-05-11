import type { Metadata } from "next";
import Hero from "@/components/marketing/Hero";
import PersonasGrid from "@/components/marketing/PersonasGrid";
import FeaturedListings from "@/components/marketing/FeaturedListings";
import Testimonials from "@/components/marketing/Testimonials";
import SignUpCTA from "@/components/marketing/SignUpCTA";

export const metadata: Metadata = {
  title: "App3R — แพลตฟอร์มเครื่องใช้ไฟฟ้าครบวงจร",
  description:
    "ซื้อขายเครื่องใช้ไฟฟ้ามือสอง จ้างซ่อม จัดบำรุงรักษา ง่ายๆ ในแพลตฟอร์มเดียว เชื่อมต่อผู้ใช้งาน ร้านซ่อม และช่างมืออาชีพ ทั่วประเทศไทย",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <PersonasGrid />
      <FeaturedListings />
      <Testimonials />
      <SignUpCTA />
    </>
  );
}
