"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FileTextUploader } from "@/components/FileTextUploader";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/Ui";
import { saveJobFlowContext } from "@/lib/flowContext";
import { parsePluginJobJson, parseRawJobText, saveImportedJob, type ImportedJob } from "@/lib/importedJobs";
import { normalizeAiError } from "@/lib/aiClient";
import { analyzeJobMatchWithAi, type JobMatchResult } from "@/lib/jobMatcher";
import { clearStoredResume, loadStoredResume, saveStoredResume } from "@/lib/resumeStore";

const sampleJd = `岗位名称：AI 产品经理
我们正在寻找一位熟悉 AI 应用和 B 端 SaaS 场景的产品经理，负责从用户需求、产品方案、原型设计到研发上线的完整流程。
岗位要求：
1. 熟悉大模型、AIGC、智能体或 RAG 等 AI 应用场景；
2. 具备产品规划、需求分析、PRD、原型设计和项目推进能力；
3. 有数据分析意识，能通过指标、转化率和留存数据评估效果；
4. 有 B 端工具、企业协作或 SaaS 产品经验优先；
5. 能与研发、设计、运营和客户成功团队高效协作。`;

function ResultList({ title, items, tone = "indigo" }: { title: string; items: string[]; tone?: "indigo" | "green" | "amber" | "slate" }) {
  const dotClass = {
    indigo: "bg-indigo-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    slate: "bg-slate-400",
  }[tone];

  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: JobMatchResult["recommendation"] }) {
  const tone = recommendation === "建议投递" ? "green" : recommendation === "谨慎投递" ? "amber" : "slate";
  return <Badge tone={tone}>{recommendation}</Badge>;
}

export default function JobMatchingPage() {
  const [resumeText, setResumeText] = useState(() => loadStoredResume()?.text || "");
  const [jdText, setJdText] = useState(sampleJd);
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [importJson, setImportJson] = useState("");
  const [importedJob, setImportedJob] = useState<ImportedJob | null>(null);
  const [importMessage, setImportMessage] = useState("可粘贴浏览器插件复制的岗位 JSON。");
  const resumeCount = useMemo(() => resumeText.trim().length, [resumeText]);
  const jdCount = useMemo(() => jdText.trim().length, [jdText]);

  function updateResumeText(text: string, source: "manual" | "upload" = "manual") {
    setResumeText(text);
    setResult(null);
    if (text.trim()) {
      saveStoredResume(text, source);
    } else {
      clearStoredResume();
    }
  }

  async function handleAnalyze() {
    setErrorMessage("");
    setIsAnalyzing(true);
    try {
      saveStoredResume(resumeText, "manual");
      const analysis = await analyzeJobMatchWithAi(resumeText, jdText);
      setResult(analysis);
      saveJobFlowContext({
        resumeText,
        jdText,
        jobTitle: analysis.jobTitle,
        companyName: importedJob?.companyName,
        matchScore: analysis.score,
        recommendation: analysis.recommendation,
        source: "job-match",
      });
    } catch (error) {
      setErrorMessage(normalizeAiError(error));
    } finally {
      setIsAnalyzing(false);
    }
  }

  function applyImportedPayload(payload: ReturnType<typeof parsePluginJobJson>) {
    const savedJob = saveImportedJob(payload);
    setImportedJob(savedJob);
    setJdText(payload.jdText);
    setResult(null);
    setImportMessage(`已导入岗位：${payload.jobTitle}，并保存到本地岗位库。`);
  }

  function handleImportJob() {
    try {
      applyImportedPayload(parsePluginJobJson(importJson));
    } catch (jsonError) {
      try {
        applyImportedPayload(parseRawJobText(importJson));
      } catch {
        setImportMessage(jsonError instanceof Error ? jsonError.message : "导入失败，请检查 JSON 或 JD 文本。 ");
      }
    }
  }

  async function handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setImportJson(text);
      if (!text.trim()) {
        setImportMessage("剪贴板为空，请先在插件中复制岗位信息。");
        return;
      }
      try {
        applyImportedPayload(parsePluginJobJson(text));
      } catch {
        applyImportedPayload(parseRawJobText(text));
      }
    } catch {
      setImportMessage("无法读取剪贴板，请手动粘贴插件复制的内容。");
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Job JD Matching"
        title="岗位 JD 匹配度分析"
        description="输入简历文本和岗位 JD，调用真实 AI 分析关键词匹配度、缺失点、简历修改建议和投递策略。"
        action="真实 AI 匹配"
      />

      <Card className="mb-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">导入岗位</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">粘贴浏览器插件复制的 JSON，系统会自动填充岗位 JD，并保存到本地岗位库。</p>
              </div>
              <Badge tone="indigo">插件 JSON</Badge>
            </div>
            <textarea
              value={importJson}
              onChange={(event) => setImportJson(event.target.value)}
              className="mt-4 min-h-40 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              placeholder='请粘贴插件复制的 JSON，例如：{"jobTitle":"AI 产品经理","companyName":"某公司","jdText":"..."}'
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button onClick={handlePasteFromClipboard} className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">从剪贴板导入</button>
              <button onClick={handleImportJob} className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5">导入并填充 JD</button>
              <button onClick={() => setImportJson("")} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50">清空导入框</button>
            </div>
            <p className={`mt-3 text-sm leading-6 ${importMessage.includes("失败") || importMessage.includes("不正确") || importMessage.includes("过短") ? "text-rose-600" : "text-slate-500"}`}>{importMessage}</p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-950">当前导入岗位</h3>
            {importedJob ? (
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><span className="font-medium text-slate-900">岗位：</span>{importedJob.jobTitle}</p>
                <p><span className="font-medium text-slate-900">公司：</span>{importedJob.companyName || "未识别"}</p>
                <p><span className="font-medium text-slate-900">城市：</span>{importedJob.city || "未识别"}</p>
                <p><span className="font-medium text-slate-900">薪资：</span>{importedJob.salary || "未识别"}</p>
                {importedJob.pageUrl ? <a href={importedJob.pageUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">打开原岗位页面</a> : null}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-500">还没有导入岗位。插件发送到 Web 应用时会先复制 JSON，请在左侧粘贴确认。</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <FileTextUploader
            label="上传简历附件"
            helperText="上传简历后会自动提取文本并填入下方文本框。"
            onTextExtracted={(text) => updateResumeText(text, "upload")}
          />
          <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">简历文本</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">粘贴候选人简历，建议包含项目经历、技能关键词和量化结果。</p>
            </div>
            <Badge tone="slate">{resumeCount} 字</Badge>
          </div>
          <textarea
            value={resumeText}
            onChange={(event) => updateResumeText(event.target.value, "manual")}
            className="mt-5 min-h-80 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            placeholder="请先在简历诊断页上传或粘贴一次简历；也可以在这里直接粘贴，系统会同步保存。"
          />
          </Card>
        </div>

        <div className="space-y-6">
          <FileTextUploader
            label="上传岗位 JD 附件"
            helperText="上传岗位说明、招聘页面导出文本或 JD 文档，识别后会填入下方 JD 文本框。"
            onTextExtracted={(text) => {
              setJdText(text);
              setResult(null);
            }}
          />
          <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">岗位 JD</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">粘贴目标岗位 JD，系统会从岗位名称和能力要求中做简单规则匹配。</p>
            </div>
            <Badge tone="slate">{jdCount} 字</Badge>
          </div>
          <textarea
            value={jdText}
            onChange={(event) => setJdText(event.target.value)}
            className="mt-5 min-h-80 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            placeholder="请粘贴岗位 JD..."
          />
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAnalyzing ? "AI 匹配分析中..." : "开始匹配分析"}
          </button>
          <button
            onClick={() => {
              updateResumeText("");
              setJdText("");
              setResult(null);
              setErrorMessage("");
            }}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            清空
          </button>
        </div>
        {errorMessage ? <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-600">{errorMessage}</p> : null}
      </Card>

      {result ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-indigo-600">分析结果</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">{result.jobTitle}</h2>
              </div>
              <RecommendationBadge recommendation={result.recommendation} />
            </div>
            <div className="mt-6 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white">
              <p className="text-sm text-indigo-100">匹配度评分</p>
              <div className="mt-4 text-6xl font-bold">{result.score}</div>
              <p className="mt-3 text-sm leading-6 text-indigo-100">{result.recommendation}。当前结果来自真实 AI 分析，请结合岗位实际情况复核后再投递。</p>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm text-slate-500">
                <span>岗位匹配进度</span>
                <span>{result.score}%</span>
              </div>
              <ProgressBar value={result.score} />
            </div>
            <div className="mt-6 grid gap-3">
              <Link href="/pitch-generator" className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5">
                用该 JD 生成投递话术
              </Link>
              <Link href="/applications" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                记录到投递管理
              </Link>
            </div>
          </Card>

          <div className="grid gap-5">
            <ResultList title="匹配点" items={result.matchedPoints} tone="green" />
            <ResultList title="缺失点" items={result.missingPoints} tone="amber" />
            <ResultList title="简历修改建议" items={result.resumeSuggestions} tone="indigo" />
            <ResultList title="投递建议" items={result.applicationAdvice} tone="slate" />
          </div>
        </div>
      ) : (
        <Card className="mt-6">
          <div className="flex min-h-48 flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">◎</div>
            <h2 className="mt-5 text-xl font-bold text-slate-950">等待匹配分析</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">输入简历和 JD 后点击“开始匹配分析”，这里会展示岗位名称、评分、投递判断和修改建议。</p>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
