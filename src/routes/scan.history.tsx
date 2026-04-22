import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ImageOff, X, History as HistoryIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, type DetectionResult, type DetectionSource } from "@/lib/detection";

export const Route = createFileRoute("/scan/history")({
  head: () => ({
    meta: [
      { title: "My Scan History — BastaBakal Bawal" },
      { name: "description", content: "View your recent weapon screening scans from this session." },
    ],
  }),
  component: HistoryPage,
});

type LogRow = {
  id: string;
  created_at: string;
  source: DetectionSource;
  status: DetectionResult["status"];
  detected_objects: { name: string; is_weapon: boolean; confidence: number }[];
  max_confidence: number | null;
  image_path: string | null;
};

function statusStyles(status: LogRow["status"]) {
  switch (status) {
    case "ALLOWED":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "NOT_ALLOWED":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    default:
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  }
}

function HistoryPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sessionId = getSessionId();
        const { data, error } = await supabase
          .from("detection_logs")
          .select("id, created_at, source, status, detected_objects, max_confidence, image_path")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        if (cancelled) return;
        const list = (data ?? []) as unknown as LogRow[];
        setRows(list);

        // Sign URLs for snapshots
        const paths = list.map((r) => r.image_path).filter((p): p is string => !!p);
        if (paths.length) {
          const entries: Record<string, string> = {};
          await Promise.all(
            paths.map(async (p) => {
              const { data: s } = await supabase.storage
                .from("snapshots")
                .createSignedUrl(p, 3600);
              if (s?.signedUrl) entries[p] = s.signedUrl;
            }),
          );
          if (!cancelled) setSignedUrls(entries);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <HistoryIcon className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">My Scan History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your last 50 scans from this device session.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/60 p-10 text-center">
          <p className="text-muted-foreground mb-4">No scans yet in this session.</p>
          <div className="flex justify-center gap-3">
            <Link
              to="/scan/live"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Start Live Scan
            </Link>
            <Link
              to="/scan/upload"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              Upload Image
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const url = row.image_path ? signedUrls[row.image_path] : undefined;
            const objs = Array.isArray(row.detected_objects) ? row.detected_objects : [];
            const conf = row.max_confidence ?? 0;
            return (
              <article
                key={row.id}
                className="rounded-xl border border-border bg-card/60 overflow-hidden flex flex-col"
              >
                <button
                  onClick={() => url && setPreview(url)}
                  disabled={!url}
                  className="relative aspect-video bg-black/60 flex items-center justify-center group"
                  aria-label="View snapshot"
                >
                  {url ? (
                    <img
                      src={url}
                      alt="Scan snapshot"
                      className="absolute inset-0 h-full w-full object-cover transition-opacity group-hover:opacity-90"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <ImageOff className="h-6 w-6" />
                      <span className="text-xs">No snapshot</span>
                    </div>
                  )}
                </button>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest ${statusStyles(
                        row.status,
                      )}`}
                    >
                      {row.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      {row.source}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Confidence: </span>
                    <span className="font-mono font-semibold">
                      {(conf * 100).toFixed(0)}%
                    </span>
                  </div>
                  {objs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-auto pt-1">
                      {objs.slice(0, 4).map((o, i) => (
                        <span
                          key={i}
                          className={`text-[10px] rounded px-1.5 py-0.5 border ${
                            o.is_weapon
                              ? "border-red-500/40 text-red-400 bg-red-500/10"
                              : "border-border text-muted-foreground bg-muted/30"
                          }`}
                        >
                          {o.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 rounded-full bg-background/80 p-2 hover:bg-background"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={preview}
            alt="Snapshot preview"
            className="max-h-full max-w-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
