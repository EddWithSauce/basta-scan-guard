import { cn } from "@/lib/utils";

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <div className="absolute inset-0 rounded-xl bg-primary/30 blur-xl" />
      <svg
        viewBox="0 0 40 40"
        fill="none"
        className="relative h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(32 100% 62%)" />
            <stop offset="100%" stopColor="hsl(14 95% 48%)" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="10" fill="hsl(24 14% 8%)" stroke="url(#logoGrad)" strokeWidth="1.5" />
        {/* Stylized "B" + shield mark */}
        <path
          d="M20 9 L29 13 V21 C29 26 25 30 20 31 C15 30 11 26 11 21 V13 Z"
          fill="url(#logoGrad)"
          opacity="0.18"
        />
        <path
          d="M20 9 L29 13 V21 C29 26 25 30 20 31 C15 30 11 26 11 21 V13 Z"
          stroke="url(#logoGrad)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M16 16 H21 Q23.5 16 23.5 18.2 Q23.5 20 22 20.5 Q24 21 24 23 Q24 25.5 21 25.5 H16 Z"
          fill="url(#logoGrad)"
        />
      </svg>
    </div>
  );
}
