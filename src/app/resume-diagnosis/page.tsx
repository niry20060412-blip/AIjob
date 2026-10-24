"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FileTextUploader } from "@/components/FileTextUploader";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/Ui";
import Link from "next/link";
import { normalizeAiError } from "@/lib/aiClient";
import { analyzeResumeWithAi, type JobRecommendation, type ResumeAnalysisResult } from "@/lib/resumeAnalyzer";
import { clearStoredResume, loadStoredResume, saveStoredResume } from "@/lib/resumeStore";

// 分析结果本地缓存：切走窗口/刷新页面后仍可恢复，避免重复等待
const analysisCacheKey = "ai-job-assistant-resume-analysis-v1";

function loadCachedAnalysis(): { resumeText: string; result: ResumeAnalysisResult } | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(analysisCacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { resumeText: string; result: ResumeAnalysisResult };
    if (!parsed?.result || typeof parsed.resumeText !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedAnalysis(resumeText: string, result: ResumeAnalysisResult) {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
  try {
    window.localStorage.setItem(analysisCacheKey, JSON.stringify({ resumeText, result }));
  } catch {
    // 存储满等异常不影响主流程
  }
}

function clearCachedAnalysis() {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
  window.localStorage.removeItem(analysisCacheKey);
}

const recommendationLabels = {
  primary: "主推岗位",
  expanded: "拓展岗位",
  stretch: "冲刺岗位",
  notRecommended: "不建议岗位",
};

const recommendationDescriptions = {
  primary: "当前画像最匹配，建议优先定制简历并集中投递。",
  expanded: "与已有能力相邻，可作为扩大机会池的备选方向。",
  stretch: "有机会但需要补强案例、年限或业务结果。",
  notRecommended: "短期投入产出比较低，不建议作为主要求职方向。",
};

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// 分析等待阶段的提示文案（按已等待秒数切换），避免用户干等无反馈
const analysisStages = [
  { after: 0, label: "已提交简历，AI 正在读取内容…" },
  { after: 8, label: "AI 正在提炼经历、技能和优劣势…" },
  { after: 18, label: "AI 正在生成候选人画像…" },
  { after: 30, label: "AI 正在整理岗位推荐，即将完成…" },
  { after: 50, label: "内容较多的简历会多花一点时间，请稍候…" },
];

function RecommendationCard({ job }: { job: JobRecommendation }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-slate-950">{job.title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-500">{job.reason}</p>
        </div>
        <Badge>{job.fitScore}%</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {job.focus.map((item) => (
          <span key={item} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ResumeDiagnosisPage() {
  const [resumeText, setResumeText] = useState(() => loadStoredResume()?.text || "");
  const [result, setResult] = useState<ResumeAnalysisResult | null>(() => {
    const cached = loadCachedAnalysis();
    const stored = loadStoredResume();
    // 仅当缓存的分析对应的就是当前简历文本时才恢复，避免张冠李戴
    if (cached && stored && cached.resumeText.trim() === stored.text.trim()) {
      return cached.result;
    }
    return null;
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [elapsed, setElapsed] = useState(0);

  // 分析进行中每秒累计已等待时间，用于进度提示
  useEffect(() => {
    if (!isAnalyzing) return;
    setElapsed(0);
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isAnalyzing]);

  const stageLabel = [...analysisStages].reverse().find((stage) => elapsed >= stage.after)?.label || analysisStages[0].label;
  const estimatedProgress = Math.min(92, Math.round((elapsed / 40) * 100));

  // 长时间分析时切走窗口再回来，Chrome 可能丢弃后台页面并重载——重载后恢复之前的结果
  useEffect(() => {
    if (result) return;
    const cached = loadCachedAnalysis();
    const stored = loadStoredResume();
    if (cached && stored && cached.resumeText.trim() === stored.text.trim()) {
      setResult(cached.result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const characterCount = useMemo(() => resumeText.trim().length, [resumeText]);

  function updateResumeText(text: string, source: "manual" | "upload" = "manual") {
    setResumeText(text);
    setResult(null);
    setErrorMessage("");
    if (text.trim()) {
      saveStoredResume(text, source);
    } else {
      clearStoredResume();
    }
    clearCachedAnalysis();
  }

  async function handleAnalyze() {
    setErrorMessage("");
    setIsAnalyzing(true);
    try {
      saveStoredResume(resumeText, "manual");
      const analysis = await analyzeResumeWithAi(resumeText);
      setResult(analysis);
      saveCachedAnalysis(resumeText, analysis);
    } catch (error) {
      setErrorMessage(normalizeAiError(error));
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Resume Diagnosis"
        title="简历诊断页"
        description="粘贴或上传简历后，调用真实 AI 生成候选人画像、能力结构、优劣势和岗位推荐。"
        action="真实 AI 分析"
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div data-tour="resume-upload" className="scroll-mt-24">
            <FileTextUploader
              label="上传简历附件"
              helperText="上传后会自动提取文本并填入下方文本框，你可以先删除隐私信息再分析。"
              onTextExtracted={(text) => updateResumeText(text, "upload")}
            />
          </div>
          <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">粘贴简历文本</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">建议包含工作经历、项目成果、技能关键词和目标岗位，分析结果会更完整。</p>
            </div>
            <Badge tone="slate">{characterCount} 字</Badge>
          </div>
          <textarea
            value={resumeText}
            onChange={(event) => updateResumeText(event.target.value, "manual")}
            placeholder="请在这里粘贴或上传你的简历文本。导入一次后会自动同步到岗位匹配和话术生成。"
            className="mt-5 min-h-96 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              data-tour="start-analyze"
              className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? `AI 分析中… ${elapsed}s` : "开始分析"}
            </button>
            <button
              onClick={() => {
                updateResumeText("");
              }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
            >
              清空
            </button>
          </div>
          {errorMessage ? <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-600">{errorMessage}</p> : null}
          </Card>
        </div>

        {result ? (
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">当前候选人画像</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">分析来源：{result.source === "real-ai" ? "真实 AI" : "本地规则分析"}，请结合实际经历复核后再用于投递。</p>
              </div>
              <Badge tone="green">已生成</Badge>
            </div>
            <div className="mt-6 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-600 p-7 text-white">
              <p className="text-sm text-indigo-100">画像摘要</p>
              <p className="mt-3 text-lg font-semibold leading-8">{result.profile.summary}</p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">工作年限</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{result.profile.yearsOfExperience}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">目标层级</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{result.profile.targetSeniority}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ListBlock title="行业经历" items={result.profile.industryExperience} />
              <ListBlock title="核心技能" items={result.profile.coreSkills} />
              <ListBlock title="可迁移能力" items={result.profile.transferableSkills} />
              <ListBlock title="简历优势" items={result.profile.strengths} />
            </div>
            <div className="mt-4">
              <ListBlock title="简历短板" items={result.profile.weaknesses} />
            </div>
          </Card>
        ) : (
          <Card>
            {isAnalyzing ? (
              <div className="flex h-full min-h-96 flex-col items-center justify-center rounded-[2rem] border border-indigo-100 bg-indigo-50/50 px-6 text-center">
                <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-indigo-100 text-2xl text-indigo-600">◐</div>
                <h2 className="mt-5 text-xl font-bold text-slate-950">AI 分析中 · 已等待 {elapsed} 秒</h2>
                <p className="mt-2 text-sm font-medium text-indigo-600">{stageLabel}</p>
                <div className="mt-6 w-full max-w-sm">
                  <div className="mb-2 flex justify-between text-xs text-slate-500">
                    <span>通常 20~60 秒完成</span>
                    <span>{estimatedProgress}%</span>
                  </div>
                  <ProgressBar value={estimatedProgress} />
                </div>
                <p className="mt-5 max-w-sm text-xs leading-5 text-slate-400">分析期间可以切走页面，结果完成后会自动保存在本地，回到本页不会丢失。</p>
              </div>
            ) : (
              <div className="flex h-full min-h-96 flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">◐</div>
                <h2 className="mt-5 text-xl font-bold text-slate-950">等待分析</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">粘贴简历后点击“开始分析”，这里会展示结构化候选人画像。</p>
              </div>
            )}
          </Card>
        )}
      </div>

      {result ? (
        <>
          <div data-tour="result-section" className="mt-6 scroll-mt-24">
            <Card>
              <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">推荐岗位方向</h2>
                  <p className="mt-2 text-sm text-slate-500">按主推、拓展、冲刺和不建议四类输出，便于后续做精准投递策略。</p>
                </div>
                <Badge>结构化输出</Badge>
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                {(Object.keys(recommendationLabels) as Array<keyof typeof recommendationLabels>).map((key) => (
                  <div key={key} className="rounded-[1.75rem] bg-slate-50 p-5">
                    <div className="mb-4">
                      <h3 className="font-bold text-slate-950">{recommendationLabels[key]}</h3>
                      <p className="mt-1 text-sm text-slate-500">{recommendationDescriptions[key]}</p>
                    </div>
                    <div className="space-y-4">
                      {result.recommendations[key].map((job) => (
                        <RecommendationCard key={job.title} job={job} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

        </>
      ) : null}
    </AppShell>
  );
}
