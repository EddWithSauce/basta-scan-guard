import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/SiteHeader";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary text-glow">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BastaBakal Bawal — AI Weapon Screening" },
      { name: "description", content: "AI-powered deadly weapon detection for security checkpoints. Live camera, capture, and upload screening with instant ALLOWED / NOT ALLOWED decisions." },
      { name: "author", content: "BastaBakal Bawal" },
      { property: "og:title", content: "BastaBakal Bawal — AI Weapon Screening" },
      { property: "og:description", content: "AI-powered deadly weapon detection for security checkpoints. Live camera, capture, and upload screening with instant ALLOWED / NOT ALLOWED decisions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "BastaBakal Bawal — AI Weapon Screening" },
      { name: "twitter:description", content: "AI-powered deadly weapon detection for security checkpoints. Live camera, capture, and upload screening with instant ALLOWED / NOT ALLOWED decisions." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9f2baeb1-add8-4ff4-ab4a-7532e6353594/id-preview-e5723b04--c7d50922-62f4-486a-a219-bfeafb90952d.lovable.app-1776848269654.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9f2baeb1-add8-4ff4-ab4a-7532e6353594/id-preview-e5723b04--c7d50922-62f4-486a-a219-bfeafb90952d.lovable.app-1776848269654.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <SiteHeader />
      <Outlet />
      <Toaster theme="dark" richColors position="top-center" />
    </>
  );
}
