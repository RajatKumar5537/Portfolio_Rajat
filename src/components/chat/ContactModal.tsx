"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  UserPlus,
  Check,
  UserX,
  MessageSquare,
  Users,
  Mail,
  Inbox,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFallbackAvatar } from "@/lib/avatars";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDirectChat: (userId: string, name: string) => void;
}

export default function ContactModal({
  isOpen,
  onClose,
  onStartDirectChat,
}: ContactModalProps) {
  const [activeTab, setActiveTab] = useState<"contacts" | "pending" | "search">("contacts");
  const [contacts, setContacts] = useState<any[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<any[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentSuccessId, setSentSuccessId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/chat/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
        setPendingIncoming(data.pendingIncoming || []);
        setPendingOutgoing(data.pendingOutgoing || []);
      }
    } catch (err) {
      console.error("Error loading contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/chat/contacts?search=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (_) {}
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      const res = await fetch("/api/chat/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setSentSuccessId(userId);
        setTimeout(() => setSentSuccessId(null), 2000);
        loadContacts();
      }
    } catch (_) {}
  };

  const updateRequestStatus = async (connectionId: string, status: "accepted" | "declined") => {
    try {
      const res = await fetch("/api/chat/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, status }),
      });
      if (res.ok) {
        loadContacts();
      }
    } catch (_) {}
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          paddingTop: "max(16px, calc(env(safe-area-inset-top, 0px) + 12px))",
          paddingBottom: "max(16px, calc(env(safe-area-inset-bottom, 0px) + 12px))",
        }}
        className="safe-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-2xl min-h-[500px] max-h-[88dvh] bg-[#0E0E12]/98 border border-white/15 rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_30px_rgba(0,122,255,0.15)] backdrop-blur-3xl flex flex-col my-auto"
        >
          {/* Header Bar */}
          <div className="px-6 sm:px-8 py-5 flex items-center justify-between border-b border-white/10 bg-white/[0.02] flex-shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-[#007AFF] flex items-center justify-center border border-blue-500/30 shadow-inner">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Contacts & Friends</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Manage connections & direct chats</p>
              </div>
            </div>

            {/* Prominent High-Contrast Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/15 shadow-md flex-shrink-0 cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5 text-white stroke-[2.5]" />
            </button>
          </div>

          {/* Segmented Tab Control */}
          <div className="px-6 sm:px-8 pt-4 pb-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 p-1 bg-black/60 border border-white/10 rounded-2xl">
              <button
                onClick={() => setActiveTab("contacts")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === "contacts"
                    ? "bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/25"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Friends ({contacts.length})
              </button>

              <button
                onClick={() => setActiveTab("pending")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all relative cursor-pointer ${
                  activeTab === "pending"
                    ? "bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/25"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>Requests</span>
                {pendingIncoming.length > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                    {pendingIncoming.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === "search"
                    ? "bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/25"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Add New
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-8 pt-3 flex-1 flex flex-col overflow-y-auto">
            {/* TAB 1: FRIENDS LIST */}
            {activeTab === "contacts" && (
              <div className="flex-1 flex flex-col">
                {contacts.length === 0 ? (
                  /* Advanced Cyber/Glass Empty State */
                  <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-10 px-4">
                    <div className="relative mb-4 group">
                      <div className="absolute -inset-2 bg-blue-500/20 rounded-3xl blur-xl group-hover:bg-blue-500/30 transition-all" />
                      <div className="relative w-16 h-16 rounded-3xl bg-neutral-800/90 border border-white/15 flex items-center justify-center text-[#007AFF] shadow-2xl">
                        <Users className="w-8 h-8 stroke-[1.75]" />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white tracking-wide">No Friends Connected Yet</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-xs mb-5 leading-relaxed">
                      Search registered users to send an encrypted friend request and start direct messaging.
                    </p>
                    <button
                      onClick={() => setActiveTab("search")}
                      className="relative px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 via-[#007AFF] to-blue-600 hover:opacity-90 border border-white/20 shadow-xl shadow-blue-500/25 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 group/btn"
                    >
                      <UserPlus className="w-4 h-4 text-white group-hover/btn:rotate-12 transition-transform duration-200" />
                      <span>Find Friends</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse ml-0.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((c) => (
                      <div
                        key={c.userId}
                        className="flex items-center justify-between p-4 px-4 sm:px-5 rounded-2xl bg-white/[0.035] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={c.avatar || getFallbackAvatar(c.name, "user")}
                            alt={c.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{c.name}</div>
                            <div className="text-xs text-neutral-400 truncate flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                              <span className="font-mono">{c.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Moved Chat Button nicely to the left with mr-2 sm:mr-3 margin */}
                        <button
                          onClick={() => {
                            onStartDirectChat(c.userId, c.name);
                            onClose();
                          }}
                          className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0071EB] text-white text-xs font-bold shadow-lg shadow-[#007AFF]/25 transition-all flex-shrink-0 ml-3 mr-2 sm:mr-3 cursor-pointer active:scale-95"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: REQUESTS (INCOMING & OUTGOING) */}
            {activeTab === "pending" && (
              <div className="space-y-8 pt-2 flex-1 flex flex-col">
                {/* 1. Incoming Requests Section */}
                <div>
                  <div className="flex items-center justify-between px-2 pr-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-sm">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white tracking-wide">
                        Incoming Requests
                      </span>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold font-mono shadow-sm mr-1">
                      {pendingIncoming.length}
                    </span>
                  </div>

                  {pendingIncoming.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center flex flex-col items-center justify-center gap-1.5 shadow-inner">
                      <Inbox className="w-5 h-5 text-neutral-500 stroke-1" />
                      <p className="text-xs font-medium text-neutral-400">No incoming friend requests right now</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {pendingIncoming.map((req) => (
                        <div
                          key={req._id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={req.avatar || getFallbackAvatar(req.name, "user")}
                              alt={req.name}
                              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white truncate">{req.name}</div>
                              <div className="text-xs text-neutral-400 truncate font-mono mt-0.5">{req.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-3 mr-2 sm:mr-3">
                            <button
                              onClick={() => updateRequestStatus(req._id, "accepted")}
                              className="px-3.5 py-2 rounded-xl bg-[#30D158] hover:bg-[#28b84d] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#30D158]/30 transition-all cursor-pointer active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => updateRequestStatus(req._id, "declined")}
                              className="px-3 py-2 rounded-xl bg-neutral-800/90 hover:bg-red-500/20 text-neutral-300 hover:text-red-400 text-xs font-medium flex items-center gap-1.5 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer active:scale-95"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Decline</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Sent Pending Requests Section */}
                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between px-2 pr-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-sm">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white tracking-wide">
                        Sent Requests
                      </span>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold font-mono shadow-sm mr-1">
                      {pendingOutgoing.length}
                    </span>
                  </div>

                  {pendingOutgoing.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center flex flex-col items-center justify-center gap-1.5 shadow-inner">
                      <Send className="w-5 h-5 text-neutral-500 stroke-1" />
                      <p className="text-xs font-medium text-neutral-400">No sent pending requests</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {pendingOutgoing.map((req) => (
                        <div
                          key={req._id}
                          className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={req.avatar || getFallbackAvatar(req.name, "user")}
                              alt={req.name}
                              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white truncate">{req.name}</div>
                              <div className="text-xs text-neutral-400 truncate font-mono mt-0.5">{req.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-3 mr-2 sm:mr-3">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-inner">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              <span>Pending</span>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  await fetch(`/api/chat/contacts?connectionId=${req._id}`, { method: "DELETE" });
                                  loadContacts();
                                } catch (_) {}
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 text-xs font-medium border border-white/5 hover:border-red-500/30 transition-all cursor-pointer active:scale-95"
                              title="Cancel Request"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SEARCH & ADD NEW */}
            {activeTab === "search" && (
              <div className="flex-1 flex flex-col">
                {!searchQuery ? (
                  /* Centered Clean Search Discovery Hub in the Middle of Card */
                  <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-8 px-4">
                    {/* Glowing Discovery Icon */}
                    <div className="relative mb-4 group">
                      <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-all" />
                      <div className="relative w-16 h-16 rounded-3xl bg-neutral-800/90 border border-white/15 flex items-center justify-center text-blue-400 shadow-2xl">
                        <Search className="w-8 h-8 stroke-[1.75]" />
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight mb-5">
                      Search Registered Users
                    </h3>

                    {/* Centered Large High-Contrast Search Input Bar */}
                    <div className="w-full max-w-sm flex items-center gap-3 px-4 py-3.5 bg-neutral-800/90 hover:bg-neutral-800 focus-within:bg-neutral-800 border border-white/20 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/25 rounded-2xl transition-all shadow-xl">
                      <Search className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        placeholder="Search by name or email (e.g. alex@...)"
                        className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
                        autoFocus
                      />
                    </div>
                  </div>
                ) : (
                  /* Active Search Mode with Results */
                  <div className="flex-1 flex flex-col space-y-4">
                    {/* Sticky Search Bar */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-neutral-800/90 hover:bg-neutral-800 focus-within:bg-neutral-800 border border-white/20 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/25 rounded-2xl transition-all flex-shrink-0 shadow-md">
                      <Search className="w-4.5 h-4.5 text-blue-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        placeholder="Search by name or email (e.g. alex@...)"
                        className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSearchUsers("")}
                        className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer transition-all"
                        title="Clear Search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Search Results List */}
                    <div className="flex-1 overflow-y-auto space-y-2.5">
                      {searchResults.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-10 px-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-neutral-400 shadow-inner">
                            <Search className="w-6 h-6 text-neutral-400 stroke-1" />
                          </div>
                          <p className="text-sm font-semibold text-white">No Users Found</p>
                          <p className="text-xs text-neutral-400 mt-1 max-w-xs mb-3">
                            No registered users found matching &quot;{searchQuery}&quot;.
                          </p>
                          <button
                            onClick={() => handleSearchUsers("")}
                            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
                          >
                            Clear Search
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="text-[11px] font-semibold text-neutral-400 px-1 uppercase tracking-wider">
                            Found Users ({searchResults.length})
                          </div>
                          {searchResults.map((user) => {
                            const isRequested = sentSuccessId === user._id;
                            return (
                              <div
                                key={user._id}
                                className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 transition-all shadow-sm"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <img
                                    src={user.avatar || getFallbackAvatar(user.name, "user")}
                                    alt={user.name}
                                    className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="text-sm font-bold text-white truncate">{user.name}</div>
                                    <div className="text-xs text-neutral-400 truncate font-mono mt-0.5">{user.email}</div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => sendFriendRequest(user._id)}
                                  disabled={isRequested}
                                  className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ml-3 mr-2 sm:mr-3 cursor-pointer active:scale-95 ${
                                    isRequested
                                      ? "bg-[#30D158] text-white shadow-[#30D158]/20"
                                      : "bg-[#007AFF] hover:bg-[#0071EB] text-white shadow-md shadow-[#007AFF]/25"
                                  }`}
                                >
                                  {isRequested ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      <span>Sent</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="w-3.5 h-3.5" />
                                      <span>Add Friend</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
