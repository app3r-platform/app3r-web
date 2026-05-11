"use client";

interface Props {
  label: string;
  isLastSubStage?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function AdvanceStageButton({ label, isLastSubStage, loading, disabled, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 ${
        isLastSubStage
          ? "bg-green-600 hover:bg-green-500 text-white"
          : "bg-orange-600 hover:bg-orange-500 text-white"
      }`}
    >
      {loading ? "กำลังบันทึก..." : label}
    </button>
  );
}
