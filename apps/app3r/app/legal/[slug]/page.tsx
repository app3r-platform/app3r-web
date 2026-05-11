import { notFound } from 'next/navigation';
import Link from 'next/link';
import { staticPages } from '@/lib/content/static-pages';

export async function generateStaticParams() {
  return Object.keys(staticPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = staticPages[slug];
  if (!page) return { title: 'ไม่พบหน้า' };
  return {
    title: `${page.title} — App3R`,
    description: `${page.title} App3R`,
  };
}

function parseMarkdown(body: string): React.ReactNode[] {
  const blocks = body.split(/\n\n+/);
  return blocks.map((block, i) => {
    // H2
    if (block.startsWith('## ')) {
      return (
        <h2 key={i} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          {renderInline(block.slice(3))}
        </h2>
      );
    }
    // H3
    if (block.startsWith('### ')) {
      return (
        <h3 key={i} className="text-lg font-bold text-purple-700 mt-6 mb-3">
          {renderInline(block.slice(4))}
        </h3>
      );
    }
    // List
    const lines = block.split('\n');
    if (lines.every((l) => l.startsWith('- '))) {
      return (
        <ul key={i} className="list-disc list-inside space-y-1 text-gray-700 ml-2">
          {lines.map((l, j) => (
            <li key={j}>{renderInline(l.slice(2))}</li>
          ))}
        </ul>
      );
    }
    // Mixed lines (some list items, some not)
    if (lines.some((l) => l.startsWith('- '))) {
      return (
        <div key={i} className="space-y-1">
          {lines.map((line, j) =>
            line.startsWith('- ') ? (
              <div key={j} className="flex gap-2 text-gray-700">
                <span className="text-purple-700 flex-shrink-0">•</span>
                <span>{renderInline(line.slice(2))}</span>
              </div>
            ) : (
              <p key={j} className="text-gray-700 leading-relaxed">{renderInline(line)}</p>
            )
          )}
        </div>
      );
    }
    // Paragraph
    return (
      <p key={i} className="text-gray-700 leading-relaxed">
        {renderInline(block)}
      </p>
    );
  });
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = staticPages[slug];
  if (!page) notFound();

  const legalLinks = [
    { label: 'ข้อกำหนดการใช้งาน', href: '/legal/terms' },
    { label: 'นโยบายความเป็นส่วนตัว', href: '/legal/privacy' },
    { label: 'นโยบายคุกกี้', href: '/legal/cookies' },
    { label: 'นโยบายการคืนเงิน', href: '/legal/refund-policy' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{page.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-gray-50 rounded-xl p-4 sticky top-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">กฎหมายและนโยบาย</p>
            <nav className="space-y-1">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-lg text-sm transition ${
                    link.href === `/legal/${slug}`
                      ? 'bg-purple-700 text-white font-medium'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="lg:col-span-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{page.title}</h1>
          <div className="flex gap-4 text-xs text-gray-500 mb-8">
            <span>มีผลตั้งแต่: {page.effectiveDate}</span>
            <span>•</span>
            <span>อัปเดตล่าสุด: {page.lastModified}</span>
          </div>

          <div className="space-y-4">
            {parseMarkdown(page.body)}
          </div>
        </main>
      </div>
    </div>
  );
}
