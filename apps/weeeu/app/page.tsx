import { redirect } from "next/navigation";

// Root redirect → /welcome (Landing page — R-01)
// Production: middleware จะ redirect ไป /dashboard ถ้า user login แล้ว
export default function RootPage() {
  redirect("/welcome");
}
