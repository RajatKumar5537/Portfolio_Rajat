"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Navigation from "@/components/Navigation";
import { BookOpen, Play, Calendar, Trash2, Loader2, Sparkles, Flame, Plus, Settings, ChevronLeft, ChevronRight, Pencil, Check, X, ListTodo, CheckCircle2, Clock, PlayCircle, Layers, Filter, ArrowRight, RotateCcw, Kanban, LayoutGrid, List } from "lucide-react";

export type StudyStatus = "todo" | "in_progress" | "completed";

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
  const { data: session } = useSession();
  const userEmailLower = session?.user?.email?.toLowerCase();
  const isRajat = userEmailLower === "kumarrajatpradhan5537@gmail.com" || userEmailLower === "kumarrajatpradhan5364@gmail.com";
  const userIdentifier = (session?.user as any)?.id || session?.user?.email || "guest";

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

  // Status Filter ("all" | "todo" | "in_progress" | "completed")
  const [statusFilter, setStatusFilter] = useState<"all" | StudyStatus>("all");

  // View Mode: "board" (Jira-style cards) or "list" (Table/List)
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [mobileBoardTab, setMobileBoardTab] = useState<"all" | StudyStatus>("all");

  // Inline Task Bar inputs for each Jira column
  const [inlineTaskInput, setInlineTaskInput] = useState<{
    todo: string;
    in_progress: string;
    completed: string;
  }>({
    todo: "",
    in_progress: "",
    completed: "",
  });

  const [inlineDurationInput, setInlineDurationInput] = useState<{
    todo: string;
    in_progress: string;
    completed: string;
  }>({
    todo: "30",
    in_progress: "30",
    completed: "30",
  });

  const [columnSubmitting, setColumnSubmitting] = useState<StudyStatus | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<"roadmap" | "studied">("roadmap");

  // Editable milestones (loaded from database/localStorage on mount)
  const [milestones, setMilestones] = useState<any[]>([]);
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null);
  const [editMilestoneForm, setEditMilestoneForm] = useState({ name: "", desc: "" });
  const [showAddMilestoneForm, setShowAddMilestoneForm] = useState(false);
  const [newMilestoneForm, setNewMilestoneForm] = useState({ name: "", desc: "" });
  const [roadmapPage, setRoadmapPage] = useState(1);
  const MILESTONES_PER_PAGE = 6;

  // Study log inline edit
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogForm, setEditLogForm] = useState<{ topic: string; durationMinutes: string; date: string; status: StudyStatus }>({
    topic: "",
    durationMinutes: "",
    date: "",
    status: "completed",
  });
  
  // Quick Add Topic input state
  const [newTopicText, setNewTopicText] = useState("");
  const [newDuration, setNewDuration] = useState("30");
  const [newStatus, setNewStatus] = useState<StudyStatus>("completed");

  // Stopwatch state & active session task tracking
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [activeSessionTask, setActiveSessionTask] = useState<{ id?: string; topic: string } | null>(null);
  const [selectedTaskForTimer, setSelectedTaskForTimer] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Save Session Modal State
  const [showSaveSessionModal, setShowSaveSessionModal] = useState(false);
  const [saveSessionForm, setSaveSessionForm] = useState<{
    id?: string;
    topic: string;
    durationMinutes: string;
    status: StudyStatus;
    date: string;
  }>({
    topic: "",
    durationMinutes: "30",
    status: "completed",
    date: new Date().toISOString().split("T")[0],
  });

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [isGoalSet, setIsGoalSet] = useState(false);
  const [goalStartDate, setGoalStartDate] = useState<Date | null>(null);
  const [goalEndDate, setGoalEndDate] = useState<Date | null>(null);
  const [inputStartDate, setInputStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [inputDuration, setInputDuration] = useState<number>(1);
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
        const uEmail = session?.user?.email?.toLowerCase();
        const isRajatUser = uEmail === "kumarrajatpradhan5537@gmail.com" || uEmail === "kumarrajatpradhan5364@gmail.com";
        const uId = (session?.user as any)?.id || session?.user?.email || "guest";

        const res = await fetch("/api/tracking/study/roadmap");
        if (res.ok) {
          const data = await res.json();
          if (data && !data.default) {
            const start = new Date(data.startDate);
            setGoalStartDate(start);
            setInputStartDate(data.startDate.split("T")[0]);
            setInputDuration(data.duration || 1);
            setInputDurationUnit(data.durationUnit || "months");
            setGoalEndDate(calculateEndDate(start, data.duration || 1, data.durationUnit || "months"));
            setMilestones(data.milestones || []);
            setIsGoalSet(true);
            return;
          }
        }

        // Fallback to user-scoped localStorage if default or API fails
        const savedStart = localStorage.getItem(`goal_start_date_${uId}`);
        const savedDuration = localStorage.getItem(`goal_duration_${uId}`);
        const savedUnit = localStorage.getItem(`goal_duration_unit_${uId}`);
        const savedMilestones = localStorage.getItem(`custom_milestones_${uId}`);

        let loadedMilestones = [];
        if (savedMilestones) {
          try { loadedMilestones = JSON.parse(savedMilestones); } catch {}
        } else if (isRajatUser) {
          loadedMilestones = MILESTONE_TEMPLATES;
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
          setIsGoalSet(true);
        } else if (isRajatUser) {
          // Initialize defaults for Rajat
          setGoalStartDate(DEFAULT_START_DATE);
          setInputStartDate("2026-08-25");
          setInputDuration(6);
          setInputDurationUnit("months");
          setGoalEndDate(DEFAULT_END_DATE);
          setIsGoalSet(true);
        } else {
          // Fresh user: goal is not set yet (0/0 days, 00:00:00:00 countdown)
          const todayStr = new Date().toISOString().split("T")[0];
          setGoalStartDate(null);
          setInputStartDate(todayStr);
          setInputDuration(1);
          setInputDurationUnit("months");
          setGoalEndDate(null);
          setIsGoalSet(false);
        }
      } catch (err) {
        console.error("Error loading roadmap data: ", err);
      }
    };

    if (session?.user) {
      fetchRoadmapData();
    }
    fetchStudyLogs();

    // Persistent stopwatch initial load
    const stopwatchActive = localStorage.getItem("study_stopwatch_is_active") === "true";
    const savedTaskId = localStorage.getItem("study_stopwatch_task_id") || undefined;
    const savedTaskTopic = localStorage.getItem("study_stopwatch_task_topic") || "";
    if (savedTaskTopic) {
      setActiveSessionTask({ id: savedTaskId, topic: savedTaskTopic });
    }

    if (stopwatchActive) {
      const startTime = Number(localStorage.getItem("study_stopwatch_start_time") || Date.now());
      const accumulated = Number(localStorage.getItem("study_stopwatch_accumulated_seconds") || 0);
      const elapsed = Math.round((Date.now() - startTime) / 1000) + accumulated;
      setSessionSeconds(elapsed);
      setIsSessionActive(true);
    } else {
      const accumulated = Number(localStorage.getItem("study_stopwatch_accumulated_seconds") || 0);
      setSessionSeconds(accumulated);
      setIsSessionActive(false);
    }

    // Sync state if stopwatch status is changed globally (e.g. from the float pill on other pages)
    const handleStopwatchChanged = () => {
      const active = localStorage.getItem("study_stopwatch_is_active") === "true";
      const syncTopic = localStorage.getItem("study_stopwatch_task_topic") || "";
      const syncId = localStorage.getItem("study_stopwatch_task_id") || undefined;
      if (syncTopic) {
        setActiveSessionTask({ id: syncId, topic: syncTopic });
      } else {
        setActiveSessionTask(null);
      }

      if (active) {
        setIsSessionActive(true);
        const startTime = Number(localStorage.getItem("study_stopwatch_start_time") || Date.now());
        const accumulated = Number(localStorage.getItem("study_stopwatch_accumulated_seconds") || 0);
        const elapsed = Math.round((Date.now() - startTime) / 1000) + accumulated;
        setSessionSeconds(elapsed);
      } else {
        setIsSessionActive(false);
        const accumulated = Number(localStorage.getItem("study_stopwatch_accumulated_seconds") || 0);
        setSessionSeconds(accumulated);
        // Reload logs since a study log may have been saved by the global floating widget
        fetchStudyLogs();
      }
    };
    window.addEventListener("study-stopwatch-changed", handleStopwatchChanged);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("study-stopwatch-changed", handleStopwatchChanged);
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
      const startTime = Number(localStorage.getItem("study_stopwatch_start_time") || Date.now());
      const accumulated = Number(localStorage.getItem("study_stopwatch_accumulated_seconds") || 0);

      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTime) / 1000) + accumulated;
        setSessionSeconds(elapsed);
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

  const saveRoadmapToDB = async (start: Date | null, dur: number, unit: "months" | "days", milestonesList: any[]) => {
    try {
      await fetch("/api/tracking/study/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: start ? start.toISOString().split("T")[0] : undefined,
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
    const uId = (session?.user as any)?.id || session?.user?.email || "guest";

    setGoalStartDate(start);
    setGoalEndDate(end);
    setIsGoalSet(true);
    setShowSettings(false);

    localStorage.setItem(`goal_start_date_${uId}`, inputStartDate);
    localStorage.setItem(`goal_duration_${uId}`, String(inputDuration));
    localStorage.setItem(`goal_duration_unit_${uId}`, inputDurationUnit);

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
          status: newStatus,
          completed: newStatus === "completed",
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

  const handleQuickAddColumnTask = async (status: StudyStatus, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = (inlineTaskInput[status] || "").trim();
    if (!text) return;
    const dur = parseInt(inlineDurationInput[status]) || 0;

    setColumnSubmitting(status);
    try {
      const res = await fetch("/api/tracking/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: text,
          durationMinutes: dur,
          status: status,
          completed: status === "completed",
        }),
      });

      if (res.ok) {
        const newLog = await res.json();
        setStudyLogs((prev) => [newLog, ...prev]);
        setInlineTaskInput((prev) => ({ ...prev, [status]: "" }));
      }
    } catch (err) {
      console.error(`Error adding ${status} task:`, err);
    } finally {
      setColumnSubmitting(null);
    }
  };

  const handleCycleStatus = async (log: any) => {
    const currentStatus: StudyStatus = log.status || (log.completed ? "completed" : "todo");
    const nextStatus: StudyStatus = currentStatus === "todo" ? "in_progress" : currentStatus === "in_progress" ? "completed" : "todo";
    
    // Optimistic state update
    setStudyLogs((prev) =>
      prev.map((l) => (l._id === log._id ? { ...l, status: nextStatus, completed: nextStatus === "completed" } : l))
    );

    try {
      const res = await fetch(`/api/tracking/study?id=${log._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          completed: nextStatus === "completed",
        }),
      });
      if (!res.ok) {
        fetchStudyLogs();
      }
    } catch (err) {
      console.error("Error cycling status:", err);
      fetchStudyLogs();
    }
  };

  const handleSetStatus = async (log: any, targetStatus: StudyStatus) => {
    setStudyLogs((prev) =>
      prev.map((l) => (l._id === log._id ? { ...l, status: targetStatus, completed: targetStatus === "completed" } : l))
    );

    try {
      const res = await fetch(`/api/tracking/study?id=${log._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          completed: targetStatus === "completed",
        }),
      });
      if (!res.ok) {
        fetchStudyLogs();
      }
    } catch (err) {
      console.error("Error setting status:", err);
      fetchStudyLogs();
    }
  };

  const handleStartTimerForTask = (log: any) => {
    const startTime = Date.now();
    localStorage.setItem("study_stopwatch_is_active", "true");
    localStorage.setItem("study_stopwatch_start_time", String(startTime));
    localStorage.setItem("study_stopwatch_accumulated_seconds", "0");
    localStorage.setItem("study_stopwatch_task_id", log._id);
    localStorage.setItem("study_stopwatch_task_topic", log.topic);

    setActiveSessionTask({ id: log._id, topic: log.topic });
    setSelectedTaskForTimer(log._id);

    // If currently 'todo', transition to 'in_progress'
    if (log.status === "todo") {
      handleSetStatus(log, "in_progress");
    }

    setIsSessionActive(true);
    setSessionSeconds(0);
    window.dispatchEvent(new Event("study-stopwatch-changed"));
  };

  const handleToggleSession = () => {
    if (!isSessionActive) {
      // Starting timer
      let topicToTrack = "";
      let taskIdToTrack: string | undefined = undefined;

      if (selectedTaskForTimer) {
        const found = studyLogs.find((l) => l._id === selectedTaskForTimer);
        if (found) {
          topicToTrack = found.topic;
          taskIdToTrack = found._id;
          if (found.status === "todo") {
            handleSetStatus(found, "in_progress");
          }
        }
      }

      const startTime = Date.now();
      localStorage.setItem("study_stopwatch_is_active", "true");
      localStorage.setItem("study_stopwatch_start_time", String(startTime));
      localStorage.setItem("study_stopwatch_accumulated_seconds", "0");
      if (taskIdToTrack) {
        localStorage.setItem("study_stopwatch_task_id", taskIdToTrack);
      } else {
        localStorage.removeItem("study_stopwatch_task_id");
      }
      if (topicToTrack) {
        localStorage.setItem("study_stopwatch_task_topic", topicToTrack);
        setActiveSessionTask({ id: taskIdToTrack, topic: topicToTrack });
      } else {
        localStorage.removeItem("study_stopwatch_task_topic");
        setActiveSessionTask(null);
      }

      setIsSessionActive(true);
      setSessionSeconds(0);
      window.dispatchEvent(new Event("study-stopwatch-changed"));
    } else {
      // Stopping timer -> Open modal to review status & duration
      const mins = Math.max(1, Math.round(sessionSeconds / 60));
      const currentTopic = activeSessionTask?.topic || "";

      setSaveSessionForm({
        id: activeSessionTask?.id,
        topic: currentTopic,
        durationMinutes: String(mins),
        status: "completed",
        date: new Date().toISOString().split("T")[0],
      });
      setShowSaveSessionModal(true);

      // Pause timer while modal is open
      setIsSessionActive(false);
      localStorage.setItem("study_stopwatch_is_active", "false");
      localStorage.setItem("study_stopwatch_accumulated_seconds", String(sessionSeconds));
      window.dispatchEvent(new Event("study-stopwatch-changed"));
    }
  };

  const handleSaveSessionConfirm = async () => {
    const { id: taskId, topic, durationMinutes, status, date } = saveSessionForm;
    if (!topic.trim()) return;
    const durNum = parseInt(durationMinutes) || 1;

    try {
      if (taskId) {
        // Update existing task
        const res = await fetch(`/api/tracking/study?id=${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic.trim(),
            durationMinutes: durNum,
            status: status,
            completed: status === "completed",
            date: date,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setStudyLogs((prev) => prev.map((l) => (l._id === taskId ? updated : l)));
        }
      } else {
        // Create new study log
        const res = await fetch("/api/tracking/study", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic.trim(),
            durationMinutes: durNum,
            status: status,
            completed: status === "completed",
            date: date,
          }),
        });
        if (res.ok) {
          const newLog = await res.json();
          setStudyLogs((prev) => [newLog, ...prev]);
        }
      }
    } catch (err) {
      console.error("Error saving session:", err);
    } finally {
      localStorage.removeItem("study_stopwatch_is_active");
      localStorage.removeItem("study_stopwatch_start_time");
      localStorage.removeItem("study_stopwatch_accumulated_seconds");
      localStorage.removeItem("study_stopwatch_task_id");
      localStorage.removeItem("study_stopwatch_task_topic");
      setActiveSessionTask(null);
      setSelectedTaskForTimer("");
      setSessionSeconds(0);
      setIsSessionActive(false);
      setShowSaveSessionModal(false);
      window.dispatchEvent(new Event("study-stopwatch-changed"));
    }
  };

  const handleSaveSessionDiscard = () => {
    localStorage.removeItem("study_stopwatch_is_active");
    localStorage.removeItem("study_stopwatch_start_time");
    localStorage.removeItem("study_stopwatch_accumulated_seconds");
    localStorage.removeItem("study_stopwatch_task_id");
    localStorage.removeItem("study_stopwatch_task_topic");
    setActiveSessionTask(null);
    setSelectedTaskForTimer("");
    setSessionSeconds(0);
    setIsSessionActive(false);
    setShowSaveSessionModal(false);
    window.dispatchEvent(new Event("study-stopwatch-changed"));
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
      status: log.status || (log.completed ? "completed" : "todo"),
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
    const uId = (session?.user as any)?.id || session?.user?.email || "guest";
    const updated = milestones.map((m) => m.id === id ? { ...m, ...editMilestoneForm } : m);
    setMilestones(updated);
    localStorage.setItem(`custom_milestones_${uId}`, JSON.stringify(updated));
    setEditingMilestoneId(null);
    saveRoadmapToDB(goalStartDate, inputDuration, inputDurationUnit, updated);
  };

  const handleMilestoneDelete = (id: number) => {
    if (!confirm("Delete this milestone from your roadmap?")) return;
    const uId = (session?.user as any)?.id || session?.user?.email || "guest";
    const updated = milestones.filter((m) => m.id !== id);
    setMilestones(updated);
    localStorage.setItem(`custom_milestones_${uId}`, JSON.stringify(updated));
    saveRoadmapToDB(goalStartDate, inputDuration, inputDurationUnit, updated);
  };

  const handleMilestoneConfirmAdd = () => {
    if (!newMilestoneForm.name.trim()) return;
    const uId = (session?.user as any)?.id || session?.user?.email || "guest";
    const nextId = milestones.length > 0 ? Math.max(...milestones.map(m => m.id)) + 1 : 1;
    const updated = [...milestones, { id: nextId, name: newMilestoneForm.name.trim(), desc: newMilestoneForm.desc.trim() }];
    setMilestones(updated);
    localStorage.setItem(`custom_milestones_${uId}`, JSON.stringify(updated));
    setNewMilestoneForm({ name: "", desc: "" });
    setShowAddMilestoneForm(false);
    saveRoadmapToDB(goalStartDate, inputDuration, inputDurationUnit, updated);
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
  const startMs = goalStartDate ? goalStartDate.getTime() : currentMs;
  const endMs = goalEndDate ? goalEndDate.getTime() : currentMs;
  const totalGoalTime = Math.max(1, endMs - startMs);
  const elapsed = isGoalSet ? Math.max(0, currentMs - startMs) : 0;
  const remaining = isGoalSet ? Math.max(0, endMs - currentMs) : 0;
  const percentProgress = isGoalSet ? Math.min(100, Math.max(0, (elapsed / totalGoalTime) * 100)) : 0;

  const daysElapsed = isGoalSet ? Math.floor(elapsed / (1000 * 60 * 60 * 24)) : 0;
  const totalDays = isGoalSet ? Math.floor(totalGoalTime / (1000 * 60 * 60 * 24)) : 0;

  // Countdown calculations
  const remainingDays = isGoalSet ? Math.floor(remaining / (1000 * 60 * 60 * 24)) : 0;
  const remainingHours = isGoalSet ? Math.floor((remaining / (1000 * 60 * 60)) % 24) : 0;
  const remainingMins = isGoalSet ? Math.floor((remaining / (1000 * 60)) % 60) : 0;
  const remainingSecs = isGoalSet ? Math.floor((remaining / 1000) % 60) : 0;

  const padZero = (num: number) => String(num).padStart(2, "0");

  const milestoneCount = milestones.length || 1;
  const milestoneStepMs = totalGoalTime / milestoneCount;
  const dynamicMilestones = milestones.map((tpl, idx) => {
    const mStart = new Date(startMs + idx * milestoneStepMs);
    const mEnd = new Date(startMs + (idx + 1) * milestoneStepMs);
    return { ...tpl, start: mStart, end: mEnd };
  });

  const radius = 70;
  const strokeDash = 2 * Math.PI * radius;
  const strokeOffset = isGoalSet ? strokeDash - (percentProgress / 100) * strokeDash : strokeDash;

  // Streak calculations (based on completed logs)
  const completedDates = new Set(
    studyLogs
      .filter((t) => t.status === "completed" || (t.completed && t.status !== "todo" && t.status !== "in_progress"))
      .map((t) => new Date(t.date).toDateString())
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

  // Status breakdown counts
  const allCount = filteredStudyLogs.length;
  const todoCount = filteredStudyLogs.filter((t) => (t.status || (t.completed ? "completed" : "todo")) === "todo").length;
  const inProgressCount = filteredStudyLogs.filter((t) => (t.status || (t.completed ? "completed" : "todo")) === "in_progress").length;
  const completedCount = filteredStudyLogs.filter((t) => (t.status || (t.completed ? "completed" : "todo")) === "completed").length;

  const todoTasks = filteredStudyLogs.filter((t) => (t.status || (t.completed ? "completed" : "todo")) === "todo");
  const inProgressTasks = filteredStudyLogs.filter((t) => (t.status || (t.completed ? "completed" : "todo")) === "in_progress");
  const completedTasks = filteredStudyLogs.filter((t) => (t.status || (t.completed ? "completed" : "todo")) === "completed");

  // Filter study logs by active status filter tab
  const displayedStudyLogs = filteredStudyLogs.filter((log) => {
    if (statusFilter === "all") return true;
    const s = log.status || (log.completed ? "completed" : "todo");
    return s === statusFilter;
  });

  // Calculate total study time in period
  const totalStudyMinutes = filteredStudyLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(displayedStudyLogs.length / ITEMS_PER_PAGE));
  const paginatedStudyLogs = displayedStudyLogs.slice(
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

      {/* ── Save Study Session Modal (Interactive Status & Time) ── */}
      {showSaveSessionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleSaveSessionDiscard(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

          {/* Modal card */}
          <div className="relative z-10 w-full max-w-lg bg-[#0d0d1a] light:bg-white border border-teal-500/30 light:border-slate-200 rounded-2xl shadow-2xl shadow-black/80 light:shadow-slate-300/60 p-5 sm:p-6 space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 light:border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 light:bg-teal-50 border border-teal-500/20 text-teal-400 light:text-teal-600 flex items-center justify-center">
                  <PlayCircle size={16} />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-teal-400 light:text-teal-600 font-mono font-bold">Study Session Complete</p>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100 light:text-slate-900">Save & Log Study Session</h3>
                </div>
              </div>
              <button
                onClick={handleSaveSessionDiscard}
                className="text-slate-500 hover:text-slate-300 light:hover:text-slate-700 p-1.5 rounded-lg hover:bg-white/5 light:hover:bg-slate-100 transition-all cursor-pointer"
                title="Discard session"
              >
                <X size={16} />
              </button>
            </div>

            {/* Topic Input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 light:text-slate-600 font-mono font-bold">Topic / Subject</label>
              <input
                type="text"
                placeholder="What did you study during this session?"
                value={saveSessionForm.topic}
                onChange={(e) => setSaveSessionForm({ ...saveSessionForm, topic: e.target.value })}
                className="w-full bg-white/[0.04] light:bg-slate-50 border border-white/10 light:border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 light:text-slate-900 outline-none focus:border-teal-500 transition-all"
                autoFocus
              />
            </div>

            {/* Duration & Date row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 light:text-slate-600 font-mono font-bold">Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={saveSessionForm.durationMinutes}
                  onChange={(e) => setSaveSessionForm({ ...saveSessionForm, durationMinutes: e.target.value })}
                  className="w-full bg-white/[0.04] light:bg-slate-50 border border-white/10 light:border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 light:text-slate-900 outline-none focus:border-teal-500 font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 light:text-slate-600 font-mono font-bold">Date</label>
                <input
                  type="date"
                  value={saveSessionForm.date}
                  onChange={(e) => setSaveSessionForm({ ...saveSessionForm, date: e.target.value })}
                  className="w-full bg-white/[0.04] light:bg-slate-50 border border-white/10 light:border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 light:text-slate-900 outline-none focus:border-teal-500 font-mono font-bold"
                />
              </div>
            </div>

            {/* Status Selection Buttons */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 light:text-slate-600 font-mono font-bold">Set Task Status</label>
              <div className="grid grid-cols-3 gap-2">
                {/* To Do */}
                <button
                  type="button"
                  onClick={() => setSaveSessionForm({ ...saveSessionForm, status: "todo" })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer touch-manipulation ${
                    saveSessionForm.status === "todo"
                      ? "bg-amber-500/15 light:bg-amber-50 border-amber-500/50 light:border-amber-400 text-amber-300 light:text-amber-800 shadow-sm"
                      : "bg-white/[0.02] light:bg-slate-50 border-white/5 light:border-slate-200 text-slate-400 light:text-slate-600 hover:border-amber-500/30"
                  }`}
                >
                  <Clock size={16} className="mb-1" />
                  <span className="text-xs font-bold">To Do</span>
                  <span className="text-[9px] opacity-75 mt-0.5">Planned</span>
                </button>

                {/* In Progress */}
                <button
                  type="button"
                  onClick={() => setSaveSessionForm({ ...saveSessionForm, status: "in_progress" })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer touch-manipulation ${
                    saveSessionForm.status === "in_progress"
                      ? "bg-sky-500/15 light:bg-sky-50 border-sky-500/50 light:border-sky-400 text-sky-300 light:text-sky-800 shadow-sm"
                      : "bg-white/[0.02] light:bg-slate-50 border-white/5 light:border-slate-200 text-slate-400 light:text-slate-600 hover:border-sky-500/30"
                  }`}
                >
                  <Loader2 size={16} className="mb-1 animate-spin" />
                  <span className="text-xs font-bold">In Progress</span>
                  <span className="text-[9px] opacity-75 mt-0.5">Working</span>
                </button>

                {/* Completed */}
                <button
                  type="button"
                  onClick={() => setSaveSessionForm({ ...saveSessionForm, status: "completed" })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer touch-manipulation ${
                    saveSessionForm.status === "completed"
                      ? "bg-emerald-500/15 light:bg-emerald-50 border-emerald-500/50 light:border-emerald-400 text-emerald-300 light:text-emerald-800 shadow-sm"
                      : "bg-white/[0.02] light:bg-slate-50 border-white/5 light:border-slate-200 text-slate-400 light:text-slate-600 hover:border-emerald-500/30"
                  }`}
                >
                  <CheckCircle2 size={16} className="mb-1" />
                  <span className="text-xs font-bold">Completed</span>
                  <span className="text-[9px] opacity-75 mt-0.5">Finished</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-white/5 light:border-slate-100">
              <button
                type="button"
                onClick={handleSaveSessionDiscard}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 light:text-slate-600 light:hover:text-red-600 border border-white/5 light:border-slate-200 hover:bg-red-500/10 light:hover:bg-red-50 transition-all cursor-pointer text-center"
              >
                Discard Session
              </button>
              <button
                type="button"
                onClick={handleSaveSessionConfirm}
                disabled={!saveSessionForm.topic.trim()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer text-center"
              >
                Save & Record Session
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
              <h2 className="page-heading text-xl font-black uppercase tracking-widest text-slate-100 light:text-slate-900">Learning Lab</h2>
              <p className="page-subheading text-xs text-slate-400 light:text-slate-500 uppercase tracking-wider mt-0.5">Track growth roadmaps and study time</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">

              {/* Premium Month/Year/Date selection bar */}
              <div className="filter-bar flex flex-wrap items-center gap-2 sm:gap-3 bg-white/[0.03] light:bg-white shadow-lg border border-white/10 light:border-slate-200 p-2 rounded-xl hover:border-white/15 light:hover:border-slate-300 transition-all">
                <button
                  onClick={handlePrevMonth}
                  disabled={!!selectedDate}
                  className="bar-btn p-1.5 rounded-lg bg-white/[0.02] light:bg-slate-100 border border-white/5 light:border-slate-200 hover:bg-white/[0.08] light:hover:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} />
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {!selectedDate ? (
                    <>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="bg-transparent text-xs font-bold uppercase tracking-wider text-indigo-400 light:text-indigo-600 outline-none cursor-pointer py-1 px-2 font-sans"
                      >
                        <option value={-1} className="bg-[#0c0c16] light:bg-white text-indigo-400 light:text-indigo-600 font-bold">ALL MONTHS</option>
                        {months.map((m, idx) => (
                          <option key={m} value={idx} className="bg-[#0c0c16] light:bg-white text-slate-200 light:text-slate-800">{m.toUpperCase()}</option>
                        ))}
                      </select>

                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-transparent text-xs font-bold uppercase tracking-wider text-indigo-400 light:text-indigo-600 outline-none cursor-pointer py-1 px-2 font-sans"
                      >
                        <option value={-1} className="bg-[#0c0c16] light:bg-white text-indigo-400 light:text-indigo-600 font-bold">ALL YEARS</option>
                        {availableYears.map((year) => (
                          <option key={year} value={year} className="bg-[#0c0c16] light:bg-white text-slate-200 light:text-slate-800">{year}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 light:text-indigo-600 px-2 py-1">
                      {new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}

                  <div className="flex items-center gap-2 border-l border-white/10 light:border-slate-200 pl-2">
                    <div className="date-pill flex items-center gap-1.5 bg-indigo-500/5 light:bg-indigo-50 hover:bg-indigo-500/10 light:hover:bg-indigo-100 border border-indigo-500/20 light:border-indigo-200 px-2.5 py-1 rounded-xl text-indigo-400 light:text-indigo-600 transition-all">
                      <Calendar size={13} className="text-indigo-400/80 light:text-indigo-600/80 flex-shrink-0" />
                      <input
                        type="date"
                        value={selectedDate || ""}
                        onChange={(e) => setSelectedDate(e.target.value || null)}
                        className="bg-transparent border-none outline-none text-xs font-bold text-indigo-400 light:text-indigo-600 cursor-pointer font-mono w-[110px] min-h-[1.5rem] py-0.5"
                      />
                    </div>
                    {selectedDate && (
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="text-[10px] text-red-400 light:text-red-600 hover:text-red-300 light:hover:text-red-700 font-black uppercase tracking-widest cursor-pointer ml-1"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleNextMonth}
                  disabled={!!selectedDate}
                  className="bar-btn p-1.5 rounded-lg bg-white/[0.02] light:bg-slate-100 border border-white/5 light:border-slate-200 hover:bg-white/[0.08] light:hover:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {currentStreak > 0 && (
                <div className="flex items-center gap-1.5 bg-orange-950/40 light:bg-orange-50 border border-orange-500/25 light:border-orange-200 px-4 py-2 rounded-xl text-xs text-orange-400 light:text-orange-600 font-bold uppercase tracking-wider font-mono">
                  <Flame size={14} />
                  <span>{currentStreak} DAY STREAK</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Side Progress ring and session timer */}
            <div className="space-y-8 lg:col-span-5">
              {/* Radial Progress & Goals */}
              <div className="glass-card card-glow-indigo p-6 rounded-2xl border border-white/10 light:border-slate-200 relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  title="Configure Goal"
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800 p-1.5 rounded-lg hover:bg-white/5 light:hover:bg-slate-100 transition-all cursor-pointer z-10"
                >
                  <Settings size={16} />
                </button>

                {showSettings && (
                  <form onSubmit={handleSaveGoalSettings} className="w-full bg-[#0c0c16] light:bg-slate-50 border border-white/10 light:border-slate-200 rounded-xl p-4 mt-6 space-y-3">
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-indigo-400 light:text-indigo-600">Configure Goal</h4>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 light:text-slate-600">Start Date</label>
                      <input
                        type="date"
                        value={inputStartDate}
                        onChange={(e) => setInputStartDate(e.target.value)}
                        className="w-full bg-[#121224] light:bg-white border border-white/10 light:border-slate-300 rounded-lg p-2 text-base sm:text-xs text-slate-100 light:text-slate-900 outline-none focus:border-indigo-500 transition-all font-mono font-bold shadow-sm touch-manipulation"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 light:text-slate-600">Duration</label>
                        <input
                          type="number"
                          value={inputDuration}
                          onChange={(e) => setInputDuration(parseInt(e.target.value) || 1)}
                          className="w-full bg-[#121224] light:bg-white border border-white/10 light:border-slate-300 rounded-lg p-2 text-base sm:text-xs text-slate-100 light:text-slate-900 outline-none focus:border-indigo-500 transition-all font-mono font-bold shadow-sm touch-manipulation"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 light:text-slate-600">Unit</label>
                        <select
                          value={inputDurationUnit}
                          onChange={(e) => setInputDurationUnit(e.target.value as "months" | "days")}
                          className="w-full bg-[#121224] light:bg-white border border-white/10 light:border-slate-300 rounded-lg p-2 text-xs text-slate-100 light:text-slate-900 outline-none focus:border-indigo-500 transition-all font-bold shadow-sm"
                        >
                          <option value="months" className="bg-[#121224] light:bg-white text-slate-100 light:text-slate-900">Months</option>
                          <option value="days" className="bg-[#121224] light:bg-white text-slate-100 light:text-slate-900">Days</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowSettings(false)}
                        className="w-1/3 bg-white/5 hover:bg-white/10 light:bg-slate-200 light:hover:bg-slate-300 text-slate-300 light:text-slate-700 text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-2/3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg cursor-pointer shadow-lg shadow-indigo-500/20 transition-all"
                      >
                        Save Configurations
                      </button>
                    </div>
                  </form>
                )}

                {!showSettings && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                    {/* Left: Progress Circle */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center">
                      <div className="relative w-40 h-40 flex items-center justify-center">
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
                          <span className="text-2xl font-black font-mono text-slate-100 light:text-slate-900">{percentProgress.toFixed(1)}%</span>
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 light:text-slate-600 mt-0.5 font-bold">
                            {isGoalSet ? "COMPLETED" : "NOT SET"}
                          </p>
                          <p className="text-[9px] uppercase tracking-wider text-slate-400 light:text-slate-500 mt-0.5 font-mono font-bold">
                            {isGoalSet ? `${daysElapsed}/${totalDays} DAYS` : "0/0 DAYS"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Countdown & Session Timer */}
                    <div className="sm:col-span-7 space-y-4">
                      {/* Countdown Timer */}
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full">
                        <div className="flex flex-col items-center bg-white/[0.03] light:bg-slate-100 border border-white/5 light:border-slate-200 rounded-xl py-2.5 px-1 text-center min-w-0">
                          <span className="text-lg sm:text-xl font-black font-mono text-slate-100 light:text-slate-900">{padZero(remainingDays)}</span>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 light:text-slate-500 mt-0.5">DAYS</span>
                        </div>
                        <div className="flex flex-col items-center bg-white/[0.03] light:bg-slate-100 border border-white/5 light:border-slate-200 rounded-xl py-2.5 px-1 text-center min-w-0">
                          <span className="text-lg sm:text-xl font-black font-mono text-slate-100 light:text-slate-900">{padZero(remainingHours)}</span>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 light:text-slate-500 mt-0.5">HOURS</span>
                        </div>
                        <div className="flex flex-col items-center bg-white/[0.03] light:bg-slate-100 border border-white/5 light:border-slate-200 rounded-xl py-2.5 px-1 text-center min-w-0">
                          <span className="text-lg sm:text-xl font-black font-mono text-slate-100 light:text-slate-900">{padZero(remainingMins)}</span>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 light:text-slate-500 mt-0.5">MINS</span>
                        </div>
                        <div className="flex flex-col items-center bg-white/[0.03] light:bg-slate-100 border border-white/5 light:border-slate-200 rounded-xl py-2.5 px-1 text-center min-w-0">
                          <span className="text-lg sm:text-xl font-black font-mono text-slate-100 light:text-slate-900">{padZero(remainingSecs)}</span>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 light:text-slate-500 mt-0.5">SECS</span>
                        </div>
                      </div>

                      {/* Track Session Stopwatch (embedded with Task Link & Status) */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        isSessionActive
                          ? "border-sky-500/30 bg-sky-950/20 light:bg-sky-50/80 shadow-lg shadow-sky-500/5"
                          : "border-white/5 light:border-slate-200 bg-white/[0.03] light:bg-slate-50"
                      } text-center space-y-3`}>
                        <div className="flex items-center justify-between">
                          <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 light:text-slate-600">STUDY SESSION</h3>
                          {isSessionActive ? (
                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-sky-400 light:text-sky-700 bg-sky-500/10 light:bg-sky-100 border border-sky-500/20 light:border-sky-300 px-2 py-0.5 rounded-full font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                              IN PROGRESS
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 light:text-slate-500 font-mono">
                              READY
                            </span>
                          )}
                        </div>

                        {/* Active Task Name Indicator or Task Picker */}
                        {isSessionActive ? (
                          <div className="bg-sky-500/10 light:bg-sky-100/70 border border-sky-500/20 light:border-sky-300/60 rounded-lg py-1.5 px-3">
                            <p className="text-[9px] uppercase tracking-wider text-sky-400 light:text-sky-700 font-mono">Focus Task</p>
                            <p className="text-xs font-bold text-slate-100 light:text-slate-900 truncate">
                              {activeSessionTask?.topic || "General Study Practice"}
                            </p>
                          </div>
                        ) : (
                          <div>
                            {studyLogs.filter((l) => l.status === "todo" || l.status === "in_progress").length > 0 && (
                              <div className="text-left space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-slate-500 light:text-slate-600 font-mono font-bold">Link to Task (Optional)</label>
                                <select
                                  value={selectedTaskForTimer}
                                  onChange={(e) => setSelectedTaskForTimer(e.target.value)}
                                  className="w-full bg-white/[0.04] light:bg-white border border-white/10 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 light:text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                                >
                                  <option value="" className="bg-[#0c0c16] light:bg-white text-slate-300 light:text-slate-700">None (General Session)</option>
                                  {studyLogs
                                    .filter((l) => l.status === "todo" || l.status === "in_progress")
                                    .map((l) => (
                                      <option key={l._id} value={l._id} className="bg-[#0c0c16] light:bg-white text-slate-200 light:text-slate-900">
                                        [{l.status === "todo" ? "TO DO" : "IN PROGRESS"}] {l.topic}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-2xl sm:text-3xl font-black font-mono text-slate-100 light:text-slate-900 tracking-wider">
                          {formatStopwatch(sessionSeconds)}
                        </div>

                        <button
                          onClick={handleToggleSession}
                          style={{ color: "#ffffff" }}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 ${
                            isSessionActive
                              ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20"
                              : "bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                          }`}
                        >
                          <Play size={12} className={isSessionActive ? "hidden" : "block"} />
                          <span>{isSessionActive ? "Stop & Save Session" : "Start Study Timer"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* Right Side tabs roadmap/logs */}
            <div ref={logsRef} className="lg:col-span-7 space-y-6">
              {/* Tab Selector */}
              <div className="flex border-b border-white/5 justify-between items-center pr-2">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("roadmap")}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                      activeTab === "roadmap" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {milestones.length > 0 ? `${milestones.length}-Month Roadmap` : "Roadmap"}
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
                              className="w-full mt-0.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 touch-manipulation" />
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
                <div className="space-y-4">
                  {/* Top Bar with Header, Total stats & View Mode Switcher */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 light:text-slate-800 font-mono">
                        Topics & Tasks
                      </h3>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        ({allCount} items &middot; <span className="text-indigo-400">{totalStudyHours}h</span>)
                      </span>
                    </div>

                    {/* View Mode Toggle: Board vs List */}
                    <div className="flex items-center gap-1 bg-white/[0.04] light:bg-slate-100 p-1 rounded-xl border border-white/5 light:border-slate-200 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setViewMode("board")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          viewMode === "board"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900"
                        }`}
                      >
                        <Kanban size={12} />
                        <span>Board</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          viewMode === "list"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900"
                        }`}
                      >
                        <List size={12} />
                        <span>List</span>
                      </button>
                    </div>
                  </div>

                  {/* Universal Quick Add Task Form (Top Bar) */}
                  <form onSubmit={handleLogTopic} className="glass-card card-glow-indigo p-3.5 sm:p-4 rounded-2xl border border-white/5 light:border-slate-200 space-y-2.5">
                    <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                      <div className="flex-grow space-y-1 w-full">
                        <label className="text-[9px] uppercase font-bold text-slate-400 light:text-slate-600 font-mono">Create New Topic / Task</label>
                        <input
                          type="text"
                          value={newTopicText}
                          onChange={(e) => setNewTopicText(e.target.value)}
                          placeholder="Enter a topic or study goal..."
                          className="w-full bg-white/[0.04] light:bg-slate-50 border border-white/10 light:border-slate-300 rounded-xl px-3.5 py-2 text-base sm:text-xs text-slate-100 light:text-slate-900 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500 touch-manipulation"
                        />
                      </div>
                      <div className="w-full sm:w-24 space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 light:text-slate-600 font-mono">Minutes</label>
                        <input
                          type="number"
                          min="0"
                          value={newDuration}
                          onChange={(e) => setNewDuration(e.target.value)}
                          placeholder="30"
                          className="w-full bg-white/[0.04] light:bg-slate-50 border border-white/10 light:border-slate-300 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-100 light:text-slate-900 outline-none font-mono focus:border-indigo-500 transition-all touch-manipulation"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting || !newTopicText.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-1.5 h-[38px] w-full sm:w-auto justify-center cursor-pointer shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                      >
                        <Plus size={14} />
                        <span>Add Task</span>
                      </button>
                    </div>

                    {/* Quick Status Selection Chips */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-white/5 light:border-slate-100">
                      <span className="text-[9px] uppercase font-bold text-slate-400 light:text-slate-600 font-mono">Column target:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* To Do */}
                        <button
                          type="button"
                          onClick={() => setNewStatus("todo")}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer touch-manipulation ${
                            newStatus === "todo"
                              ? "bg-amber-500/20 light:bg-amber-100 border-amber-500/50 light:border-amber-400 text-amber-300 light:text-amber-800"
                              : "bg-white/[0.02] light:bg-slate-100 border-white/5 light:border-slate-200 text-slate-400 light:text-slate-600 hover:border-amber-500/30"
                          }`}
                        >
                          <Clock size={11} />
                          <span>To Do</span>
                        </button>

                        {/* In Progress */}
                        <button
                          type="button"
                          onClick={() => setNewStatus("in_progress")}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer touch-manipulation ${
                            newStatus === "in_progress"
                              ? "bg-sky-500/20 light:bg-sky-100 border-sky-500/50 light:border-sky-400 text-sky-300 light:text-sky-800"
                              : "bg-white/[0.02] light:bg-slate-100 border-white/5 light:border-slate-200 text-slate-400 light:text-slate-600 hover:border-sky-500/30"
                          }`}
                        >
                          <Loader2 size={11} className={newStatus === "in_progress" ? "animate-spin" : ""} />
                          <span>In Progress</span>
                        </button>

                        {/* Completed */}
                        <button
                          type="button"
                          onClick={() => setNewStatus("completed")}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer touch-manipulation ${
                            newStatus === "completed"
                              ? "bg-emerald-500/20 light:bg-emerald-100 border-emerald-500/50 light:border-emerald-400 text-emerald-300 light:text-emerald-800"
                              : "bg-white/[0.02] light:bg-slate-100 border-white/5 light:border-slate-200 text-slate-400 light:text-slate-600 hover:border-emerald-500/30"
                          }`}
                        >
                          <CheckCircle2 size={11} />
                          <span>Completed</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* ─────────────────────────────────────────────────────────────
                      1. JIRA-STYLE 3-CARD KANBAN BOARD VIEW
                     ───────────────────────────────────────────────────────────── */}
                  {viewMode === "board" ? (
                    <div className="space-y-3">
                      {/* Mobile Column Switcher (Visible on small screens) */}
                      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setMobileBoardTab("all")}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap transition-all ${
                            mobileBoardTab === "all"
                              ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                              : "bg-white/[0.02] light:bg-slate-100 text-slate-400 light:text-slate-600 border-white/5 light:border-slate-200"
                          }`}
                        >
                          All Columns ({allCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setMobileBoardTab("todo")}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap transition-all ${
                            mobileBoardTab === "todo"
                              ? "bg-amber-500/25 light:bg-amber-100 border-amber-500/60 light:border-amber-400 text-amber-300 light:text-amber-900 shadow-sm font-black"
                              : "bg-white/[0.02] light:bg-slate-100 text-slate-400 light:text-slate-600 border-white/5 light:border-slate-200"
                          }`}
                        >
                          <Clock size={11} />
                          <span>To Do ({todoCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMobileBoardTab("in_progress")}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap transition-all ${
                            mobileBoardTab === "in_progress"
                              ? "bg-sky-500/25 light:bg-sky-100 border-sky-500/60 light:border-sky-400 text-sky-300 light:text-sky-900 shadow-sm font-black"
                              : "bg-white/[0.02] light:bg-slate-100 text-slate-400 light:text-slate-600 border-white/5 light:border-slate-200"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                          <span>In Progress ({inProgressCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMobileBoardTab("completed")}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap transition-all ${
                            mobileBoardTab === "completed"
                              ? "bg-emerald-500/25 light:bg-emerald-100 border-emerald-500/60 light:border-emerald-400 text-emerald-300 light:text-emerald-900 shadow-sm font-black"
                              : "bg-white/[0.02] light:bg-slate-100 text-slate-400 light:text-slate-600 border-white/5 light:border-slate-200"
                          }`}
                        >
                          <CheckCircle2 size={11} />
                          <span>Done ({completedCount})</span>
                        </button>
                      </div>

                      {/* 3 Jira Columns Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
                        {/* ────── COLUMN 1: TO DO ────── */}
                        {(mobileBoardTab === "all" || mobileBoardTab === "todo") && (
                          <div className="glass-card bg-[#0b0c16]/90 light:bg-white border border-amber-500/20 light:border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-3 flex flex-col min-h-[360px] shadow-sm">
                            {/* Column Header */}
                            <div className="flex items-center justify-between border-b border-amber-500/10 light:border-slate-100 pb-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-amber-500/15 light:bg-amber-100 text-amber-400 light:text-amber-700 flex items-center justify-center">
                                  <Clock size={13} />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 light:text-amber-800 font-mono">
                                  To Do
                                </h4>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 light:bg-amber-100 text-amber-300 light:text-amber-800 text-[10px] font-mono font-bold">
                                {todoTasks.length}
                              </span>
                            </div>

                            {/* Modern Inline Task Bar for To Do */}
                            <form
                              onSubmit={(e) => handleQuickAddColumnTask("todo", e)}
                              className="p-1.5 rounded-xl bg-white/[0.03] light:bg-slate-50 border border-white/10 light:border-slate-300 flex items-center gap-1.5 transition-all focus-within:border-amber-500/60"
                            >
                              <input
                                type="text"
                                placeholder="+ Add task to To Do..."
                                value={inlineTaskInput.todo}
                                onChange={(e) => setInlineTaskInput({ ...inlineTaskInput, todo: e.target.value })}
                                className="bg-transparent text-base sm:text-xs text-slate-100 light:text-slate-900 outline-none flex-grow min-w-0 placeholder:text-slate-500 px-1.5 touch-manipulation"
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="30"
                                title="Minutes"
                                value={inlineDurationInput.todo}
                                onChange={(e) => setInlineDurationInput({ ...inlineDurationInput, todo: e.target.value })}
                                className="w-12 sm:w-11 bg-white/5 light:bg-white border border-white/10 light:border-slate-300 rounded-lg px-1 py-1 text-base sm:text-[10px] text-slate-200 light:text-slate-800 font-mono text-center outline-none focus:border-amber-500 touch-manipulation"
                              />
                              <button
                                type="submit"
                                disabled={columnSubmitting === "todo" || !inlineTaskInput.todo.trim()}
                                className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
                                title="Add task to To Do"
                              >
                                <Plus size={13} />
                              </button>
                            </form>

                            {/* Task Cards List */}
                            <div className="space-y-2.5 overflow-y-auto max-h-[440px] pr-1 flex-grow">
                              {todoTasks.length === 0 ? (
                                <div className="text-center py-8 px-2 border border-dashed border-white/5 light:border-slate-200 rounded-xl">
                                  <Clock size={20} className="mx-auto text-amber-400/40 mb-1" />
                                  <p className="text-[11px] text-slate-500 italic">No tasks in To Do</p>
                                </div>
                              ) : (
                                todoTasks.map((log) => (
                                  <div
                                    key={log._id}
                                    className="p-3 rounded-xl border border-white/5 light:border-slate-200 bg-white/[0.02] light:bg-slate-50/80 hover:border-amber-500/30 transition-all space-y-2 shadow-sm group"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <h5 className="text-xs font-bold text-slate-100 light:text-slate-900 leading-snug">
                                        {log.topic}
                                      </h5>
                                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => handleEditLogStart(log)}
                                          className="text-slate-400 hover:text-indigo-400 light:hover:text-indigo-600 p-1 rounded transition-colors"
                                          title="Edit Task"
                                        >
                                          <Pencil size={11} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteLog(log._id)}
                                          className="text-slate-400 hover:text-red-400 light:hover:text-red-600 p-1 rounded transition-colors"
                                          title="Delete Task"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 light:text-slate-500">
                                      <span className="bg-amber-500/10 light:bg-amber-50 text-amber-400 light:text-amber-800 px-1.5 py-0.5 rounded font-bold">
                                        {log.durationMinutes || 0}m
                                      </span>
                                      <span>
                                        {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                      </span>
                                    </div>

                                    {/* Action Buttons: Start Timer & Move */}
                                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/5 light:border-slate-200">
                                      <button
                                        type="button"
                                        onClick={() => handleStartTimerForTask(log)}
                                        className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-teal-500/10 light:bg-teal-50 hover:bg-teal-500/20 text-teal-300 light:text-teal-700 border border-teal-500/20 light:border-teal-300 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                        title="Start Stopwatch on this task"
                                      >
                                        <Play size={10} />
                                        <span>Timer</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSetStatus(log, "in_progress")}
                                        className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-sky-500/10 light:bg-sky-50 hover:bg-sky-500/20 text-sky-300 light:text-sky-700 border border-sky-500/20 light:border-sky-300 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                        title="Move to In Progress"
                                      >
                                        <ArrowRight size={10} />
                                        <span>Progress</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSetStatus(log, "completed")}
                                        className="p-1 rounded-lg bg-emerald-500/10 light:bg-emerald-50 hover:bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/20 light:border-emerald-300 transition-all cursor-pointer"
                                        title="Mark Done"
                                      >
                                        <Check size={11} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}

                        {/* ────── COLUMN 2: IN PROGRESS ────── */}
                        {(mobileBoardTab === "all" || mobileBoardTab === "in_progress") && (
                          <div className="glass-card bg-[#0b0c16]/90 light:bg-white border border-sky-500/25 light:border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-3 flex flex-col min-h-[360px] shadow-sm">
                            {/* Column Header */}
                            <div className="flex items-center justify-between border-b border-sky-500/10 light:border-slate-100 pb-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-sky-500/15 light:bg-sky-100 text-sky-400 light:text-sky-700 flex items-center justify-center">
                                  <Loader2 size={13} className="animate-spin" />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-sky-300 light:text-sky-800 font-mono">
                                  In Progress
                                </h4>
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-sky-500/15 light:bg-sky-100 text-sky-300 light:text-sky-800 text-[10px] font-mono font-bold">
                                {inProgressTasks.length}
                              </span>
                            </div>

                            {/* Modern Inline Task Bar for In Progress */}
                            <form
                              onSubmit={(e) => handleQuickAddColumnTask("in_progress", e)}
                              className="p-1.5 rounded-xl bg-white/[0.03] light:bg-slate-50 border border-white/10 light:border-slate-300 flex items-center gap-1.5 transition-all focus-within:border-sky-500/60"
                            >
                              <input
                                type="text"
                                placeholder="+ Add in-progress task..."
                                value={inlineTaskInput.in_progress}
                                onChange={(e) => setInlineTaskInput({ ...inlineTaskInput, in_progress: e.target.value })}
                                className="bg-transparent text-base sm:text-xs text-slate-100 light:text-slate-900 outline-none flex-grow min-w-0 placeholder:text-slate-500 px-1.5 touch-manipulation"
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="30"
                                title="Minutes"
                                value={inlineDurationInput.in_progress}
                                onChange={(e) => setInlineDurationInput({ ...inlineDurationInput, in_progress: e.target.value })}
                                className="w-12 sm:w-11 bg-white/5 light:bg-white border border-white/10 light:border-slate-300 rounded-lg px-1 py-1 text-base sm:text-[10px] text-slate-200 light:text-slate-800 font-mono text-center outline-none focus:border-sky-500 touch-manipulation"
                              />
                              <button
                                type="submit"
                                disabled={columnSubmitting === "in_progress" || !inlineTaskInput.in_progress.trim()}
                                className="w-6 h-6 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
                                title="Add task to In Progress"
                              >
                                <Plus size={13} />
                              </button>
                            </form>

                            {/* Task Cards List */}
                            <div className="space-y-2.5 overflow-y-auto max-h-[440px] pr-1 flex-grow">
                              {inProgressTasks.length === 0 ? (
                                <div className="text-center py-8 px-2 border border-dashed border-white/5 light:border-slate-200 rounded-xl">
                                  <Loader2 size={20} className="mx-auto text-sky-400/40 mb-1" />
                                  <p className="text-[11px] text-slate-500 italic">No tasks in progress</p>
                                </div>
                              ) : (
                                inProgressTasks.map((log) => {
                                  const isCurrentlyTiming = isSessionActive && activeSessionTask?.id === log._id;
                                  return (
                                    <div
                                      key={log._id}
                                      className={`p-3 rounded-xl border transition-all space-y-2 shadow-sm group ${
                                        isCurrentlyTiming
                                          ? "border-teal-500/50 light:border-teal-400 bg-teal-950/20 light:bg-teal-50/80 ring-1 ring-teal-500/30"
                                          : "border-sky-500/25 light:border-sky-200 bg-sky-950/10 light:bg-sky-50/60 hover:border-sky-500/40"
                                      }`}
                                    >
                                      {isCurrentlyTiming && (
                                        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-teal-400 light:text-teal-700 bg-teal-500/10 px-2 py-0.5 rounded-md">
                                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                                          <span>ACTIVE STOPWATCH RUNNING</span>
                                        </div>
                                      )}

                                      <div className="flex items-start justify-between gap-2">
                                        <h5 className="text-xs font-bold text-slate-100 light:text-slate-900 leading-snug">
                                          {log.topic}
                                        </h5>
                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => handleEditLogStart(log)}
                                            className="text-slate-400 hover:text-indigo-400 light:hover:text-indigo-600 p-1 rounded transition-colors"
                                            title="Edit Task"
                                          >
                                            <Pencil size={11} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteLog(log._id)}
                                            className="text-slate-400 hover:text-red-400 light:hover:text-red-600 p-1 rounded transition-colors"
                                            title="Delete Task"
                                          >
                                            <Trash2 size={11} />
                                          </button>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 light:text-slate-500">
                                        <span className="bg-sky-500/10 light:bg-sky-100 text-sky-400 light:text-sky-800 px-1.5 py-0.5 rounded font-bold">
                                          {log.durationMinutes || 0}m
                                        </span>
                                        <span>
                                          {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                      </div>

                                      {/* Action Buttons: Timer, Done & Back to To Do */}
                                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/5 light:border-slate-200">
                                        <button
                                          type="button"
                                          onClick={() => handleStartTimerForTask(log)}
                                          className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-teal-500/10 light:bg-teal-50 hover:bg-teal-500/20 text-teal-300 light:text-teal-700 border border-teal-500/20 light:border-teal-300 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                          title="Focus Stopwatch on this task"
                                        >
                                          <Play size={10} />
                                          <span>{isCurrentlyTiming ? "Timing" : "Timer"}</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSetStatus(log, "completed")}
                                          className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-emerald-500/10 light:bg-emerald-50 hover:bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/20 light:border-emerald-300 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                          title="Mark Completed"
                                        >
                                          <Check size={11} />
                                          <span>Done</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSetStatus(log, "todo")}
                                          className="p-1 rounded-lg bg-amber-500/10 light:bg-amber-50 hover:bg-amber-500/20 text-amber-300 light:text-amber-700 border border-amber-500/20 light:border-amber-300 transition-all cursor-pointer"
                                          title="Move back to To Do"
                                        >
                                          <RotateCcw size={11} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}

                        {/* ────── COLUMN 3: DONE ────── */}
                        {(mobileBoardTab === "all" || mobileBoardTab === "completed") && (
                          <div className="glass-card bg-[#0b0c16]/90 light:bg-white border border-emerald-500/20 light:border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-3 flex flex-col min-h-[360px] shadow-sm">
                            {/* Column Header */}
                            <div className="flex items-center justify-between border-b border-emerald-500/10 light:border-slate-100 pb-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 light:bg-emerald-100 text-emerald-400 light:text-emerald-700 flex items-center justify-center">
                                  <CheckCircle2 size={13} />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300 light:text-emerald-800 font-mono">
                                  Done
                                </h4>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 text-[10px] font-mono font-bold">
                                {completedTasks.length}
                              </span>
                            </div>

                            {/* Modern Inline Task Bar for Done */}
                            <form
                              onSubmit={(e) => handleQuickAddColumnTask("completed", e)}
                              className="p-1.5 rounded-xl bg-white/[0.03] light:bg-slate-50 border border-white/10 light:border-slate-300 flex items-center gap-1.5 transition-all focus-within:border-emerald-500/60"
                            >
                              <input
                                type="text"
                                placeholder="+ Add completed task..."
                                value={inlineTaskInput.completed}
                                onChange={(e) => setInlineTaskInput({ ...inlineTaskInput, completed: e.target.value })}
                                className="bg-transparent text-base sm:text-xs text-slate-100 light:text-slate-900 outline-none flex-grow min-w-0 placeholder:text-slate-500 px-1.5 touch-manipulation"
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="30"
                                title="Minutes"
                                value={inlineDurationInput.completed}
                                onChange={(e) => setInlineDurationInput({ ...inlineDurationInput, completed: e.target.value })}
                                className="w-12 sm:w-11 bg-white/5 light:bg-white border border-white/10 light:border-slate-300 rounded-lg px-1 py-1 text-base sm:text-[10px] text-slate-200 light:text-slate-800 font-mono text-center outline-none focus:border-emerald-500 touch-manipulation"
                              />
                              <button
                                type="submit"
                                disabled={columnSubmitting === "completed" || !inlineTaskInput.completed.trim()}
                                className="w-6 h-6 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
                                title="Add completed task"
                              >
                                <Plus size={13} />
                              </button>
                            </form>

                            {/* Task Cards List */}
                            <div className="space-y-2.5 overflow-y-auto max-h-[440px] pr-1 flex-grow">
                              {completedTasks.length === 0 ? (
                                <div className="text-center py-8 px-2 border border-dashed border-white/5 light:border-slate-200 rounded-xl">
                                  <CheckCircle2 size={20} className="mx-auto text-emerald-400/40 mb-1" />
                                  <p className="text-[11px] text-slate-500 italic">No completed tasks yet</p>
                                </div>
                              ) : (
                                completedTasks.map((log) => (
                                  <div
                                    key={log._id}
                                    className="p-3 rounded-xl border border-emerald-500/15 light:border-slate-200 bg-white/[0.01] light:bg-white hover:border-emerald-500/30 transition-all space-y-2 shadow-sm group"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <h5 className="text-xs font-bold text-slate-400 light:text-slate-500 line-through leading-snug">
                                        {log.topic}
                                      </h5>
                                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => handleEditLogStart(log)}
                                          className="text-slate-400 hover:text-indigo-400 light:hover:text-indigo-600 p-1 rounded transition-colors"
                                          title="Edit Task"
                                        >
                                          <Pencil size={11} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteLog(log._id)}
                                          className="text-slate-400 hover:text-red-400 light:hover:text-red-600 p-1 rounded transition-colors"
                                          title="Delete Task"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 light:text-slate-500">
                                      <span className="bg-emerald-500/10 light:bg-emerald-50 text-emerald-400 light:text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                        {log.durationMinutes || 0}m
                                      </span>
                                      <span>
                                        {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                      </span>
                                    </div>

                                    {/* Action Buttons: Reopen to To Do or Progress */}
                                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/5 light:border-slate-100">
                                      <button
                                        type="button"
                                        onClick={() => handleSetStatus(log, "todo")}
                                        className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-amber-500/10 light:bg-amber-50 hover:bg-amber-500/20 text-amber-300 light:text-amber-700 border border-amber-500/20 light:border-amber-300 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                        title="Reopen as To Do"
                                      >
                                        <RotateCcw size={10} />
                                        <span>Reopen</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleSetStatus(log, "in_progress");
                                          handleStartTimerForTask(log);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-teal-500/10 light:bg-teal-50 hover:bg-teal-500/20 text-teal-300 light:text-teal-700 border border-teal-500/20 light:border-teal-300 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                        title="Resume in Progress & Start Timer"
                                      >
                                        <Play size={10} />
                                        <span>Resume</span>
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ─────────────────────────────────────────────────────────────
                        2. LINEAR PAGINATED LIST VIEW
                       ───────────────────────────────────────────────────────────── */
                    <div className="space-y-4">
                      {/* Status Filter Chips Bar */}
                      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
                            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                              statusFilter === "all"
                                ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                                : "bg-white/[0.02] light:bg-slate-100 border-white/5 light:border-slate-200 text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900"
                            }`}
                          >
                            All ({allCount})
                          </button>

                          <button
                            type="button"
                            onClick={() => { setStatusFilter("todo"); setCurrentPage(1); }}
                            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                              statusFilter === "todo"
                                ? "bg-amber-500/25 light:bg-amber-100 border-amber-500/60 light:border-amber-400 text-amber-300 light:text-amber-900 shadow-sm font-black"
                                : "bg-white/[0.02] light:bg-slate-100 border-white/5 light:border-slate-200 text-slate-400 light:text-slate-600 hover:border-amber-500/30"
                            }`}
                          >
                            <Clock size={11} className="text-amber-400 light:text-amber-600" />
                            <span>To Do ({todoCount})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setStatusFilter("in_progress"); setCurrentPage(1); }}
                            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                              statusFilter === "in_progress"
                                ? "bg-sky-500/25 light:bg-sky-100 border-sky-500/60 light:border-sky-400 text-sky-300 light:text-sky-900 shadow-sm font-black"
                                : "bg-white/[0.02] light:bg-slate-100 border-white/5 light:border-slate-200 text-slate-400 light:text-slate-600 hover:border-sky-500/30"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                            <span>In Progress ({inProgressCount})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setStatusFilter("completed"); setCurrentPage(1); }}
                            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                              statusFilter === "completed"
                                ? "bg-emerald-500/25 light:bg-emerald-100 border-emerald-500/60 light:border-emerald-400 text-emerald-300 light:text-emerald-900 shadow-sm font-black"
                                : "bg-white/[0.02] light:bg-slate-100 border-white/5 light:border-slate-200 text-slate-400 light:text-slate-600 hover:border-emerald-500/30"
                            }`}
                          >
                            <CheckCircle2 size={11} className="text-emerald-400 light:text-emerald-600" />
                            <span>Completed ({completedCount})</span>
                          </button>
                        </div>
                      </div>

                      {/* Log List with Pagination */}
                      <div className="space-y-3">
                        {displayedStudyLogs.length === 0 ? (
                          <div className="text-center py-10 px-4 border border-dashed border-white/10 light:border-slate-200 rounded-2xl">
                            <ListTodo size={28} className="mx-auto text-slate-600 light:text-slate-400 mb-2" />
                            <p className="text-xs text-slate-400 light:text-slate-600 font-medium">
                              {statusFilter === "all"
                                ? `No study logs found for ${getContextLabel()}.`
                                : `No tasks in "${statusFilter.replace("_", " ")}" status for ${getContextLabel()}.`}
                            </p>
                            <p className="text-[10px] text-slate-500 light:text-slate-400 mt-1">
                              Add a new topic above or start the study stopwatch!
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 flex flex-col justify-between">
                            <div className="overflow-y-auto max-h-[380px] pr-1.5 space-y-2.5">
                              {paginatedStudyLogs.map((log) => {
                                const currentStatus: StudyStatus = log.status || (log.completed ? "completed" : "todo");
                                return editingLogId === log._id ? (
                                  /* ── INLINE EDIT LOG ── */
                                  <div key={log._id} className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 light:bg-indigo-50/50 space-y-2.5">
                                    <div>
                                      <label className="text-[9px] uppercase tracking-wider text-slate-400 light:text-slate-600 font-mono font-bold">Topic</label>
                                      <input
                                        type="text"
                                        value={editLogForm.topic}
                                        onChange={(e) => setEditLogForm({ ...editLogForm, topic: e.target.value })}
                                        className="w-full mt-0.5 bg-white/5 light:bg-white border border-white/10 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-base sm:text-xs text-slate-100 light:text-slate-900 focus:outline-none focus:border-indigo-500 touch-manipulation"
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <div>
                                        <label className="text-[9px] uppercase tracking-wider text-slate-400 light:text-slate-600 font-mono font-bold">Duration (min)</label>
                                        <input
                                          type="number"
                                          value={editLogForm.durationMinutes}
                                          onChange={(e) => setEditLogForm({ ...editLogForm, durationMinutes: e.target.value })}
                                          className="w-full mt-0.5 bg-white/5 light:bg-white border border-white/10 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-base sm:text-xs text-slate-100 light:text-slate-900 focus:outline-none focus:border-indigo-500 font-mono touch-manipulation"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] uppercase tracking-wider text-slate-400 light:text-slate-600 font-mono font-bold">Date</label>
                                        <input
                                          type="date"
                                          value={editLogForm.date}
                                          onChange={(e) => setEditLogForm({ ...editLogForm, date: e.target.value })}
                                          className="w-full mt-0.5 bg-white/5 light:bg-white border border-white/10 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-base sm:text-xs text-slate-100 light:text-slate-900 focus:outline-none focus:border-indigo-500 font-mono touch-manipulation"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] uppercase tracking-wider text-slate-400 light:text-slate-600 font-mono font-bold">Status</label>
                                        <select
                                          value={editLogForm.status}
                                          onChange={(e) => setEditLogForm({ ...editLogForm, status: e.target.value as StudyStatus })}
                                          className="w-full mt-0.5 bg-white/5 light:bg-white border border-white/10 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 light:text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                        >
                                          <option value="todo" className="bg-[#0c0c16] light:bg-white text-slate-200 light:text-slate-900">To Do</option>
                                          <option value="in_progress" className="bg-[#0c0c16] light:bg-white text-slate-200 light:text-slate-900">In Progress</option>
                                          <option value="completed" className="bg-[#0c0c16] light:bg-white text-slate-200 light:text-slate-900">Completed</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                      <button
                                        onClick={() => setEditingLogId(null)}
                                        className="flex items-center gap-1 text-xs text-slate-400 light:text-slate-600 px-3 py-1.5 rounded-lg border border-white/10 light:border-slate-200 hover:bg-white/5 light:hover:bg-slate-100 cursor-pointer"
                                      >
                                        <X size={12} /> Cancel
                                      </button>
                                      <button
                                        onClick={() => handleEditLogSave(log._id)}
                                        className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg cursor-pointer"
                                      >
                                        <Check size={12} /> Save
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* ── READ VIEW ITEM ── */
                                  <div
                                    key={log._id}
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                                      currentStatus === "completed"
                                        ? "border-emerald-500/15 light:border-emerald-200/60 bg-white/[0.01] light:bg-white"
                                        : currentStatus === "in_progress"
                                        ? "border-sky-500/25 light:border-sky-300 bg-sky-950/10 light:bg-sky-50/50 shadow-sm"
                                        : "border-white/5 light:border-slate-200 bg-white/[0.02] light:bg-white"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3 min-w-0 flex-grow">
                                      {/* 1-Click Interactive Status Badge */}
                                      <button
                                        type="button"
                                        onClick={() => handleCycleStatus(log)}
                                        title={`Current status: ${currentStatus.replace("_", " ").toUpperCase()}. Click to cycle.`}
                                        className={`flex items-center gap-1 text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer touch-manipulation flex-shrink-0 ${
                                          currentStatus === "completed"
                                            ? "bg-emerald-500/15 light:bg-emerald-50 border-emerald-500/30 light:border-emerald-300 text-emerald-300 light:text-emerald-800 hover:bg-emerald-500/25"
                                            : currentStatus === "in_progress"
                                            ? "bg-sky-500/20 light:bg-sky-50 border-sky-500/40 light:border-sky-300 text-sky-300 light:text-sky-800 hover:bg-sky-500/30 animate-pulse-subtle"
                                            : "bg-amber-500/15 light:bg-amber-50 border-amber-500/30 light:border-amber-300 text-amber-300 light:text-amber-800 hover:bg-amber-500/25"
                                        }`}
                                      >
                                        {currentStatus === "completed" && <CheckCircle2 size={12} />}
                                        {currentStatus === "in_progress" && <Loader2 size={12} className="animate-spin" />}
                                        {currentStatus === "todo" && <Clock size={12} />}
                                        <span>
                                          {currentStatus === "completed" ? "Completed" : currentStatus === "in_progress" ? "In Progress" : "To Do"}
                                        </span>
                                      </button>

                                      <div className="min-w-0 flex-grow">
                                        <h4 className={`text-xs font-bold truncate ${
                                          currentStatus === "completed"
                                            ? "line-through text-slate-400 light:text-slate-500"
                                            : "text-slate-100 light:text-slate-900"
                                        }`}>
                                          {log.topic}
                                        </h4>
                                        <div className="flex flex-wrap gap-2 items-center mt-1">
                                          <span className="text-[9px] font-mono text-indigo-400 light:text-indigo-700 bg-indigo-950/20 light:bg-indigo-50 border border-indigo-500/10 light:border-indigo-200 px-1.5 py-0.5 rounded font-bold">
                                            {log.durationMinutes} min
                                          </span>
                                          <span className="text-[9px] text-slate-400 light:text-slate-500 font-mono">
                                            {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Item Actions */}
                                    <div className="flex items-center gap-1 justify-end flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/5 light:border-slate-100">
                                      {/* Quick Launch Stopwatch on this task */}
                                      {currentStatus !== "completed" && (
                                        <button
                                          type="button"
                                          onClick={() => handleStartTimerForTask(log)}
                                          className="flex items-center gap-1 text-[10px] font-bold text-teal-400 light:text-teal-700 bg-teal-500/10 light:bg-teal-50 hover:bg-teal-500/20 light:hover:bg-teal-100 border border-teal-500/20 light:border-teal-200 px-2 py-1 rounded-lg transition-all cursor-pointer"
                                          title="Start Study Session Timer for this task"
                                        >
                                          <Play size={10} />
                                          <span>Timer</span>
                                        </button>
                                      )}

                                      <button
                                        onClick={() => handleEditLogStart(log)}
                                        className="text-slate-400 hover:text-indigo-400 light:text-slate-500 light:hover:text-indigo-600 p-1.5 rounded-lg transition-all cursor-pointer hover:bg-indigo-500/10 light:hover:bg-indigo-50"
                                        title="Edit Entry"
                                      >
                                        <Pencil size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLog(log._id)}
                                        className="text-slate-400 hover:text-red-400 light:text-slate-500 light:hover:text-red-600 p-1.5 rounded-lg transition-all cursor-pointer hover:bg-red-500/10 light:hover:bg-red-50"
                                        title="Delete Entry"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Pagination Bar */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between border-t border-white/5 light:border-slate-200 pt-3.5 mt-1 font-sans text-xs">
                                <button
                                  onClick={() => {
                                    setCurrentPage((p) => Math.max(1, p - 1));
                                    if (logsRef.current) {
                                      logsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }
                                  }}
                                  disabled={currentPage === 1}
                                  className="px-3 py-1.5 rounded-lg bg-white/[0.02] light:bg-slate-100 hover:bg-white/[0.08] light:hover:bg-slate-200 border border-white/5 light:border-slate-200 text-slate-400 light:text-slate-700 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                                >
                                  Previous
                                </button>
                                <span className="text-[10px] font-bold text-slate-400 light:text-slate-600 uppercase tracking-widest font-mono">
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
                                  className="px-3 py-1.5 rounded-lg bg-white/[0.02] light:bg-slate-100 hover:bg-white/[0.08] light:hover:bg-slate-200 border border-white/5 light:border-slate-200 text-slate-400 light:text-slate-700 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold uppercase tracking-wider text-[10px] cursor-pointer"
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
