export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: string }) {
  return (
    <div className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="mb-3 text-sm font-semibold text-indigo-600">{eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 md:text-base">{description}</p>
      </div>
      {action ? <button className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100">{action}</button> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "indigo" }: { children: React.ReactNode; tone?: "indigo" | "slate" | "green" | "amber" | "rose" }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700",
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-slate-100">
      <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${value}%` }} />
    </div>
  );
}
