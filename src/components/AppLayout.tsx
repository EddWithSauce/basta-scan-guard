import { ReactNode } from "react";
import { Link, NavLink as RRNavLink, useNavigate } from "react-router-dom";
import { Radio, Upload, LayoutDashboard, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import LanguageToggle from "./LanguageToggle";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { isAdmin, user, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const nav = [
    { to: "/scan", label: t("nav.live"), icon: Radio },
    { to: "/analyze", label: t("nav.analyze"), icon: Upload },
    { to: "/admin", label: t("nav.dashboard"), icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/75 border-b border-border/60">
        <div className="container flex h-[68px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <Logo className="h-9 w-9" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-[17px] tracking-tight">
                BastaBakal<span className="text-orange-gradient">Bawal</span>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground tracking-[0.18em] uppercase mt-0.5">
                {t("brand.tagline")}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 surface rounded-full p-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <RRNavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                      isActive
                        ? "btn-orange"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </RRNavLink>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle />
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full surface">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-blink" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                    {isAdmin ? t("nav.role.admin") : t("nav.role.user")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                  aria-label={t("nav.signOut")}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button asChild size="sm" className="btn-orange rounded-full px-5">
                <Link to="/admin/login">{t("nav.admin")}</Link>
              </Button>
            )}
          </div>

          {/* Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden h-10 w-10 p-0 rounded-full">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background border-l border-border">
              <div className="flex flex-col h-full pt-6">
                <Link to="/" className="flex items-center gap-3 mb-8">
                  <Logo className="h-8 w-8" />
                  <span className="font-display font-bold text-base">
                    BastaBakal<span className="text-orange-gradient">Bawal</span>
                  </span>
                </Link>
                <div className="flex flex-col gap-1">
                  {nav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <RRNavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/15 text-primary"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )
                        }
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </RRNavLink>
                    );
                  })}
                </div>
                <div className="mt-auto pt-6 border-t border-border space-y-3">
                  <div className="flex justify-center">
                    <LanguageToggle />
                  </div>
                  {user ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        await signOut();
                        navigate("/");
                      }}
                    >
                      <LogOut className="h-4 w-4" /> {t("nav.signOut")}
                    </Button>
                  ) : (
                    <Button asChild className="w-full btn-orange">
                      <Link to="/admin/login">{t("nav.adminLogin")}</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/40 py-8 mt-12">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo className="h-6 w-6" />
            <span className="font-display font-semibold text-sm">BastaBakalBawal</span>
          </div>
          <p className="text-[11px] font-mono text-muted-foreground tracking-widest uppercase">
            {t("footer.brandLine", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}
