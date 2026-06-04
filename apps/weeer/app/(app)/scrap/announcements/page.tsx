import { redirect } from "next/navigation";

// R-24 SCRAP-ANNOUNCE-LIST — Round2 Wave-5 (Gen112) route fix
// รายการประกาศซากย้ายไปที่ /scrap/browse (R-72) แล้ว → redirect กัน 404
// (ไม่สร้างจอใหม่ · low effort · /scrap/announcements/[id] + [id]/offer ยังคงอยู่)
export default function ScrapAnnouncementsListRedirect() {
  redirect("/scrap/browse");
}
