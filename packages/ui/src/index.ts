// Shared UI components — shadcn/ui components will be added here
export { Button } from "./button";

// Track A Shared Commons — D14 + D15 + GR-10 (HUB Gen 39 CMD W-Round-1 Wave 2)
// All accept a `roleTheme` prop so any of the 5 App3R apps can brand them per-role.
export { NotFoundScreen } from "./not-found-screen";
export type { NotFoundScreenProps } from "./not-found-screen";
export { LoadingScreen } from "./loading-screen";
export type { LoadingScreenProps } from "./loading-screen";
export { NearMeFilter } from "./near-me-filter";
export type { NearMeFilterProps, NearbyTambonDto } from "./near-me-filter";
export { ScreenIdBadge } from "./screen-id-badge";
export type { ScreenIdBadgeProps, ScreenBadgeCorner } from "./screen-id-badge";

// PT-Audit shared component (Advisor Gen 114 CMD 378813ec-7277-817c-89d4-c44af1bea631)
export { HelpTip } from "./help-tip";
export type { HelpTipProps } from "./help-tip";
