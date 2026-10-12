"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <aside className="fixed left-0 top-0 hidden h-screen w-68 border-r border-slate-200 bg-white/90 px-5 py-6 backdrop-blur xl:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white shadow-lg shadow-indigo-200">
            AI
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">精准求职助手</p>
            <p className="text-xs text-slate-500">Job Decision OS</p>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-base shadow-sm">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 space-y-3">
          {user ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="truncate text-sm font-medium text-slate-700">{user.email ?? user.phone}</p>
              <div className="mt-3 flex items-center justify-between">
                <Link href="/membership" className="text-xs font-semibold text-indigo-600 hover:underline">
                  会员中心
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-600"
                >
                  退出
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="block rounded-3xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              {loading ? "加载中..." : "登录 / 注册"}
            </Link>
          )}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-xl shadow-indigo-100">
            <p className="text-sm font-semibold">升级会员</p>
            <p className="mt-2 text-xs leading-5 text-indigo-100">解锁更高 AI 额度与云端同步。</p>
            <Link
              href="/membership"
              className="mt-3 inline-block rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-indigo-700"
            >
              查看会员
            </Link>
          </div>
        </div>
      </aside>

      <div className="xl:pl-68">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur xl:hidden">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-950">AI 精准求职助手</div>
            {user ? (
              <button type="button" onClick={() => signOut()} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                退出
              </button>
            ) : (
              <Link href="/login" className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700">
                登录
              </Link>
            )}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          {children}
          <footer className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-400">
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy" className="hover:text-indigo-600">隐私政策</Link>
              <Link href="/terms" className="hover:text-indigo-600">用户协议</Link>
              <Link href="/membership" className="hover:text-indigo-600">会员中心</Link>
            </div>
            <p className="mt-3 leading-5">
              AI 生成内容由人工智能模型产生，仅供参考，不构成求职、招聘或法律建议。请结合实际核验后使用，并对简历真实性与投递行为负责。
            </p>
            <p className="mt-2">© 2026 AI 精准求职投递助手</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
