import Link from 'next/link';
import type { Article } from '@/lib/mock/articles';

interface Props {
  articles: Article[];
  currentId: string;
  currentCategory: string;
}

export default function RelatedArticles({ articles, currentId, currentCategory }: Props) {
  const related = articles
    .filter((a) => a.id !== currentId && a.category === currentCategory)
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-5">บทความที่เกี่ยวข้อง</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {related.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition group"
          >
            <div className="text-3xl mb-3">{article.emoji}</div>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              {article.category}
            </span>
            <h3 className="font-semibold text-gray-900 text-sm mt-2 leading-snug group-hover:text-purple-700 transition line-clamp-2">
              {article.title}
            </h3>
            <div className="flex items-center gap-2 text-gray-400 text-xs mt-2">
              <span>{article.date}</span>
              <span>•</span>
              <span>⏱ {article.readTime}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
