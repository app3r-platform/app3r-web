export function SignupSteps({ current }: { current: number }) {
  const steps = ["สมัคร", "ยืนยัน", "ประเภท", "ข้อมูล", "ที่อยู่", "ธนาคาร", "เอกสาร"];
  return (
    <div className="flex items-center justify-center gap-1 mb-6 px-2">
      {steps.map((s, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={s} className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${done ? "bg-green-600 text-white" : active ? "bg-green-700 text-white ring-2 ring-green-200" : "bg-gray-200 text-gray-500"}`}>
              {done ? "✓" : idx}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-4 h-0.5 ${done ? "bg-green-500" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
