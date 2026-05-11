// ============================================================
// app/listings/repair/[id]/page.tsx — Repair job detail (auth-gated)
// Phase C-4.1b
// ============================================================
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMockRoleFromCookie } from '../../../../lib/auth/mock-auth';
import RepairJobDetail from '../../../../components/listings/RepairJobDetail';
import WeeeRLoginGate from '../../../../components/listings/WeeeRLoginGate';
import OwnerRedirectModal from '../../../../components/listings/OwnerRedirectModal';
import { getJob } from '../../../../lib/api/customer-jobs';
import { repairJobs } from '../../../../lib/mock/repair-jobs';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return repairJobs.map((j) => ({ id: j.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = getJob('repair', id);
  if (!job) return { title: 'ไม่พบประกาศ' };
  return {
    title: `${job.title} — ซ่อมเครื่องใช้ไฟฟ้า — App3R`,
    description: `งานซ่อม${job.applianceType} พื้นที่${job.area}`,
  };
}

export default async function RepairDetailPage({ params }: PageProps) {
  const { id } = await params;
  const role = await getMockRoleFromCookie();
  const job = getJob('repair', id);

  if (!job) notFound();

  // Owner check (weeeu-owner seeing their own job)
  if (role === 'weeeu-owner' && job.ownerId === 'user-001') {
    return <OwnerRedirectModal jobId={id} type="repair" title={job.title} />;
  }

  // WeeeR or admin — full detail
  if (role === 'weeer' || role === 'admin') {
    return <RepairJobDetail job={job} />;
  }

  // All others (anonymous, weeeu, weeet, weeeu-owner for non-own jobs) → login gate
  return (
    <WeeeRLoginGate
      jobId={id}
      type="repair"
      headline={job.title}
      applianceType={job.applianceType}
      area={job.area}
    />
  );
}
