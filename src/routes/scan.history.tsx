import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { History, RefreshCw, ImageOff, ShieldCheck, ShieldAlert, HelpCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/detection";
import type { DetectedObject } from "@/lib/detection";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/scan/history")({
  head: () => ({
    meta: [
      { title: "My Scan History — BastaBakal Bawal" },
      { name: "description", content: "Recent weapon screening scans from your current session." },
      { property: "og:title", content: "My Scan History — BastaBakal Bawal" },
      { property: "og:description", content: "Recent weapon screening scans from your current session." },
    ],
  }),
  component: ScanHistory,
});

type LogRow = {
  id: string;
  created_at: string;
  source: "live" | "capture" | "upload";
  status: "ALLOWED" | "NOT_ALLOWED" | "UNSURE";
  detected_objects: DetectedObject[] | null;
  max_confidence: number | null;
  image_path: string | null;
};

function ScanHistory() {
  const [rows, setRows] = useState<LogRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sid = getSessionId();
    const { data, error } = await supabase
      .from("detection_logs")
      .select("id, created_at, source, status, detected_objects, max_confidence, image_path")
      .eq("session_id", sid)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      toast.error("Could not load history", { description: error.message });
      setRows([]);
    } else {
      setRows((data ?? []) as LogRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Sign image previews
  useEffect(() => {
    if (!rows) return;
    const paths = rows.map((r) => r.image_path).filter((p): p is string => !!p && !signedUrls[p]);
    if (paths.length === 0) return;
    (async () => {
      const updates: Record<string, string> = {};
      await Promise.all(paths.map(async (p) => {
        const { data } = await supabase.storage.from("snapshots").createSignedUrl(p, 60 * 30);
        if (data?.signedUrl) updates[p] = data.signedUrl;
      }));
      if (Object.keys(updates).length) setSignedUrls((prev) => ({ ...prev, ...updates }));
    })();
  }, [rows, signedUrls]);

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-7 w-7 text-primary" /> My Scan History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Recent scans from this device session. Up to 50 most recent entries.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {loading && !rows ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
          <History className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">No scans yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Scans you perform on this device will appear here.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link to="/scan/live" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Start Live Scan
            </Link>
            <Link to="/scan/upload" className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent">
              Capture / Upload
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows?.map((r) => (
            <HistoryCard
              key={r.id}
              row={r}
              signedUrl={r.image_path ? signedUrls[r.image_path] : undefined}
              onPreview={setPreview}
            />
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute top-4 right-4 rounded-full bg-card/80 border border-border p-2 hover:bg-accent"
            onClick={() => setPreview(null)}
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={preview} alt="Snapshot preview" className="max-h-full max-w-full rounded-lg shadow-2xl" />
        </div>
      )}
    </main>
  );
}

function HistoryCard({
  row,
  signedUrl,
  onPreview,
}: {
  row: LogRow;
  signedUrl?: string;
  onPreview: (url: string) => void;
}) {
  const weapons = (row.detected_objects ?? []).filter((o) => o.is_weapon);
  const conf = row.max_confidence != null ? Math.round(row.max_confidence * 100) : null;

  const statusStyles =
    row.status === "NOT_ALLOWED"
      ? { bg: "bg-destructive/15", text: "text-destructive", ring: "ring-destructive/40", Icon: ShieldAlert }
      : row.status === "ALLOWED"
      ? { bg: "bg-success/15", text: "text-success", ring: "ring-success/40", Icon: ShieldCheck }
      : { bg: "bg-warning/15", text: "text-warning", ring: "ring-warning/40", Icon: HelpCircle };

  const { Icon } = statusStyles;
  const time = new Date(row.created_at).toLocaleString();

  return (
    <div className={`group rounded-xl border border-border bg-card/60 overflow-hidden ring-1 ${statusStyles.ring}`}>
      <button
        type="button"
        onClick={() => signedUrl && onPreview(signedUrl)}
        disabled={!signedUrl}
        className="relative aspect-video w-full bg-black/40 flex items-center justify-center overflow-hidden"
      >
        {signedUrl ? (
          <img
            src={signedUrl}
            alt={`Snapshot ${row.id}`}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : row.image_path ? (
          <Skeleton className="absolute inset-0 rounded-none" />
        ) : (
          <div className="text-muted-foreground text-xs flex flex-col items-center gap-1.5">
            <ImageOff className="h-6 w-6" />
            No snapshot saved
          </div>
        )}
        <span className={`absolute top-2 left-2 inline-flex items-center gap-1 rounded-full ${statusStyles.bg} ${statusStyles.text} px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest font-semibold`}>
          <Icon className="h-3 w-3" /> {row.status.replace("_", " ")}
        </span>
        {conf !== null && (
          <span className="absolute top-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-mono">
            {conf}%
          </span>
        )}
      </button>
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono uppercase tracking-widest">
          <span>{row.source}</span>
          <span>{time}</span>
        </div>
        <div className="text-sm">
          {weapons.length > 0 ? (
            <span className="font-semibold text-destructive">
              {weapons.map((w) => w.name).join(", ")}
            </span>
          ) : row.detected_objects && row.detected_objects.length > 0 ? (
            <span className="text-muted-foreground">
              {row.detected_objects.slice(0, 3).map((o) => o.name).join(", ")}
              {row.detected_objects.length > 3 ? "…" : ""}
            </span>
          ) : (
            <span className="text-muted-foreground italic">No objects identified</span>
          )}
        </div>
      </div>
    </div>
  );
}
