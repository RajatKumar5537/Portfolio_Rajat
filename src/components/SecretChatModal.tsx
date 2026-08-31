"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { 
  X, Send, Reply, Pencil, Trash2, Shield, User, 
  Sparkles, RefreshCw, Check, Ban
} from "lucide-react";

interface ReplyToData {
  id: string;
  sender: string;
  text: string;
}

interface MessageItem {
  _id: string;
  sender: string;
  text: string;
  replyTo?: ReplyToData | null;
  isRead: boolean;
  isEdited: boolean;
  isDeleted?: boolean;
  retentionHours: number;
  createdAt: string;
}

interface ActiveUser {
  userId: string;
  userName: string;
  isTyping: boolean;
  isMe: boolean;
  lastSeenAt: string;
}

interface SecretChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessagesRead?: () => void;
}

export default function SecretChatModal({ isOpen, onClose, onMessagesRead }: SecretChatModalProps) {
  const { data: session } = useSession();
  
  // Account name default
  const accountName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const [customName, setCustomName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const currentSender = customName.trim() || accountName;

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [retentionHours, setRetentionHours] = useState<12 | 24>(24);
  const [replyingTo, setReplyingTo] = useState<ReplyToData | null>(null);
  
  // Online presence & typing state
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll helper
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // Fetch messages from API
  const fetchMessages = async (markRead = true) => {
    try {
      const res = await fetch(`/api/chat/messages?markRead=${markRead}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
          if (markRead && onMessagesRead) {
            onMessagesRead();
          }
        }
      }
    } catch (err) {
      console.error("Error fetching secret messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // Presence heartbeat & fetch active users
  const syncPresence = async (isTypingState = false) => {
    try {
      // 1. Send our presence heartbeat
      await fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isTyping: isTypingState,
          customName: currentSender,
        }),
      });

      // 2. Fetch all active users
      const res = await fetch("/api/chat/presence");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.activeUsers)) {
          setActiveUsers(data.activeUsers);
        }
      }
    } catch (err) {
      console.error("Error syncing presence:", err);
    }
  };

  // Heartbeat loop while modal is open
  useEffect(() => {
    if (!isOpen) return;

    fetchMessages(true);
    syncPresence(false);

    const messageInterval = setInterval(() => {
      fetchMessages(true);
    }, 2000);

    const presenceInterval = setInterval(() => {
      syncPresence(false);
    }, 2500);

    // ESC key closes modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(messageInterval);
      clearInterval(presenceInterval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentSender]);

  // Scroll to bottom on initial load or message count change
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, isOpen]);

  // Focus input on reply
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  // Typing event handler with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Send isTyping = true
    syncPresence(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      syncPresence(false);
    }, 2000);
  };

  if (!isOpen) return null;

  // Other active users (excluding current user)
  const otherUsers = activeUsers.filter((u) => !u.isMe);
  const typingUser = otherUsers.find((u) => u.isTyping);
  const onlineOtherUser = otherUsers[0];

  // Send message handler
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    const replyToSend = replyingTo;

    // Clear input immediately for smooth UX
    setInputText("");
    setReplyingTo(null);
    setSending(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    syncPresence(false);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: currentSender,
          text: textToSend,
          replyTo: replyToSend,
          retentionHours,
        }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(() => scrollToBottom(), 50);
        if (onMessagesRead) onMessagesRead();
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  // Edit message handler
  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) return;

    try {
      const res = await fetch("/api/chat/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, text: editText.trim() }),
      });

      if (res.ok) {
        const updated = await res.json();
        setMessages((prev) => prev.map((m) => (m._id === id ? updated : m)));
        setEditingId(null);
        setEditText("");
      }
    } catch (err) {
      console.error("Error editing message:", err);
    }
  };

  // Delete message handler
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message permanently?")) return;

    try {
      const res = await fetch(`/api/chat/messages?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m._id !== id));
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-2xl bg-[#090913] border-0 sm:border border-white/10 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-[640px] sm:max-h-[90vh] relative font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* WhatsApp-Style Header (Optimized for Android & iOS) */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-white/10 bg-[#0d0d1c] flex-shrink-0 pt-[max(0.625rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xs sm:text-sm">
                {onlineOtherUser ? onlineOtherUser.userName.slice(0, 2).toUpperCase() : <Shield size={16} />}
              </div>
              {/* Online Green Dot */}
              {onlineOtherUser && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-[#0d0d1c] shadow-sm"></span>
              )}
            </div>

            {/* User Details & Live Status Subtitle */}
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5 truncate">
                <span className="truncate">{onlineOtherUser ? onlineOtherUser.userName : "Secret Room"}</span>
                <span className="text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-normal flex-shrink-0">
                  AES-256
                </span>
              </h3>

              {/* Dynamic Status: Typing / Online / Waiting */}
              <p className="text-[9px] sm:text-[10px] tracking-wide truncate mt-0.5">
                {typingUser ? (
                  <span className="text-teal-400 font-bold flex items-center gap-1 animate-pulse">
                    <span className="truncate">✍️ {typingUser.userName} is typing</span>
                    <span className="inline-flex gap-0.5 flex-shrink-0">
                      <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce"></span>
                    </span>
                  </span>
                ) : onlineOtherUser ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping flex-shrink-0"></span>
                    Online
                  </span>
                ) : (
                  <span className="text-slate-500 truncate block">Waiting for partner • {retentionHours}h</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Auto-delete toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 sm:p-1 text-[8px] sm:text-[9px] font-mono">
              <button
                type="button"
                onClick={() => setRetentionHours(12)}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-all cursor-pointer ${
                  retentionHours === 12 ? "bg-teal-500 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                12h
              </button>
              <button
                type="button"
                onClick={() => setRetentionHours(24)}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-all cursor-pointer ${
                  retentionHours === 24 ? "bg-teal-500 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                24h
              </button>
            </div>

            {/* Panic / Close button */}
            <button
              onClick={onClose}
              className="p-2 sm:p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/5 transition-all cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              title="Stealth Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* User Identity Bar (WhatsApp Account Sync) */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-1.5 bg-white/[0.02] border-b border-white/5 text-[9px] sm:text-[10px] text-slate-400 flex-shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <User size={11} className="text-teal-400 flex-shrink-0" />
            <span className="hidden sm:inline">Account:</span>
            {!isEditingName ? (
              <span className="font-bold text-slate-200 truncate">{currentSender}</span>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={accountName}
                  className="bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-xs text-slate-100 outline-none w-24 sm:w-28"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="text-teal-400 hover:text-teal-300 p-1"
                >
                  <Check size={11} />
                </button>
              </div>
            )}
            {!isEditingName && (
              <button
                type="button"
                onClick={() => {
                  setCustomName(currentSender);
                  setIsEditingName(true);
                }}
                className="text-[9px] text-slate-500 hover:text-teal-400 underline ml-0.5 cursor-pointer"
              >
                (Edit)
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono flex-shrink-0">
            <span>Online:</span>
            <span className="text-teal-400 font-bold">{Math.max(1, activeUsers.length)}</span>
          </div>
        </div>

        {/* Message Feed (Touch-friendly & Smooth Scroll) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0d0d1e]/30 via-transparent to-transparent overscroll-contain">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <RefreshCw size={20} className="animate-spin text-teal-400" />
              <p className="text-xs font-mono">Decrypting communications...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-6 sm:p-8 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
              <div className="p-3 rounded-full bg-teal-500/10 text-teal-400">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Secret Channel Ready</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-sm">
                  Send a message to initiate encrypted conversation. Messages self-destruct automatically in {retentionHours} hours.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender.toLowerCase() === currentSender.toLowerCase();
              const isEditing = editingId === msg._id;

              return (
                <div
                  key={msg._id}
                  className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
                >
                  {/* Sender & Timestamp */}
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[9px] font-mono text-slate-500">
                    <span className={`font-bold ${isMe ? "text-teal-400" : "text-indigo-300"}`}>{msg.sender}</span>
                    <span>•</span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {msg.isEdited && <span className="text-[8px] text-slate-600">(edited)</span>}
                  </div>

                  {/* Quoted Message Preview if Reply */}
                  {msg.replyTo && (
                    <div
                      className={`mb-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] border-l-2 bg-white/[0.03] border-teal-500 max-w-[90%] sm:max-w-md ${
                        isMe ? "text-right" : "text-left"
                      }`}
                    >
                      <span className="text-[8px] font-bold uppercase tracking-widest text-teal-400 font-mono block">
                        Replying to @{msg.replyTo.sender}
                      </span>
                      <p className="text-slate-400 line-clamp-1 italic text-[10px]">
                        &quot;{msg.replyTo.text}&quot;
                      </p>
                    </div>
                  )}

                  {/* Message Bubble + Touch-Friendly Actions */}
                  <div className="flex items-center gap-1 max-w-[92%] sm:max-w-[85%]">
                    {/* Reply Action for other sender (only if not deleted) */}
                    {!isMe && !msg.isDeleted && (
                      <button
                        onClick={() => setReplyingTo({ id: msg._id, sender: msg.sender, text: msg.text })}
                        className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-teal-400 transition-all cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center flex-shrink-0"
                        title="Reply"
                      >
                        <Reply size={13} />
                      </button>
                    )}

                    {msg.isDeleted ? (
                      /* Deleted Message Bubble (WhatsApp Style) */
                      <div
                        className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs leading-relaxed break-words relative transition-all border border-white/5 bg-white/[0.02] text-slate-500 italic flex items-center gap-1.5 ${
                          isMe ? "rounded-br-none" : "rounded-bl-none"
                        }`}
                      >
                        <Ban size={12} className="text-slate-500 flex-shrink-0" />
                        <span>This message was deleted</span>
                      </div>
                    ) : isEditing ? (
                      /* Inline Edit Form */
                      <div className="bg-[#121226] border border-teal-500/40 p-2.5 sm:p-3 rounded-2xl space-y-2 w-full min-w-[240px] sm:min-w-[260px] shadow-lg">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-base sm:text-xs text-white outline-none focus:border-teal-400 placeholder-slate-400"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditText("");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/5 text-[10px] text-slate-400 hover:bg-white/10 hover:text-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(msg._id)}
                            className="px-3 py-1 rounded-lg bg-teal-600 text-[10px] text-white font-bold hover:bg-teal-500 cursor-pointer shadow-sm"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Message Bubble */
                      <div
                        className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs leading-relaxed break-words relative transition-all ${
                          isMe
                            ? "bg-teal-600 text-white rounded-br-none shadow-lg shadow-teal-900/30 font-medium"
                            : "bg-[#151528] text-slate-100 border border-white/10 rounded-bl-none shadow-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    )}

                    {/* Actions for current sender (Visible on mobile touch, only if not deleted) */}
                    {isMe && !isEditing && !msg.isDeleted && (
                      <div className="flex items-center gap-0.5 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0">
                        <button
                          onClick={() => setReplyingTo({ id: msg._id, sender: msg.sender, text: msg.text })}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-teal-400 transition-all cursor-pointer min-w-[26px] min-h-[26px] flex items-center justify-center"
                          title="Reply"
                        >
                          <Reply size={12} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(msg._id);
                            setEditText(msg.text);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer min-w-[26px] min-h-[26px] flex items-center justify-center"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(msg._id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-all cursor-pointer min-w-[26px] min-h-[26px] flex items-center justify-center"
                          title="Delete for Everyone"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Live Typing Indicator in Message Feed */}
          {typingUser && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/[0.02] border border-white/5 rounded-2xl px-3.5 py-1.5 w-fit animate-in fade-in duration-150">
              <span className="font-bold text-teal-400 font-mono text-[10px]">{typingUser.userName}</span>
              <span className="text-[10px] text-slate-400 italic">is typing</span>
              <span className="inline-flex gap-1 items-center ml-0.5">
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"></span>
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Reply Quote Banner */}
        {replyingTo && (
          <div className="flex items-center justify-between px-3.5 sm:px-5 py-2 bg-teal-950/40 border-t border-teal-500/25 flex-shrink-0">
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <Reply size={12} className="text-teal-400 flex-shrink-0" />
              <div className="text-[10px] truncate">
                <span className="font-bold text-teal-400 font-mono mr-1">
                  Replying to @{replyingTo.sender}:
                </span>
                <span className="text-slate-200 italic truncate">&quot;{replyingTo.text}&quot;</span>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer flex-shrink-0"
              title="Cancel Reply"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input Bar (Optimized for Android & iOS Virtual Keyboards) */}
        <form 
          onSubmit={handleSend} 
          className="p-2.5 sm:p-3.5 bg-[#0d0d1c] border-t border-white/10 flex-shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
        >
          <div className="flex items-center gap-2 bg-white/[0.05] border border-white/15 focus-within:border-teal-400 rounded-xl px-3 py-1.5 sm:py-2 transition-all shadow-inner">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message as ${currentSender}...`}
              className="w-full bg-transparent text-base sm:text-xs text-white placeholder-slate-400 outline-none py-1 font-sans"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="p-2 sm:p-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all cursor-pointer flex-shrink-0 shadow-md shadow-teal-900/30 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Send Message"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
