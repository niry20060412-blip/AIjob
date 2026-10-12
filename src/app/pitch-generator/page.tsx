"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Card, PageHeader } from "@/components/Ui";
import { loadJobFlowContext, type JobFlowContext } from "@/lib/flowContext";
import { generateApplicationMessages, type ApplicationMessage, type ApplicationMessagesResult } from "@/lib/messageGenerator";
import { clearStoredResume, loadStoredResume, saveStoredResume } from "@/lib/resumeStore";

const sampleJd = `岗位名称：AI 产品经理
我们正在寻找一位熟悉 AI 应用和 B 端 SaaS 场景的产品经理，负责从用户需求、产品方案、原型设计到研发上线的完整流程。
岗位要求：熟悉大模型、AIGC 或智能体应用；具备产品规划、需求分析、PRD、原型设计和项目推进能力；有数据分析意识，能通过指标、转化率和留存数据评估效果；有 B 端工具、企业协作或 SaaS 产品经验优先。`;

function MessageCard({ message }: { message: ApplicationMessage }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-950">{message.style}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{message.description}</p>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
        >
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">{message.content}</p>
    </div>
  );
}

export default function PitchGeneratorPage() {
  const [flowContext] = useState<JobFlowContext | null>(() => loadJobFlowContext());
  const [resumeText, setResumeText] = useState(() => flowContext?.resumeText || loadStoredResume()?.text || "");
  const [jdText, setJdText] = useState(() => flowContext?.jdText || sampleJd);
  const [result, setResult] = useState<ApplicationMessagesResult | null>(null);
  const resumeCount = useMemo(() => resumeText.trim().length, [resumeText]);
  const jdCount = useMemo(() => jdText.trim().length, [jdText]);

  function updateResumeText(text: string) {
    setResumeText(text);
    setResult(null);
    if (text.trim()) {
      saveStoredResume(text, flowContext?.resumeText ? "flow" : "manual");
    } else {
      clearStoredResume();
    }
  }

  function handleGenerate() {
    saveStoredResume(resumeText, flowContext?.resumeText ? "flow" : "manual");
    setResult(generateApplicationMessages(resumeText, jdText));
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Pitch Generator"
        title="投递话术生成"
        description="输入简历文本和岗位 JD，本地 mock 函数会生成 4 种不同风格的自然投递话术，不接真实 AI API。"
        action="本地话术生成"
      />

      {flowContext ? (
        <Card className="mb-6 border-indigo-100 bg-indigo-50/60">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">已承接岗位匹配结果</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">{flowContext.jobTitle || "目标岗位"}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                匹配度 {flowContext.matchScore ?? "--"}% · {flowContext.recommendation || "等待投递判断"}。可直接生成话术并复制投递。
              </p>
            </div>
            <button onClick={handleGenerate} className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5">
              直接生成话术
            </button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">简历文本</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">粘贴简历内容，用于提取可写进话术的经历、技能和结果。</p>
            </div>
            <Badge tone="slate">{resumeCount} 字</Badge>
          </div>
          <textarea
            value={resumeText}
            onChange={(event) => updateResumeText(event.target.value)}
            className="mt-5 min-h-72 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            placeholder="简历会自动沿用你已上传或粘贴过的内容；也可以在这里修改，系统会同步保存。"
          />
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">岗位 JD</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">粘贴目标岗位 JD，用于识别岗位名称和需要强调的匹配点。</p>
            </div>
            <Badge tone="slate">{jdCount} 字</Badge>
          </div>
          <textarea
            value={jdText}
            onChange={(event) => setJdText(event.target.value)}
            className="mt-5 min-h-72 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            placeholder="请粘贴岗位 JD..."
          />
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleGenerate}
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5"
          >
            生成投递话术
          </button>
          <button
            onClick={() => {
              updateResumeText("");
              setJdText("");
              setResult(null);
            }}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            清空
          </button>
        </div>
      </Card>

      {result ? (
        <Card className="mt-6">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">目标岗位：{result.jobTitle}</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">生成结果</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">已生成 4 种风格话术。每条都可以单独复制，用于 Boss 直聘、内推私信或邮件开场。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.highlights.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {result.messages.map((message) => (
              <MessageCard key={message.style} message={message} />
            ))}
          </div>
        </Card>
      ) : (
        <Card className="mt-6">
          <div className="flex min-h-48 flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">✦</div>
            <h2 className="mt-5 text-xl font-bold text-slate-950">等待生成话术</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">输入简历和 JD 后点击“生成投递话术”，这里会展示专业简洁、真诚求职、应届生/转行解释和高匹配强调四种版本。</p>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
