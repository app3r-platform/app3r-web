// D15 — Admin Loading page
// Wired from @app3r/ui LoadingScreen with Admin navy roleTheme (#2C5E8C)
// Track A Shared Commons — CMD WP-A / admin-c12-cleanup

import { LoadingScreen } from "@app3r/ui";

const ADMIN_THEME = { primary: "#2C5E8C" } as const;

export default function Loading() {
  return (
    <LoadingScreen
      roleTheme={ADMIN_THEME}
      label="กำลังโหลด... (Loading)"
    />
  );
}
