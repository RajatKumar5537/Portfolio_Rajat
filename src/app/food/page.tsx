"use client";

import React, { useState, useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import { Apple, Trash2, Calendar, Scale, Award, Info, Loader2, Plus, Sparkles, ChevronLeft, ChevronRight, Pencil, Check, X } from "lucide-react";

export default function FoodPage() {
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Inline edit state
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editFoodForm, setEditFoodForm] = useState({ date: "", foodName: "", portionGrams: "", proteinPer100g: "", mealType: "Snack" });

  // Selected Month & Year states
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;
  const logsRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    foodName: "",
    portionGrams: "",
    proteinPer100g: "",
    mealType: "Snack",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
  const proteinGoal = 120; // Daily protein target (120g)
  
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // Quick select food templates
  const foodTemplates = [
    { name: "Chicken Breast", protein: 31 },
    { name: "Whole Egg", protein: 13 },
    { name: "Egg White", protein: 11 },
    { name: "Paneer (Cottage Cheese)", protein: 18 },
    { name: "Whey Protein Powder", protein: 80 },
    { name: "Soya Chunks", protein: 52 },
    { name: "Tofu", protein: 8 },
    { name: "Greek Yogurt", protein: 10 },
  ];

  useEffect(() => {
    fetchFoodLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear]);

  const fetchFoodLogs = async () => {
    try {
      const res = await fetch("/api/tracking/food");
      const data = await res.json();
      if (Array.isArray(data)) {
        setFoodLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic list of years based on logged history
  const availableYears = Array.from(
    new Set([
      new Date().getFullYear(),
      ...foodLogs.map((log) => new Date(log.date).getFullYear())
    ])
  ).sort((a, b) => b - a);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleApplyTemplate = (tpl: { name: string; protein: number }) => {
    setForm({
      ...form,
      foodName: tpl.name,
      proteinPer100g: String(tpl.protein),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.foodName || !form.portionGrams || !form.proteinPer100g) {
      setError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/tracking/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const newLog = await res.json();

      if (!res.ok) {
        throw new Error(newLog.error || "Failed to log food");
      }

      setFoodLogs([newLog, ...foodLogs]);

      // Shift selectors to newly added log date
      const newLogDate = new Date(form.date);
      setSelectedMonth(newLogDate.getMonth());
      setSelectedYear(newLogDate.getFullYear());

      setForm({
        date: new Date().toISOString().split("T")[0],
        foodName: "",
        portionGrams: "",
        proteinPer100g: "",
        mealType: form.mealType,
      });
      setSuccess("Food logged successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to log food.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this food entry?")) return;

    try {
      const res = await fetch(`/api/tracking/food?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setFoodLogs(foodLogs.filter((log) => log._id !== id));
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete food log");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFoodEditStart = (log: any) => {
    setEditingFoodId(log._id);
    setEditFoodForm({
      date: new Date(log.date).toISOString().split("T")[0],
      foodName: log.foodName,
      portionGrams: String(log.portionGrams),
      proteinPer100g: String(log.proteinPer100g),
      mealType: log.mealType,
    });
  };

  const handleFoodEditSave = async (id: string) => {
    try {
      const res = await fetch(`/api/tracking/food?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFoodForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setFoodLogs(foodLogs.map((l) => (l._id === id ? updated : l)));
        setEditingFoodId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
    if (selectedMonth === -1 && selectedYear === -1) return "Lifetime";
    if (selectedMonth === -1) return `${selectedYear} (Year)`;
    if (selectedYear === -1) return `${months[selectedMonth]} (All Years)`;
    return `${months[selectedMonth].slice(0, 3)} '${String(selectedYear).slice(-2)}`;
  };

  // Filter logs by selected Month and Year
  const filteredLogs = foodLogs.filter((log) => {
    const logDate = new Date(log.date);
    const monthMatches = selectedMonth === -1 || logDate.getMonth() === selectedMonth;
    const yearMatches = selectedYear === -1 || logDate.getFullYear() === selectedYear;
    return monthMatches && yearMatches;
  });

  // Calculate unique days and average daily protein intake
  const uniqueLoggedDays = new Set(filteredLogs.map(l => new Date(l.date).toDateString())).size;
  const totalProteinLogged = filteredLogs.reduce((acc, curr) => acc + curr.calculatedProtein, 0);
  const activeProtein = uniqueLoggedDays > 0 ? totalProteinLogged / uniqueLoggedDays : 0;
  const activeProteinPercent = Math.min(100, Math.round((activeProtein / proteinGoal) * 100));

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="relative min-h-screen bg-background flex flex-col justify-between">
      <div className="cyber-grid"></div>

      <div className="relative z-10 flex flex-col flex-grow">
        <Navigation />

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          {/* Header & Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-slate-200">Protein tracker</h2>
              <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">Gram portion intake calculator</p>
            </div>

            {/* Premium Month/Year selection bar */}
            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-xl">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 cursor-pointer transition-all"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent text-xs font-bold uppercase tracking-wider text-indigo-400 outline-none cursor-pointer py-1 px-2 font-sans"
                >
                  <option value={-1} className="bg-[#0c0c16] text-indigo-400 font-bold">
                    ALL MONTHS
                  </option>
                  {months.map((m, idx) => (
                    <option key={m} value={idx} className="bg-[#0c0c16] text-slate-300">
                      {m.toUpperCase()}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent text-xs font-bold uppercase tracking-wider text-indigo-400 outline-none cursor-pointer py-1 px-2 font-sans"
                >
                  <option value={-1} className="bg-[#0c0c16] text-indigo-400 font-bold">
                    ALL YEARS
                  </option>
                  {availableYears.map((year) => (
                    <option key={year} value={year} className="bg-[#0c0c16] text-slate-300">
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 cursor-pointer transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Goal Display Card */}
          <div className="glass-card card-glow-teal p-6 rounded-2xl border border-white/5 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Award size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  {selectedMonth === -1 || selectedYear === -1 || uniqueLoggedDays > 1 ? "Average Daily Progress" : "Daily Intake Progress"} ({getContextLabel()})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {uniqueLoggedDays > 0 
                    ? `Calculated based on ${uniqueLoggedDays} active logging days in this period`
                    : `No food logs recorded in this period`
                  }
                </p>
              </div>
            </div>

            {/* Protein percentage scale */}
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400 font-bold">{activeProtein.toFixed(1)}g Avg / Day</span>
                <span className="text-teal-400 font-bold">{activeProteinPercent}% of {proteinGoal}g Target</span>
              </div>
              <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full transition-all duration-750"
                  style={{ width: `${activeProteinPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Form */}
              <div className="glass-card card-glow-teal p-6 rounded-2xl border border-white/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 mb-6 flex items-center gap-2">
                  <Apple size={14} className="text-teal-400" />
                  <span>Log Meal Entry</span>
                </h3>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-medium font-sans">
                    ⚠️ {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs font-medium font-sans">
                    ✅ {success}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">Date</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                        <Calendar size={14} />
                      </span>
                      <input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleInputChange}
                        className="w-full bg-white/[0.02] border border-white/5 focus:border-teal-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Meal Type */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">Meal Session</label>
                    <div className="grid grid-cols-4 gap-1">
                      {mealTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setForm({ ...form, mealType: type })}
                          className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                            form.mealType === type
                              ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                              : "bg-white/[0.01] text-slate-500 border-transparent hover:text-slate-300"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Food Name */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">Food Item</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                        <Apple size={14} />
                      </span>
                      <input
                        type="text"
                        name="foodName"
                        value={form.foodName}
                        onChange={handleInputChange}
                        placeholder="e.g. Scrambled Eggs, Protein Shake"
                        className="w-full bg-white/[0.02] border border-white/5 focus:border-teal-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Portion Grams */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">Portion (Grams)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                          <Scale size={14} />
                        </span>
                        <input
                          type="number"
                          name="portionGrams"
                          value={form.portionGrams}
                          onChange={handleInputChange}
                          placeholder="150"
                          min="1"
                          className="w-full bg-white/[0.02] border border-white/5 focus:border-teal-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all font-mono"
                          required
                        />
                      </div>
                    </div>

                    {/* Protein / 100g */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">Protein (g/100g)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                          <Info size={14} />
                        </span>
                        <input
                          type="number"
                          name="proteinPer100g"
                          value={form.proteinPer100g}
                          onChange={handleInputChange}
                          placeholder="31"
                          min="0.1"
                          step="0.1"
                          className="w-full bg-white/[0.02] border border-white/5 focus:border-teal-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20 transition-all"
                  >
                    {submitting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Plus size={12} />
                    )}
                    <span>Log Food Intake</span>
                  </button>
                </form>
              </div>

              {/* Quick Templates selector */}
              <div className="glass-card card-glow-teal p-6 rounded-2xl border border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Protein Templates</h3>
                <div className="flex flex-wrap gap-2">
                  {foodTemplates.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="bg-white/[0.02] hover:bg-teal-500/10 border border-white/5 hover:border-teal-500/30 text-slate-400 hover:text-teal-400 text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all cursor-pointer"
                    >
                      {tpl.name} ({tpl.protein}g)
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Logs Column */}
            <div ref={logsRef} className="lg:col-span-2">
              <div className="glass-card card-glow-indigo p-6 rounded-2xl border border-white/5 h-full flex flex-col min-h-[400px]">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 mb-6 flex items-center gap-2">
                  <Sparkles size={14} className="text-teal-400 animate-pulse" />
                  <span>Meal Intake logs ({getContextLabel()})</span>
                </h3>

                {loading ? (
                  <div className="flex-grow flex items-center justify-center">
                    <Loader2 size={20} className="text-slate-600 animate-spin" />
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center text-center text-xs text-slate-600 italic">
                    No food portions recorded for {getContextLabel()}.
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="overflow-y-auto max-h-[500px] pr-2 space-y-3">
                      {paginatedLogs.map((log) =>
                        editingFoodId === log._id ? (
                          /* ── INLINE EDIT ROW ── */
                          <div key={log._id} className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Date</label>
                                <input type="date" value={editFoodForm.date} onChange={e => setEditFoodForm({...editFoodForm, date: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50" />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Meal Type</label>
                                <select value={editFoodForm.mealType} onChange={e => setEditFoodForm({...editFoodForm, mealType: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50">
                                  {["Breakfast","Lunch","Dinner","Snack"].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Food Name</label>
                              <input type="text" value={editFoodForm.foodName} onChange={e => setEditFoodForm({...editFoodForm, foodName: e.target.value})}
                                className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Portion (g)</label>
                                <input type="number" value={editFoodForm.portionGrams} onChange={e => setEditFoodForm({...editFoodForm, portionGrams: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50" />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Protein/100g</label>
                                <input type="number" value={editFoodForm.proteinPer100g} onChange={e => setEditFoodForm({...editFoodForm, proteinPer100g: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50" />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button onClick={() => setEditingFoodId(null)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10 transition-all cursor-pointer">
                                <X size={12} /> Cancel
                              </button>
                              <button onClick={() => handleFoodEditSave(log._id)} className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                                <Check size={12} /> Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ── READ VIEW ROW ── */
                          <div
                            key={log._id}
                            className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group"
                          >
                            <div className="flex items-center gap-4 min-w-0 flex-grow">
                              <div className="w-9 h-9 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center flex-shrink-0">
                                <span className="text-[8px] font-bold text-slate-500 uppercase font-mono">
                                  {new Date(log.date).toLocaleDateString("en-US", { month: "short" })}
                                </span>
                                <span className="text-[11px] font-black text-slate-300 leading-none">
                                  {new Date(log.date).toLocaleDateString("en-US", { day: "2-digit" })}
                                </span>
                              </div>
                              <div className="min-w-0 flex-grow">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-bold text-slate-200 break-all pr-2" title={log.foodName}>{log.foodName}</p>
                                  <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono flex-shrink-0 bg-teal-950/20 text-teal-400 border border-teal-500/10">
                                    {log.mealType}
                                  </span>
                                </div>
                                <span className="inline-block text-[9px] uppercase tracking-wider font-bold font-mono text-slate-500 mt-1">
                                  {log.portionGrams}g portion @ {log.proteinPer100g}g/100g
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black font-mono text-teal-400">
                                +{log.calculatedProtein.toFixed(1)}g
                              </span>
                              <button
                                onClick={() => handleFoodEditStart(log)}
                                className="text-slate-600 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                title="Edit Food Entry"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(log._id)}
                                className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                title="Delete Food Log"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )
                      )}

                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6 font-sans text-xs">
                        <button
                          onClick={() => {
                            setCurrentPage((p) => Math.max(1, p - 1));
                            if (logsRef.current) {
                              logsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }}
                          disabled={currentPage === 1}
                          className="px-3.5 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                        >
                          Previous
                        </button>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => {
                            setCurrentPage((p) => Math.min(totalPages, p + 1));
                            if (logsRef.current) {
                              logsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }}
                          disabled={currentPage === totalPages}
                          className="px-3.5 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="relative z-10 w-full border-t border-white/5 py-4 text-center">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">Personal Labs. Nutrition tracker console</p>
      </footer>
    </div>
  );
}
