import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getArticleById, articles } from '@/lib/mock/articles'

export async function generateStaticParams() {
  return articles.map((a) => ({ id: a.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = getArticleById(id)
  if (!article) return { title: 'Not Found' }
  return {
    title: article.title + ' — App3R',
    description: article.excerpt,
  }
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = getArticleById(id)
  if (!article) notFound()

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <Link href="/articles" className="hover:text-purple-700">บทความ</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium line-clamp-1">{article.title}</span>
      </nav>

      <div className="mb-8">
        <div className="text-6xl mb-4 text-center">{article.emoji}</div>
        <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
          {article.category}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-3 mb-2 leading-snug">
          {article.title}
        </h1>
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <span>{article.author}</span>
          <span>•</span>
          <span>{article.date}</span>
          <span>•</span>
          <span>⏱ {article.readTime}</span>
        </div>
      </div>

      <div className="prose prose-gray max-w-none space-y-6">
        {article.content.map((section, i) => (
          <div key={i}>
            {section.heading && (
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">{section.heading}</h2>
            )}
            {section.type === 'tip' ? (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
                <p className="text-green-800 text-sm">💡 {section.body}</p>
              </div>
            ) : section.type === 'warning' ? (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
                <p className="text-amber-800 text-sm">⚠️ {section.body}</p>
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed">{section.body}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {article.tags.map((tag) => (
          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-10 pt-8 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          แหล่งอ้างอิง
        </h3>
        <ul className="space-y-2">
          {article.references.map((ref, i) => (
            <li key={i} className="text-sm">
              <a href={ref.url} target="_blank" rel="noopener noreferrer"
                className="text-purple-700 hover:underline">
                {ref.title}
              </a>
              <span className="text-gray-400 ml-2">— {ref.source}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <Link href="/articles"
          className="inline-flex items-center gap-2 text-sm text-purple-700 hover:underline">
          ← กลับไปหน้าบทความ
        </Link>
      </div>
    </article>
  )
}
