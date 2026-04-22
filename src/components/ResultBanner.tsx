import type { DetectionResult } from "@/lib/detection";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

export function ResultBanner({ result }: { result: DetectionResult | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
        <p className="text-muted-foreground font-mono text-sm tracking-wide">
          AWAITING SCAN
        </p>
      </div>
    );
  }

  const cfg = {
    ALLOWED: {
      label: "ALLOWED",
      icon: ShieldCheck,
      cls: "bg-success/10 border-success/40 text-success shadow-safe",
      sub: "No deadly weapons detected.",
    },
    NOT_ALLOWED: {
      label: "NOT ALLOWED",
      icon: ShieldAlert,
      cls: "bg-destructive/10 border-destructive/50 text-destructive shadow-danger",
      sub: "Deadly weapon detected. Entry denied.",
    },
    UNSURE: {
      label: "UNSURE — PLEASE RETRY",
      icon: ShieldQuestion,
      cls: "bg-warning/10 border-warning/40 text-warning",
      sub: "Image unclear or no object visible.",
    },
  }[result.status];

  const Icon = cfg.icon;
  return (
    <div className={`rounded-xl border-2 ${cfg.cls} p-6 transition-all`}>
      <div className="flex items-center gap-4">
        <Icon className="h-12 w-12 shrink-0" />
        <div className="min-w-0">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-glow">
            {cfg.label}
          </div>
          <div className="text-sm text-foreground/80 mt-1">{cfg.sub}</div>
        </div>
        <div className="ml-auto hidden sm:block text-right font-mono text-xs">
          <div className="text-muted-foreground">Confidence</div>
          <div className="text-lg font-bold text-foreground">
            {(result.max_confidence * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      {result.objects.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {result.objects.map((o, i) => (
            <span
              key={i}
              className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                o.is_weapon
                  ? "bg-destructive/15 border-destructive/40 text-destructive"
                  : "bg-muted/60 border-border text-muted-foreground"
              }`}
            >
              {o.name} · {(o.confidence * 100).toFixed(0)}%
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
