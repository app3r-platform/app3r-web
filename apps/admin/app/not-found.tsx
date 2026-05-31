// D14 — Admin 404 Not Found page
// Wired from @app3r/ui NotFoundScreen with Admin navy roleTheme (#2C5E8C)
// Track A Shared Commons — CMD WP-A / admin-c12-cleanup

import { NotFoundScreen } from "@app3r/ui";

const ADMIN_THEME = { primary: "#2C5E8C", surface: "#EAF0F6" } as const;

export default function NotFound() {
  return (
    <NotFoundScreen
      roleTheme={ADMIN_THEME}
      title="ไม่พบหน้านี้ (Not Found)"
      message="หน้าที่คุณมองหาอาจถูกย้ายหรือลบออกจากระบบ"
      ctaHref="/"
      ctaLabel="กลับหน้า Dashboard"
    />
  );
}
