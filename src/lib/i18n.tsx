import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type Lang = "en" | "tl";

const STORAGE_KEY = "bbb-lang";

type Dict = Record<string, string>;

const en: Dict = {
  // Brand
  "brand.tagline": "AI Security Screening",

  // Nav
  "nav.live": "Live Scan",
  "nav.analyze": "Analyze",
  "nav.dashboard": "Dashboard",
  "nav.admin": "Admin",
  "nav.adminLogin": "Admin Login",
  "nav.signOut": "Sign out",
  "nav.role.admin": "Admin",
  "nav.role.user": "User",
  "lang.toggle": "Tagalog",
  "lang.toggleBack": "English",
  "lang.label": "Language",

  // Footer
  "footer.brandLine": "© {year} · AI Weapon Screening Platform",

  // Home
  "home.badge": "Computer Vision · On-Device · Private",
  "home.title.line1": "Detect deadly weapons.",
  "home.title.line2": "Instantly.",
  "home.subtitle":
    "BastaBakalBawal is an AI security screening platform that analyzes camera feeds, captures, and uploaded images to flag dangerous objects in real time.",
  "home.cta.live": "Start Live Scan",
  "home.cta.analyze": "Analyze Image",
  "home.trust.1": "Browser-side AI",
  "home.trust.2": "No Cloud Inference",
  "home.trust.3": "Auto-Logged",
  "home.outcomes.title": "Three Possible Outcomes",
  "home.outcome.allowed": "ALLOWED",
  "home.outcome.allowed.desc": "No deadly weapon detected.",
  "home.outcome.notallowed": "NOT ALLOWED",
  "home.outcome.notallowed.desc": "Deadly weapon identified.",
  "home.outcome.unsure": "UNSURE",
  "home.outcome.unsure.desc": "Low confidence, please retry.",

  "home.features.eyebrow": "// Capabilities",
  "home.features.title.a": "Built for security teams who need ",
  "home.features.title.b": "certainty",
  "home.features.title.c": ".",
  "home.feature.realtime.title": "Real-Time Vision",
  "home.feature.realtime.desc": "Continuous webcam analysis with live bounding boxes every 1.5 seconds.",
  "home.feature.capture.title": "Capture & Upload",
  "home.feature.capture.desc": "Snap a photo from your device camera or analyze any uploaded image.",
  "home.feature.audit.title": "Persistent Audit",
  "home.feature.audit.desc": "Every flagged event is timestamped, stored, and ready for review.",
  "home.feature.console.title": "Secure Console",
  "home.feature.console.desc": "Public scanning, locked dashboard. Only admins access history.",

  "home.workflow.eyebrow": "// Workflow",
  "home.workflow.title.a": "Three simple steps to a ",
  "home.workflow.title.b": "trusted result",
  "home.workflow.title.c": ".",
  "home.workflow.step": "STEP",
  "home.workflow.s1.title": "Capture or Stream",
  "home.workflow.s1.desc": "Open the live camera, snap a photo, or upload any image file.",
  "home.workflow.s2.title": "AI Analyzes",
  "home.workflow.s2.desc": "On-device computer vision detects objects and ranks confidence.",
  "home.workflow.s3.title": "Decision Issued",
  "home.workflow.s3.desc": "ALLOWED, NOT ALLOWED, or UNSURE — logged automatically.",

  "home.cta2.title": "Ready to screen?",
  "home.cta2.subtitle": "Start a live scan now — no setup, no signup required.",
  "home.cta2.launch": "Launch Live Scan",
  "home.cta2.admin": "Admin Console →",

  // LiveScan
  "live.eyebrow": "// Real-Time Module",
  "live.title.a": "Live ",
  "live.title.b": "Scan",
  "live.subtitle":
    "Stream from your webcam with AI vision analysis every {ms}ms. Flagged frames are automatically captured and added to the audit log.",
  "live.error.title": "Detection error",
  "live.start": "Start Camera",
  "live.pause": "Pause",
  "live.resume": "Resume",
  "live.stop": "Stop",
  "live.switch": "Switch Camera",
  "live.cameraOffline": "Camera Offline",
  "live.cameraOfflineHint": 'Click "Start Camera" to begin live screening.',
  "live.status.paused": "Paused",
  "live.status.analyzing": "● Analyzing",
  "live.status.rec": "● REC",
  "live.permissionDenied": "Camera access denied. Please allow camera permissions.",
  "live.weaponDetected": "Weapon detected: {label}",
  "live.savedToLog": "Frame saved to detection log.",
  "live.reasoning": "AI Reasoning",
  "live.telemetry": "Telemetry",
  "live.frames": "Frames",
  "live.cadence": "Cadence",
  "live.detected": "Detected",
  "live.lastFlag": "Last flag",
  "live.detectedObjects": "Detected Objects",

  // Analyze
  "analyze.eyebrow": "// Analyze Module",
  "analyze.title.a": "Analyze ",
  "analyze.title.b": "Image",
  "analyze.subtitle": "Upload an image or capture one from your camera. Results are saved automatically.",
  "analyze.dropTitle": "Drop image here",
  "analyze.dropHint": "or use the buttons below",
  "analyze.upload": "Upload Image",
  "analyze.capture": "Take Photo",
  "analyze.tryAnother": "Try Another",
  "analyze.tryAgain": "Try Again",
  "analyze.analyzing": "Analyzing image…",
  "analyze.notImage": "Please select an image file.",
  "analyze.failed": "Analysis failed: {msg}",
  "analyze.cleared": "Image cleared.",
  "analyze.unclear": "Result unclear — please retry with a clearer image.",
  "analyze.report": "Scan Report",
  "analyze.savedAt": "Saved at",
  "analyze.detections": "Detections",
  "analyze.topMatch": "Top match",
  "analyze.confidence": "Confidence",
  "analyze.reasoning": "AI Reasoning",
  "analyze.detectedObjects": "Detected Objects",

  // Model selector
  "model.eyebrow": "Detection Model",
  "model.activeLabel": "Active",

  // Status banner / labels
  "status.allowed": "ALLOWED",
  "status.notAllowed": "NOT ALLOWED",
  "status.unsure": "UNSURE – PLEASE RETRY",
  "status.awaiting": "Awaiting Scan",
  "status.awaitingHint": "Run a scan to see results here.",

  // Admin Dashboard
  "admin.eyebrow": "// Control Center",
  "admin.title.a": "Admin ",
  "admin.title.b": "Dashboard",
  "admin.subtitle": "Monitor scans, review flagged events, and manage detection history.",
  "admin.refresh": "Refresh",
  "admin.export": "Export CSV",
  "admin.stat.total": "Total Scans",
  "admin.stat.notAllowed": "Not Allowed",
  "admin.stat.allowed": "Allowed",
  "admin.stat.unsure": "Unsure",
  "admin.search": "Search labels, notes, scan type...",
  "admin.filter.all": "All statuses",
  "admin.clear": "Clear filters",
  "admin.col.time": "Time",
  "admin.col.source": "Source",
  "admin.col.status": "Status",
  "admin.col.detections": "Detections",
  "admin.col.snapshot": "Snapshot",
  "admin.col.actions": "Actions",
  "admin.empty.none": "No scans recorded yet",
  "admin.empty.noMatch": "No matching results",
  "admin.empty.hint": "Run a scan from the Live or Analyze pages — entries will appear here.",
  "admin.exported": "Exported {n} rows.",
  "admin.exportEmpty": "No logs to export.",
  "admin.loadFailed": "Failed to load logs: {msg}",
  "admin.deleteFailed": "Delete failed: {msg}",
  "admin.deleted": "Log deleted.",
  "admin.preview": "Snapshot Preview",
  "admin.delete.title": "Delete this log?",
  "admin.delete.desc":
    "This will permanently remove the detection record. The stored snapshot file will remain in storage.",
  "admin.delete.cancel": "Cancel",
  "admin.delete.confirm": "Delete",
  "admin.showing": "Showing {a} of {b} logs",
};

const tl: Dict = {
  // Brand
  "brand.tagline": "AI Pang-Seguridad na Pagsuri",

  // Nav
  "nav.live": "Live na Pag-scan",
  "nav.analyze": "Suriin",
  "nav.dashboard": "Dashboard",
  "nav.admin": "Admin",
  "nav.adminLogin": "Admin Login",
  "nav.signOut": "Mag-logout",
  "nav.role.admin": "Admin",
  "nav.role.user": "Gumagamit",
  "lang.toggle": "Tagalog",
  "lang.toggleBack": "English",
  "lang.label": "Wika",

  // Footer
  "footer.brandLine": "© {year} · AI Platform sa Pag-detect ng Armas",

  // Home
  "home.badge": "Computer Vision · Sa Device · Pribado",
  "home.title.line1": "Tuklasin ang nakamamatay na armas.",
  "home.title.line2": "Sa isang iglap.",
  "home.subtitle":
    "Ang BastaBakalBawal ay isang AI na security screening platform na sumusuri sa camera feed, mga kuha, at mga in-upload na larawan upang matukoy ang mapanganib na bagay sa real time.",
  "home.cta.live": "Simulan ang Live na Pag-scan",
  "home.cta.analyze": "Suriin ang Larawan",
  "home.trust.1": "AI sa Browser",
  "home.trust.2": "Walang Cloud na Pagsusuri",
  "home.trust.3": "Awtomatikong Naka-log",
  "home.outcomes.title": "Tatlong Posibleng Resulta",
  "home.outcome.allowed": "PINAPAYAGAN",
  "home.outcome.allowed.desc": "Walang nakitang nakamamatay na armas.",
  "home.outcome.notallowed": "BAWAL",
  "home.outcome.notallowed.desc": "May natukoy na nakamamatay na armas.",
  "home.outcome.unsure": "HINDI SIGURADO",
  "home.outcome.unsure.desc": "Mababa ang katiyakan, subukang muli.",

  "home.features.eyebrow": "// Mga Kakayahan",
  "home.features.title.a": "Ginawa para sa mga security team na nangangailangan ng ",
  "home.features.title.b": "katiyakan",
  "home.features.title.c": ".",
  "home.feature.realtime.title": "Real-Time na Vision",
  "home.feature.realtime.desc":
    "Tuloy-tuloy na webcam analysis na may live na bounding boxes kada 1.5 segundo.",
  "home.feature.capture.title": "Kuhanan at I-upload",
  "home.feature.capture.desc":
    "Kumuha ng larawan gamit ang camera ng device o suriin ang anumang in-upload na imahe.",
  "home.feature.audit.title": "Permanenteng Tala",
  "home.feature.audit.desc":
    "Bawat flagged na pangyayari ay may timestamp, naka-imbak, at handa para sa pagsusuri.",
  "home.feature.console.title": "Ligtas na Console",
  "home.feature.console.desc":
    "Pampublikong scan, nakakandadong dashboard. Admin lang ang may access sa history.",

  "home.workflow.eyebrow": "// Daloy ng Trabaho",
  "home.workflow.title.a": "Tatlong simpleng hakbang para sa isang ",
  "home.workflow.title.b": "mapagkakatiwalaang resulta",
  "home.workflow.title.c": ".",
  "home.workflow.step": "HAKBANG",
  "home.workflow.s1.title": "Kunan o I-stream",
  "home.workflow.s1.desc":
    "Buksan ang live camera, kumuha ng larawan, o mag-upload ng anumang imahe.",
  "home.workflow.s2.title": "Susuriin ng AI",
  "home.workflow.s2.desc":
    "Tinutukoy ng on-device computer vision ang mga bagay at sinusukat ang katiyakan.",
  "home.workflow.s3.title": "Inilalabas ang Desisyon",
  "home.workflow.s3.desc":
    "PINAPAYAGAN, BAWAL, o HINDI SIGURADO — awtomatikong naka-log.",

  "home.cta2.title": "Handa nang mag-screen?",
  "home.cta2.subtitle": "Magsimula ng live scan ngayon — walang setup, walang sign-up.",
  "home.cta2.launch": "Simulan ang Live na Pag-scan",
  "home.cta2.admin": "Admin Console →",

  // LiveScan
  "live.eyebrow": "// Real-Time na Module",
  "live.title.a": "Live na ",
  "live.title.b": "Pag-scan",
  "live.subtitle":
    "I-stream mula sa iyong webcam na may AI vision analysis kada {ms}ms. Awtomatikong naki-capture at idinadagdag sa audit log ang mga flagged na frame.",
  "live.error.title": "May error sa pag-detect",
  "live.start": "Simulan ang Camera",
  "live.pause": "I-pause",
  "live.resume": "Ituloy",
  "live.stop": "Itigil",
  "live.switch": "Palitan ang Camera",
  "live.cameraOffline": "Naka-Offline ang Camera",
  "live.cameraOfflineHint": 'I-click ang "Simulan ang Camera" para magsimula ng live screening.',
  "live.status.paused": "Naka-Pause",
  "live.status.analyzing": "● Sinusuri",
  "live.status.rec": "● REC",
  "live.permissionDenied":
    "Tinanggihan ang access sa camera. Pakipayagan ang camera permission.",
  "live.weaponDetected": "May natukoy na armas: {label}",
  "live.savedToLog": "Naka-save ang frame sa detection log.",
  "live.reasoning": "Paliwanag ng AI",
  "live.telemetry": "Telemetry",
  "live.frames": "Mga Frame",
  "live.cadence": "Bilis",
  "live.detected": "Natuklasan",
  "live.lastFlag": "Huling flag",
  "live.detectedObjects": "Mga Natuklasang Bagay",

  // Analyze
  "analyze.eyebrow": "// Analyze Module",
  "analyze.title.a": "Suriin ang ",
  "analyze.title.b": "Larawan",
  "analyze.subtitle":
    "Mag-upload ng larawan o kumuha mula sa iyong camera. Awtomatikong naka-save ang mga resulta.",
  "analyze.dropTitle": "I-drop ang larawan dito",
  "analyze.dropHint": "o gamitin ang mga button sa ibaba",
  "analyze.upload": "Mag-upload ng Larawan",
  "analyze.capture": "Kumuha ng Larawan",
  "analyze.tryAnother": "Subukan ang Iba",
  "analyze.tryAgain": "Subukang Muli",
  "analyze.analyzing": "Sinusuri ang larawan…",
  "analyze.notImage": "Mangyaring pumili ng image file.",
  "analyze.failed": "Nabigo ang pagsusuri: {msg}",
  "analyze.cleared": "Malinis ang larawan.",
  "analyze.unclear": "Hindi malinaw ang resulta — subukan muli gamit ang mas malinaw na larawan.",
  "analyze.report": "Scan Report",
  "analyze.savedAt": "Na-save noong",
  "analyze.detections": "Mga Natuklasan",
  "analyze.topMatch": "Pinakamalapit na tugma",
  "analyze.confidence": "Katiyakan",
  "analyze.reasoning": "Paliwanag ng AI",
  "analyze.detectedObjects": "Mga Natuklasang Bagay",

  // Model selector
  "model.eyebrow": "Modelo ng Detection",
  "model.activeLabel": "Aktibo",

  // Status banner
  "status.allowed": "PINAPAYAGAN",
  "status.notAllowed": "BAWAL",
  "status.unsure": "HINDI SIGURADO – SUBUKANG MULI",
  "status.awaiting": "Naghihintay ng Scan",
  "status.awaitingHint": "Magsagawa ng scan para makita ang resulta dito.",

  // Admin Dashboard
  "admin.eyebrow": "// Control Center",
  "admin.title.a": "Admin ",
  "admin.title.b": "Dashboard",
  "admin.subtitle":
    "Subaybayan ang mga scan, suriin ang mga flagged na pangyayari, at pamahalaan ang detection history.",
  "admin.refresh": "I-refresh",
  "admin.export": "I-export CSV",
  "admin.stat.total": "Kabuuang Scan",
  "admin.stat.notAllowed": "Bawal",
  "admin.stat.allowed": "Pinapayagan",
  "admin.stat.unsure": "Hindi Sigurado",
  "admin.search": "Maghanap ng label, tala, o uri ng scan...",
  "admin.filter.all": "Lahat ng status",
  "admin.clear": "I-clear ang filter",
  "admin.col.time": "Oras",
  "admin.col.source": "Pinagmulan",
  "admin.col.status": "Status",
  "admin.col.detections": "Mga Natuklasan",
  "admin.col.snapshot": "Snapshot",
  "admin.col.actions": "Aksyon",
  "admin.empty.none": "Wala pang naitalang scan",
  "admin.empty.noMatch": "Walang tumutugmang resulta",
  "admin.empty.hint":
    "Magsagawa ng scan mula sa Live o Analyze page — lalabas dito ang mga entry.",
  "admin.exported": "Na-export ang {n} na hilera.",
  "admin.exportEmpty": "Walang log na maaaring i-export.",
  "admin.loadFailed": "Nabigong i-load ang logs: {msg}",
  "admin.deleteFailed": "Nabigong tanggalin: {msg}",
  "admin.deleted": "Natanggal ang log.",
  "admin.preview": "Pagsilip sa Snapshot",
  "admin.delete.title": "Tanggalin ang log na ito?",
  "admin.delete.desc":
    "Permanenteng aalisin ang detection record. Mananatili ang naka-imbak na snapshot file sa storage.",
  "admin.delete.cancel": "Kanselahin",
  "admin.delete.confirm": "Tanggalin",
  "admin.showing": "Ipinapakita ang {a} sa {b} na logs",
};

const dictionaries: Record<Lang, Dict> = { en, tl };

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    return saved === "tl" || saved === "en" ? saved : "en";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang === "tl" ? "tl" : "en";
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(
    () => setLangState((prev) => (prev === "en" ? "tl" : "en")),
    []
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = dictionaries[lang] ?? en;
      let str = dict[key] ?? en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [lang]
  );

  return <Ctx.Provider value={{ lang, setLang, toggle, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
