import { redirect } from 'next/navigation';

// O2R-A (Advisor RULING B): canonical legal route = /legal/privacy (CMS-ready
// via /legal/[slug]). This stub permanently redirects the old bare /privacy
// path so any lingering external/bookmarked link does not 404.
export default function PrivacyRedirect() {
  redirect('/legal/privacy');
}
