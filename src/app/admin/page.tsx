"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminAuthError,
  AdminConfigError,
  adminCreateCodes,
  adminListCodes,
  adminListUsage,
  isAdminCloudConfigured,
  type UsageLog,
} from "@/lib/adminClient";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

// 后台口令只在本标签页内暂存，关掉标签页即失效；真 token 只在服务端
const PASS_STORE_KEY = "aja_admin_pass";

// 用量动作 -> 中文展示名
const ACTION_LABELS: Record<string, string> = {
  resume: "简历诊断",
  matching: "岗位匹配",
  pitch: "投递话术",
  weekly: "一周计划",
};

interface CodeRow {
  code: string;
  quota: number;
  used: number;
  active: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [rows, setRows] = useState<CodeRow[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [count, setCount] = useState(10);
  const [quota, setQuota] = useState(100);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  // 后台口令：进入前必须输入，服务端校验；不写死在前端
  const [pass, setPass] = useState("");
  const [passInput, setPassInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);

  async function enter(candidate: string, silent = false) {
    const value = candidate.trim();
    if (!value) {
      if (!silent) setAuthError("请输入后台口令");
      return;
    }
    setChecking(true);
    if (!silent) setAuthError("");
    try {
      const res = await adminListCodes(value);
      if (!res.ok) {
        setAuthError("口令不正确，或服务端拒绝访问。");
        return;
      }
      setRows(res.codes || []);
      setPass(value);
      setAuthed(true);
      try {
        window.sessionStorage.setItem(PASS_STORE_KEY, value);
      } catch {
        /* 隐私模式忽略 */
      }
      try {
        const usage = await adminListUsage(value);
        if (usage.ok) setLogs(usage.logs || []);
      } catch {
        /* 用量拉取失败不影响主流程 */
      }
    } catch (e) {
      if (e instanceof AdminAuthError) setAuthError("口令不正确。");
      else if (e instanceof AdminConfigError) setAuthError(e.message);
      else setAuthError(e instanceof Error ? e.message : "无法连接后台服务。");
    } finally {
      setChecking(false);
    }
  }

  // 本标签页内刷新不必重输口令（关掉标签页就失效）
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let saved = "";
    try {
      saved = window.sessionStorage.getItem(PASS_STORE_KEY) || "";
    } catch {
      saved = "";
    }
    if (saved) void enter(saved, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 标签页名字标成「后台管理」，避免和正常站点、演示站的标签混在一起
  useDocumentTitle("AI 精准求职投递助手 后台管理");

  function signOut() {
    try {
      window.sessionStorage.removeItem(PASS_STORE_KEY);
    } catch {
      /* 忽略 */
    }
    setPass("");
    setPassInput("");
    setAuthed(false);
    setRows([]);
    setLogs([]);
    setMessage("");
    setAuthError("");
  }

  // 用量统计：每激活码「已用」即买家 AI 分析总次数；token/成本为估算值（仅供参考）
  const stats = useMemo(() => {
    const totalCodes = rows.length;
    const totalUsed = rows.reduce((sum, r) => sum + (r.used || 0), 0);
    const totalQuota = rows.reduce((sum, r) => sum + (r.quota || 0), 0);
    const estimatedTokens = totalUsed * 1400; // 单次分析平均约 1.4K tokens 的粗略估算
    const estimatedCost = totalUsed * 0.8; // 单次分析约 ¥0.8 的粗略估算
    return { totalCodes, totalUsed, totalQuota, estimatedTokens, estimatedCost };
  }, [rows]);

  async function handleGenerate() {
    setBusy(true);
    setMessage("");
    try {
      const res = await adminCreateCodes(pass, count, quota);
      if (!res.ok) {
        setMessage("生成失败：" + (res.reason || "未知错误"));
        return;
      }
      setMessage(`已生成 ${res.codes?.length ?? 0} 个激活码（每个 ${quota} 次）。`);
      const list = await adminListCodes(pass);
      if (list.ok) setRows(list.codes || []);
    } catch (e) {
      if (e instanceof AdminAuthError) {
        setMessage("口令已失效，请重新输入。");
        signOut();
      } else {
        setMessage(e instanceof Error ? e.message : "生成失败");
      }
    } finally {
      setBusy(false);
    }
  }

  // 未通过口令校验前，不渲染任何后台数据
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-4 py-10">
        <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-sm">
          <h1 className="text-lg font-bold text-slate-950">激活码管理后台</h1>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            请输入后台口令。口令由服务端校验，网页源码里不含管理凭证。
          </p>
          {!isAdminCloudConfigured ? (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
              当前站点构建时未配置云端密钥，后台无法连接云端。需要先用 NEXT_PUBLIC_CLOUD_PUBLISHABLE_KEY 重新构建。
            </p>
          ) : null}
          <input
            type="password"
            value={passInput}
            autoFocus
            onChange={(e) => setPassInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !checking) void enter(passInput);
            }}
            placeholder="后台口令"
            className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
          />
          {authError ? <p className="mt-2 text-xs text-rose-500">{authError}</p> : null}
          <button
            onClick={() => void enter(passInput)}
            disabled={checking}
            className="mt-5 w-full rounded-2xl bg-indigo-600 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {checking ? "校验中…" : "进入后台"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-950">激活码管理后台</h1>
          <button onClick={signOut} className="text-xs text-slate-400 hover:text-indigo-600">
            退出后台
          </button>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-950">AI 调用统计</h2>
          <p className="mt-1 text-xs text-slate-400">数据来自本站激活码用量，与你的个人 WorkBuddy 账户积分账单物理隔离。</p>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">累计分析次数</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{stats.totalUsed}</p>
              <p className="mt-1 text-xs text-slate-400">= 所有买家 AI 调用总数</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">估算消耗 tokens</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{stats.estimatedTokens.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-400">≈ 次数 × 1.4K（估算）</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">估算成本</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">¥{stats.estimatedCost.toFixed(0)}</p>
              <p className="mt-1 text-xs text-slate-400">≈ 次数 × ¥0.8（估算）</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">剩余可用次数</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{Math.max(0, stats.totalQuota - stats.totalUsed)}</p>
              <p className="mt-1 text-xs text-slate-400">总配额 {stats.totalQuota}</p>
            </div>
          </div>
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-2 text-xs leading-5 text-amber-700">
            说明：本站只能统计「调用次数」。WorkBuddy 官方积分账单（精确 tokens/金额）仍在其个人中心；上表 token 与成本为按平均值的粗略估算，仅供参考，不作为实收依据。
          </p>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-950">生成新激活码</h2>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <label className="text-sm text-slate-600">
              数量
              <input
                type="number"
                min={1}
                max={200}
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 block w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-slate-600">
              每个次数
              <input
                type="number"
                min={1}
                max={100000}
                value={quota}
                onChange={(e) => setQuota(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 block w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <button
              onClick={handleGenerate}
              disabled={busy}
              className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "生成中..." : "生成"}
            </button>
          </div>
          {message ? <p className="mt-3 text-sm text-indigo-600">{message}</p> : null}
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-950">全部激活码（{rows.length}）</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="py-2 pr-4">激活码</th>
                  <th className="py-2 pr-4">配额</th>
                  <th className="py-2 pr-4">已用</th>
                  <th className="py-2 pr-4">估算tokens</th>
                  <th className="py-2 pr-4">状态</th>
                  <th className="py-2">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.code} className="border-t border-slate-100">
                    <td className="py-2 pr-4 font-mono">{r.code}</td>
                    <td className="py-2 pr-4">{r.quota}</td>
                    <td className="py-2 pr-4">{r.used}</td>
                    <td className="py-2 pr-4 text-slate-400">{(r.used * 1400).toLocaleString()}</td>
                    <td className="py-2 pr-4">{r.active ? "启用" : "停用"}</td>
                    <td className="py-2 text-slate-400">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-950">使用记录（{logs.length}）</h2>
          <p className="mt-1 text-xs text-slate-400">
            每条记录 = 某激活码的一次 AI 调用：时间 · 用了哪个功能。仅记录动作与时间，不保存简历/JD 原文。
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="py-2 pr-4">时间</th>
                  <th className="py-2 pr-4">激活码</th>
                  <th className="py-2 pr-4">用了哪里</th>
                  <th className="py-2">备注</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      暂无记录。买家使用任意 AI 功能（简历诊断 / 岗位匹配 / 投递话术 / 一周计划）后会自动记录。
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 text-slate-500">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-4 font-mono">{l.code}</td>
                      <td className="py-2 pr-4">
                        {ACTION_LABELS[l.action] || l.action}
                      </td>
                      <td className="py-2 text-slate-400">{l.detail || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
