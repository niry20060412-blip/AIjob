"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FileTextUploader } from "@/components/FileTextUploader";
import { Badge, Card, PageHeader } from "@/components/Ui";
import Link from "next/link";
import { saveJobFlowContext } from "@/lib/flowContext";
import { buildOpportunityJd, searchRecentJobOpportunities, type JobOpportunity } from "@/lib/jobOpportunities";
import { normalizeAiError } from "@/lib/aiClient";
import { analyzeResumeWithAi, type JobRecommendation, type ResumeAnalysisResult } from "@/lib/resumeAnalyzer";
import { clearStoredResume, loadStoredResume, saveStoredResume } from "@/lib/resumeStore";

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

function OpportunityCard({ opportunity, resumeText }: { opportunity: JobOpportunity; resumeText: string }) {
  const verificationTone = opportunity.verification.status === "已核查" ? "green" : opportunity.verification.status === "需复核" ? "amber" : "rose";
  const jdText = buildOpportunityJd(opportunity);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-slate-950">{opportunity.title}</h4>
            <Badge>{opportunity.fitScore}%</Badge>
            <Badge tone={verificationTone}>{opportunity.verification.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-600">{opportunity.companyName} · {opportunity.city} · {opportunity.salary}</p>
          <p className="mt-1 text-xs text-slate-400">{opportunity.platform} · {opportunity.freshness}发布 · {opportunity.postedAt}</p>
        </div>
        <Link href={`/job-opportunities/${opportunity.id}`} className="rounded-2xl border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
          查看岗位详情
        </Link>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{opportunity.matchReason}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs font-semibold text-emerald-700">企业正规性核查</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-emerald-800">
            {opportunity.verification.checks.map((item) => <li key={item}>· {item}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-700">投递前风险复核</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-800">
            {opportunity.verification.risks.map((item) => <li key={item}>· {item}</li>)}
          </ul>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/job-matching"
          onClick={() => saveJobFlowContext({ resumeText, jdText, jobTitle: opportunity.title, companyName: opportunity.companyName, matchScore: opportunity.fitScore, recommendation: opportunity.fitScore >= 75 ? "建议投递" : "谨慎投递", source: "resume-diagnosis" })}
          className="rounded-2xl bg-indigo-600 px-4 py-2 text-center text-xs font-semibold text-white transition hover:bg-indigo-700"
        >
          去做 JD 匹配
        </Link>
        <Link
          href="/pitch-generator"
          onClick={() => saveJobFlowContext({ resumeText, jdText, jobTitle: opportunity.title, companyName: opportunity.companyName, matchScore: opportunity.fitScore, recommendation: opportunity.fitScore >= 75 ? "建议投递" : "谨慎投递", source: "resume-diagnosis" })}
          className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-center text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
        >
          生成投递话术
        </Link>
      </div>
    </div>
  );
}

export default function ResumeDiagnosisPage() {
  const [resumeText, setResumeText] = useState(() => loadStoredResume()?.text || "");
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const characterCount = useMemo(() => resumeText.trim().length, [resumeText]);
  const opportunities = useMemo(() => {
    if (!result) return [];
    return searchRecentJobOpportunities(result.profile, result.recommendations.primary);
  }, [result]);

  function updateResumeText(text: string, source: "manual" | "upload" = "manual") {
    setResumeText(text);
    setResult(null);
    setErrorMessage("");
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
      setResult(await analyzeResumeWithAi(resumeText));
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
          <FileTextUploader
            label="上传简历附件"
            helperText="上传后会自动提取文本并填入下方文本框，你可以先删除隐私信息再分析。"
            onTextExtracted={(text) => updateResumeText(text, "upload")}
          />
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
              className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? "AI 分析中..." : "开始分析"}
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
                <p className="mt-2 text-sm leading-6 text-slate-500">分析来源：{result.source === "real-ai" ? "真实 AI" : "本地兜底"}，请结合实际经历复核后再用于投递。</p>
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
            <div className="flex h-full min-h-96 flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">◐</div>
              <h2 className="mt-5 text-xl font-bold text-slate-950">等待分析</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">粘贴简历后点击“开始分析”，这里会展示结构化候选人画像。</p>
            </div>
          </Card>
        )}
      </div>

      {result ? (
        <>
          <Card className="mt-6">
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

          <Card className="mt-6">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">近期可投递岗位机会</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">MVP 版使用本地 mock 的近期岗位池演示“全网岗位推荐 + 企业正规性核查”流程；正式版可接招聘平台搜索、工商信息和黑名单风控数据源。</p>
              </div>
              <Badge tone="green">近 14 天优先</Badge>
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              {opportunities.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} resumeText={resumeText} />
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </AppShell>
  );
}
