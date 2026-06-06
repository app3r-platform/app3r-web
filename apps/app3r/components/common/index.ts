// ============================================================
// components/common/index.ts — barrel for cross-cut components
// ============================================================

// C1 — RoleAwareCTA
export { default as RoleAwareCTA } from "./RoleAwareCTA";
export type { RoleAwareCTAProps, CTAIntent, RoleCTAOverride } from "./RoleAwareCTA";

// C2 — TermTooltip
export { default as TermTooltip, TERM_COPY } from "./TermTooltip";
export type { TermTooltipProps, TermKey, TermCopy } from "./TermTooltip";

// C4 — NearMeToggle
export { default as NearMeToggle } from "./NearMeToggle";
export type { NearMeToggleProps } from "./NearMeToggle";

// C5 — AdSlot
export { default as AdSlot } from "./AdSlot";
export type { AdSlotProps, AdSlotSize } from "./AdSlot";

// Round 2 — CopyShareButton (ปุ่มคัดลอก/แชร์ลิงก์ประกาศ · เลนส์ #4)
export { default as CopyShareButton } from "./CopyShareButton";

// C7 — ConditionalSection
export { default as ConditionalSection } from "./ConditionalSection";
export type { ConditionalSectionProps } from "./ConditionalSection";

// NOTE: C6 QnAThread lives in components/listings/QnAThread.tsx (near related comps),
// import it directly: `@/components/listings/QnAThread`.

// P2 Mockup Completeness — mock-anno annotation components (grep `mock-anno` ลบตอนโค้ดจริง)
export { MockAnnoOrigin, MockAnnoNav, MockAnnoXapp } from "./MockAnno";
export type { } from "./MockAnno";
