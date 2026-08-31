"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  X, Send, Reply, Pencil, Trash2, Shield, User, 
  Sparkles, RefreshCw, Check, Ban, Smile, Copy, CheckCheck,
  Users, ChevronDown, UserCheck, UserPlus, UserMinus, Bell, Lock
} from "lucide-react";

interface ReplyToData {
  id: string;
  sender: string;
  text: string;
}

interface MessageItem {
  _id: string;
  senderId: string;
  recipientId: string;
  sender: string;
  text: string;
  replyTo?: ReplyToData | null;
  isRead: boolean;
  isEdited: boolean;
  isDeleted?: boolean;
  retentionHours: number;
  createdAt: string;
}

interface AcceptedFriend {
  connectionId: string;
  partnerId: string;
  partnerName: string;
  roomId: string;
}

interface PendingIncomingRequest {
  connectionId: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  createdAt: string;
}

interface PendingOutgoingRequest {
  connectionId: string;
  recipientEmail: string;
  recipientName: string;
  createdAt: string;
}

interface ActiveUser {
  userId: string;
  userName: string;
  isTyping: boolean;
  isMe: boolean;
  lastSeenAt: string;
}

const EMOJI_LIST = [
  "❤️", "😂", "🔥", "👍", "😍", "🎉", "👀", "🤫", "✨", "💯", 
  "💀", "🥺", "🙌", "😎", "🚀", "😴", "💪", "💡", "😭", "🤝", 
  "🥳", "⚡", "🌟", "👌", "☕", "🍕", "🏋️", "🎯", "🔒", "👑"
];

interface SecretChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessagesRead?: () => void;
}

export default function SecretChatModal({ isOpen, onClose, onMessagesRead }: SecretChatModalProps) {
  const { data: session } = useSession();
  
  // Current user account info
  const currentUserId = (session?.user as any)?.id || session?.user?.email || "";
  const accountName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const [customName, setCustomName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const currentSender = customName.trim() || accountName;

  // Connections state (Friend Request / Accept model)
  const [acceptedFriends, setAcceptedFriends] = useState<AcceptedFriend[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<PendingIncomingRequest[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<PendingOutgoingRequest[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<AcceptedFriend | null>(null);
  const selectedFriendRef = useRef<AcceptedFriend | null>(null);
  selectedFriendRef.current = selectedFriend;
  
  // UI Panels
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [showAddFriendForm, setShowAddFriendForm] = useState(false);
  const [requestEmailInput, setRequestEmailInput] = useState("");
  const [requestStatusMsg, setRequestStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

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

  // Copy message state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick Emoji Picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll helper
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // Fetch 1-on-1 messages for a specific partner ID
  const fetchMessagesForPartner = useCallback(async (partnerId: string, markRead = true) => {
    if (!partnerId) return;

    try {
      const res = await fetch(`/api/chat/messages?recipientId=${encodeURIComponent(partnerId)}&markRead=${markRead}`);
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
      console.error("Error fetching 1-on-1 messages:", err);
    } finally {
      setLoading(false);
    }
  }, [onMessagesRead]);

  // Fetch approved connections and pending requests
  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/connections");
      if (res.ok) {
        const data = await res.json();
        const accepted: AcceptedFriend[] = data.accepted || [];
        const incoming: PendingIncomingRequest[] = data.pendingIncoming || [];
        const outgoing: PendingOutgoingRequest[] = data.pendingOutgoing || [];

        setAcceptedFriends(accepted);
        setPendingIncoming(incoming);
        setPendingOutgoing(outgoing);

        setSelectedFriend((prev) => {
          if (accepted.length === 0) return null;
          if (prev && accepted.some((p) => p.partnerId === prev.partnerId)) {
            return prev;
          }
          return accepted[0];
        });
      }
    } catch (err) {
      console.error("Error fetching connections:", err);
    }
  }, []);

  // Sync presence heartbeat & fetch active users
  const syncPresence = useCallback(async (isTypingState = false) => {
    try {
      await fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isTyping: isTypingState,
          customName: currentSender,
        }),
      });

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
  }, [currentSender]);

  // Initial load
  useEffect(() => {
    if (!isOpen) return;

    fetchConnections();
    syncPresence(false);

    let messageInterval: NodeJS.Timeout;
    let presenceInterval: NodeJS.Timeout;
    let connectionInterval: NodeJS.Timeout;

    const startIntervals = () => {
      const isVisible = typeof document !== "undefined" && document.visibilityState === "visible";
      const msgFreq = isVisible ? 2000 : 8000;
      const presFreq = isVisible ? 2500 : 8000;
      const connFreq = isVisible ? 6000 : 15000;

      clearInterval(messageInterval);
      clearInterval(presenceInterval);
      clearInterval(connectionInterval);

      messageInterval = setInterval(() => {
        if (selectedFriendRef.current) {
          fetchMessagesForPartner(selectedFriendRef.current.partnerId, true);
        }
      }, msgFreq);

      presenceInterval = setInterval(() => {
        syncPresence(false);
      }, presFreq);

      connectionInterval = setInterval(() => {
        fetchConnections();
      }, connFreq);
    };

    startIntervals();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchConnections();
        if (selectedFriendRef.current) {
          fetchMessagesForPartner(selectedFriendRef.current.partnerId, true);
        }
        syncPresence(false);
      }
      startIntervals();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(messageInterval);
      clearInterval(presenceInterval);
      clearInterval(connectionInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, fetchConnections, fetchMessagesForPartner, syncPresence, onClose]);

  // When selected friend changes, reload messages
  useEffect(() => {
    if (isOpen && selectedFriend) {
      setLoading(true);
      fetchMessagesForPartner(selectedFriend.partnerId, true);
    }
  }, [selectedFriend, isOpen, fetchMessagesForPartner]);

  // Scroll to bottom on message change
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
    syncPresence(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      syncPresence(false);
    }, 2000);
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Respond to incoming friend request (Accept / Decline)
  const handleRespondRequest = async (connectionId: string, action: "accept" | "decline") => {
    try {
      const res = await fetch("/api/chat/connections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action }),
      });

      if (res.ok) {
        await fetchConnections();
        if (onMessagesRead) onMessagesRead();
      }
    } catch (err) {
      console.error("Error responding to connection request:", err);
    }
  };

  // Remove / Cancel connection (Cancel pending request or Unfriend)
  const handleRemoveConnection = async (connectionId: string, nameOrEmail: string, isPending = false) => {
    const promptMsg = isPending
      ? `Cancel your pending chat request to ${nameOrEmail}?`
      : `Remove ${nameOrEmail} from your connected friends and delete 1-on-1 chat history?`;

    if (!confirm(promptMsg)) return;

    try {
      const res = await fetch(`/api/chat/connections?connectionId=${connectionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchConnections();
        if (selectedFriend?.connectionId === connectionId) {
          setSelectedFriend(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Error removing connection:", err);
    }
  };

  // Send new connection request by exact email
  const handleSendConnectionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmailInput.trim() || isSubmittingRequest) return;

    setIsSubmittingRequest(true);
    setRequestStatusMsg(null);

    try {
      const res = await fetch("/api/chat/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: requestEmailInput.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setRequestStatusMsg({ type: "success", text: data.message || "Friend request sent!" });
        setRequestEmailInput("");
        await fetchConnections();
        setTimeout(() => {
          setShowAddFriendForm(false);
          setRequestStatusMsg(null);
        }, 2000);
      } else {
        setRequestStatusMsg({ type: "error", text: data.error || "Failed to send request." });
      }
    } catch (err) {
      setRequestStatusMsg({ type: "error", text: "Network error sending request." });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (!isOpen) return null;

  // Check if active friend is online or typing
  const friendPresence = activeUsers.find(
    (u) => !u.isMe && (selectedFriend?.partnerId === u.userId || selectedFriend?.partnerName === u.userName)
  );

  // Send 1-on-1 message handler
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedFriend || sending) return;

    const currentPartner = selectedFriend;
    const textToSend = inputText.trim();
    const replyToSend = replyingTo;

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
          recipientId: currentPartner.partnerId,
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
        // Immediately trigger sync
        fetchMessagesForPartner(currentPartner.partnerId, true);
      }
    } catch (err) {
      console.error("Error sending 1-on-1 message:", err);
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
    if (!confirm("Delete this message for everyone?")) return;

    try {
      const res = await fetch(`/api/chat/messages?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, isDeleted: true, text: "This message was deleted", replyTo: null } : m)));
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // Clear 1-on-1 conversation
  const handleClearAll = async () => {
    if (!selectedFriend) return;
    if (!confirm(`Wipe the entire conversation history with ${selectedFriend.partnerName} permanently?`)) return;

    try {
      const res = await fetch(`/api/chat/messages?clearAll=true&recipientId=${encodeURIComponent(selectedFriend.partnerId)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages([]);
      }
    } catch (err) {
      console.error("Error clearing 1-on-1 conversation:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-2xl bg-white dark:bg-[#090913] light:bg-white border-0 sm:border border-slate-200 dark:border-white/10 light:border-slate-200 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-[640px] sm:max-h-[90vh] relative font-sans transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header (Zero-Knowledge 1-on-1 Tunnel) */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 dark:border-white/10 light:border-slate-200 bg-slate-50 dark:bg-[#0d0d1c] light:bg-slate-50 flex-shrink-0 pt-[max(0.625rem,env(safe-area-inset-top))] transition-colors">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Avatar & Online Presence */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-500/15 dark:bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xs sm:text-sm">
                {selectedFriend ? selectedFriend.partnerName.slice(0, 2).toUpperCase() : <Lock size={16} />}
              </div>
              {friendPresence && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0d0d1c] light:border-white shadow-sm"></span>
              )}
            </div>

            {/* Friend Info / Switcher */}
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowFriendPicker(!showFriendPicker);
                  setShowAddFriendForm(false);
                }}
                className="text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 light:text-slate-900 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {selectedFriend ? selectedFriend.partnerName : "Private Channel"}
                </h3>
                {acceptedFriends.length > 1 && (
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-teal-500 transition-transform" />
                )}
                <span className="text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-mono font-normal flex-shrink-0">
                  AES-256
                </span>
              </button>

              {/* Status Subtitle */}
              <p className="text-[9px] sm:text-[10px] tracking-wide truncate mt-0.5">
                {friendPresence?.isTyping ? (
                  <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1 animate-pulse">
                    <span className="truncate">✍️ {selectedFriend?.partnerName} is typing</span>
                    <span className="inline-flex gap-0.5 flex-shrink-0">
                      <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce"></span>
                    </span>
                  </span>
                ) : friendPresence ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping flex-shrink-0"></span>
                    Online
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 light:text-slate-500 truncate block">
                    {selectedFriend ? `1-on-1 with ${selectedFriend.partnerName}` : "Send connection request to begin"} • {retentionHours}h
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Add / Connect Friend Button */}
            <button
              type="button"
              onClick={() => {
                setShowAddFriendForm(!showAddFriendForm);
                setShowFriendPicker(false);
                setRequestStatusMsg(null);
              }}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs ${
                showAddFriendForm
                  ? "bg-teal-600 text-white font-bold"
                  : "bg-slate-200/70 dark:bg-white/5 light:bg-slate-200/70 text-slate-600 dark:text-slate-400 light:text-slate-600 hover:text-teal-600"
              }`}
              title="Connect with Friend (Send Request)"
            >
              <UserPlus size={14} />
              <span className="hidden sm:inline text-[10px]">Add Friend</span>
            </button>

            {/* Auto-delete toggle */}
            <div className="flex items-center bg-slate-200/70 dark:bg-white/5 light:bg-slate-200/70 border border-slate-300 dark:border-white/10 light:border-slate-300 rounded-xl p-0.5 sm:p-1 text-[8px] sm:text-[9px] font-mono">
              <button
                type="button"
                onClick={() => setRetentionHours(12)}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-all cursor-pointer ${
                  retentionHours === 12 ? "bg-teal-600 text-white font-bold" : "text-slate-600 dark:text-slate-400 light:text-slate-600 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                12h
              </button>
              <button
                type="button"
                onClick={() => setRetentionHours(24)}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-all cursor-pointer ${
                  retentionHours === 24 ? "bg-teal-600 text-white font-bold" : "text-slate-600 dark:text-slate-400 light:text-slate-600 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                24h
              </button>
            </div>

            {/* Clear Conversation Button */}
            {selectedFriend && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={messages.length === 0}
                className="p-2 sm:p-1.5 rounded-xl bg-slate-200/70 dark:bg-white/5 light:bg-slate-200/70 hover:bg-red-500/20 text-slate-600 dark:text-slate-400 light:text-slate-600 hover:text-red-500 border border-slate-300 dark:border-white/5 light:border-slate-300 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                title="Wipe conversation with this friend"
              >
                <Trash2 size={15} />
              </button>
            )}

            {/* Panic / Close button */}
            <button
              onClick={onClose}
              className="p-2 sm:p-1.5 rounded-xl bg-slate-200/70 dark:bg-white/5 light:bg-slate-200/70 hover:bg-red-500/20 text-slate-600 dark:text-slate-400 light:text-slate-600 hover:text-red-500 border border-slate-300 dark:border-white/5 light:border-slate-300 transition-all cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              title="Stealth Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Incoming Friend Request Banner (Accept / Decline) */}
        {pendingIncoming.length > 0 && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/25 flex-shrink-0 space-y-2 animate-in fade-in duration-150">
            {pendingIncoming.map((req) => (
              <div key={req.connectionId} className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 light:text-amber-700 font-medium truncate">
                  <Bell size={14} className="text-amber-500 flex-shrink-0 animate-bounce" />
                  <span className="truncate">
                    <strong>{req.requesterName}</strong> sent you a friend request.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleRespondRequest(req.connectionId, "accept")}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1"
                  >
                    <Check size={12} />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespondRequest(req.connectionId, "decline")}
                    className="px-2.5 py-1 bg-slate-200 dark:bg-white/10 light:bg-slate-200 hover:bg-red-500/20 text-slate-600 dark:text-slate-300 light:text-slate-600 hover:text-red-500 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <X size={12} />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Send Friend Request Modal / Form */}
        {showAddFriendForm && (
          <div className="p-4 bg-slate-100 dark:bg-[#0e0e22] light:bg-slate-100 border-b border-slate-200 dark:border-white/10 light:border-slate-200 flex-shrink-0 animate-in fade-in slide-in-from-top-2 duration-150 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <UserPlus size={13} className="text-teal-500" />
                Connect with a Friend
              </span>
              <button
                type="button"
                onClick={() => setShowAddFriendForm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Enter the exact email address of the friend you want to chat with. They will receive a private request and must accept it before the channel opens.
            </p>

            <form onSubmit={handleSendConnectionRequest} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={requestEmailInput}
                  onChange={(e) => setRequestEmailInput(e.target.value)}
                  placeholder="Enter friend's email (e.g. friend@example.com)..."
                  className="w-full bg-white dark:bg-white/10 light:bg-white border border-slate-300 dark:border-white/20 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!requestEmailInput.trim() || isSubmittingRequest}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer flex-shrink-0 shadow-md shadow-teal-500/20"
                >
                  {isSubmittingRequest ? "Sending..." : "Send Request"}
                </button>
              </div>

              {requestStatusMsg && (
                <div
                  className={`text-xs p-2 rounded-xl border ${
                    requestStatusMsg.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                  }`}
                >
                  {requestStatusMsg.text}
                </div>
              )}
            </form>

            {/* Pending Outgoing Requests with Cancel Option */}
            {pendingOutgoing.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 space-y-1.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Pending Sent Requests:</span>
                {pendingOutgoing.map((out) => (
                  <div key={out.connectionId} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg">
                    <div className="flex items-center gap-1.5 truncate">
                      <span>⏳ Request sent to <strong>{out.recipientName || out.recipientEmail}</strong></span>
                      <span className="text-[9px] text-amber-500 font-mono hidden sm:inline">(Waiting for acceptance)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveConnection(out.connectionId, out.recipientName || out.recipientEmail, true)}
                      className="px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold transition-colors cursor-pointer flex-shrink-0 ml-2"
                      title="Cancel this request"
                    >
                      Cancel Request
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Connected Friends Switcher Panel with Remove / Unfriend Option */}
        {showFriendPicker && (
          <div className="p-3.5 bg-slate-100 dark:bg-[#0e0e22] light:bg-slate-100 border-b border-slate-200 dark:border-white/10 light:border-slate-200 flex-shrink-0 animate-in fade-in slide-in-from-top-2 duration-150 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Users size={12} className="text-teal-500" />
                Your Connected Friends
              </span>
              <button
                type="button"
                onClick={() => setShowFriendPicker(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {acceptedFriends.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No connected friends yet. Click &quot;Add Friend&quot; to send a request.</p>
              ) : (
                acceptedFriends.map((p) => {
                  const isSelected = selectedFriend?.partnerId === p.partnerId;
                  return (
                    <div
                      key={p.partnerId}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                        isSelected
                          ? "bg-teal-600 text-white font-bold shadow-md shadow-teal-500/20"
                          : "bg-white dark:bg-white/5 light:bg-white text-slate-800 dark:text-slate-200 light:text-slate-800 hover:bg-slate-200 dark:hover:bg-white/10"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFriend(p);
                          setShowFriendPicker(false);
                        }}
                        className="flex items-center gap-2 truncate flex-1 text-left cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                          {p.partnerName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate">{p.partnerName}</span>
                        {isSelected && <UserCheck size={14} className="flex-shrink-0 ml-1" />}
                      </button>

                      {/* Remove / Unfriend Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveConnection(p.connectionId, p.partnerName, false);
                        }}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ml-2 flex-shrink-0 ${
                          isSelected ? "hover:bg-red-500/30 text-white/80 hover:text-white" : "hover:bg-red-500/10 text-slate-400 hover:text-red-500"
                        }`}
                        title={`Remove ${p.partnerName} and delete chat`}
                      >
                        <UserMinus size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* User Identity Bar */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-1.5 bg-slate-100/80 dark:bg-white/[0.02] light:bg-slate-100/80 border-b border-slate-200 dark:border-white/5 light:border-slate-200 text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400 light:text-slate-600 flex-shrink-0 transition-colors">
          <div className="flex items-center gap-1.5 truncate">
            <User size={11} className="text-teal-600 dark:text-teal-400 light:text-teal-600 flex-shrink-0" />
            <span className="hidden sm:inline">Logged in as:</span>
            {!isEditingName ? (
              <span className="font-bold text-slate-900 dark:text-slate-200 light:text-slate-900 truncate">{currentSender}</span>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={accountName}
                  className="bg-white dark:bg-white/10 light:bg-white border border-slate-300 dark:border-white/20 light:border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-slate-100 light:text-slate-900 outline-none w-24 sm:w-28"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="text-teal-600 dark:text-teal-400 light:text-teal-600 hover:opacity-80 p-1"
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
                className="text-[9px] text-slate-500 dark:text-slate-500 light:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 light:hover:text-teal-600 underline ml-0.5 cursor-pointer"
              >
                (Edit)
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-500 light:text-slate-500 font-mono flex-shrink-0">
            <span>Tunnel:</span>
            <span className="text-teal-600 dark:text-teal-400 light:text-teal-600 font-bold">{selectedFriend ? selectedFriend.partnerName : "None"}</span>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-slate-50/60 dark:bg-transparent light:bg-slate-50/60 overscroll-contain transition-colors">
          {!selectedFriend ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-6 sm:p-8">
              <div className="p-3.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400">
                <Shield size={32} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Zero-Knowledge Private Chat</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  To begin chatting with someone, enter their exact email address to send a friend request. They must accept before any messages can be sent or seen.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddFriendForm(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  <UserPlus size={14} />
                  Send Friend Request
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <RefreshCw size={20} className="animate-spin text-teal-600 dark:text-teal-400" />
              <p className="text-xs font-mono">Decrypting communications with {selectedFriend.partnerName}...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-6 sm:p-8 border border-dashed border-slate-300 dark:border-white/5 light:border-slate-300 rounded-2xl bg-white/50 dark:bg-white/[0.01] light:bg-white/50">
              <div className="p-3 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 light:text-slate-800 font-mono">
                  1-on-1 Tunnel with {selectedFriend.partnerName}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-500 mt-1 max-w-sm">
                  Only you and {selectedFriend.partnerName} can access this conversation. Messages are encrypted with AES-256 and self-destruct in {retentionHours} hours.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId || msg.sender.toLowerCase() === currentSender.toLowerCase();
              const isEditing = editingId === msg._id;
              const isCopied = copiedId === msg._id;

              return (
                <div
                  key={msg._id}
                  className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
                >
                  {/* Sender & Timestamp */}
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[9px] font-mono text-slate-500 dark:text-slate-400 light:text-slate-500">
                    <span className={`font-bold ${isMe ? "text-teal-600 dark:text-teal-400 light:text-teal-600" : "text-indigo-600 dark:text-indigo-400 light:text-indigo-600"}`}>
                      {msg.sender}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {msg.isEdited && <span className="text-[8px] text-slate-500 dark:text-slate-500 light:text-slate-500">(edited)</span>}
                  </div>

                  {/* Quoted Message Preview if Reply */}
                  {msg.replyTo && (
                    <div
                      className={`mb-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] border-l-2 bg-slate-100 dark:bg-white/[0.03] light:bg-slate-100 border-teal-500 max-w-[90%] sm:max-w-md ${
                        isMe ? "text-right" : "text-left"
                      }`}
                    >
                      <span className="text-[8px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 light:text-teal-600 font-mono block">
                        Replying to @{msg.replyTo.sender}
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 light:text-slate-700 line-clamp-1 italic text-[10px]">
                        &quot;{msg.replyTo.text}&quot;
                      </p>
                    </div>
                  )}

                  {/* Message Bubble + Actions */}
                  <div className="flex items-center gap-1 max-w-[92%] sm:max-w-[85%]">
                    {/* Actions for other sender (Reply + Copy) */}
                    {!isMe && !msg.isDeleted && (
                      <div className="flex items-center gap-0.5 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0">
                        <button
                          onClick={() => setReplyingTo({ id: msg._id, sender: msg.sender, text: msg.text })}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 light:hover:bg-slate-200 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 light:hover:text-teal-600 transition-all cursor-pointer min-w-[26px] min-h-[26px] flex items-center justify-center"
                          title="Reply"
                        >
                          <Reply size={13} />
                        </button>
                        <button
                          onClick={() => handleCopyMessage(msg._id, msg.text)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 light:hover:bg-slate-200 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 light:hover:text-indigo-600 transition-all cursor-pointer min-w-[26px] min-h-[26px] flex items-center justify-center"
                          title="Copy Message"
                        >
                          {isCopied ? <CheckCheck size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    )}

                    {msg.isDeleted ? (
                      /* Deleted Message Bubble (WhatsApp Style) */
                      <div
                        className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs leading-relaxed break-words relative transition-all border border-slate-200 dark:border-white/5 light:border-slate-200 bg-slate-100 dark:bg-white/[0.02] light:bg-slate-100 text-slate-500 dark:text-slate-400 light:text-slate-500 italic flex items-center gap-1.5 ${
                          isMe ? "rounded-br-none" : "rounded-bl-none"
                        }`}
                      >
                        <Ban size={12} className="text-slate-400 flex-shrink-0" />
                        <span>This message was deleted</span>
                      </div>
                    ) : isEditing ? (
                      /* Inline Edit Form */
                      <div className="bg-slate-100 dark:bg-[#121226] light:bg-slate-100 border border-teal-500/40 p-2.5 sm:p-3 rounded-2xl space-y-2 w-full min-w-[240px] sm:min-w-[260px] shadow-lg">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-white dark:bg-white/10 light:bg-white border border-slate-300 dark:border-white/15 light:border-slate-300 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-900 dark:text-white light:text-slate-900 outline-none focus:border-teal-500 placeholder-slate-400"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditText("");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-white/5 light:bg-slate-200 text-[10px] text-slate-600 dark:text-slate-400 light:text-slate-600 hover:bg-slate-300 dark:hover:bg-white/10 cursor-pointer"
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
                            ? "bg-teal-600 text-white rounded-br-none shadow-md shadow-teal-500/20 font-medium"
                            : "bg-slate-200/90 dark:bg-[#1a1a32] light:bg-slate-200/90 text-slate-900 dark:text-slate-100 light:text-slate-900 border border-slate-300/80 dark:border-white/10 light:border-slate-300/80 rounded-bl-none shadow-sm font-medium"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    )}

                    {/* Actions for current sender (Reply + Copy + Edit + Delete) */}
                    {isMe && !isEditing && !msg.isDeleted && (
                      <div className="flex items-center gap-0.5 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0">
                        <button
                          onClick={() => setReplyingTo({ id: msg._id, sender: msg.sender, text: msg.text })}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 light:hover:bg-slate-200 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 light:hover:text-teal-600 transition-all cursor-pointer min-w-[26px] min-h-[26px] flex items-center justify-center"
                          title="Reply"
                        >
                          <Reply size={12} />
                        </button>
                        <button
                          onClick={() => handleCopyMessage(msg._id, msg.text)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 light:hover:bg-slate-200 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 light:hover:text-indigo-600 transition-all cursor-pointer min-w-[26px] min-h-[26px] flex items-center justify-center"
                          title="Copy Message"
                        >
                          {isCopied ? <CheckCheck size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(msg._id);
                            setEditText(msg.text);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 light:hover:bg-slate-200 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 light:hover:text-indigo-600 transition-all cursor-pointer min-w-[26px] min-h-[26px] flex items-center justify-center"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(msg._id)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 light:hover:bg-slate-200 text-slate-500 hover:text-red-500 transition-all cursor-pointer min-w-[26px] min-h-[26px] flex items-center justify-center"
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

          {/* Live Typing Indicator */}
          {friendPresence?.isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 light:text-slate-600 bg-slate-200/60 dark:bg-white/[0.02] light:bg-slate-200/60 border border-slate-300 dark:border-white/5 light:border-slate-300 rounded-2xl px-3.5 py-1.5 w-fit animate-in fade-in duration-150">
              <span className="font-bold text-teal-600 dark:text-teal-400 light:text-teal-600 font-mono text-[10px]">{selectedFriend?.partnerName}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 light:text-slate-500 italic">is typing</span>
              <span className="inline-flex gap-1 items-center ml-0.5">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce"></span>
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Reply Quote Banner */}
        {replyingTo && (
          <div className="flex items-center justify-between px-3.5 sm:px-5 py-2 bg-teal-50 dark:bg-teal-950/40 light:bg-teal-50 border-t border-teal-200 dark:border-teal-500/25 light:border-teal-200 flex-shrink-0">
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <Reply size={12} className="text-teal-600 dark:text-teal-400 light:text-teal-600 flex-shrink-0" />
              <div className="text-[10px] truncate">
                <span className="font-bold text-teal-600 dark:text-teal-400 light:text-teal-600 font-mono mr-1">
                  Replying to @{replyingTo.sender}:
                </span>
                <span className="text-slate-800 dark:text-slate-200 light:text-slate-800 italic truncate">&quot;{replyingTo.text}&quot;</span>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer flex-shrink-0"
              title="Cancel Reply"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Quick Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className="px-3 sm:px-5 py-2.5 bg-slate-100 dark:bg-[#101024] light:bg-slate-100 border-t border-slate-200 dark:border-white/10 light:border-slate-200 flex-shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-150 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 light:text-slate-600 uppercase tracking-wider font-mono">
                Quick Emojis
              </span>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-10 gap-1 max-h-28 overflow-y-auto">
              {EMOJI_LIST.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertEmoji(emoji)}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 light:hover:bg-slate-200 text-base sm:text-lg transition-transform hover:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <form 
          onSubmit={handleSend} 
          className="p-2.5 sm:p-3.5 bg-slate-50 dark:bg-[#0d0d1c] light:bg-slate-50 border-t border-slate-200 dark:border-white/10 light:border-slate-200 flex-shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))] transition-colors"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-white/[0.05] light:bg-white border border-slate-300 dark:border-white/15 light:border-slate-300 focus-within:border-teal-500 rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 transition-all shadow-sm">
            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex-shrink-0 ${
                showEmojiPicker
                  ? "bg-teal-500/20 text-teal-600 dark:text-teal-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
              title="Add Emoji"
            >
              <Smile size={17} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={selectedFriend ? `Message ${selectedFriend.partnerName} securely...` : "Add or accept a friend above to message..."}
              disabled={!selectedFriend}
              className="w-full bg-transparent text-base sm:text-xs text-slate-900 dark:text-white light:text-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 light:placeholder:text-slate-400 outline-none py-1 font-sans font-medium disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || !selectedFriend || sending}
              className="p-2 sm:p-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all cursor-pointer flex-shrink-0 shadow-md shadow-teal-500/20 min-w-[36px] min-h-[36px] flex items-center justify-center"
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
