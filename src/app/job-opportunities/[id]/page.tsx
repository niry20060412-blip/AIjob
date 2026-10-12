import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge, Card, PageHeader } from "@/components/Ui";
import { buildOpportunityJd, getJobOpportunityById, opportunityPool } from "@/lib/jobOpportunities";

export function generateStaticParams() {
  return opportunityPool.map((item) => ({ id: item.id }));
}

export default async function JobOpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = getJobOpportunityById(id);

  if (!opportunity) {
    return (
      <AppShell>
        <Card>
          <div className="flex min-h-80 flex-col items-center justify-center text-center">
            <h1 className="text-2xl font-bold text-slate-950">没有找到该岗位</h1>
            <p className="mt-3 text-sm text-slate-500">这个岗位可能已经下线，或本地 mock 岗位库中不存在。</p>
            <Link href="/resume-diagnosis" className="mt-6 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">
              返回简历诊断
            </Link>
          </div>
        </Card>
      </AppShell>
    );
  }

  const verificationTone = opportunity.verification.status === "已核查" ? "green" : opportunity.verification.status === "需复核" ? "amber" : "rose";
  const jdText = buildOpportunityJd(opportunity);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Job Opportunity Detail"
        title={opportunity.title}
        description="这是本地 MVP 岗位详情页，用于承接推荐机会、企业核查和下一步匹配/话术生成。正式版可替换为真实招聘平台详情链接。"
        action={opportunity.platform}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-slate-950">{opportunity.title}</h1>
                <Badge>{opportunity.fitScore}%</Badge>
                <Badge tone={verificationTone}>{opportunity.verification.status}</Badge>
              </div>
              <p className="mt-3 text-lg font-semibold text-slate-700">{opportunity.companyName}</p>
              <p className="mt-2 text-sm text-slate-500">{opportunity.city} · {opportunity.salary} · {opportunity.freshness}发布 · {opportunity.postedAt}</p>
            </div>
            <a href={opportunity.sourceUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              打开原始岗位详情
            </a>
          </div>

          <div className="mt-8 rounded-[2rem] bg-slate-50 p-6">
            <h2 className="font-bold text-slate-950">岗位匹配说明</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{opportunity.matchReason}</p>
          </div>

          <div className="mt-6 rounded-[2rem] border border-slate-100 bg-white p-6">
            <h2 className="font-bold text-slate-950">结构化 JD 信息</h2>
            <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">{jdText}</pre>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-bold text-slate-950">企业正规性核查</h2>
            <div className="mt-4 space-y-3">
              {opportunity.verification.checks.map((item) => (
                <div key={item} className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">{item}</div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-slate-950">投递前风险提示</h2>
            <div className="mt-4 space-y-3">
              {opportunity.verification.risks.map((item) => (
                <div key={item} className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">{item}</div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-slate-950">下一步</h2>
            <div className="mt-4 grid gap-3">
              <Link href="/job-matching" className="rounded-2xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-700">
                去做 JD 匹配
              </Link>
              <Link href="/pitch-generator" className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-center text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">
                生成投递话术
              </Link>
              <Link href="/resume-diagnosis" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                返回推荐列表
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
