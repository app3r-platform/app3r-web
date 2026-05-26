// 🚧 STUB PAGE — Phase 3 DevNav scaffold
export default async function MaintainReschedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <p className="text-4xl">🚧</p>
      <h1 className="text-xl font-bold text-gray-700">เลื่อนนัดบำรุงรักษา (M3)</h1>
      <p className="text-sm text-gray-400">หน้านี้อยู่ระหว่างพัฒนา — Phase 3 scaffold</p>
      <p className="text-xs text-gray-300">/maintain/jobs/{id}/reschedule</p>
    </div>
  )
}
