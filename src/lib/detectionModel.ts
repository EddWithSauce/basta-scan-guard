import { useEffect, useState } from "react";

export type DetectionModel = "yolov8" | "mobilenetv2" | "detr";

export const DETECTION_MODELS: {
  id: DetectionModel;
  name: string;
  tagline: string;
  description: string;
}[] = [
  {
    id: "yolov8",
    name: "YOLOv8",
    tagline: "Real-time · Fast",
    description: "You Only Look Once v8 — optimized for speed and continuous frame analysis.",
  },
  {
    id: "mobilenetv2",
    name: "MobileNetV2",
    tagline: "Lightweight · Efficient",
    description: "Compact architecture tuned for low-latency inference on edge devices.",
  },
  {
    id: "detr",
    name: "DETR",
    tagline: "Transformer · Precise",
    description: "Detection Transformer — end-to-end detection with attention-based reasoning.",
  },
];

const STORAGE_KEY = "bbb-detection-model";

function readStored(): DetectionModel {
  if (typeof window === "undefined") return "yolov8";
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "yolov8" || v === "mobilenetv2" || v === "detr") return v;
  return "yolov8";
}

export function useDetectionModel(): [DetectionModel, (m: DetectionModel) => void] {
  const [model, setModel] = useState<DetectionModel>(() => readStored());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setModel(readStored());
    };
    const onCustom = () => setModel(readStored());
    window.addEventListener("storage", onStorage);
    window.addEventListener("bbb-model-change", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bbb-model-change", onCustom as EventListener);
    };
  }, []);

  const update = (m: DetectionModel) => {
    window.localStorage.setItem(STORAGE_KEY, m);
    setModel(m);
    window.dispatchEvent(new Event("bbb-model-change"));
  };

  return [model, update];
}
