// ============================================================
// app/preview/[token]/page.tsx — Preview Mode (no cache)
// Phase D-4 Sub-3 — แสดง banner "PREVIEW MODE" ชัดเจน
// ============================================================
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPreviewPage } from '@/lib/content-api';

// ห้าม cache — preview ต้องสดทุกครั้ง
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Preview — App3R',
  // ห้าม index หน้า preview
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PreviewPage({ params }: Props) {
  const { token } = await params;
  const page = await getPreviewPage(token);

  // token ไม่ valid หรือหมดอายุ → 404
  if (!page) {
    notFound();
  }

  // body.html คาดหวังเป็น HTML string จาก CMS
  const htmlBody = typeof page.body?.html === 'string' ? page.body.html : null;

  return (
    <div>
      {/* PREVIEW MODE Banner — ต้องมองเห็นชัดเจนเสมอ */}
      <div className="sticky top-0 z-50 bg-amber-400 text-gray-900 text-center py-2 px-4 font-bold text-sm flex items-center justify-center gap-3">
        <span>⚠️ PREVIEW MODE — เนื้อหานี้ยังไม่ได้เผยแพร่</span>
        <Link
          href="/"
          className="underline text-gray-700 hover:text-gray-900 font-normal text-xs"
        >
          กลับหน้าหลัก
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Preview info bar */}
        <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-800 space-y-1">
          <p><strong>กำลัง Preview:</strong> {page.title}</p>
          <p><strong>Type:</strong> {page.type} · <strong>Slug:</strong> {page.slug}</p>
          <p><strong>Status:</strong> {page.status} · <strong>Version:</strong> {page.version}</p>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            {page.title}
          </h1>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
          {htmlBody ? (
            <div
              className="prose prose-purple max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlBody }}
            />
          ) : (
            <pre className="text-xs text-gray-500 overflow-auto bg-gray-50 rounded-lg p-4">
              {JSON.stringify(page.body, null, 2)}
            </pre>
          )}
        </div>

        {/* Images preview (ถ้ามี) */}
        {page.images && page.images.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-700 mb-4">
              รูปภาพ ({page.images.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {page.images.map((img) => (
                <div key={img.id} className="rounded-xl overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.alt ?? ''}
                    className="w-full h-40 object-cover"
                  />
                  {img.caption && (
                    <p className="p-2 text-xs text-gray-500">{img.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
