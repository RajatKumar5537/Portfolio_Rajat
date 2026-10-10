export type AmountPeriod = {
  from: string;
  to: string;
  amount: number;
};

export type PfPeriod = {
  from: string;
  to: string;
  employee: number;
  employer: number;
};

export type WealthSettings = {
  enabled: boolean;
  employeeContribution: number;
  employerContribution: number;
  healthInsuranceDeduction: number;
  initialCorpus: number;
  startMonth: string;
  pfPeriods: PfPeriod[];
  healthPeriods: AmountPeriod[];
  termPeriods: AmountPeriod[];
};

export type Accumulation = {
  total: number;
  months: number;
  current: number;
  currentEmployee: number;
  currentEmployer: number;
};

const emptyAccumulation = (): Accumulation => ({
  total: 0,
  months: 0,
  current: 0,
  currentEmployee: 0,
  currentEmployer: 0,
});

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function toMonthIndex(ym: string): number | null {
  const [year, month] = String(ym || "").split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) return null;
  return year * 12 + (month - 1);
}

function sortByFrom<T extends { from: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (toMonthIndex(a.from) || 0) - (toMonthIndex(b.from) || 0));
}

function sanitizeAmount(rows: unknown): AmountPeriod[] {
  if (!Array.isArray(rows)) return [];
  return sortByFrom(
    rows
      .map((row) => ({
        from: String(row?.from || ""),
        to: String(row?.to || ""),
        amount: num(row?.amount),
      }))
      .filter((row) => toMonthIndex(row.from) != null)
  );
}

function sanitizePf(rows: unknown): PfPeriod[] {
  if (!Array.isArray(rows)) return [];
  return sortByFrom(
    rows
      .map((row) => ({
        from: String(row?.from || ""),
        to: String(row?.to || ""),
        employee: num(row?.employee),
        employer: num(row?.employer),
      }))
      .filter((row) => toMonthIndex(row.from) != null)
  );
}

function positiveOrMissing(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function normalizeWealthSettings(
  raw: any,
  isRajat = false,
  options?: { keepEmptyPeriods?: boolean }
): WealthSettings {
  const enabled = Boolean(raw?.enabled ?? isRajat);
  const employee = positiveOrMissing(raw?.employeeContribution, isRajat ? 1800 : 0);
  const employer = positiveOrMissing(raw?.employerContribution, isRajat ? 1800 : 0);
  const health = positiveOrMissing(raw?.healthInsuranceDeduction, isRajat ? 505 : 0);
  const startMonth = raw?.startMonth || "2024-10";
  const keepEmpty = Boolean(options?.keepEmptyPeriods);

  const cleanedPf = sanitizePf(raw?.pfPeriods);
  const cleanedHealth = sanitizeAmount(raw?.healthPeriods);
  const termPeriods = sanitizeAmount(raw?.termPeriods);

  // An empty array from an older document (or a mongoose default) still means
  // "use the flat monthly rate". Only a save that cleared the rows should stay empty.
  const pfPeriods =
    cleanedPf.length > 0
      ? cleanedPf
      : keepEmpty && Array.isArray(raw?.pfPeriods)
        ? []
        : employee || employer
          ? [{ from: startMonth, to: "", employee, employer }]
          : [];

  const healthPeriods =
    cleanedHealth.length > 0
      ? cleanedHealth
      : keepEmpty && Array.isArray(raw?.healthPeriods)
        ? []
        : health > 0
          ? [{ from: startMonth, to: "", amount: health }]
          : [];

  const lastPf = pfPeriods[pfPeriods.length - 1];
  const lastHealth = healthPeriods[healthPeriods.length - 1];

  return {
    enabled,
    employeeContribution: lastPf?.employee ?? (keepEmpty ? 0 : employee),
    employerContribution: lastPf?.employer ?? (keepEmpty ? 0 : employer),
    healthInsuranceDeduction: lastHealth?.amount ?? (keepEmpty ? 0 : health),
    initialCorpus: num(raw?.initialCorpus),
    startMonth: pfPeriods[0]?.from || healthPeriods[0]?.from || startMonth,
    pfPeriods,
    healthPeriods,
    termPeriods,
  };
}

function rateAt<T extends { from: string; to: string }>(rows: T[], index: number): T | null {
  const matches = rows.filter((row) => {
    const from = toMonthIndex(row.from);
    const to = row.to ? toMonthIndex(row.to) : null;
    return from != null && from <= index && (to == null || to >= index);
  });
  if (!matches.length) return null;
  return matches.sort((a, b) => (toMonthIndex(b.from) || 0) - (toMonthIndex(a.from) || 0))[0];
}

export function accumulateAmounts(
  periods: AmountPeriod[],
  endYear: number,
  endMonthIndex: number
): Accumulation {
  const rows = sanitizeAmount(periods);
  if (!rows.length) return emptyAccumulation();
  const start = Math.min(...rows.map((row) => toMonthIndex(row.from) as number));
  const end = endYear * 12 + endMonthIndex;
  if (end < start) return emptyAccumulation();

  let total = 0;
  let months = 0;
  let current = 0;
  for (let index = start; index <= end; index += 1) {
    const amount = rateAt(rows, index)?.amount || 0;
    total += amount;
    if (amount > 0) months += 1;
    if (index === end) current = amount;
  }
  return { total, months, current, currentEmployee: 0, currentEmployer: 0 };
}

export function accumulatePf(
  periods: PfPeriod[],
  endYear: number,
  endMonthIndex: number
): Accumulation {
  const rows = sanitizePf(periods);
  if (!rows.length) return emptyAccumulation();
  const start = Math.min(...rows.map((row) => toMonthIndex(row.from) as number));
  const end = endYear * 12 + endMonthIndex;
  if (end < start) return emptyAccumulation();

  let total = 0;
  let months = 0;
  let current = 0;
  let currentEmployee = 0;
  let currentEmployer = 0;
  for (let index = start; index <= end; index += 1) {
    const rate = rateAt(rows, index);
    const employee = rate?.employee || 0;
    const employer = rate?.employer || 0;
    const amount = employee + employer;
    total += amount;
    if (amount > 0) months += 1;
    if (index === end) {
      current = amount;
      currentEmployee = employee;
      currentEmployer = employer;
    }
  }
  return { total, months, current, currentEmployee, currentEmployer };
}

export function resolveViewEnd(input: {
  selectedMonth: number;
  selectedYear: number;
  endDate?: string | null;
  selectedDate?: string | null;
  useRange?: boolean;
}): { year: number; monthIndex: number } {
  const now = new Date();
  let year = now.getFullYear();
  let monthIndex = now.getMonth();

  if (input.selectedDate) {
    const parts = input.selectedDate.split("-").map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      year = parts[0];
      monthIndex = parts[1] - 1;
    }
  } else if (input.useRange && input.endDate) {
    const parts = input.endDate.split("-").map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      year = parts[0];
      monthIndex = parts[1] - 1;
    }
  } else {
    if (input.selectedYear !== -1) year = input.selectedYear;
    if (input.selectedMonth !== -1) monthIndex = input.selectedMonth;
    else if (input.selectedYear !== -1 && input.selectedYear < now.getFullYear()) monthIndex = 11;
  }

  return { year, monthIndex };
}

export function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatYearMonth(ym: string): string {
  const index = toMonthIndex(ym);
  if (index == null) return ym ? ym : "Ongoing";
  const year = Math.floor(index / 12);
  const month = index % 12;
  return `${MONTH_NAMES[month]} ${year}`;
}

export function indexToYearMonth(index: number): string {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

export type ScheduleSlice = {
  from: string;
  to: string;
  months: number;
  monthly: number;
  employee: number;
  employer: number;
  total: number;
};

function explainRows<T extends { from: string; to: string }>(
  rows: T[],
  fromYm: string,
  toYm: string,
  pick: (row: T | null) => { employee: number; employer: number; monthly: number }
): ScheduleSlice[] {
  if (!rows.length) return [];
  const scheduleStart = Math.min(
    ...rows.map((row) => toMonthIndex(row.from) ?? Number.POSITIVE_INFINITY)
  );
  if (!Number.isFinite(scheduleStart)) return [];
  const requestedStart = toMonthIndex(fromYm) ?? scheduleStart;
  const requestedEnd = toMonthIndex(toYm);
  if (requestedEnd == null || requestedEnd < Math.max(scheduleStart, requestedStart)) return [];

  const slices: ScheduleSlice[] = [];
  for (let index = Math.max(scheduleStart, requestedStart); index <= requestedEnd; index += 1) {
    const picked = pick(rateAt(rows, index));
    if (picked.monthly <= 0) continue;
    const ym = indexToYearMonth(index);
    const prev = slices[slices.length - 1];
    const continues =
      prev &&
      prev.employee === picked.employee &&
      prev.employer === picked.employer &&
      prev.monthly === picked.monthly &&
      toMonthIndex(prev.to) === index - 1;
    if (continues && prev) {
      prev.to = ym;
      prev.months += 1;
      prev.total += picked.monthly;
    } else {
      slices.push({
        from: ym,
        to: ym,
        months: 1,
        monthly: picked.monthly,
        employee: picked.employee,
        employer: picked.employer,
        total: picked.monthly,
      });
    }
  }
  return slices;
}

export function explainPf(periods: PfPeriod[], fromYm: string, toYm: string): ScheduleSlice[] {
  return explainRows(sanitizePf(periods), fromYm, toYm, (row) => {
    const employee = row && "employee" in row ? row.employee || 0 : 0;
    const employer = row && "employer" in row ? row.employer || 0 : 0;
    return { employee, employer, monthly: employee + employer };
  });
}

export function explainAmounts(periods: AmountPeriod[], fromYm: string, toYm: string): ScheduleSlice[] {
  return explainRows(sanitizeAmount(periods), fromYm, toYm, (row) => {
    const monthly = row && "amount" in row ? row.amount || 0 : 0;
    return { employee: 0, employer: 0, monthly };
  });
}
