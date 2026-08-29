"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BookOpen, CreditCard, Apple, LayoutDashboard, LogOut, User, Sun, Moon, Activity, Heart, Timer, Square
} from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global persistent study stopwatch widget states
  const [stopwatchActive, setStopwatchActive] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const globalTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkStopwatch = () => {
      const active = localStorage.getItem("study_stopwatch_is_active") === "true";
      setStopwatchActive(active);

      if (active) {
        const startTime = Number(localStorage.getItem("study_stopwatch_start_time") || Date.now());
        const accumulated = Number(localStorage.getItem("study_stopwatch_accumulated_seconds") || 0);
        const elapsed = Math.round((Date.now() - startTime) / 1000) + accumulated;
        setStopwatchSeconds(elapsed);

        // Start interval
        if (globalTimerRef.current) clearInterval(globalTimerRef.current);
        globalTimerRef.current = setInterval(() => {
          const currentElapsed = Math.round((Date.now() - startTime) / 1000) + accumulated;
          setStopwatchSeconds(currentElapsed);
        }, 1000);
      } else {
        if (globalTimerRef.current) {
          clearInterval(globalTimerRef.current);
          globalTimerRef.current = null;
        }
        setStopwatchSeconds(0);
      }
    };

    checkStopwatch();

    window.addEventListener("study-stopwatch-changed", checkStopwatch);
    // Also listen to storage events to sync across multiple tabs
    window.addEventListener("storage", checkStopwatch);

    return () => {
      window.removeEventListener("study-stopwatch-changed", checkStopwatch);
      window.removeEventListener("storage", checkStopwatch);
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    };
  }, []);

  const handleStopPersistentSession = async () => {
    const topicName = prompt("What did you study during this session?", "Algorithms Practice");
    if (topicName === null) return; // Discard click

    const finalTopic = topicName.trim() || "Algorithms Practice";
    const minutes = Math.max(1, Math.round(stopwatchSeconds / 60));

    // Clear local storage persistent states
    localStorage.removeItem("study_stopwatch_is_active");
    localStorage.removeItem("study_stopwatch_start_time");
    localStorage.removeItem("study_stopwatch_accumulated_seconds");
    
    // Notify all listeners
    window.dispatchEvent(new Event("study-stopwatch-changed"));

    try {
      await fetch("/api/tracking/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: finalTopic,
          durationMinutes: minutes,
          completed: true,
        }),
      });
    } catch (err) {
      console.error("Error saving persistent study log:", err);
    }
  };

  const formatStopwatch = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? String(hrs).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("light", savedTheme === "light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("light", nextTheme === "light");
  };

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { href: "/learning", label: "Learning", icon: <BookOpen size={16} /> },
    { href: "/expenses", label: "Expenses", icon: <CreditCard size={16} /> },
    { href: "/food", label: "Food Log", icon: <Apple size={16} /> },
    { href: "/wellness", label: "Wellness", icon: <Heart size={16} /> },
  ];

  return (
    <header className="relative z-20 w-full nav-header">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-1 sm:gap-4">

        {/* Brand Link to Dashboard */}
        <Link href="/dashboard" className="flex items-center gap-2 group cursor-pointer select-none">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white group-hover:scale-105 transition-all shadow-md shadow-indigo-500/10">
            <Activity size={16} className="animate-pulse" />
          </div>
          <div className="hidden sm:block">
          <h1 className="text-sm font-black uppercase tracking-widest text-slate-200 light:text-slate-850 group-hover:text-indigo-400 light:group-hover:text-indigo-600 transition-all">Personal Labs</h1>
            <p className="text-[9px] uppercase tracking-wider text-slate-500 light:text-slate-600">
              {session?.user?.name ? `${session.user.name.split(" ")[0]}'s` : "System"} Growth Core
            </p>
          </div>
        </Link>

        {/* Links (Static buttons, no popups) */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all nav-link ${
                  isActive ? "nav-link-active" : ""
                }`}
              >
                {link.icon}
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>


        {/* Profile, Theme Switcher & LogOut */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="profile-3d-card flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-400 light:text-slate-800 hover:text-slate-200 light:hover:text-slate-950 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-xl cursor-pointer transition-all focus:outline-none"
              title="View Profile Info"
            >
              <User size={12} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span className="hidden sm:inline max-w-[100px] truncate">{session?.user?.name || "User"}</span>
              <span className="inline sm:hidden font-bold">{session?.user?.name ? session.user.name.split(" ")[0].slice(0, 1).toUpperCase() : "U"}</span>
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 light:border-slate-200 bg-[#0c0c16] light:bg-white backdrop-blur-xl shadow-2xl p-3 text-xs space-y-1 z-30">
                <p className="text-[10px] uppercase font-bold text-slate-500 light:text-slate-400 tracking-wider">Logged In As</p>
                <p className="font-bold text-slate-200 light:text-slate-900 truncate">{session?.user?.name || "User"}</p>
                <p className="text-[10px] text-slate-450 light:text-slate-500 truncate">{session?.user?.email || "No Email Associated"}</p>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-white/[0.02] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer transition-all flex items-center justify-center"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
          </button>

          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to log out?")) {
                signOut({ callbackUrl: "/" });
              }
            }}
            className="flex items-center gap-1 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-500/10 hover:border-red-300 dark:hover:border-red-500/25 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest p-1.5 sm:px-3 sm:py-2 rounded-xl cursor-pointer transition-all"
            title="Log Out"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Persistent Floating Stopwatch Widget (visible on all pages when active) */}
      {stopwatchActive && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 sm:gap-3 bg-[#0d0d1a]/95 light:bg-white/95 border border-teal-500/30 light:border-teal-500/20 backdrop-blur-xl shadow-2xl p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl animate-pulse-subtle transition-all">
          <div className="relative flex items-center justify-center flex-shrink-0">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-teal-500 animate-ping absolute" />
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-teal-500 relative" />
          </div>

          <div className="flex flex-col text-left">
            <span className="hidden sm:inline text-[8px] font-black uppercase tracking-wider text-slate-500 light:text-slate-400">Study Session Active</span>
            <span className="text-xs sm:text-sm font-black font-mono tracking-widest text-slate-100 light:text-slate-800">{formatStopwatch(stopwatchSeconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 border-l border-white/10 light:border-slate-200 pl-2 sm:pl-3">
            <Link
              href="/learning"
              className="text-[8px] sm:text-[9px] font-bold text-indigo-400 light:text-indigo-600 hover:underline hover:text-indigo-300 light:hover:text-indigo-500 whitespace-nowrap"
            >
              Console
            </Link>
            <button
              onClick={handleStopPersistentSession}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-red-500/20 shadow-md transition-all cursor-pointer whitespace-nowrap"
              title="Stop and save session"
            >
              <Square size={8} fill="currentColor" />
              <span>Stop</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
