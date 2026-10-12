export type JobFlowContext = {
  resumeText: string;
  jdText: string;
  jobTitle?: string;
  companyName?: string;
  matchScore?: number;
  recommendation?: string;
  source?: "job-match" | "resume-diagnosis" | "manual";
  updatedAt: string;
};

export const jobFlowContextStorageKey = "ai-job-assistant-flow-context";

export function saveJobFlowContext(context: Omit<JobFlowContext, "updatedAt">) {
  if (typeof window === "undefined") return;

  const payload: JobFlowContext = {
    ...context,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(jobFlowContextStorageKey, JSON.stringify(payload));
}

export function loadJobFlowContext() {
  if (typeof window === "undefined") return null;

  const saved = window.localStorage.getItem(jobFlowContextStorageKey);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as JobFlowContext;
  } catch {
    return null;
  }
}
