import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, Loader2, Pause, Play, Activity, Zap, Target, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import StatusBanner from "@/components/StatusBanner";
import BoundingBoxOverlay from "@/components/BoundingBoxOverlay";
import ModelSelector from "@/components/ModelSelector";
import { friendlyLabel, type DetectionResult } from "@/lib/detection";
import { captureVideoFrame, detectWeaponInImage } from "@/lib/detectWithAI";
import { logDetection, uploadSnapshot } from "@/lib/scanLogger";
import { applyThreshold, useDetectionThreshold } from "@/lib/useDetectionThreshold";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const DETECT_INTERVAL_MS = 1500;

export default function LiveScan() {
  const { t } = useI18n();
  const threshold = useDetectionThreshold();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inFlightRef = useRef(false);
  const lastSavedRef = useRef<number>(0);
  const [streaming, setStreaming] = useState(false);
  const [paused, setPaused] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [lastFlagged, setLastFlagged] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const startCamera = useCallback(async (mode?: "environment" | "user") => {
    const useMode = mode ?? facingMode;
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: useMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
      setPaused(false);
    } catch (e) {
      console.error("Camera error:", e);
      toast.error(t("live.permissionDenied"));
    }
  }, [facingMode]);

  const switchCamera = useCallback(async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    if (streaming) await startCamera(next);
    else toast.success(`Switched to ${next === "user" ? "front" : "rear"} camera`);
  }, [facingMode, streaming, startCamera]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    setPaused(false);
    setResult(null);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (!streaming || paused || !videoRef.current) return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled || inFlightRef.current) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      const frame = await captureVideoFrame(video, 640, 0.65);
      if (!frame) return;

      inFlightRef.current = true;
      setAnalyzing(true);
      try {
        const raw = await detectWeaponInImage(frame.dataUrl, frame.width, frame.height);
        if (cancelled) return;
        const evald = applyThreshold(raw, threshold);
        setResult(evald);
        setScanCount((n) => n + 1);
        setError(null);

        const now = Date.now();
        const isFlagged = evald.status === "NOT_ALLOWED";
        // Save flagged frames every 4s, allowed/unsure every 10s to avoid spam
        const throttleMs = isFlagged ? 4000 : 10000;
        if (now - lastSavedRef.current > throttleMs) {
          lastSavedRef.current = now;
          await saveFrame(frame.blob, evald);
        }
      } catch (e: any) {
        console.error("Detection error:", e);
        setError(e?.message ?? "Detection failed");
      } finally {
        inFlightRef.current = false;
        setAnalyzing(false);
      }
    };

    tick();
    const id = window.setInterval(tick, DETECT_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [streaming, paused]);

  async function saveFrame(blob: Blob, evald: DetectionResult) {
    try {
      const upload = await uploadSnapshot(blob, "live");
      await logDetection({
        scanType: "live",
        result: evald,
        imageUrl: upload?.url ?? null,
        notes: evald.reason || `Auto-saved live frame (${evald.status})`,
      });
      setLastFlagged(new Date().toLocaleTimeString());
      if (evald.status === "NOT_ALLOWED") {
        toast.error(t("live.weaponDetected", { label: friendlyLabel(evald.topLabel) }), {
          description: t("live.savedToLog"),
        });
      }
    } catch (e) {
      console.error("Save frame error:", e);
    }
  }

  return (
    <AppLayout>
      <div className="container py-10 max-w-7xl">
        <div className="mb-10 animate-fade-up">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-3">
            {t("live.eyebrow")}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            {t("live.title.a")}<span className="text-orange-gradient">{t("live.title.b")}</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {t("live.subtitle", { ms: DETECT_INTERVAL_MS })}
          </p>
        </div>

        {error && (
          <div className="surface rounded-2xl p-6 border-destructive/50 mb-6">
            <p className="text-destructive font-medium">{t("live.error.title")}</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div>
            <div className="relative aspect-video w-full bg-black rounded-3xl overflow-hidden surface-elevated">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-contain ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />
              {streaming && videoRef.current && result && (
                <BoundingBoxOverlay
                  detections={result.detections.filter((d) => d.bbox[2] > 0 && d.bbox[3] > 0)}
                  source={videoRef.current}
                  threshold={threshold}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              )}
              {streaming && !paused && (
                <div className="absolute inset-0 scanline-orange pointer-events-none" />
              )}

              {/* Corner brackets */}
              {streaming && (
                <>
                  <div className="absolute top-4 left-4 h-6 w-6 border-t-2 border-l-2 border-primary/70 pointer-events-none" />
                  <div className="absolute top-4 right-4 h-6 w-6 border-t-2 border-r-2 border-primary/70 pointer-events-none" />
                  <div className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-primary/70 pointer-events-none" />
                  <div className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-primary/70 pointer-events-none" />
                </>
              )}

              {!streaming && (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-muted-foreground">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Camera className="h-7 w-7 text-primary" />
                  </div>
                  <p className="font-mono text-xs tracking-[0.2em] uppercase">{t("live.cameraOffline")}</p>
                  <p className="text-sm text-center max-w-xs px-6">
                    {t("live.cameraOfflineHint")}
                  </p>
                </div>
              )}

              {streaming && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border">
                  <span className={`h-2 w-2 rounded-full ${paused ? "bg-warning" : analyzing ? "bg-primary animate-blink" : "bg-destructive animate-blink"}`} />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em]">
                    {paused ? t("live.status.paused") : analyzing ? t("live.status.analyzing") : t("live.status.rec")}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              {!streaming ? (
                <Button
                  onClick={() => startCamera()}
                  size="lg"
                  className="btn-orange rounded-full h-12 px-6 font-semibold"
                >
                  <Camera className="h-4 w-4" /> {t("live.start")}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setPaused((p) => !p)}
                    variant="outline"
                    size="lg"
                    className="rounded-full h-12 px-6 border-border hover:border-primary/50 hover:bg-secondary"
                  >
                    {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {paused ? t("live.resume") : t("live.pause")}
                  </Button>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    size="lg"
                    className="rounded-full h-12 px-6 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <CameraOff className="h-4 w-4" /> {t("live.stop")}
                  </Button>
                </>
              )}
              <Button
                onClick={switchCamera}
                variant="outline"
                size="lg"
                className="rounded-full h-12 px-6 border-border hover:border-primary/50 hover:bg-secondary"
                title={t("live.switch")}
              >
                <SwitchCamera className="h-4 w-4" />
                {t("live.switch")}
              </Button>
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
                  {t("live.reasoning")}
                </p>
                <p className="text-sm">{result.reason}</p>
              </div>
            )}

            <div className="surface rounded-2xl p-5">
              <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-4">
                {t("live.telemetry")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Stat icon={Activity} label={t("live.frames")} value={scanCount.toString()} />
                <Stat icon={Zap} label={t("live.cadence")} value={`${DETECT_INTERVAL_MS}ms`} />
                <Stat icon={Target} label={t("live.detected")} value={(result?.detections.length ?? 0).toString()} />
                <Stat icon={Camera} label={t("live.lastFlag")} value={lastFlagged ?? "—"} />
              </div>
            </div>

            {result && result.detections.length > 0 && (
              <div className="surface rounded-2xl p-5 animate-fade-up">
                <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-4">
                  {t("live.detectedObjects")}
                </p>
                <ul className="space-y-2">
                  {result.detections.slice(0, 6).map((d, i) => (
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
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background/40 border border-border/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="font-mono font-semibold text-sm truncate">{value}</div>
    </div>
  );
}
