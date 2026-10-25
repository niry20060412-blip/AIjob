export const resumeStorageKey = "ai-job-assistant-user-resume";

export type StoredResumeFile = {
  name: string;
  type: string;
  charCount: number;
  updatedAt: string;
};

export type StoredResume = {
  text: string;
  updatedAt: string;
  source: "manual" | "upload" | "flow";
  /** 上次上传的文件信息：切到别的页面再回来时，上传卡片仍能显示「哪个文件、提取了多少字」 */
  file?: StoredResumeFile;
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
    const file = parsed.file;
    return {
      text: parsed.text,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
      source: parsed.source === "upload" || parsed.source === "flow" ? parsed.source : "manual",
      file:
        file && typeof file.name === "string"
          ? {
              name: file.name,
              type: typeof file.type === "string" ? file.type : "",
              charCount: typeof file.charCount === "number" ? file.charCount : 0,
              updatedAt: typeof file.updatedAt === "string" ? file.updatedAt : "",
            }
          : undefined,
    };
  } catch {
    return null;
  }
}

export function saveStoredResume(
  text: string,
  source: StoredResume["source"] = "manual",
  file?: StoredResumeFile,
) {
  if (!canUseBrowserStorage()) return;

  const normalizedText = text.trim();
  if (!normalizedText) {
    clearStoredResume();
    return;
  }

  // 没传新的文件信息时，沿用上一次的文件记录：用户上传完再手动改几个字，
  // 上传卡片也不该因为「这次不是上传」就把文件名清空
  const previousFile = file ? undefined : loadStoredResume()?.file;

  const payload: StoredResume = {
    text,
    source,
    updatedAt: new Date().toISOString(),
    ...(file ? { file } : previousFile ? { file: previousFile } : {}),
  };

  window.localStorage.setItem(resumeStorageKey, JSON.stringify(payload));
}

export function clearStoredResume() {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(resumeStorageKey);
}
