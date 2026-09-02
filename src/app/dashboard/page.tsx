"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navigation from "@/components/Navigation";
import { BookOpen, CreditCard, Apple, ArrowUpRight, TrendingUp, Sparkles, Flame, PlusCircle, Loader2, Wallet, FileUp, ChevronLeft, ChevronRight, Plus, TrendingDown, Calendar, Heart } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const isRajat = session?.user?.email?.toLowerCase() === "kumarrajatpradhan5537@gmail.com";

  const [data, setData] = useState({
    expenses: [] as any[],
    studyLogs: [] as any[],
    foodLogs: [] as any[],
    wellnessLogs: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch all user records from the optimized consolidated API endpoint
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const result = await res.json();
          setData({
            expenses: Array.isArray(result.expenses) ? result.expenses : [],
            studyLogs: Array.isArray(result.studyLogs) ? result.studyLogs : [],
            foodLogs: Array.isArray(result.foodLogs) ? result.foodLogs : [],
            wellnessLogs: Array.isArray(result.wellnessLogs) ? result.wellnessLogs : [],
          });
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Generate dynamic list of years based on recorded transaction history
  const availableYears = Array.from(
    new Set([
      new Date().getFullYear(),
      ...data.expenses.map((e) => new Date(e.date).getFullYear())
    ])
  ).sort((a, b) => b - a);

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === -1) {
      setSelectedMonth(11);
      return;
    }
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear === -1 ? new Date().getFullYear() - 1 : selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === -1) {
      setSelectedMonth(0);
      return;
    }
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear === -1 ? new Date().getFullYear() + 1 : selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getContextLabel = () => {
    if (selectedDate) {
      return new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    if (selectedMonth === -1 && selectedYear === -1) return "Lifetime";
    if (selectedMonth === -1) return `${selectedYear} (Year)`;
    if (selectedYear === -1) return `${months[selectedMonth]} (All Years)`;
    return `${months[selectedMonth].slice(0, 3)} '${String(selectedYear).slice(-2)}`;
  };

  // Filter transactions by selected Month, Year or Specific Date
  const filteredTransactions = data.expenses.filter((exp) => {
    const expDate = new Date(exp.date);
    if (selectedDate) {
      return expDate.toDateString() === new Date(selectedDate).toDateString();
    }
    const monthMatches = selectedMonth === -1 || expDate.getMonth() === selectedMonth;
    const yearMatches = selectedYear === -1 || expDate.getFullYear() === selectedYear;
    return monthMatches && yearMatches;
  });

  // Filter study logs by selected Month, Year or Specific Date
  const filteredStudyLogs = data.studyLogs.filter((log) => {
    const logDate = new Date(log.date);
    if (selectedDate) {
      return logDate.toDateString() === new Date(selectedDate).toDateString();
    }
    const monthMatches = selectedMonth === -1 || logDate.getMonth() === selectedMonth;
    const yearMatches = selectedYear === -1 || logDate.getFullYear() === selectedYear;
    return monthMatches && yearMatches;
  });

  // Filter food logs by selected Month, Year or Specific Date
  const filteredFoodLogs = data.foodLogs.filter((log) => {
    const logDate = new Date(log.date);
    if (selectedDate) {
      return logDate.toDateString() === new Date(selectedDate).toDateString();
    }
    const monthMatches = selectedMonth === -1 || logDate.getMonth() === selectedMonth;
    const yearMatches = selectedYear === -1 || logDate.getFullYear() === selectedYear;
    return monthMatches && yearMatches;
  });

  // Filter wellness logs by selected Month, Year or Specific Date
  const filteredWellnessLogs = data.wellnessLogs.filter((log) => {
    const logDate = new Date(log.date);
    if (selectedDate) {
      return logDate.toDateString() === new Date(selectedDate).toDateString();
    }
    const monthMatches = selectedMonth === -1 || logDate.getMonth() === selectedMonth;
    const yearMatches = selectedYear === -1 || logDate.getFullYear() === selectedYear;
    return monthMatches && yearMatches;
  });

  // Calculations
  const filteredExercises = filteredWellnessLogs.filter(log => log.type === "exercise");
  const filteredSleep = filteredWellnessLogs.filter(log => log.type === "sleep");
  const totalWorkoutMinutes = filteredExercises.reduce((acc, curr) => acc + (curr.exercise?.durationMinutes || 0), 0);
  const totalWorkoutHours = (totalWorkoutMinutes / 60).toFixed(1);
  const avgSleep = filteredSleep.length > 0
    ? filteredSleep.reduce((acc, curr) => acc + (curr.sleep?.sleepHours || 0), 0) / filteredSleep.length
    : 0;
  const totalExpenses = filteredTransactions.filter(e => e.type === "Expense").reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = filteredTransactions.filter(e => e.type === "Income").reduce((acc, curr) => acc + curr.amount, 0);
  const netSavings = totalIncome - totalExpenses;

  const homeExpenses = filteredTransactions.filter(e => e.category === "Home" && e.type === "Expense").reduce((acc, curr) => acc + curr.amount, 0);
  const ajitExpenses = filteredTransactions.filter(e => e.category === "Ajit" && e.type === "Expense").reduce((acc, curr) => acc + curr.amount, 0);
  const swarnaExpenses = filteredTransactions.filter(e => e.category === "Swarna" && e.type === "Expense").reduce((acc, curr) => acc + curr.amount, 0);

  const topExpenseCategories = Array.from(
    new Set(filteredTransactions.filter(e => e.type === "Expense").map(e => e.category).filter(Boolean))
  ).map(cat => ({
    name: cat,
    total: filteredTransactions.filter(e => e.category === cat && e.type === "Expense").reduce((a, c) => a + c.amount, 0)
  })).sort((a, b) => b.total - a.total).slice(0, 3);

  const totalStudyMinutes = filteredStudyLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  // Macronutrient Calculations (dynamic depending on selected dates/months view)
  const proteinGoal = 120; // Default protein target (120g)
  const caloriesGoal = 2200; // Default calories target (2200 kcal)
  const carbsGoal = 250; // Default carbs target (250g)
  const fatsGoal = 70; // Default fats target (70g)

  const todayStr = new Date().toDateString();
  const todayFood = data.foodLogs.filter(f => new Date(f.date).toDateString() === todayStr);
  const todayProtein = todayFood.reduce((acc, curr) => acc + curr.calculatedProtein, 0);
  const todayProteinPercent = Math.min(100, Math.round((todayProtein / proteinGoal) * 100));

  const todayCalories = todayFood.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const todayCarbs = todayFood.reduce((acc, curr) => acc + (curr.carbs || 0), 0);
  const todayFats = todayFood.reduce((acc, curr) => acc + (curr.fats || 0), 0);

  const isCurrentMonthYear = !selectedDate && (selectedMonth === -1 || selectedMonth === new Date().getMonth()) && 
                             (selectedYear === -1 || selectedYear === new Date().getFullYear());

  const uniqueDays = new Set(filteredFoodLogs.map(l => new Date(l.date).toDateString())).size;
  const totalFilteredProtein = filteredFoodLogs.reduce((acc, curr) => acc + curr.calculatedProtein, 0);
  const avgDailyProtein = uniqueDays > 0 ? totalFilteredProtein / uniqueDays : 0;
  const avgProteinPercent = Math.min(100, Math.round((avgDailyProtein / proteinGoal) * 100));

  const totalFilteredCalories = filteredFoodLogs.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const avgDailyCalories = uniqueDays > 0 ? totalFilteredCalories / uniqueDays : 0;

  const totalFilteredCarbs = filteredFoodLogs.reduce((acc, curr) => acc + (curr.carbs || 0), 0);
  const avgDailyCarbs = uniqueDays > 0 ? totalFilteredCarbs / uniqueDays : 0;

  const totalFilteredFats = filteredFoodLogs.reduce((acc, curr) => acc + (curr.fats || 0), 0);
  const avgDailyFats = uniqueDays > 0 ? totalFilteredFats / uniqueDays : 0;

  // Determine display values based on single-day vs monthly filtering
  const isSingleDay = !!selectedDate;
  const displayProtein = isSingleDay ? totalFilteredProtein : (isCurrentMonthYear ? todayProtein : avgDailyProtein);
  const displayProteinPercent = isSingleDay 
    ? Math.min(100, Math.round((totalFilteredProtein / proteinGoal) * 100))
    : (isCurrentMonthYear ? todayProteinPercent : avgProteinPercent);

  const displayCalories = isSingleDay ? totalFilteredCalories : (isCurrentMonthYear ? todayCalories : avgDailyCalories);
  const displayCaloriesPercent = Math.min(100, Math.round((displayCalories / caloriesGoal) * 100));

  const displayCarbs = isSingleDay ? totalFilteredCarbs : (isCurrentMonthYear ? todayCarbs : avgDailyCarbs);
  const displayCarbsPercent = Math.min(100, Math.round((displayCarbs / carbsGoal) * 100));

  const displayFats = isSingleDay ? totalFilteredFats : (isCurrentMonthYear ? todayFats : avgDailyFats);
  const displayFatsPercent = Math.min(100, Math.round((displayFats / fatsGoal) * 100));

  const displayProteinLabel = isSingleDay 
    ? `Macros logged on ${new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : (isCurrentMonthYear ? "Today's Macro Intake" : `Avg Daily Macros (${getContextLabel()})`);

  // Study Streak Calculation (remains dynamic for current overall active days)
  const calculateStreak = (): number => {
    if (data.studyLogs.length === 0) return 0;
    
    const completedDates = new Set(
      data.studyLogs
        .filter((t) => t.completed)
        .map((t) => new Date(t.date).toDateString())
    );

    if (completedDates.size === 0) return 0;

    let streak = 0;
    const checkDate = new Date();
    let currentKey = checkDate.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toDateString();

    if (!completedDates.has(currentKey)) {
      if (completedDates.has(yesterdayKey)) {
        checkDate.setDate(checkDate.getDate() - 1);
        currentKey = yesterdayKey;
      } else {
        return 0; // Streak broken
      }
    }

    while (completedDates.has(currentKey)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      currentKey = checkDate.toDateString();
    }

    return streak;
  };

  const currentStreak = calculateStreak();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030308] flex flex-col justify-between">
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={24} className="text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Loading Stats Hub...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030308] flex flex-col justify-between">
      <div className="cyber-grid"></div>

      <div className="relative z-10 flex flex-col flex-grow">
        <Navigation />

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          {/* Header & Month Selector */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="page-heading text-xl font-black uppercase tracking-widest text-slate-900 dark:text-slate-200">Command Center</h2>
              <p className="page-subheading text-xs text-slate-500 uppercase tracking-wider mt-0.5">Aggregate status reports across system scopes</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              {/* Premium Month/Year/Date selection bar */}
              <div className="filter-bar flex flex-wrap items-center gap-2 sm:gap-3 bg-white dark:bg-[#0c0c16]/60 shadow-lg dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-slate-200 dark:border-white/10 p-2 rounded-xl hover:border-slate-300 dark:hover:border-white/15 transition-all">
                <button
                  onClick={handlePrevMonth}
                  disabled={!!selectedDate}
                  className="bar-btn p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} />
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {!selectedDate ? (
                    <>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="bg-transparent text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer py-1 px-2 font-sans"
                      >
                        <option value={-1} className="bg-white dark:bg-[#0c0c16] text-indigo-600 dark:text-indigo-400 font-bold">ALL MONTHS</option>
                        {months.map((m, idx) => (
                          <option key={m} value={idx} className="bg-white dark:bg-[#0c0c16] text-slate-800 dark:text-slate-300">{m.toUpperCase()}</option>
                        ))}
                      </select>

                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-transparent text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer py-1 px-2 font-sans"
                      >
                        <option value={-1} className="bg-white dark:bg-[#0c0c16] text-indigo-600 dark:text-indigo-400 font-bold">ALL YEARS</option>
                        {availableYears.map((year) => (
                          <option key={year} value={year} className="bg-white dark:bg-[#0c0c16] text-slate-800 dark:text-slate-300">{year}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2 py-1">
                      {new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}

                  <div className="flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-2">
                    <div className="date-pill flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/5 hover:bg-indigo-100 dark:hover:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-1 rounded-xl text-indigo-600 dark:text-indigo-400 transition-all">
                      <Calendar size={13} className="text-indigo-600/80 dark:text-indigo-400/80 flex-shrink-0" />
                      <input
                        type="date"
                        value={selectedDate || ""}
                        onChange={(e) => setSelectedDate(e.target.value || null)}
                        className="bg-transparent border-none outline-none text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer font-mono w-[110px] min-h-[1.5rem] py-0.5"
                      />
                    </div>
                    {selectedDate && (
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="text-[10px] text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-black uppercase tracking-widest cursor-pointer ml-1"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleNextMonth}
                  disabled={!!selectedDate}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 bg-indigo-950/20 border border-indigo-500/10 px-4 py-2 rounded-xl text-xs text-indigo-400 font-bold uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Auto-Sync</span>
              </div>
            </div>
          </div>

          {/* ── Mini Stat Strip (Only global totals, no category spend cards, no tooltips) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { key: "income", label: "Income", value: `₹${totalIncome.toLocaleString()}`, color: "text-emerald-400 light:text-emerald-600" },
              { key: "outflow", label: "Outflow", value: `₹${totalExpenses.toLocaleString()}`, color: "text-red-400 light:text-red-600" },
              { key: "savings", label: "Savings / Net", value: `₹${netSavings.toLocaleString()}`, color: netSavings >= 0 ? "text-purple-400 light:text-purple-600" : "text-red-400 light:text-red-600" },
            ].map(card => (
              <div key={card.key} className="mini-3d-card rounded-xl px-4 py-3 cursor-default transition-all hover:scale-[1.02]">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-mono font-bold">
                  {card.label}
                </p>
                <p className={`text-base font-black font-mono mt-1 ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>


          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Study Card */}
            <div className="glass-card card-glow-indigo p-6 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <BookOpen size={20} />
                  </div>
                  {currentStreak > 0 && (
                    <div className="flex items-center gap-1 bg-orange-950/40 border border-orange-500/25 px-2.5 py-1 rounded-full text-[10px] text-orange-400 font-bold font-mono uppercase">
                      <Flame size={12} />
                      <span>{currentStreak} DAY STREAK</span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="text-2xl font-black font-mono text-slate-100">{totalStudyHours} Hrs</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mt-1">Study Logs Resolved ({getContextLabel()})</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                  {filteredStudyLogs.length > 0 ? `Latest: ${filteredStudyLogs[0].topic}` : "No study logged yet"}
                </span>
                <Link
                  href="/learning"
                  className="text-xs font-bold text-slate-300 hover:text-indigo-400 flex items-center gap-1 transition-all"
                >
                  <span>Open Tracker</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* Expenses Card */}
            <div className="glass-card card-glow-purple p-6 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <CreditCard size={20} />
                  </div>
                  <div className="flex items-center gap-1 bg-purple-950/40 border border-purple-500/20 px-2.5 py-1 rounded-full text-[10px] text-purple-400 font-bold uppercase">
                    <Wallet size={12} />
                    <span>SAVINGS / NET</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-2xl font-black font-mono text-slate-100">₹{netSavings.toLocaleString()}</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-purple-400 mt-1">Net Balance ({getContextLabel()})</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center">
                <div className="flex gap-2 text-[9px] text-slate-500 font-mono">
                  {isRajat ? (
                    <>
                      <span>H: ₹{homeExpenses}</span>
                      <span>A: ₹{ajitExpenses}</span>
                      <span>S: ₹{swarnaExpenses}</span>
                    </>
                  ) : topExpenseCategories.length > 0 ? (
                    topExpenseCategories.map((c) => (
                      <span key={c.name}>{c.name.slice(0, 1).toUpperCase()}: ₹{c.total}</span>
                    ))
                  ) : (
                    <span>No expense records</span>
                  )}
                </div>
                <Link
                  href="/expenses"
                  className="text-xs font-bold text-slate-300 hover:text-purple-400 flex items-center gap-1 transition-all"
                >
                  <span>Ledger Log</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* Macro Summary Card */}
            <div className="glass-card card-glow-teal p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Apple size={20} />
                  </div>
                  <span className="text-[10px] bg-teal-950/40 border border-teal-500/20 px-2.5 py-1 rounded-full text-teal-400 font-bold font-mono">
                    MACROS SUMMARY
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-teal-400">{displayProteinLabel}</p>
                </div>
              </div>

              {/* Progress bars for Macros */}
              <div className="space-y-3 mt-4">
                {/* Calories */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold font-mono">
                    <span className="text-slate-400">Calories</span>
                    <span className="text-orange-400">{displayCalories.toFixed(0)} / {caloriesGoal} kcal</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full transition-all duration-300" style={{ width: `${displayCaloriesPercent}%` }}></div>
                  </div>
                </div>

                {/* Protein */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold font-mono">
                    <span className="text-slate-400">Protein</span>
                    <span className="text-teal-400">{displayProtein.toFixed(1)}g / {proteinGoal}g</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full transition-all duration-300" style={{ width: `${displayProteinPercent}%` }}></div>
                  </div>
                </div>

                {/* Carbs */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold font-mono">
                    <span className="text-slate-400">Carbs</span>
                    <span className="text-indigo-400">{displayCarbs.toFixed(1)}g / {carbsGoal}g</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${displayCarbsPercent}%` }}></div>
                  </div>
                </div>

                {/* Fats */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold font-mono">
                    <span className="text-slate-400">Fats</span>
                    <span className="text-purple-400">{displayFats.toFixed(1)}g / {fatsGoal}g</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${displayFatsPercent}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3 mt-4 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  {todayFood.length} meals logged today
                </span>
                <Link
                  href="/food"
                  className="text-xs font-bold text-slate-300 hover:text-teal-400 flex items-center gap-1 transition-all"
                >
                  <span>Log Nutrition</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* Wellness Card */}
            <div className="glass-card card-glow-indigo p-6 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Heart size={20} />
                  </div>
                  <span className="text-[10px] bg-indigo-950/40 border border-indigo-500/20 px-2.5 py-1 rounded-full text-indigo-400 font-bold font-mono">
                    WELLNESS
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-2xl font-black font-mono text-slate-100">
                    {totalWorkoutHours} hrs <span className="text-sm font-medium text-slate-500">/ {avgSleep.toFixed(1)}h sleep</span>
                  </h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mt-1">
                    Exercise & Sleep Summary ({getContextLabel()})
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                  {filteredExercises.length} sessions • {filteredSleep.length} sleep logs
                </span>
                <Link
                  href="/wellness"
                  className="text-xs font-bold text-slate-300 hover:text-indigo-400 flex items-center gap-1 transition-all"
                >
                  <span>Wellness Log</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

          </div>

          {/* Quick Shortcuts Section */}
          <div className="mt-12 glass-card p-8 rounded-2xl border border-white/5">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-200 mb-6">Quick Actions Console</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Link
                href="/learning"
                className="mini-3d-card flex items-center justify-between p-4 rounded-xl cursor-pointer text-slate-300 light:text-slate-700 hover:text-indigo-400 light:hover:text-indigo-600 transition-all"
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Start Study Timer</span>
                </div>
                <PlusCircle size={16} />
              </Link>
              <Link
                href="/expenses"
                className="mini-3d-card flex items-center justify-between p-4 rounded-xl cursor-pointer text-slate-300 light:text-slate-700 hover:text-purple-400 light:hover:text-purple-600 transition-all"
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Log Daily Expense</span>
                </div>
                <PlusCircle size={16} />
              </Link>
              <Link
                href="/food"
                className="mini-3d-card flex items-center justify-between p-4 rounded-xl cursor-pointer text-slate-300 light:text-slate-700 hover:text-teal-400 light:hover:text-teal-600 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Apple size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Add Protein Log</span>
                </div>
                <PlusCircle size={16} />
              </Link>
              <Link
                href="/wellness"
                className="mini-3d-card flex items-center justify-between p-4 rounded-xl cursor-pointer text-slate-300 light:text-slate-700 hover:text-red-400 light:hover:text-red-600 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Heart size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Log Wellness</span>
                </div>
                <PlusCircle size={16} />
              </Link>
              <Link
                href="/dashboard/import"
                className="mini-3d-card flex items-center justify-between p-4 rounded-xl cursor-pointer text-slate-300 light:text-slate-700 hover:text-indigo-400 light:hover:text-indigo-600 transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileUp size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Import Excel Backup</span>
                </div>
                <PlusCircle size={16} />
              </Link>
            </div>
          </div>

        </main>
      </div>

      <footer className="relative z-10 w-full border-t border-white/5 py-4 text-center">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">Personal Labs. Authorized Portal Control</p>
      </footer>
    </div>
  );
}
