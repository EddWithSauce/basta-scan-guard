import { useEffect, useRef } from "react";
import type { DetectionBox } from "@/lib/detection";
import { friendlyLabel } from "@/lib/detection";

interface Props {
  detections: DetectionBox[];
  source: HTMLVideoElement | HTMLImageElement | null;
  className?: string;
  /** Confidence threshold (0-1). Boxes below this are rendered as UNSURE (amber). */
  threshold?: number;
}

/**
 * Overlays bounding boxes on top of a media element (video or image).
 * The canvas's internal resolution matches the source's intrinsic pixel
 * dimensions so the bbox coordinates (which are in source-pixel space)
 * render correctly. The canvas is then stretched via CSS to fit on top
 * of the displayed media.
 */
export default function BoundingBoxOverlay({ detections, source, className, threshold = 0.55 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;

    let w = 0;
    let h = 0;
    if (source instanceof HTMLVideoElement) {
      w = source.videoWidth;
      h = source.videoHeight;
    } else {
      w = source.naturalWidth;
      h = source.naturalHeight;
    }
    if (!w || !h) return;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    detections.forEach((d) => {
      const [x, y, bw, bh] = d.bbox;
      if (bw <= 0 || bh <= 0) return;

      // Status: confident weapon = red, low-confidence weapon = amber (UNSURE), benign = cyan.
      const isUnsure = d.isWeapon && d.score < threshold;
      const color = d.isWeapon
        ? isUnsure
          ? "hsl(38 95% 55%)" // amber for unsure
          : "hsl(0 84% 60%)" // red for confirmed weapon
        : "hsl(178 100% 50%)"; // cyan for non-weapon
      const stroke = Math.max(4, Math.min(w, h) / 160);

      // Glow box
      ctx.strokeStyle = color;
      ctx.lineWidth = stroke;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.strokeRect(x, y, bw, bh);
      ctx.shadowBlur = 0;

      // Corner brackets for that targeting feel
      const corner = Math.min(bw, bh) * 0.18;
      ctx.lineWidth = stroke * 1.4;
      ctx.beginPath();
      // top-left
      ctx.moveTo(x, y + corner); ctx.lineTo(x, y); ctx.lineTo(x + corner, y);
      // top-right
      ctx.moveTo(x + bw - corner, y); ctx.lineTo(x + bw, y); ctx.lineTo(x + bw, y + corner);
      // bottom-left
      ctx.moveTo(x, y + bh - corner); ctx.lineTo(x, y + bh); ctx.lineTo(x + corner, y + bh);
      // bottom-right
      ctx.moveTo(x + bw - corner, y + bh); ctx.lineTo(x + bw, y + bh); ctx.lineTo(x + bw, y + bh - corner);
      ctx.stroke();

      // ----- Label with separate confidence pill -----
      const fontSize = Math.max(16, w / 45);
      const labelText = friendlyLabel(d.label).toUpperCase() + (isUnsure ? " · UNSURE" : "");
      const confText = `${(d.score * 100).toFixed(0)}%`;

      ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`;
      const labelW = ctx.measureText(labelText).width;
      const confW = ctx.measureText(confText).width;
      const padX = 10;
      const padY = 8;
      const gap = 6;
      const textH = fontSize + padY;
      const labelY = y - textH > 0 ? y - textH : y;

      // Label chip (colored)
      ctx.fillStyle = color;
      ctx.fillRect(x, labelY, labelW + padX * 2, textH);
      ctx.fillStyle = "hsl(24 12% 5%)";
      ctx.textBaseline = "top";
      ctx.fillText(labelText, x + padX, labelY + padY / 2);

      // Confidence chip (dark with colored border) — sits to the right
      const confX = x + labelW + padX * 2 + gap;
      const confChipW = confW + padX * 2;
      ctx.fillStyle = "hsl(24 12% 5% / 0.92)";
      ctx.fillRect(confX, labelY, confChipW, textH);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.5, stroke / 2);
      ctx.strokeRect(confX + 0.5, labelY + 0.5, confChipW - 1, textH - 1);
      ctx.fillStyle = color;
      ctx.fillText(confText, confX + padX, labelY + padY / 2);
    });
  }, [detections, source, threshold]);

  return <canvas ref={canvasRef} className={className} />;
}
