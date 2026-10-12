export const resumeStorageKey = "ai-job-assistant-user-resume";

export type StoredResume = {
  text: string;
  updatedAt: string;
  source: "manual" | "upload" | "flow";
};

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadStoredResume(): StoredResume | null {
  if (!canUseBrowserStorage()) return null;

  const raw = window.localStorage.getItem(resumeStorageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredResume>;
    if (typeof parsed.text !== "string" || !parsed.text.trim()) return null;
    return {
      text: parsed.text,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
      source: parsed.source === "upload" || parsed.source === "flow" ? parsed.source : "manual",
    };
  } catch {
    return null;
  }
}

export function saveStoredResume(text: string, source: StoredResume["source"] = "manual") {
  if (!canUseBrowserStorage()) return;

  const normalizedText = text.trim();
  if (!normalizedText) {
    clearStoredResume();
    return;
  }

  const payload: StoredResume = {
    text,
    source,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(resumeStorageKey, JSON.stringify(payload));
}

export function clearStoredResume() {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(resumeStorageKey);
}
