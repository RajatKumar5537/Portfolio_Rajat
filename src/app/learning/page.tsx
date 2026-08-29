"use client";

import React, { useState, useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import { BookOpen, Play, Calendar, Trash2, Loader2, Sparkles, Flame, Plus, Settings, ChevronLeft, ChevronRight, Pencil, Check, X } from "lucide-react";

// Default configurations
const DEFAULT_START_DATE = new Date("2026-08-25T00:00:00");
const DEFAULT_END_DATE = new Date("2027-02-25T00:00:00");

const MILESTONE_TEMPLATES = [
  { id: 1, name: "Month 1: Advanced TS & Clean Architecture", desc: "Domain Driven Design, Design Patterns, SOLID practices." },
  { id: 2, name: "Month 2: Algorithms & SDET Best Practices", desc: "Complex data structures, runtime optimization, design patterns in automation." },
  { id: 3, name: "Month 3: High-Scale System Design", desc: "Microservices, caching strategies, distributed systems architectures." },
  { id: 4, name: "Month 4: Cloud Infrastructure & DevOps", desc: "CI/CD integration, Docker, Kubernetes, AWS resources setup." },
  { id: 5, name: "Month 5: Event-Driven & Async Pipelines", desc: "Kafka message brokers, Redis cache layer validation, real-time message streams." },
  { id: 6, name: "Month 6: Capstone Project & QE Leadership", desc: "Custom test suites, scale-load tests, end-to-end framework assembly." },
];

const MOTIVATIONAL_QUOTES = [
  "Consistency is the separator of dreamers and doers.",
  "Six months of focus can put you five years ahead.",
  "Every line of code you write is a step closer to mastery.",
  "Small daily gains compound into massive long-term success.",
  "Your potential is endless. Go make it happen.",
];

export default function LearningPage() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [quote, setQuote] = useState("");

  const [studyLogs, setStudyLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Date Filters
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

  // Tabs
  const [activeTab, setActiveTab] = useState<"roadmap" | "studied">("roadmap");

  // Editable milestones (loaded from localStorage on mount)
  const [milestones, setMilestones] = useState<any[]>([]);
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null);
  const [editMilestoneForm, setEditMilestoneForm] = useState({ name: "", desc: "" });
  const [showAddMilestoneForm, setShowAddMilestoneForm] = useState(false);
  const [newMilestoneForm, setNewMilestoneForm] = useState({ name: "", desc: "" });
  const [roadmapPage, setRoadmapPage] = useState(1);
  const MILESTONES_PER_PAGE = 6;

  // Study log inline edit
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogForm, setEditLogForm] = useState({ topic: "", durationMinutes: "", date: "" });
  
  // Topic input state
  const [newTopicText, setNewTopicText] = useState("");
  const [newDuration, setNewDuration] = useState("30");

  // Stopwatch state
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [goalStartDate, setGoalStartDate] = useState<Date>(DEFAULT_START_DATE);
  const [goalEndDate, setGoalEndDate] = useState<Date>(DEFAULT_END_DATE);
  const [inputStartDate, setInputStartDate] = useState("2026-08-25");
  const [inputDuration, setInputDuration] = useState<number>(6);
  const [inputDurationUnit, setInputDurationUnit] = useState<"months" | "days">("months");

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

    // Fetch roadmap from database
    const fetchRoadmapData = async () => {
      try {
        const res = await fetch("/api/tracking/study/roadmap");
        if (res.ok) {
          const data = await res.json();
          if (data && !data.default) {
            const start = new Date(data.startDate);
            setGoalStartDate(start);
            setInputStartDate(data.startDate.split("T")[0]);
            setInputDuration(data.duration);
            setInputDurationUnit(data.durationUnit);
            setGoalEndDate(calculateEndDate(start, data.duration, data.durationUnit));
            setMilestones(data.milestones || []);
            return;
          }
        }
        // Fallback to localStorage if default or API fails
        const savedStart = localStorage.getItem("goal_start_date");
        const savedDuration = localStorage.getItem("goal_duration");
        const savedUnit = localStorage.getItem("goal_duration_unit");
        const savedMilestones = localStorage.getItem("custom_milestones");

        let loadedMilestones = [];
        if (savedMilestones) {
          try { loadedMilestones = JSON.parse(savedMilestones); } catch {}
        } else {
          loadedMilestones = [];
        }
        setMilestones(loadedMilestones);

        if (savedStart && savedDuration && savedUnit) {
          const start = new Date(savedStart + "T00:00:00");
          const dur = parseInt(savedDuration);
          const unit = savedUnit as "months" | "days";
          setGoalStartDate(start);
          setInputStartDate(savedStart);
          setInputDuration(dur);
          setInputDurationUnit(unit);
          setGoalEndDate(calculateEndDate(start, dur, unit));
        } else {
          // Initialize defaults
          setGoalStartDate(DEFAULT_START_DATE);
          setInputStartDate("2026-08-25");
          setInputDuration(6);
          setInputDurationUnit("months");
          setGoalEndDate(DEFAULT_END_DATE);
        }
      } catch (err) {
        console.error("Error loading roadmap data: ", err);
      }
    };
    fetchRoadmapData();

    fetchStudyLogs();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, selectedDate]);

  const calculateEndDate = (start: Date, dur: number, unit: "months" | "days"): Date => {
    const end = new Date(start.getTime());
    if (unit === "months") {
      end.setMonth(end.getMonth() + dur);
    } else {
      end.setDate(end.getDate() + dur);
    }
    return end;
  };

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Session timer handler
  useEffect(() => {
    if (isSessionActive) {
      timerRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive]);

  const fetchStudyLogs = async () => {
    try {
      const res = await fetch("/api/tracking/study");
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudyLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic list of years based on study logs
  const availableYears = Array.from(
    new Set([
      new Date().getFullYear(),
      ...studyLogs.map((log) => new Date(log.date).getFullYear())
    ])
  ).sort((a, b) => b - a);

  const saveRoadmapToDB = async (start: Date, dur: number, unit: "months" | "days", milestonesList: any[]) => {
    try {
      await fetch("/api/tracking/study/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: start.toISOString().split("T")[0],
          duration: dur,
          durationUnit: unit,
          milestones: milestonesList
        })
      });
    } catch (err) {
      console.error("Error saving roadmap to DB:", err);
    }
  };

  const handleSaveGoalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(inputStartDate + "T00:00:00");
    const end = calculateEndDate(start, inputDuration, inputDurationUnit);

    setGoalStartDate(start);
    setGoalEndDate(end);
    setShowSettings(false);

    localStorage.setItem("goal_start_date", inputStartDate);
    localStorage.setItem("goal_duration", String(inputDuration));
    localStorage.setItem("goal_duration_unit", inputDurationUnit);

    saveRoadmapToDB(start, inputDuration, inputDurationUnit, milestones);
  };

  const handleLogTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicText.trim()) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/tracking/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: newTopicText.trim(),
          durationMinutes: parseInt(newDuration) || 0,
          completed: true,
        }),
      });

      const newLog = await res.json();
      if (res.ok) {
        setStudyLogs([newLog, ...studyLogs]);
        
        // Shift selectors to match newly logged item
        const newLogDate = new Date(newLog.date);
        setSelectedMonth(newLogDate.getMonth());
        setSelectedYear(newLogDate.getFullYear());

        setNewTopicText("");
        setActiveTab("studied"); // jump to tab to see
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Delete study record?")) return;

    try {
      const res = await fetch(`/api/tracking/study?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setStudyLogs(studyLogs.filter((log) => log._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditLogStart = (log: any) => {
    setEditingLogId(log._id);
    setEditLogForm({
      topic: log.topic,
      durationMinutes: String(log.durationMinutes),
      date: new Date(log.date).toISOString().split("T")[0],
    });
  };

  const handleEditLogSave = async (id: string) => {
    try {
      const res = await fetch(`/api/tracking/study?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editLogForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setStudyLogs(studyLogs.map((l) => (l._id === id ? updated : l)));
        setEditingLogId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMilestoneEditStart = (m: typeof milestones[0]) => {
    setEditingMilestoneId(m.id);
    setEditMilestoneForm({ name: m.name, desc: m.desc });
  };

  const handleMilestoneEditSave = (id: number) => {
    const updated = milestones.map((m) => m.id === id ? { ...m, ...editMilestoneForm } : m);
    setMilestones(updated);
    localStorage.setItem("custom_milestones", JSON.stringify(updated));
    setEditingMilestoneId(null);
    saveRoadmapToDB(goalStartDate, inputDuration, inputDurationUnit, updated);
  };

  const handleMilestoneDelete = (id: number) => {
    if (!confirm("Delete this milestone from your roadmap?")) return;
    const updated = milestones.filter((m) => m.id !== id);
    setMilestones(updated);
    localStorage.setItem("custom_milestones", JSON.stringify(updated));
    saveRoadmapToDB(goalStartDate, inputDuration, inputDurationUnit, updated);
  };

  const handleMilestoneConfirmAdd = () => {
    if (!newMilestoneForm.name.trim()) return;
    const nextId = milestones.length > 0 ? Math.max(...milestones.map(m => m.id)) + 1 : 1;
    const updated = [...milestones, { id: nextId, name: newMilestoneForm.name.trim(), desc: newMilestoneForm.desc.trim() }];
    setMilestones(updated);
    localStorage.setItem("custom_milestones", JSON.stringify(updated));
    setNewMilestoneForm({ name: "", desc: "" });
    setShowAddMilestoneForm(false);
    saveRoadmapToDB(goalStartDate, inputDuration, inputDurationUnit, updated);
  };

  const handleToggleSession = async () => {
    if (isSessionActive) {
      const minutes = Math.max(1, Math.round(sessionSeconds / 60));
      setIsSessionActive(false);
      setSessionSeconds(0);

      const topicName = prompt("What did you study during this session?", "Algorithms Practice");
      if (!topicName) return;

      try {
        const res = await fetch("/api/tracking/study", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topicName,
            durationMinutes: minutes,
            completed: true,
          }),
        });

        const newLog = await res.json();
        if (res.ok) {
          setStudyLogs([newLog, ...studyLogs]);

          // Shift selectors
          const newLogDate = new Date(newLog.date);
          setSelectedMonth(newLogDate.getMonth());
          setSelectedYear(newLogDate.getFullYear());

          setActiveTab("studied");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setIsSessionActive(true);
      setSessionSeconds(0);
    }
  };

  const formatStopwatch = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? String(hrs).padStart(2, "0") + ":" : ""}${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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

  // Progress calculations
  if (!mounted || !currentTime) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" />
      </div>
    );
  }

  const currentMs = currentTime.getTime();
  const startMs = goalStartDate.getTime();
  const endMs = goalEndDate.getTime();
  const totalGoalTime = endMs - startMs;
  const elapsed = Math.max(0, currentMs - startMs);
  const remaining = Math.max(0, endMs - currentMs);
  const percentProgress = Math.min(100, Math.max(0, (elapsed / totalGoalTime) * 100));

  const daysElapsed = Math.floor(elapsed / (1000 * 60 * 60 * 24));
  const totalDays = Math.floor(totalGoalTime / (1000 * 60 * 60 * 24));

  const milestoneCount = milestones.length || 1;
  const milestoneStepMs = totalGoalTime / milestoneCount;
  const dynamicMilestones = milestones.map((tpl, idx) => {
    const mStart = new Date(startMs + idx * milestoneStepMs);
    const mEnd = new Date(startMs + (idx + 1) * milestoneStepMs);
    return { ...tpl, start: mStart, end: mEnd };
  });

  const radius = 70;
  const strokeDash = 2 * Math.PI * radius;
  const strokeOffset = strokeDash - (percentProgress / 100) * strokeDash;

  // Streak calculations (based on overall logs)
  const completedDates = new Set(
    studyLogs.filter((t) => t.completed).map((t) => new Date(t.date).toDateString())
  );
  let currentStreak = 0;
  if (completedDates.size > 0) {
    const checkDate = new Date();
    let currentKey = checkDate.toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toDateString();

    if (!completedDates.has(currentKey)) {
      if (completedDates.has(yesterdayKey)) {
        checkDate.setDate(checkDate.getDate() - 1);
        currentKey = yesterdayKey;
      }
    }

    while (completedDates.has(currentKey)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      currentKey = checkDate.toDateString();
    }
  }

  // Filter study logs by selected Month, Year or Specific Date
  const filteredStudyLogs = studyLogs.filter((log) => {
    const logDate = new Date(log.date);
    if (selectedDate) {
      return logDate.toDateString() === new Date(selectedDate).toDateString();
    }
    const monthMatches = selectedMonth === -1 || logDate.getMonth() === selectedMonth;
    const yearMatches = selectedYear === -1 || logDate.getFullYear() === selectedYear;
    return monthMatches && yearMatches;
  });

  // Calculate total study time in period
  const totalStudyMinutes = filteredStudyLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudyLogs.length / ITEMS_PER_PAGE);
  const paginatedStudyLogs = filteredStudyLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="relative min-h-screen bg-background flex flex-col justify-between">
      <div className="cyber-grid"></div>

      {/* ── Add Milestone Modal Popup ── */}
      {showAddMilestoneForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddMilestoneForm(false); setNewMilestoneForm({ name: "", desc: "" }); } }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal card */}
          <div className="relative z-10 w-full max-w-md bg-[#0d0d1a] light:bg-white border border-indigo-500/30 light:border-slate-200 rounded-2xl shadow-2xl shadow-black/60 light:shadow-slate-200/50 p-6 space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-indigo-400 font-mono font-bold">New Milestone</p>
                <h3 className="text-sm font-bold text-slate-100 mt-0.5">Add Roadmap Milestone</h3>
              </div>
              <button
                onClick={() => { setShowAddMilestoneForm(false); setNewMilestoneForm({ name: "", desc: "" }); }}
                className="text-slate-500 hover:text-slate-300 light:hover:text-slate-700 p-1.5 rounded-lg hover:bg-white/5 light:hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Name field */}
            <div>
              <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Milestone Name *</label>
              <input
                type="text"
                placeholder="e.g. Month 7: Advanced Testing"
                value={newMilestoneForm.name}
                onChange={e => setNewMilestoneForm({ ...newMilestoneForm, name: e.target.value })}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60 transition-colors"
                autoFocus
              />
            </div>

            {/* Description field */}
            <div>
              <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Description</label>
              <textarea
                placeholder="What will you learn or achieve?"
                value={newMilestoneForm.desc}
                onChange={e => setNewMilestoneForm({ ...newMilestoneForm, desc: e.target.value })}
                rows={3}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60 resize-none transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => { setShowAddMilestoneForm(false); setNewMilestoneForm({ name: "", desc: "" }); }}
                className="flex items-center gap-1.5 text-xs text-slate-400 px-4 py-2 rounded-lg border border-white/10 light:border-slate-200 hover:bg-white/5 light:hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X size={12} /> Cancel
              </button>
              <button
                onClick={handleMilestoneConfirmAdd}
                disabled={!newMilestoneForm.name.trim()}
                style={{ color: newMilestoneForm.name.trim() ? "#ffffff" : undefined }}
                className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg transition-all ${
                  newMilestoneForm.name.trim()
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                    : "bg-slate-800 light:bg-slate-100 text-slate-500 light:text-slate-400 cursor-not-allowed"
                }`}
              >
                <Check size={12} /> Save Milestone
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-grow">
        <Navigation />

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          {/* Header & Date Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="page-heading text-xl font-black uppercase tracking-widest text-slate-900 dark:text-slate-200">Learning Lab</h2>
              <p className="page-subheading text-xs text-slate-500 uppercase tracking-wider mt-0.5">Track growth roadmaps and study time</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">

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
                        className="bg-transparent border-none outline-none text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer font-mono w-[100px] h-4 leading-none"
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

              {currentStreak > 0 && (
                <div className="flex items-center gap-1.5 bg-orange-950/40 border border-orange-500/25 px-4 py-2 rounded-xl text-xs text-orange-400 font-bold uppercase tracking-wider font-mono">
                  <Flame size={14} />
                  <span>{currentStreak} DAY STREAK</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side Progress ring and session timer */}
            <div className="space-y-8 lg:col-span-1">
              {/* Radial Progress & Goals */}
              <div className="glass-card card-glow-indigo p-6 rounded-2xl border border-white/5 flex flex-col items-center relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
                >
                  <Settings size={16} />
                </button>

                {showSettings && (
                  <form onSubmit={handleSaveGoalSettings} className="w-full bg-[#070711] border border-white/5 rounded-xl p-4 mt-8 space-y-3">
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-indigo-400">Configure Goal</h4>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Start Date</label>
                      <input
                        type="date"
                        value={inputStartDate}
                        onChange={(e) => setInputStartDate(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-lg p-1.5 text-xs text-slate-300 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-500">Duration</label>
                        <input
                          type="number"
                          value={inputDuration}
                          onChange={(e) => setInputDuration(parseInt(e.target.value) || 1)}
                          className="w-full bg-white/[0.02] border border-white/5 rounded-lg p-1.5 text-xs text-slate-300 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-500">Unit</label>
                        <select
                          value={inputDurationUnit}
                          onChange={(e) => setInputDurationUnit(e.target.value as "months" | "days")}
                          className="w-full bg-white/[0.02] border border-white/5 rounded-lg p-1.5 text-xs text-slate-300 outline-none"
                        >
                          <option value="months">Months</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 rounded-lg">
                      Save Configurations
                    </button>
                  </form>
                )}

                {!showSettings && (
                  <>
                    <div className="relative w-40 h-40 flex items-center justify-center my-6">
                      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 160 160">
                        {/* Track circle — uses CSS variable so it's visible in both themes */}
                        <circle
                          className="fill-none"
                          style={{ stroke: "var(--ring-track)" }}
                          strokeWidth="8"
                          cx="80"
                          cy="80"
                          r={radius}
                        />
                        <circle
                          className="stroke-indigo-500 fill-none transition-all duration-1000"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={strokeDash}
                          strokeDashoffset={strokeOffset}
                          cx="80"
                          cy="80"
                          r={radius}
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-2xl font-black font-mono text-slate-100">{percentProgress.toFixed(1)}%</span>
                        <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">COMPLETED</p>
                      </div>
                    </div>

                    <div className="text-center font-mono text-xs text-slate-400">
                      {daysElapsed}/{totalDays} DAYS PASSED
                    </div>
                  </>
                )}
              </div>

              {/* Session timer card */}
              <div className={`glass-card card-glow-teal p-6 rounded-2xl border ${isSessionActive ? "border-teal-500/25 bg-teal-950/5" : "border-white/5"} text-center`}>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Study Stopwatch</h3>
                <div className="text-3xl font-black font-mono text-slate-100 mb-6 tracking-wider">
                  {formatStopwatch(sessionSeconds)}
                </div>
                <button
                  onClick={handleToggleSession}
                  style={{ color: "#ffffff" }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 ${
                    isSessionActive
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-teal-600 hover:bg-teal-500 text-white"
                  }`}
                >
                  <Play size={12} className={isSessionActive ? "hidden" : "block"} />
                  <span>{isSessionActive ? "Stop & Save Session" : "Start Session Timer"}</span>
                </button>
              </div>
            </div>

            {/* Right Side tabs roadmap/logs */}
            <div ref={logsRef} className="lg:col-span-2 space-y-6">
              {/* Tab Selector */}
              <div className="flex border-b border-white/5 justify-between items-center pr-2">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("roadmap")}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                      activeTab === "roadmap" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {milestones.length}-Month Roadmap
                  </button>
                  <button
                    onClick={() => setActiveTab("studied")}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                      activeTab === "studied" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Studied Log ({filteredStudyLogs.length})
                  </button>
                </div>

                {activeTab === "studied" && (
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Total: <span className="text-indigo-400">{totalStudyHours}h</span>
                  </span>
                )}
              </div>

              {/* Tab Content */}
              {activeTab === "roadmap" ? (
                (() => {
                  const totalPages = Math.ceil(dynamicMilestones.length / MILESTONES_PER_PAGE);
                  const pagedMilestones = dynamicMilestones.slice(
                    (roadmapPage - 1) * MILESTONES_PER_PAGE,
                    roadmapPage * MILESTONES_PER_PAGE
                  );
                  return (
                  <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pagedMilestones.length === 0 ? (
                      <div className="col-span-full py-8 text-center text-xs text-slate-500 italic border border-dashed border-white/5 rounded-xl">
                        No milestones logged yet. Click "+ Add Milestone" below to start your roadmap!
                      </div>
                    ) : (
                      pagedMilestones.map((m) => {
                        const isCompleted = currentMs >= m.end.getTime();
                      const isActive = currentMs >= m.start.getTime() && currentMs < m.end.getTime();

                      return editingMilestoneId === m.id ? (
                        /* ── EDITABLE MILESTONE ── */
                        <div key={m.id} className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2">
                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Milestone Name</label>
                            <input type="text" value={editMilestoneForm.name} onChange={e => setEditMilestoneForm({...editMilestoneForm, name: e.target.value})}
                              className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50" />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Description</label>
                            <textarea value={editMilestoneForm.desc} onChange={e => setEditMilestoneForm({...editMilestoneForm, desc: e.target.value})} rows={2}
                              className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 resize-none" />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingMilestoneId(null)} className="flex items-center gap-1 text-xs text-slate-400 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-all cursor-pointer"><X size={12} /> Cancel</button>
                            <button
                              onClick={() => handleMilestoneEditSave(m.id)}
                              disabled={!editMilestoneForm.name.trim()}
                              style={{ color: editMilestoneForm.name.trim() ? "#ffffff" : undefined }}
                              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all ${
                                editMilestoneForm.name.trim()
                                  ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                                  : "bg-slate-800 light:bg-slate-100 text-slate-500 light:text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              <Check size={12} /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={m.id}
                          className={`p-4 rounded-xl border flex gap-3 items-start transition-all group ${
                            isCompleted
                              ? "bg-emerald-950/5 border-emerald-500/10 text-slate-500"
                              : isActive
                              ? "bg-indigo-950/20 border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                              : "bg-white/[0.01] border-white/5"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0 ${
                            isCompleted
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                              : isActive
                              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                              : "border-slate-800 text-slate-600"
                          }`}>
                            {isCompleted ? "✓" : m.id}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className={`text-xs font-bold ${isActive ? "text-slate-100" : "text-slate-300"} ${isCompleted ? "line-through text-slate-600" : ""}`}>
                              {m.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{m.desc}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 transition-all">
                            <button onClick={() => handleMilestoneEditStart(m)}
                              className="text-slate-500 hover:text-indigo-400 p-1 rounded-lg hover:bg-indigo-500/10 transition-all cursor-pointer"
                              title="Edit milestone">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => handleMilestoneDelete(m.id)}
                              className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
                              title="Delete milestone">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    }))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 px-1">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                        Page {roadmapPage} of {totalPages} &middot; {dynamicMilestones.length} milestones
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRoadmapPage(p => Math.max(1, p - 1))}
                          disabled={roadmapPage === 1}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-white/10 hover:border-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          <ChevronLeft size={12} /> Prev
                        </button>
                        <button
                          onClick={() => setRoadmapPage(p => Math.min(totalPages, p + 1))}
                          disabled={roadmapPage === totalPages}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-white/10 hover:border-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          Next <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Add Milestone button — always visible */}
                  <button
                    onClick={() => setShowAddMilestoneForm(true)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <Plus size={14} /> Add Milestone
                  </button>
              </>
                  );
                })()
              ) : (
                <div className="space-y-6">
                  {/* Quick Add Form */}
                  <form onSubmit={handleLogTopic} className="glass-card card-glow-indigo p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-grow space-y-1 w-full">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Topic Studied</label>
                      <input
                        type="text"
                        value={newTopicText}
                        onChange={(e) => setNewTopicText(e.target.value)}
                        placeholder="What topic did you practice?"
                        className="w-full bg-white/[0.02] border border-white/5 rounded-lg p-2 text-xs text-slate-300 outline-none"
                      />
                    </div>
                    <div className="w-full md:w-32 space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Minutes</label>
                      <input
                        type="number"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        placeholder="30"
                        className="w-full bg-white/[0.02] border border-white/5 rounded-lg p-2 text-xs text-slate-300 outline-none font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-lg flex items-center gap-1.5 h-10 w-full md:w-auto justify-center cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Log</span>
                    </button>
                  </form>

                  {/* Log List with Pagination */}
                  <div className="space-y-3">
                    {filteredStudyLogs.length === 0 ? (
                      <p className="text-center text-xs text-slate-600 italic py-8">No learning logs completed for {getContextLabel()}.</p>
                    ) : (
                      <div className="space-y-3 flex flex-col justify-between">
                        <div className="overflow-y-auto max-h-[350px] pr-2 space-y-3">
                          {paginatedStudyLogs.map((log) =>
                            editingLogId === log._id ? (
                              /* ── INLINE EDIT LOG ── */
                              <div key={log._id} className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2">
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Topic</label>
                                  <input type="text" value={editLogForm.topic} onChange={e => setEditLogForm({...editLogForm, topic: e.target.value})}
                                    className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Duration (min)</label>
                                    <input type="number" value={editLogForm.durationMinutes} onChange={e => setEditLogForm({...editLogForm, durationMinutes: e.target.value})}
                                      className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50" />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Date</label>
                                    <input type="date" value={editLogForm.date} onChange={e => setEditLogForm({...editLogForm, date: e.target.value})}
                                      className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50" />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setEditingLogId(null)} className="flex items-center gap-1 text-xs text-slate-400 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer"><X size={12} /> Cancel</button>
                                  <button onClick={() => handleEditLogSave(log._id)} className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg cursor-pointer"><Check size={12} /> Save</button>
                                </div>
                              </div>
                            ) : (
                              /* ── READ VIEW ── */
                              <div
                                key={log._id}
                                className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group"
                              >
                                <div>
                                  <h4 className="text-xs font-bold text-slate-200">{log.topic}</h4>
                                  <div className="flex gap-2 items-center mt-1">
                                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/20 border border-indigo-500/10 px-1.5 py-0.5 rounded">
                                      {log.durationMinutes} min
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-mono">
                                      {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleEditLogStart(log)}
                                    className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg transition-all cursor-pointer hover:bg-indigo-500/10"
                                    title="Edit Entry">
                                    <Pencil size={13} />
                                  </button>
                                  <button onClick={() => handleDeleteLog(log._id)}
                                    className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition-all cursor-pointer hover:bg-red-500/10"
                                    title="Delete Entry">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2 font-sans text-xs">
                            <button
                              onClick={() => {
                                setCurrentPage((p) => Math.max(1, p - 1));
                                if (logsRef.current) {
                                  logsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                              }}
                              disabled={currentPage === 1}
                              className="px-3 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                            >
                              Previous
                            </button>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
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
                              className="px-3 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <footer className="relative z-10 w-full border-t border-white/5 py-4 text-center">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">Personal Labs. Study Matrix Console</p>
      </footer>
    </div>
  );
}
