// D14 — WeeeT 404 (wire @app3r/ui NotFoundScreen · roleTheme weeet #1696F9)
import { NotFoundScreen } from "@app3r/ui";

export default function NotFound() {
  return (
    <NotFoundScreen
      roleTheme={{ primary: "#1696F9", surface: "#E4F1FD" }}
      ctaHref="/jobs"
      ctaLabel="กลับหน้างาน"
    />
  );
}
