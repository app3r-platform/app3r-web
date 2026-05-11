// ============================================================
// app/listings/maintain/[id]/page.tsx — Maintain job detail (auth-gated)
// Phase C-4.1b
// ============================================================
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMockRoleFromCookie } from '../../../../lib/auth/mock-auth';
import MaintainJobDetail from '../../../../components/listings/MaintainJobDetail';
import WeeeRLoginGate from '../../../../components/listings/WeeeRLoginGate';
import OwnerRedirectModal from '../../../../components/listings/OwnerRedirectModal';
import { getJob } from '../../../../lib/api/customer-jobs';
import { maintainJobs } from '../../../../lib/mock/maintain-jobs';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return maintainJobs.map((j) => ({ id: j.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = getJob('maintain', id);
  if (!job) return { title: 'ไม่พบประกาศ' };
  return {
    title: `${job.title} — บำรุงรักษาเครื่องใช้ไฟฟ้า — App3R`,
    description: `งานบำรุง${job.applianceType} พื้นที่${job.area}`,
  };
}

export default async function MaintainDetailPage({ params }: PageProps) {
  const { id } = await params;
  const role = await getMockRoleFromCookie();
  const job = getJob('maintain', id);

  if (!job) notFound();

  // Owner check (weeeu-owner seeing their own job)
  if (role === 'weeeu-owner' && job.ownerId === 'user-021') {
    return <OwnerRedirectModal jobId={id} type="maintain" title={job.title} />;
  }

  // WeeeR or admin — full detail
  if (role === 'weeer' || role === 'admin') {
    return <MaintainJobDetail job={job} />;
  }

  // All others → login gate
  return (
    <WeeeRLoginGate
      jobId={id}
      type="maintain"
      headline={job.title}
      applianceType={job.applianceType}
      area={job.area}
    />
  );
}
