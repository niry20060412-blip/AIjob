"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/Ui";
import { clearUserWorkspaceData } from "@/lib/dashboardStore";
import { loadStoredResume } from "@/lib/resumeStore";

function getStoredCount(key: string) {
  if (typeof window === "undefined") return 0;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function subscribeToDashboardData(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getDashboardSnapshot() {
  const resume = loadStoredResume();
  const importedJobCount = getStoredCount("ai-job-assistant-imported-jobs");
  const applicationCount = getStoredCount("ai-job-assistant-applications");

  return JSON.stringify({
    resume,
    importedJobCount,
    applicationCount,
  });
}

const emptyDashboardSnapshot = JSON.stringify({
  resume: null,
  importedJobCount: 0,
  applicationCount: 0,
});

export default function Home() {
  const dashboardSnapshot = useSyncExternalStore(subscribeToDashboardData, getDashboardSnapshot, () => emptyDashboardSnapshot);
  const { resume, importedJobCount, applicationCount } = JSON.parse(dashboardSnapshot) as {
    resume: ReturnType<typeof loadStoredResume>;
    importedJobCount: number;
    applicationCount: number;
  };

  const metrics = [
    { label: "已导入简历", value: resume?.text ? "1" : "0", trend: resume?.text ? "已同步" : "等待导入" },
    { label: "已导入岗位", value: String(importedJobCount), trend: importedJobCount ? "本地岗位库" : "等待导入" },
    { label: "投递记录", value: String(applicationCount), trend: applicationCount ? "来自投递管理" : "暂无记录" },
    { label: "生成话术", value: "0", trend: "生成后可复制" },
  ];

  function handleClearAll() {
    clearUserWorkspaceData();
    window.dispatchEvent(new StorageEvent("storage"));
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI Job Decision OS"
        title="把求职从海投，变成有策略的精准行动"
        description="围绕你导入的简历和岗位信息，完成简历诊断、岗位匹配、话术生成、投递管理和一周计划，每一步都有 AI 帮你把方向理清楚。"
        action="开始导入简历"
      />

      <div className="mb-6 rounded-3xl border border-amber-100 bg-amber-50 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-slate-950">当前工作区数据</h2>
            <p className="mt-2 text-sm leading-6 text-amber-800">这里仅统计你在浏览器本地导入、粘贴或新增的数据。若要重新开始，可一键清除本地记录。</p>
          </div>
          <button onClick={handleClearAll} className="rounded-2xl border border-amber-200 bg-white px-5 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100">
            清除本地记录
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <Card key={item.label}>
            <p className="text-sm text-slate-500">{item.label}</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-950">{item.value}</span>
              <Badge>{item.trend}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">推荐求职路径</h2>
              <p className="mt-1 text-sm text-slate-500">先导入用户简历，再导入岗位，最后生成投递材料。</p>
            </div>
            <Badge tone="green">从空白开始</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["01", "导入简历", "上传或粘贴用户真实简历", "/resume-diagnosis", "step-resume"],
              ["02", "导入岗位", "插件采集或粘贴 JD", "/job-matching", "step-match"],
              ["03", "生成话术", "基于当前简历和 JD 生成", "/pitch-generator", "step-pitch"],
            ].map(([step, title, desc, href, tour]) => (
              <Link key={title} href={href} data-tour={tour} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-indigo-200 hover:bg-indigo-50/60">
                <span className="text-sm font-bold text-indigo-600">{step}</span>
                <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-950">简历状态</h2>
          {resume?.text ? (
            <div className="mt-5">
              <p className="text-sm leading-6 text-slate-500">已检测到用户导入的简历，后续岗位匹配和话术生成会自动复用。</p>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">同步状态</span>
                  <span className="text-indigo-600">100</span>
                </div>
                <ProgressBar value={100} />
              </div>
              <p className="mt-4 text-xs text-slate-400">最近来源：{resume.source} · {resume.updatedAt || "本地记录"}</p>
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="font-semibold text-slate-950">还没有导入简历</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">请先进入简历诊断页上传或粘贴简历。系统不会再使用自带模拟简历。</p>
              <Link href="/resume-diagnosis" data-tour="resume-cta" className="mt-5 inline-flex rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">
                去导入简历
              </Link>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">岗位数据来源</h2>
          <div className="mt-5 rounded-3xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">
            这里不再展示系统内置“高匹配岗位”。岗位需要来自用户导入、插件采集或后续真实招聘数据接口。
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-950">下一步</h2>
          <div className="mt-5 space-y-3">
            <Link href="/resume-diagnosis" className="block rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">导入简历并诊断</Link>
            <Link href="/job-matching" className="block rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">导入岗位并匹配</Link>
            <Link href="/applications" className="block rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">查看投递管理</Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
