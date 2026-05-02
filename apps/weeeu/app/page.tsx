import { redirect } from "next/navigation";

// Root redirect: ไปที่ login (auth middleware จะ redirect ไป /dashboard ถ้า login แล้ว)
export default function RootPage() {
  redirect("/login");
}
