import { Link } from "react-router-dom";
import {
  Radio, Upload, ArrowRight, Lock, Camera, Database, Sparkles,
  CheckCircle2, ShieldAlert, AlertTriangle, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();

  const features = [
    { icon: Radio, title: t("home.feature.realtime.title"), desc: t("home.feature.realtime.desc") },
    { icon: Camera, title: t("home.feature.capture.title"), desc: t("home.feature.capture.desc") },
    { icon: Database, title: t("home.feature.audit.title"), desc: t("home.feature.audit.desc") },
    { icon: Lock, title: t("home.feature.console.title"), desc: t("home.feature.console.desc") },
  ];

  const decisionStates = [
    {
      Icon: CheckCircle2,
      label: t("home.outcome.allowed"),
      desc: t("home.outcome.allowed.desc"),
      accent: "text-success",
      border: "border-success/30",
      bg: "bg-success/5",
    },
    {
      Icon: ShieldAlert,
      label: t("home.outcome.notallowed"),
      desc: t("home.outcome.notallowed.desc"),
      accent: "text-destructive",
      border: "border-destructive/30",
      bg: "bg-destructive/5",
    },
    {
      Icon: AlertTriangle,
      label: t("home.outcome.unsure"),
      desc: t("home.outcome.unsure.desc"),
      accent: "text-warning",
      border: "border-warning/30",
      bg: "bg-warning/5",
    },
  ];

  const steps = [
    { n: "01", title: t("home.workflow.s1.title"), desc: t("home.workflow.s1.desc") },
    { n: "02", title: t("home.workflow.s2.title"), desc: t("home.workflow.s2.desc") },
    { n: "03", title: t("home.workflow.s3.title"), desc: t("home.workflow.s3.desc") },
  ];

  return (
    <div className="relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "var(--gradient-hero)" }}
        aria-hidden
      />
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-70" aria-hidden />

      {/* HERO */}
      <section className="container relative pt-20 sm:pt-28 pb-20">
        <div className="max-w-4xl mx-auto text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full surface mb-8">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-mono tracking-[0.18em] uppercase text-muted-foreground">
              {t("home.badge")}
            </span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl lg:text-[88px] font-bold tracking-[-0.04em] leading-[0.95] mb-6">
            {t("home.title.line1")}
            <br />
            <span className="text-orange-gradient">{t("home.title.line2")}</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("home.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="btn-orange rounded-full h-12 px-7 text-[15px] font-semibold">
              <Link to="/scan">
                <Radio className="h-4 w-4" />
                {t("home.cta.live")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full h-12 px-7 text-[15px] border-border/80 hover:bg-secondary hover:border-primary/40"
            >
              <Link to="/analyze">
                <Upload className="h-4 w-4" />
                {t("home.cta.analyze")}
              </Link>
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
            <span>{t("home.trust.1")}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{t("home.trust.2")}</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">{t("home.trust.3")}</span>
          </div>
        </div>

        <div className="mt-20 max-w-5xl mx-auto">
          <p className="text-center text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-6">
            {t("home.outcomes.title")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {decisionStates.map((s, i) => (
              <div
                key={s.label}
                className={`surface-elevated rounded-2xl p-6 animate-fade-up border ${s.border} ${s.bg}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`h-11 w-11 rounded-xl bg-background/60 backdrop-blur flex items-center justify-center mb-4 ${s.accent}`}>
                  <s.Icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <p className={`font-display font-bold text-xl tracking-tight ${s.accent}`}>{s.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container relative py-20">
        <div className="max-w-2xl mb-12 animate-fade-up">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-3">
            {t("home.features.eyebrow")}
          </p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            {t("home.features.title.a")}
            <span className="text-orange-gradient">{t("home.features.title.b")}</span>
            {t("home.features.title.c")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group surface rounded-2xl p-6 hover:border-primary/40 hover:shadow-[0_8px_32px_-12px_hsl(22_100%_55%/0.3)] transition-all animate-fade-up cursor-default"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-1.5 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container relative py-20">
        <div className="surface-elevated rounded-3xl p-8 sm:p-14 noise overflow-hidden relative">
          <div
            className="absolute -top-32 -right-32 h-80 w-80 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(22 100% 55% / 0.25), transparent 70%)" }}
            aria-hidden
          />
          <div className="relative">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-3">
              {t("home.workflow.eyebrow")}
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-12 max-w-2xl">
              {t("home.workflow.title.a")}
              <span className="text-orange-gradient">{t("home.workflow.title.b")}</span>
              {t("home.workflow.title.c")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((step) => (
                <div key={step.n} className="relative">
                  <div className="font-mono text-[11px] tracking-[0.2em] text-primary mb-3">
                    {t("home.workflow.step")} {step.n}
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container relative py-20">
        <div className="max-w-3xl mx-auto text-center">
          <Logo className="h-14 w-14 mx-auto mb-6 animate-float" />
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            {t("home.cta2.title")}
          </h2>
          <p className="text-muted-foreground mb-8">{t("home.cta2.subtitle")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="btn-orange rounded-full h-12 px-7 font-semibold">
              <Link to="/scan">
                {t("home.cta2.launch")} <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="rounded-full h-12 px-7 text-muted-foreground hover:text-foreground">
              <Link to="/admin/login">{t("home.cta2.admin")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
