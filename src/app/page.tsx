"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, BookOpen, CreditCard, Apple, ArrowRight, ShieldCheck, Sun, Moon } from "lucide-react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

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

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-background">
      <div className="cyber-grid"></div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        {/* Brand Link to Home */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer select-none">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white group-hover:scale-105 transition-all shadow-md shadow-indigo-500/10">
            <Activity size={16} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-200 group-hover:text-indigo-400 transition-all">Personal Labs</h1>
            <p className="text-[9px] uppercase tracking-wider text-slate-600">
              {session && (session as any).user?.name ? `${(session as any).user.name.split(" ")[0]}'s` : "System"} Growth Core
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 text-slate-400 hover:text-slate-200 cursor-pointer transition-all flex items-center justify-center"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <Link
            href="/login"
            className="text-xs font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-all border border-indigo-500/20 bg-indigo-500/5 px-4 py-2 rounded-xl"
          >
            Access Portal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center justify-center flex-grow text-center">
        <div className="mb-4 inline-flex items-center gap-2 bg-indigo-950/30 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
          <ShieldCheck size={12} />
          Authorized Entry Only
        </div>

        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-100 max-w-2xl leading-tight">
          Manage your life records with{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
            Perfect Continuity
          </span>
        </h2>

        <p className="text-sm text-slate-500 max-w-md mt-4 leading-relaxed">
          Secure, multi-user workspace to track technical roadmap milestones, monitor cash flows by target divisions, and balance daily nutritional goals.
        </p>

        <div className="flex flex-wrap gap-4 mt-8 justify-center">
          <Link
            href="/login"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer"
          >
            <span>Sign In to Dashboard</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/register"
            className="border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            Create Account
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full text-left">
          {/* Card 1 */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-48">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Study Roadmap</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Log study subjects, track streaks, map milestones, and measure learning stopwatch sessions.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-48">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Expense Tracker</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Sort expenditures across your customized tracking categories for comprehensive insights.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-48">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Apple size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Protein Intake</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Log food portions in grams, compute raw proteins, and map results to target daily intake.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <p className="text-[10px] uppercase tracking-wider text-slate-600">
          &copy; 2026 Personal Labs. All rights reserved.
        </p>
        <div className="flex items-center gap-2 text-[10px] text-teal-500 font-mono">
          <Activity size={10} className="animate-pulse" />
          SYSTEMS FULLY DEPLOYED
        </div>
      </footer>
    </div>
  );
}
