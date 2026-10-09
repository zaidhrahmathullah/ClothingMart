import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";

type Tone =
  | "error"
  | "warning"
  | "success"
  | "info";

export default function InlineAlert({
  tone = "info",
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}) {
  const Icon =
    tone === "error"
      ? AlertCircle
      : tone === "warning"
        ? TriangleAlert
        : tone === "success"
          ? CheckCircle2
          : Info;

  const styles = {
    error:
      "border-red-200 bg-red-50/70 text-red-800",
    warning:
      "border-amber-200 bg-amber-50/70 text-amber-800",
    success:
      "border-emerald-200 bg-emerald-50/70 text-emerald-800",
    info:
      "border-blue-200 bg-blue-50/70 text-blue-800",
  }[tone];

  return (
    <div
      role={
        tone === "error"
          ? "alert"
          : "status"
      }
      className={`flex items-start gap-3 border px-4 py-3 ${styles}`}
    >
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0"
        aria-hidden="true"
      />

      <div className="min-w-0 text-sm leading-5">
        {title && (
          <p className="font-semibold">
            {title}
          </p>
        )}

        <div
          className={
            title ? "mt-0.5" : ""
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}