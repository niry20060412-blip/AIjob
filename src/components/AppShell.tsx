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
        <div className="absolute bottom-6 left-5 right-5 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-xl shadow-indigo-100">
          <p className="text-sm font-semibold">第一阶段原型</p>
          <p className="mt-2 text-xs leading-5 text-indigo-100">静态页面、mock 数据、无后端，方便后续接入 AI 能力。</p>
        </div>
      </aside>
      <div className="xl:pl-68">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur xl:hidden">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-950">AI 精准求职助手</div>
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700">Prototype</div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
