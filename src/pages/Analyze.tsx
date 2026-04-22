import { useRef, useState } from "react";
import { Camera, Upload, Loader2, X, RefreshCw, Image as ImageIcon, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import StatusBanner from "@/components/StatusBanner";
import BoundingBoxOverlay from "@/components/BoundingBoxOverlay";
import ModelSelector from "@/components/ModelSelector";
import { friendlyLabel, type DetectionResult } from "@/lib/detection";
import { detectWeaponInImage, fileToDataUrl } from "@/lib/detectWithAI";
import { logDetection, uploadSnapshot } from "@/lib/scanLogger";
import { applyThreshold, useDetectionThreshold } from "@/lib/useDetectionThreshold";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export default function Analyze() {
  const { t } = useI18n();
  const threshold = useDetectionThreshold();
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [savedTime, setSavedTime] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File, scanType: "upload" | "capture") {
    if (!file.type.startsWith("image/")) {
      toast.error(t("analyze.notImage"));
      return;
    }
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    setResult(null);
    setSavedTime(null);
    const img = new Image();
    img.onload = async () => {
      setImgEl(img);
      await analyze(file, scanType);
    };
    img.src = url;
  }

  async function analyze(file: File, scanType: "upload" | "capture") {
    setAnalyzing(true);
    try {
      const prepared = await fileToDataUrl(file, 1024, 0.85);
      const raw = await detectWeaponInImage(
        prepared.dataUrl,
        prepared.width,
        prepared.height
      );
      const evald = applyThreshold(raw, threshold);
      setResult(evald);

      const upload = await uploadSnapshot(prepared.blob, scanType);
      await logDetection({
        scanType,
        result: evald,
        imageUrl: upload?.url ?? null,
        notes: evald.reason || (scanType === "capture" ? "Camera capture" : "Manual upload"),
      });
      setSavedTime(new Date().toLocaleTimeString());

      if (evald.status === "NOT_ALLOWED") {
        toast.error(t("live.weaponDetected", { label: friendlyLabel(evald.topLabel) }));
      } else if (evald.status === "ALLOWED") {
        toast.success(t("analyze.cleared"));
      } else {
        toast.warning(t("analyze.unclear"));
      }
    } catch (e: any) {
      console.error("Analyze error:", e);
      toast.error(t("analyze.failed", { msg: e?.message ?? "unknown" }));
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    setImgUrl(null);
    setImgEl(null);
    setResult(null);
    setSavedTime(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f, "upload");
  }

  return (
    <AppLayout>
      <div className="container py-10 max-w-7xl">
        <div className="mb-10 animate-fade-up">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-3">
            {t("analyze.eyebrow")}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            {t("analyze.title.a")}<span className="text-orange-gradient">{t("analyze.title.b")}</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {t("analyze.subtitle")}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`relative aspect-video w-full rounded-3xl overflow-hidden surface-elevated transition-all ${
                dragOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
              }`}
            >
              {imgUrl ? (
                <>
                  <img
                    src={imgUrl}
                    alt="Analysis subject"
                    className="w-full h-full object-contain bg-black"
                  />
                  {imgEl && result && (
                    <BoundingBoxOverlay
                      detections={result.detections.filter((d) => d.bbox[2] > 0 && d.bbox[3] > 0)}
                      source={imgEl}
                      threshold={threshold}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                  )}
                  {analyzing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                      <div className="flex items-center gap-3 text-primary">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="font-mono tracking-[0.2em] uppercase text-sm">
                          {t("analyze.analyzing")}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground p-6 hover:text-foreground transition-colors w-full"
                >
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 border-2 border-dashed border-primary/40 flex items-center justify-center">
                    <FileImage className="h-9 w-9 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-display text-lg font-semibold text-foreground mb-1">
                      {t("analyze.dropTitle")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("analyze.dropHint")}
                    </p>
                  </div>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzing}
                size="lg"
                className="btn-orange rounded-full h-12 px-6 font-semibold"
              >
                <Upload className="h-4 w-4" /> {t("analyze.upload")}
              </Button>
              <Button
                onClick={() => cameraInputRef.current?.click()}
                disabled={analyzing}
                size="lg"
                variant="outline"
                className="rounded-full h-12 px-6 border-border hover:border-primary/50 hover:bg-secondary"
              >
                <Camera className="h-4 w-4" /> {t("analyze.capture")}
              </Button>
              {imgUrl && (
                <Button
                  onClick={reset}
                  variant="ghost"
                  size="lg"
                  className="rounded-full h-12 px-6 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" /> {t("analyze.tryAnother")}
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f, "upload");
                  e.target.value = "";
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f, "capture");
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <ModelSelector compact />
            <StatusBanner
              status={result?.status ?? null}
              topLabel={result?.topLabel ? friendlyLabel(result.topLabel) : null}
              topScore={result?.topScore ?? null}
            />

            {result?.reason && (
              <div className="surface rounded-2xl p-4">
                <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-2">
                  {t("analyze.reasoning")}
                </p>
                <p className="text-sm">{result.reason}</p>
              </div>
            )}

            {result && (
              <div className="surface rounded-2xl p-5">
                <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-4">
                  {t("analyze.report")}
                </p>
                <div className="space-y-2.5 text-sm">
                  <Row label={t("analyze.savedAt")} value={savedTime ?? "—"} />
                  <Row label={t("analyze.detections")} value={result.detections.length.toString()} />
                  <Row label={t("analyze.topMatch")} value={result.topLabel ? friendlyLabel(result.topLabel) : "—"} />
                  <Row
                    label={t("analyze.confidence")}
                    value={result.topScore != null ? `${(result.topScore * 100).toFixed(1)}%` : "—"}
                  />
                </div>
              </div>
            )}

            {result && result.detections.length > 0 && (
              <div className="surface rounded-2xl p-5 animate-fade-up">
                <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-4">
                  {t("analyze.detectedObjects")}
                </p>
                <ul className="space-y-2">
                  {result.detections.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-background/40"
                    >
                      <span className={`text-sm ${d.isWeapon ? "text-destructive font-semibold" : "text-foreground"}`}>
                        {friendlyLabel(d.label)}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {(d.score * 100).toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result?.status === "UNSURE" && (
              <Button
                onClick={reset}
                variant="outline"
                className="w-full rounded-full h-11 border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
              >
                <RefreshCw className="h-4 w-4" /> {t("analyze.tryAgain")}
              </Button>
            )}

            {!result && !imgUrl && !analyzing && (
              <div className="surface rounded-2xl p-5 text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-xs text-muted-foreground">
                  {t("status.awaitingHint")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold tabular-nums">{value}</span>
    </div>
  );
}
