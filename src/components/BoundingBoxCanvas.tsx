import { useEffect, useRef } from "react";
import type { DetectedObject } from "@/lib/detection";

type Props = {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  imageEl?: HTMLImageElement | null;
  objects: DetectedObject[];
  /** Render as overlay sized to a parent (absolute fill). */
  overlay?: boolean;
};

export function BoundingBoxCanvas({ videoRef, imageEl, objects, overlay = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      let w = 0, h = 0;
      if (videoRef?.current) {
        w = videoRef.current.clientWidth;
        h = videoRef.current.clientHeight;
      } else if (imageEl) {
        w = imageEl.clientWidth;
        h = imageEl.clientHeight;
      }
      if (!w || !h) return;
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);

      for (const obj of objects) {
        const [x, y, bw, bh] = obj.bbox;
        const px = x * w, py = y * h, pw = bw * w, ph = bh * h;
        const color = obj.is_weapon ? "oklch(0.65 0.24 27)" : "oklch(0.78 0.17 75)";
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.strokeRect(px, py, pw, ph);
        ctx.shadowBlur = 0;

        const label = `${obj.name} ${(obj.confidence * 100).toFixed(0)}%`;
        ctx.font = "600 12px JetBrains Mono, ui-monospace, monospace";
        const tw = ctx.measureText(label).width + 10;
        ctx.fillStyle = color;
        ctx.fillRect(px, Math.max(0, py - 20), tw, 20);
        ctx.fillStyle = obj.is_weapon ? "white" : "oklch(0.18 0.03 250)";
        ctx.fillText(label, px + 5, Math.max(12, py - 6));
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    if (videoRef?.current) ro.observe(videoRef.current);
    if (imageEl) ro.observe(imageEl);
    return () => ro.disconnect();
  }, [objects, videoRef, imageEl]);

  return (
    <canvas
      ref={canvasRef}
      className={overlay ? "pointer-events-none absolute inset-0 h-full w-full" : "h-full w-full"}
    />
  );
}
