"use client";

import React, { useState, useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import { 
  Apple, Trash2, Calendar, Scale, Award, Info, Loader2, Plus, Sparkles, 
  ChevronLeft, ChevronRight, Pencil, Check, X, Flame, ShieldAlert, Heart
} from "lucide-react";
import { foodDictionary, FoodItem } from "@/lib/foodDictionary";

export default function FoodPage() {
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Helper to get local date string in YYYY-MM-DD format
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Inline edit state
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editFoodForm, setEditFoodForm] = useState({ 
    date: "", 
    foodName: "", 
    portionGrams: "", 
    proteinPer100g: "", 
    mealType: "Snack",
    portion: "",
    portionUnit: "Grams",
    calories: "",
    carbs: "",
    fats: "",
    isAvoid: false
  });

  // Selected Month & Year states
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;
  const logsRef = useRef<HTMLDivElement>(null);

  // Form State
  const [form, setForm] = useState({
    date: getLocalDateString(),
    foodName: "",
    portion: "0",
    portionUnit: "Grams",
    portionGrams: "0",
    proteinPer100g: "0",
    calculatedProtein: "0",
    calories: "0",
    carbs: "0",
    fats: "0",
    mealType: "Breakfast",
    isAvoid: false
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
  const proteinGoal = 120; // Daily protein target (120g)
  const caloriesGoal = 2200; // Daily calories target
  
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const isWeekend = (dateStr?: string) => {
    try {
      if (!dateStr) {
        const today = new Date().getDay();
        return today === 0 || today === 6;
      }
      const [y, m, d] = dateStr.split("-").map(Number);
      const day = new Date(y, m - 1, d).getDay();
      return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
    } catch {
      return false;
    }
  };

  // Quick select food templates from the dictionary
  const foodTemplates = foodDictionary.slice(0, 12);

  useEffect(() => {
    fetchFoodLogs();
    
    // Close suggestions dropdown on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, selectedDate]);

  // Autocomplete filter matching typed text
  useEffect(() => {
    if (!form.foodName.trim()) {
      setSuggestions([]);
      return;
    }
    const matchText = form.foodName.toLowerCase();
    const filtered = foodDictionary.filter(item => 
      item.name.toLowerCase().includes(matchText)
    );
    setSuggestions(filtered);
  }, [form.foodName]);

  // Auto-calculator: recalculates macros based on portion, unit, and selected dictionary item
  const calculateMacros = (foodNameStr: string, portionVal: string) => {
    const numericPortion = parseFloat(portionVal) || 0;
    if (numericPortion <= 0) {
      setForm(prev => ({
        ...prev,
        portionGrams: "0",
        calculatedProtein: "0",
        calories: "0",
        carbs: "0",
        fats: "0"
      }));
      return;
    }

    // Check if the typed food name matches an item in our dictionary exactly
    const matchedItem = foodDictionary.find(
      item => item.name.toLowerCase() === foodNameStr.toLowerCase()
    );

    if (matchedItem) {
      const scale = numericPortion / matchedItem.defaultSize;
      const computedGrams = matchedItem.gramsEquivalent * numericPortion;
      const computedProteinPer100g = (matchedItem.proteinPerBase / (matchedItem.defaultSize * matchedItem.gramsEquivalent)) * 100;
      
      const calculatedProteinVal = matchedItem.proteinPerBase * scale;
      const calculatedCalories = matchedItem.caloriesPerBase * scale;
      const calculatedCarbs = matchedItem.carbsPerBase * scale;
      const calculatedFats = matchedItem.fatsPerBase * scale;

      setForm(prev => ({
        ...prev,
        portionGrams: String(Math.round(computedGrams)),
        proteinPer100g: String(computedProteinPer100g.toFixed(1)),
        calculatedProtein: String(calculatedProteinVal.toFixed(1)),
        calories: String(Math.round(calculatedCalories)),
        carbs: String(Math.round(calculatedCarbs)),
        fats: String(Math.round(calculatedFats)),
        portionUnit: matchedItem.defaultUnit,
        isAvoid: matchedItem.isAvoid ?? false
      }));
    } else {
      // If custom food, calculate based on the new typed portionVal directly
      const portionNum = parseFloat(portionVal) || 0;
      const protPer100 = parseFloat(form.proteinPer100g) || 0;
      const calcProtein = (portionNum * protPer100) / 100;
      
      setForm(prev => ({
        ...prev,
        portionGrams: portionVal,
        calculatedProtein: String(calcProtein.toFixed(1)),
        portionUnit: "Grams",
        isAvoid: false
      }));
    }
  };

  // Trigger calculation when portion or food name changes
  useEffect(() => {
    calculateMacros(form.foodName, form.portion);
  }, [form.portion, form.foodName]);

  // If portionGrams or proteinPer100g is manually edited for custom entries
  useEffect(() => {
    const matchedItem = foodDictionary.find(
      item => item.name.toLowerCase() === form.foodName.toLowerCase()
    );
    if (!matchedItem) {
      const grams = parseFloat(form.portionGrams) || 0;
      const protPer100 = parseFloat(form.proteinPer100g) || 0;
      const calcProtein = (grams * protPer100) / 100;
      setForm(prev => ({
        ...prev,
        calculatedProtein: String(calcProtein.toFixed(1)),
        portion: form.portionGrams
      }));
    }
  }, [form.portionGrams, form.proteinPer100g]);

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

  const handleApplyTemplate = (tpl: FoodItem) => {
    setForm({
      ...form,
      foodName: tpl.name,
      portion: String(tpl.defaultSize),
      portionUnit: tpl.defaultUnit,
      isAvoid: tpl.isAvoid ?? false
    });
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (tpl: FoodItem) => {
    setForm({
      ...form,
      foodName: tpl.name,
      portion: String(tpl.defaultSize),
      portionUnit: tpl.defaultUnit,
      isAvoid: tpl.isAvoid ?? false
    });
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.foodName || !form.portion || !form.calculatedProtein) {
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

      // Reset form
      setForm({
        date: getLocalDateString(),
        foodName: "",
        portion: "0",
        portionUnit: "Grams",
        portionGrams: "0",
        proteinPer100g: "0",
        calculatedProtein: "0",
        calories: "0",
        carbs: "0",
        fats: "0",
        mealType: "Breakfast",
        isAvoid: false
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
      date: getLocalDateString(new Date(log.date)),
      foodName: log.foodName,
      portionGrams: String(log.portionGrams),
      proteinPer100g: String(log.proteinPer100g),
      mealType: log.mealType,
      portion: String(log.portion ?? log.portionGrams),
      portionUnit: log.portionUnit || "Grams",
      calories: String(log.calories || 0),
      carbs: String(log.carbs || 0),
      fats: String(log.fats || 0),
      isAvoid: log.isAvoid ?? false
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
    if (selectedDate) {
      return new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    if (selectedMonth === -1 && selectedYear === -1) return "Lifetime";
    if (selectedMonth === -1) return `${selectedYear} (Year)`;
    if (selectedYear === -1) return `${months[selectedMonth]} (All Years)`;
    return `${months[selectedMonth].slice(0, 3)} '${String(selectedYear).slice(-2)}`;
  };

  // Filter logs by selected Month, Year or Specific Date
  const filteredLogs = foodLogs.filter((log) => {
    const logDate = new Date(log.date);
    if (selectedDate) {
      return logDate.toDateString() === new Date(selectedDate).toDateString();
    }
    const monthMatches = selectedMonth === -1 || logDate.getMonth() === selectedMonth;
    const yearMatches = selectedYear === -1 || logDate.getFullYear() === selectedYear;
    return monthMatches && yearMatches;
  });

  // Calculate unique days and average daily protein/calorie intake
  const uniqueLoggedDays = new Set(filteredLogs.map(l => new Date(l.date).toDateString())).size;
  const totalProteinLogged = filteredLogs.reduce((acc, curr) => acc + curr.calculatedProtein, 0);
  const totalCaloriesLogged = filteredLogs.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  
  const activeProtein = uniqueLoggedDays > 0 ? totalProteinLogged / uniqueLoggedDays : 0;
  const activeCalories = uniqueLoggedDays > 0 ? totalCaloriesLogged / uniqueLoggedDays : 0;
  
  const activeProteinPercent = Math.min(100, Math.round((activeProtein / proteinGoal) * 100));
  const activeCaloriesPercent = Math.min(100, Math.round((activeCalories / caloriesGoal) * 100));

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Check if a matched item in autocomplete is an avoid item
  const selectedFoodItem = foodDictionary.find(item => item.name.toLowerCase() === form.foodName.toLowerCase());
  const isAvoidItem = selectedFoodItem?.isAvoid || form.isAvoid;

  return (
    <div className="relative min-h-screen bg-background flex flex-col justify-between">
      <div className="cyber-grid"></div>

      <div className="relative z-10 flex flex-col flex-grow">
        <Navigation />

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          {/* Header & Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="page-heading text-xl font-black uppercase tracking-widest text-slate-900 dark:text-slate-200">Protein & Nutrition tracker</h2>
              <p className="page-subheading text-xs text-slate-500 uppercase tracking-wider mt-0.5">Automated Portion Intake Calculator</p>
            </div>

            {/* Premium Month/Year/Date selection bar with iPhone visibility fix */}
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
                className="bar-btn p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Goal Display Card */}
          <div className="glass-card card-glow-teal p-6 rounded-2xl border border-white/5 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Protein Target */}
            <div className="flex items-center gap-4 justify-between border-r border-white/5 pr-0 md:pr-6">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Protein Progress ({getContextLabel()})</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Target: {proteinGoal}g Daily</p>
                </div>
              </div>
              <div className="w-1/2 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-400 font-bold">{activeProtein.toFixed(1)}g Avg</span>
                  <span className="text-teal-400 font-bold">{activeProteinPercent}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${activeProteinPercent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Calories Target */}
            <div className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Flame size={22} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Calories Progress</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Target: {caloriesGoal} kcal Daily</p>
                </div>
              </div>
              <div className="w-1/2 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-400 font-bold">{activeCalories.toFixed(0)} kcal Avg</span>
                  <span className="text-orange-400 font-bold">{activeCaloriesPercent}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${activeCaloriesPercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* 🥛 Daily Breakfast Milk Tracker Quick-Action Card */}
              <div className="glass-card card-glow-teal p-5 rounded-2xl border border-teal-500/20 bg-teal-500/[0.04] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥛</span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                        Breakfast Milk Routine
                      </h4>
                      <p className="text-[9px] text-slate-400 font-medium">
                        {isWeekend(form.date) ? "✨ Sat/Sun Weekend: 500ml Milk" : "✨ Weekday Routine: ₹10 Milk (~200ml)"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase">
                    {isWeekend(form.date) ? "Weekend 500ml" : "Daily ₹10"}
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tpl = isWeekend(form.date)
                        ? foodDictionary.find(f => f.name.includes("Weekend 500ml"))
                        : foodDictionary.find(f => f.name.includes("₹10 Daily"));
                      if (tpl) {
                        setForm(prev => ({
                          ...prev,
                          mealType: "Breakfast",
                          foodName: tpl.name,
                          portion: String(tpl.defaultSize),
                          portionUnit: tpl.defaultUnit,
                          isAvoid: false
                        }));
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-teal-500/40 bg-teal-500/15 hover:bg-teal-500/25 transition-all text-left cursor-pointer shadow-sm group"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-teal-300">
                      <span>{isWeekend(form.date) ? "🥛 Auto-Fill Weekend 500ml Milk" : "🥛 Auto-Fill Daily ₹10 Milk (~200ml)"}</span>
                      <span className="font-mono text-[9px] text-teal-200 bg-teal-500/20 px-1.5 py-0.5 rounded font-black">
                        {isWeekend(form.date) ? "16g Prot • 300 kcal" : "6.4g Prot • 120 kcal"}
                      </span>
                    </div>
                    <p className="text-[8px] text-slate-400 mt-1 font-mono">
                      {isWeekend(form.date)
                        ? "500ml: 16g Protein | 24g Carbs | 15g Fats | 300 kcal"
                        : "₹10 Pouch: 6.4g Protein | 9.6g Carbs | 6g Fats | 120 kcal"}
                    </p>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const tpl = foodDictionary.find(f => f.name.includes("₹10 Daily"));
                        if (tpl) {
                          setForm(prev => ({
                            ...prev,
                            mealType: "Breakfast",
                            foodName: tpl.name,
                            portion: String(tpl.defaultSize),
                            portionUnit: tpl.defaultUnit,
                            isAvoid: false
                          }));
                        }
                      }}
                      className="p-2 rounded-xl border border-white/10 hover:border-teal-500/30 bg-white/[0.02] hover:bg-teal-500/10 text-left cursor-pointer transition-all"
                    >
                      <span className="text-[9px] font-bold text-slate-200 block truncate">₹10 Milk (~200ml)</span>
                      <span className="text-[8px] font-mono text-teal-400 font-bold block mt-0.5">6.4g Protein • 120 kcal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const tpl = foodDictionary.find(f => f.name.includes("Weekend 500ml"));
                        if (tpl) {
                          setForm(prev => ({
                            ...prev,
                            mealType: "Breakfast",
                            foodName: tpl.name,
                            portion: String(tpl.defaultSize),
                            portionUnit: tpl.defaultUnit,
                            isAvoid: false
                          }));
                        }
                      }}
                      className="p-2 rounded-xl border border-white/10 hover:border-teal-500/30 bg-white/[0.02] hover:bg-teal-500/10 text-left cursor-pointer transition-all"
                    >
                      <span className="text-[9px] font-bold text-slate-200 block truncate">500ml Milk (Sat/Sun)</span>
                      <span className="text-[8px] font-mono text-teal-400 font-bold block mt-0.5">16g Protein • 300 kcal</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="glass-card card-glow-teal p-6 rounded-2xl border border-white/5 relative">
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
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full bg-white/[0.02] border border-white/5 focus:border-teal-500/50 rounded-xl py-2 pl-9 pr-4 text-base sm:text-xs text-slate-200 outline-none transition-all"
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

                  {/* Food Name Autocomplete Input */}
                  <div className="space-y-1 relative">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">Food Item</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                        <Apple size={14} />
                      </span>
                      <input
                        type="text"
                        value={form.foodName}
                        onChange={(e) => {
                          setForm({ ...form, foodName: e.target.value });
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Type food, e.g. Sattu, Dalma, Chicken"
                        className="w-full bg-white/[0.02] border border-white/5 focus:border-teal-500/50 rounded-xl py-2 pl-9 pr-4 text-base sm:text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
                        required
                        autoComplete="off"
                      />
                    </div>

                    {/* Autocomplete Dropdown suggestions list */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div 
                        ref={suggestionsRef}
                        className="absolute z-30 left-0 right-0 mt-1 max-h-[180px] overflow-y-auto rounded-xl border border-white/10 light:border-slate-200 bg-[#0c0c16]/95 light:bg-white backdrop-blur-xl shadow-2xl space-y-1 p-1 text-xs"
                      >
                        {suggestions.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => handleSuggestionClick(item)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-teal-500/15 light:hover:bg-teal-50 text-slate-300 light:text-slate-700 hover:text-teal-400 light:hover:text-teal-600 font-bold transition-all cursor-pointer flex justify-between items-center"
                          >
                            <span>{item.name}</span>
                            <span className="text-[9px] text-slate-500 light:text-slate-400 font-normal">Base: {item.defaultSize} {item.defaultUnit}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Red Avoid Warning Alert if Sweet Treat is selected */}
                  {isAvoidItem && (
                    <div className={`p-3 border rounded-xl text-[10px] font-bold flex items-center gap-2 leading-normal transition-all ${
                      (parseFloat(form.portionGrams) || 0) > 10
                        ? "bg-red-600 text-white border-red-500"
                        : "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
                    }`}>
                      <ShieldAlert size={14} className="flex-shrink-0" />
                      <span>
                        {(parseFloat(form.portionGrams) || 0) > 10
                          ? "CRITICAL WARNING: Sugar overload detected (>10g)! Detrimental to your health goals!"
                          : "Warning: Sweet cheat treat detected. Keep portion under 10g to minimize health impact!"
                        }
                      </span>
                    </div>
                  )}

                  {/* Dynamic Portion input */}
                  <div className="grid grid-cols-2 gap-3 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">
                        Portion ({form.portionUnit})
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600 font-mono text-[10px]">
                          #
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={form.portion}
                          onChange={(e) => setForm({ ...form, portion: e.target.value })}
                          placeholder="100"
                          min="0.1"
                          step="any"
                          className="w-full bg-white/[0.02] border border-white/5 focus:border-teal-500/50 rounded-xl py-2 pl-8 pr-4 text-base sm:text-xs text-slate-200 placeholder-slate-600 outline-none transition-all font-mono"
                          required
                        />
                      </div>
                    </div>

                    {/* Calculated Protein feedback */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">Protein (g)</label>
                      <div className="bg-white/[0.01] border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-teal-400 tracking-wider text-center font-mono">
                        {parseFloat(form.calculatedProtein).toFixed(1)}g
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Macro displays calculated in real-time */}
                  <div className="grid grid-cols-3 gap-2 bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                    <div className="text-center">
                      <p className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Calories</p>
                      <p className="text-xs font-bold font-mono text-orange-400 mt-0.5">{form.calories} kcal</p>
                    </div>
                    <div className="text-center border-x border-white/5">
                      <p className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Carbs</p>
                      <p className="text-xs font-bold font-mono text-indigo-400 mt-0.5">{form.carbs}g</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Fats</p>
                      <p className="text-xs font-bold font-mono text-purple-400 mt-0.5">{form.fats}g</p>
                    </div>
                  </div>

                  {/* Standard fallback/override inputs ONLY if NOT a dictionary item */}
                  {!selectedFoodItem && (
                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-3">
                      <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Custom Food Override Values</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] uppercase text-slate-500 tracking-wider">Weight (Grams)</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={form.portionGrams}
                            onChange={(e) => setForm({ ...form, portionGrams: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-base sm:text-xs text-slate-200 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] uppercase text-slate-500 tracking-wider">Protein per 100g</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={form.proteinPer100g}
                            onChange={(e) => setForm({ ...form, proteinPer100g: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-base sm:text-xs text-slate-200 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full mt-4 bg-gradient-to-r ${isAvoidItem ? "from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/20" : "from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 shadow-teal-500/20"} disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-lg transition-all`}
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
                      className={`bg-white/[0.02] border ${tpl.isAvoid ? "hover:bg-red-500/10 hover:border-red-500/30 text-red-400 hover:text-red-400 border-red-500/5" : "hover:bg-teal-500/10 hover:border-teal-500/30 text-slate-400 hover:text-teal-400 border-white/5"} text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all cursor-pointer`}
                    >
                      {tpl.name} ({tpl.proteinPerBase}g)
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Date</label>
                                <input type="date" value={editFoodForm.date} onChange={e => setEditFoodForm({...editFoodForm, date: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Meal Type</label>
                                <select value={editFoodForm.mealType} onChange={e => setEditFoodForm({...editFoodForm, mealType: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none">
                                  {mealTypes.map(m => <option key={m} value={m} className="bg-white dark:bg-[#0c0c16] text-slate-800 dark:text-slate-200">{m}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Food Name</label>
                              <input type="text" value={editFoodForm.foodName} onChange={e => setEditFoodForm({...editFoodForm, foodName: e.target.value})}
                                className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              <div>
                                <label className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Portion</label>
                                <input type="number" value={editFoodForm.portion} onChange={e => setEditFoodForm({...editFoodForm, portion: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none" />
                              </div>
                              <div>
                                <label className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Unit</label>
                                <input type="text" value={editFoodForm.portionUnit} onChange={e => setEditFoodForm({...editFoodForm, portionUnit: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none" />
                              </div>
                              <div>
                                <label className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Calories</label>
                                <input type="number" value={editFoodForm.calories} onChange={e => setEditFoodForm({...editFoodForm, calories: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none font-mono" />
                              </div>
                              <div>
                                <label className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Carbs</label>
                                <input type="number" value={editFoodForm.carbs} onChange={e => setEditFoodForm({...editFoodForm, carbs: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none font-mono" />
                              </div>
                              <div>
                                <label className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Fats</label>
                                <input type="number" value={editFoodForm.fats} onChange={e => setEditFoodForm({...editFoodForm, fats: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none font-mono" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-white/5 pt-2">
                              <label className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-red-400 font-bold cursor-pointer">
                                <input type="checkbox" checked={editFoodForm.isAvoid} onChange={e => setEditFoodForm({...editFoodForm, isAvoid: e.target.checked})}
                                  className="cursor-pointer" />
                                Avoid Cheat Food
                              </label>
                              <div className="flex items-center gap-2">
                                <button onClick={() => setEditingFoodId(null)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10 transition-all cursor-pointer">
                                  <X size={12} /> Cancel
                                </button>
                                <button onClick={() => handleFoodEditSave(log._id)} className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                                  <Check size={12} /> Save
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* ── READ VIEW ROW ── */
                          <div
                            key={log._id}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${
                              log.isAvoid 
                                ? (log.portionGrams > 10 ? "bg-red-500/15 border-red-500/40 hover:bg-red-500/20" : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10")
                                : "bg-white/[0.01] light:bg-slate-50 border-white/5 light:border-slate-200 hover:bg-white/[0.03] light:hover:bg-slate-100/80"
                            }`}
                          >
                            <div className="flex items-center gap-4 min-w-0 flex-grow">
                              <div className={`w-9 h-9 rounded-lg border flex flex-col items-center justify-center flex-shrink-0 ${log.isAvoid ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-white/[0.02] border-white/5"}`}>
                                <span className="text-[8px] font-bold text-slate-500 uppercase font-mono">
                                  {new Date(log.date).toLocaleDateString("en-US", { month: "short" })}
                                </span>
                                <span className={`text-[11px] font-black leading-none ${log.isAvoid ? "text-red-400" : "text-slate-300"}`}>
                                  {new Date(log.date).toLocaleDateString("en-US", { day: "2-digit" })}
                                </span>
                              </div>
                              <div className="min-w-0 flex-grow">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={`text-xs font-bold break-all pr-2 ${log.isAvoid ? (log.portionGrams > 10 ? "text-red-500" : "text-red-400") : "text-slate-200 light:text-slate-800"}`} title={log.foodName}>
                                    {log.foodName}
                                  </p>
                                  <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono flex-shrink-0 border ${
                                    log.isAvoid 
                                      ? "bg-red-950/20 text-red-400 border-red-500/10" 
                                      : "bg-teal-950/20 text-teal-400 border-teal-500/10"
                                  }`}>
                                    {log.mealType}
                                  </span>
                                  {log.isAvoid && (
                                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono flex-shrink-0 border ${
                                      log.portionGrams > 10 
                                        ? "bg-red-600 text-white border-red-500" 
                                        : "bg-red-950/40 text-red-400 border-red-500/20"
                                    }`}>
                                      {log.portionGrams > 10 ? "⚠️ Sugar Overload (>10g)" : "Avoid Item"}
                                    </span>
                                  )}
                                </div>
                                <span className="inline-block text-[9px] uppercase tracking-wider font-bold font-mono text-slate-500 mt-1">
                                  Portion: {log.portion ?? log.portionGrams} {log.portionUnit || "Grams"} • Cal: {log.calories || 0} kcal • C: {log.carbs || 0}g • F: {log.fats || 0}g
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-black font-mono mr-2 ${log.isAvoid ? "text-red-400" : "text-teal-400"}`}>
                                +{log.calculatedProtein.toFixed(1)}g
                              </span>
                              <button
                                onClick={() => handleFoodEditStart(log)}
                                className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10 transition-all cursor-pointer"
                                title="Edit Food Entry"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(log._id)}
                                className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
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
