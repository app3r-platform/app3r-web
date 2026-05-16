"use client";
// ── listings/_components/AcceptJobButton.tsx — Client Component ───────────────
// TODO: connect real offer/accept endpoint in next Sub-CMD

interface AcceptJobButtonProps {
  jobId: string;
}

export default function AcceptJobButton({ jobId: _jobId }: AcceptJobButtonProps) {
  return (
    <button
      className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      onClick={() => {
        // TODO: connect real offer/accept endpoint
        alert("ฟีเจอร์นี้จะเชื่อม Backend ในขั้นตอนถัดไป (Sub-CMD ถัดไป)");
      }}
    >
      ✋ รับงานนี้
    </button>
  );
}
