// RC-C: orphan route — redirect ไป /signup (canonical auth flow)
import { redirect } from "next/navigation";

export default function AwaitingApprovalPage() {
  redirect("/signup");
}
