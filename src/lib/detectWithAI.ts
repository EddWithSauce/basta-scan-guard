import { supabase } from "@/integrations/supabase/client";
import {
  verdictToResult,
  type DetectionResult,
  type AIVerdict,
} from "./detection";

/**
 * Capture a frame from a video element and return JPEG blob + dimensions.
 */
export async function captureVideoFrame(
  video: HTMLVideoElement,
  maxWidth = 768,
  quality = 0.7
): Promise<{ blob: Blob; width: number; height: number; dataUrl: string } | null> {
  const w0 = video.videoWidth;
  const h0 = video.videoHeight;
  if (!w0 || !h0) return null;

  const scale = Math.min(1, maxWidth / w0);
  const w = Math.round(w0 * scale);
  const h = Math.round(h0 * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, w, h);

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
  );
  if (!blob) return null;
  return { blob, width: w0, height: h0, dataUrl };
}

/**
 * Read a File as a data URL and load image dimensions.
 */
export async function fileToDataUrl(
  file: File,
  maxWidth = 1024,
  quality = 0.85
): Promise<{ dataUrl: string; width: number; height: number; blob: Blob }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Failed to load image"));
    i.src = URL.createObjectURL(file);
  });
  const w0 = img.naturalWidth;
  const h0 = img.naturalHeight;
  const scale = Math.min(1, maxWidth / w0);
  const w = Math.round(w0 * scale);
  const h = Math.round(h0 * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", quality)
  );
  return { dataUrl, width: w0, height: h0, blob };
}

/**
 * Call the detect-weapon edge function with a base64 image and convert the
 * verdict into the standard DetectionResult shape.
 */
export async function detectWeaponInImage(
  dataUrl: string,
  sourceWidth: number,
  sourceHeight: number
): Promise<DetectionResult> {
  const { data, error } = await supabase.functions.invoke("detect-weapon", {
    body: { imageBase64: dataUrl },
  });
  if (error) {
    throw new Error(error.message || "Detection request failed");
  }
  if ((data as any)?.error) {
    const code = (data as any).code;
    if (code === "rate_limited") throw new Error("Rate limit reached. Try again in a moment.");
    if (code === "payment_required") throw new Error("AI credits exhausted. Please top up.");
    throw new Error((data as any).error);
  }
  return verdictToResult(data as AIVerdict, sourceWidth, sourceHeight);
}
