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

/**
 * 简历存在哪：localStorage → sessionStorage → 内存，逐级兜底。
 *
 * 为什么不只靠 localStorage：关掉 cookie / 无痕模式 / 某些内置浏览器里，
 * 读写 localStorage 会直接抛异常（Safari 无痕、部分 App 内嵌 WebView 都这样）。
 * 以前没有 try/catch，写失败后简历就只在当前页面内存里，一切页面就空——
 * 表现就是「换了页面简历没了」。现在写失败会退到 sessionStorage，
 * 再失败还有模块级内存兜底（同一次打开期间切页面不会丢）。
 */
let memoryResume: StoredResume | null = null;

function safeGet(storage: "local" | "session"): string | null {
  if (typeof window === "undefined") return null;
  try {
    const area = storage === "local" ? window.localStorage : window.sessionStorage;
    return area.getItem(resumeStorageKey);
  } catch {
    return null;
  }
}

function safeSet(value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(resumeStorageKey, value);
  } catch {
    /* 无痕模式 / 存储满 / 被禁用，交给下一级 */
  }
  try {
    window.sessionStorage.setItem(resumeStorageKey, value);
  } catch {
    /* 同样可能被禁用 */
  }
}

function safeRemove() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(resumeStorageKey);
  } catch {
    /* ignore */
  }
  try {
    window.sessionStorage.removeItem(resumeStorageKey);
  } catch {
    /* ignore */
  }
}

function parseStoredResume(raw: string | null): StoredResume | null {
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

export function loadStoredResume(): StoredResume | null {
  return parseStoredResume(safeGet("local")) ?? parseStoredResume(safeGet("session")) ?? memoryResume;
}

export function saveStoredResume(
  text: string,
  source: StoredResume["source"] = "manual",
  file?: StoredResumeFile,
) {
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

  memoryResume = payload;
  safeSet(JSON.stringify(payload));
}

export function clearStoredResume() {
  memoryResume = null;
  safeRemove();
}
