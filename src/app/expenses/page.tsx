"use client";

import React, { useState, useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import { CreditCard, Trash2, Calendar, IndianRupee, Tag, FileText, Loader2, Plus, Sparkles, TrendingDown, TrendingUp, Wallet, ChevronLeft, ChevronRight, Pencil, Check, X } from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const logsRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ date: "", description: "", amount: "", category: "", type: "Expense" });

  // Selected Month & Year states (-1 represents "All")
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11 or -1
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear()); // Year or -1

  // Interactive Card Filter state
  const [activeFilter, setActiveFilter] = useState<{
    type: "Income" | "Expense" | null;
    category: string | null;
    label: string;
  }>({ type: null, category: null, label: "All" });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, activeFilter]);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    category: "Others",
    type: "Expense",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const expenseCategories = [
    "Delhi Room", "Food", "Swarna", "Ajit", "Home", "Shopping", 
    "Recharge", "Travel", "Gift", "Puri", "Aditya Verma", 
    "Bikash", "Health", "Education", "Others"
  ];
  
  const incomeCategories = ["Salary", "Bonus", "Other Trns", "Others"];
  
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/tracking/expenses");
      const data = await res.json();
      if (Array.isArray(data)) {
        setExpenses(data);
      }
    } catch (err) {
      console.error("Failed to fetch expenses: ", err);
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic list of years based on recorded transaction history
  const availableYears = Array.from(
    new Set([
      new Date().getFullYear(),
      ...expenses.map((e) => new Date(e.date).getFullYear())
    ])
  ).sort((a, b) => b - a);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleTypeChange = (selectedType: string) => {
    setForm({
      ...form,
      type: selectedType,
      category: "Others",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.category || !form.type) {
      setError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/tracking/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const newExpense = await res.json();

      if (!res.ok) {
        throw new Error(newExpense.error || "Failed to log record");
      }

      setExpenses([newExpense, ...expenses]);

      // Set selectors to match the month/year of the newly logged transaction
      const newTxDate = new Date(form.date);
      setSelectedMonth(newTxDate.getMonth());
      setSelectedYear(newTxDate.getFullYear());

      // Reset filters so the user sees the newly logged item
      setActiveFilter({ type: null, category: null, label: "All" });

      setForm({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        category: "Others",
        type: form.type,
      });
      setSuccess("Record saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction record?")) return;

    try {
      const res = await fetch(`/api/tracking/expenses?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setExpenses(expenses.filter((exp) => exp._id !== id));
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete transaction");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditStart = (exp: any) => {
    setEditingId(exp._id);
    setEditForm({
      date: new Date(exp.date).toISOString().split("T")[0],
      description: exp.description,
      amount: String(exp.amount),
      category: exp.category,
      type: exp.type,
    });
  };

  const handleEditSave = async (id: string) => {
    try {
      const res = await fetch(`/api/tracking/expenses?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setExpenses(expenses.map((exp) => (exp._id === id ? updated : exp)));
        setEditingId(null);
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

  const handleCardFilter = (type: "Income" | "Expense" | null, category: string | null, label: string) => {
    if (activeFilter.type === type && activeFilter.category === category) {
      setActiveFilter({ type: null, category: null, label: "All" });
    } else {
      setActiveFilter({ type, category, label });
    }

    // Smooth scroll to logs on mobile devices
    setTimeout(() => {
      if (window.innerWidth < 1024 && logsRef.current) {
        logsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Helper to print correct month/year selection label in elements
  const getContextLabel = () => {
    if (selectedMonth === -1 && selectedYear === -1) return "Lifetime";
    if (selectedMonth === -1) return `${selectedYear} (Year)`;
    if (selectedYear === -1) return `${months[selectedMonth]} (All Years)`;
    return `${months[selectedMonth].slice(0, 3)} '${String(selectedYear).slice(-2)}`;
  };

  // 1. Filter expenses by selected Month and Year
  const monthlyExpenses = expenses.filter((exp) => {
    const expDate = new Date(exp.date);
    const monthMatches = selectedMonth === -1 || expDate.getMonth() === selectedMonth;
    const yearMatches = selectedYear === -1 || expDate.getFullYear() === selectedYear;
    return monthMatches && yearMatches;
  });

  // 2. Calculations based on Monthly/Yearly data
  const incomeTotal = monthlyExpenses.filter(e => e.type === "Income").reduce((acc, curr) => acc + curr.amount, 0);
  const expenseTotal = monthlyExpenses.filter(e => e.type === "Expense").reduce((acc, curr) => acc + curr.amount, 0);
  const remainTotal = incomeTotal - expenseTotal;

  const homeTotal = monthlyExpenses.filter(e => e.category === "Home" && e.type === "Expense").reduce((acc, exp) => acc + exp.amount, 0);
  const ajitTotal = monthlyExpenses.filter(e => e.category === "Ajit" && e.type === "Expense").reduce((acc, exp) => acc + exp.amount, 0);
  const swarnaTotal = monthlyExpenses.filter(e => e.category === "Swarna" && e.type === "Expense").reduce((acc, exp) => acc + exp.amount, 0);
  const delhiRoomTotal = monthlyExpenses.filter(e => e.category === "Delhi Room" && e.type === "Expense").reduce((acc, exp) => acc + exp.amount, 0);

  // 3. Filter displayed logs based on active card filters
  const displayedExpenses = monthlyExpenses.filter((exp) => {
    if (activeFilter.type && exp.type !== activeFilter.type) return false;
    if (activeFilter.category && exp.category !== activeFilter.category) return false;
    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(displayedExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = displayedExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeCategories = form.type === "Income" ? incomeCategories : expenseCategories;

  return (
    <div className="relative min-h-screen bg-[#030308] flex flex-col justify-between">
      <div className="cyber-grid"></div>

      <div className="relative z-10 flex flex-col flex-grow">
        <Navigation />

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          {/* Header & Month Selector */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-slate-200">Personal Ledger</h2>
              <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">Manage and segment all cash flows</p>
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

          {/* Grid Overview Cards (Filtered by selected Month & Year, horizontally scrollable on mobile) */}
          <div className="flex overflow-x-auto lg:grid lg:grid-cols-7 gap-4 mb-8 pb-3 scrollbar-none snap-x snap-mandatory">
            {/* Income Card */}
            <div
              onClick={() => handleCardFilter("Income", null, "Income")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex-shrink-0 w-[140px] lg:w-auto snap-start ${
                activeFilter.type === "Income" && !activeFilter.category
                  ? "border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  : "border-white/5 bg-emerald-950/5 hover:border-emerald-500/20"
              }`}
            >
              <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp size={10} />
                <span>Income ({getContextLabel()})</span>
              </span>
              <h3 className="text-lg font-black font-mono text-slate-100 mt-1">₹{incomeTotal.toLocaleString()}</h3>
            </div>

            {/* Outflow Card */}
            <div
              onClick={() => handleCardFilter("Expense", null, "Outflow")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex-shrink-0 w-[140px] lg:w-auto snap-start ${
                activeFilter.type === "Expense" && !activeFilter.category
                  ? "border-red-500/40 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                  : "border-white/5 bg-red-950/5 hover:border-red-500/20"
              }`}
            >
              <span className="text-[9px] uppercase tracking-widest text-red-400 font-bold flex items-center gap-1">
                <TrendingDown size={10} />
                <span>Outflow ({getContextLabel()})</span>
              </span>
              <h3 className="text-lg font-black font-mono text-slate-100 mt-1">₹{expenseTotal.toLocaleString()}</h3>
            </div>

            {/* Savings Card */}
            <div
              onClick={() => handleCardFilter(null, null, "All")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex-shrink-0 w-[140px] lg:w-auto snap-start ${
                !activeFilter.type && !activeFilter.category
                  ? "border-indigo-500/40 bg-indigo-950/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                  : "border-white/5 bg-indigo-950/5 hover:border-indigo-500/20"
              }`}
            >
              <span className="text-[9px] uppercase tracking-widest text-indigo-400 font-bold flex items-center gap-1">
                <Wallet size={10} />
                <span>Savings / Net</span>
              </span>
              <h3 className={`text-lg font-black font-mono mt-1 ${remainTotal >= 0 ? "text-slate-100" : "text-red-400"}`}>
                ₹{remainTotal.toLocaleString()}
              </h3>
            </div>

            {/* Home Spend Card */}
            <div
              onClick={() => handleCardFilter("Expense", "Home", "Home Spend")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex-shrink-0 w-[140px] lg:w-auto snap-start ${
                activeFilter.category === "Home"
                  ? "border-purple-500/45 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                  : "border-white/5 hover:border-purple-500/20"
              }`}
            >
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Home Spend</span>
              <h3 className="text-lg font-black font-mono text-slate-300 mt-1">₹{homeTotal.toLocaleString()}</h3>
            </div>

            {/* Ajit Spend Card */}
            <div
              onClick={() => handleCardFilter("Expense", "Ajit", "Ajit Spend")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex-shrink-0 w-[140px] lg:w-auto snap-start ${
                activeFilter.category === "Ajit"
                  ? "border-purple-500/45 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                  : "border-white/5 hover:border-purple-500/20"
              }`}
            >
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Ajit Spend</span>
              <h3 className="text-lg font-black font-mono text-slate-300 mt-1">₹{ajitTotal.toLocaleString()}</h3>
            </div>

            {/* Swarna Spend Card */}
            <div
              onClick={() => handleCardFilter("Expense", "Swarna", "Swarna Spend")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex-shrink-0 w-[140px] lg:w-auto snap-start ${
                activeFilter.category === "Swarna"
                  ? "border-purple-500/45 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                  : "border-white/5 hover:border-purple-500/20"
              }`}
            >
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Swarna Spend</span>
              <h3 className="text-lg font-black font-mono text-slate-300 mt-1">₹{swarnaTotal.toLocaleString()}</h3>
            </div>

            {/* Delhi Room Card */}
            <div
              onClick={() => handleCardFilter("Expense", "Delhi Room", "Delhi Room")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex-shrink-0 w-[140px] lg:w-auto snap-start ${
                activeFilter.category === "Delhi Room"
                  ? "border-purple-500/45 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                  : "border-white/5 hover:border-purple-500/20"
              }`}
            >
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Delhi Room</span>
              <h3 className="text-lg font-black font-mono text-slate-300 mt-1">₹{delhiRoomTotal.toLocaleString()}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-1">
              <div className="glass-card card-glow-purple p-6 rounded-2xl border border-white/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 mb-6 flex items-center gap-2">
                  <CreditCard size={14} className="text-purple-400" />
                  <span>Log New Entry</span>
                </h3>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-medium">
                    ⚠️ {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    ✅ {success}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type Selector (Income vs Expense) */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-purple-400">Transaction Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTypeChange("Expense")}
                        className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                          form.type === "Expense"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-white/[0.01] text-slate-500 border-transparent hover:text-slate-300"
                        }`}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTypeChange("Income")}
                        className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                          form.type === "Income"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-white/[0.01] text-slate-500 border-transparent hover:text-slate-300"
                        }`}
                      >
                        Income
                      </button>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-purple-400">Date</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                        <Calendar size={14} />
                      </span>
                      <input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleInputChange}
                        className="w-full bg-white/[0.02] border border-white/5 focus:border-purple-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-purple-400">Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                        <IndianRupee size={14} />
                      </span>
                      <input
                        type="number"
                        name="amount"
                        value={form.amount}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        className="w-full bg-white/[0.02] border border-white/5 focus:border-purple-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-purple-400">Category / Share</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                        <Tag size={14} />
                      </span>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleInputChange}
                        className="w-full bg-white/[0.02] border border-white/5 focus:border-purple-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 outline-none transition-all cursor-pointer"
                        required
                      >
                        {activeCategories.map((cat) => (
                          <option key={cat} value={cat} className="bg-[#0c0c16]">
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-purple-400">Description / Note</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                        <FileText size={14} />
                      </span>
                      <input
                        type="text"
                        name="description"
                        value={form.description}
                        onChange={handleInputChange}
                        placeholder="e.g. Broadband, Salary deposit"
                        className="w-full bg-white/[0.02] border border-white/5 focus:border-purple-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 transition-all"
                  >
                    {submitting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Plus size={12} />
                    )}
                    <span>Save Record</span>
                  </button>
                </form>
              </div>
            </div>

            {/* List Column */}
            <div ref={logsRef} className="lg:col-span-2">
              <div className="glass-card card-glow-indigo p-6 rounded-2xl border border-white/5 h-full flex flex-col min-h-[400px]">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 mb-6 flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                    <span>
                      Logs ({getContextLabel()})
                      {activeFilter.label !== "All" && (
                        <span className="ml-2 text-[9px] text-indigo-400 bg-indigo-950/60 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase">
                          Filtered: {activeFilter.label}
                        </span>
                      )}
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* General category dropdown filter */}
                    <select
                      value={activeFilter.category || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setActiveFilter({ type: null, category: null, label: "All" });
                        } else {
                          const isIncomeCat = incomeCategories.includes(val);
                          setActiveFilter({
                            type: isIncomeCat ? "Income" : "Expense",
                            category: val,
                            label: val,
                          });
                        }
                      }}
                      className="bg-white/[0.02] border border-white/5 focus:border-indigo-500/50 rounded-lg py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-300 outline-none cursor-pointer font-sans"
                    >
                      <option value="" className="bg-[#0c0c16]">ALL CATEGORIES</option>
                      <optgroup label="Expenses" className="bg-[#0c0c16] text-slate-500">
                        {expenseCategories.map(cat => (
                          <option key={cat} value={cat} className="bg-[#0c0c16] text-slate-300">{cat.toUpperCase()}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Income" className="bg-[#0c0c16] text-slate-500">
                        {incomeCategories.map(cat => (
                          <option key={cat} value={cat} className="bg-[#0c0c16] text-slate-300">{cat.toUpperCase()}</option>
                        ))}
                      </optgroup>
                    </select>

                    {activeFilter.label !== "All" && (
                      <button
                        onClick={() => setActiveFilter({ type: null, category: null, label: "All" })}
                        className="text-[9px] text-slate-500 hover:text-slate-300 underline font-bold uppercase tracking-wider cursor-pointer font-mono"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </h3>

                {loading ? (
                  <div className="flex-grow flex items-center justify-center">
                    <Loader2 size={20} className="text-slate-600 animate-spin" />
                  </div>
                ) : displayedExpenses.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center text-center text-xs text-slate-600 italic">
                    No transactions matching filter "{activeFilter.label}" for {getContextLabel()}.
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="overflow-y-auto max-h-[500px] pr-2 space-y-3">
                      {paginatedExpenses.map((exp) =>
                        editingId === exp._id ? (
                          /* ── INLINE EDIT ROW ── */
                          <div key={exp._id} className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Date</label>
                                <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50" />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Amount (₹)</label>
                                <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50" />
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Description</label>
                              <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})}
                                className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Category</label>
                                <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50">
                                  {["Home","Ajit","Swarna","Delhi Room","Food","Travel","Health","Entertainment","Education","Others"].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Type</label>
                                <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50">
                                  <option value="Expense">Expense</option>
                                  <option value="Income">Income</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10 transition-all cursor-pointer">
                                <X size={12} /> Cancel
                              </button>
                              <button onClick={() => handleEditSave(exp._id)} className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                                <Check size={12} /> Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ── READ VIEW ROW ── */
                          <div
                            key={exp._id}
                            className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group"
                          >
                            <div className="flex items-center gap-4 min-w-0 flex-grow">
                              <div className="w-9 h-9 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center flex-shrink-0">
                                <span className="text-[8px] font-bold text-slate-500 uppercase font-mono">
                                  {new Date(exp.date).toLocaleDateString("en-US", { month: "short" })}
                                </span>
                                <span className="text-[11px] font-black text-slate-300 leading-none">
                                  {new Date(exp.date).toLocaleDateString("en-US", { day: "2-digit" })}
                                </span>
                              </div>
                              <div className="min-w-0 flex-grow">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-bold text-slate-200 break-all pr-2" title={exp.description}>{exp.description}</p>
                                  <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded font-mono flex-shrink-0 ${
                                    exp.type === "Income"
                                      ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/10"
                                      : "bg-red-950/20 text-red-400 border border-red-500/10"
                                  }`}>
                                    {exp.type}
                                  </span>
                                </div>
                                <span className="inline-block text-[9px] uppercase tracking-wider font-bold font-mono text-purple-400 bg-purple-950/20 border border-purple-500/10 px-1.5 py-0.5 rounded-md mt-1">
                                  {exp.category}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-black font-mono ${
                                exp.type === "Income" ? "text-emerald-400" : "text-slate-100"
                              }`}>
                                {exp.type === "Income" ? "+" : "-"}₹{exp.amount.toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleEditStart(exp)}
                                className="text-slate-600 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                title="Edit Entry"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(exp._id)}
                                className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                title="Delete Ledger Entry"
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
        <p className="text-[10px] uppercase tracking-widest text-slate-600">Personal Labs. Transaction ledger Console</p>
      </footer>
    </div>
  );
}
