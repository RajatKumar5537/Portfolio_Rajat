"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BookOpen, CreditCard, Apple, LayoutDashboard, LogOut, User, Sun, Moon,
  PlusCircle, BarChart2, ClipboardList, Timer, Dumbbell, Utensils, ArrowUpRight
} from "lucide-react";

// Quick actions shown in each nav link's popup
const NAV_POPUPS: Record<string, { label: string; href: string; icon: React.ReactNode; color: string }[]> = {
  "/dashboard": [
    { label: "View Summary", href: "/dashboard", icon: <BarChart2 size={12} />, color: "popup-link-indigo" },
    { label: "Import Excel", href: "/dashboard/import", icon: <ClipboardList size={12} />, color: "popup-link-slate" },
  ],
  "/learning": [
    { label: "Start Study Timer", href: "/learning", icon: <Timer size={12} />, color: "popup-link-indigo" },
    { label: "Log Topic", href: "/learning", icon: <PlusCircle size={12} />, color: "popup-link-purple" },
    { label: "View Roadmap", href: "/learning", icon: <ClipboardList size={12} />, color: "popup-link-slate" },
  ],
  "/expenses": [
    { label: "Log Expense", href: "/expenses", icon: <PlusCircle size={12} />, color: "popup-link-purple" },
    { label: "Log Income", href: "/expenses", icon: <ArrowUpRight size={12} />, color: "popup-link-emerald" },
    { label: "View Ledger", href: "/expenses", icon: <BarChart2 size={12} />, color: "popup-link-slate" },
  ],
  "/food": [
    { label: "Log Meal", href: "/food", icon: <Utensils size={12} />, color: "popup-link-teal" },
    { label: "Track Protein", href: "/food", icon: <Dumbbell size={12} />, color: "popup-link-indigo" },
    { label: "View Logs", href: "/food", icon: <ClipboardList size={12} />, color: "popup-link-slate" },
  ],
};

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleMouseEnter = (href: string) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredLink(href);
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => setHoveredLink(null), 150);
  };

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { href: "/learning", label: "Learning", icon: <BookOpen size={16} /> },
    { href: "/expenses", label: "Expenses", icon: <CreditCard size={16} /> },
    { href: "/food", label: "Food Log", icon: <Apple size={16} /> },
  ];

  return (
    <header className="relative z-20 w-full nav-header">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-1 sm:gap-4">

        {/* Brand Link to Dashboard */}
        <Link href="/dashboard" className="flex items-center gap-2 group cursor-pointer select-none">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-sm text-white group-hover:scale-105 transition-all shadow-md shadow-indigo-500/10">
            PL
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-200 group-hover:text-indigo-400 transition-all">Personal Labs</h1>
            <p className="text-[9px] uppercase tracking-wider text-slate-600">Rajat's Growth Core</p>
          </div>
        </Link>

        {/* Links with hover popups */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const popupItems = NAV_POPUPS[link.href] ?? [];
            const isOpen = hoveredLink === link.href;

            return (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => handleMouseEnter(link.href)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all nav-link ${
                    isActive ? "nav-link-active" : ""
                  }`}
                >
                  {link.icon}
                  <span className="hidden md:inline">{link.label}</span>
                </Link>

                {/* Hover Popup */}
                {isOpen && popupItems.length > 0 && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                    onMouseEnter={() => handleMouseEnter(link.href)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Arrow tip */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 popup-menu-arrow-top" />
                    <div className="relative popup-menu-card rounded-xl overflow-hidden py-1">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 px-3 pt-2 pb-1">{link.label}</p>
                      {popupItems.map((item, idx) => (
                        <Link
                          key={idx}
                          href={item.href}
                          className={`flex items-center gap-2 px-3 py-2 text-[11px] font-semibold hover:bg-white/5 transition-all ${item.color}`}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>


        {/* Profile, Theme Switcher & LogOut */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-400 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-xl">
            <User size={14} className="text-indigo-400" />
            <span>{session?.user?.name || "User"}</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 text-slate-400 hover:text-slate-200 cursor-pointer transition-all flex items-center justify-center"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/10 hover:border-red-500/25 text-red-400 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl cursor-pointer transition-all"
            title="Log Out"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
