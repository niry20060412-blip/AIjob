"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Card, PageHeader, ProgressBar } from "@/components/Ui";
import { generateWeeklyPlan, type WeeklyPlanResult } from "@/lib/weeklyPlanner";
import { loadStoredResume } from "@/lib/resumeStore";

const targetJobOptions = ["AI 产品经理", "增长产品经理", "B 端产品经理", "产品运营", "用户体验策略"];

function TaskCheckbox({ id, label, checked, onToggle }: { id: string; label: string; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-2xl bg-white p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-100 transition hover:bg-indigo-50/50">
      <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600" />
      <span className={checked ? "text-slate-400 line-through" : ""}>{label}</span>
      <span className="sr-only">{id}</span>
    </label>
  );
}

export default function WeeklyPlanPage() {
  const [profile, setProfile] = useState("");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [plan, setPlan] = useState<WeeklyPlanResult | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [hasSyncedResume, setHasSyncedResume] = useState(false);

  useEffect(() => {
    const storedResume = loadStoredResume();
    if (!storedResume) return;

    window.setTimeout(() => {
      setProfile(storedResume.text);
      setHasSyncedResume(true);
    }, 0);
  }, []);

  const allTaskIds = useMemo(() => {
    if (!plan) return [];
    return plan.days.flatMap((day) => [
      `${day.id}-goal`,
      ...day.tasks.map((_, index) => `${day.id}-task-${index}`),
      `${day.id}-resume`,
      `${day.id}-follow`,
    ]);
  }, [plan]);

  const completedCount = allTaskIds.filter((id) => completedTasks[id]).length;
  const progress = allTaskIds.length ? Math.round((completedCount / allTaskIds.length) * 100) : 0;

  function toggleJob(job: string) {
    setSelectedJobs((current) => {
      if (current.includes(job)) return current.filter((item) => item !== job);
      return [...current, job];
    });
  }

  function handleGenerate() {
    const targetJobs = selectedJobs.length ? selectedJobs : ["AI 产品经理"];
    const nextPlan = generateWeeklyPlan(profile, targetJobs);
    setPlan(nextPlan);
    setCompletedTasks({});
  }

  function toggleTask(id: string) {
    setCompletedTasks((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Weekly Plan"
        title="一周投递计划"
        description="根据目标岗位方向生成 7 天行动计划，把岗位筛选、简历优化、精准投递和跟进复盘拆成每天可完成的任务。"
        action="本地计划生成"
      />

      <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">生成设置</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">选择本周主攻方向，可以多选。候选人画像会自动同步你已上传的简历内容。</p>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-slate-600">候选人画像</label>
              {hasSyncedResume ? <Badge tone="green">已同步上传简历</Badge> : <Badge tone="slate">未上传简历</Badge>}
            </div>
            <textarea
              value={profile}
              onChange={(event) => setProfile(event.target.value)}
              className="mt-2 min-h-36 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              placeholder="请先在简历诊断页上传或粘贴简历；上传后这里会自动同步。也可以在此手动补充本周目标。"
            />
            {!hasSyncedResume ? <p className="mt-2 text-xs text-slate-400">当前没有读取到已上传简历，因此不会再显示任何内置示例画像。</p> : null}
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-slate-600">目标岗位方向</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {targetJobOptions.map((job) => {
                const active = selectedJobs.includes(job);
                return (
                  <button
                    key={job}
                    onClick={() => toggleJob(job)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"}`}
                  >
                    {job}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5"
          >
            生成 7 天计划
          </button>
        </Card>

        <Card>
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">本周进度</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">勾选每日任务后，进度会自动更新。</p>
            </div>
            <Badge tone="green">建议投递 {plan?.totalSuggestedApplications || 0} 个</Badge>
          </div>
          <div className="mt-7 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-indigo-100">完成进度</p>
                <div className="mt-3 text-6xl font-bold">{progress}%</div>
              </div>
              <div className="text-right text-sm text-indigo-100">
                <p>{completedCount} / {allTaskIds.length}</p>
                <p>任务已完成</p>
              </div>
            </div>
            <div className="mt-6 h-3 rounded-full bg-white/20">
              <div className="h-3 rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">目标方向</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{plan?.targetJobs[0] || "未生成"}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">计划天数</p>
              <p className="mt-2 text-lg font-bold text-slate-950">7 天</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">剩余任务</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{Math.max(0, allTaskIds.length - completedCount)} 项</p>
            </div>
          </div>
        </Card>
      </div>

      {plan ? (
        <Card className="mt-6">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">7 天行动计划</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">每一天都包含当日目标、具体任务、建议投递数量、简历优化动作和跟进动作。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {plan.targetJobs.map((job) => <Badge key={job}>{job}</Badge>)}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {plan.days.map((day) => {
              const dayTaskIds = [`${day.id}-goal`, ...day.tasks.map((_, index) => `${day.id}-task-${index}`), `${day.id}-resume`, `${day.id}-follow`];
              const dayCompleted = dayTaskIds.filter((id) => completedTasks[id]).length;
              const dayProgress = Math.round((dayCompleted / dayTaskIds.length) * 100);

              return (
                <div key={day.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-indigo-600">{day.day}</p>
                      <h3 className="mt-1 text-lg font-bold text-slate-950">{day.theme}</h3>
                    </div>
                    <Badge tone={day.suggestedApplications > 0 ? "indigo" : "slate"}>投 {day.suggestedApplications} 个</Badge>
                  </div>

                  <div className="mb-4">
                    <div className="mb-2 flex justify-between text-xs text-slate-500">
                      <span>当日完成度</span>
                      <span>{dayProgress}%</span>
                    </div>
                    <ProgressBar value={dayProgress} />
                  </div>

                  <div className="space-y-3">
                    <TaskCheckbox id={`${day.id}-goal`} label={`当日目标：${day.dailyGoal}`} checked={Boolean(completedTasks[`${day.id}-goal`])} onToggle={() => toggleTask(`${day.id}-goal`)} />
                    {day.tasks.map((task, index) => {
                      const id = `${day.id}-task-${index}`;
                      return <TaskCheckbox key={id} id={id} label={`具体任务：${task}`} checked={Boolean(completedTasks[id])} onToggle={() => toggleTask(id)} />;
                    })}
                    <TaskCheckbox id={`${day.id}-resume`} label={`简历优化：${day.resumeOptimization}`} checked={Boolean(completedTasks[`${day.id}-resume`])} onToggle={() => toggleTask(`${day.id}-resume`)} />
                    <TaskCheckbox id={`${day.id}-follow`} label={`跟进动作：${day.followUpAction}`} checked={Boolean(completedTasks[`${day.id}-follow`])} onToggle={() => toggleTask(`${day.id}-follow`)} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}
    </AppShell>
  );
}
