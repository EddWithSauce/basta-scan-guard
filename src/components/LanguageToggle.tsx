import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  compact?: boolean;
}

/**
 * Two-state language toggle (EN ↔ TL). Persists to localStorage via i18n provider.
 * Renders the *target* language as the label so users know what clicking will do.
 */
export default function LanguageToggle({ className, compact }: Props) {
  const { lang, toggle, t } = useI18n();
  const target = lang === "en" ? t("lang.toggle") : t("lang.toggleBack");

  return (
    <Button
      type="button"
      onClick={toggle}
      variant="outline"
      size="sm"
      aria-label={`${t("lang.label")}: ${target}`}
      className={cn(
        "rounded-full border-border/70 hover:border-primary/50 hover:bg-secondary gap-2 font-mono text-[11px] uppercase tracking-[0.18em]",
        compact ? "h-9 px-3" : "h-9 px-4",
        className
      )}
    >
      <Languages className="h-3.5 w-3.5" />
      <span className="flex items-center gap-1.5">
        <span className={cn(lang === "en" ? "text-primary" : "text-muted-foreground")}>EN</span>
        <span className="text-muted-foreground/50">/</span>
        <span className={cn(lang === "tl" ? "text-primary" : "text-muted-foreground")}>TL</span>
      </span>
    </Button>
  );
}
