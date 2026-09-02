"use client";

import React, { useState, useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import SecretChatModal from "@/components/SecretChatModal";
import { 
  Activity, Moon, Trash2, Calendar, Award, Info, Loader2, Plus, Sparkles, 
  ChevronLeft, ChevronRight, Pencil, Check, X, Dumbbell, Flame, Clock, Brain, FileText
} from "lucide-react";

interface ExerciseSet {
  reps: string;
  weight: string;
}

interface ExerciseItem {
  name: string;
  sets: ExerciseSet[];
  isCustom?: boolean;
}

export default function WellnessPage() {
  const [wellnessLogs, setWellnessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Tabs for the logging form: 'exercise' | 'sleep'
  const [activeFormTab, setActiveFormTab] = useState<"exercise" | "sleep">("exercise");
  
  // Tabs for the log history: 'exercise' | 'sleep'
  const [activeLogTab, setActiveLogTab] = useState<"exercise" | "sleep">("exercise");

  // Inline edit state
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogForm, setEditLogForm] = useState<any>({
    date: "",
    type: "exercise",
    exercise: { activityName: "", hours: "0", minutes: "0", intensity: "Medium", caloriesBurned: "0", notes: "" },
    sleep: { hours: "7", minutes: "30", sleepQuality: "Good", notes: "" }
  });

  // Selected Month & Year states
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string | null>(getLocalDateString());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;
  const logsRef = useRef<HTMLDivElement>(null);

  // Stealth Secret Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const headerClickCountRef = useRef(0);
  const headerClickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Workout Builder State
  const [exercisesList, setExercisesList] = useState<ExerciseItem[]>([]);

  // Sleep Bedtime & Wakeup States
  const [bedTime, setBedTime] = useState("22:30");
  const [wakeTime, setWakeTime] = useState("06:30");

  // Logging Form states (Split into Hours & Minutes, defaulting minutes and calories to 0)
  const [exerciseForm, setExerciseForm] = useState({
    date: getLocalDateString(),
    activityName: "",
    hours: "0",
    minutes: "0",
    intensity: "Medium",
    caloriesBurned: "0",
    notes: "",
  });

  const [sleepForm, setSleepForm] = useState({
    date: getLocalDateString(),
    hours: "8",
    minutes: "0",
    sleepQuality: "Good",
    notes: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const intensityOptions = ["Low", "Medium", "High"];
  const qualityOptions = ["Poor", "Fair", "Good", "Excellent"];
  
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // Quick select exercise templates
  const exerciseTemplates = [
    { name: "Gym Workout", hours: "1", minutes: "0", intensity: "Medium", calories: 360 },
    { name: "Running", hours: "0", minutes: "30", intensity: "High", calories: 300 },
    { name: "Morning Walk", hours: "0", minutes: "45", intensity: "Low", calories: 135 },
    { name: "Cycling", hours: "0", minutes: "40", intensity: "Medium", calories: 240 },
    { name: "Yoga Session", hours: "0", minutes: "50", intensity: "Low", calories: 150 },
    { name: "Swimming", hours: "0", minutes: "30", intensity: "High", calories: 300 },
  ];

  // Preset list of gym exercises
  const presetExercises = [
    // Legs
    "Squats",
    "Leg Press",
    "Leg Curl",
    "Leg Extension",
    "Lunges",
    "Calf Raises",
    // Chest
    "Bench Press",
    "Incline Barbell Press",
    "Incline Dumbbell Press",
    "Decline Press",
    "Chest Press (Machine)",
    "Butterfly (Chest Fly)",
    "Pullover",
    "Push Ups",
    // Back
    "Lat Pulldown",
    "Pull Ups",
    "Deadlift",
    "Bent Over Row",
    // Shoulder / Arms
    "Shoulder Press",
    "Lateral Raise",
    "Bicep Curl",
    "Tricep Pushdown"
  ];

  // Helper to count exercises in notes
  const getExerciseCount = (notes: string) => {
    if (!notes) return 0;
    const matches = notes.match(/•/g);
    return matches ? matches.length : 0;
  };

  // Auto-calculate sleep duration when Bedtime or Wake Time changes
  useEffect(() => {
    if (!bedTime || !wakeTime) return;
    try {
      const [bHours, bMinutes] = bedTime.split(":").map(Number);
      const [wHours, wMinutes] = wakeTime.split(":").map(Number);

      let bedDate = new Date(2020, 0, 1, bHours, bMinutes);
      let wakeDate = new Date(2020, 0, 1, wHours, wMinutes);

      if (wakeDate < bedDate) {
        // Waking up the next day
        wakeDate.setDate(wakeDate.getDate() + 1);
      }

      const diffMs = wakeDate.getTime() - bedDate.getTime();
      const totalMinutes = Math.floor(diffMs / 60000);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;

      setSleepForm(prev => ({
        ...prev,
        hours: String(h),
        minutes: String(m)
      }));
    } catch (err) {
      console.error(err);
    }
  }, [bedTime, wakeTime]);

  // Auto-compile Workout Builder Exercises list into Form Notes
  useEffect(() => {
    if (exercisesList.length === 0) return;

    const formattedNotes = exercisesList.map(ex => {
      const setStrings = ex.sets.map((s, idx) => `Set ${idx + 1}: ${s.reps || 0} reps @ ${s.weight || 0}kg`).join(", ");
      const maxWeight = ex.sets.reduce((max, s) => Math.max(max, parseFloat(s.weight) || 0), 0);
      return `• ${ex.name}: ${ex.sets.length} sets (${setStrings}) [Max: ${maxWeight}kg]`;
    }).join("\n");

    setExerciseForm(prev => ({
      ...prev,
      notes: formattedNotes
    }));
  }, [exercisesList]);

  // Recommendation Engine: Auto-calculate sleep quality based on duration
  useEffect(() => {
    const h = parseFloat(sleepForm.hours) || 0;
    const m = parseFloat(sleepForm.minutes) || 0;
    const totalHours = h + m / 60;
    
    if (totalHours > 0) {
      let quality = "Good";
      if (totalHours < 6) quality = "Poor";
      else if (totalHours >= 6 && totalHours < 7) quality = "Fair";
      else if (totalHours >= 7 && totalHours <= 9) quality = "Good";
      else quality = "Excellent";

      setSleepForm((prev) => ({ ...prev, sleepQuality: quality }));
    }
  }, [sleepForm.hours, sleepForm.minutes]);

  // Recommendation Engine: Auto-calculate exercise intensity & estimated calories
  useEffect(() => {
    const h = parseFloat(exerciseForm.hours) || 0;
    const m = parseFloat(exerciseForm.minutes) || 0;
    const totalMinutes = h * 60 + m;

    if (totalMinutes > 0) {
      let intensity = "Medium";
      if (totalMinutes < 30) intensity = "Low";
      else if (totalMinutes > 60) intensity = "High";

      let kcalPerMin = 6;
      if (intensity === "Low") kcalPerMin = 3;
      else if (intensity === "High") kcalPerMin = 10;

      const calories = Math.round(totalMinutes * kcalPerMin);
      setExerciseForm((prev) => ({
        ...prev,
        intensity,
        caloriesBurned: String(calories),
      }));
    }
  }, [exerciseForm.hours, exerciseForm.minutes]);

  useEffect(() => {
    fetchWellnessLogs();
    fetchUnreadChatCount();

    // Poll unread chat messages count every 2.5 seconds for instant badge updates
    const chatInterval = setInterval(fetchUnreadChatCount, 2500);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadChatCount();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(chatInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const fetchUnreadChatCount = async () => {
    try {
      const res = await fetch("/api/chat/unread");
      if (res.ok) {
        const data = await res.json();
        setUnreadChatCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error fetching unread chat count:", err);
    }
  };

  const handleCloseChat = React.useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const handleMessagesRead = React.useCallback(() => {
    fetchUnreadChatCount();
  }, []);

  // Stealth triple click listener for "Wellness tracker / Exercise sessions" header
  const handleHeaderTitleClick = () => {
    headerClickCountRef.current += 1;
    if (headerClickTimerRef.current) clearTimeout(headerClickTimerRef.current);

    if (headerClickCountRef.current >= 3) {
      headerClickCountRef.current = 0;
      setIsChatOpen(true);
    } else {
      headerClickTimerRef.current = setTimeout(() => {
        headerClickCountRef.current = 0;
      }, 1500);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, selectedDate, activeLogTab]);

  const fetchWellnessLogs = async () => {
    try {
      const res = await fetch("/api/tracking/wellness");
      const data = await res.json();
      if (Array.isArray(data)) {
        setWellnessLogs(data);
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
      ...wellnessLogs.map((log) => new Date(log.date).getFullYear())
    ])
  ).sort((a, b) => b - a);

  const handleApplyTemplate = (tpl: typeof exerciseTemplates[0]) => {
    setExerciseForm({
      ...exerciseForm,
      activityName: tpl.name,
      hours: tpl.hours,
      minutes: tpl.minutes,
      intensity: tpl.intensity,
      caloriesBurned: String(tpl.calories),
    });
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      let payload: any = { type: activeFormTab };
      if (activeFormTab === "exercise") {
        if (!exerciseForm.activityName || (!exerciseForm.hours && !exerciseForm.minutes)) {
          throw new Error("Please enter activity name and duration.");
        }
        const totalMin = (parseFloat(exerciseForm.hours) || 0) * 60 + (parseFloat(exerciseForm.minutes) || 0);
        payload = {
          ...payload,
          date: exerciseForm.date,
          activityName: exerciseForm.activityName,
          durationMinutes: totalMin,
          intensity: exerciseForm.intensity,
          caloriesBurned: exerciseForm.caloriesBurned || "0",
          notes: exerciseForm.notes,
        };
      } else {
        if (!sleepForm.hours && !sleepForm.minutes) {
          throw new Error("Please enter sleep duration.");
        }
        
        // Frontend duplicate sleep record check
        const inputDateStr = sleepForm.date;
        const alreadyExists = wellnessLogs.some(log => 
          log.type === "sleep" && 
          new Date(log.date).toISOString().split("T")[0] === inputDateStr
        );
        if (alreadyExists) {
          throw new Error("already record submited for the date update the next sleep time");
        }

        const totalHrs = (parseFloat(sleepForm.hours) || 0) + (parseFloat(sleepForm.minutes) || 0) / 60;
        const timeNote = `Bedtime: ${bedTime}, Wakeup: ${wakeTime}`;
        const finalNotes = sleepForm.notes ? `${timeNote}. ${sleepForm.notes}` : timeNote;

        payload = {
          ...payload,
          date: sleepForm.date,
          sleepHours: totalHrs,
          sleepQuality: sleepForm.sleepQuality,
          notes: finalNotes,
        };
      }

      const res = await fetch("/api/tracking/wellness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const newLog = await res.json();

      if (!res.ok) {
        throw new Error(newLog.error || "Failed to save wellness log");
      }

      // Add to logs timeline state
      setWellnessLogs([newLog, ...wellnessLogs]);

      // Shift selectors to newly added log date
      setSelectedDate(payload.date);
      const newLogDate = new Date(payload.date);
      setSelectedMonth(newLogDate.getMonth());
      setSelectedYear(newLogDate.getFullYear());
      setActiveLogTab(activeFormTab);

      // Reset forms
      if (activeFormTab === "exercise") {
        setExerciseForm({
          date: getLocalDateString(),
          activityName: "",
          hours: "0",
          minutes: "0",
          intensity: "Medium",
          caloriesBurned: "0",
          notes: "",
        });
        setExercisesList([]);
      } else {
        setSleepForm({
          date: getLocalDateString(),
          hours: "8",
          minutes: "0",
          sleepQuality: "Good",
          notes: "",
        });
      }

      setSuccess("Activity logged successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to log stats.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wellness record?")) return;

    try {
      const res = await fetch(`/api/tracking/wellness?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setWellnessLogs(wellnessLogs.filter((log) => log._id !== id));
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete wellness log");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditStart = (log: any) => {
    setEditingLogId(log._id);
    
    // Parse duration back into hours/minutes
    let exHours = "0";
    let exMinutes = "0";
    if (log.type === "exercise" && log.exercise?.durationMinutes) {
      exHours = String(Math.floor(log.exercise.durationMinutes / 60));
      exMinutes = String(log.exercise.durationMinutes % 60);
    }

    let slHours = "0";
    let slMinutes = "0";
    if (log.type === "sleep" && log.sleep?.sleepHours) {
      const totalHrs = log.sleep.sleepHours;
      slHours = String(Math.floor(totalHrs));
      slMinutes = String(Math.round((totalHrs - Math.floor(totalHrs)) * 60));
    }

    setEditLogForm({
      date: new Date(log.date).toISOString().split("T")[0],
      type: log.type,
      exercise: log.type === "exercise" ? {
        activityName: log.exercise?.activityName || "",
        hours: exHours,
        minutes: exMinutes,
        intensity: log.exercise?.intensity || "Medium",
        caloriesBurned: String(log.exercise?.caloriesBurned || ""),
        notes: log.exercise?.notes || "",
      } : { activityName: "", hours: "0", minutes: "0", intensity: "Medium", caloriesBurned: "0", notes: "" },
      sleep: log.type === "sleep" ? {
        hours: slHours,
        minutes: slMinutes,
        sleepQuality: log.sleep?.sleepQuality || "Good",
        notes: log.sleep?.notes || "",
      } : { hours: "8", minutes: "0", sleepQuality: "Good", notes: "" }
    });
  };

  const handleEditSave = async (id: string) => {
    try {
      let payload: any = { type: editLogForm.type, date: editLogForm.date };
      if (editLogForm.type === "exercise") {
        const totalMin = (parseFloat(editLogForm.exercise.hours) || 0) * 60 + (parseFloat(editLogForm.exercise.minutes) || 0);
        payload = {
          ...payload,
          activityName: editLogForm.exercise.activityName,
          durationMinutes: totalMin,
          intensity: editLogForm.exercise.intensity,
          caloriesBurned: editLogForm.exercise.caloriesBurned || "0",
          notes: editLogForm.exercise.notes,
        };
      } else {
        const totalHrs = (parseFloat(editLogForm.sleep.hours) || 0) + (parseFloat(editLogForm.sleep.minutes) || 0) / 60;
        payload = {
          ...payload,
          sleepHours: totalHrs,
          sleepQuality: editLogForm.sleep.sleepQuality,
          notes: editLogForm.sleep.notes,
        };
      }

      const res = await fetch(`/api/tracking/wellness?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setWellnessLogs(wellnessLogs.map((l) => (l._id === id ? updated : l)));
        setEditingLogId(null);
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
  const filteredLogs = wellnessLogs.filter((log) => {
    const logDate = new Date(log.date);
    if (selectedDate) {
      return logDate.toDateString() === new Date(selectedDate).toDateString();
    }
    const monthMatches = selectedMonth === -1 || logDate.getMonth() === selectedMonth;
    const yearMatches = selectedYear === -1 || logDate.getFullYear() === selectedYear;
    return monthMatches && yearMatches;
  });

  // Split into exercise and sleep logs for aggregation
  const filteredExercises = filteredLogs.filter((log) => log.type === "exercise");
  const filteredSleep = filteredLogs.filter((log) => log.type === "sleep");

  // Calculate Exercise Stats
  const totalWorkouts = filteredExercises.length;
  const avgWorkoutDuration = totalWorkouts > 0 
    ? filteredExercises.reduce((acc, curr) => acc + (curr.exercise?.durationMinutes || 0), 0) / totalWorkouts 
    : 0;
  const totalCalories = filteredExercises.reduce((acc, curr) => acc + (curr.exercise?.caloriesBurned || 0), 0);

  // Calculate Sleep Stats
  const sleepDays = filteredSleep.length;
  const avgSleepHours = sleepDays > 0 
    ? filteredSleep.reduce((acc, curr) => acc + (curr.sleep?.sleepHours || 0), 0) / sleepDays 
    : 0;
  const sleepQualityCounts = filteredSleep.reduce((acc: any, curr) => {
    const q = curr.sleep?.sleepQuality || "Good";
    acc[q] = (acc[q] || 0) + 1;
    return acc;
  }, {});

  // Pagination calculations (split by selected logs tab)
  const activeTabLogs = filteredLogs.filter(log => log.type === activeLogTab);
  const totalPages = Math.ceil(activeTabLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = activeTabLogs.slice(
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
            <div
              onClick={handleHeaderTitleClick}
              className="cursor-pointer select-none group transition-all"
              title="Wellness Console"
            >
              <div className="flex items-center gap-2">
                <h2 className={`page-heading text-xl font-black uppercase tracking-widest transition-colors duration-300 ${
                  unreadChatCount > 0
                    ? "text-amber-500 dark:text-amber-400 font-black animate-pulse"
                    : "text-slate-900 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400"
                }`}>
                  Wellness tracker
                </h2>
                {unreadChatCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-black text-white bg-amber-500 rounded-full shadow-md shadow-amber-500/40 animate-bounce font-mono">
                    {unreadChatCount}
                  </span>
                )}
              </div>
              <p className={`page-subheading text-xs uppercase tracking-wider mt-0.5 transition-colors duration-300 ${
                unreadChatCount > 0
                  ? "text-amber-600 dark:text-amber-300 font-bold"
                  : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
              }`}>
                Exercise sessions & sleep diagnostics console
              </p>
            </div>

            {/* Premium Theme-Responsive Month/Year/Date selection bar with iPhone visibility fix */}
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

          {/* Aggregated Diagnostics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Exercise Diagnostics */}
            <div className="glass-card card-glow-teal p-6 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[160px]">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Workout Diagnostics</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Aggregated exercise stats ({getContextLabel()})</p>
                  </div>
                </div>
                <span className="text-[10px] bg-teal-950/40 border border-teal-500/20 px-2.5 py-1 rounded-full text-teal-400 font-bold font-mono">
                  {totalWorkouts} SESSION{totalWorkouts !== 1 && "S"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/5 pt-4">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Avg Duration</p>
                  <p className="text-lg font-black font-mono text-slate-200 mt-0.5">{avgWorkoutDuration.toFixed(0)} min</p>
                </div>
                <div>
                  <p className="text-lg font-black font-mono text-teal-400 mt-0.5">{totalCalories} kcal</p>
                </div>
              </div>
            </div>

            {/* Sleep Diagnostics */}
            <div className="glass-card card-glow-indigo p-6 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[160px]">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Moon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Sleep Diagnostics</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Aggregated sleep analysis ({getContextLabel()})</p>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-950/40 border border-indigo-500/20 px-2.5 py-1 rounded-full text-indigo-400 font-bold font-mono">
                  {sleepDays} LOGGED DAY{sleepDays !== 1 && "S"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/5 pt-4">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Avg Rest Time</p>
                  <p className="text-lg font-black font-mono text-slate-200 mt-0.5">{avgSleepHours.toFixed(1)} hrs</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Top Quality</p>
                  <p className="text-lg font-black font-mono text-indigo-400 mt-0.5">
                    {sleepDays > 0 
                      ? Object.keys(sleepQualityCounts).reduce((a, b) => sleepQualityCounts[a] > sleepQualityCounts[b] ? a : b) 
                      : "N/A"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card card-glow-teal p-6 rounded-2xl border border-white/5">
                {/* Form Tabs */}
                <div className="flex border-b border-white/5 pb-4 mb-6 gap-2">
                  <button
                    type="button"
                    onClick={() => { setActiveFormTab("exercise"); setError(""); setSuccess(""); }}
                    className={`flex-1 py-2 rounded-xl text-center text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeFormTab === "exercise"
                        ? "bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow shadow-teal-500/5"
                        : "bg-white/[0.01] border border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Dumbbell size={14} />
                    <span>Exercise</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveFormTab("sleep"); setError(""); setSuccess(""); }}
                    className={`flex-1 py-2 rounded-xl text-center text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeFormTab === "sleep"
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow shadow-indigo-500/5"
                        : "bg-white/[0.01] border border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Moon size={14} />
                    <span>Sleep Time</span>
                  </button>
                </div>

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

                <form onSubmit={handleLogSubmit} className="space-y-4">
                  {activeFormTab === "exercise" ? (
                    /* ── EXERCISE INPUTS ── */
                    <>
                      {/* Date */}
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">Date</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                            <Calendar size={14} />
                          </span>
                          <input
                            type="date"
                            value={exerciseForm.date}
                            onChange={(e) => setExerciseForm({ ...exerciseForm, date: e.target.value })}
                            className="w-full bg-white/[0.02] border border-white/5 focus:border-teal-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      {/* Activity Name */}
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">Activity Name</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                            <Dumbbell size={14} />
                          </span>
                          <input
                            type="text"
                            value={exerciseForm.activityName}
                            onChange={(e) => setExerciseForm({ ...exerciseForm, activityName: e.target.value })}
                            placeholder="e.g. Gym Workout, Running"
                            className="w-full bg-white/[0.02] border border-white/5 focus:border-teal-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Duration Hours */}
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">Duration (Hrs)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                              <Clock size={14} />
                            </span>
                            <input
                              type="number"
                              value={exerciseForm.hours}
                              onChange={(e) => setExerciseForm({ ...exerciseForm, hours: e.target.value })}
                              placeholder="0"
                              min="0"
                              className="w-full bg-white/[0.02] border border-white/5 focus:border-teal-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all font-mono"
                            />
                          </div>
                        </div>

                        {/* Duration Minutes */}
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">Duration (Min)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                              <Clock size={14} />
                            </span>
                            <input
                              type="number"
                              value={exerciseForm.minutes}
                              onChange={(e) => setExerciseForm({ ...exerciseForm, minutes: e.target.value })}
                              placeholder="0"
                              min="0"
                              max="59"
                              className="w-full bg-white/[0.02] border border-white/5 focus:border-teal-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Calories Burned */}
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">Calories (kcal)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                              <Flame size={14} />
                            </span>
                            <input
                              type="number"
                              value={exerciseForm.caloriesBurned}
                              onChange={(e) => setExerciseForm({ ...exerciseForm, caloriesBurned: e.target.value })}
                              placeholder="0"
                              min="0"
                              className="w-full bg-white/[0.02] border border-white/5 focus:border-teal-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all font-mono"
                            />
                          </div>
                        </div>

                        {/* Intensity Indicator */}
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">Intensity (Auto)</label>
                          <div className="bg-white/[0.01] border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-teal-400 tracking-wider text-center">
                            {exerciseForm.intensity.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Workout Set Builder */}
                      <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <h4 className="text-[10px] uppercase font-bold tracking-widest text-teal-400">
                            Workout Builder {exercisesList.length > 0 && `(${exercisesList.length} Exercises)`}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setExercisesList([{ name: "Squats", sets: [{ reps: "12", weight: "20" }] }, ...exercisesList])}
                            className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 text-[9px] font-bold py-1 px-2.5 rounded-lg cursor-pointer transition-all"
                          >
                            + Add Exercise
                          </button>
                        </div>

                        {exercisesList.length === 0 ? (
                          <p className="text-[9px] text-slate-500 italic">No exercises added yet. Use the builder to record sets and weights dynamically.</p>
                        ) : (
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                            {exercisesList.map((ex, exIdx) => (
                              <div key={exIdx} className="bg-white/[0.02] border border-white/5 p-3 rounded-lg space-y-3 relative">
                                <button
                                  type="button"
                                  onClick={() => setExercisesList(exercisesList.filter((_, idx) => idx !== exIdx))}
                                  className="absolute top-2 right-2 text-red-500 hover:text-red-400 p-1 cursor-pointer"
                                  title="Remove Exercise"
                                >
                                  <X size={12} />
                                </button>

                                <div className="space-y-1 pr-6">
                                  <label className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Exercise Name</label>
                                  <select
                                    value={ex.isCustom ? "Custom" : ex.name}
                                    onChange={(e) => {
                                      const updated = [...exercisesList];
                                      if (e.target.value === "Custom") {
                                        updated[exIdx].isCustom = true;
                                        updated[exIdx].name = "";
                                      } else {
                                        updated[exIdx].isCustom = false;
                                        updated[exIdx].name = e.target.value;
                                      }
                                      setExercisesList(updated);
                                    }}
                                    className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
                                  >
                                    {presetExercises.map(pe => <option key={pe} value={pe}>{pe}</option>)}
                                    <option value="Custom">-- Custom Exercise --</option>
                                  </select>

                                  {ex.isCustom && (
                                    <input
                                      type="text"
                                      value={ex.name}
                                      placeholder="Enter custom exercise name"
                                      onChange={(e) => {
                                        const updated = [...exercisesList];
                                        updated[exIdx].name = e.target.value;
                                        setExercisesList(updated);
                                      }}
                                      className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200"
                                    />
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Sets & Reps</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...exercisesList];
                                        const lastSet = ex.sets[ex.sets.length - 1] || { reps: "12", weight: "20" };
                                        updated[exIdx].sets.push({ ...lastSet });
                                        setExercisesList(updated);
                                      }}
                                      className="text-[8px] text-teal-400 hover:underline cursor-pointer"
                                    >
                                      + Add Set
                                    </button>
                                  </div>

                                  <div className="space-y-1.5 font-sans">
                                    {ex.sets.map((set, setIdx) => (
                                      <div key={setIdx} className="flex items-center gap-2 text-xs font-mono">
                                        <span className="text-[9px] text-slate-600 w-8">Set {setIdx + 1}:</span>
                                        <input
                                          type="number"
                                          value={set.reps}
                                          onChange={(e) => {
                                            const updated = [...exercisesList];
                                            updated[exIdx].sets[setIdx].reps = e.target.value;
                                            setExercisesList(updated);
                                          }}
                                          placeholder="12"
                                          className="w-12 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-center text-slate-300 font-mono"
                                        />
                                        <span className="text-[9px] text-slate-600">reps @</span>
                                        <input
                                          type="number"
                                          value={set.weight}
                                          onChange={(e) => {
                                            const updated = [...exercisesList];
                                            updated[exIdx].sets[setIdx].weight = e.target.value;
                                            setExercisesList(updated);
                                          }}
                                          placeholder="20"
                                          className="w-14 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-center text-slate-300 font-mono"
                                        />
                                        <span className="text-[9px] text-slate-600">kg</span>

                                        {ex.sets.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = [...exercisesList];
                                              updated[exIdx].sets = ex.sets.filter((_, idx) => idx !== setIdx);
                                              setExercisesList(updated);
                                            }}
                                            className="text-red-500 hover:text-red-400 ml-1 cursor-pointer"
                                          >
                                            <Trash2 size={10} />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Workout Details Notes */}
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-teal-400">
                          Workout Details / Notes
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 pt-2 text-slate-600">
                            <FileText size={14} />
                          </span>
                          <textarea
                            value={exerciseForm.notes}
                            onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })}
                            placeholder="e.g. Squats: 20kg + 20kg (40kg) 10 reps x 3 sets, Leg Press: 200kg"
                            rows={3}
                            className="w-full bg-white/[0.02] border border-white/5 focus:border-teal-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all resize-none font-sans"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    /* ── SLEEP INPUTS ── */
                    <>
                      {/* Date */}
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">Date</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                            <Calendar size={14} />
                          </span>
                          <input
                            type="date"
                            value={sleepForm.date}
                            onChange={(e) => setSleepForm({ ...sleepForm, date: e.target.value })}
                            className="w-full bg-white/[0.02] border border-white/5 focus:border-indigo-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      {/* Bedtime & Wake Up Time Pickers */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">Bedtime</label>
                          <div className="relative">
                            <input
                              type="time"
                              value={bedTime}
                              onChange={(e) => setBedTime(e.target.value)}
                              className="w-full bg-white/[0.02] border border-white/5 focus:border-indigo-500/50 rounded-xl py-2 px-3 text-xs text-slate-200 outline-none transition-all font-mono"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">Wake Up Time</label>
                          <div className="relative">
                            <input
                              type="time"
                              value={wakeTime}
                              onChange={(e) => setWakeTime(e.target.value)}
                              className="w-full bg-white/[0.02] border border-white/5 focus:border-indigo-500/50 rounded-xl py-2 px-3 text-xs text-slate-200 outline-none transition-all font-mono"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Sleep Hours (Automatically computed, read-only to show calculations) */}
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">Calculated Hours</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                              <Clock size={14} />
                            </span>
                            <input
                              type="number"
                              value={sleepForm.hours}
                              readOnly
                              className="w-full bg-white/[0.01] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-400 outline-none font-mono cursor-not-allowed"
                            />
                          </div>
                        </div>

                        {/* Sleep Minutes (Automatically computed) */}
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">Calculated Minutes</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                              <Clock size={14} />
                            </span>
                            <input
                              type="number"
                              value={sleepForm.minutes}
                              readOnly
                              className="w-full bg-white/[0.01] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-400 outline-none font-mono cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sleep Quality */}
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">Sleep Quality (Auto)</label>
                        <div className="grid grid-cols-4 gap-1">
                          {qualityOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setSleepForm({ ...sleepForm, sleepQuality: opt })}
                              className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                                sleepForm.sleepQuality === opt
                                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                  : "bg-white/[0.01] text-slate-500 border-transparent hover:text-slate-300 pointer-events-none opacity-40"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sleep Notes */}
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">Rest Notes</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                            <Brain size={14} />
                          </span>
                          <input
                            type="text"
                            value={sleepForm.notes}
                            onChange={(e) => setSleepForm({ ...sleepForm, notes: e.target.value })}
                            placeholder="e.g. Felt refreshed, woke up once"
                            className="w-full bg-white/[0.02] border border-white/5 focus:border-indigo-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full mt-4 bg-gradient-to-r ${
                      activeFormTab === "exercise" 
                        ? "from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 shadow-teal-500/20" 
                        : "from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/20"
                    } disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-lg transition-all`}
                  >
                    {submitting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Plus size={12} />
                    )}
                    <span>Log {activeFormTab === "exercise" ? "Workout" : "Sleep Record"}</span>
                  </button>
                </form>
              </div>

              {/* Quick Exercise Templates */}
              {activeFormTab === "exercise" && (
                <div className="glass-card card-glow-teal p-6 rounded-2xl border border-white/5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Workout Templates</h3>
                  <div className="flex flex-wrap gap-2">
                    {exerciseTemplates.map((tpl) => (
                      <button
                        key={tpl.name}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        className="bg-white/[0.02] hover:bg-teal-500/10 border border-white/5 hover:border-teal-500/30 text-slate-400 hover:text-teal-400 text-[10px] font-bold py-1 px-2.5 rounded-lg transition-all cursor-pointer"
                      >
                        {tpl.name} ({tpl.hours !== "0" ? `${tpl.hours}h ` : ""}{tpl.minutes}m)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Logs Column with Split Tabs */}
            <div ref={logsRef} className="lg:col-span-2">
              <div className="glass-card card-glow-indigo p-6 rounded-2xl border border-white/5 h-full flex flex-col min-h-[400px]">
                
                {/* Log Header Tab Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4 mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                    <span>Wellness Logs ({getContextLabel()})</span>
                  </h3>
                  
                  <div className="flex gap-1.5 bg-white/[0.01] border border-white/5 p-1 rounded-xl w-full sm:w-auto">
                    <button
                      onClick={() => setActiveLogTab("exercise")}
                      className={`flex-1 sm:flex-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        activeLogTab === "exercise"
                          ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Workouts
                    </button>
                    <button
                      onClick={() => setActiveLogTab("sleep")}
                      className={`flex-1 sm:flex-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        activeLogTab === "sleep"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Sleep Logs
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex-grow flex items-center justify-center">
                    <Loader2 size={20} className="text-slate-600 animate-spin" />
                  </div>
                ) : activeTabLogs.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center text-center text-xs text-slate-600 italic">
                    No {activeLogTab === "exercise" ? "workout logs" : "sleep logs"} recorded for {getContextLabel()}.
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="overflow-y-auto max-h-[500px] pr-2 space-y-3">
                      {paginatedLogs.map((log) =>
                        editingLogId === log._id ? (
                          /* ── INLINE EDIT ROW ── */
                          <div key={log._id} className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Date</label>
                                <input 
                                  type="date" 
                                  value={editLogForm.date} 
                                  onChange={e => setEditLogForm({...editLogForm, date: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" 
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Log Type</label>
                                <select 
                                  value={editLogForm.type} 
                                  onChange={e => setEditLogForm({...editLogForm, type: e.target.value})}
                                  className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                                >
                                  <option value="exercise">Exercise</option>
                                  <option value="sleep">Sleep</option>
                                </select>
                              </div>
                            </div>

                            {editLogForm.type === "exercise" ? (
                              <>
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Activity Name</label>
                                  <input 
                                    type="text" 
                                    value={editLogForm.exercise.activityName} 
                                    onChange={e => setEditLogForm({
                                      ...editLogForm,
                                      exercise: { ...editLogForm.exercise, activityName: e.target.value }
                                    })}
                                    className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" 
                                  />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Hours</label>
                                    <input 
                                      type="number" 
                                      value={editLogForm.exercise.hours} 
                                      onChange={e => setEditLogForm({
                                        ...editLogForm,
                                        exercise: { ...editLogForm.exercise, hours: e.target.value }
                                      })}
                                      className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none font-mono" 
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Min</label>
                                    <input 
                                      type="number" 
                                      value={editLogForm.exercise.minutes} 
                                      onChange={e => setEditLogForm({
                                        ...editLogForm,
                                        exercise: { ...editLogForm.exercise, minutes: e.target.value }
                                      })}
                                      className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none font-mono" 
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Intensity</label>
                                    <select 
                                      value={editLogForm.exercise.intensity} 
                                      onChange={e => setEditLogForm({
                                        ...editLogForm,
                                        exercise: { ...editLogForm.exercise, intensity: e.target.value }
                                      })}
                                      className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                                    >
                                      {intensityOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Calories</label>
                                    <input 
                                      type="number" 
                                      value={editLogForm.exercise.caloriesBurned} 
                                      onChange={e => setEditLogForm({
                                        ...editLogForm,
                                        exercise: { ...editLogForm.exercise, caloriesBurned: e.target.value }
                                      })}
                                      className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none font-mono" 
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Workout Notes</label>
                                  <textarea 
                                    value={editLogForm.exercise.notes} 
                                    onChange={e => setEditLogForm({
                                      ...editLogForm,
                                      exercise: { ...editLogForm.exercise, notes: e.target.value }
                                    })}
                                    rows={3}
                                    className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none resize-none font-sans" 
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Hours</label>
                                    <input 
                                      type="number" 
                                      value={editLogForm.sleep.hours} 
                                      onChange={e => setEditLogForm({
                                        ...editLogForm,
                                        sleep: { ...editLogForm.sleep, hours: e.target.value }
                                      })}
                                      className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none font-mono" 
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Minutes</label>
                                    <input 
                                      type="number" 
                                      value={editLogForm.sleep.minutes} 
                                      onChange={e => setEditLogForm({
                                        ...editLogForm,
                                        sleep: { ...editLogForm.sleep, minutes: e.target.value }
                                      })}
                                      className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none font-mono" 
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Quality</label>
                                    <select 
                                      value={editLogForm.sleep.sleepQuality} 
                                      onChange={e => setEditLogForm({
                                        ...editLogForm,
                                        sleep: { ...editLogForm.sleep, sleepQuality: e.target.value }
                                      })}
                                      className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                                    >
                                      {qualityOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Notes</label>
                                  <input 
                                    type="text" 
                                    value={editLogForm.sleep.notes} 
                                    onChange={e => setEditLogForm({
                                      ...editLogForm,
                                      sleep: { ...editLogForm.sleep, notes: e.target.value }
                                    })}
                                    className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" 
                                  />
                                </div>
                              </>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button onClick={() => setEditingLogId(null)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10 transition-all cursor-pointer">
                                <X size={12} /> Cancel
                              </button>
                              <button onClick={() => handleEditSave(log._id)} className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                                <Check size={12} /> Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ── READ VIEW ROW ── */
                          <div
                            key={log._id}
                            className="flex flex-col p-4 rounded-xl border border-white/5 light:border-slate-200 bg-white/[0.01] light:bg-slate-50 hover:bg-white/[0.03] light:hover:bg-slate-100/80 transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 min-w-0 flex-grow">
                                {/* Icon based on log type */}
                                <div className={`w-9 h-9 rounded-lg border flex flex-col items-center justify-center flex-shrink-0 ${
                                  log.type === "exercise" 
                                    ? "bg-teal-500/5 border-teal-500/10 text-teal-400 light:bg-teal-50 light:border-teal-200 light:text-teal-600" 
                                    : "bg-indigo-500/5 border-indigo-500/10 text-indigo-400 light:bg-indigo-50 light:border-indigo-200 light:text-indigo-600"
                                }`}>
                                  {log.type === "exercise" ? <Dumbbell size={16} /> : <Moon size={16} />}
                                </div>

                                <div className="min-w-0 flex-grow">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-xs font-bold text-slate-200 light:text-slate-800 break-all pr-2">
                                      {log.type === "exercise" ? log.exercise?.activityName : `Sleep Session`}
                                    </p>
                                    {log.type === "exercise" && getExerciseCount(log.exercise?.notes) > 0 && (
                                      <span className="bg-teal-500/10 text-teal-400 border border-teal-500/25 light:bg-teal-100 light:text-teal-700 light:border-teal-300 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-sans">
                                        {getExerciseCount(log.exercise?.notes)} Exercises
                                      </span>
                                    )}
                                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono flex-shrink-0 border ${
                                      log.type === "exercise"
                                        ? "bg-teal-950/20 text-teal-400 border-teal-500/10 light:bg-teal-50 light:text-teal-600 light:border-teal-200"
                                        : "bg-indigo-950/20 text-indigo-400 border-indigo-500/10 light:bg-indigo-50 light:text-indigo-600 light:border-indigo-200"
                                    }`}>
                                      {log.type === "exercise" 
                                        ? `${Math.floor(log.exercise?.durationMinutes / 60) > 0 ? `${Math.floor(log.exercise?.durationMinutes / 60)}h ` : ""}${log.exercise?.durationMinutes % 60}m • ${log.exercise?.intensity} Intensity`
                                        : `${Math.floor(log.sleep?.sleepHours)}h ${Math.round((log.sleep?.sleepHours - Math.floor(log.sleep?.sleepHours)) * 60)}m • Quality: ${log.sleep?.sleepQuality}`
                                      }
                                    </span>
                                  </div>
                                  <span className="inline-block text-[9px] uppercase tracking-wider font-bold font-mono text-slate-500 light:text-slate-600 mt-1">
                                    {log.type === "exercise" 
                                      ? `Estimated burn: ${log.exercise?.caloriesBurned || 0} kcal`
                                      : (log.sleep?.notes ? `Notes: ${log.sleep?.notes}` : "No sleep notes logged")
                                    } • {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleEditStart(log)}
                                  className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10 transition-all cursor-pointer"
                                  title="Edit Entry"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => handleDelete(log._id)}
                                  className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
                                  title="Delete Log"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Additional notes display for Exercises with High Contrast styling */}
                            {log.type === "exercise" && log.exercise?.notes && (
                              <div className="mt-2 ml-13 p-3 rounded-lg bg-teal-500/[0.04] dark:bg-teal-950/20 border border-teal-500/10 dark:border-teal-500/20 light:bg-teal-50/50 light:border-teal-100 text-[10px] text-slate-700 light:text-slate-800 dark:text-slate-300 font-sans leading-relaxed break-words whitespace-pre-line">
                                <strong className="text-[9px] uppercase font-bold text-teal-600 light:text-teal-700 dark:text-teal-400 font-mono block mb-1">Workout details:</strong>
                                {log.exercise.notes}
                              </div>
                            )}
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
        <p className="text-[10px] uppercase tracking-widest text-slate-600">Personal Labs. Wellness tracker console</p>
      </footer>

      {/* Stealth Secret Chat Modal */}
      <SecretChatModal
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        onMessagesRead={handleMessagesRead}
      />
    </div>
  );
}
