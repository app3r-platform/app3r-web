// D75 — Point Rounding Rule (WeeeT)
// ค่าธรรมเนียม % ทุกตัว → ปัด integer (≥0.5 ขึ้น, <0.5 ลง)
export function roundPoint(value: number): number {
  return Math.round(value);
}

export function roundFee(amount: number, feePercent: number): number {
  const raw = amount * (feePercent / 100);
  return roundPoint(raw);
}
