import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Camera, Upload, Activity, Zap, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <main className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              AI Security Screening · Online
            </div>
            <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight">
              See the threat
              <span className="block text-primary text-glow">before it walks in.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              BastaBakal Bawal uses real-time computer vision to detect deadly weapons —
              knives, blades, axes, swords, firearms — and instantly decides who passes
              and who doesn't.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/scan/live"
                className="group inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110 transition"
              >
                <Camera className="h-4 w-4" />
                Start Scanning
              </Link>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-6 py-3 text-sm font-semibold hover:bg-card transition"
              >
                <Lock className="h-4 w-4" />
                Admin Login
              </Link>
            </div>
          </div>

          {/* Decorative scanner card */}
          <div className="relative mx-auto mt-16 max-w-3xl">
            <div className="relative rounded-2xl border border-border bg-card/70 p-1 shadow-glow overflow-hidden">
              <div className="aspect-[16/8] w-full rounded-xl bg-gradient-to-br from-background to-secondary relative overflow-hidden">
                <div className="absolute inset-0 grid-bg opacity-50" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-primary/15 flex items-center justify-center animate-pulse-ring">
                      <ShieldCheck className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  scanner · v1.0
                </div>
                <div className="absolute bottom-3 right-4 font-mono text-[10px] text-success">
                  ● live
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={Camera}
            title="Live Detection"
            desc="Continuous camera analysis with bounding boxes around detected weapons."
            to="/scan/live"
          />
          <Feature
            icon={Upload}
            title="Capture & Upload"
            desc="Snap a photo or upload an image — get an instant ALLOWED or NOT ALLOWED verdict."
            to="/scan/upload"
          />
          <Feature
            icon={Activity}
            title="Admin Analytics"
            desc="Search every scan, review snapshots, and export logs to CSV."
            to="/admin"
          />
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Built for checkpoints that can't afford a mistake.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every scan is processed by a vision model trained to recognize harmful
              weapons. Low-confidence frames are flagged as <span className="text-warning font-semibold">UNSURE</span> — never
              guessed. All decisions are logged with timestamp, source, and snapshot.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="ALLOWED" tone="success" icon={ShieldCheck} />
            <Stat label="NOT ALLOWED" tone="danger" icon={Zap} />
            <Stat label="UNSURE" tone="warning" icon={Activity} />
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon: Icon, title, desc, to,
}: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; to: string }) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border bg-card/60 p-6 hover:border-primary/50 hover:bg-card transition"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30 mb-4 group-hover:bg-primary/25 transition">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="font-semibold text-lg">{title}</div>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}

function Stat({
  label, tone, icon: Icon,
}: { label: string; tone: "success" | "danger" | "warning"; icon: React.ComponentType<{ className?: string }> }) {
  const cls = {
    success: "border-success/40 bg-success/10 text-success",
    danger: "border-destructive/40 bg-destructive/10 text-destructive",
    warning: "border-warning/40 bg-warning/10 text-warning",
  }[tone];
  return (
    <div className={`rounded-xl border p-4 text-center ${cls}`}>
      <Icon className="h-6 w-6 mx-auto" />
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest font-semibold">
        {label}
      </div>
    </div>
  );
}
