"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/mockData";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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

        <div className="absolute bottom-6 left-5 right-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">
            数据保存在本机浏览器，不会上传服务器。开启真实 AI 分析的方法见项目说明文档。
          </div>
        </div>
      </aside>

      <div className="xl:pl-68">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur xl:hidden">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-950">AI 精准求职助手</div>
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
