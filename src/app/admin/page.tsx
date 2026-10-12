"use client";

import { useEffect, useState } from "react";
import { adminCreateCodes, adminListCodes } from "@/lib/licenseClient";

interface CodeRow {
  code: string;
  quota: number;
  used: number;
  active: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<CodeRow[]>([]);
  const [count, setCount] = useState(10);
  const [quota, setQuota] = useState(100);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = window.localStorage.getItem("aja_admin_token");
    if (saved) setToken(saved);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function doList(t: string) {
    setBusy(true);
    setMessage("");
    try {
      const res = await adminListCodes(t);
      if (!res.ok) {
        setMessage("口令错误或无权限。");
        setAuthed(false);
        return;
      }
      setAuthed(true);
      setRows(res.codes || []);
      window.localStorage.setItem("aja_admin_token", t);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "加载失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin() {
    await doList(token.trim());
  }

  async function handleGenerate() {
    setBusy(true);
    setMessage("");
    try {
      const res = await adminCreateCodes(token.trim(), count, quota);
      if (!res.ok) {
        setMessage("生成失败：" + (res.reason || "未知错误"));
        return;
      }
      setMessage(`已生成 ${res.codes?.length ?? 0} 个激活码（每个 ${quota} 次）。`);
      await doList(token.trim());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl">
          <h1 className="text-lg font-bold text-slate-950">卖家后台 · 激活码管理</h1>
          <p className="mt-1 text-xs text-slate-500">输入管理口令以生成和查看激活码。</p>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
            placeholder="管理口令"
            className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-indigo-100"
          />
          <button
            onClick={handleLogin}
            disabled={busy}
            className="mt-4 w-full rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "校验中..." : "进入后台"}
          </button>
          {message ? <p className="mt-3 text-sm text-rose-600">{message}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-950">激活码管理后台</h1>
          <button
            onClick={() => {
              setAuthed(false);
              setRows([]);
            }}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            退出
          </button>
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
                    <td className="py-2 pr-4">{r.active ? "启用" : "停用"}</td>
                    <td className="py-2 text-slate-400">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
