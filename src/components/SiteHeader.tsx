import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40 group-hover:bg-primary/25 transition">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="font-bold tracking-tight text-base">
              BastaBakal <span className="text-primary">Bawal</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
              Weapon Screening AI
            </div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <NavLink to="/scan/live">Live Detection</NavLink>
          <NavLink to="/scan/upload">Capture / Upload</NavLink>
          <NavLink to="/scan/history">My History</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
        <Link
          to="/scan/live"
          className="md:hidden text-xs font-semibold rounded-md bg-primary text-primary-foreground px-3 py-1.5"
        >
          Scan
        </Link>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition"
      activeProps={{ className: "px-3 py-2 rounded-md text-foreground bg-accent/60" }}
    >
      {children}
    </Link>
  );
}
