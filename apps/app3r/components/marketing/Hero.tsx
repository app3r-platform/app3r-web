import Link from 'next/link';
import { heroContent } from '@/lib/content/hero';

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white py-20 px-4">
      <div className="max-w-7xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-purple-700/50 border border-purple-500/50 px-4 py-1.5 rounded-full text-sm">
          <span className="text-yellow-400">⚡</span>
          <span>แพลตฟอร์มเครื่องใช้ไฟฟ้าครบวงจรแห่งแรกในไทย</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
          {heroContent.headline.split(' ').map((word, i) =>
            word === 'เครื่องใช้ไฟฟ้า' ? (
              <span key={i} className="text-yellow-400">{word} </span>
            ) : (
              <span key={i}>{word} </span>
            )
          )}
        </h1>
        <p className="text-lg sm:text-xl text-purple-200 max-w-2xl mx-auto">
          {heroContent.subheadline}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Link
            href={heroContent.ctaPrimary.href}
            className="bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-xl hover:bg-yellow-300 transition text-lg"
          >
            {heroContent.ctaPrimary.label} →
          </Link>
          <Link
            href={heroContent.ctaSecondary.href}
            className="border border-white/50 text-white px-8 py-3 rounded-xl hover:bg-white/10 transition text-lg"
          >
            {heroContent.ctaSecondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
