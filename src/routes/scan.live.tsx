import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Camera, Pause, Play, Save, AlertTriangle } from "lucide-react";
import { ResultBanner } from "@/components/ResultBanner";
import { BoundingBoxCanvas } from "@/components/BoundingBoxCanvas";
import { analyzeImage, logDetection } from "@/lib/api";
import type { DetectionResult } from "@/lib/detection";

export const Route = createFileRoute("/scan/live")({
  head: () => ({
    meta: [
      { title: "Live Detection — BastaBakal Bawal" },
      { name: "description", content: "Real-time AI weapon detection through your camera." },
    ],
  }),
  component: LiveScan,
});

const SCAN_INTERVAL_MS = 2200;

function LiveScan() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSnapshots, setSaveSnapshots] = useState(false);
  const inFlight = useRef(false);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Camera access denied";
      setError(msg);
      toast.error("Camera unavailable", { description: msg });
    }
  }, []);

  const stopCamera = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    setPaused(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const captureFrame = useCallback((): string | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, []);

  // Continuous scan loop
  useEffect(() => {
    if (!streaming || paused) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled || inFlight.current) return;
      const dataUrl = captureFrame();
      if (!dataUrl) return;
      inFlight.current = true;
      setScanning(true);
      try {
        const r = await analyzeImage(dataUrl);
        if (cancelled) return;
        setResult(r);
        logDetection({ source: "live", result: r, dataUrl, saveImage: saveSnapshots && r.status === "NOT_ALLOWED" });
        if (r.status === "NOT_ALLOWED") {
          toast.error("Weapon detected — NOT ALLOWED", {
            description: r.objects.filter((o) => o.is_weapon).map((o) => o.name).join(", "),
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Detection failed";
        if (!cancelled) toast.error("Scan failed", { description: msg });
      } finally {
        inFlight.current = false;
        setScanning(false);
      }
    };
    const id = setInterval(tick, SCAN_INTERVAL_MS);
    tick();
    return () => { cancelled = true; clearInterval(id); };
  }, [streaming, paused, captureFrame, saveSnapshots]);

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Live Detection</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Continuous AI weapon detection through your camera. Scans every ~2 seconds.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="relative rounded-xl border border-border bg-black overflow-hidden aspect-video">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
            {streaming && !paused && (
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
            )}
            <BoundingBoxCanvas videoRef={videoRef} objects={result?.objects ?? []} />
            {!streaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Camera is off</p>
                <button
                  onClick={startCamera}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  Enable Camera
                </button>
                {error && (
                  <p className="mt-3 text-xs text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> {error}
                  </p>
                )}
              </div>
            )}
            <div className="absolute top-3 left-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
              {streaming && (
                <span className={`flex items-center gap-1.5 rounded-full px-2 py-1 ${paused ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${paused ? "bg-warning" : "bg-destructive animate-pulse"}`} />
                  {paused ? "Paused" : "Live"}
                </span>
              )}
              {scanning && (
                <span className="rounded-full bg-primary/20 text-primary px-2 py-1">
                  Analyzing…
                </span>
              )}
            </div>
          </div>

          {streaming && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPaused((p) => !p)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={stopCamera}
                className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
              >
                Stop Camera
              </button>
              <label className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveSnapshots}
                  onChange={(e) => setSaveSnapshots(e.target.checked)}
                  className="accent-primary"
                />
                <Save className="h-3.5 w-3.5" /> Save snapshots of NOT ALLOWED scans
              </label>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <ResultBanner result={result} />
          <div className="rounded-xl border border-border bg-card/60 p-4 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground mb-2 font-mono uppercase tracking-widest">
              How it works
            </div>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>Frames are sent to the AI vision model every ~2s.</li>
              <li>Detected weapons are outlined in red with a confidence score.</li>
              <li>Low-confidence or empty frames return UNSURE — never guessed.</li>
              <li>All scans are written to the detection log.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
