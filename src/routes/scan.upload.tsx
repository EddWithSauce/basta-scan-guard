import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Camera, Upload, X, Loader2, Save } from "lucide-react";
import { ResultBanner } from "@/components/ResultBanner";
import { BoundingBoxCanvas } from "@/components/BoundingBoxCanvas";
import { analyzeImage, logDetection } from "@/lib/api";
import type { DetectionResult, DetectionSource } from "@/lib/detection";

export const Route = createFileRoute("/scan/upload")({
  head: () => ({
    meta: [
      { title: "Capture or Upload — BastaBakal Bawal" },
      { name: "description", content: "Capture from your camera or upload an image for AI weapon screening." },
    ],
  }),
  component: UploadScan,
});

function UploadScan() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [source, setSource] = useState<DetectionSource>("upload");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [saveImage, setSaveImage] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((file: File, src: DetectionSource) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setSource(src);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const onAnalyze = useCallback(async () => {
    if (!imageUrl) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await analyzeImage(imageUrl);
      setResult(r);
      await logDetection({ source, result: r, dataUrl: imageUrl, saveImage });
      if (r.status === "NOT_ALLOWED") toast.error("NOT ALLOWED — weapon detected");
      else if (r.status === "ALLOWED") toast.success("ALLOWED — no weapons detected");
      else toast.warning("UNSURE — please retry with a clearer image");
    } catch (e) {
      toast.error("Analysis failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setLoading(false);
    }
  }, [imageUrl, source, saveImage]);

  const reset = () => { setImageUrl(null); setResult(null); };

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Capture or Upload</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Take a photo with your camera or upload an existing image to screen for weapons.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="relative rounded-xl border border-border bg-card/60 overflow-hidden aspect-video flex items-center justify-center">
            {imageUrl ? (
              <>
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Selected for analysis"
                  className="absolute inset-0 h-full w-full object-contain bg-black"
                />
                <BoundingBoxCanvas imageEl={imgRef.current} objects={result?.objects ?? []} />
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 rounded-full bg-background/80 p-1.5 hover:bg-background"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
                {loading && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="font-mono text-xs uppercase tracking-widest text-primary">
                      AI Analyzing…
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-8">
                <p className="text-muted-foreground mb-6">No image selected</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
                  >
                    <Camera className="h-4 w-4" /> Capture from Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-accent"
                  >
                    <Upload className="h-4 w-4" /> Upload Image
                  </button>
                </div>
              </div>
            )}
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f, "capture"); e.target.value = ""; }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f, "upload"); e.target.value = ""; }}
          />

          {imageUrl && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={onAnalyze}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Analyzing…" : "Analyze Image"}
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent inline-flex items-center gap-1.5"
              >
                <Camera className="h-4 w-4" /> Retake
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent inline-flex items-center gap-1.5"
              >
                <Upload className="h-4 w-4" /> Replace
              </button>
              <label className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveImage}
                  onChange={(e) => setSaveImage(e.target.checked)}
                  className="accent-primary"
                />
                <Save className="h-3.5 w-3.5" /> Save snapshot to log
              </label>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <ResultBanner result={result} />
          {result && (
            <div className="rounded-xl border border-border bg-card/60 p-4 text-xs">
              <div className="font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Source
              </div>
              <div className="font-semibold capitalize">{source}</div>
              <div className="mt-3 font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Image quality
              </div>
              <div className="font-semibold capitalize">{result.image_quality}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
