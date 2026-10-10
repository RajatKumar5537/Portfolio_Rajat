"use client";

import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { currentYearMonth, toMonthIndex, type AmountPeriod, type PfPeriod } from "@/lib/deductionSchedule";

function previousMonth(ym: string): string {
  const index = toMonthIndex(ym);
  if (index == null) return "";
  const prev = index - 1;
  const year = Math.floor(prev / 12);
  const month = (prev % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function closePrevious<T extends { from: string; to: string }>(rows: T[], nextFrom: string): T[] {
  if (!rows.length) return rows;
  const last = rows[rows.length - 1];
  const closeTo = previousMonth(nextFrom);
  const lastFrom = toMonthIndex(last.from);
  const closeIndex = toMonthIndex(closeTo);
  if (last.to || lastFrom == null || closeIndex == null || lastFrom > closeIndex) return rows;
  return rows.map((row, index) => (index === rows.length - 1 ? { ...row, to: closeTo } : row));
}

const fieldClass =
  "w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-xl py-2 px-2 text-base sm:text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition-all";

function Shell({
  title,
  badge,
  hint,
  children,
  onAdd,
}: {
  title: string;
  badge: string;
  hint: string;
  children: ReactNode;
  onAdd: () => void;
}) {
  return (
    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300">{title}</label>
        <span className="text-[9px] font-mono text-teal-700 dark:text-teal-400 font-bold">{badge}</span>
      </div>
      <p className="text-[8px] font-mono text-slate-500">{hint}</p>
      <div className="space-y-2">{children}</div>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
      >
        <Plus size={12} />
        Add a date range
      </button>
    </div>
  );
}

export function PfPeriodEditor({
  rows,
  onChange,
}: {
  rows: PfPeriod[];
  onChange: (rows: PfPeriod[]) => void;
}) {
  const update = (index: number, patch: Partial<PfPeriod>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <Shell
      title="Provident Fund rates"
      badge="You + company"
      hint="Add a row when the deduction changes. The previous row closes the month before, and older months keep the old amount."
      onAdd={() => {
        const from = currentYearMonth();
        const last = rows[rows.length - 1];
        onChange([...closePrevious(rows, from), { from, to: "", employee: last?.employee || 0, employer: last?.employer || 0 }]);
      }}
    >
      {rows.length === 0 && <p className="text-[10px] text-slate-500">No PF range yet.</p>}
      {rows.map((row, index) => (
        <div key={`${row.from}-${index}`} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_0.7fr_0.7fr_auto] gap-2 items-end">
          <label className="space-y-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-500">From</span>
            <input type="month" value={row.from} onChange={(e) => update(index, { from: e.target.value })} className={fieldClass} required />
          </label>
          <label className="space-y-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-500">To</span>
            <input type="month" value={row.to} onChange={(e) => update(index, { to: e.target.value })} className={fieldClass} />
          </label>
          <label className="space-y-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-500">You / mo</span>
            <input type="number" min="0" value={row.employee || ""} onChange={(e) => update(index, { employee: Number(e.target.value) || 0 })} className={fieldClass} />
          </label>
          <label className="space-y-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-500">Company / mo</span>
            <input type="number" min="0" value={row.employer || ""} onChange={(e) => update(index, { employer: Number(e.target.value) || 0 })} className={fieldClass} />
          </label>
          <button type="button" onClick={() => onChange(rows.filter((_, i) => i !== index))} className="p-2 rounded-xl text-slate-400 hover:text-red-400 cursor-pointer" title="Remove range">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </Shell>
  );
}

export function AmountPeriodEditor({
  title,
  badge,
  hint,
  rows,
  onChange,
}: {
  title: string;
  badge: string;
  hint: string;
  rows: AmountPeriod[];
  onChange: (rows: AmountPeriod[]) => void;
}) {
  const update = (index: number, patch: Partial<AmountPeriod>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <Shell
      title={title}
      badge={badge}
      hint={hint}
      onAdd={() => {
        const from = currentYearMonth();
        const last = rows[rows.length - 1];
        onChange([...closePrevious(rows, from), { from, to: "", amount: last?.amount || 0 }]);
      }}
    >
      {rows.length === 0 && <p className="text-[10px] text-slate-500">No range yet.</p>}
      {rows.map((row, index) => (
        <div key={`${row.from}-${index}`} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_0.8fr_auto] gap-2 items-end">
          <label className="space-y-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-500">From</span>
            <input type="month" value={row.from} onChange={(e) => update(index, { from: e.target.value })} className={fieldClass} required />
          </label>
          <label className="space-y-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-500">To</span>
            <input type="month" value={row.to} onChange={(e) => update(index, { to: e.target.value })} className={fieldClass} />
          </label>
          <label className="space-y-1">
            <span className="text-[8px] uppercase tracking-wider text-slate-500">₹ / month</span>
            <input type="number" min="0" value={row.amount || ""} onChange={(e) => update(index, { amount: Number(e.target.value) || 0 })} className={fieldClass} />
          </label>
          <button type="button" onClick={() => onChange(rows.filter((_, i) => i !== index))} className="p-2 rounded-xl text-slate-400 hover:text-red-400 cursor-pointer" title="Remove range">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </Shell>
  );
}
