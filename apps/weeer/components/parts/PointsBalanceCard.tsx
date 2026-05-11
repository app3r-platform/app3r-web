"use client";

interface PointsBalanceCardProps {
  balance: number;
  escrowHeld: number;
  shopName: string;
}

export function PointsBalanceCard({ balance, escrowHeld, shopName }: PointsBalanceCardProps) {
  const available = balance - escrowHeld;
  return (
    <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-2xl p-4 text-white space-y-2">
      <p className="text-xs opacity-75">{shopName}</p>
      <div>
        <p className="text-3xl font-bold">{balance.toLocaleString()}</p>
        <p className="text-xs opacity-75 mt-0.5">คะแนนทั้งหมด (pts)</p>
      </div>
      <div className="flex gap-4 pt-1 border-t border-white/20">
        <div>
          <p className="text-sm font-semibold">{available.toLocaleString()}</p>
          <p className="text-xs opacity-75">ใช้ได้เลย</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-yellow-300">{escrowHeld.toLocaleString()}</p>
          <p className="text-xs opacity-75">พักระหว่างกลาง (escrow)</p>
        </div>
      </div>
    </div>
  );
}
