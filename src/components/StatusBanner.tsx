import { CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinalStatus } from "@/lib/detection";
import { useI18n } from "@/lib/i18n";

interface Props {
  status: FinalStatus | null;
  topLabel?: string | null;
  topScore?: number | null;
  className?: string;
}

export default function StatusBanner({ status, topLabel, topScore, className }: Props) {
  const { t } = useI18n();

  if (!status) {
    return (
      <div className={cn("surface rounded-2xl p-6 text-center", className)}>
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-blink" />
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.2em] uppercase">
            {t("status.awaiting")}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{t("status.awaitingHint")}</p>
      </div>
    );
  }

  const config = {
    ALLOWED: {
      icon: CheckCircle2,
      label: t("status.allowed"),
      sublabel: t("home.outcome.allowed.desc"),
      ringClass: "ring-1 ring-success/40",
      textClass: "text-success",
      bgGradient: "linear-gradient(135deg, hsl(142 70% 48% / 0.18), hsl(160 65% 42% / 0.06))",
      shadowClass: "shadow-[0_10px_40px_-10px_hsl(142_70%_48%/0.45)]",
    },
    NOT_ALLOWED: {
      icon: ShieldAlert,
      label: t("status.notAllowed"),
      sublabel: t("home.outcome.notallowed.desc"),
      ringClass: "ring-1 ring-destructive/50 animate-pulse-danger",
      textClass: "text-destructive",
      bgGradient: "linear-gradient(135deg, hsl(0 84% 55% / 0.22), hsl(348 80% 50% / 0.08))",
      shadowClass: "shadow-[0_10px_40px_-10px_hsl(0_84%_60%/0.55)]",
    },
    UNSURE: {
      icon: AlertTriangle,
      label: t("status.unsure"),
      sublabel: t("home.outcome.unsure.desc"),
      ringClass: "ring-1 ring-warning/40",
      textClass: "text-warning",
      bgGradient: "linear-gradient(135deg, hsl(42 100% 58% / 0.2), hsl(28 90% 50% / 0.06))",
      shadowClass: "shadow-[0_10px_40px_-10px_hsl(42_100%_58%/0.45)]",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-2xl p-6 animate-fade-up overflow-hidden relative",
        config.ringClass,
        config.shadowClass,
        className
      )}
      style={{ background: config.bgGradient, backgroundColor: "hsl(var(--card))" }}
    >
      <div className="flex items-start gap-4">
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0", "bg-background/40 backdrop-blur")}>
          <Icon className={cn("h-7 w-7", config.textClass)} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
            {t("status.awaiting") /* visually replaced by main label */ ? "" : ""}
          </p>
          <p className={cn("font-display text-2xl sm:text-[28px] font-bold leading-tight tracking-tight", config.textClass)}>
            {config.label}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{config.sublabel}</p>
          {topLabel && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 backdrop-blur border border-border/50">
              <span className="text-xs font-mono text-foreground">{topLabel.toUpperCase()}</span>
              {typeof topScore === "number" && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {(topScore * 100).toFixed(1)}%
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
