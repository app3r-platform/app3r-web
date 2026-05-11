"use client";

interface Props {
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  submittedAt: string;
}

export function ReviewedSummaryCard({ rating, comment, submittedAt }: Props) {
  const stars = "⭐".repeat(rating);

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">✅</span>
        <p className="text-sm font-semibold text-green-800">รีวิวของคุณ</p>
      </div>

      <div className="space-y-2">
        {/* Stars */}
        <div className="flex items-center gap-2">
          <p className="text-lg leading-none">{stars}</p>
          <p className="text-sm font-bold text-green-700">{rating}/5</p>
        </div>

        {/* Comment */}
        <p className="text-sm text-green-800 bg-white rounded-xl border border-green-100 p-3 italic">
          &ldquo;{comment}&rdquo;
        </p>

        {/* Date */}
        <p className="text-xs text-green-600">
          ส่งรีวิวเมื่อ:{" "}
          {new Date(submittedAt).toLocaleDateString("th-TH", {
            dateStyle: "medium",
          })}
        </p>
      </div>
    </div>
  );
}
