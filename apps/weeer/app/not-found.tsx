// D14 — WeeeR 404 (Track A · @app3r/ui NotFoundScreen · roleTheme weeer #FF663A)
import { NotFoundScreen } from "@app3r/ui";

export default function NotFound() {
  return (
    <NotFoundScreen
      roleTheme={{ primary: "#FF663A", surface: "#FFF1ED" }}
      ctaHref="/dashboard"
      ctaLabel="กลับหน้าหลัก (Dashboard)"
    />
  );
}
