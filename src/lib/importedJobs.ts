export type ImportedJob = {
  id: string;
  source?: string;
  collectedAt?: string;
  pageTitle?: string;
  pageUrl?: string;
  jobTitle: string;
  companyName?: string;
  salary?: string;
  city?: string;
  jdText: string;
  note?: string;
};

export type PluginJobPayload = Omit<ImportedJob, "id"> & {
  id?: string;
};

export const importedJobsStorageKey = "ai-job-assistant-imported-jobs";

function normalizePluginJsonText(jsonText: string) {
  const text = jsonText.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  return text;
}

function inferTitleFromText(text: string) {
  const titleMatch = text.match(/(?:岗位名称|职位名称|招聘岗位|职位)[:：]\s*([^\n。]{2,60})/);
  if (titleMatch?.[1]) return titleMatch[1].trim();
  return "导入岗位";
}

export function parseRawJobText(rawText: string): PluginJobPayload {
  const jdText = rawText.trim();
  if (!jdText || jdText.length < 20) {
    throw new Error("岗位 JD 文本过短，请粘贴更完整的岗位描述。 ");
  }

  return {
    source: "manual-raw-text",
    collectedAt: new Date().toISOString(),
    pageTitle: "",
    pageUrl: "",
    jobTitle: inferTitleFromText(jdText),
    companyName: "",
    salary: "",
    city: "",
    jdText,
    note: "由导入框纯文本导入，请人工确认后再分析。",
  };
}

export function parsePluginJobJson(jsonText: string): PluginJobPayload {
  let payload: unknown;
  const normalizedText = normalizePluginJsonText(jsonText);

  try {
    payload = JSON.parse(normalizedText);
  } catch {
    throw new Error("JSON 格式不正确，请确认粘贴的是插件复制的完整内容。也可以直接粘贴岗位 JD 文本，系统会按纯文本导入。");
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("导入内容不是有效对象。");
  }

  const data = payload as Partial<PluginJobPayload>;
  const jdText = String(data.jdText || "").trim();
  const jobTitle = String(data.jobTitle || "").trim();

  if (!jdText || jdText.length < 20) {
    throw new Error("岗位 JD 文本过短，请确认采集结果是否完整。");
  }

  return {
    source: String(data.source || "chrome-extension-mv3"),
    collectedAt: String(data.collectedAt || ""),
    pageTitle: String(data.pageTitle || ""),
    pageUrl: String(data.pageUrl || ""),
    jobTitle: jobTitle || "导入岗位",
    companyName: String(data.companyName || ""),
    salary: String(data.salary || ""),
    city: String(data.city || ""),
    jdText,
    note: String(data.note || "由浏览器插件导入，请人工确认后再分析。"),
  };
}

export function saveImportedJob(job: PluginJobPayload) {
  if (typeof window === "undefined") return null;

  const importedJob: ImportedJob = {
    ...job,
    id: `job-${Date.now()}`,
  };
  const saved = window.localStorage.getItem(importedJobsStorageKey);
  const current = saved ? (JSON.parse(saved) as ImportedJob[]) : [];
  window.localStorage.setItem(importedJobsStorageKey, JSON.stringify([importedJob, ...current]));
  return importedJob;
}
