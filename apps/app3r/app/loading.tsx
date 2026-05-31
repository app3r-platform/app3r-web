// Global loading boundary for Website (W-Round-1 Wave 2 Track A)
import { LoadingScreen } from "@app3r/ui";

const WEBSITE_BRAND = { primary: "#1E9E5A" };

export default function Loading() {
  return <LoadingScreen roleTheme={WEBSITE_BRAND} />;
}
