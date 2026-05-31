'use client';

interface Props {
  categories: string[];
  selected: string;
  onChange: (cat: string) => void;
}

export default function ArticleCategoryFilter({ categories, selected, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
            cat === selected
              ? 'bg-website-brand-700 text-white border-website-brand-700'
              : 'bg-white text-gray-700 border-gray-300 hover:border-website-brand-500 hover:text-website-brand-700'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
