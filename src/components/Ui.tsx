export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: string }) {
  return (
    <div className="mb-5 flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:mb-8 sm:gap-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-indigo-600 sm:mb-3 sm:text-sm">{eyebrow}</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:mt-3 md:text-base">{description}</p>
      </div>
      {action ? <button className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-100 sm:py-3">{action}</button> : null}
    </div>
  );
}

export function Card({ children, className = "", ...rest }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) {
  return <section className={`rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 ${className}`} {...rest}>{children}</section>;
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
