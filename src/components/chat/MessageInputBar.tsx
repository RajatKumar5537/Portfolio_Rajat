"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Mic, ArrowUp, X, Sparkles, Smile, Flame, Heart, PartyPopper, Zap, EyeOff, Sun, Moon } from "lucide-react";
import ActionDrawer from "./ActionDrawer";
import VoiceMemoRecorder from "./VoiceMemoRecorder";
import { soundEngine } from "@/lib/audio";

interface MessageInputBarProps {
  onSendMessage: (data: {
    text: string;
    effect?: string | null;
    mediaType?: "image" | "video" | "audio" | "file" | null;
    mediaData?: string | null;
    mediaName?: string | null;
    mediaSize?: string | null;
    audioDuration?: number;
    replyTo?: any;
  }) => void;
  replyTo?: any;
  onClearReply?: () => void;
  onTyping?: (isTyping: boolean) => void;
  currentDisappearingHours?: number;
  onSetDisappearingTimer?: (hours: number) => void;
  partnerName?: string;
}

const SCREEN_EFFECTS = [
  { id: "fireworks", label: "Fireworks 🎆", icon: Flame, color: "from-amber-500 to-red-500", desc: "Exploding colorful fireworks" },
  { id: "good_morning", label: "Sunrise ☀️", icon: Sun, color: "from-amber-400 to-yellow-500", desc: "Golden morning sunrise" },
  { id: "good_night", label: "Good Night 🌙", icon: Moon, color: "from-indigo-500 to-purple-600", desc: "Starry night with crescent moon" },
  { id: "balloons", label: "Balloons 🎈", icon: Sparkles, color: "from-blue-500 to-cyan-400", desc: "Floating helium balloons" },
  { id: "confetti", label: "Confetti 🎉", icon: PartyPopper, color: "from-purple-500 to-pink-500", desc: "Celebration cascade" },
  { id: "love", label: "Hearts ❤️", icon: Heart, color: "from-rose-500 to-pink-600", desc: "Floating 3D hearts" },
  { id: "lasers", label: "Lasers ⚡", icon: Zap, color: "from-cyan-400 to-blue-600", desc: "Laser beam sweep" },
  { id: "shooting_star", label: "Shooting Star 🌠", icon: Sparkles, color: "from-yellow-400 to-amber-300", desc: "Sparkle trail comet" },
  { id: "invisible_ink", label: "Invisible Ink 🪄", icon: EyeOff, color: "from-amber-400 to-orange-500", desc: "Hidden scratch message" },
  { id: "slam", label: "Slam 💥", icon: Zap, color: "from-orange-500 to-red-600", desc: "Impact bubble drop" },
  { id: "loud", label: "Loud 📢", icon: Flame, color: "from-rose-500 to-purple-600", desc: "Inflates and shakes" },
  { id: "gentle", label: "Gentle 🪶", icon: Sparkles, color: "from-blue-400 to-indigo-400", desc: "Soft subtle entrance" },
];

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    name: "Smileys & People",
    icon: "😊",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "🥹", "☺️", "😊", 
      "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", 
      "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", 
      "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", 
      "😢", "😭", "😮‍💨", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", 
      "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🤫", "🤥", "😶", "😐"
    ]
  },
  {
    id: "gestures",
    name: "Hands & Gestures",
    icon: "👍",
    emojis: [
      "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", 
      "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "👃", "🤏", "👈", 
      "👉", "👆", "👇", "☝️", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "🖐️", "✋", 
      "👌", "🤌", "👋", "🫡", "🫶", "🫂"
    ]
  },
  {
    id: "hearts",
    name: "Hearts & Love",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", 
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💌", "💋", "💐", 
      "🌹", "🥀", "🌺", "🌸", "🌷", "🌻"
    ]
  },
  {
    id: "reactions",
    name: "Sparkles & Reactions",
    icon: "🔥",
    emojis: [
      "🔥", "💯", "✨", "🌟", "⭐", "💥", "⚡", "💫", "🌈", "☀️", "🌙", "🪐", 
      "🚀", "🛸", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🎯", "🎲", "👑", "💎", 
      "💡", "🔑", "🔒", "🔓", "🔔", "📣", "🚨", "⚠️", "⛔", "✅", "❌", "❓"
    ]
  },
  {
    id: "activities",
    name: "Food & Activities",
    icon: "☕",
    emojis: [
      "☕", "🍵", "🧋", "🍕", "🍔", "🍟", "🌭", "🍿", "🍩", "🍪", "🎂", "🍫",
      "🍬", "🍭", "⚽", "🏀", "🏈", "⚾", "🎾", "🎮", "🕹️", "🎧", "🎵", "🎸"
    ]
  }
];

export default function MessageInputBar({
  onSendMessage,
  replyTo,
  onClearReply,
  onTyping,
  currentDisappearingHours = 0,
  onSetDisappearingTimer = () => {},
  partnerName = "contact",
}: MessageInputBarProps) {
  const [text, setText] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showEffectsPicker, setShowEffectsPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState("smileys");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const effectsRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<any>(null);

  // Close effects picker on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (effectsRef.current && !effectsRef.current.contains(e.target as Node)) {
        setShowEffectsPicker(false);
      }
    };
    if (showEffectsPicker) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showEffectsPicker]);

  // Auto-detect Apple iMessage keyword screen effects
  const detectAutoEffect = (msgText: string): string | null => {
    const lower = msgText.toLowerCase().trim();
    if (
      lower.includes("happy birthday") ||
      lower.includes("birthday") ||
      lower === "hbd" ||
      lower.includes("bday")
    ) {
      return "balloons";
    }
    if (
      lower.includes("congratulat") ||
      lower.includes("congrats") ||
      lower.includes("graduation") ||
      lower.includes("kudos")
    ) {
      return "confetti";
    }
    if (
      lower.includes("happy new year") ||
      lower.includes("new year") ||
      lower.includes("fireworks")
    ) {
      return "fireworks";
    }
    if (
      lower.includes("i love you") ||
      lower.includes("love you") ||
      lower.includes("i love u") ||
      lower.includes("love u") ||
      lower === "❤️" ||
      lower === "💕"
    ) {
      return "love";
    }
    if (
      lower.includes("good morning") ||
      lower.includes("goodmorning") ||
      lower.includes("rise and shine") ||
      lower.includes("shubh prabhat") ||
      lower.includes("subh prabhat") ||
      lower === "gm" ||
      lower === "morning" ||
      lower === "morning!" ||
      lower.startsWith("gm ") ||
      lower.endsWith(" gm")
    ) {
      return "good_morning";
    }
    if (
      lower.includes("good night") ||
      lower.includes("goodnight") ||
      lower.includes("sweet dreams") ||
      lower.includes("nighty night") ||
      lower.includes("shubh ratri") ||
      lower.includes("subh ratri") ||
      lower === "gn" ||
      lower === "night" ||
      lower === "night!" ||
      lower.startsWith("gn ") ||
      lower.endsWith(" gn")
    ) {
      return "good_night";
    }
    if (lower.includes("pew pew") || lower.includes("lasers") || lower === "pew") {
      return "lasers";
    }
    if (lower.includes("shooting star") || lower.includes("make a wish")) {
      return "shooting_star";
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    // Typing debounce
    if (onTyping) {
      onTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleSelectEffectItem = (effId: string) => {
    soundEngine.playTapback();
    if (selectedEffect === effId) {
      setSelectedEffect(null);
    } else {
      setSelectedEffect(effId);
    }
    setShowEffectsPicker(false);
    inputRef.current?.focus();
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    soundEngine.playSent();

    // Auto-detect effect if not explicitly picked
    const resolvedEffect = selectedEffect || detectAutoEffect(text);

    onSendMessage({
      text: text.trim(),
      effect: resolvedEffect,
      replyTo: replyTo || null,
    });

    setText("");
    setSelectedEffect(null);
    setShowEmojiPicker(false);
    setShowEffectsPicker(false);
    if (onClearReply) onClearReply();
    if (onTyping) onTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Media file handlers
  const handleSelectPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const isVideo = file.type.startsWith("video");
      soundEngine.playSent();
      const resolvedEffect = selectedEffect || (text ? detectAutoEffect(text) : null);
      onSendMessage({
        text: text.trim(),
        effect: resolvedEffect,
        mediaType: isVideo ? "video" : "image",
        mediaData: reader.result as string,
        mediaName: file.name,
        mediaSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        replyTo: replyTo || null,
      });
      setText("");
      setSelectedEffect(null);
      if (onClearReply) onClearReply();
    };
    reader.readAsDataURL(file);
  };

  const handleSelectFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      soundEngine.playSent();
      const resolvedEffect = selectedEffect || (text ? detectAutoEffect(text) : null);
      onSendMessage({
        text: text.trim(),
        effect: resolvedEffect,
        mediaType: "file",
        mediaData: reader.result as string,
        mediaName: file.name,
        mediaSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        replyTo: replyTo || null,
      });
      setText("");
      setSelectedEffect(null);
      if (onClearReply) onClearReply();
    };
    reader.readAsDataURL(file);
  };

  const handleSendVoiceMemo = (base64Audio: string, durationSec: number) => {
    soundEngine.playSent();
    onSendMessage({
      text: "",
      mediaType: "audio",
      mediaData: base64Audio,
      mediaName: `Voice Memo (${durationSec}s)`,
      audioDuration: durationSec,
      replyTo: replyTo || null,
    });
    setIsRecordingVoice(false);
    if (onClearReply) onClearReply();
  };

  return (
    <footer
      style={{
        paddingBottom: "max(10px, calc(env(safe-area-inset-bottom, 0px) + 6px))",
        paddingLeft: "max(10px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(10px, env(safe-area-inset-right, 0px))",
      }}
      className="safe-bottom-input relative z-30 border-t border-white/10 bg-[#0A0A0E] px-2.5 sm:px-6 pt-2.5 sm:pt-3 select-none flex-shrink-0 transition-colors w-full max-w-full overflow-visible"
    >
      {/* 1. QUOTED REPLY BANNER */}
      {replyTo && (
        <div className="flex items-center justify-between p-2.5 mb-2.5 bg-[#1C1C1E] border border-blue-500/30 rounded-2xl text-xs backdrop-blur-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-1.5 h-6 bg-[#007AFF] rounded-full" />
            <div className="truncate">
              <span className="font-bold text-blue-400">{replyTo.senderName}: </span>
              <span className="text-slate-300">{replyTo.text || "[Media Attachment]"}</span>
            </div>
          </div>
          <button
            onClick={onClearReply}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. ACTIVE SCREEN EFFECT BANNER */}
      {selectedEffect && (
        <div className="flex items-center justify-between px-3.5 py-1.5 mb-2 bg-gradient-to-r from-blue-600/30 via-purple-600/20 to-blue-600/30 border border-blue-400/40 rounded-xl text-xs text-blue-200 shadow-md">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>Sending with <strong className="text-white capitalize">{selectedEffect.replace("_", " ")}</strong> effect</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedEffect(null)}
            className="p-0.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            title="Remove effect"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. SCREEN EFFECTS QUICK POPOVER */}
      {showEffectsPicker && (
        <>
          <div
            onClick={() => setShowEffectsPicker(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs cursor-pointer transition-opacity"
          />
          <div
            ref={effectsRef}
            className="absolute bottom-14 sm:bottom-16 left-2 sm:left-6 z-50 w-[calc(100vw-24px)] max-w-sm bg-[#14141E]/98 backdrop-blur-3xl border border-white/20 rounded-3xl p-3.5 shadow-2xl shadow-black/95 animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Screen & Bubble Effects
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowEffectsPicker(false)}
              className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {SCREEN_EFFECTS.map((eff) => {
              const isSelected = selectedEffect === eff.id;
              const Icon = eff.icon;
              return (
                <button
                  key={eff.id}
                  type="button"
                  onClick={() => handleSelectEffectItem(eff.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#007AFF]/30 border border-[#007AFF] text-white shadow-md shadow-[#007AFF]/25"
                      : "hover:bg-white/10 text-neutral-200"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${eff.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate flex items-center justify-between">
                      <span>{eff.label}</span>
                      {isSelected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#007AFF] text-white font-bold">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">{eff.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        </>
      )}

      {/* 4. EMOJI PICKER DROPDOWN */}
      {showEmojiPicker && (
        <div className="p-3 bg-[#10101C]/98 backdrop-blur-2xl border border-white/15 rounded-2xl mb-2.5 max-h-56 overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
            {EMOJI_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveEmojiTab(cat.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  activeEmojiTab === cat.id ? "bg-[#007AFF] text-white font-bold shadow-md shadow-[#007AFF]/25" : "text-slate-400 hover:text-white"
                }`}
                title={cat.name}
              >
                {cat.icon}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="ml-auto p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-2 text-lg sm:text-xl">
            {EMOJI_CATEGORIES.find((c) => c.id === activeEmojiTab)?.emojis.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="hover:scale-125 transition-transform p-1 cursor-pointer flex items-center justify-center rounded-lg hover:bg-white/10"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. VOICE RECORDING MODE */}
      {isRecordingVoice ? (
        <VoiceMemoRecorder
          onSendVoiceMemo={handleSendVoiceMemo}
          onCancel={() => setIsRecordingVoice(false)}
        />
      ) : (
        /* 6. MAIN INPUT ROW - Apple iMessage Style */
        <form onSubmit={handleSend} className="w-full max-w-full min-w-0 flex items-center gap-1 sm:gap-2">
          {/* Action Drawer Expand (+) Button */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(!isDrawerOpen);
                setShowEmojiPicker(false);
                setShowEffectsPicker(false);
              }}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation ${
                isDrawerOpen
                  ? "text-[#007AFF] bg-blue-500/20 border border-[#007AFF]/40"
                  : "text-zinc-400 hover:text-white bg-white/[0.07] hover:bg-white/[0.12] border border-white/10"
              }`}
              title="Add Media, Photos, Files & Voice Memo"
            >
              <Plus className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
            </button>

            <ActionDrawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              onSelectPhoto={handleSelectPhoto}
              onStartVoiceMemo={() => setIsRecordingVoice(true)}
              onSelectEffect={(eff) => setSelectedEffect(eff)}
              onSelectFile={handleSelectFile}
              onSetDisappearingTimer={onSetDisappearingTimer}
              currentDisappearingHours={currentDisappearingHours}
              selectedEffect={selectedEffect}
            />
          </div>

          {/* Dedicated 1-Click Screen Effects ✨ Button */}
          <button
            type="button"
            onClick={() => {
              setShowEffectsPicker(!showEffectsPicker);
              setIsDrawerOpen(false);
              setShowEmojiPicker(false);
            }}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation flex-shrink-0 ${
              showEffectsPicker || selectedEffect
                ? "text-amber-300 bg-amber-500/25 border border-amber-400/50 shadow-md shadow-amber-500/20 scale-105"
                : "text-zinc-400 hover:text-amber-300 bg-white/[0.07] hover:bg-white/[0.12] border border-white/10"
            }`}
            title="Screen & Bubble Effects (Fireworks, Balloons, Lasers, Hearts...)"
          >
            <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
          </button>

          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setIsDrawerOpen(false);
              setShowEffectsPicker(false);
            }}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation flex-shrink-0 ${
              showEmojiPicker
                ? "text-[#007AFF] bg-blue-500/20 border border-blue-500/30"
                : "text-zinc-400 hover:text-white bg-white/[0.07] hover:bg-white/[0.12] border border-white/10"
            }`}
            title="Insert Emoji"
          >
            <Smile className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2]" />
          </button>

          {/* MAIN APPLE iMESSAGE CAPSULE PILL */}
          <div className="flex-1 min-w-0 flex items-center bg-[#1C1C1E] border border-white/15 focus-within:border-[#007AFF] rounded-full pl-3.5 sm:pl-4 pr-1 sm:pr-1.5 py-1 transition-all shadow-inner min-h-[38px] sm:min-h-[42px]">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`iMessage (${partnerName})...`}
              className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-[16px] sm:text-sm text-white placeholder:text-zinc-500 py-1 sm:py-1.5 px-0 min-w-0 font-normal"
            />

            {/* iOS Round ArrowUp Send Button Inside Capsule */}
            <button
              type="submit"
              disabled={!text.trim()}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#007AFF] hover:bg-[#0071EB] disabled:bg-zinc-700/60 disabled:text-zinc-500 disabled:opacity-40 text-white transition-all cursor-pointer shadow-md shadow-[#007AFF]/25 flex-shrink-0 active:scale-95 touch-manipulation flex items-center justify-center ml-1 sm:ml-1.5"
              title="Send iMessage"
            >
              <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      )}
    </footer>
  );
}
