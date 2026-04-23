"use client";

import { useEffect, useState } from "react";
import type { NotionDiagnostic } from "@/lib/notion/diagnostics";

type Props = {
  diagnostic: NotionDiagnostic;
};

const styles: Record<
  NotionDiagnostic["level"],
  { box: string; badge: string; label: string }
> = {
  ok: {
    box: "border-emerald-300 bg-emerald-50 text-emerald-950",
    badge: "bg-emerald-200",
    label: "Healthy",
  },
  warn: {
    box: "border-amber-300 bg-amber-50 text-amber-950",
    badge: "bg-amber-200",
    label: "Warning",
  },
  error: {
    box: "border-rose-300 bg-rose-50 text-rose-950",
    badge: "bg-rose-200",
    label: "Issue",
  },
};

export function DiagnosticToast({ diagnostic }: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const style = styles[diagnostic.level];

  useEffect(() => {
    if (diagnostic.level === "ok") {
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [diagnostic.level]);

  if (process.env.NODE_ENV !== "development" || !isVisible) {
    return null;
  }

  return (
    <aside className="fixed right-4 top-4 z-50 w-[min(92vw,29rem)]">
      <div className={`rounded-lg border p-4 shadow-sm ${style.box}`}>
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold tracking-tight">Diagnostics</h2>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>
              {style.label}
            </span>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            aria-label="Close diagnostic toast"
            className="rounded-full p-1 opacity-60 transition-opacity hover:bg-black/5 hover:opacity-100 leading-none"
          >
            ✕
          </button>
        </div>
        <p className="text-sm font-medium">{diagnostic.title}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          {diagnostic.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
