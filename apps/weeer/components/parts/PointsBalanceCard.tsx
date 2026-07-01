"use client";

interface PointsBalanceCardProps {
  // W1 remediation (D-FE-NO-FAKE-DISPLAY): balance is nullable. When null (no real
  // Parts-points endpoint wired yet) the numbers are SUPPRESSED — never a fake/0-placeholder.
  balance: number | null;
  escrowHeld: number;
  shopName: string;
}

export function PointsBalanceCard({ balance, escrowHeld, shopName }: PointsBalanceCardProps) {
  const available = balance != null ? balance - escrowHeld : null;
  return (
    <div className="bg-gradient-to-br from-[#D63B12] to-[#F04E20] rounded-2xl p-4 text-white space-y-2">
      <p className="text-xs opacity-75">{shopName}</p>
      <div>
        <p className="text-3xl font-bold">{balance != null ? balance.toLocaleString() : "—"}</p>
        <p className="text-xs opacity-75 mt-0.5">
          {balance != null ? "คะแนนทั้งหมด (pts)" : "ยังไม่พร้อมแสดงคะแนน"}
        </p>
      </div>
      {balance != null && (
        <div className="flex gap-4 pt-1 border-t border-white/20">
          <div>
            <p className="text-sm font-semibold">{available!.toLocaleString()}</p>
            <p className="text-xs opacity-75">ใช้ได้เลย</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-yellow-300">{escrowHeld.toLocaleString()}</p>
            <p className="text-xs opacity-75">พักเงินกลาง (Escrow)</p>
          </div>
        </div>
      )}
    </div>
  );
}
