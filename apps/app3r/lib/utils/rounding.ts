// ============================================================
// lib/utils/rounding.ts — D75 Point Rounding Rule
// Phase C-4.1b
// ============================================================

export interface PointRoundingContext {
  fee_type: 'service_fee' | 'commission' | 'withdrawal_fee' | string;
  app: 'website' | 'weeeu' | 'weeer' | 'weeet' | 'admin';
  formula?: string;
  transaction_id?: string;
}

/**
 * D75: Round raw fee/point values using Math.round (half-up).
 * Also logs to localStorage when running client-side (Phase 2 mock log).
 */
export function roundPoint(value: number, context: PointRoundingContext): number {
  const rounded = Math.round(value);

  // Phase 2 mock log — localStorage only, no-op on server
  if (typeof window !== 'undefined') {
    try {
      const logKey = 'app3r-rounding-log';
      const existing: unknown[] = JSON.parse(localStorage.getItem(logKey) ?? '[]');
      const delta = rounded - value;
      existing.push({
        original_value: value,
        rounded_value: rounded,
        delta,
        direction: delta >= 0 ? 'up' : 'down',
        context,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(logKey, JSON.stringify(existing.slice(-100)));
    } catch {
      // silently fail — localStorage may be unavailable
    }
  }

  return rounded;
}
