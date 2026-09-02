"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Navigation from "@/components/Navigation";
import * as XLSX from "xlsx";
import {
  CreditCard, Trash2, Calendar, IndianRupee, Tag, FileText, Loader2,
  Plus, Sparkles, TrendingDown, TrendingUp, Wallet, ChevronLeft, ChevronRight,
  Pencil, Check, X, Download, FileSpreadsheet, Printer, ChevronDown, Search
} from "lucide-react";

export default function ExpensesPage() {
  const { data: session } = useSession();
  const isRajat = session?.user?.email?.toLowerCase() === "kumarrajatpradhan5537@gmail.com";
  const userIdentifier = (session?.user as any)?.id || session?.user?.email || "guest";

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const logsRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  // Search filter state
  const [searchQuery, setSearchQuery] = useState("");

  // Export & Statement states
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementScope, setStatementScope] = useState<"current" | "all">("current");
  const [statementType, setStatementType] = useState<"All" | "Income" | "Expense">("All");
  const exportDropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ date: "", description: "", amount: "", category: "", type: "Expense" });


  const [filterMode, setFilterMode] = useState<"month" | "range">("range");

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState<string | null>(getLocalDateString());
  const [endDate, setEndDate] = useState<string | null>(getLocalDateString());

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
  }, [selectedMonth, selectedYear, startDate, endDate, filterMode, activeFilter, searchQuery]);


  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    category: "Others",
    type: "Expense",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  
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


  // 1. Initial load from LocalStorage (scoped per user)
  useEffect(() => {
    if (!session?.user) return;
    const isRajatUser = session.user.email?.toLowerCase() === "kumarrajatpradhan5537@gmail.com";
    const uId = (session.user as any).id || session.user.email || "guest";
    const expKey = `custom_expense_categories_${uId}`;
    const incKey = `custom_income_categories_${uId}`;

    const savedExp = localStorage.getItem(expKey);
    const savedInc = localStorage.getItem(incKey);

    if (savedExp) {
      try {
        setExpenseCategories(JSON.parse(savedExp));
      } catch {}
    } else {
      if (isRajatUser) {
        setExpenseCategories(["Home", "Delhi Room", "Swarna", "Ajit", "Travel", "Others"]);
      } else {
        setExpenseCategories(["Others"]);
      }
    }

    if (savedInc) {
      try {
        setIncomeCategories(JSON.parse(savedInc));
      } catch {}
    } else {
      if (isRajatUser) {
        setIncomeCategories(["Salary", "Bonus", "Others"]);
      } else {
        setIncomeCategories(["Others"]);
      }
    }
  }, [session]);

  // 2. Dynamic generation of custom lists based on transaction history
  useEffect(() => {
    if (!session?.user) return;
    const isRajatUser = session.user.email?.toLowerCase() === "kumarrajatpradhan5537@gmail.com";
    const uId = (session.user as any).id || session.user.email || "guest";
    const expKey = `custom_expense_categories_${uId}`;
    const incKey = `custom_income_categories_${uId}`;

    if (expenses.length === 0) {
      if (!localStorage.getItem(expKey)) {
        const initialExp = isRajatUser ? ["Home", "Delhi Room", "Swarna", "Ajit", "Travel", "Others"] : ["Others"];
        setExpenseCategories(initialExp);
      }
      if (!localStorage.getItem(incKey)) {
        const initialInc = isRajatUser ? ["Salary", "Bonus", "Others"] : ["Others"];
        setIncomeCategories(initialInc);
      }
      return;
    }

    const uniqueExpCats = Array.from(new Set(expenses.filter(e => e.type === "Expense").map(e => e.category).filter(Boolean)));
    const uniqueIncCats = Array.from(new Set(expenses.filter(e => e.type === "Income").map(e => e.category).filter(Boolean)));

    setExpenseCategories(prev => {
      const base = isRajatUser && prev.length === 0 ? ["Home", "Delhi Room", "Swarna", "Ajit", "Travel", "Others"] : prev;
      const merged = Array.from(new Set([...base, ...uniqueExpCats, "Others"]));
      localStorage.setItem(expKey, JSON.stringify(merged));
      return merged;
    });

    setIncomeCategories(prev => {
      const base = isRajatUser && prev.length === 0 ? ["Salary", "Bonus", "Others"] : prev;
      const merged = Array.from(new Set([...base, ...uniqueIncCats, "Others"]));
      localStorage.setItem(incKey, JSON.stringify(merged));
      return merged;
    });
  }, [expenses, session]);

  const handleAddCustomCategory = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    const uId = (session?.user as any)?.id || session?.user?.email || "guest";
    const expKey = `custom_expense_categories_${uId}`;
    const incKey = `custom_income_categories_${uId}`;

    if (form.type === "Expense") {
      if (expenseCategories.includes(cleanName)) return;
      const updated = [...expenseCategories, cleanName];
      setExpenseCategories(updated);
      localStorage.setItem(expKey, JSON.stringify(updated));
      setForm(prev => ({ ...prev, category: cleanName }));
    } else {
      if (incomeCategories.includes(cleanName)) return;
      const updated = [...incomeCategories, cleanName];
      setIncomeCategories(updated);
      localStorage.setItem(incKey, JSON.stringify(updated));
      setForm(prev => ({ ...prev, category: cleanName }));
    }
  };

  const handleDeleteCustomCategory = () => {
    const target = form.category;
    if (target === "Others") {
      alert("Cannot delete the default 'Others' category.");
      return;
    }
    if (!confirm(`Delete custom category '${target}'? (Existing transactions will remain unchanged)`)) return;

    const uId = (session?.user as any)?.id || session?.user?.email || "guest";
    const expKey = `custom_expense_categories_${uId}`;
    const incKey = `custom_income_categories_${uId}`;

    if (form.type === "Expense") {
      const updated = expenseCategories.filter(c => c !== target);
      setExpenseCategories(updated);
      localStorage.setItem(expKey, JSON.stringify(updated));
      setForm(prev => ({ ...prev, category: "Others" }));
    } else {
      const updated = incomeCategories.filter(c => c !== target);
      setIncomeCategories(updated);
      localStorage.setItem(incKey, JSON.stringify(updated));
      setForm(prev => ({ ...prev, category: "Others" }));
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
    if (filterMode === "range") {
      if (startDate && endDate) {
        if (startDate === endDate) {
          return new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
        return `${new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      }
      return "Date Range";
    }
    if (selectedMonth === -1 && selectedYear === -1) return "Lifetime";
    if (selectedMonth === -1) return `${selectedYear} (Year)`;
    if (selectedYear === -1) return `${months[selectedMonth]} (All Years)`;
    return `${months[selectedMonth].slice(0, 3)} '${String(selectedYear).slice(-2)}`;
  };

  // 1. Filter expenses by selected Month, Year or Date Range
  const monthlyExpenses = expenses.filter((exp) => {
    const expDate = new Date(exp.date);
    if (filterMode === "range") {
      const year = expDate.getFullYear();
      const month = String(expDate.getMonth() + 1).padStart(2, '0');
      const day = String(expDate.getDate()).padStart(2, '0');
      const localExpStr = `${year}-${month}-${day}`;
      
      const start = startDate || "1970-01-01";
      const end = endDate || "2999-12-31";
      return localExpStr >= start && localExpStr <= end;
    }
    const monthMatches = selectedMonth === -1 || expDate.getMonth() === selectedMonth;
    const yearMatches = selectedYear === -1 || expDate.getFullYear() === selectedYear;
    return monthMatches && yearMatches;
  });

  // 2. Calculations based on Monthly/Yearly data
  const incomeTotal = monthlyExpenses.filter(e => e.type === "Income").reduce((acc, curr) => acc + curr.amount, 0);
  const expenseTotal = monthlyExpenses.filter(e => e.type === "Expense").reduce((acc, curr) => acc + curr.amount, 0);
  const remainTotal = incomeTotal - expenseTotal;

  // Dynamically compute sum for all active categories
  const categoryTotals = expenseCategories.map(cat => {
    const total = monthlyExpenses
      .filter(e => e.type === "Expense" && ((e.category || "").toLowerCase().includes(cat.toLowerCase()) || (e.description || "").toLowerCase().includes(cat.toLowerCase())))
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { category: cat, total };
  }).filter(item => {
    if (isRajat) {
      return item.total > 0 || ["Home", "Ajit", "Swarna", "Delhi Room"].includes(item.category);
    }
    return item.total > 0;
  });

  // 3. Filter displayed logs based on active card filters & live search
  const displayedExpenses = monthlyExpenses.filter((exp) => {
    // 1. Live search query (matches category OR description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const cat = (exp.category || "").toLowerCase();
      const desc = (exp.description || "").toLowerCase();
      if (!cat.includes(q) && !desc.includes(q)) return false;
    }

    // 2. Type filter
    if (activeFilter.type && exp.type !== activeFilter.type) return false;

    // 3. Category/Person filter (matches category OR description for the name)
    if (activeFilter.category) {
      const target = activeFilter.category.toLowerCase().trim();
      const cat = (exp.category || "").toLowerCase();
      const desc = (exp.description || "").toLowerCase();
      if (!cat.includes(target) && !desc.includes(target)) return false;
    }

    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(displayedExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = displayedExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Helper to extract transactions for export / statement
  const getExportData = (scope: "current" | "all", customType?: "All" | "Income" | "Expense") => {
    let list = expenses;
    if (scope === "current") {
      list = monthlyExpenses;
    }

    // Filter by live search query if any (matches category OR description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((e) =>
        (e.category || "").toLowerCase().includes(q) ||
        (e.description || "").toLowerCase().includes(q)
      );
    }

    // Filter by person/category (matches category OR description)
    if (activeFilter.category) {
      const target = activeFilter.category.toLowerCase().trim();
      list = list.filter((e) =>
        (e.category || "").toLowerCase().includes(target) ||
        (e.description || "").toLowerCase().includes(target)
      );
    }

    // Determine type: if customType is provided, use it; otherwise use activeFilter.type if set, or "All"
    const typeToFilter = customType !== undefined ? customType : (activeFilter.type || "All");

    if (typeToFilter !== "All") {
      list = list.filter((e) => e.type === typeToFilter);
    }

    // Sort by date descending
    const sorted = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let targetName = activeFilter.category
      ? activeFilter.category
      : searchQuery.trim()
      ? `Search: "${searchQuery.trim()}"`
      : "Personal Ledger";

    if (typeToFilter === "All") {
      targetName += (activeFilter.category || searchQuery.trim()) ? " (All Inflows & Outflows)" : " (Income & Expenses Combined)";
    } else {
      targetName += ` (${typeToFilter}s)`;
    }


    let periodLabel = getContextLabel();
    if (scope === "all") {
      if (sorted.length > 0) {
        const oldestDate = new Date(sorted[sorted.length - 1].date);
        const newestDate = new Date(sorted[0].date);

        const formatDate = (d: Date) =>
          d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        if (oldestDate.toDateString() === newestDate.toDateString()) {
          periodLabel = formatDate(oldestDate);
        } else {
          periodLabel = `${formatDate(oldestDate)} to ${formatDate(newestDate)}`;
        }
      } else {
        periodLabel = "No Records";
      }
    }

    const totalExp = sorted
      .filter((e) => e.type === "Expense")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalInc = sorted
      .filter((e) => e.type === "Income")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const netBal = totalInc - totalExp;

    return {
      targetName,
      typeFilter: typeToFilter,
      periodLabel,
      transactions: sorted,
      totalCount: sorted.length,
      totalExpense: totalExp,
      totalIncome: totalInc,
      netBalance: netBal,
    };
  };

  const handleExportExcel = (scope: "current" | "all", customType: "All" | "Income" | "Expense" = statementType) => {
    const data = getExportData(scope, customType);
    if (data.transactions.length === 0) {
      alert(`No transactions found for ${data.targetName} (${data.periodLabel}).`);
      return;
    }

    const wb = XLSX.utils.book_new();

    // Metadata Header with Person & Summary Details
    const wsData: any[][] = [
      ["PERSONAL LEDGER - TRANSACTION STATEMENT"],
      [],
      ["Statement Subject / Person:", data.targetName],
      ["Period / Scope:", data.periodLabel],
      ["Generated Date:", new Date().toLocaleString()],
      ["Total Transactions:", data.totalCount],
      ["Total Outflow / Expense (INR):", data.totalExpense],
      ["Total Inflow / Income (INR):", data.totalIncome],
      ["Net Cash Flow / Balance (INR):", data.netBalance],
      [],
      ["Date", "Description / Purpose", "Category / Person", "Type", "Amount (INR)"]
    ];

    // Data rows
    data.transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const dateFormatted = d.toISOString().split("T")[0];
      const amountVal = tx.type === "Income" ? Number(tx.amount) : -Number(tx.amount);
      wsData.push([
        dateFormatted,
        tx.description || "",
        tx.category || "Others",
        tx.type || "Expense",
        amountVal
      ]);
    });

    // Grand total row
    wsData.push([]);
    wsData.push(["Total Inflow (Income)", "", "", "", data.totalIncome]);
    wsData.push(["Total Outflow (Expense)", "", "", "", -data.totalExpense]);
    wsData.push(["Net Balance", "", "", "", data.netBalance]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set Column Widths
    ws["!cols"] = [
      { wch: 15 }, // Date
      { wch: 40 }, // Description
      { wch: 22 }, // Category
      { wch: 14 }, // Type
      { wch: 18 }  // Amount
    ];

    const safeSheetName = (data.targetName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 25) || "Statement");
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

    const safeFileName = `${data.targetName.replace(/\s+/g, "_")}_Statement_${scope === "all" ? "AllTime" : "Range"}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, safeFileName);
    setShowExportDropdown(false);
  };

  const handleExportCSV = (scope: "current" | "all", customType: "All" | "Income" | "Expense" = statementType) => {
    const data = getExportData(scope, customType);
    if (data.transactions.length === 0) {
      alert(`No transactions found for ${data.targetName} (${data.periodLabel}).`);
      return;
    }

    const headers = ["Date", "Description", "Category", "Type", "Amount (INR)"];
    const rows = data.transactions.map((tx) => {
      const d = new Date(tx.date);
      const dateFormatted = d.toISOString().split("T")[0];
      const desc = `"${(tx.description || "").replace(/"/g, '""')}"`;
      const cat = `"${(tx.category || "Others").replace(/"/g, '""')}"`;
      const type = tx.type || "Expense";
      const amt = tx.type === "Income" ? Number(tx.amount) : -Number(tx.amount);
      return [dateFormatted, desc, cat, type, amt].join(",");
    });

    const metaComments = [
      `# PERSONAL LEDGER - TRANSACTION STATEMENT`,
      `# Subject / Person: ${data.targetName}`,
      `# Scope: ${data.periodLabel}`,
      `# Generated On: ${new Date().toLocaleString()}`,
      `# Total Transactions: ${data.totalCount}`,
      `# Total Inflow (Income): +₹${data.totalIncome}`,
      `# Total Outflow (Expense): -₹${data.totalExpense}`,
      `# Net Balance: ₹${data.netBalance}`,
      ``
    ].join("\n");

    const csvContent = metaComments + headers.join(",") + "\n" + rows.join("\n") + `\nTotal Inflow,,,,${data.totalIncome}\nTotal Outflow,,,,-${data.totalExpense}\nNet Balance,,,,${data.netBalance}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeFileName = `${data.targetName.replace(/\s+/g, "_")}_Statement_${scope === "all" ? "AllTime" : "Range"}_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", safeFileName);
    link.click();
    setShowExportDropdown(false);
  };

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
              <h2 className="page-heading text-xl font-black uppercase tracking-widest text-slate-900 dark:text-slate-200">Personal Ledger</h2>
              <p className="page-subheading text-xs text-slate-500 uppercase tracking-wider mt-0.5">Manage and segment all cash flows</p>
            </div>

            {/* Premium 3D Floating Mode selector bar */}
            <div className="filter-bar flex flex-wrap items-center gap-3 bg-white dark:bg-[#0c0c16]/60 shadow-lg dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-slate-200 dark:border-white/10 p-2 rounded-xl hover:border-slate-300 dark:hover:border-white/15 transition-all w-full sm:w-auto">
              {/* Toggle switch for Range vs Month */}
              <div className="mode-toggle flex bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFilterMode("range")}
                  className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                    filterMode === "range"
                      ? "active bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Range
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("month")}
                  className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                    filterMode === "month"
                      ? "active bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Month
                </button>
              </div>

              {filterMode === "month" ? (
                /* Month Mode */
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="bar-btn p-1 rounded-lg bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-all"
                  >
                    <ChevronLeft size={13} />
                  </button>

                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="bg-transparent text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer py-1 px-1 font-sans"
                  >
                    <option value={-1} className="bg-white dark:bg-[#0c0c16] text-indigo-600 dark:text-indigo-400 font-bold">ALL MONTHS</option>
                    {months.map((m, idx) => (
                      <option key={m} value={idx} className="bg-white dark:bg-[#0c0c16] text-slate-800 dark:text-slate-300">{m.toUpperCase()}</option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-transparent text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer py-1 px-1 font-sans"
                  >
                    <option value={-1} className="bg-white dark:bg-[#0c0c16] text-indigo-600 dark:text-indigo-400 font-bold">ALL YEARS</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year} className="bg-white dark:bg-[#0c0c16] text-slate-800 dark:text-slate-300">{year}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleNextMonth}
                    className="bar-btn p-1 rounded-lg bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-all"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              ) : (
                /* Range Mode (From Date & To Date) */
                <div className="flex flex-wrap items-center gap-2">
                  <div className="range-pill flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 px-2 py-1 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500 font-sans mr-1">From</span>
                    <input
                      type="date"
                      value={startDate || ""}
                      onChange={(e) => setStartDate(e.target.value || null)}
                      className="bg-transparent border-none outline-none text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer font-mono w-[110px] min-h-[1.5rem] py-0.5"
                    />
                  </div>
                  <div className="range-pill flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 px-2 py-1 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500 font-sans mr-1">Till</span>
                    <input
                      type="date"
                      value={endDate || ""}
                      onChange={(e) => setEndDate(e.target.value || null)}
                      className="bg-transparent border-none outline-none text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer font-mono w-[110px] min-h-[1.5rem] py-0.5"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grid Overview Cards (Filtered by selected Month & Year, horizontally scrollable on mobile) */}
          <div className="flex overflow-x-auto lg:grid lg:grid-cols-7 gap-4 mb-8 pb-3 scrollbar-none snap-x snap-mandatory">
            {/* Income Card */}
            <div
              onClick={() => handleCardFilter("Income", null, "Income")}
              className={`p-4 rounded-xl cursor-pointer flex-shrink-0 w-[140px] lg:w-auto snap-start mini-3d-card ${
                activeFilter.type === "Income" && !activeFilter.category
                  ? "mini-3d-card-active-income"
                  : ""
              }`}
            >
              <span className="text-[9px] uppercase tracking-widest text-emerald-400 light:text-emerald-600 font-bold flex items-center gap-1">
                <TrendingUp size={10} />
                <span>Income ({getContextLabel()})</span>
              </span>
              <h3 className="text-lg font-black font-mono text-slate-100 dark:text-slate-100 light:text-slate-900 mt-1">₹{incomeTotal.toLocaleString()}</h3>
            </div>

            {/* Outflow Card */}
            <div
              onClick={() => handleCardFilter("Expense", null, "Outflow")}
              className={`p-4 rounded-xl cursor-pointer flex-shrink-0 w-[140px] lg:w-auto snap-start mini-3d-card ${
                activeFilter.type === "Expense" && !activeFilter.category
                  ? "mini-3d-card-active-expense"
                  : ""
              }`}
            >
              <span className="text-[9px] uppercase tracking-widest text-red-400 light:text-red-600 font-bold flex items-center gap-1">
                <TrendingDown size={10} />
                <span>Outflow ({getContextLabel()})</span>
              </span>
              <h3 className="text-lg font-black font-mono text-slate-100 dark:text-slate-100 light:text-slate-900 mt-1">₹{expenseTotal.toLocaleString()}</h3>
            </div>

            {/* Savings Card */}
            <div
              onClick={() => handleCardFilter(null, null, "All")}
              className={`p-4 rounded-xl cursor-pointer flex-shrink-0 w-[140px] lg:w-auto snap-start mini-3d-card ${
                !activeFilter.type && !activeFilter.category
                  ? "mini-3d-card-active-savings"
                  : ""
              }`}
            >
              <span className="text-[9px] uppercase tracking-widest text-indigo-400 light:text-indigo-600 font-bold flex items-center gap-1">
                <Wallet size={10} />
                <span>Savings / Net</span>
              </span>
              <h3 className={`text-lg font-black font-mono mt-1 ${remainTotal >= 0 ? "text-slate-100 dark:text-slate-100 light:text-slate-900" : "text-red-400 light:text-red-600"}`}>
                ₹{remainTotal.toLocaleString()}
              </h3>
            </div>

            {/* Dynamic Category Spend Cards */}
            {categoryTotals.map((item) => (
              <div
                key={item.category}
                onClick={() => handleCardFilter(null, item.category, item.category)}
                className={`p-4 rounded-xl cursor-pointer flex-shrink-0 w-[140px] lg:w-auto snap-start mini-3d-card ${
                  activeFilter.category === item.category
                    ? "mini-3d-card-active-category"
                    : ""
                }`}
              >
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">{item.category} Spend</span>
                <h3 className="text-lg font-black font-mono mt-1 mini-3d-card-value">₹{item.total.toLocaleString()}</h3>
              </div>
            ))}

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
                    <div className="flex gap-3 mt-1 px-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newCat = prompt("Enter new category name:");
                          if (newCat && newCat.trim()) {
                            handleAddCustomCategory(newCat.trim());
                          }
                        }}
                        className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        + Add Custom
                      </button>
                      {form.category !== "Others" && (
                        <button
                          type="button"
                          onClick={handleDeleteCustomCategory}
                          className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          - Delete Selected
                        </button>
                      )}
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
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-400 animate-pulse flex-shrink-0" />
                    <span className="leading-normal flex flex-wrap items-center gap-1.5">
                      <span>Logs ({getContextLabel()})</span>
                      {activeFilter.label !== "All" && (
                        <span className="text-[8px] text-indigo-400 bg-indigo-950/60 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase whitespace-nowrap">
                          Filtered: {activeFilter.label}
                        </span>
                      )}
                      {searchQuery.trim() && (
                        <span className="text-[8px] text-purple-400 bg-purple-950/60 border border-purple-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase whitespace-nowrap">
                          Search: &quot;{searchQuery.trim()}&quot;
                        </span>
                      )}
                    </span>
                  </span>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                    {/* Live Search Input (matches category OR description) */}
                    <div className="relative flex items-center">
                      <Search size={11} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search name / note..."
                        className="bg-white/[0.02] light:bg-white border border-white/5 light:border-slate-200 focus:border-indigo-500/50 rounded-lg py-1 pl-7 pr-6 text-[9px] font-medium text-slate-200 light:text-slate-800 placeholder-slate-500 outline-none w-28 sm:w-36 transition-all"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-1.5 text-slate-400 hover:text-slate-200 p-0.5 rounded cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>

                    {/* General category dropdown filter */}
                    <select
                      value={activeFilter.category || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setActiveFilter({ type: null, category: null, label: "All" });
                        } else {
                          setActiveFilter({
                            type: null,
                            category: val,
                            label: val,
                          });
                        }
                      }}
                      className="bg-white/[0.02] light:bg-white border border-white/5 light:border-slate-200 focus:border-indigo-500/50 rounded-lg py-1 px-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-300 light:text-slate-700 outline-none cursor-pointer font-sans"
                    >
                      <option value="" className="bg-white dark:bg-[#0c0c16] text-slate-800 dark:text-slate-300">ALL CATEGORIES</option>
                      <optgroup label="Expenses" className="bg-white dark:bg-[#0c0c16] text-slate-500">
                        {expenseCategories.map(cat => (
                          <option key={cat} value={cat} className="bg-white dark:bg-[#0c0c16] text-slate-800 dark:text-slate-300">{cat.toUpperCase()}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Income" className="bg-white dark:bg-[#0c0c16] text-slate-500">
                        {incomeCategories.map(cat => (
                          <option key={cat} value={cat} className="bg-white dark:bg-[#0c0c16] text-slate-800 dark:text-slate-300">{cat.toUpperCase()}</option>
                        ))}
                      </optgroup>
                    </select>

                    {(activeFilter.label !== "All" || searchQuery) && (
                      <button
                        onClick={() => {
                          setActiveFilter({ type: null, category: null, label: "All" });
                          setSearchQuery("");
                        }}
                        className="text-[9px] text-slate-500 hover:text-slate-300 light:text-slate-600 light:hover:text-slate-800 underline font-bold uppercase tracking-wider cursor-pointer font-mono whitespace-nowrap"
                      >
                        Reset
                      </button>
                    )}


                    {/* Export Button with Quick Actions & Statement Modal */}
                    <div className="relative" ref={exportDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowExportDropdown(!showExportDropdown)}
                        className="flex items-center gap-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 light:bg-indigo-50 light:hover:bg-indigo-100 text-indigo-400 hover:text-indigo-300 light:text-indigo-600 border border-indigo-500/20 hover:border-indigo-500/40 light:border-indigo-200 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                        title="Export transactions & person statements"
                      >
                        <Download size={11} className="text-indigo-400 light:text-indigo-600" />
                        <span>Export</span>
                        <ChevronDown size={10} className={`transition-transform duration-200 ${showExportDropdown ? "rotate-180" : ""}`} />
                      </button>

                      {showExportDropdown && (
                        <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-64 max-w-[calc(100vw-2.5rem)] rounded-xl border border-white/10 dark:border-white/10 light:border-slate-200 bg-[#0c0c16]/95 light:bg-white backdrop-blur-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-2.5 py-1.5 border-b border-white/5 light:border-slate-100 mb-1">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-300 light:text-slate-800">
                              Export {activeFilter.category || (activeFilter.type ? `${activeFilter.type}s` : "Ledger")}
                            </p>
                            <p className="text-[9px] text-slate-500 light:text-slate-400 font-mono truncate">
                              {displayedExpenses.length} records in {getContextLabel()}
                            </p>
                          </div>

                          <div className="space-y-1">
                            {/* Quick Excel Download for current view */}
                            <button
                              type="button"
                              onClick={() => handleExportExcel("current")}
                              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-200 light:text-slate-700 hover:bg-emerald-500/10 hover:text-emerald-400 light:hover:text-emerald-600 transition-all text-left cursor-pointer group"
                            >
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet size={13} className="text-emerald-400 flex-shrink-0" />
                                <span>Excel (.xlsx) - Current Range</span>
                              </div>
                              <span className="text-[8px] font-mono text-slate-500 group-hover:text-emerald-400">XLSX</span>
                            </button>

                            {/* Quick CSV Download for current view */}
                            <button
                              type="button"
                              onClick={() => handleExportCSV("current")}
                              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-200 light:text-slate-700 hover:bg-blue-500/10 hover:text-blue-400 light:hover:text-blue-600 transition-all text-left cursor-pointer group"
                            >
                              <div className="flex items-center gap-2">
                                <FileText size={13} className="text-blue-400 flex-shrink-0" />
                                <span>CSV (.csv) - Current Range</span>
                              </div>
                              <span className="text-[8px] font-mono text-slate-500 group-hover:text-blue-400">CSV</span>
                            </button>

                            {activeFilter.category && (
                              <>
                                <div className="my-1 border-t border-white/5 light:border-slate-100" />
                                <div className="px-2.5 py-0.5">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-purple-400">
                                    All-Time Records
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleExportExcel("all")}
                                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-200 light:text-slate-700 hover:bg-purple-500/10 hover:text-purple-400 light:hover:text-purple-600 transition-all text-left cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileSpreadsheet size={13} className="text-purple-400 flex-shrink-0" />
                                    <span>All {activeFilter.category} (Excel)</span>
                                  </div>
                                  <span className="text-[8px] font-mono text-slate-500 group-hover:text-purple-400">
                                    {expenses.filter(e => e.category === activeFilter.category).length} tx
                                  </span>
                                </button>
                              </>
                            )}

                            <div className="my-1 border-t border-white/5 light:border-slate-100" />

                            {/* Detailed Statement & Print Modal */}
                            <button
                              type="button"
                              onClick={() => {
                                setShowExportDropdown(false);
                                setStatementScope("current");
                                setShowStatementModal(true);
                              }}
                              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:bg-indigo-500/10 transition-all text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Printer size={13} className="text-indigo-400 flex-shrink-0" />
                                <span>Statement & Print / PDF</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Category</label>
                                <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50">
                                  {(editForm.type === "Income" ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}
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
                                className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10 transition-all cursor-pointer"
                                title="Edit Entry"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(exp._id)}
                                className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
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

        {/* ── DETAILED STATEMENT & PRINT / PDF MODAL ── */}

        {showStatementModal && (() => {
          const stmtData = getExportData(statementScope, statementType);
          return (
            <div className="statement-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
              <div className="statement-modal-card relative w-full max-w-4xl bg-[#0c0c16] light:bg-white border border-white/10 light:border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Top Action Header */}
                <div className="no-print flex flex-wrap items-center justify-between gap-3 p-4 border-b border-white/10 light:border-slate-200 bg-white/[0.02] light:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <FileSpreadsheet size={16} />
                    </span>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 light:text-slate-800">
                        Transaction Statement
                      </h3>
                      <p className="text-[9px] uppercase tracking-wider text-slate-500 light:text-slate-400">
                        Detailed breakdown for {stmtData.targetName}
                      </p>
                    </div>
                  </div>

                  {/* Filter Switches: Type & Scope */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Combined (All) vs Expense vs Income */}
                    <div className="flex bg-white/[0.03] light:bg-slate-200 border border-white/5 light:border-slate-300 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setStatementType("All")}
                        className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                          statementType === "All"
                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-black"
                            : "text-slate-400 hover:text-slate-200 light:text-slate-600"
                        }`}
                      >
                        Combined (All)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatementType("Expense")}
                        className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                          statementType === "Expense"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 font-black"
                            : "text-slate-400 hover:text-slate-200 light:text-slate-600"
                        }`}
                      >
                        Expenses
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatementType("Income")}
                        className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                          statementType === "Income"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black"
                            : "text-slate-400 hover:text-slate-200 light:text-slate-600"
                        }`}
                      >
                        Income
                      </button>
                    </div>

                    {/* Scope Switcher: Range vs All-Time */}
                    <div className="flex bg-white/[0.03] light:bg-slate-200 border border-white/5 light:border-slate-300 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setStatementScope("current")}
                        className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                          statementScope === "current"
                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                            : "text-slate-400 hover:text-slate-200 light:text-slate-600"
                        }`}
                      >
                        Current Range
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatementScope("all")}
                        className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                          statementScope === "all"
                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                            : "text-slate-400 hover:text-slate-200 light:text-slate-600"
                        }`}
                      >
                        All-Time Records
                      </button>
                    </div>

                    <button
                      onClick={() => setShowStatementModal(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Printable Statement Document Content */}
                <div className="overflow-y-auto p-6 space-y-6 flex-grow" id="printable-statement">
                  {/* Statement Paper Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10 light:border-slate-200">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                        Personal Labs • Transaction Ledger Statement
                      </span>
                      <h2 className="text-xl font-black uppercase tracking-wider text-slate-100 light:text-slate-900 mt-1">
                        {stmtData.targetName}
                      </h2>
                      <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
                        Period: <strong className="text-slate-200 light:text-slate-700">{stmtData.periodLabel}</strong>
                      </p>
                    </div>

                    <div className="text-left sm:text-right font-mono text-xs text-slate-400 space-y-0.5">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500">Generated On</p>
                      <p className="text-slate-200 light:text-slate-800 font-bold">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                      <p className="text-[10px] text-slate-500">{new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>

                  {/* Summary KPI Cards in Statement */}
                  <div className="statement-kpi-grid grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="statement-kpi-card p-3.5 rounded-xl bg-white/[0.02] light:bg-slate-50 border border-white/5 light:border-slate-200">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Total Transactions</span>
                      <p className="text-base font-black font-mono text-slate-200 light:text-slate-800 mt-1">{stmtData.totalCount}</p>
                    </div>
                    <div className="statement-kpi-card p-3.5 rounded-xl bg-red-950/10 light:bg-red-50 border border-red-500/10 light:border-red-200">
                      <span className="text-[9px] uppercase tracking-wider text-red-400 light:text-red-600 font-bold">Total Outflow (Expense)</span>
                      <p className="text-base font-black font-mono text-red-400 light:text-red-600 mt-1">₹{stmtData.totalExpense.toLocaleString()}</p>
                    </div>
                    <div className="statement-kpi-card p-3.5 rounded-xl bg-emerald-950/10 light:bg-emerald-50 border border-emerald-500/10 light:border-emerald-200">
                      <span className="text-[9px] uppercase tracking-wider text-emerald-400 light:text-emerald-600 font-bold">Total Inflow (Income)</span>
                      <p className="text-base font-black font-mono text-emerald-400 light:text-emerald-600 mt-1">₹{stmtData.totalIncome.toLocaleString()}</p>
                    </div>
                    <div className="statement-kpi-card p-3.5 rounded-xl bg-indigo-950/10 light:bg-indigo-50 border border-indigo-500/10 light:border-indigo-200">
                      <span className="text-[9px] uppercase tracking-wider text-indigo-400 light:text-indigo-600 font-bold">Net Balance</span>
                      <p className={`text-base font-black font-mono mt-1 ${stmtData.netBalance >= 0 ? "text-emerald-400 light:text-emerald-600" : "text-red-400 light:text-red-600"}`}>
                        ₹{stmtData.netBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Table */}
                  <div className="table-print-wrapper overflow-x-auto rounded-xl border border-white/10 light:border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-white/[0.03] light:bg-slate-100 border-b border-white/10 light:border-slate-200 text-[9px] uppercase tracking-wider text-slate-400 light:text-slate-600 font-mono">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Description / Note</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 light:divide-slate-200">
                        {stmtData.transactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                              No records found for the selected scope.
                            </td>
                          </tr>
                        ) : (
                          stmtData.transactions.map((t) => {
                            const d = new Date(t.date);
                            const dateDisplay = d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
                            return (
                              <tr key={t._id} className="hover:bg-white/[0.02] light:hover:bg-slate-50 transition-all font-mono">
                                <td className="py-2.5 px-3 text-slate-300 light:text-slate-700 whitespace-nowrap">{dateDisplay}</td>
                                <td className="py-2.5 px-3 text-slate-200 light:text-slate-900 font-sans font-medium">{t.description}</td>
                                <td className="py-2.5 px-3 text-purple-400 light:text-purple-700 font-semibold">{t.category}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${
                                    t.type === "Income"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print-income-tag"
                                      : "bg-red-500/10 text-red-400 border border-red-500/20 print-expense-tag"
                                  }`}>
                                    {t.type}
                                  </span>
                                </td>
                                <td className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                                  t.type === "Income" ? "text-emerald-400 light:text-emerald-600" : "text-slate-100 light:text-slate-900"
                                }`}>
                                  {t.type === "Income" ? "+" : "-"}₹{Number(t.amount).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-white/[0.03] light:bg-slate-100 border-t border-white/10 light:border-slate-200 font-mono font-black text-xs">
                          <td colSpan={4} className="py-3 px-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="uppercase tracking-wider text-slate-300 light:text-slate-800">
                                Grand Total ({stmtData.transactions.length} Records)
                              </span>
                              <span className="text-[9px] text-slate-400 font-normal font-mono">
                                Inflow: <strong className="text-emerald-400 light:text-emerald-600">+₹{stmtData.totalIncome.toLocaleString()}</strong> | Outflow: <strong className="text-red-400 light:text-red-600">-₹{stmtData.totalExpense.toLocaleString()}</strong>
                              </span>
                            </div>
                          </td>
                          <td className={`py-3 px-3 text-right text-sm ${stmtData.netBalance >= 0 ? "text-emerald-400 light:text-emerald-600" : "text-red-400 light:text-red-600"}`}>
                            ₹{stmtData.netBalance.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Modal Bottom Action Footer */}

                <div className="no-print flex flex-wrap items-center justify-between gap-3 p-4 border-t border-white/10 light:border-slate-200 bg-white/[0.02] light:bg-slate-50">
                  <p className="text-[9px] uppercase tracking-wider font-mono text-slate-500">
                    Ready to download or print
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportExcel(statementScope)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                    >
                      <FileSpreadsheet size={13} />
                      <span>Download Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportCSV(statementScope)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                    >
                      <FileText size={13} />
                      <span>Download CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-indigo-500/20 transition-all"
                    >
                      <Printer size={13} />
                      <span>Print / Save as PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <footer className="relative z-10 w-full border-t border-white/5 py-4 text-center">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">Personal Labs. Transaction ledger Console</p>
      </footer>
    </div>
  );
}
