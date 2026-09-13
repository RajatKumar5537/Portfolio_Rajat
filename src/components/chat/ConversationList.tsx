"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Users,
  Pin,
  MessageSquare,
  Sparkles,
  UserPlus,
  LogOut,
  Settings,
  Volume2,
  VolumeX,
  Check,
  UserX,
  Inbox,
  X,
  Bell,
  Lock,
  Clock,
  CheckCheck,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { soundEngine } from "@/lib/audio";
import { getFallbackAvatar } from "@/lib/avatars";

export interface ConversationItem {
  _id: string;
  type: "direct" | "group";
  name: string;
  icon?: string;
  isOnline?: boolean;
  lastSeen?: string | Date;
  isPinned?: boolean;
  unreadCount?: number;
  participants?: string[];
  participantDetails?: any[];
  disappearingHours?: number;
  lastMessage?: {
    text: string;
    senderName?: string;
    senderId?: string;
    isMe?: boolean;
    isRead?: boolean;
    readAt?: string | Date;
    createdAt?: string | Date;
    effect?: string;
    mediaType?: string;
  };
  updatedAt?: string | Date;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedId: string | null;
  pendingIncomingRequests?: any[];
  onAcceptRequest?: (connectionId: string) => void;
  onDeclineRequest?: (connectionId: string) => void;
  onSelectConversation: (id: string) => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenContacts: () => void;
  onOpenProfile?: () => void;
  onClose?: () => void;
  currentUser: {
    name: string;
    email: string;
    avatar?: string;
    statusMessage?: string;
  };
}

export default function ConversationList({
  conversations,
  selectedId,
  pendingIncomingRequests = [],
  onAcceptRequest,
  onDeclineRequest,
  onSelectConversation,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenContacts,
  onOpenProfile,
  onClose,
  currentUser,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "unread" | "requests">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.enabled = next;
  };

  const totalUnreadAcrossChats = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const totalPendingRequests = pendingIncomingRequests.length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilterTab === "unread") {
      return (c.unreadCount || 0) > 0;
    }
    return true;
  });

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const regularConversations = filteredConversations.filter((c) => !c.isPinned);

  const formatLastTime = (dateStr?: string | Date) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <>
      <aside className="w-full h-full flex flex-col bg-[#070712] border-r border-white/10 select-none z-20 flex-shrink-0 overflow-hidden transition-colors">
        {/* 1. TOP HEADER: CURRENT SENDER + AES LOCK + ACTIONS */}
        <div
          style={{
            paddingTop: "max(14px, calc(env(safe-area-inset-top, 0px) + 8px))",
          }}
          className="safe-top-header flex items-center justify-between px-3.5 sm:px-4 pb-3.5 border-b border-white/10 bg-[#0a0a1a] flex-shrink-0"
        >
          <div
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group select-none"
            title="Edit Profile"
          >
            <div className="relative flex-shrink-0">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/50 shadow-md group-hover:ring-blue-400 transition-all"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                  {getInitials(currentUser.name || "User")}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#30D158] border-2 border-[#070712] shadow-sm" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                iMessage
              </h3>
              <p className="text-[10px] text-blue-400 font-mono font-medium truncate flex items-center gap-1">
                <Lock size={10} /> AES-256 E2EE
              </p>
            </div>
          </div>

          {/* TOP ACTION BUTTONS */}
          <div className="flex items-center gap-1.5">
            {/* Contacts / Friends Button with Incoming Request Badge */}
            <div className="relative">
              <button
                type="button"
                onClick={onOpenContacts}
                className="p-2 rounded-xl bg-white/[0.07] border border-white/10 text-slate-200 hover:bg-white/15 transition-all cursor-pointer active:scale-95 touch-manipulation"
                title="Contacts & Friend Requests"
              >
                <UserPlus size={15} />
              </button>
              {totalPendingRequests > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-neutral-950 shadow-md animate-pulse">
                  {totalPendingRequests}
                </span>
              )}
            </div>

            {/* New Group */}
            <button
              type="button"
              onClick={onOpenNewGroup}
              className="p-2 rounded-xl bg-white/[0.07] border border-white/10 text-slate-200 hover:bg-white/15 transition-all cursor-pointer active:scale-95 touch-manipulation"
              title="New Group Chat"
            >
              <Users size={15} />
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="p-2 rounded-xl bg-white/[0.07] border border-white/10 text-slate-200 hover:bg-white/15 transition-all cursor-pointer active:scale-95 touch-manipulation"
              title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} className="text-red-400" />}
            </button>

            {/* Settings Profile */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="p-2 rounded-xl bg-white/[0.07] border border-white/10 text-slate-200 hover:bg-white/15 transition-all cursor-pointer active:scale-95 touch-manipulation"
              title="Settings & Profile"
            >
              <Settings size={15} />
            </button>

            {/* Exit Secret Chat Modal */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 hover:text-white transition-all cursor-pointer active:scale-95 touch-manipulation"
                title="Exit Secret Chat"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* 2. SEARCH BAR & SEGMENTED FILTER TABS */}
        <div className="p-3 sm:p-3.5 border-b border-white/10 bg-[#060612] flex-shrink-0">
          <div className="relative flex items-center w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or start a new chat"
              className="w-full h-10 bg-white/[0.07] hover:bg-white/[0.1] focus:bg-[#111122] border border-white/10 focus:border-blue-500 rounded-xl px-4 pr-9 text-xs text-white placeholder:text-slate-400 outline-none transition-all font-normal"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* 3. SEGMENTED FILTER TABS */}
          <div className="flex items-center gap-1.5 mt-2.5 p-1 bg-white/[0.04] border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveFilterTab("all")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center active:scale-95 ${
                activeFilterTab === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab("unread")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                activeFilterTab === "unread"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>Unread</span>
              {totalUnreadAcrossChats > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#30D158] text-black text-[9px] font-black flex items-center justify-center">
                  {totalUnreadAcrossChats}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab("requests")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                activeFilterTab === "requests"
                  ? "bg-amber-500 text-black font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>Requests</span>
              {totalPendingRequests > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center animate-pulse">
                  {totalPendingRequests}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 4. PINNED ROW (Visible on All tab if exists) */}
        {activeFilterTab === "all" && pinnedConversations.length > 0 && (
          <div className="px-3 pt-2 pb-1 bg-[#05050e]/60 border-b border-white/5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400/90 font-mono mb-1.5 flex items-center gap-1">
              <Pin size={11} className="text-blue-400" />
              <span>Pinned Conversations</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              {pinnedConversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => onSelectConversation(conv._id)}
                  className={`flex flex-col items-center gap-1 min-w-[56px] group transition-all cursor-pointer ${
                    selectedId === conv._id ? "opacity-100 scale-105" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="relative">
                    {conv.icon ? (
                      <img
                        src={conv.icon}
                        alt={conv.name}
                        className={`w-11 h-11 rounded-full object-cover border-2 transition-all ${
                          selectedId === conv._id ? "border-blue-500 shadow-md shadow-blue-500/30" : "border-white/10"
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-full bg-blue-500/20 border text-blue-300 font-bold text-xs flex items-center justify-center shadow-inner ${
                          selectedId === conv._id ? "border-blue-400" : "border-blue-400/30"
                        }`}
                      >
                        {getInitials(conv.name)}
                      </div>
                    )}
                    {conv.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#30D158] border-2 border-[#070712]" />
                    )}
                  </div>
                  <span className="text-[10px] text-white/90 truncate max-w-[60px] font-medium group-hover:text-blue-300">
                    {conv.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. INCOMING FRIEND REQUESTS BANNER (Visible on All tab if requests exist) */}
        {activeFilterTab === "all" && pendingIncomingRequests.length > 0 && (
          <div className="p-2.5 bg-amber-500/[0.08] border-b border-amber-500/20 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                <Bell size={12} className="animate-bounce" />
                <span>Friend Requests ({pendingIncomingRequests.length})</span>
              </div>
              <button
                onClick={onOpenContacts}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer font-bold"
              >
                View all
              </button>
            </div>

            {pendingIncomingRequests.slice(0, 2).map((req) => (
              <div
                key={req._id}
                className="bg-black/40 p-2.5 rounded-xl border border-amber-500/20 space-y-2"
              >
                <div className="flex items-center gap-2">
                  {req.avatar ? (
                    <img
                      src={req.avatar}
                      alt={req.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-400"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {getInitials(req.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">{req.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate font-mono">{req.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onAcceptRequest?.(req._id)}
                    className="flex-1 py-1.5 bg-[#30D158] hover:bg-[#28b84d] text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1 active:scale-98"
                  >
                    <Check size={12} /> Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeclineRequest?.(req._id)}
                    className="flex-1 py-1.5 bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-98"
                  >
                    <X size={12} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. CONVERSATION OR REQUESTS LIST FEED */}
        <div className="flex-1 overflow-y-auto min-h-0 py-2 space-y-1 scrollbar-thin">
          {/* TAB: REQUESTS ONLY VIEW */}
          {activeFilterTab === "requests" ? (
            pendingIncomingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                <Inbox size={28} className="text-slate-500" />
                <p className="text-xs text-slate-400">No pending friend requests</p>
                <button
                  onClick={onOpenContacts}
                  className="text-xs text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  + Find friends to connect
                </button>
              </div>
            ) : (
              <div className="p-2.5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono px-1">
                  <Bell size={12} /> Incoming Friend Requests ({pendingIncomingRequests.length})
                </div>
                {pendingIncomingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="bg-black/40 p-3 rounded-2xl border border-amber-500/20 space-y-2 shadow-sm mx-1"
                  >
                    <div className="flex items-center gap-2.5">
                      {req.avatar ? (
                        <img
                          src={req.avatar}
                          alt={req.name}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-amber-400 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {getInitials(req.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate">{req.name}</h4>
                        <p className="text-[10px] text-slate-400 truncate font-mono">{req.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onAcceptRequest?.(req._id)}
                        className="flex-1 py-1.5 bg-[#30D158] hover:bg-[#28b84d] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1 active:scale-98"
                      >
                        <Check size={12} /> Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeclineRequest?.(req._id)}
                        className="flex-1 py-1.5 bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-98"
                      >
                        <X size={12} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : /* TAB: ALL OR UNREAD CHATS */
          regularConversations.length === 0 && (activeFilterTab === "unread" || pinnedConversations.length === 0) ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
              <Users size={28} className="text-slate-500" />
              <p className="text-xs text-slate-400">
                {searchQuery
                  ? "No contacts matching search"
                  : activeFilterTab === "unread"
                  ? "No unread messages"
                  : "No conversations yet"}
              </p>
              <button
                type="button"
                onClick={onOpenContacts}
                className="text-xs text-blue-400 font-bold hover:underline cursor-pointer"
              >
                + Connect with a friend
              </button>
            </div>
          ) : (
            regularConversations.map((conv) => {
              const isSelected = selectedId === conv._id;
              return (
                <div
                  key={conv._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectConversation(conv._id)}
                  className={`group flex items-center gap-3 px-3.5 py-3 mx-2 rounded-2xl cursor-pointer transition-all relative select-none active:scale-[0.99] ${
                    isSelected
                      ? "bg-blue-600/20 border-l-4 border-l-[#007AFF] shadow-sm"
                      : "hover:bg-white/[0.05]"
                  }`}
                >
                  {/* Avatar + Online Indicator */}
                  <div className="relative flex-shrink-0">
                    {conv.icon ? (
                      <img
                        src={conv.icon}
                        alt={conv.name}
                        className={`w-11 h-11 rounded-full object-cover border transition-all ${
                          isSelected ? "border-blue-400 shadow-md shadow-blue-500/20" : "border-white/10"
                        }`}
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-bold text-sm flex items-center justify-center shadow-inner">
                        {getInitials(conv.name)}
                      </div>
                    )}
                    {conv.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#30D158] border-2 border-[#070712] shadow-sm animate-pulse" />
                    )}
                  </div>

                  {/* Contact Info & Last Message Snippet */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isSelected ? "text-blue-300" : "text-white"
                        }`}
                      >
                        {conv.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                        {formatLastTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1 min-w-0">
                        {conv.lastMessage?.text ? (
                          <>
                            <span className={`truncate ${ (conv.unreadCount || 0) > 0 ? "text-white font-semibold" : "text-slate-400"}`}>
                              {conv.lastMessage.text}
                            </span>
                            {conv.lastMessage.isMe && (
                              conv.lastMessage.isRead ? (
                                <span className="text-[#007AFF] flex items-center flex-shrink-0" title="Read">
                                  <CheckCheck className="w-3.5 h-3.5 inline" />
                                </span>
                              ) : (
                                <span className="text-slate-500 flex items-center flex-shrink-0" title="Sent">
                                  <Check className="w-3 h-3 inline" />
                                </span>
                              )
                            )}
                          </>
                        ) : (
                          <span className="italic text-slate-500">No messages yet</span>
                        )}
                      </p>

                      {/* Unread Count Badge */}
                      {(conv.unreadCount || 0) > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#007AFF] text-white text-[10px] font-black flex items-center justify-center shadow-sm flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 7. CURRENT USER FOOTER BAR (Mobile-friendly spacious layout) */}
        <div
          style={{
            paddingBottom: "max(12px, calc(env(safe-area-inset-bottom, 0px) + 8px))",
          }}
          className="safe-bottom-footer p-2.5 sm:p-3 border-t border-white/10 bg-[#0a0a1a]/95 backdrop-blur-xl flex items-center gap-2 flex-shrink-0"
        >
          {/* Profile Card */}
          <div
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group px-2.5 py-1.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] active:bg-white/[0.12] border border-white/10 transition-all shadow-sm active:scale-[0.98] h-[48px]"
            title="Edit Profile & Settings"
          >
            <div className="relative flex-shrink-0">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/40 group-hover:ring-blue-400 transition-all shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                  {getInitials(currentUser.name || "User")}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#30D158] ring-2 ring-[#0a0a1a]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1.5 group-hover:text-blue-300 transition-colors">
                <span className="truncate">{currentUser.name}</span>
                <Settings className="w-3 h-3 text-slate-400 group-hover:text-blue-400 group-hover:rotate-45 transition-all flex-shrink-0" />
              </div>
              <div className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                {currentUser.statusMessage || "Active now"}
              </div>
            </div>
          </div>

          {/* Spacious Touch-Friendly Logout Card Button */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/25 text-red-400 transition-all cursor-pointer shadow-sm active:scale-95 flex-shrink-0 h-[48px]"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 text-red-400 stroke-[2.2]" />
            <span className="text-xs font-semibold text-red-300 tracking-tight">Logout</span>
          </button>
        </div>
      </aside>

      {/* 8. LOGOUT CONFIRMATION POPUP MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="w-full max-w-xs bg-[#0c0c1e]/95 border border-red-500/20 rounded-3xl p-7 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(239,68,68,0.1)] backdrop-blur-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Subtle red glow background */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/15 to-transparent pointer-events-none rounded-3xl" />

            {/* Icon */}
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                <LogOut className="w-7 h-7 stroke-[1.8]" />
              </div>
            </div>

            {/* Text */}
            <div className="relative z-10 space-y-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Log Out of PrimeChat?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                You'll need to log back in to access your encrypted conversations.
              </p>
            </div>

            {/* Buttons */}
            <div className="relative z-10 flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
