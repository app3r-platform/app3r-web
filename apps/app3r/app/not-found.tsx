// Global 404 fallback for Website (W-Round-1 Wave 2 Track A)
// Per-page `notFound()` calls (e.g., legal/[slug]) bubble up to this route.
import { NotFoundScreen } from "@app3r/ui";

const WEBSITE_BRAND = { primary: "#1E9E5A" };

export default function NotFound() {
  return <NotFoundScreen roleTheme={WEBSITE_BRAND} />;
}
