import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Shield, ShieldAlert, ShieldCheck, AlertTriangle, Download, Trash2,
  RefreshCw, Search, Loader2, Image as ImageIcon, Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyLabel } from "@/lib/detection";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LogRow {
  id: string;
  created_at: string;
  scan_type: "live" | "capture" | "upload";
  final_status: "ALLOWED" | "NOT_ALLOWED" | "UNSURE";
  detected_labels: string[];
  confidence_scores: number[];
  image_url: string | null;
  notes: string | null;
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("detection_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error(t("admin.loadFailed", { msg: error.message }));
    } else {
      setLogs((data ?? []) as LogRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (statusFilter !== "all" && l.final_status !== statusFilter) return false;
      if (dateFilter) {
        const d = format(new Date(l.created_at), "yyyy-MM-dd");
        if (d !== dateFilter) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const inLabels = l.detected_labels.some((lab) => lab.toLowerCase().includes(q));
        const inNotes = (l.notes ?? "").toLowerCase().includes(q);
        const inType = l.scan_type.includes(q);
        if (!inLabels && !inNotes && !inType) return false;
      }
      return true;
    });
  }, [logs, search, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const flagged = logs.filter((l) => l.final_status === "NOT_ALLOWED").length;
    const allowed = logs.filter((l) => l.final_status === "ALLOWED").length;
    const unsure = logs.filter((l) => l.final_status === "UNSURE").length;
    return { total, flagged, allowed, unsure };
  }, [logs]);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("detection_logs").delete().eq("id", id);
    if (error) {
      toast.error(t("admin.deleteFailed", { msg: error.message }));
    } else {
      toast.success(t("admin.deleted"));
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
    setDeleteId(null);
  }

  function exportCSV() {
    if (filtered.length === 0) {
      toast.error(t("admin.exportEmpty"));
      return;
    }
    const header = ["id", "created_at", "scan_type", "final_status", "detected_labels", "confidence_scores", "image_url", "notes"];
    const rows = filtered.map((l) => [
      l.id,
      l.created_at,
      l.scan_type,
      l.final_status,
      l.detected_labels.join("|"),
      l.confidence_scores.join("|"),
      l.image_url ?? "",
      (l.notes ?? "").replace(/"/g, '""'),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bastabakalbawal-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("admin.exported", { n: filtered.length }));
  }

  return (
    <AppLayout>
      <div className="container py-10 max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10 animate-fade-up">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-3">
              {t("admin.eyebrow")}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
              {t("admin.title.a")}<span className="text-orange-gradient">{t("admin.title.b")}</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("admin.subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={load}
              disabled={loading}
              className="rounded-full h-11 px-5 border-border hover:border-primary/50"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> {t("admin.refresh")}
            </Button>
            <Button onClick={exportCSV} className="btn-orange rounded-full h-11 px-5 font-semibold">
              <Download className="h-4 w-4" /> {t("admin.export")}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Shield} label={t("admin.stat.total")} value={stats.total} tint="primary" />
          <StatCard icon={ShieldAlert} label={t("admin.stat.notAllowed")} value={stats.flagged} tint="destructive" />
          <StatCard icon={ShieldCheck} label={t("admin.stat.allowed")} value={stats.allowed} tint="success" />
          <StatCard icon={AlertTriangle} label={t("admin.stat.unsure")} value={stats.unsure} tint="warning" />
        </div>

        {/* Filters */}
        <div className="surface rounded-2xl p-4 mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-background/40 border-border/60 rounded-xl focus-visible:border-primary"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-11 bg-background/40 border-border/60 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.filter.all")}</SelectItem>
              <SelectItem value="NOT_ALLOWED">{t("admin.stat.notAllowed")}</SelectItem>
              <SelectItem value="ALLOWED">{t("admin.stat.allowed")}</SelectItem>
              <SelectItem value="UNSURE">{t("admin.stat.unsure")}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-[170px] h-11 bg-background/40 border-border/60 rounded-xl"
          />
          {(search || statusFilter !== "all" || dateFilter) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setDateFilter("");
              }}
              className="h-11 rounded-xl text-muted-foreground hover:text-foreground"
            >
              {t("admin.clear")}
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="surface-elevated rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-muted-foreground text-[10px] uppercase tracking-[0.18em] font-mono">
                <tr>
                  <th className="px-5 py-4 text-left font-medium">{t("admin.col.time")}</th>
                  <th className="px-5 py-4 text-left font-medium">{t("admin.col.source")}</th>
                  <th className="px-5 py-4 text-left font-medium">{t("admin.col.status")}</th>
                  <th className="px-5 py-4 text-left font-medium">{t("admin.col.detections")}</th>
                  <th className="px-5 py-4 text-left font-medium">{t("admin.col.snapshot")}</th>
                  <th className="px-5 py-4 text-right font-medium">{t("admin.col.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-20 text-center">
                      <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
                        {logs.length === 0 ? t("admin.empty.none") : t("admin.empty.noMatch")}
                      </p>
                      {logs.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                          {t("admin.empty.hint")}
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id} className="border-t border-border/40 hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                        {format(new Date(l.created_at), "MMM d · HH:mm:ss")}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-mono uppercase tracking-[0.18em] px-2 py-1 rounded-md bg-secondary border border-border/50">
                          {l.scan_type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={l.final_status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {l.detected_labels.slice(0, 3).map((lab, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 font-mono text-foreground"
                              title={`${(l.confidence_scores[i] ?? 0) * 100}%`}
                            >
                              {friendlyLabel(lab)}{" "}
                              <span className="text-muted-foreground">
                                {l.confidence_scores[i] ? `${(l.confidence_scores[i] * 100).toFixed(0)}%` : ""}
                              </span>
                            </span>
                          ))}
                          {l.detected_labels.length === 0 && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {l.detected_labels.length > 3 && (
                            <span className="text-xs text-muted-foreground self-center">
                              +{l.detected_labels.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {l.image_url ? (
                          <button
                            onClick={() => setPreviewUrl(l.image_url)}
                            className="h-11 w-16 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                          >
                            <img src={l.image_url} alt="snapshot" className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(l.id)}
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          aria-label={t("admin.delete.confirm")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-4 font-mono">
            {t("admin.showing", { a: filtered.length, b: logs.length })}
          </p>
        )}
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{t("admin.preview")}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img src={previewUrl} alt="snapshot" className="w-full rounded-lg border border-border" />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{t("admin.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.delete.desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("admin.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function StatCard({
  icon: Icon, label, value, tint,
}: {
  icon: any; label: string; value: number;
  tint: "primary" | "destructive" | "success" | "warning";
}) {
  const tintMap = {
    primary: { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" },
    destructive: { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive" },
    success: { bg: "bg-success/10", border: "border-success/30", text: "text-success" },
    warning: { bg: "bg-warning/10", border: "border-warning/30", text: "text-warning" },
  }[tint];
  return (
    <div className="surface rounded-2xl p-5 flex items-center gap-4 hover:border-border/80 transition-colors">
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border", tintMap.bg, tintMap.border, tintMap.text)}>
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="font-display text-3xl font-bold tabular-nums leading-none">{value}</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono mt-1.5">
          {label}
        </p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "ALLOWED" | "NOT_ALLOWED" | "UNSURE" }) {
  const { t } = useI18n();
  const cfg = {
    ALLOWED: "bg-success/15 text-success border-success/40",
    NOT_ALLOWED: "bg-destructive/15 text-destructive border-destructive/40",
    UNSURE: "bg-warning/15 text-warning border-warning/40",
  }[status];
  const labelKey = {
    ALLOWED: "status.allowed",
    NOT_ALLOWED: "status.notAllowed",
    UNSURE: "status.unsure",
  }[status];
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border tracking-wider whitespace-nowrap",
      cfg
    )}>
      {t(labelKey)}
    </span>
  );
}
