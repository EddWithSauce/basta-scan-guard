import { supabase } from "@/integrations/supabase/client";
import type { DetectionResult, DetectionSource } from "./detection";
import { getSessionId } from "./detection";

export async function analyzeImage(dataUrl: string): Promise<DetectionResult> {
  const { data, error } = await supabase.functions.invoke<DetectionResult>("detect-weapon", {
    body: { imageBase64: dataUrl },
  });
  if (error) {
    const msg = error.message || "Detection failed";
    throw new Error(msg);
  }
  if (!data) throw new Error("No response from detection service");
  return data;
}

export async function logDetection(params: {
  source: DetectionSource;
  result: DetectionResult;
  dataUrl?: string;
  saveImage?: boolean;
}) {
  let image_path: string | null = null;
  if (params.saveImage && params.dataUrl) {
    try {
      const blob = await (await fetch(params.dataUrl)).blob();
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("snapshots")
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (!upErr) image_path = path;
    } catch (e) {
      console.warn("snapshot upload failed", e);
    }
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("detection_logs").insert({
    source: params.source,
    status: params.result.status,
    detected_objects: params.result.objects as any,
    max_confidence: params.result.max_confidence,
    image_path,
    session_id: getSessionId(),
    user_id: user?.id ?? null,
  });
  if (error) console.warn("log insert failed", error.message);
}
