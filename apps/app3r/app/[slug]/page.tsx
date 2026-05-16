// ============================================================
// app/[slug]/page.tsx — CMS Static Pages (type='static')
// Phase D-4 Sub-3 — ISR revalidate:60, fallback 404
// ============================================================
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCmsPage } from '@/lib/content-api';

export const revalidate = 60; // ISR — อัปเดตทุก 60 วินาที

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCmsPage(slug);
  if (!page) return { title: 'ไม่พบหน้า — App3R' };
  return {
    title: `${page.title} — App3R`,
    description: `${page.title} — App3R`,
  };
}

export default async function CmsStaticPage({ params }: Props) {
  const { slug } = await params;
  const page = await getCmsPage(slug);

  // ไม่พบ page หรือยังไม่ published → 404
  if (!page || page.status !== 'published') {
    notFound();
  }

  // body.html คาดหวังเป็น HTML string จาก CMS
  const htmlBody = typeof page.body?.html === 'string' ? page.body.html : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{page.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
          {page.title}
        </h1>
        {page.publishedAt && (
          <p className="text-sm text-gray-400">
            เผยแพร่: {new Date(page.publishedAt).toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
        {htmlBody ? (
          /* admin-controlled content จาก internal CMS */
          <div
            className="prose prose-purple max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlBody }}
          />
        ) : (
          <p className="text-gray-500 italic">ไม่มีเนื้อหา</p>
        )}
      </div>

      {/* Back link */}
      <div className="mt-8">
        <Link href="/" className="text-purple-700 hover:underline text-sm">
          ← กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
