"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/Ui";

type ApplicationStatus = "待投递" | "已投递" | "已回复" | "面试中" | "Offer" | "已拒绝" | "暂缓";

type ApplicationRecord = {
  id: string;
  companyName: string;
  jobTitle: string;
  platform: string;
  city: string;
  salary: string;
  jobLink: string;
  matchScore: number;
  status: ApplicationStatus;
  appliedDate: string;
  followUpDate: string;
  note: string;
};

const storageKey = "ai-job-assistant-applications";

const statusOptions: Array<"全部" | ApplicationStatus> = ["全部", "待投递", "已投递", "已回复", "面试中", "Offer", "已拒绝", "暂缓"];

const statusTone: Record<ApplicationStatus, "indigo" | "slate" | "green" | "amber"> = {
  待投递: "slate",
  已投递: "indigo",
  已回复: "green",
  面试中: "amber",
  Offer: "green",
  已拒绝: "slate",
  暂缓: "slate",
};

const emptyForm: Omit<ApplicationRecord, "id"> = {
  companyName: "",
  jobTitle: "",
  platform: "Boss 直聘",
  city: "",
  salary: "",
  jobLink: "",
  matchScore: 80,
  status: "待投递",
  appliedDate: "",
  followUpDate: "",
  note: "",
};

function StatCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-3xl font-bold text-slate-950">{value}</span>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{hint}</span>
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputClass = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100";

export default function ApplicationsPage() {
  const [records, setRecords] = useState<ApplicationRecord[]>(() => {
    if (typeof window === "undefined") return [];

    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return [];

    try {
      // 过滤掉早期内置的 3 条演示记录（app-1/app-2/app-3），用户真实添加的记录不受影响
      const parsed = JSON.parse(saved) as ApplicationRecord[];
      return Array.isArray(parsed) ? parsed.filter((item) => !["app-1", "app-2", "app-3"].includes(item?.id)) : [];
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState<"全部" | ApplicationStatus>("全部");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records]);

  const stats = useMemo(() => {
    const total = records.length;
    const replies = records.filter((item) => ["已回复", "面试中", "Offer"].includes(item.status)).length;
    const interviews = records.filter((item) => ["面试中", "Offer"].includes(item.status)).length;
    const offers = records.filter((item) => item.status === "Offer").length;
    const replyRate = total ? Math.round((replies / total) * 100) : 0;
    const interviewRate = total ? Math.round((interviews / total) * 100) : 0;
    return { total, replies, interviews, offers, replyRate, interviewRate };
  }, [records]);

  const visibleRecords = useMemo(() => {
    return records
      .filter((item) => statusFilter === "全部" || item.status === statusFilter)
      .sort((a, b) => (sortOrder === "desc" ? b.matchScore - a.matchScore : a.matchScore - b.matchScore));
  }, [records, sortOrder, statusFilter]);

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.companyName.trim() || !form.jobTitle.trim()) return;

    const nextRecord: ApplicationRecord = {
      id: `app-${Date.now()}`,
      ...form,
      companyName: form.companyName.trim(),
      jobTitle: form.jobTitle.trim(),
      matchScore: Math.min(100, Math.max(0, Number(form.matchScore) || 0)),
    };

    setRecords((current) => [nextRecord, ...current]);
    setForm({ ...emptyForm, appliedDate: new Date().toISOString().slice(0, 10) });
  }

  function updateStatus(id: string, status: ApplicationStatus) {
    setRecords((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Application Tracker"
        title="投递管理"
        description="记录每一次精准投递，跟踪状态、匹配度、跟进日期和结果转化，避免投完就忘。数据优先保存在浏览器 localStorage。"
        action="前端本地存储"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label="总投递数" value={stats.total} hint="全部记录" />
        <StatCard label="回复数" value={stats.replies} hint="含面试/Offer" />
        <StatCard label="面试数" value={stats.interviews} hint="进入面试" />
        <StatCard label="Offer 数" value={stats.offers} hint="最终结果" />
        <StatCard label="回复率" value={`${stats.replyRate}%`} hint="回复/投递" />
        <StatCard label="面试率" value={`${stats.interviewRate}%`} hint="面试/投递" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <Card data-tour="application-form">
          <h2 className="text-xl font-bold text-slate-950">新增投递记录</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">公司和岗位为必填；其他字段可先粗略记录，后续跟进时再补充。</p>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="公司名称">
              <input className={inputClass} value={form.companyName} onChange={(event) => updateForm("companyName", event.target.value)} placeholder="请输入公司名称" />
            </Field>
            <Field label="岗位名称">
              <input className={inputClass} value={form.jobTitle} onChange={(event) => updateForm("jobTitle", event.target.value)} placeholder="请输入岗位名称" />
            </Field>
            <Field label="平台来源">
              <input className={inputClass} value={form.platform} onChange={(event) => updateForm("platform", event.target.value)} placeholder="Boss 直聘 / 拉勾 / 内推" />
            </Field>
            <Field label="城市">
              <input className={inputClass} value={form.city} onChange={(event) => updateForm("city", event.target.value)} placeholder="北京 / 上海 / 远程" />
            </Field>
            <Field label="薪资">
              <input className={inputClass} value={form.salary} onChange={(event) => updateForm("salary", event.target.value)} placeholder="20-35K" />
            </Field>
            <Field label="岗位链接">
              <input className={inputClass} value={form.jobLink} onChange={(event) => updateForm("jobLink", event.target.value)} placeholder="https://..." />
            </Field>
            <Field label="匹配度评分">
              <input className={inputClass} type="number" min="0" max="100" value={form.matchScore} onChange={(event) => updateForm("matchScore", Number(event.target.value))} />
            </Field>
            <Field label="投递状态">
              <select className={inputClass} value={form.status} onChange={(event) => updateForm("status", event.target.value as ApplicationStatus)}>
                {statusOptions.filter((item) => item !== "全部").map((status) => <option key={status}>{status}</option>)}
              </select>
            </Field>
            <Field label="投递日期">
              <input className={inputClass} type="date" value={form.appliedDate} onChange={(event) => updateForm("appliedDate", event.target.value)} />
            </Field>
            <Field label="跟进日期">
              <input className={inputClass} type="date" value={form.followUpDate} onChange={(event) => updateForm("followUpDate", event.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label="备注">
                <textarea className={`${inputClass} min-h-24 resize-none leading-6`} value={form.note} onChange={(event) => updateForm("note", event.target.value)} placeholder="记录定制简历版本、沟通话术、下一步动作等" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <button className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5">
                新增记录
              </button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">投递记录</h2>
              <p className="mt-2 text-sm text-slate-500">支持状态筛选和按匹配度排序。</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "全部" | ApplicationStatus)}>
                {statusOptions.map((status) => <option key={status}>{status}</option>)}
              </select>
              <select className={inputClass} value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "desc" | "asc")}>
                <option value="desc">匹配度从高到低</option>
                <option value="asc">匹配度从低到高</option>
              </select>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {visibleRecords.map((item) => (
              <div key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-950">{item.companyName}</h3>
                      <Badge tone={statusTone[item.status]}>{item.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700">{item.jobTitle}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1">{item.platform || "未填平台"}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">{item.city || "未填城市"}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">{item.salary || "未填薪资"}</span>
                    </div>
                  </div>
                  <div className="min-w-40">
                    <div className="mb-2 flex justify-between text-sm text-slate-500">
                      <span>匹配度</span>
                      <b className="text-indigo-600">{item.matchScore}%</b>
                    </div>
                    <ProgressBar value={item.matchScore} />
                    <select className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none" value={item.status} onChange={(event) => updateStatus(item.id, event.target.value as ApplicationStatus)}>
                      {statusOptions.filter((status) => status !== "全部").map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                  <p>投递日期：{item.appliedDate || "未填"}</p>
                  <p>跟进日期：{item.followUpDate || "未填"}</p>
                  <p>
                    链接：{item.jobLink ? <a href={item.jobLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">打开岗位</a> : "未填"}
                  </p>
                </div>
                {item.note ? <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{item.note}</p> : null}
              </div>
            ))}
            {visibleRecords.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                当前筛选条件下没有投递记录。
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
