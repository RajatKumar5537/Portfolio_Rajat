"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Phone,
  Video,
  Search,
  MoreVertical,
  Users,
  Shield,
  Clock,
  Sparkles,
  Trash2,
  Lock,
  X,
  ArrowLeft,
} from "lucide-react";

interface ChatHeaderProps {
  conversation: {
    _id: string;
    type: "direct" | "group";
    name: string;
    icon?: string;
    isOnline?: boolean;
    lastSeen?: string | Date;
    participants?: string[];
    participantDetails?: any[];
    disappearingHours?: number;
  };
  totalUnreadCount?: number;
  onBackToConversations: () => void;
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  onOpenSearch: () => void;
  onOpenInfo: () => void;
  onClearChat: () => void;
  onCloseChat?: () => void;
  isTyping?: boolean;
  typingUserName?: string;
}

export default function ChatHeader({
  conversation,
  totalUnreadCount = 0,
  onBackToConversations,
  onCloseChat,
  onStartAudioCall,
  onStartVideoCall,
  onOpenSearch,
  onOpenInfo,
  onClearChat,
  isTyping = false,
  typingUserName = "",
}: ChatHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDropdown) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent | PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [showDropdown]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatLastSeen = (dateInput?: string | Date) => {
    if (!dateInput) return "Offline";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "Offline";
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) {
      return `Last seen today at ${timeStr}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Last seen yesterday at ${timeStr}`;
    }

    const dateStr = d.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
    return `Last seen ${dateStr} at ${timeStr}`;
  };

  const getTimerLabel = (hours?: number) => {
    if (!hours || hours <= 0) return "Off";
    if (Math.abs(hours - 1 / 60) < 0.001) return "1 Min";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours === 1) return "1h";
    if (hours === 24) return "24h";
    if (hours === 168) return "7d";
    return `${hours}h`;
  };

  return (
    <header
      style={{
        paddingTop: "max(14px, calc(env(safe-area-inset-top, 0px) + 8px))",
      }}
      className="safe-top-chat flex items-center justify-between px-3 sm:px-5 pb-2.5 sm:pb-3 border-b border-white/10 bg-[#070712]/95 backdrop-blur-xl z-30 select-none transition-colors flex-shrink-0"
    >
      {/* LEFT: PARTNER AVATAR, NAME & STATUS */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={onBackToConversations}
          className="sm:hidden p-1.5 -ml-1 text-slate-300 hover:text-white cursor-pointer active:scale-95 touch-manipulation"
          title="Back to chats"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Contact Info Header Trigger (Click opens ContactProfileModal) */}
        <button
          type="button"
          onClick={onOpenInfo}
          className="flex items-center gap-2.5 cursor-pointer group py-1 px-1.5 -mx-1.5 rounded-xl hover:bg-white/[0.06] transition-all select-none active:scale-[0.98] text-left border-0 bg-transparent"
          title="View Contact Info & Settings"
        >
          {/* Avatar & Online Presence */}
          <div className="relative flex-shrink-0">
            {conversation.icon ? (
              <img
                src={conversation.icon}
                alt={conversation.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-1 ring-blue-400/40 shadow-inner"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold text-xs sm:text-sm shadow-inner flex items-center justify-center">
                {getInitials(conversation.name)}
              </div>
            )}
            {conversation.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#30D158] border-2 border-[#070712] shadow-sm animate-pulse" />
            )}
          </div>

          {/* Contact Name & Live Status with chevron cue */}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                {conversation.name}
              </h3>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </div>

            <p className="text-[9px] sm:text-[10px] tracking-wide truncate mt-0.5">
              {isTyping ? (
                <span className="text-blue-400 font-bold flex items-center gap-1 animate-pulse font-mono">
                  ✍️ {typingUserName || "typing"}...
                </span>
              ) : conversation.type === "group" ? (
                <span className="text-slate-400">
                  {conversation.participants?.length || 0} members
                </span>
              ) : conversation.isOnline ? (
                <span className="text-[#30D158] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] inline-block animate-ping flex-shrink-0" />
                  Online
                </span>
              ) : (
                <span className="text-slate-400 font-mono">
                  {conversation.lastSeen
                    ? formatLastSeen(conversation.lastSeen)
                    : conversation.disappearingHours && conversation.disappearingHours > 0
                    ? `Disappearing • ${getTimerLabel(conversation.disappearingHours)}`
                    : "Offline"}
                </span>
              )}
            </p>
          </div>
        </button>
      </div>

      {/* RIGHT: AUDIO CALL, VIDEO CALL & OPTIONS */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Audio Call Pill */}
        <button
          type="button"
          onClick={onStartAudioCall}
          className="h-8 px-2.5 sm:px-3 rounded-full bg-white/[0.08] hover:bg-[#30D158]/20 border border-white/10 hover:border-[#30D158]/40 text-slate-200 hover:text-[#30D158] transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer group"
          title="Start Encrypted Audio Call"
        >
          <Phone className="w-3.5 h-3.5 text-[#30D158] transition-transform group-hover:scale-110 flex-shrink-0" />
          <span className="hidden sm:inline text-xs font-semibold tracking-tight text-white/90 group-hover:text-white leading-none">Audio</span>
        </button>

        {/* Video Call Pill */}
        <button
          type="button"
          onClick={onStartVideoCall}
          className="h-8 px-2.5 sm:px-3 rounded-full bg-white/[0.08] hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/40 text-slate-200 hover:text-blue-400 transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer group"
          title="Start Encrypted Video Call"
        >
          <Video className="w-3.5 h-3.5 text-blue-400 transition-transform group-hover:scale-110 flex-shrink-0" />
          <span className="hidden sm:inline text-xs font-semibold tracking-tight text-white/90 group-hover:text-white leading-none">Video</span>
        </button>

        {/* Search Conversation */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer hidden md:flex items-center justify-center active:scale-95 shadow-sm"
          title="Search messages"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Dropdown Options */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-sm"
            title="Options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2.5 w-64 sm:w-72 bg-[#0d0d1c]/98 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 sm:p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(0,122,255,0.15)] z-50 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenInfo();
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm text-slate-200 hover:text-white hover:bg-white/[0.08] text-left transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/25 transition-colors">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-semibold block">Contact Information</span>
                    <span className="text-[10px] text-slate-400 block font-normal">View profile, media & privacy</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenSearch();
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm text-slate-200 hover:text-white hover:bg-white/[0.08] text-left transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/[0.07] text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.12] transition-colors">
                    <Search className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-semibold block">Search Messages</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Find text and documents</span>
                  </div>
                </button>

                <div className="my-1 border-t border-white/10" />

                <button
                  type="button"
                  onClick={() => {
                    onClearChat();
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm text-red-400 hover:bg-red-500/15 text-left transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/25 transition-colors">
                    <Trash2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-semibold block">Clear Conversation History</span>
                    <span className="text-[10px] text-red-400/70 block font-normal">Remove messages for your view</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Close Chat Cross Button (in top right area) */}
        {onCloseChat && (
          <button
            type="button"
            onClick={onCloseChat}
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 border border-red-500/35 text-red-300 hover:text-white transition-all cursor-pointer active:scale-90 flex items-center justify-center shadow-sm touch-manipulation flex-shrink-0"
            title="Close chat"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>
    </header>
  );
}
