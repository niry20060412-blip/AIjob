"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, type PendingOtp } from "@/lib/auth";

type Mode = "otp" | "password";

export default function LoginPage() {
  const router = useRouter();
  const { sendEmailCode, verifyEmailCode, signInWithPassword } = useAuth();

  const [mode, setMode] = useState<Mode>("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<PendingOtp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validateEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("请输入有效的邮箱地址");
      return false;
    }
    return true;
  }

  async function handleSendCode() {
    setError("");
    if (!validateEmail()) return;
    setLoading(true);
    const res = await sendEmailCode(email);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setPending(res.challenge);
  }

  async function handleVerify() {
    if (!pending) return;
    setError("");
    if (code.trim().length < 4) {
      setError("请输入收到的验证码");
      return;
    }
    if (!pending.isExistingUser && password.trim().length < 6) {
      setError("新账号请设置至少 6 位密码");
      return;
    }
    setLoading(true);
    const res = await verifyEmailCode({
      ...pending,
      token: code.trim(),
      password: pending.isExistingUser ? undefined : password,
    });
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/membership");
  }

  async function handlePasswordLogin() {
    setError("");
    if (!validateEmail()) return;
    if (password.trim().length < 6) {
      setError("请输入密码");
      return;
    }
    setLoading(true);
    const res = await signInWithPassword(email.trim(), password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/membership");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-indigo-100">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white">
            AI
          </div>
          <div>
            <p className="text-base font-semibold text-slate-950">精准求职助手</p>
            <p className="text-xs text-slate-500">登录以同步数据并解锁会员额度</p>
          </div>
        </div>

        <div className="mb-6 flex rounded-2xl bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("otp");
              setError("");
            }}
            className={`flex-1 rounded-xl py-2 transition ${mode === "otp" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}
          >
            验证码登录
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setError("");
            }}
            className={`flex-1 rounded-xl py-2 transition ${mode === "password" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}
          >
            密码登录
          </button>
        </div>

        <label className="mb-2 block text-sm font-medium text-slate-700">邮箱</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mb-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />

        {mode === "password" ? (
          <>
            <label className="mb-2 block text-sm font-medium text-slate-700">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="mb-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={handlePasswordLogin}
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </>
        ) : (
          <>
            {!pending ? (
              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loading ? "发送中..." : "获取验证码"}
              </button>
            ) : (
              <>
                <p className="mb-3 rounded-2xl bg-indigo-50 px-4 py-3 text-xs leading-5 text-indigo-700">
                  {pending.isExistingUser
                    ? "已向该邮箱发送登录验证码，请输入完成登录。"
                    : "该邮箱尚未注册，验证码验证后将自动创建账号，请同时设置登录密码。"}
                </p>
                <label className="mb-2 block text-sm font-medium text-slate-700">验证码</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="请输入验证码"
                  className="mb-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                {!pending.isExistingUser && (
                  <>
                    <label className="mb-2 block text-sm font-medium text-slate-700">设置密码</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="至少 6 位"
                      className="mb-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </>
                )}
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {loading ? "验证中..." : pending.isExistingUser ? "登录" : "注册并登录"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPending(null);
                    setCode("");
                    setError("");
                  }}
                  className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-600"
                >
                  重新输入邮箱
                </button>
              </>
            )}
          </>
        )}

        {error && (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        )}

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          登录即代表同意 <Link href="/terms" className="text-indigo-600 hover:underline">用户协议</Link> 与{" "}
          <Link href="/privacy" className="text-indigo-600 hover:underline">隐私政策</Link>。
        </p>
        <p className="mt-3 text-center text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600">返回首页</Link>
        </p>
      </div>
    </div>
  );
}
