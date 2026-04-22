import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  ShieldCheck, ShieldAlert, ShieldQuestion, LogOut, Download, Trash2,
  Search, Loader2, Image as ImageIcon, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — BastaBakal Bawal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

type LogRow = {
  id: string;
  created_at: string;
  source: "live" | "capture" | "upload";
  status: "ALLOWED" | "NOT_ALLOWED" | "UNSURE";
  detected_objects: Array<{ name: string; is_weapon: boolean; confidence: number }>;
  max_confidence: number | null;
  image_path: string | null;
  session_id: string | null;
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LogRow["status"]>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Auth + role check
  useEffect(() => {
    let mounted = true;
    const sub = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/admin/login" });
    });
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/admin/login" }); return; }
      if (!mounted) return;
      setEmail(session.user.email ?? null);
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id);
      const admin = !!roles?.some((r) => r.role === "admin");
      setIsAdmin(admin);
      setAuthChecked(true);
    })();
    return () => { mounted = false; sub.data.subscription.unsubscribe(); };
  }, [navigate]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("detection_logs").select("*").order("created_at", { ascending: false }).limit(500);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (dateFrom) query = query.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo); end.setDate(end.getDate() + 1);
      query = query.lt("created_at", end.toISOString());
    }
    const { data, error } = await query;
    if (error) toast.error("Failed to load logs", { description: error.message });
    setLogs((data as unknown as LogRow[]) ?? []);
    setLoading(false);
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => { if (isAdmin) loadLogs(); }, [isAdmin, loadLogs]);

  const filtered = useMemo(() => {
    if (!q.trim()) return logs;
    const needle = q.toLowerCase();
    return logs.filter((l) =>
      l.detected_objects?.some((o) => o.name.toLowerCase().includes(needle)) ||
      l.source.includes(needle) || l.status.toLowerCase().includes(needle)
    );
  }, [logs, q]);

  const stats = useMemo(() => ({
    total: logs.length,
    allowed: logs.filter((l) => l.status === "ALLOWED").length,
    notAllowed: logs.filter((l) => l.status === "NOT_ALLOWED").length,
    unsure: logs.filter((l) => l.status === "UNSURE").length,
  }), [logs]);

  const onSignOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this log?")) return;
    const { error } = await supabase.from("detection_logs").delete().eq("id", id);
    if (error) toast.error("Delete failed", { description: error.message });
    else { toast.success("Log deleted"); setLogs((prev) => prev.filter((l) => l.id !== id)); }
  };

  const onExportCsv = () => {
    const headers = ["id","created_at","source","status","max_confidence","detected_objects","image_path","session_id"];
    const rows = filtered.map((l) => [
      l.id, l.created_at, l.source, l.status,
      l.max_confidence ?? "",
      JSON.stringify(l.detected_objects ?? []).replace(/"/g, '""'),
      l.image_path ?? "", l.session_id ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bbb-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const openSnapshot = async (path: string) => {
    const { data, error } = await supabase.storage.from("snapshots").createSignedUrl(path, 60);
    if (error || !data) { toast.error("Couldn't load image"); return; }
    setPreviewUrl(data.signedUrl);
  };

  if (!authChecked) {
    return <main className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></main>;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-warning" />
        <h1 className="mt-4 text-2xl font-bold">Admin role required</h1>
        <p className="mt-2 text-muted-foreground">
          Your account <span className="font-mono text-foreground">{email}</span> is signed in but
          does not have the <code className="font-mono text-primary">admin</code> role.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Open Cloud → Tables → <span className="font-mono">user_roles</span> and insert a row with
          your <span className="font-mono">user_id</span> and role <span className="font-mono">admin</span>.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={onSignOut} className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent">
            Sign out
          </button>
          <Link to="/" className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Signed in as <span className="font-mono text-foreground">{email}</span></p>
        </div>
        <button onClick={onSignOut} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Total scans" value={stats.total} icon={Search} tone="primary" />
        <StatCard label="Allowed" value={stats.allowed} icon={ShieldCheck} tone="success" />
        <StatCard label="Not allowed" value={stats.notAllowed} icon={ShieldAlert} tone="danger" />
        <StatCard label="Unsure" value={stats.unsure} icon={ShieldQuestion} tone="warning" />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card/60 p-4 mb-6">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by detected object, source, or status…"
              className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="ALLOWED">Allowed</option>
            <option value="NOT_ALLOWED">Not allowed</option>
            <option value="UNSURE">Unsure</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <button onClick={onExportCsv} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Logs table */}
      <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">Detected</th>
                <th className="text-left px-4 py-3">Conf.</th>
                <th className="text-left px-4 py-3">Image</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No scans yet. Run a scan to see results here.
                </td></tr>
              ) : filtered.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-accent/30">
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3"><StatusPill status={l.status} /></td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{l.source}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {l.detected_objects?.length ? l.detected_objects.map((o, i) => (
                        <span key={i} className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${
                          o.is_weapon ? "bg-destructive/15 border-destructive/40 text-destructive"
                                      : "bg-muted/60 border-border text-muted-foreground"
                        }`}>{o.name}</span>
                      )) : <span className="text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {l.max_confidence != null ? `${(l.max_confidence * 100).toFixed(0)}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {l.image_path ? (
                      <button onClick={() => openSnapshot(l.image_path!)} className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
                        <ImageIcon className="h-3.5 w-3.5" /> View
                      </button>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onDelete(l.id)} className="text-muted-foreground hover:text-destructive p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <button className="absolute top-4 right-4 rounded-full bg-card p-2" onClick={() => setPreviewUrl(null)}>
            <X className="h-5 w-5" />
          </button>
          <img src={previewUrl} alt="Snapshot" className="max-h-[90vh] max-w-full rounded-lg border border-border" />
        </div>
      )}
    </main>
  );
}

function StatCard({
  label, value, icon: Icon, tone,
}: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; tone: "primary" | "success" | "danger" | "warning" }) {
  const cls = {
    primary: "border-primary/30 text-primary",
    success: "border-success/40 text-success",
    danger: "border-destructive/40 text-destructive",
    warning: "border-warning/40 text-warning",
  }[tone];
  return (
    <div className={`rounded-xl border bg-card/60 p-4 ${cls}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 opacity-70" />
      </div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: LogRow["status"] }) {
  const cfg = {
    ALLOWED: "bg-success/15 border-success/40 text-success",
    NOT_ALLOWED: "bg-destructive/15 border-destructive/40 text-destructive",
    UNSURE: "bg-warning/15 border-warning/40 text-warning",
  }[status];
  const label = status === "NOT_ALLOWED" ? "NOT ALLOWED" : status;
  return <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${cfg}`}>{label}</span>;
}
