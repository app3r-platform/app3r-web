// RC-C: R-70 ย้าย canonical → /scrap/browse/[id]
import { redirect } from "next/navigation";

export default async function ScrapItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/scrap/browse/${id}`);
}
