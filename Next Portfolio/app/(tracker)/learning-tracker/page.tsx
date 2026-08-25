"use client";

import React, { useState, useEffect, useRef } from "react";

// Default configuration constants
const DEFAULT_START_DATE = new Date("2026-08-25T00:00:00");
const DEFAULT_END_DATE = new Date("2027-02-25T00:00:00");

// Milestone template list definition
const MILESTONE_TEMPLATES = [
  {
    id: 1,
    name: "Month 1: Advanced TS & Clean Architecture",
    desc: "Domain Driven Design, Design Patterns, SOLID practices.",
  },
  {
    id: 2,
    name: "Month 2: Algorithms & SDET Best Practices",
    desc: "Complex data structures, runtime optimization, design patterns in automation.",
  },
  {
    id: 3,
    name: "Month 3: High-Scale System Design",
    desc: "Microservices, caching strategies, distributed systems architectures.",
  },
  {
    id: 4,
    name: "Month 4: Cloud Infrastructure & DevOps",
    desc: "CI/CD integration, Docker, Kubernetes, AWS resources setup.",
  },
  {
    id: 5,
    name: "Month 5: Event-Driven & Async Pipelines",
    desc: "Kafka message brokers, Redis cache layer validation, real-time message streams.",
  },
  {
    id: 6,
    name: "Month 6: Capstone Project & QE Leadership",
    desc: "Custom test suites, scale-load tests, end-to-end framework assembly.",
  },
];

const MOTIVATIONAL_QUOTES = [
  "Consistency is the separator of dreamers and doers.",
  "Six months of focus can put you five years ahead.",
  "Every line of code you write is a step closer to mastery.",
  "Small daily gains compound into massive long-term success.",
  "Your potential is endless. Go make it happen.",
];

interface StudiedTopic {
  id: number;
  text: string;
  dateStr: string; // YYYY-MM-DD for streak calculations
  displayDate: string; // "Aug 25"
  completed: boolean;
}

export default function LearningTrackerPage() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [quote, setQuote] = useState("");
  
  // Interactive Panels State
  const [activeTab, setActiveTab] = useState<"roadmap" | "studied">("roadmap");
  const [studiedTopics, setStudiedTopics] = useState<StudiedTopic[]>([]);
  const [newTopicText, setNewTopicText] = useState("");

  // Human Features State
  const [currentFocus, setCurrentFocus] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic Goal Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [goalStartDate, setGoalStartDate] = useState<Date>(DEFAULT_START_DATE);
  const [goalEndDate, setGoalEndDate] = useState<Date>(DEFAULT_END_DATE);
  
  // Settings Form Inputs
  const [inputStartDate, setInputStartDate] = useState("2026-08-25");
  const [inputDuration, setInputDuration] = useState<number>(6);
  const [inputDurationUnit, setInputDurationUnit] = useState<"months" | "days">("months");

  // Format utility for Date -> YYYY-MM-DD
  const formatDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Clean layout body override, load from LocalStorage on mount
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    document.body.classList.add("tracker-body-override");
    
    // Pick random quote
    const randomIdx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[randomIdx]);

    // Load from LocalStorage
    try {
      const savedTopics = localStorage.getItem("rajat_studied_topics");
      if (savedTopics) {
        setStudiedTopics(JSON.parse(savedTopics));
      }
      
      const savedFocus = localStorage.getItem("rajat_learning_focus");
      if (savedFocus) {
        setCurrentFocus(savedFocus);
      }

      // Load Goal Configuration
      const savedStart = localStorage.getItem("rajat_goal_start_date");
      const savedDuration = localStorage.getItem("rajat_goal_duration");
      const savedUnit = localStorage.getItem("rajat_goal_duration_unit");

      if (savedStart && savedDuration && savedUnit) {
        const start = new Date(savedStart + "T00:00:00");
        const dur = parseInt(savedDuration);
        const unit = savedUnit as "months" | "days";

        setGoalStartDate(start);
        setInputStartDate(savedStart);
        setInputDuration(dur);
        setInputDurationUnit(unit);

        const end = calculateEndDate(start, dur, unit);
        setGoalEndDate(end);
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }

    return () => {
      document.body.classList.remove("tracker-body-override");
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Helper to calculate End Date
  const calculateEndDate = (start: Date, dur: number, unit: "months" | "days"): Date => {
    const end = new Date(start.getTime());
    if (unit === "months") {
      end.setMonth(end.getMonth() + dur);
    } else {
      end.setDate(end.getDate() + dur);
    }
    return end;
  };

  // Set up clock tick
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Session stopwatch timer effect
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

  if (!mounted || !currentTime) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p style={{ color: "#64748b", fontFamily: "monospace" }}>INITIALIZING SYSTEM CORE...</p>
      </div>
    );
  }

  const currentMs = currentTime.getTime();
  const startMs = goalStartDate.getTime();
  const endMs = goalEndDate.getTime();
  const totalGoalTime = endMs - startMs;

  // Time & Progress calculations
  const elapsed = Math.max(0, currentMs - startMs);
  const remaining = Math.max(0, endMs - currentMs);
  const percentProgress = Math.min(100, Math.max(0, (elapsed / totalGoalTime) * 100));

  const daysRemaining = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutesRemaining = Math.floor((remaining / (1000 * 60)) % 60);
  const secondsRemaining = Math.floor((remaining / 1000) % 60);

  const daysElapsed = Math.floor(elapsed / (1000 * 60 * 60 * 24));
  const totalDays = Math.floor(totalGoalTime / (1000 * 60 * 60 * 24));

  // Clock formatters
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Dynamic Milestones Mapping
  // Divides the dynamically set duration into 6 equal milestones
  const milestoneStepMs = totalGoalTime / 6;
  const dynamicMilestones = MILESTONE_TEMPLATES.map((tpl, idx) => {
    const mStart = new Date(startMs + idx * milestoneStepMs);
    const mEnd = new Date(startMs + (idx + 1) * milestoneStepMs);
    return {
      ...tpl,
      start: mStart,
      end: mEnd,
    };
  });

  // SVG progress variables - Compact radius of 72
  const radius = 72;
  const strokeDash = 2 * Math.PI * radius;
  const strokeOffset = strokeDash - (percentProgress / 100) * strokeDash;

  // LocalStorage Sync Helpers
  const saveTopics = (updated: StudiedTopic[]) => {
    setStudiedTopics(updated);
    try {
      localStorage.setItem("rajat_studied_topics", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const saveFocus = (val: string) => {
    setCurrentFocus(val);
    try {
      localStorage.setItem("rajat_learning_focus", val);
    } catch (e) {
      console.error(e);
    }
  };

  // Save Goal Configurations
  const handleSaveGoalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const start = new Date(inputStartDate + "T00:00:00");
      const end = calculateEndDate(start, inputDuration, inputDurationUnit);

      setGoalStartDate(start);
      setGoalEndDate(end);
      setShowSettings(false);

      localStorage.setItem("rajat_goal_start_date", inputStartDate);
      localStorage.setItem("rajat_goal_duration", String(inputDuration));
      localStorage.setItem("rajat_goal_duration_unit", inputDurationUnit);
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic Streak Calculation
  const calculateStreak = (): number => {
    if (studiedTopics.length === 0) return 0;
    
    const completedDates = new Set(
      studiedTopics
        .filter((t) => t.completed)
        .map((t) => t.dateStr)
    );

    if (completedDates.size === 0) return 0;

    const formatDateKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const todayStr = formatDateKey(currentTime);
    const yesterday = new Date(currentTime);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateKey(yesterday);

    let checkDate = new Date(currentTime);
    let currentKey = todayStr;

    if (!completedDates.has(todayStr)) {
      if (completedDates.has(yesterdayStr)) {
        checkDate = yesterday;
        currentKey = yesterdayStr;
      } else {
        return 0; // Streak broken
      }
    }

    let streak = 0;
    while (completedDates.has(currentKey)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      currentKey = formatDateKey(checkDate);
    }

    return streak;
  };

  // Add Topic Handler
  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicText.trim()) return;

    const displayDate = currentTime.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, "0");
    const day = String(currentTime.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const newTopic: StudiedTopic = {
      id: Date.now(),
      text: newTopicText.trim(),
      dateStr,
      displayDate,
      completed: true,
    };

    saveTopics([newTopic, ...studiedTopics]);
    setNewTopicText("");
  };

  // Toggle Topic Completed
  const handleToggleCompleted = (id: number) => {
    const updated = studiedTopics.map((topic) =>
      topic.id === id ? { ...topic, completed: !topic.completed } : topic
    );
    saveTopics(updated);
  };

  // Delete Topic
  const handleDeleteTopic = (id: number) => {
    const updated = studiedTopics.filter((topic) => topic.id !== id);
    saveTopics(updated);
  };

  // Session Stopwatch Toggle Handler
  const handleToggleSession = () => {
    if (isSessionActive) {
      const minutes = Math.max(1, Math.round(sessionSeconds / 60));
      const focusText = currentFocus ? `focused on "${currentFocus}"` : "studied";
      setNewTopicText(`Studied: ${focusText} for ${minutes} min${minutes > 1 ? "s" : ""}`);
      setActiveTab("studied");
      setIsSessionActive(false);
      setSessionSeconds(0);
    } else {
      setIsSessionActive(true);
      setSessionSeconds(0);
    }
  };

  // Format Stopwatch Seconds
  const formatStopwatch = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? String(hrs).padStart(2, "0") + ":" : ""}${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const currentStreak = calculateStreak();

  return (
    <div className="tracker-root">
      <div className="tracker-grid"></div>
      
      {/* Top Header Section */}
      <header className="tracker-header">
        <div className="brand-section">
          <h1 className="brand-title">LEARNING LAB.6M</h1>
          <p className="brand-subtitle">Rajat's Growth Sandbox</p>
        </div>

        {/* Human Feature: Current Focus Input Bar */}
        <div className="focus-container">
          <span className="focus-lbl">Target Focus:</span>
          <input
            type="text"
            className="focus-input"
            placeholder="Type your current focus objective..."
            value={currentFocus}
            onChange={(e) => saveFocus(e.target.value)}
          />
        </div>

        <div className="clock-display">
          <div className="clock-time">{formattedTime}</div>
          <div className="clock-date">{formattedDate}</div>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="tracker-main">
        {/* Left Side: SVG Progress, Countdown & Session Timer */}
        <section className="tracker-card progress-container">
          
          {/* Settings Configurator Button inside card */}
          <button 
            type="button" 
            className="settings-toggle-btn"
            onClick={() => setShowSettings(true)}
            title="Configure Goal Timeline"
          >
            ⚙
          </button>

          {/* Collapsible Goal Config Drawer (Settings Overlay) */}
          {showSettings && (
            <div className="settings-overlay">
              <div className="settings-overlay-title">
                <span>⚙</span> Dynamic Goal Config
              </div>
              <form className="settings-form" onSubmit={handleSaveGoalSettings}>
                <div className="settings-field-group">
                  <label className="settings-lbl">Goal Start Date</label>
                  <input
                    type="date"
                    className="settings-input"
                    value={inputStartDate}
                    onChange={(e) => setInputStartDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="settings-row">
                  <div className="settings-field-group">
                    <label className="settings-lbl">Duration</label>
                    <input
                      type="number"
                      className="settings-input"
                      value={inputDuration}
                      onChange={(e) => setInputDuration(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="settings-field-group">
                    <label className="settings-lbl">Unit</label>
                    <select
                      className="settings-select"
                      value={inputDurationUnit}
                      onChange={(e) => setInputDurationUnit(e.target.value as "months" | "days")}
                    >
                      <option value="months">Months</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>

                <div className="settings-actions">
                  <button type="submit" className="settings-save-btn">Save Target</button>
                  <button 
                    type="button" 
                    className="settings-cancel-btn"
                    onClick={() => {
                      setInputStartDate(formatDateString(goalStartDate));
                      setInputDuration(6);
                      setInputDurationUnit("months");
                      setShowSettings(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Left Column: Radial Progress ring */}
          <div className="radial-col">
            <div className="radial-progress-wrapper">
              <svg className="radial-progress-svg" viewBox="0 0 170 170" width="170" height="170">
                <defs>
                  <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                <circle
                  className="progress-bg"
                  cx="85"
                  cy="85"
                  r={radius}
                />
                <circle
                  className="progress-glow"
                  cx="85"
                  cy="85"
                  r={radius}
                  strokeDasharray={strokeDash}
                  strokeDashoffset={strokeOffset}
                />
                <circle
                  className="progress-bar"
                  cx="85"
                  cy="85"
                  r={radius}
                  strokeDasharray={strokeDash}
                  strokeDashoffset={strokeOffset}
                />
              </svg>

              <div className="progress-text-center">
                <div className="percent-num">{percentProgress.toFixed(1)}%</div>
                <div className="percent-label">Completed</div>
                <div className="days-stats">
                  {daysElapsed}/{totalDays} DAYS
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Countdown numbers and active session stopwatch */}
          <div className="stats-col">
            {/* Countdown timer components */}
            <div className="countdown-row">
              <div className="countdown-box">
                <span className="countdown-val">{daysRemaining}</span>
                <span className="countdown-lbl">Days</span>
              </div>
              <div className="countdown-box">
                <span className="countdown-val">
                  {String(hoursRemaining).padStart(2, "0")}
                </span>
                <span className="countdown-lbl">Hours</span>
              </div>
              <div className="countdown-box">
                <span className="countdown-val">
                  {String(minutesRemaining).padStart(2, "0")}
                </span>
                <span className="countdown-lbl">Mins</span>
              </div>
              <div className="countdown-box">
                <span className="countdown-val">
                  {String(secondsRemaining).padStart(2, "0")}
                </span>
                <span className="countdown-lbl">Secs</span>
              </div>
            </div>

            {/* Human Feature: Study Session Stopwatch */}
            <div className={`session-timer-box ${isSessionActive ? "active" : ""}`}>
              <div className={`timer-label-row ${isSessionActive ? "active" : ""}`}>
                {isSessionActive && <div className="pulse-dot" style={{ background: "#14b8a6" }}></div>}
                <span>{isSessionActive ? "Active Study Session" : "Track Session"}</span>
              </div>
              <div className="session-time-display">{formatStopwatch(sessionSeconds)}</div>
              <button type="button" className="session-btn" onClick={handleToggleSession}>
                {isSessionActive ? "Stop & Log Study" : "Start Study Timer"}
              </button>
            </div>
          </div>
        </section>

        {/* Right Side: Roadmap & Studied Log Tabs */}
        <section className="tracker-card right-panel-container">
          <div className="panel-tabs-header">
            <button
              className={`panel-tab-btn ${activeTab === "roadmap" ? "active" : ""}`}
              onClick={() => setActiveTab("roadmap")}
            >
              6-Month Roadmap
            </button>
            <button
              className={`panel-tab-btn ${activeTab === "studied" ? "active" : ""}`}
              onClick={() => setActiveTab("studied")}
            >
              Studied Topics Log
            </button>
          </div>

          <div className="panel-body-content">
            {activeTab === "roadmap" ? (
              <>
                <h2 className="milestones-title">
                  6-MONTH ROADMAP <span>// TARGET TRACK</span>
                </h2>
                <div className="milestone-list">
                  {dynamicMilestones.map((m) => {
                    const isCompleted = currentMs >= m.end.getTime();
                    const isActive = currentMs >= m.start.getTime() && currentMs < m.end.getTime();
                    
                    let statusClass = "";
                    if (isCompleted) statusClass = "completed";
                    else if (isActive) statusClass = "active";

                    return (
                      <div key={m.id} className={`milestone-item ${statusClass}`}>
                        <div className="milestone-indicator">
                          {isCompleted ? "✓" : m.id}
                        </div>
                        <div className="milestone-content">
                          <span className="milestone-name">{m.name}</span>
                          <span className="milestone-desc">{m.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="study-log-title">
                  <h2>TOPICS STUDIED <span>// PERSONAL LOG</span></h2>
                  <span className="study-log-counter">
                    {studiedTopics.filter(t => t.completed).length} Logged
                  </span>
                </div>

                <form className="add-topic-form" onSubmit={handleAddTopic}>
                  <input
                    type="text"
                    className="topic-input"
                    placeholder="Enter what you studied today..."
                    value={newTopicText}
                    onChange={(e) => setNewTopicText(e.target.value)}
                  />
                  <button type="submit" className="add-topic-btn">Log Topic</button>
                </form>

                <div className="studied-list">
                  {studiedTopics.length === 0 ? (
                    <p className="empty-state">No topics logged yet. Start typing above or use the stopwatch timer to log your progress!</p>
                  ) : (
                    studiedTopics.map((topic) => (
                      <div key={topic.id} className={`studied-item ${topic.completed ? "done" : ""}`}>
                        <div className="studied-item-left">
                          <button
                            type="button"
                            className="studied-checkbox-btn"
                            onClick={() => handleToggleCompleted(topic.id)}
                          >
                            ✓
                          </button>
                          <span className="studied-text">{topic.text}</span>
                        </div>
                        <div className="studied-item-right">
                          <span className="date-badge">{topic.displayDate}</span>
                          <button
                            type="button"
                            className="delete-topic-btn"
                            onClick={() => handleDeleteTopic(topic.id)}
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Footer Section */}
      <div className="tracker-footer">
        <div className="footer-quote">
          "{quote}"
        </div>
        <div className="status-block">
          {currentStreak > 0 && (
            <div className="streak-badge">
              <span>🔥</span>
              <span>{currentStreak} DAY STREAK</span>
            </div>
          )}
          <div className="status-badge">
            <div className="pulse-dot"></div>
            <span>SYSTEM ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
