// D15 — WeeeU loading (wraps shared @app3r/ui LoadingScreen with role theme #0DC36C)
import { LoadingScreen } from "@app3r/ui";

export default function Loading() {
  return <LoadingScreen roleTheme={{ primary: "#0DC36C" }} label="กำลังโหลด... (Loading)" />;
}
