import { Cpu, Check } from "lucide-react";
import { DETECTION_MODELS, useDetectionModel, type DetectionModel } from "@/lib/detectionModel";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  compact?: boolean;
}

export default function ModelSelector({ className, compact = false }: Props) {
  const [model, setModel] = useDetectionModel();
  const { t } = useI18n();

  return (
    <div className={cn("surface rounded-2xl p-5", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="h-3.5 w-3.5 text-primary" />
        <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
          {t("model.eyebrow")}
        </p>
      </div>

      <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-1")}>
        {DETECTION_MODELS.map((m) => {
          const active = model === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setModel(m.id as DetectionModel)}
              className={cn(
                "group relative text-left rounded-xl border p-3 transition-all",
                active
                  ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]"
                  : "border-border/50 bg-background/40 hover:border-primary/40 hover:bg-background/60"
              )}
              aria-pressed={active}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span
                  className={cn(
                    "font-display font-bold text-sm tracking-tight",
                    active ? "text-primary" : "text-foreground"
                  )}
                >
                  {m.name}
                </span>
                {active && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                {m.tagline}
              </p>
              {!compact && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {m.description}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] font-mono text-muted-foreground/70">
        {t("model.activeLabel")}:{" "}
        <span className="text-primary font-semibold">
          {DETECTION_MODELS.find((m) => m.id === model)?.name}
        </span>
      </p>
    </div>
  );
}
