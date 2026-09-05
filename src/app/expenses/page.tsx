"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Navigation from "@/components/Navigation";
import * as XLSX from "xlsx";
import {
  CreditCard, Trash2, Calendar, IndianRupee, Tag, FileText, Loader2,
  Plus, Sparkles, TrendingDown, TrendingUp, Wallet, ChevronLeft, ChevronRight,
  Pencil, Check, X, Download, FileSpreadsheet, Printer, ChevronDown, Search,
  PieChart, Percent, Info, Layers, ArrowRight, Shield, Coins, Building,
  AlertTriangle, SlidersHorizontal, Landmark, PiggyBank, Settings2
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

  // Category Budgets State & Modal
  const [categoryBudgets, setCategoryBudgets] = useState<{ [key: string]: number }>({});
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState<{ [key: string]: string }>({});

  // Provident Fund (PF) & Wealth Portfolio Settings (Dynamic & Opt-in per user)
  const [pfSettings, setPfSettings] = useState({
    enabled: false,
    employeeContribution: 0,
    employerContribution: 0,
    healthInsuranceDeduction: 0,
    initialCorpus: 0,
    startMonth: "2024-01",
  });
  const [showPfModal, setShowPfModal] = useState(false);
  const [pfForm, setPfForm] = useState({
    enabled: false,
    employeeContribution: "1800",
    employerContribution: "1800",
    healthInsuranceDeduction: "505",
    initialCorpus: "0",
    startMonth: "2024-01",
  });

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
    const budgetKey = `category_budgets_${uId}`;
    const pfKey = `pf_settings_${uId}`;

    const savedExp = localStorage.getItem(expKey);
    const savedInc = localStorage.getItem(incKey);

    if (savedExp) {
      try {
        const parsed = JSON.parse(savedExp);
        if (isRajatUser && !parsed.includes("Health Insurance")) {
          const idx = parsed.indexOf("Term Insurance");
          parsed.splice(idx >= 0 ? idx : Math.max(0, parsed.length - 2), 0, "Health Insurance");
        }
        setExpenseCategories(parsed);
      } catch {}
    } else {
      if (isRajatUser) {
        setExpenseCategories(["Home", "Delhi Room", "Swarna", "Ajit", "SIP", "Health Insurance", "Term Insurance", "Travel", "Others"]);
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

    // Load category budgets
    const savedBudgets = localStorage.getItem(budgetKey);
    if (savedBudgets) {
      try {
        const parsed = JSON.parse(savedBudgets);
        if (isRajatUser && parsed["Health Insurance"] === undefined) {
          parsed["Health Insurance"] = 505;
        }
        setCategoryBudgets(parsed);
        const strForm: { [key: string]: string } = {};
        Object.keys(parsed).forEach(k => strForm[k] = String(parsed[k]));
        setBudgetForm(strForm);
      } catch {}
    } else {
      const defaultBudgets: { [key: string]: number } = isRajatUser
        ? { "Home": 25000, "Ajit": 15000, "Delhi Room": 12000, "Swarna": 8000, "SIP": 5000, "Health Insurance": 505, "Term Insurance": 1500, "Travel": 5000, "Others": 8000 }
        : { "Others": 10000 };
      setCategoryBudgets(defaultBudgets);
      localStorage.setItem(budgetKey, JSON.stringify(defaultBudgets));
      const strForm: { [key: string]: string } = {};
      Object.keys(defaultBudgets).forEach(k => strForm[k] = String(defaultBudgets[k]));
      setBudgetForm(strForm);
    }

    // Load PF settings
    const savedPf = localStorage.getItem(pfKey);
    if (savedPf) {
      try {
        const parsed = JSON.parse(savedPf);
        const isEnabled = parsed.enabled ?? isRajatUser;
        const healthDeduction = Number(parsed.healthInsuranceDeduction) || (isRajatUser ? 505 : 0);
        setPfSettings({
          enabled: isEnabled,
          employeeContribution: Number(parsed.employeeContribution) || (isRajatUser ? 1800 : 0),
          employerContribution: Number(parsed.employerContribution) || (isRajatUser ? 1800 : 0),
          healthInsuranceDeduction: healthDeduction,
          initialCorpus: Number(parsed.initialCorpus) || 0,
          startMonth: parsed.startMonth || "2024-01",
        });
        setPfForm({
          enabled: isEnabled,
          employeeContribution: String(parsed.employeeContribution ?? (isRajatUser ? "1800" : "1800")),
          employerContribution: String(parsed.employerContribution ?? (isRajatUser ? "1800" : "1800")),
          healthInsuranceDeduction: String(parsed.healthInsuranceDeduction ?? (isRajatUser ? "505" : "505")),
          initialCorpus: String(parsed.initialCorpus ?? "0"),
          startMonth: parsed.startMonth || "2024-01",
        });
      } catch {}
    } else {
      const defaultPf = {
        enabled: isRajatUser,
        employeeContribution: isRajatUser ? 1800 : 0,
        employerContribution: isRajatUser ? 1800 : 0,
        healthInsuranceDeduction: isRajatUser ? 505 : 0,
        initialCorpus: 0,
        startMonth: "2024-01",
      };
      setPfSettings(defaultPf);
      localStorage.setItem(pfKey, JSON.stringify(defaultPf));
      setPfForm({
        enabled: isRajatUser,
        employeeContribution: "1800",
        employerContribution: "1800",
        healthInsuranceDeduction: "505",
        initialCorpus: "0",
        startMonth: "2024-01",
      });
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
        const initialExp = isRajatUser ? ["Home", "Delhi Room", "Swarna", "Ajit", "SIP", "Health Insurance", "Term Insurance", "Travel", "Others"] : ["Others"];
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
      const base = isRajatUser && prev.length === 0 ? ["Home", "Delhi Room", "Swarna", "Ajit", "SIP", "Health Insurance", "Term Insurance", "Travel", "Others"] : prev;
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

  const handleSaveBudgets = (e: React.FormEvent) => {
    e.preventDefault();
    const uId = (session?.user as any)?.id || session?.user?.email || "guest";
    const budgetKey = `category_budgets_${uId}`;
    const newBudgets: { [key: string]: number } = {};
    Object.keys(budgetForm).forEach(k => {
      const num = parseFloat(budgetForm[k]);
      if (!isNaN(num) && num > 0) {
        newBudgets[k] = num;
      }
    });
    setCategoryBudgets(newBudgets);
    localStorage.setItem(budgetKey, JSON.stringify(newBudgets));
    setShowBudgetModal(false);
  };

  const handleSavePfSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const uId = (session?.user as any)?.id || session?.user?.email || "guest";
    const pfKey = `pf_settings_${uId}`;
    const isEnabled = Boolean(pfForm.enabled);
    const newPf = {
      enabled: isEnabled,
      employeeContribution: isEnabled ? (parseFloat(pfForm.employeeContribution) || 0) : 0,
      employerContribution: isEnabled ? (parseFloat(pfForm.employerContribution) || 0) : 0,
      healthInsuranceDeduction: isEnabled ? (parseFloat(pfForm.healthInsuranceDeduction) || 0) : 0,
      initialCorpus: isEnabled ? (parseFloat(pfForm.initialCorpus) || 0) : 0,
      startMonth: pfForm.startMonth || "2024-01",
    };
    setPfSettings(newPf);
    localStorage.setItem(pfKey, JSON.stringify(newPf));
    setShowPfModal(false);
  };

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

  // Helper for category styling with budget alert support
  const getCategoryTheme = (cat: string, isOver?: boolean, isNear?: boolean) => {
    if (isOver) {
      return {
        bar: "bg-red-500",
        text: "text-red-700 dark:text-red-400 font-black",
        bg: "bg-red-50 dark:bg-red-500/20",
        border: "border-red-200 dark:border-red-500/50",
        cardBg: "border-red-400 dark:border-red-500/80 bg-red-50/60 dark:bg-red-950/40 shadow-lg shadow-red-500/20",
        alert: true
      };
    }
    if (isNear) {
      return {
        bar: "bg-amber-500",
        text: "text-amber-800 dark:text-amber-400 font-bold",
        bg: "bg-amber-50 dark:bg-amber-500/15",
        border: "border-amber-200 dark:border-amber-500/40",
        cardBg: "border-amber-300 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20",
        alert: false
      };
    }
    const c = (cat || "").toLowerCase();
    if (c.includes("sip") || c.includes("mutual")) return { bar: "bg-emerald-500", text: "text-emerald-800 dark:text-emerald-400 font-bold", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", cardBg: "", alert: false };
    if (c.includes("health") || c.includes("medical") || c.includes("gmc")) return { bar: "bg-rose-500", text: "text-rose-800 dark:text-rose-400 font-bold", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-500/20", cardBg: "", alert: false };
    if (c.includes("insurance") || c.includes("term")) return { bar: "bg-cyan-500", text: "text-cyan-800 dark:text-cyan-400 font-bold", bg: "bg-cyan-50 dark:bg-cyan-500/10", border: "border-cyan-200 dark:border-cyan-500/20", cardBg: "", alert: false };
    if (c.includes("pf") || c.includes("epf")) return { bar: "bg-teal-500", text: "text-teal-800 dark:text-teal-400 font-bold", bg: "bg-teal-50 dark:bg-teal-500/10", border: "border-teal-200 dark:border-teal-500/20", cardBg: "", alert: false };
    if (c.includes("home")) return { bar: "bg-emerald-500", text: "text-emerald-800 dark:text-emerald-400 font-bold", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", cardBg: "", alert: false };
    if (c.includes("ajit")) return { bar: "bg-blue-500", text: "text-blue-800 dark:text-blue-400 font-bold", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", cardBg: "", alert: false };
    if (c.includes("swarna")) return { bar: "bg-purple-500", text: "text-purple-800 dark:text-purple-400 font-bold", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20", cardBg: "", alert: false };
    if (c.includes("delhi") || c.includes("room")) return { bar: "bg-amber-500", text: "text-amber-800 dark:text-amber-400 font-bold", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20", cardBg: "", alert: false };
    if (c.includes("travel")) return { bar: "bg-sky-500", text: "text-sky-800 dark:text-sky-400 font-bold", bg: "bg-sky-50 dark:bg-sky-500/10", border: "border-sky-200 dark:border-sky-500/20", cardBg: "", alert: false };
    return { bar: "bg-indigo-500", text: "text-indigo-800 dark:text-indigo-400 font-bold", bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-200 dark:border-indigo-500/20", cardBg: "", alert: false };
  };

  // Timezone-safe date parser to prevent UTC midnight shifts on YYYY-MM-DD
  const parseTxDate = (dateVal: any) => {
    if (!dateVal) return { year: 1970, month: 0, day: 1, dateStr: "1970-01-01" };
    if (typeof dateVal === "string") {
      const clean = dateVal.split("T")[0];
      const parts = clean.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1; // 0-indexed (0=Jan, 7=Aug, 8=Sep)
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return { year: y, month: m, day: d, dateStr: clean };
        }
      }
    }
    const d = new Date(dateVal);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    return {
      year: y,
      month: m,
      day: day,
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    };
  };

  // 1. Filter expenses by selected Month, Year or Date Range
  const monthlyExpenses = expenses.filter((exp) => {
    const tx = parseTxDate(exp.date);
    if (filterMode === "range") {
      const start = startDate || "1970-01-01";
      const end = endDate || "2999-12-31";
      return tx.dateStr >= start && tx.dateStr <= end;
    }
    const monthMatches = selectedMonth === -1 || tx.month === selectedMonth;
    const yearMatches = selectedYear === -1 || tx.year === selectedYear;
    return monthMatches && yearMatches;
  });

  // Calculate prior transactions before the active filter period to carry forward savings
  const previousExpenses = expenses.filter((exp) => {
    const tx = parseTxDate(exp.date);
    if (filterMode === "range") {
      if (!startDate) return false;
      return tx.dateStr < startDate;
    }
    if (selectedMonth === -1 && selectedYear === -1) {
      return false; // Lifetime view
    }
    if (selectedMonth === -1 && selectedYear !== -1) {
      return tx.year < selectedYear;
    }
    if (selectedYear === -1 && selectedMonth !== -1) {
      return false;
    }
    return tx.year < selectedYear || (tx.year === selectedYear && tx.month < selectedMonth);
  });

  const prevIncomeTotal = previousExpenses.filter(e => e.type === "Income").reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const prevExpenseTotal = previousExpenses.filter(e => e.type === "Expense").reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const previousBalance = prevIncomeTotal - prevExpenseTotal;

  // 2. Calculations based on Monthly/Yearly/Range data
  const incomeTotal = monthlyExpenses.filter(e => e.type === "Income").reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const expenseTotal = monthlyExpenses.filter(e => e.type === "Expense").reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const currentPeriodBalance = incomeTotal - expenseTotal;
  const newSavingBalance = previousBalance + currentPeriodBalance;

  // Dynamically compute sum & percentage for all active categories with budget evaluations
  const categoryTotals = expenseCategories.map(cat => {
    const total = monthlyExpenses
      .filter(e => e.type === "Expense" && ((e.category || "").toLowerCase().includes(cat.toLowerCase()) || (e.description || "").toLowerCase().includes(cat.toLowerCase())))
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const budget = Number(categoryBudgets[cat]) || 0;
    const percentage = expenseTotal > 0 ? (total / expenseTotal) * 100 : 0;
    const incomeShare = incomeTotal > 0 ? (total / incomeTotal) * 100 : 0;
    const isOverBudget = budget > 0 && total > budget;
    const isNearBudget = budget > 0 && !isOverBudget && total >= budget * 0.85;
    const overAmount = Math.max(0, total - budget);
    const remainingBudget = Math.max(0, budget - total);
    const budgetPercentage = budget > 0 ? (total / budget) * 100 : 0;
    const overflowPercentage = budget > 0 && total > budget ? ((total - budget) / budget) * 100 : 0;
    return {
      category: cat,
      total,
      budget,
      percentage,
      incomeShare,
      isOverBudget,
      isNearBudget,
      overAmount,
      remainingBudget,
      budgetPercentage,
      overflowPercentage
    };
  }).filter(item => {
    if (isRajat) {
      return item.total > 0 || item.budget > 0 || ["Home", "Ajit", "Swarna", "Delhi Room", "SIP", "Health Insurance", "Term Insurance"].includes(item.category);
    }
    return item.total > 0 || item.budget > 0;
  });

  const overBudgetCategories = categoryTotals.filter(c => c.isOverBudget);

  // Wealth & Investments Calculations
  const currentMonthSIP = monthlyExpenses
    .filter(e => e.type === "Expense" && ((e.category || "").toLowerCase().includes("sip") || (e.category || "").toLowerCase().includes("mutual") || (e.description || "").toLowerCase().includes("sip") || (e.description || "").toLowerCase().includes("mutual")))
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const lifetimeSIP = expenses
    .filter(e => e.type === "Expense" && ((e.category || "").toLowerCase().includes("sip") || (e.category || "").toLowerCase().includes("mutual") || (e.description || "").toLowerCase().includes("sip") || (e.description || "").toLowerCase().includes("mutual")))
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const currentMonthInsurance = monthlyExpenses
    .filter(e => e.type === "Expense" && ((e.category || "").toLowerCase().includes("insurance") || (e.category || "").toLowerCase().includes("term") || (e.category || "").toLowerCase().includes("health") || (e.category || "").toLowerCase().includes("medical") || (e.category || "").toLowerCase().includes("gmc") || (e.description || "").toLowerCase().includes("insurance") || (e.description || "").toLowerCase().includes("term") || (e.description || "").toLowerCase().includes("lic") || (e.description || "").toLowerCase().includes("health") || (e.description || "").toLowerCase().includes("gmc")))
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const lifetimeInsurance = expenses
    .filter(e => e.type === "Expense" && ((e.category || "").toLowerCase().includes("insurance") || (e.category || "").toLowerCase().includes("term") || (e.category || "").toLowerCase().includes("health") || (e.category || "").toLowerCase().includes("medical") || (e.category || "").toLowerCase().includes("gmc") || (e.description || "").toLowerCase().includes("insurance") || (e.description || "").toLowerCase().includes("term") || (e.description || "").toLowerCase().includes("lic") || (e.description || "").toLowerCase().includes("health") || (e.description || "").toLowerCase().includes("gmc")))
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Provident Fund (PF / EPF) Calculations
  // Monthly Total PF = Employee Share (₹1800) + Employer Share (₹1800) = ₹3600/month
  const monthlyTotalPF = (Number(pfSettings.employeeContribution) || 0) + (Number(pfSettings.employerContribution) || 0);

  // Calculate number of active months since startMonth for PF compounding
  const calculatePfMonths = () => {
    try {
      const start = pfSettings.startMonth ? new Date(pfSettings.startMonth + "-01") : new Date("2024-01-01");
      const now = new Date();
      const monthsDiff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
      return Math.max(1, monthsDiff);
    } catch {
      return 12;
    }
  };
  const activePfMonths = calculatePfMonths();
  const totalAccumulatedPF = (activePfMonths * monthlyTotalPF) + (Number(pfSettings.initialCorpus) || 0);

  // Total Net Worth = Liquid Net Savings + Lifetime SIP + Accumulated PF Corpus
  const totalNetWorth = newSavingBalance + lifetimeSIP + totalAccumulatedPF;

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

    const prevList = scope === "current" ? previousExpenses : [];
    const openingBal = prevList
      .filter((e) => e.type === "Income")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) -
      prevList
        .filter((e) => e.type === "Expense")
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const cumulativeBal = openingBal + netBal;

    return {
      targetName,
      typeFilter: typeToFilter,
      periodLabel,
      transactions: sorted,
      totalCount: sorted.length,
      totalExpense: totalExp,
      totalIncome: totalInc,
      netBalance: netBal,
      openingBalance: openingBal,
      cumulativeBalance: cumulativeBal,
      categoryBreakdown: categoryTotals,
    };
  };

  const handleExportExcel = (scope: "current" | "all", customType: "All" | "Income" | "Expense" = statementType) => {
    const data = getExportData(scope, customType);
    if (data.transactions.length === 0) {
      alert(`No transactions found for ${data.targetName} (${data.periodLabel}).`);
      return;
    }

    const wb = XLSX.utils.book_new();

    // Metadata Header with Person, Rolling Savings & Category Breakdown Details
    const wsData: any[][] = [
      ["PERSONAL LEDGER - TRANSACTION STATEMENT"],
      [],
      ["Statement Subject / Person:", data.targetName],
      ["Period / Scope:", data.periodLabel],
      ["Generated Date:", new Date().toLocaleString()],
      ["Total Transactions:", data.totalCount],
      ["Opening / Previous Balance (INR):", data.openingBalance],
      ["Total Inflow / Income (INR):", data.totalIncome],
      ["Total Outflow / Expense (INR):", data.totalExpense],
      ["Current Period Net Cash Flow (INR):", data.netBalance],
      ["Closing / New Saving Balance (INR):", data.cumulativeBalance],
      ["Savings Rollover Formula:", `Previous (₹${data.openingBalance}) + Current Net (₹${data.netBalance}) = Closing Savings (₹${data.cumulativeBalance})`],
      [],
      ["CATEGORY SPEND & SHARE BREAKDOWN"],
      ["Category Name", "Outflow (INR)", "% of Total Outflow", "% of Total Inflow"]
    ];

    data.categoryBreakdown.forEach((cat) => {
      wsData.push([
        cat.category,
        cat.total,
        `${cat.percentage.toFixed(1)}%`,
        data.totalIncome > 0 ? `${cat.incomeShare.toFixed(1)}%` : "N/A"
      ]);
    });

    wsData.push([]);
    wsData.push(["DETAILED TRANSACTION LOGS"]);
    wsData.push(["Date", "Description / Purpose", "Category / Person", "Type", "Amount (INR)"]);

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
    wsData.push(["Current Period Net", "", "", "", data.netBalance]);
    wsData.push(["Opening Previous Balance", "", "", "", data.openingBalance]);
    wsData.push(["Closing New Saving Balance", "", "", "", data.cumulativeBalance]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set Column Widths
    ws["!cols"] = [
      { wch: 18 }, // Date / Category
      { wch: 40 }, // Description / Outflow
      { wch: 22 }, // Category / % Outflow
      { wch: 18 }, // Type / % Inflow
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

    const categoryLines = data.categoryBreakdown.map(
      (c) => `# Category: ${c.category}, Spend: ₹${c.total}, Share: ${c.percentage.toFixed(1)}% of Outflow`
    ).join("\n");

    const metaComments = [
      `# PERSONAL LEDGER - TRANSACTION STATEMENT`,
      `# Subject / Person: ${data.targetName}`,
      `# Scope: ${data.periodLabel}`,
      `# Generated On: ${new Date().toLocaleString()}`,
      `# Total Transactions: ${data.totalCount}`,
      `# Opening / Previous Balance: ₹${data.openingBalance}`,
      `# Total Inflow (Income): +₹${data.totalIncome}`,
      `# Total Outflow (Expense): -₹${data.totalExpense}`,
      `# Current Period Net: ₹${data.netBalance}`,
      `# Closing / New Saving Balance: ₹${data.cumulativeBalance}`,
      `# Equation: Previous (₹${data.openingBalance}) + Current Net (₹${data.netBalance}) = Closing Savings (₹${data.cumulativeBalance})`,
      `# --- Category Spend Distribution ---`,
      categoryLines,
      ``
    ].join("\n");

    const csvContent = metaComments + headers.join(",") + "\n" + rows.join("\n") + `\nTotal Inflow,,,,${data.totalIncome}\nTotal Outflow,,,,-${data.totalExpense}\nPeriod Net Balance,,,,${data.netBalance}\nOpening Balance,,,,${data.openingBalance}\nNew Saving Balance,,,,${data.cumulativeBalance}`;
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
          {/* Header & Month Selector & Quick Modals */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="page-heading text-xl font-black uppercase tracking-widest text-slate-900 dark:text-slate-200">Personal Ledger</h2>
              <p className="page-subheading text-xs text-slate-500 uppercase tracking-wider mt-0.5">Manage cash flows, category budgets & wealth assets</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Category Budgets & PF Settings Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                    overBudgetCategories.length > 0
                      ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                      : "bg-white/[0.02] light:bg-white text-indigo-400 border-indigo-500/20 hover:border-indigo-500/40"
                  }`}
                  title="Configure monthly budget targets"
                >
                  <SlidersHorizontal size={12} className={overBudgetCategories.length > 0 ? "text-red-400" : "text-indigo-400"} />
                  <span>Budgets {overBudgetCategories.length > 0 && `(${overBudgetCategories.length} Alert)`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPfModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                  title="Configure Provident Fund (PF) and SIP settings"
                >
                  <PiggyBank size={12} className="text-teal-400" />
                  <span>PF & Wealth</span>
                </button>
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
          </div>

          {/* ── 🔴 RED ALERT BANNER (If Any Category Exceeds Monthly Budget) ── */}
          {overBudgetCategories.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-500/40 shadow-xl shadow-red-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/30 flex-shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5">
                    <span>🔴 RED ALERT: {overBudgetCategories.length} {overBudgetCategories.length === 1 ? "Category" : "Categories"} Over Budget ({getContextLabel()})</span>
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {overBudgetCategories.map((c) => (
                      <span key={c.category} className="text-[10px] font-mono text-slate-900 dark:text-slate-200 bg-white dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-2 py-0.5 rounded-lg shadow-sm">
                        <strong className="text-red-700 dark:text-red-400 font-black">{c.category}:</strong> ₹{c.total.toLocaleString()} / ₹{c.budget.toLocaleString()} (+{c.overflowPercentage.toFixed(0)}% Overflow • {c.budgetPercentage.toFixed(0)}% Budget • {c.incomeShare.toFixed(1)}% Income • +₹{c.overAmount.toLocaleString()} over)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBudgetModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto shadow-lg shadow-red-500/20"
              >
                Adjust Budgets
              </button>
            </div>
          )}

          {/* Grid Overview Cards (Filtered by selected Month & Year, horizontally scrollable on mobile with native momentum) */}
          <div className="flex overflow-x-auto lg:grid lg:grid-cols-7 gap-3.5 mb-6 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none snap-x snap-mandatory touch-pan-x overscroll-x-contain">
            {/* Income Card */}
            <div
              onClick={() => handleCardFilter("Income", null, "Income")}
              className={`p-3.5 rounded-xl cursor-pointer flex-shrink-0 w-[155px] min-w-[155px] sm:w-auto snap-start mini-3d-card transition-all active:scale-[0.98] ${
                activeFilter.type === "Income" && !activeFilter.category
                  ? "mini-3d-card-active-income"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <TrendingUp size={10} />
                  <span>Income</span>
                </span>
                <span className="text-[8px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 px-1.5 py-0.5 rounded">
                  Inflow
                </span>
              </div>
              <h3 className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1">₹{incomeTotal.toLocaleString()}</h3>
              <div className="mt-1.5 pt-1 border-t border-slate-200 dark:border-white/5 space-y-0.5 text-[8px] font-mono text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Total Inflow</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">100%</span>
                </div>
                <div className="text-[7.5px] truncate">
                  {getContextLabel()}
                </div>
              </div>
            </div>

            {/* Outflow Card with Total % of Income */}
            <div
              onClick={() => handleCardFilter("Expense", null, "Outflow")}
              className={`p-3.5 rounded-xl cursor-pointer flex-shrink-0 w-[155px] min-w-[155px] sm:w-auto snap-start mini-3d-card transition-all active:scale-[0.98] ${
                activeFilter.type === "Expense" && !activeFilter.category
                  ? "mini-3d-card-active-expense"
                  : ""
              }`}
              title={`Total Outflow: ₹${expenseTotal.toLocaleString()} (${incomeTotal > 0 ? ((expenseTotal / incomeTotal) * 100).toFixed(1) : 0}% of Monthly Income)`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest text-red-700 dark:text-red-400 font-bold flex items-center gap-1">
                  <TrendingDown size={10} />
                  <span>Outflow</span>
                </span>
                {incomeTotal > 0 && (
                  <span className="text-[8px] font-mono font-black text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-500/40 px-1.5 py-0.5 rounded">
                    {((expenseTotal / incomeTotal) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black font-mono text-red-700 dark:text-red-400 mt-1">₹{expenseTotal.toLocaleString()}</h3>
              <div className="mt-1.5 pt-1 border-t border-slate-200 dark:border-white/5 space-y-0.5 text-[8px] font-mono text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>% of Inflow:</span>
                  <span className="font-bold text-red-700 dark:text-red-400">
                    {incomeTotal > 0 ? `${((expenseTotal / incomeTotal) * 100).toFixed(1)}%` : "0%"}
                  </span>
                </div>
                <div className="text-[7.5px] truncate">
                  {getContextLabel()}
                </div>
              </div>
            </div>

            {/* Net Savings / Rollover Card */}
            <div
              onClick={() => handleCardFilter(null, null, "All")}
              className={`p-3.5 rounded-xl cursor-pointer flex-shrink-0 w-[170px] min-w-[170px] sm:w-auto snap-start mini-3d-card relative group transition-all active:scale-[0.98] ${
                !activeFilter.type && !activeFilter.category
                  ? "mini-3d-card-active-savings"
                  : ""
              }`}
              title={`Net Savings (${getContextLabel()}): ₹${currentPeriodBalance.toLocaleString()} (${incomeTotal > 0 ? ((currentPeriodBalance / incomeTotal) * 100).toFixed(1) : 0}% of Income) | Cumulative Savings Pool: ₹${newSavingBalance.toLocaleString()}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest text-indigo-700 dark:text-indigo-400 font-bold flex items-center gap-1">
                  <Wallet size={10} />
                  <span>Net Savings</span>
                </span>
                <div className="flex items-center gap-1">
                  {incomeTotal > 0 && (
                    <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded ${
                      currentPeriodBalance >= 0
                        ? "text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40"
                        : "text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-500/40"
                    }`}>
                      {currentPeriodBalance >= 0 ? "+" : ""}{((currentPeriodBalance / incomeTotal) * 100).toFixed(1)}%
                    </span>
                  )}
                  {previousBalance !== 0 && (
                    <span className="text-[7.5px] font-mono font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-500/30 px-1 py-0.5 rounded" title="Includes previous savings rollover">
                      Roll
                    </span>
                  )}
                </div>
              </div>
              <h3 className={`text-lg font-black font-mono mt-1 ${currentPeriodBalance >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                {currentPeriodBalance >= 0 ? "+" : ""}₹{currentPeriodBalance.toLocaleString()}
              </h3>
              <div className="mt-1.5 pt-1 border-t border-slate-200 dark:border-white/5 space-y-0.5 text-[8px] font-mono">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Cumulative Pool:</span>
                  <span className={`font-bold ${newSavingBalance >= 0 ? "text-slate-900 dark:text-slate-100" : "text-red-700 dark:text-red-400"}`}>
                    ₹{newSavingBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[7.5px] text-slate-500 dark:text-slate-400">
                  <span>{incomeTotal > 0 ? `${((currentPeriodBalance / incomeTotal) * 100).toFixed(1)}% Saved` : "0% Saved"}</span>
                  <span className="truncate ml-1">Prev: {previousBalance >= 0 ? "+" : ""}₹{previousBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Category Spend Cards with Income % Badges & Budget Status */}
            {categoryTotals.map((item) => {
              const theme = getCategoryTheme(item.category, item.isOverBudget, item.isNearBudget);
              return (
                <div
                  key={item.category}
                  onClick={() => handleCardFilter(null, item.category, item.category)}
                  className={`p-3.5 rounded-xl cursor-pointer flex-shrink-0 w-[170px] min-w-[170px] sm:w-auto snap-start mini-3d-card transition-all active:scale-[0.98] ${
                    item.isOverBudget ? theme.cardBg : ""
                  } ${
                    activeFilter.category === item.category
                      ? "mini-3d-card-active-category ring-2 ring-indigo-500"
                      : ""
                  }`}
                  title={`${item.category}: ₹${item.total.toLocaleString()} | ${item.incomeShare.toFixed(1)}% of Monthly Income | Budget: ₹${item.budget.toLocaleString()} ${item.isOverBudget ? `(+${item.overflowPercentage.toFixed(0)}% Over Budget Limit)` : ""}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-slate-700 dark:text-slate-400 font-bold truncate pr-1">{item.category}</span>
                    {item.isOverBudget ? (
                      <span className="text-[8px] font-mono font-black text-white bg-red-600 border border-red-700 px-1.5 py-0.5 rounded uppercase shadow-sm whitespace-nowrap" title={`+${item.overflowPercentage.toFixed(1)}% over ₹${item.budget.toLocaleString()} budget limit (${item.incomeShare.toFixed(1)}% of Income)`}>
                        +{item.overflowPercentage.toFixed(0)}% OVER
                      </span>
                    ) : (
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${theme.bg} ${theme.border} ${theme.text}`}>
                        {item.incomeShare > 0 ? `${item.incomeShare.toFixed(1)}%` : `${item.percentage.toFixed(1)}%`}
                      </span>
                    )}
                  </div>

                  <h3 className={`text-lg font-black font-mono mt-1 ${item.isOverBudget ? "text-red-700 dark:text-red-400" : "mini-3d-card-value text-slate-900 dark:text-slate-100"}`}>
                    ₹{item.total.toLocaleString()}
                  </h3>

                  {/* Structured 2-line detail for mobile & desktop */}
                  <div className="mt-1.5 pt-1 border-t border-slate-200 dark:border-white/5 space-y-0.5 text-[8px] font-mono">
                    <div className="flex items-center justify-between">
                      {item.isOverBudget ? (
                        <span className="text-red-700 dark:text-red-400 font-bold truncate">
                          +₹{item.overAmount.toLocaleString()} over limit
                        </span>
                      ) : item.budget > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                          ₹{item.remainingBudget.toLocaleString()} left
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400 truncate">
                          {item.percentage.toFixed(0)}% of Outflow
                        </span>
                      )}

                      {item.budget > 0 && (
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-[7.5px] ml-1 whitespace-nowrap">
                          (Lim: ₹{item.budget.toLocaleString()})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[7.5px] text-slate-600 dark:text-slate-400">
                      <span>{item.incomeShare > 0 ? `${item.incomeShare.toFixed(1)}% of Income` : `${item.percentage.toFixed(1)}% of Outflow`}</span>
                      {item.isOverBudget && (
                        <span className="text-red-700 dark:text-red-400 font-bold">
                          +{item.overflowPercentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>

          {/* ── 🏛️ WEALTH, INVESTMENTS & PROVIDENT FUND (PF) HUB ── */}
          <div className="glass-card card-glow-teal p-5 rounded-2xl border border-teal-200 dark:border-teal-500/20 mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-500/10 border border-teal-300 dark:border-teal-500/20 text-teal-700 dark:text-teal-400">
                  <Landmark size={15} />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <span>Wealth, Investments & Provident Fund (PF) Hub</span>
                    <span className="text-[9px] font-mono font-bold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-500/40 px-2 py-0.5 rounded-full uppercase">
                      Asset Growth
                    </span>
                  </h4>
                  <p className="text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-medium">
                    Track long-term wealth: SIP Mutual Funds, Term & Health Insurance, and Employer Matched PF (kept separate from liquid savings)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPfModal(true)}
                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 bg-teal-100 hover:bg-teal-200 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 border border-teal-300 dark:border-teal-500/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  <Settings2 size={11} />
                  <span>{pfSettings.enabled ? "Configure PF / Deductions" : "+ Enable PF & Deductions"}</span>
                </button>
              </div>
            </div>

            {/* 4 Wealth Portfolio KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Liquid Cumulative Savings (Pure Cash, Never mixed with PF) */}
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-purple-800 dark:text-purple-400 flex items-center gap-1">
                      <Wallet size={11} />
                      <span>Liquid Net Savings</span>
                    </span>
                    <span className="text-[8px] font-mono font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 rounded">
                      {incomeTotal > 0 ? `${currentPeriodBalance >= 0 ? "+" : ""}${((currentPeriodBalance / incomeTotal) * 100).toFixed(1)}% Saved` : getContextLabel()}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h3 className={`text-xl font-black font-mono ${currentPeriodBalance >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                      {currentPeriodBalance >= 0 ? "+" : ""}₹{currentPeriodBalance.toLocaleString()}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-semibold">
                      (Pool: ₹{newSavingBalance.toLocaleString()})
                    </span>
                  </div>
                </div>
                <p className="text-[8px] font-mono text-slate-600 dark:text-slate-400 mt-2 truncate">
                  Prev: {previousBalance >= 0 ? "+" : ""}₹{previousBalance.toLocaleString()} | Rate: {incomeTotal > 0 ? `${((currentPeriodBalance / incomeTotal) * 100).toFixed(1)}%` : "0%"} ({getContextLabel()})
                </p>
              </div>

              {/* SIP & Mutual Funds */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp size={11} />
                    <span>SIP & Mutual Funds</span>
                  </span>
                  <h3 className="text-xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                    ₹{lifetimeSIP.toLocaleString()}
                  </h3>
                </div>
                <p className="text-[8px] font-mono text-slate-600 dark:text-slate-400 mt-2">
                  {currentMonthSIP > 0 ? `+₹${currentMonthSIP.toLocaleString()} logged in ${getContextLabel()}` : "Monthly wealth creation"}
                </p>
              </div>

              {/* Provident Fund (PF / EPF) - Dynamic & Opt-In */}
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                pfSettings.enabled
                  ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-500/20"
                  : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 opacity-80"
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-800 dark:text-indigo-400 flex items-center gap-1">
                      <Building size={11} />
                      <span>Provident Fund (PF)</span>
                    </span>
                    {pfSettings.enabled ? (
                      <span className="text-[8px] font-mono font-bold text-indigo-800 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-1.5 py-0.5 rounded">
                        ₹{monthlyTotalPF}/mo
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono text-slate-600 dark:text-slate-400 bg-slate-200/60 dark:bg-white/5 px-1.5 py-0.5 rounded">
                        Optional
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                    {pfSettings.enabled ? `₹${totalAccumulatedPF.toLocaleString()}` : "Not Active"}
                  </h3>
                </div>
                <p className="text-[8px] font-mono text-slate-600 dark:text-slate-400 mt-2">
                  {pfSettings.enabled ? (
                    `₹${pfSettings.employeeContribution} (You) + ₹${pfSettings.employerContribution} (Co.) × ${activePfMonths} mos (Locked Fund)`
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPfModal(true)}
                      className="text-teal-700 dark:text-teal-400 hover:underline cursor-pointer font-bold"
                    >
                      + Turn on PF tracking
                    </button>
                  )}
                </p>
              </div>

              {/* Term & Health Insurance Protection */}
              <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-800 dark:text-cyan-400 flex items-center gap-1">
                      <Shield size={11} />
                      <span>Insurance & Health</span>
                    </span>
                    <span className="text-[8px] font-mono font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/40 border border-cyan-200 dark:border-cyan-800 px-1.5 py-0.5 rounded">
                      ₹{((Number(categoryBudgets["Term Insurance"]) || 1500) + (Number(categoryBudgets["Health Insurance"]) || Number(pfSettings.healthInsuranceDeduction) || 505)).toLocaleString()}/mo
                    </span>
                  </div>
                  <h3 className="text-xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                    ₹{lifetimeInsurance.toLocaleString()}
                  </h3>
                </div>
                <p className="text-[8px] font-mono text-slate-600 dark:text-slate-400 mt-2">
                  {currentMonthInsurance > 0
                    ? `₹${currentMonthInsurance.toLocaleString()} premium logged in ${getContextLabel()}`
                    : `Term ₹${categoryBudgets["Term Insurance"] || 1500}/mo + Health ₹${categoryBudgets["Health Insurance"] || pfSettings.healthInsuranceDeduction || 505}/mo (GMC)`}
                </p>
              </div>
            </div>
          </div>

          {/* ── Visual Category & Share Allocation Bar & Rolling Savings Info Banner ── */}
          <div className="glass-card p-5 rounded-2xl border border-white/5 mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <PieChart size={14} />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 light:text-slate-800">
                    Category Allocation & Outflow Shares ({getContextLabel()})
                  </h4>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500">
                    Percentage-wise distribution of total ₹{expenseTotal.toLocaleString()} expenses
                  </p>
                </div>
              </div>

              {/* Rolling Savings Balance Info Badge */}
              <div className="flex items-center gap-2 bg-indigo-950/40 light:bg-indigo-50 border border-indigo-500/20 px-3 py-1.5 rounded-xl font-mono text-[10px]">
                <Info size={13} className="text-indigo-400 flex-shrink-0" />
                <span className="text-slate-300 light:text-slate-700">
                  Prev: <strong className={previousBalance >= 0 ? "text-slate-200 light:text-slate-900" : "text-red-400"}>₹{previousBalance.toLocaleString()}</strong> + Curr: <strong className={currentPeriodBalance >= 0 ? "text-emerald-400 light:text-emerald-600" : "text-red-400"}>₹{currentPeriodBalance.toLocaleString()}</strong> = <strong className="text-indigo-400 light:text-indigo-600 font-bold">₹{newSavingBalance.toLocaleString()} (New Saving Balance)</strong>
                </span>
              </div>
            </div>

            {/* Segmented Stacked Progress Bar */}
            {expenseTotal > 0 ? (
              <div className="space-y-3">
                <div className="w-full bg-white/5 light:bg-slate-200 h-3 rounded-full overflow-hidden flex shadow-inner">
                  {categoryTotals.map((item) => {
                    const theme = getCategoryTheme(item.category, item.isOverBudget, item.isNearBudget);
                    if (item.total <= 0) return null;
                    return (
                      <div
                        key={item.category}
                        style={{ width: `${Math.max(item.percentage, 1)}%` }}
                        className={`${theme.bar} h-full transition-all duration-300 relative group cursor-pointer`}
                        title={`${item.category}: ₹${item.total.toLocaleString()} (${item.percentage.toFixed(1)}%) ${item.isOverBudget ? "⚠️ OVER BUDGET" : ""}`}
                        onClick={() => handleCardFilter(null, item.category, item.category)}
                      />
                    );
                  })}
                </div>

                {/* Category Chips with Live % Allocation & Red Alert Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {categoryTotals.map((item) => {
                    const theme = getCategoryTheme(item.category, item.isOverBudget, item.isNearBudget);
                    const isFiltered = activeFilter.category === item.category;
                    return (
                      <button
                        key={item.category}
                        type="button"
                        onClick={() => handleCardFilter(null, item.category, item.category)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[10px] font-mono transition-all cursor-pointer ${
                          item.isOverBudget
                            ? "bg-red-500/20 text-red-300 border-red-500/50 shadow-md shadow-red-500/20"
                            : isFiltered
                            ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/20"
                            : `${theme.bg} ${theme.border} hover:border-white/20 text-slate-300 light:text-slate-800`
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${theme.bar}`} />
                        <span className="font-bold font-sans uppercase text-[9px]">{item.category}</span>
                        <span className="font-black text-slate-200 light:text-slate-900">₹{item.total.toLocaleString()}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.isOverBudget ? "bg-red-500 text-white" : isFiltered ? "bg-white/20 text-white" : `${theme.bg} ${theme.text}`}`}>
                          {item.isOverBudget ? `⚠️ ${item.incomeShare.toFixed(1)}% Inc` : `${item.incomeShare > 0 ? item.incomeShare.toFixed(1) : item.percentage.toFixed(1)}%`}
                        </span>
                      </button>
                    );
                  })}

                  {activeFilter.category && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter({ type: null, category: null, label: "All" })}
                      className="text-[9px] uppercase tracking-wider font-bold text-slate-500 hover:text-slate-300 light:hover:text-slate-700 underline ml-2 cursor-pointer"
                    >
                      Clear Category Filter
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-2">
                No expense outflow recorded for {getContextLabel()} to display percentage breakdown.
              </div>
            )}
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
                  <div className="statement-kpi-grid grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="statement-kpi-card p-3 rounded-xl bg-white/[0.02] light:bg-slate-50 border border-white/5 light:border-slate-200">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Opening Balance</span>
                      <p className={`text-base font-black font-mono mt-1 ${stmtData.openingBalance >= 0 ? "text-slate-200 light:text-slate-800" : "text-red-400 light:text-red-600"}`}>
                        ₹{stmtData.openingBalance.toLocaleString()}
                      </p>
                    </div>
                    <div className="statement-kpi-card p-3 rounded-xl bg-emerald-950/10 light:bg-emerald-50 border border-emerald-500/10 light:border-emerald-200">
                      <span className="text-[9px] uppercase tracking-wider text-emerald-400 light:text-emerald-600 font-bold">Total Inflow</span>
                      <p className="text-base font-black font-mono text-emerald-400 light:text-emerald-600 mt-1">₹{stmtData.totalIncome.toLocaleString()}</p>
                    </div>
                    <div className="statement-kpi-card p-3 rounded-xl bg-red-950/10 light:bg-red-50 border border-red-500/10 light:border-red-200">
                      <span className="text-[9px] uppercase tracking-wider text-red-400 light:text-red-600 font-bold">Total Outflow</span>
                      <p className="text-base font-black font-mono text-red-400 light:text-red-600 mt-1">₹{stmtData.totalExpense.toLocaleString()}</p>
                    </div>
                    <div className="statement-kpi-card p-3 rounded-xl bg-purple-950/10 light:bg-purple-50 border border-purple-500/10 light:border-purple-200">
                      <span className="text-[9px] uppercase tracking-wider text-purple-400 light:text-purple-600 font-bold">Period Net</span>
                      <p className={`text-base font-black font-mono mt-1 ${stmtData.netBalance >= 0 ? "text-purple-400 light:text-purple-600" : "text-red-400 light:text-red-600"}`}>
                        ₹{stmtData.netBalance.toLocaleString()}
                      </p>
                    </div>
                    <div className="statement-kpi-card p-3 rounded-xl bg-indigo-950/10 light:bg-indigo-50 border border-indigo-500/10 light:border-indigo-200 col-span-2 sm:col-span-1">
                      <span className="text-[9px] uppercase tracking-wider text-indigo-400 light:text-indigo-600 font-bold">Closing Balance</span>
                      <p className={`text-base font-black font-mono mt-1 ${stmtData.cumulativeBalance >= 0 ? "text-emerald-400 light:text-emerald-600" : "text-red-400 light:text-red-600"}`}>
                        ₹{stmtData.cumulativeBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Savings Rollover Formula Banner */}
                  <div className="p-3 rounded-xl bg-indigo-500/5 light:bg-indigo-50/60 border border-indigo-500/15 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="text-slate-400 light:text-slate-600 font-bold uppercase tracking-wider">
                      Savings Rollover Formula:
                    </span>
                    <span className="text-slate-200 light:text-slate-800">
                      Opening (₹{stmtData.openingBalance.toLocaleString()}) + Period Net (₹{stmtData.netBalance.toLocaleString()}) = <strong className="text-indigo-400 light:text-indigo-600 font-bold">₹{stmtData.cumulativeBalance.toLocaleString()} (Closing Savings)</strong>
                    </span>
                  </div>

                  {/* Category Spend Breakdown in Statement */}
                  {stmtData.categoryBreakdown && stmtData.categoryBreakdown.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 light:text-slate-600">
                        Category Spend & % Share Breakdown
                      </h4>
                      <div className="table-print-wrapper overflow-x-auto rounded-xl border border-white/10 light:border-slate-200">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-white/[0.03] light:bg-slate-100 border-b border-white/10 light:border-slate-200 text-[9px] uppercase tracking-wider text-slate-400 light:text-slate-600 font-mono">
                              <th className="py-2 px-3">Category</th>
                              <th className="py-2 px-3 text-right">Spend Amount (₹)</th>
                              <th className="py-2 px-3 text-right">% of Total Outflow</th>
                              <th className="py-2 px-3 text-right">% of Total Inflow</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 light:divide-slate-200 font-mono">
                            {stmtData.categoryBreakdown.map((cat) => (
                              <tr key={cat.category} className="hover:bg-white/[0.02] light:hover:bg-slate-50">
                                <td className="py-2 px-3 text-slate-200 light:text-slate-900 font-semibold">{cat.category}</td>
                                <td className="py-2 px-3 text-right text-slate-100 light:text-slate-900 font-bold">₹{cat.total.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right text-indigo-400 light:text-indigo-600 font-bold">{cat.percentage.toFixed(1)}%</td>
                                <td className="py-2 px-3 text-right text-slate-400 light:text-slate-600">{stmtData.totalIncome > 0 ? `${cat.incomeShare.toFixed(1)}%` : "N/A"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

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

        {/* ── 🏷️ CATEGORY BUDGETS CONFIGURATION MODAL (Red Alert Management) ── */}
        {showBudgetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="glass-card bg-white dark:bg-[#0a0a14] border border-slate-200 dark:border-indigo-500/30 rounded-3xl max-w-xl w-full max-h-[88vh] shadow-2xl shadow-indigo-950/20 dark:shadow-indigo-950/60 flex flex-col overflow-hidden">
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <SlidersHorizontal size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Monthly Category Budgets</span>
                      <span className="text-[9px] font-mono font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-500/40 px-2 py-0.5 rounded-full uppercase">
                        Red Alert Limit
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                      Set max monthly spend. Exceeding triggers Crimson Red alerts across UI.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveBudgets} className="flex flex-col flex-grow overflow-hidden">
                <div className="p-6 overflow-y-auto flex-grow max-h-[60vh] space-y-4 budget-modal-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {expenseCategories.map((cat) => {
                      const currentSpend = categoryTotals.find(c => c.category === cat)?.total || 0;
                      const val = budgetForm[cat] ?? (categoryBudgets[cat] ? String(categoryBudgets[cat]) : "");
                      const numVal = parseFloat(val) || 0;
                      const isOver = numVal > 0 && currentSpend > numVal;
                      const budgetPct = numVal > 0 ? ((currentSpend / numVal) * 100).toFixed(0) : "0";

                      return (
                        <div
                          key={cat}
                          className={`p-3 rounded-2xl border transition-all ${
                            isOver
                              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-500/40"
                              : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                              {cat}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                              Spend: <strong className={isOver ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>₹{currentSpend.toLocaleString()}</strong>
                            </span>
                          </div>

                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-xs font-mono font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="100"
                              placeholder="e.g. 15000"
                              value={val}
                              onChange={(e) => setBudgetForm(prev => ({ ...prev, [cat]: e.target.value }))}
                              className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-indigo-500 rounded-xl py-2 pl-7 pr-3 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400"
                            />
                          </div>

                          {numVal > 0 && (
                            <div className="mt-1.5 flex items-center justify-between text-[8px] font-mono">
                              <span className="text-slate-500">Limit: ₹{numVal.toLocaleString()}</span>
                              {isOver ? (
                                <span className="text-red-600 dark:text-red-400 font-bold">⚠️ {budgetPct}% (+₹{(currentSpend - numVal).toLocaleString()} OVER)</span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">{budgetPct}% (₹{(numVal - currentSpend).toLocaleString()} left)</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 px-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 flex-shrink-0 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const defaultBudgets: { [key: string]: string } = isRajat
                        ? { "Home": "25000", "Ajit": "15000", "Delhi Room": "12000", "Swarna": "8000", "SIP": "5000", "Health Insurance": "505", "Term Insurance": "1500", "Travel": "5000", "Others": "8000" }
                        : { "Others": "10000" };
                      setBudgetForm(defaultBudgets);
                    }}
                    className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                  >
                    Reset Recommended Defaults
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBudgetModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      Save Budgets
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── 🏛️ PROVIDENT FUND (PF) & WEALTH SETTINGS MODAL ── */}
        {showPfModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="glass-card bg-white dark:bg-[#0a0a14] border border-teal-200 dark:border-teal-500/30 rounded-3xl max-w-lg w-full max-h-[88vh] shadow-2xl shadow-teal-950/20 dark:shadow-teal-950/60 flex flex-col overflow-hidden">
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-teal-100 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 text-teal-700 dark:text-teal-400">
                    <Landmark size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Wealth & Salary Deductions Hub</span>
                      <span className="text-[9px] font-mono font-bold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-500/40 px-2 py-0.5 rounded-full uppercase">
                        Dynamic / Optional
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                      Configure PF retirement pool & corporate health insurance salary deductions
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPfModal(false)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSavePfSettings} className="flex flex-col flex-grow overflow-hidden">
                <div className="p-6 overflow-y-auto flex-grow max-h-[62vh] space-y-4 custom-modal-scrollbar">
                  {/* Opt-in Active Toggle */}
                  <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/30 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>Enable PF & Corporate Deductions</span>
                      </h5>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {pfForm.enabled ? "Active — tracking locked EPF retirement & corporate benefits" : "Disabled — will not calculate PF for your account"}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pfForm.enabled}
                        onChange={(e) => setPfForm(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  {pfForm.enabled ? (
                    <div className="space-y-3.5 animate-fadeIn">
                      {/* Employee Deduction (Your Share) */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center justify-between">
                          <span>Employee Deduction (Your Monthly PF)</span>
                          <span className="text-[9px] font-mono text-teal-700 dark:text-teal-400 font-bold">Salary Deduction</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-xs font-mono font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            placeholder="1800"
                            value={pfForm.employeeContribution}
                            onChange={(e) => setPfForm(prev => ({ ...prev, employeeContribution: e.target.value }))}
                            className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-xl py-2 pl-7 pr-3 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                            required={pfForm.enabled}
                          />
                        </div>
                        <p className="text-[8px] font-mono text-slate-500">Standard monthly deduction from salary (Default: ₹1,800)</p>
                      </div>

                      {/* Employer Match (Company Share) */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center justify-between">
                          <span>Employer Matching (Company Contribution)</span>
                          <span className="text-[9px] font-mono text-indigo-700 dark:text-indigo-400 font-bold">100% Match</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-xs font-mono font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            placeholder="1800"
                            value={pfForm.employerContribution}
                            onChange={(e) => setPfForm(prev => ({ ...prev, employerContribution: e.target.value }))}
                            className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-xl py-2 pl-7 pr-3 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                            required={pfForm.enabled}
                          />
                        </div>
                        <p className="text-[8px] font-mono text-slate-500">Employer match credited into your EPFO pool (Default: ₹1,800)</p>
                      </div>

                      {/* Health Insurance Deduction (Company GMC) */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center justify-between">
                          <span>Corporate Health Insurance / GMC</span>
                          <span className="text-[9px] font-mono text-rose-700 dark:text-rose-400 font-bold">Medical Cover</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-xs font-mono font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="505"
                            value={pfForm.healthInsuranceDeduction}
                            onChange={(e) => setPfForm(prev => ({ ...prev, healthInsuranceDeduction: e.target.value }))}
                            className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-xl py-2 pl-7 pr-3 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                          />
                        </div>
                        <p className="text-[8px] font-mono text-slate-500">Monthly office group medical health deduction from salary (Default: ₹505)</p>
                      </div>

                      {/* Start Month */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center justify-between">
                          <span>Employment / PF Start Month</span>
                          <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 font-bold">YYYY-MM</span>
                        </label>
                        <input
                          type="month"
                          value={pfForm.startMonth}
                          onChange={(e) => setPfForm(prev => ({ ...prev, startMonth: e.target.value }))}
                          className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                          required={pfForm.enabled}
                        />
                        <p className="text-[8px] font-mono text-slate-500">Used to compute months elapsed for total accumulated PF corpus</p>
                      </div>

                      {/* Initial Corpus */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center justify-between">
                          <span>Prior Existing PF Corpus (Opening Balance)</span>
                          <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 font-bold">Optional</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-xs font-mono font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={pfForm.initialCorpus}
                            onChange={(e) => setPfForm(prev => ({ ...prev, initialCorpus: e.target.value }))}
                            className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-teal-500 rounded-xl py-2 pl-7 pr-3 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Live Calculation Preview Card */}
                      {(() => {
                        const emp = parseFloat(pfForm.employeeContribution) || 0;
                        const comp = parseFloat(pfForm.employerContribution) || 0;
                        const health = parseFloat(pfForm.healthInsuranceDeduction) || 0;
                        const totalMonthlyPf = emp + comp;
                        const totalSalaryDeductions = emp + health;
                        const initial = parseFloat(pfForm.initialCorpus) || 0;
                        const [startYear, startM] = (pfForm.startMonth || "2024-01").split("-").map(Number);
                        const now = new Date();
                        const currYear = now.getFullYear();
                        const currM = now.getMonth() + 1;
                        const elapsed = Math.max(1, (currYear - (startYear || 2024)) * 12 + (currM - (startM || 1)) + 1);
                        const totalCorpus = initial + (totalMonthlyPf * elapsed);

                        return (
                          <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-500/20 font-mono space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Total Salary Deductions (PF + Health):</span>
                              <strong className="text-rose-600 dark:text-rose-400">₹{totalSalaryDeductions.toLocaleString()}/mo</strong>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-600 dark:text-slate-400">Monthly PF Pool (You ₹{emp} + Co. ₹{comp}):</span>
                              <strong className="text-teal-700 dark:text-teal-400">₹{totalMonthlyPf.toLocaleString()}/mo</strong>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-600 dark:text-slate-400">Elapsed Active Months:</span>
                              <strong className="text-slate-900 dark:text-slate-200">{elapsed} Months</strong>
                            </div>
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-teal-200 dark:border-teal-500/20">
                              <span className="text-slate-800 dark:text-slate-300 font-sans font-bold uppercase text-[10px]">Projected PF Corpus:</span>
                              <strong className="text-emerald-700 dark:text-emerald-400 font-black">₹{totalCorpus.toLocaleString()}</strong>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-center text-xs text-slate-500 font-mono">
                      PF Tracking is currently turned off for this account. Your liquid savings and monthly budget ledger will not calculate any PF deductions.
                    </div>
                  )}
                </div>

                {/* Fixed Footer */}
                <div className="flex items-center justify-end p-4 px-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 flex-shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPfModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-600/30 transition-all cursor-pointer"
                  >
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <footer className="relative z-10 w-full border-t border-white/5 py-4 text-center">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">Personal Labs. Transaction ledger Console</p>
      </footer>
    </div>
  );
}
