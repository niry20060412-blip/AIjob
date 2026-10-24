"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navItems } from "@/lib/mockData";
import { useLicense } from "@/components/LicenseGate";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { info, reset, reopenGuide, isDemo } = useLicense();

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* 演示模式标识：明确告知访客当前不是真实 AI 调用，避免误解 */}
      {isDemo ? (
        <div className="pointer-events-none fixed right-3 top-3 z-40 rounded-full bg-indigo-600/95 px-3 py-1 text-[11px] font-medium text-white shadow-lg ring-1 ring-white/30 sm:right-5 sm:top-5">
          演示模式 · 本地规则分析
        </div>
      ) : null}
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
                data-tour={`nav-${item.href}`}
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

        <div className="absolute bottom-6 left-5 right-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">
            <p>{isDemo ? "演示模式：分析由本地规则生成，不调用云端 AI。" : "AI 由云端提供，用量按激活码限制。"}</p>
            {info ? (
              <p className="mt-1">
                当前激活码剩余{" "}
                <span className="font-semibold text-slate-700">{Math.max(0, info.quota - info.used)}</span> / {info.quota} 次
                <button onClick={reset} className="ml-2 text-indigo-600 hover:underline">
                  更换
                </button>
              </p>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="xl:pl-68">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-5 xl:hidden">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-950">AI 精准求职助手</div>
          </div>
          <div className="relative mt-2.5">
            <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
          {isDemo ? (
            <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs leading-5 text-indigo-700">
              演示模式：示例简历与岗位已预填，可直接点「开始分析」看效果；结果由本地规则生成，不调用云端模型。
            </div>
          ) : null}
          {children}
          <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-400">
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy" className="hover:text-indigo-600">隐私政策</Link>
              <Link href="/terms" className="hover:text-indigo-600">用户协议</Link>
              <button onClick={() => { if (pathname === "/") reopenGuide(); else router.push("/?tour=1"); }} className="hover:text-indigo-600">新手引导</button>
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
