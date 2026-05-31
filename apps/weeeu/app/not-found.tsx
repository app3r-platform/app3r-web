// D14 — WeeeU 404 (wraps shared @app3r/ui NotFoundScreen with role theme #0DC36C)
import { NotFoundScreen } from "@app3r/ui";

export default function NotFound() {
  return (
    <NotFoundScreen
      roleTheme={{ primary: "#0DC36C", surface: "#E1F7EC" }}
      ctaHref="/dashboard"
      ctaLabel="กลับหน้าหลัก (Home)"
    />
  );
}
