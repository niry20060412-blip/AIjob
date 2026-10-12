export const dashboardStorageKeys = [
  "ai-job-assistant-user-resume",
  "ai-job-assistant-imported-jobs",
  "ai-job-assistant-applications",
  "ai-job-assistant-flow-context",
  "ai-job-assistant-weekly-plan",
];

export function clearUserWorkspaceData() {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;

  dashboardStorageKeys.forEach((key) => {
    window.localStorage.removeItem(key);
  });
}
