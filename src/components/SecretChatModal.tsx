"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import ConversationList, { ConversationItem } from "@/components/chat/ConversationList";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageBubble, { MessageProps } from "@/components/chat/MessageBubble";
import MessageInputBar from "@/components/chat/MessageInputBar";
import FullScreenEffects from "@/components/effects/FullScreenEffects";
import GroupModal from "@/components/chat/GroupModal";
import ContactModal from "@/components/chat/ContactModal";
import SearchModal from "@/components/chat/SearchModal";
import ContactProfileModal from "@/components/chat/ContactProfileModal";
import ProfileSettingsModal from "@/components/chat/ProfileSettingsModal";
import CallModal from "@/components/call/CallModal";
import { soundEngine } from "@/lib/audio";
import { MessageSquare, Sparkles, Shield, Lock, X } from "lucide-react";

interface SecretChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessagesRead?: () => void;
}

export default function SecretChatModal({
  isOpen,
  onClose,
  onMessagesRead,
}: SecretChatModalProps) {
  const { data: session, status } = useSession();

  // Navigation & State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Real-time Effects
  const [activeEffect, setActiveEffect] = useState<any | null>(null);

  // Presence & Typing
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Modals
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMyProfileModalOpen, setIsMyProfileModalOpen] = useState(false);
  const [customProfile, setCustomProfile] = useState<{ name?: string; avatar?: string; statusMessage?: string }>({});

  // Delete Confirmation & Toast
  const [deleteConfirmMessageId, setDeleteConfirmMessageId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<any>(null);

  // WebRTC Call State
  const [activeCall, setActiveCall] = useState<any | null>(null);

  // Contacts & Pending Requests
  const [pendingIncomingRequests, setPendingIncomingRequests] = useState<any[]>([]);
  const prevIncomingRequestsCountRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2800);
  };

  // Current user details
  const currentUserId = (session?.user as any)?.id || session?.user?.email || "";
  const currentUserName = customProfile.name || session?.user?.name || "User";
  const currentUserAvatar = customProfile.avatar || (session?.user as any)?.image || "";
  const currentUserStatus = customProfile.statusMessage || "Active now";

  // Scroll ref & Effect tracking
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesCountRef = useRef(0);
  const prevTotalUnreadRef = useRef<number | null>(null);
  const playedEffectIdsRef = useRef<Set<string>>(new Set());
  const isFetchingMessagesRef = useRef(false);
  const isFetchingConversationsRef = useRef(false);

  // Container scroll function
  const scrollToBottom = (behavior: "auto" | "smooth" = "smooth") => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior,
      });
    }
  };

  // Dynamic Viewport Height & Standalone PWA Support
  useEffect(() => {
    if (!isOpen) return;

    const updateAppHeight = () => {
      if (typeof window === "undefined") return;
      let h = window.innerHeight;
      if (window.visualViewport && window.visualViewport.height) {
        h = Math.min(window.innerHeight, window.visualViewport.height);
      }
      document.documentElement.style.setProperty("--app-height", `${h}px`);

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const isStandalone = (window.navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches;
      if (isIOS && isStandalone) {
        document.documentElement.classList.add("ios-standalone");
      }
    };

    updateAppHeight();
    window.addEventListener("resize", updateAppHeight, { passive: true });
    window.addEventListener("orientationchange", updateAppHeight, { passive: true });
    window.addEventListener("focus", updateAppHeight, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateAppHeight, { passive: true });
    }

    return () => {
      window.removeEventListener("resize", updateAppHeight);
      window.removeEventListener("orientationchange", updateAppHeight);
      window.removeEventListener("focus", updateAppHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateAppHeight);
      }
    };
  }, [isOpen]);

  // 1. Fetch Conversations
  const fetchConversations = async (force = false) => {
    if (!isOpen || status !== "authenticated") return;
    if (!force && isFetchingConversationsRef.current) return;
    isFetchingConversationsRef.current = true;
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data: ConversationItem[] = await res.json();
        setConversations(data);

        // Calculate total unread
        const totalUnread = data.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

        if (prevTotalUnreadRef.current !== null && totalUnread > prevTotalUnreadRef.current) {
          soundEngine.playReceived();
        }
        prevTotalUnreadRef.current = totalUnread;
        if (totalUnread === 0 && onMessagesRead) {
          onMessagesRead();
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      isFetchingConversationsRef.current = false;
    }
  };

  // 2. Fetch Contacts & Pending Requests
  const fetchContactsAndRequests = async () => {
    if (!isOpen || status !== "authenticated") return;
    try {
      const res = await fetch("/api/chat/contacts");
      if (res.ok) {
        const data = await res.json();
        const incoming = data.pendingIncoming || data.incomingRequests || [];
        setPendingIncomingRequests(incoming);

        if (
          prevIncomingRequestsCountRef.current !== null &&
          incoming.length > prevIncomingRequestsCountRef.current
        ) {
          soundEngine.playReceived();
        }
        prevIncomingRequestsCountRef.current = incoming.length;
      }
    } catch (err) {
      console.error("Error fetching contacts & requests:", err);
    }
  };

  // 3. Fetch Messages for Active Conversation
  const fetchMessages = async (convId: string, isInitial = false, forceScroll = false) => {
    if (!isOpen || !convId) return;
    if (isFetchingMessagesRef.current && !isInitial && !forceScroll) return;
    isFetchingMessagesRef.current = true;

    try {
      const res = await fetch(`/api/chat/messages?conversationId=${convId}`);
      if (res.ok) {
        const data: MessageProps[] = await res.json();
        const hasNewMessages = data.length > prevMessagesCountRef.current;
        const lastMsg = data.length > 0 ? data[data.length - 1] : null;

        if (isInitial) {
          data.forEach((m) => {
            if (m._id) playedEffectIdsRef.current.add(m._id);
          });
        } else if (hasNewMessages) {
          if (lastMsg && !lastMsg.isMe && lastMsg.effect && lastMsg.effect !== "invisible_ink") {
            if (!playedEffectIdsRef.current.has(lastMsg._id)) {
              playedEffectIdsRef.current.add(lastMsg._id);
              soundEngine.playReceived();
              setActiveEffect(lastMsg.effect);
            }
          }
        }

        prevMessagesCountRef.current = data.length;
        setMessages(data);

        // Sync active conversation's lastMessage in the sidebar list
        if (data.length > 0) {
          const latest = data[data.length - 1];
          setConversations((prev) =>
            prev.map((c) => {
              if (c._id === convId) {
                return {
                  ...c,
                  unreadCount: 0,
                  lastMessage: {
                    text: latest.text || (latest.mediaType ? `[${latest.mediaType.toUpperCase()}]` : ""),
                    senderId: latest.senderId,
                    senderName: latest.senderName,
                    isMe: latest.isMe,
                    isRead: Boolean(latest.isRead),
                    readAt: latest.readBy?.[0]?.readAt,
                    createdAt: latest.createdAt,
                    mediaType: latest.mediaType || undefined,
                    effect: latest.effect || undefined,
                  },
                };
              }
              return c;
            })
          );
        }

        if (isInitial || forceScroll) {
          setTimeout(() => {
            scrollToBottom(isInitial ? "auto" : "smooth");
          }, 60);
        } else if (hasNewMessages) {
          setTimeout(() => {
            scrollToBottom("smooth");
          }, 60);
        }

        onMessagesRead?.();
      }
    } catch (err: any) {
      console.warn("Message fetch notice:", err?.message || err);
    } finally {
      isFetchingMessagesRef.current = false;
    }
  };

  // Initial Data Load when Modal Opens
  useEffect(() => {
    if (isOpen && status === "authenticated") {
      fetchConversations(true);
      fetchContactsAndRequests();
    }
  }, [isOpen, status]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (isOpen && activeConversationId) {
      prevMessagesCountRef.current = 0;
      isFetchingMessagesRef.current = false;
      fetchMessages(activeConversationId, true, true);
    }
  }, [isOpen, activeConversationId]);

  // Adaptive Message & Typing Poller (1000ms loop)
  useEffect(() => {
    if (!isOpen || status !== "authenticated" || !activeConversationId) return;

    let isCancelled = false;
    let timerId: any = null;

    const pollActiveChat = async () => {
      if (isCancelled) return;
      await fetchMessages(activeConversationId);

      try {
        const presenceRes = await fetch(`/api/chat/presence?conversationId=${activeConversationId}`);
        if (presenceRes.ok && !isCancelled) {
          const presences = await presenceRes.json();
          const typing = presences
            .filter((p: any) => p.userId !== currentUserId && p.isTypingIn === activeConversationId)
            .map((p: any) => p.userName);
          setTypingUsers(typing);
        }
      } catch (_) {}

      if (!isCancelled) {
        timerId = setTimeout(pollActiveChat, 1000);
      }
    };

    timerId = setTimeout(pollActiveChat, 1100);

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [isOpen, status, activeConversationId, currentUserId]);

  // Sidebar Conversations Poller (every 3s)
  useEffect(() => {
    if (!isOpen || status !== "authenticated") return;
    const interval = setInterval(() => {
      fetchConversations();
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, status]);

  // Presence Heartbeat Poller (every 20s)
  useEffect(() => {
    if (!isOpen || status !== "authenticated") return;
    const sendHeartbeat = () => {
      fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeConversationId }),
      }).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 20000);
    return () => clearInterval(interval);
  }, [isOpen, status, activeConversationId]);

  // Contacts & Requests Poller (every 30s)
  useEffect(() => {
    if (!isOpen || status !== "authenticated") return;
    const interval = setInterval(() => {
      fetchContactsAndRequests();
    }, 30000);
    return () => clearInterval(interval);
  }, [isOpen, status]);

  // Rapid WebRTC Call signaling poller
  useEffect(() => {
    if (!isOpen || status !== "authenticated") return;

    let isPolling = false;
    const pollCall = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const callRes = await fetch("/api/chat/call");
        if (callRes.ok) {
          const callData = await callRes.json();
          setActiveCall((prev: any) => {
            if (!callData) {
              if (prev) soundEngine.stopAllTones();
              return null;
            }
            if (callData.status === "declined" || callData.status === "ended") {
              soundEngine.stopAllTones();
              return null;
            }
            return callData;
          });
        }
      } catch (_) {} finally {
        isPolling = false;
      }
    };

    pollCall();
    const intervalTime = activeCall ? 600 : 2500;
    const interval = setInterval(pollCall, intervalTime);
    return () => clearInterval(interval);
  }, [isOpen, status, !!activeCall]);

  if (!isOpen) return null;

  // Active conversation object
  const activeConversation: any = conversations.find((c) => c._id === activeConversationId);
  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Handlers
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setMobileView("chat");
    isFetchingMessagesRef.current = false;
    fetchMessages(id, true, true);
  };

  const handleSendMessage = async (msgData: any) => {
    if (!activeConversationId) return;

    if (msgData.effect && msgData.effect !== "invisible_ink") {
      setActiveEffect(msgData.effect);
    }

    soundEngine.playSent();

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: MessageProps = {
      _id: tempId,
      conversationId: activeConversationId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      isMe: true,
      text: msgData.text || "",
      mediaData: msgData.mediaData || null,
      mediaType: msgData.mediaType || null,
      mediaName: msgData.mediaName || null,
      effect: msgData.effect || null,
      createdAt: new Date().toISOString(),
      reactions: [],
      isPinned: false,
      replyTo: replyTo
        ? {
            id: replyTo._id,
            senderName: replyTo.senderName,
            text: replyTo.text,
            mediaType: replyTo.mediaType || undefined,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyTo(null);

    const previewText = msgData.text || (msgData.mediaType ? `[${msgData.mediaType.toUpperCase()}]` : "");
    setConversations((prev) =>
      prev.map((c) =>
        c._id === activeConversationId
          ? {
              ...c,
              lastMessage: {
                text: previewText,
                senderId: currentUserId,
                senderName: currentUserName,
                isMe: true,
                isRead: false,
                createdAt: new Date().toISOString(),
                mediaType: msgData.mediaType || null,
                effect: msgData.effect || null,
              },
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    setTimeout(() => {
      scrollToBottom("smooth");
    }, 30);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          ...msgData,
        }),
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...savedMsg, isMe: true } : m))
        );
        fetchConversations(true);
        fetchMessages(activeConversationId, false, true);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch("/api/chat/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      if (res.ok && activeConversationId) {
        fetchMessages(activeConversationId);
      }
    } catch (_) {}
  };

  const handleEditMessage = async (msg: MessageProps) => {
    try {
      const res = await fetch("/api/chat/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg._id, text: msg.text }),
      });
      if (res.ok && activeConversationId) {
        fetchMessages(activeConversationId);
      }
    } catch (_) {}
  };

  const handleDeleteMessage = (messageId: string) => {
    setDeleteConfirmMessageId(messageId);
  };

  const confirmDeleteMessage = async () => {
    if (!deleteConfirmMessageId) return;
    const msgId = deleteConfirmMessageId;
    setDeleteConfirmMessageId(null);
    setMessages((prev) =>
      prev.map((m) =>
        m._id === msgId
          ? { ...m, isDeleted: true, text: "This message was deleted", mediaData: null, reactions: [] }
          : m
      )
    );
    showToast("Message deleted");
    try {
      await fetch(`/api/chat/messages?messageId=${msgId}`, { method: "DELETE" });
      if (activeConversationId) {
        fetchMessages(activeConversationId);
        fetchConversations();
      }
    } catch (_) {}
  };

  const handleTogglePin = async (messageId: string, isPinned: boolean) => {
    try {
      const res = await fetch("/api/chat/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, isPinned }),
      });
      if (res.ok && activeConversationId) {
        fetchMessages(activeConversationId);
      }
    } catch (_) {}
  };

  const handleClearChat = async () => {
    if (!activeConversationId) return;
    if (!confirm("Are you sure you want to clear this conversation history for your view?")) return;

    try {
      const res = await fetch(`/api/chat/messages?conversationId=${activeConversationId}&clearAll=true`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchMessages(activeConversationId);
        fetchConversations();
      }
    } catch (_) {}
  };

  const handleJumpToMessage = (messageId: string) => {
    if (!messageId) return;
    const container = chatContainerRef.current;
    const targetEl = document.getElementById(`chat-msg-${messageId}`) || document.getElementById(messageId);
    if (container && targetEl) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const targetTop = targetRect.top - containerRect.top + container.scrollTop - (containerRect.height / 2);
      container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId((prev) => (prev === messageId ? null : prev));
      }, 2000);
    }
  };

  const handleSetDisappearingTimer = async (hours: number) => {
    if (!activeConversationId) return;
    try {
      setConversations((prev) =>
        prev.map((c) => (c._id === activeConversationId ? { ...c, disappearingHours: hours } : c))
      );

      const res = await fetch("/api/chat/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          disappearingHours: hours,
        }),
      });

      if (res.ok) {
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to update disappearing timer:", err);
    }
  };

  const handleTyping = async (isTyping: boolean) => {
    if (!activeConversationId) return;
    try {
      await fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeConversationId,
          isTypingIn: isTyping ? activeConversationId : null,
        }),
      });
    } catch (_) {}
  };

  const handleCreateGroup = async (name: string, participantIds: string[]) => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "group",
          name,
          participantIds,
        }),
      });
      if (res.ok) {
        const newConv = await res.json();
        await fetchConversations();
        setActiveConversationId(newConv._id);
        setMobileView("chat");
      }
    } catch (_) {}
  };

  const handleStartDirectChat = async (peerUserId: string) => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "direct",
          recipientId: peerUserId,
        }),
      });
      if (res.ok) {
        const conv = await res.json();
        setConversations((prev) => {
          const exists = prev.some((c) => c._id === conv._id);
          if (exists) {
            return prev.map((c) => (c._id === conv._id ? { ...c, ...conv } : c));
          }
          return [conv, ...prev];
        });
        setActiveConversationId(conv._id);
        setMobileView("chat");
        fetchMessages(conv._id, true);
        await fetchConversations();
      }
    } catch (err) {
      console.error("Error starting direct chat:", err);
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      const res = await fetch("/api/chat/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, status: "accepted" }),
      });
      if (res.ok) {
        soundEngine.playSent();
        await fetchContactsAndRequests();
        await fetchConversations();
      }
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  const handleDeclineRequest = async (connectionId: string) => {
    try {
      const res = await fetch("/api/chat/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, status: "declined" }),
      });
      if (res.ok) {
        await fetchContactsAndRequests();
      }
    } catch (err) {
      console.error("Error declining request:", err);
    }
  };

  // WebRTC Call actions
  const handleStartCall = async (callType: "audio" | "video") => {
    if (!activeConversation) return;
    const recipientId = activeConversation.participants?.find((id: string) => id !== currentUserId);
    if (!recipientId) return;

    try {
      const res = await fetch("/api/chat/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initiate",
          conversationId: activeConversation._id,
          recipientId,
          callType,
        }),
      });
      if (res.ok) {
        const callData = await res.json();
        setActiveCall(callData);
      }
    } catch (_) {}
  };

  const handleAcceptCall = async () => {
    if (!activeCall) return;
    soundEngine.stopAllTones();
    const callId = activeCall._id;
    setActiveCall((prev: any) => ({ ...prev, status: "accepted" }));
    try {
      await fetch("/api/chat/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          callId,
        }),
      });
    } catch (_) {}
  };

  const handleDeclineCall = async () => {
    if (!activeCall) return;
    soundEngine.stopAllTones();
    const callId = activeCall._id;
    setActiveCall(null);
    try {
      await fetch("/api/chat/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decline",
          callId,
        }),
      });
    } catch (_) {}
  };

  const handleEndCall = async () => {
    if (!activeCall) return;
    soundEngine.stopAllTones();
    const callId = activeCall._id;
    setActiveCall(null);
    try {
      await fetch("/api/chat/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          callId,
        }),
      });
    } catch (_) {}
  };

  // Fallback if user is somehow not logged in
  if (status === "unauthenticated") {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4">
        <div className="bg-[#0e0e1a] border border-white/10 rounded-3xl p-8 max-w-sm text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Authentication Required</h3>
          <p className="text-xs text-slate-400">Please sign in to your Personal Tracker account first to access Secret Chat.</p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ height: "var(--app-height, 100%)", maxHeight: "var(--app-height, 100%)" }}
      className="fixed inset-0 z-[9999] w-full flex items-center justify-center bg-[#000000] text-white p-0 sm:p-2 md:p-3 overflow-hidden select-none font-sans"
    >
      {/* 🎆 FULL SCREEN PARTICLES / FIREWORKS / SUNRISE / NIGHT ENGINE */}
      <FullScreenEffects
        effect={activeEffect}
        onComplete={() => setActiveEffect(null)}
      />

      {/* MAIN OBSIDIAN CONTAINER CARD */}
      <div
        style={{ height: "var(--app-height, 100%)", maxHeight: "var(--app-height, 100%)" }}
        className="w-full h-full sm:max-h-[96vh] sm:max-w-[1440px] bg-[#0A0A0C]/98 backdrop-blur-2xl border-0 sm:border border-white/10 sm:rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_40px_rgba(0,122,255,0.1)] flex flex-row overflow-hidden relative"
      >
        {/* 1. LEFT SIDEBAR: CONVERSATION LIST */}
        <div
          className={`${
            mobileView === "list" ? "flex" : "hidden"
          } md:flex flex-col h-full w-full md:w-[340px] lg:w-[380px] flex-shrink-0 z-20 overflow-hidden`}
        >
          <ConversationList
            conversations={conversations}
            selectedId={activeConversationId}
            pendingIncomingRequests={pendingIncomingRequests}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
            onSelectConversation={handleSelectConversation}
            onOpenNewChat={() => setIsContactModalOpen(true)}
            onOpenNewGroup={() => setIsGroupModalOpen(true)}
            onOpenContacts={() => setIsContactModalOpen(true)}
            onOpenProfile={() => setIsMyProfileModalOpen(true)}
            onClose={onClose}
            currentUser={{
              name: currentUserName,
              email: session?.user?.email || "",
              avatar: currentUserAvatar,
              statusMessage: currentUserStatus,
            }}
          />
        </div>

        {/* 2. RIGHT / MAIN AREA: ACTIVE CHAT PANE */}
        <div
          className={`${
            mobileView === "chat" ? "flex" : "hidden"
          } md:flex flex-col flex-1 h-full min-h-0 w-full max-w-full min-w-0 bg-[#000000] bg-radial-[at_top_right] from-blue-950/15 via-[#000000] to-[#000000] relative overflow-hidden`}
        >
          {activeConversation ? (
            <>
              {/* TOP HEADER */}
              <ChatHeader
                conversation={activeConversation}
                totalUnreadCount={totalUnreadCount}
                onBackToConversations={() => {
                  setMobileView("list");
                  if (typeof window !== "undefined" && window.innerWidth >= 768) {
                    setActiveConversationId(null);
                  }
                }}
                onCloseChat={onClose}
                onStartAudioCall={() => handleStartCall("audio")}
                onStartVideoCall={() => handleStartCall("video")}
                onOpenSearch={() => setIsSearchModalOpen(true)}
                onOpenInfo={() => setIsProfileModalOpen(true)}
                onClearChat={handleClearChat}
                isTyping={typingUsers.length > 0}
                typingUserName={typingUsers[0]}
              />

              {/* MESSAGE FEED */}
              <div
                ref={chatContainerRef}
                className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-3 sm:py-4 overscroll-contain"
                data-scrollable="true"
                style={{
                  WebkitOverflowScrolling: "touch",
                  touchAction: "pan-y",
                }}
              >
                <div className="w-full min-h-full flex flex-col gap-y-1 sm:gap-y-1.5 pb-4 sm:pb-6 pt-2">
                  <div className="flex-1 min-h-0" />
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[160px] my-auto text-center space-y-2.5 p-6 border border-dashed border-white/10 rounded-3xl bg-white/[0.03] backdrop-blur-md">
                      <div className="p-3 rounded-2xl bg-blue-500/20 text-[#007AFF] border border-blue-400/30 shadow-inner">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
                          Secret Chat with {activeConversation.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          {activeConversation.disappearingHours && activeConversation.disappearingHours > 0
                            ? `Messages are end-to-end encrypted and self-destruct in ${activeConversation.disappearingHours} hours.`
                            : "Messages are end-to-end encrypted with AES-256 GCM."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`w-full flex-shrink-0 ${(msg.reactions?.length ?? 0) > 0 ? "mb-4 sm:mb-5" : "mb-1.5 sm:mb-2"}`}
                      >
                        <MessageBubble
                          message={msg}
                          currentUserId={currentUserId}
                          partnerName={activeConversation.name}
                          onReact={handleReact}
                          onReply={(m) => setReplyTo({ id: m._id, senderName: m.senderName, text: m.text, mediaType: m.mediaType })}
                          onEdit={handleEditMessage}
                          onDelete={handleDeleteMessage}
                          onTogglePin={handleTogglePin}
                          onTriggerEffect={(eff) => setActiveEffect(eff)}
                          onJumpToMessage={handleJumpToMessage}
                          isHighlighted={highlightedMessageId === msg._id}
                          showAvatar={activeConversation.type === "group"}
                        />
                      </div>
                    ))
                  )}

                  {/* LIVE TYPING BUBBLE */}
                  {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-1 flex-shrink-0 mb-2">
                      <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#26252A] border border-white/10 text-white text-xs shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0.4s]" />
                        <span className="text-[11px] text-slate-400 font-medium ml-1.5">{typingUsers[0]} is typing...</span>
                      </div>
                    </div>
                  )}

                  <div className="h-4 sm:h-6 flex-shrink-0" />
                  <div ref={chatBottomRef} />
                </div>
              </div>

              {/* BOTTOM INPUT BAR */}
              <MessageInputBar
                onSendMessage={handleSendMessage}
                replyTo={replyTo}
                onClearReply={() => setReplyTo(null)}
                onTyping={handleTyping}
                currentDisappearingHours={activeConversation.disappearingHours || 0}
                onSetDisappearingTimer={handleSetDisappearingTimer}
                partnerName={activeConversation.name}
              />
            </>
          ) : (
            /* EMPTY STATE ON DESKTOP */
            <div className="hidden md:flex flex-col items-center justify-center flex-1 h-full text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg">
                <Shield size={40} />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-lg font-bold text-white">Secret Encrypted Chat</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select a contact from the sidebar or click <strong>+</strong> to start an end-to-end encrypted private conversation.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-blue-400 font-mono font-medium">
                  <Lock size={12} /> Disappearing Messages & E2EE Calling Enabled
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
          <div className="px-5 py-2.5 bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl text-white text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
            {toastMessage}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmMessageId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="w-full max-w-xs bg-[#1C1C1E]/98 border border-white/15 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">Delete Message?</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                This will remove the message for everyone in the conversation.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmMessageId(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-neutral-300 bg-white/8 hover:bg-white/12 border border-white/10 transition-all cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteMessage}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/30 transition-all cursor-pointer active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {activeConversation && (
        <ContactProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          conversation={activeConversation}
          messages={messages}
          onStartAudioCall={() => handleStartCall("audio")}
          onStartVideoCall={() => handleStartCall("video")}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onClearChat={handleClearChat}
          onSetDisappearingTimer={handleSetDisappearingTimer}
        />
      )}

      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        contacts={conversations.map((c) => ({
          userId: c.participants?.find((p) => p !== currentUserId) || "",
          name: c.name,
          email: "",
          avatar: c.icon,
        })).filter((c) => c.userId)}
        onOpenContacts={() => {
          setIsGroupModalOpen(false);
          setIsContactModalOpen(true);
        }}
        onCreateGroup={handleCreateGroup}
      />

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          fetchContactsAndRequests();
          fetchConversations();
        }}
        onStartDirectChat={handleStartDirectChat}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        messages={messages}
        onSelectMessage={(msgId) => {
          handleJumpToMessage(msgId);
        }}
      />

      <ProfileSettingsModal
        isOpen={isMyProfileModalOpen}
        onClose={() => setIsMyProfileModalOpen(false)}
        currentUser={{
          name: currentUserName,
          email: session?.user?.email || "",
          avatar: currentUserAvatar,
          statusMessage: currentUserStatus,
        }}
        onProfileUpdated={(updated) => {
          setCustomProfile(updated);
          fetchConversations();
        }}
      />

      {/* WEBRTC CALL OVERLAY */}
      {activeCall && (
        <CallModal
          call={activeCall}
          currentUserId={currentUserId}
          onEndCall={handleEndCall}
          onAcceptCall={handleAcceptCall}
          onDeclineCall={handleDeclineCall}
        />
      )}
    </div>
  );
}
