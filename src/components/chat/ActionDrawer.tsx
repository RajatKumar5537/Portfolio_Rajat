"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Mic,
  Sparkles,
  FileText,
  Clock,
  Flame,
  Heart,
  PartyPopper,
  EyeOff,
  Zap,
  Sun,
  Moon,
  X,
} from "lucide-react";

interface ActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (file: File) => void;
  onStartVoiceMemo: () => void;
  onSelectEffect: (effect: string) => void;
  onSelectFile: (file: File) => void;
  onSetDisappearingTimer: (hours: number) => void;
  currentDisappearingHours?: number;
  selectedEffect?: string | null;
}

export default function ActionDrawer({
  isOpen,
  onClose,
  onSelectPhoto,
  onStartVoiceMemo,
  onSelectEffect,
  onSelectFile,
  onSetDisappearingTimer,
  currentDisappearingHours = 0,
  selectedEffect = null,
}: ActionDrawerProps) {
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = React.useState<"main" | "effects" | "timer">("main");

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const effectsList = [
    { id: "fireworks", label: "Fireworks 🎆", icon: Flame, color: "from-red-500 to-amber-500", desc: "Exploding colorful firework burst" },
    { id: "good_morning", label: "Sunrise ☀️", icon: Sun, color: "from-amber-400 to-yellow-500", desc: "Golden morning sunrise" },
    { id: "good_night", label: "Good Night 🌙", icon: Moon, color: "from-indigo-500 to-purple-600", desc: "Starry night with crescent moon" },
    { id: "balloons", label: "Balloons 🎈", icon: Sparkles, color: "from-blue-500 to-cyan-400", desc: "Floating festive helium balloons" },
    { id: "confetti", label: "Confetti 🎉", icon: PartyPopper, color: "from-purple-500 to-pink-500", desc: "Glittering celebration cascade" },
    { id: "love", label: "Hearts ❤️", icon: Heart, color: "from-rose-500 to-pink-600", desc: "Surging pulse of 3D floating hearts" },
    { id: "lasers", label: "Lasers ⚡", icon: Zap, color: "from-cyan-400 to-blue-600", desc: "Nightclub laser beam sweep" },
    { id: "shooting_star", label: "Shooting Star 🌠", icon: Sparkles, color: "from-amber-400 to-yellow-200", desc: "Comet zooming with sparkle trail" },
    { id: "invisible_ink", label: "Invisible Ink 🪄", icon: EyeOff, color: "from-yellow-400 to-amber-600", desc: "Cover message in secret scratch dust" },
    { id: "slam", label: "Slam 💥", icon: Zap, color: "from-orange-500 to-red-600", desc: "Bubble slams down with impact bounce" },
    { id: "loud", label: "Loud 📢", icon: Flame, color: "from-rose-500 to-purple-600", desc: "Bubble inflates big and shakes" },
    { id: "gentle", label: "Gentle 🪶", icon: Sparkles, color: "from-blue-400 to-indigo-400", desc: "Bubble glides in softly" },
  ];

  const timerOptions = [
    { hours: 0, label: "Off" },
    { hours: 1 / 60, label: "1 Minute" },
    { hours: 1, label: "1 Hour" },
    { hours: 24, label: "24 Hours" },
    { hours: 168, label: "7 Days" },
  ];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSelectPhoto(e.target.files[0]);
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSelectFile(e.target.files[0]);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fullscreen Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs cursor-pointer transition-opacity"
          />

          {/* Drawer Menu */}
          <motion.div
            ref={drawerRef}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="absolute bottom-16 left-0 sm:left-2 z-50 w-[calc(100vw-32px)] max-w-[300px] sm:max-w-xs sm:w-76 bg-[#0b0b1a]/98 backdrop-blur-2xl border border-white/15 rounded-3xl p-3 shadow-2xl shadow-black/95 overflow-hidden select-none"
          >
            {/* Hidden Inputs */}
            <input
              type="file"
              ref={photoInputRef}
              accept="image/*,video/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.zip,.txt,.json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* TAB: MAIN */}
            {activeTab === "main" && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-white/10">
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider font-mono">
                    Attachments & Apps
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/10 text-white transition-all text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">Photos & Videos</div>
                    <div className="text-[11px] text-neutral-400 truncate">Share camera roll & media</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onStartVoiceMemo();
                    onClose();
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/10 text-white transition-all text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">Audio Message</div>
                    <div className="text-[11px] text-neutral-400 truncate">Record voice memo</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("effects")}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/10 text-white transition-all text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white truncate">Send with Effect</span>
                      {selectedEffect && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">Fireworks, Balloons, Lasers...</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/10 text-white transition-all text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">Documents</div>
                    <div className="text-[11px] text-neutral-400 truncate">Send PDFs, ZIPs, or docs</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("timer")}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/10 text-white transition-all text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-neutral-700 to-neutral-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white truncate">Disappearing Messages</span>
                      {currentDisappearingHours > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                          {currentDisappearingHours}h
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">Self-destruct timer</div>
                  </div>
                </button>
              </div>
            )}

            {/* TAB: EFFECTS */}
            {activeTab === "effects" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 mb-1">
                  <span className="text-xs font-bold text-neutral-300">Screen Effects</span>
                  <button
                    onClick={() => setActiveTab("main")}
                    className="text-xs text-blue-400 hover:underline font-semibold"
                  >
                    Back
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto pr-1 flex flex-col gap-1">
                  {effectsList.map((eff) => {
                    const isCurrent = selectedEffect === eff.id;
                    const Icon = eff.icon;
                    return (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => {
                          onSelectEffect(isCurrent ? "" : eff.id);
                          onClose();
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-xl transition-all text-left cursor-pointer ${
                          isCurrent
                            ? "bg-blue-600/30 border border-blue-400/50 text-white"
                            : "hover:bg-white/10 text-neutral-200"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${eff.color} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{eff.label}</div>
                          <div className="text-[10px] text-neutral-400 truncate">{eff.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: TIMER */}
            {activeTab === "timer" && (
              <div className="flex flex-col gap-2 p-1">
                <div className="flex items-center justify-between border-b border-white/10 pb-1">
                  <span className="text-xs font-bold text-neutral-300">Disappearing Timer</span>
                  <button
                    onClick={() => setActiveTab("main")}
                    className="text-xs text-blue-400 hover:underline font-semibold"
                  >
                    Back
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {timerOptions.map((opt) => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => {
                        onSetDisappearingTimer(opt.hours);
                        onClose();
                      }}
                      className={`p-2 rounded-xl text-xs font-medium text-left transition-all cursor-pointer ${
                        currentDisappearingHours === opt.hours
                          ? "bg-blue-600 text-white font-bold"
                          : "hover:bg-white/10 text-neutral-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
