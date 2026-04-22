import { supabase } from "@/integrations/supabase/client";
import type { DetectionResult } from "./detection";

export async function uploadSnapshot(blob: Blob, prefix: string): Promise<{ path: string; url: string } | null> {
  const ext = blob.type.includes("png") ? "png" : "jpg";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("scans").upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    upsert: false,
  });
  if (error) {
    console.error("Upload error:", error);
    return null;
  }
  const { data } = supabase.storage.from("scans").getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function logDetection(args: {
  scanType: "live" | "capture" | "upload";
  result: DetectionResult;
  imageUrl?: string | null;
  notes?: string | null;
}) {
  const labels = args.result.detections.map((d) => d.label);
  const scores = args.result.detections.map((d) => Number(d.score.toFixed(3)));

  const { data, error } = await supabase
    .from("detection_logs")
    .insert({
      scan_type: args.scanType,
      final_status: args.result.status,
      detected_labels: labels,
      confidence_scores: scores,
      image_url: args.imageUrl ?? null,
      notes: args.notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Log error:", error);
    return null;
  }
  return data.id as string;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode canvas"))),
      type,
      quality
    );
  });
}
