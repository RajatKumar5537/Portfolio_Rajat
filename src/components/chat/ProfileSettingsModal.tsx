"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Sparkles,
  Check,
  Smile,
  Shield,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import AvatarPicker from "@/components/ui/AvatarPicker";
import { getFallbackAvatar } from "@/lib/avatars";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name: string;
    email: string;
    avatar?: string;
    statusMessage?: string;
  };
  onProfileUpdated: (updated: { name: string; avatar: string; statusMessage: string }) => void;
}

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}: ProfileSettingsModalProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  // Profile tab state
  const [name, setName] = useState(currentUser.name || "");
  const [avatar, setAvatar] = useState(currentUser.avatar || getFallbackAvatar(currentUser.name, "user"));
  const [statusMessage, setStatusMessage] = useState(currentUser.statusMessage || "Active now");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Security & Password tab state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Security PIN state
  const [pinCurrentPass, setPinCurrentPass] = useState("");
  const [securityPin, setSecurityPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPinCurrentPass, setShowPinCurrentPass] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [pinSuccess, setPinSuccess] = useState("");
  const [pinError, setPinError] = useState("");

  if (!isOpen) return null;

  // 1. Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatar,
          statusMessage: statusMessage.trim(),
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (_) {
        if (!res.ok) throw new Error("Server returned an error (" + res.status + ")");
      }
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfileSuccess(true);
      onProfileUpdated({
        name: name.trim(),
        avatar,
        statusMessage: statusMessage.trim(),
      });

      setTimeout(() => {
        setProfileSuccess(false);
      }, 1800);
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // 2. Reset / Change Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill out all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-password",
          currentPassword,
          newPassword,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (_) {
        if (!res.ok) throw new Error("Server returned an error (" + res.status + ")");
      }
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setPasswordSuccess("");
      }, 3000);
    } catch (err: any) {
      setPasswordError(err.message || "Something went wrong.");
    } finally {
      setSavingPassword(false);
    }
  };

  // 3. Set or Update Security PIN
  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCurrentPass || !securityPin || !confirmPin) {
      setPinError("Please fill out all PIN fields.");
      return;
    }

    if (!/^\d{4,6}$/.test(securityPin.trim())) {
      setPinError("Security PIN must be 4 to 6 digits (numbers only).");
      return;
    }

    if (securityPin !== confirmPin) {
      setPinError("Security PINs do not match.");
      return;
    }

    setSavingPin(true);
    setPinError("");
    setPinSuccess("");

    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-pin",
          currentPassword: pinCurrentPass,
          securityPin: securityPin.trim(),
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (_) {
        if (!res.ok) throw new Error("Server returned an error (" + res.status + ")");
      }
      if (!res.ok) {
        throw new Error(data.error || "Failed to update Security PIN");
      }

      setPinSuccess("Recovery Security PIN saved successfully!");
      setPinCurrentPass("");
      setSecurityPin("");
      setConfirmPin("");

      setTimeout(() => {
        setPinSuccess("");
      }, 3000);
    } catch (err: any) {
      setPinError(err.message || "Something went wrong.");
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          paddingTop: "max(16px, calc(env(safe-area-inset-top, 0px) + 12px))",
          paddingBottom: "max(16px, calc(env(safe-area-inset-bottom, 0px) + 12px))",
        }}
        className="safe-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-lg overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-lg bg-[#111116] border border-white/15 rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_30px_rgba(0,122,255,0.15)] backdrop-blur-3xl flex flex-col my-auto max-h-[85dvh]"
        >
          {/* Header */}
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10 bg-[#111116] flex-shrink-0 z-20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-600/20 text-[#007AFF] flex items-center justify-center border border-blue-500/30 shadow-inner">
                {activeTab === "profile" ? <Sparkles className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Chat Settings & Security</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Manage identity, password, and recovery</p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/15 cursor-pointer"
            >
              <X className="w-4 h-4 text-white stroke-[2.5]" />
            </button>
          </div>

          {/* Symmetrical Tabs */}
          <div className="px-5 pt-3 pb-2.5 border-b border-white/10 bg-[#111116] flex items-center gap-2 flex-shrink-0 z-20 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "profile"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile & Avatar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "security"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Security & Password</span>
            </button>
          </div>

          {/* TAB 1: PROFILE TAB */}
          {activeTab === "profile" && (
            <>
              <form id="profile-form" onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto overscroll-contain flex flex-col min-h-0">
                {/* Avatar Hero section */}
                <div className="bg-white/[0.015] py-5 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden border-b border-white/10 flex-shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
                  </div>

                  <div className="relative z-10">
                    <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#007AFF]/60 shadow-2xl bg-neutral-800">
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#30D158] ring-2 ring-neutral-900 shadow-md" />
                  </div>

                  <div className="space-y-1 z-10">
                    <h3 className="text-base font-bold text-white">{name || "Your Profile"}</h3>
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-[11px] text-blue-300 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
                      <span>{statusMessage || "Active now"}</span>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 z-10 flex items-center gap-1.5 text-[11px] text-neutral-300">
                    <Shield className="w-3 h-3 text-[#007AFF]" />
                    <span className="font-mono truncate max-w-[240px]">{currentUser.email}</span>
                  </div>
                </div>

                {/* Form fields */}
                <div className="p-5 space-y-4 flex-1">
                  {profileError && (
                    <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-xs text-red-300 text-center flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  {/* Display Name */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral-300 block mb-1.5 tracking-wide uppercase font-mono">
                      Display Name
                    </label>
                    <div className="flex items-center gap-3 px-3.5 h-12 bg-neutral-850 border border-white/15 focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-blue-500/25 rounded-xl transition-all">
                      <User className="w-4 h-4 text-[#007AFF] flex-shrink-0" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
                        placeholder="Your Full Name"
                      />
                    </div>
                  </div>

                  {/* Status / Bio */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral-300 block mb-1.5 tracking-wide uppercase font-mono">
                      Status / Bio
                    </label>
                    <div className="flex items-center gap-3 px-3.5 h-12 bg-neutral-850 border border-white/15 focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-blue-500/25 rounded-xl transition-all">
                      <Smile className="w-4 h-4 text-[#30D158] flex-shrink-0" />
                      <input
                        type="text"
                        value={statusMessage}
                        onChange={(e) => setStatusMessage(e.target.value)}
                        className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
                        placeholder="e.g. Active now, Busy..."
                      />
                    </div>
                  </div>

                  {/* Avatar Picker */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral-300 block mb-2 tracking-wide uppercase font-mono">
                      Choose Avatar Style
                    </label>
                    <AvatarPicker
                      selectedUrl={avatar}
                      onSelect={(newUrl: string) => setAvatar(newUrl)}
                      userName={name}
                    />
                  </div>
                </div>
              </form>

              {/* Bottom Action Bar */}
              <div className="px-5 py-3 border-t border-white/10 bg-[#0c0c10] backdrop-blur-xl flex items-center justify-between flex-shrink-0 rounded-b-3xl">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#007AFF]" />
                  <span>Public details encrypted</span>
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    form="profile-form"
                    disabled={savingProfile}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                      profileSuccess
                        ? "bg-[#30D158] shadow-[#30D158]/25"
                        : "bg-[#007AFF] hover:bg-[#0071EB] shadow-[#007AFF]/30 disabled:opacity-50"
                    }`}
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : profileSuccess ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save Profile</span>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: SECURITY & PASSWORD TAB */}
          {activeTab === "security" && (
            <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
              <div className="p-4 sm:p-5 space-y-6">
                {/* SECTION A: CHANGE PASSWORD */}
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#16161c]">
                  {/* Section Header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border-b border-white/10">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
                      <KeyRound className="w-4 h-4 text-[#007AFF]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">Change Password</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Update your account sign-in password</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="p-4 sm:p-5 space-y-4">
                    {passwordError && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-300">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}

                    {/* Current Password */}
                    <div>
                      <label className="text-[11px] font-bold text-neutral-300 block mb-1.5 uppercase font-mono tracking-wider">
                        Current Password
                      </label>
                      <div className="flex items-center gap-3 px-3.5 h-12 bg-neutral-900/90 border border-white/15 focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-blue-500/25 rounded-xl transition-all">
                        <Lock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                        <input
                          type={showCurrentPass ? "text" : "password"}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        >
                          {showCurrentPass ? <EyeOff className="w-4 h-4 text-blue-400" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="text-[11px] font-bold text-neutral-300 block mb-1.5 uppercase font-mono tracking-wider">
                        New Password
                      </label>
                      <div className="flex items-center gap-3 px-3.5 h-12 bg-neutral-900/90 border border-white/15 focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-blue-500/25 rounded-xl transition-all">
                        <KeyRound className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                        <input
                          type={showNewPass ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4 text-blue-400" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="text-[11px] font-bold text-neutral-300 block mb-1.5 uppercase font-mono tracking-wider">
                        Confirm New Password
                      </label>
                      <div className="flex items-center gap-3 px-3.5 h-12 bg-neutral-900/90 border border-white/15 focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-blue-500/25 rounded-xl transition-all">
                        <Check className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                        <input
                          type={showConfirmPass ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        >
                          {showConfirmPass ? <EyeOff className="w-4 h-4 text-blue-400" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="w-full h-12 rounded-xl bg-[#007AFF] hover:bg-[#0071EB] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] mt-2"
                    >
                      {savingPassword ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>Updating Password...</span></>
                      ) : (
                        <><KeyRound className="w-4 h-4" /><span>Update Password</span></>
                      )}
                    </button>
                  </form>
                </div>

                {/* SECTION B: SECURITY PIN */}
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#16161c]">
                  {/* Section Header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border-b border-white/10">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">Recovery PIN</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">4-6 digit PIN for password recovery</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdatePin} className="p-4 sm:p-5 space-y-4">
                    {pinError && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-300">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>{pinError}</span>
                      </div>
                    )}
                    {pinSuccess && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{pinSuccess}</span>
                      </div>
                    )}

                    {/* Password to authorize */}
                    <div>
                      <label className="text-[11px] font-bold text-neutral-300 block mb-1.5 uppercase font-mono tracking-wider">
                        Current Account Password
                      </label>
                      <div className="flex items-center gap-3 px-3.5 h-12 bg-neutral-900/90 border border-white/15 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25 rounded-xl transition-all">
                        <Lock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                        <input
                          type={showPinCurrentPass ? "text" : "password"}
                          required
                          value={pinCurrentPass}
                          onChange={(e) => setPinCurrentPass(e.target.value)}
                          placeholder="Your current password"
                          className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPinCurrentPass(!showPinCurrentPass)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        >
                          {showPinCurrentPass ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* PIN input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-neutral-300 block uppercase font-mono tracking-wider">
                          New Recovery PIN
                        </label>
                        <span className="text-[10px] text-neutral-400 font-mono">4-6 digits</span>
                      </div>
                      <div className="flex items-center gap-3 px-3.5 h-12 bg-neutral-900/90 border border-white/15 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25 rounded-xl transition-all">
                        <ShieldCheck className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                        <input
                          type={showPin ? "text" : "password"}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          required
                          value={securityPin}
                          onChange={(e) => setSecurityPin(e.target.value)}
                          placeholder="Enter 4-6 digit PIN"
                          className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-medium font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        >
                          {showPin ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm PIN */}
                    <div>
                      <label className="text-[11px] font-bold text-neutral-300 block mb-1.5 uppercase font-mono tracking-wider">
                        Confirm Recovery PIN
                      </label>
                      <div className="flex items-center gap-3 px-3.5 h-12 bg-neutral-900/90 border border-white/15 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25 rounded-xl transition-all">
                        <Check className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                        <input
                          type={showPin ? "text" : "password"}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          required
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value)}
                          placeholder="Re-enter 4-6 digit PIN"
                          className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-medium font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingPin}
                      className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] mt-2"
                    >
                      {savingPin ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving PIN...</span></>
                      ) : (
                        <><ShieldCheck className="w-4 h-4" /><span>Save Recovery PIN</span></>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
