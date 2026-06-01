// ============================================================
// app/products/[id]/page.tsx — W-17 Ruling 5 redirect stub
// สินค้าแนะนำ unified กับ ประกาศมือสอง (resell)
// /products/[id] redirect → /listings/resell/{mapped id}
// guard orphan link: ถ้า id ไม่ map → redirect ไป resell index (ไม่ 404)
// ============================================================
import { redirect } from "next/navigation";
import { productToResellPath } from "../../../lib/content/product-resell-map";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(productToResellPath(id));
}
