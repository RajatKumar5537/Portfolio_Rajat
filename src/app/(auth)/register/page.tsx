"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, ShieldCheck, ArrowRight, Loader2, Sun, Moon, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    inviteCode: "",
    securityPin: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.inviteCode || !formData.securityPin) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register user");
      }

      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-x-hidden bg-background">
      <div className="cyber-grid"></div>

      {/* Symmetrical Header Actions: Back on Left, Theme Toggle on Right */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 text-slate-400 hover:text-slate-200 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
          title="Back to Home"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Home</span>
        </Link>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 text-slate-400 hover:text-slate-200 cursor-pointer transition-all flex items-center justify-center"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      <div className="glass-card w-full max-w-md p-8 rounded-2xl border border-white/5 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-widest bg-gradient-to-r from-indigo-400 via-purple-400 to-teal-400 bg-clip-text text-transparent uppercase">
            Create Account
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
            Personal Dashboard Registry
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                <User size={16} />
              </span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full bg-white/[0.02] border border-white/5 focus:border-indigo-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                <Mail size={16} />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full bg-white/[0.02] border border-white/5 focus:border-indigo-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-white/[0.02] border border-white/5 focus:border-indigo-500/50 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
              System Invite Code
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                <ShieldCheck size={16} />
              </span>
              <input
                type="text"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={handleChange}
                placeholder="Enter invite authorization code"
                className="w-full bg-white/[0.02] border border-white/5 focus:border-indigo-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
              6-Digit Security PIN (For Password Reset)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                <Lock size={16} />
              </span>
              <input
                type={showPin ? "text" : "password"}
                name="securityPin"
                maxLength={6}
                value={formData.securityPin}
                onChange={handleChange}
                placeholder="e.g. 123456"
                className="w-full bg-white/[0.02] border border-white/5 focus:border-indigo-500/50 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-all ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
