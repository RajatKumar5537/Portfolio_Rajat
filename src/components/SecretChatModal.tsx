"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  X, Send, Reply, Pencil, Trash2, Shield, User, 
  Sparkles, RefreshCw, Check, Ban, Smile, Copy, CheckCheck,
  Users, ChevronDown, UserCheck, UserPlus, UserMinus, Bell, Lock, Delete, Info,
  Paperclip, Image as ImageIcon, Film, Download, Loader2, CornerDownRight,
  Search, Phone, PhoneCall, PhoneIncoming, PhoneOff, Mic, MicOff, Volume2, ArrowLeft,
  UserX, Clock, AlertTriangle, Video, VideoOff, Settings, ShieldCheck, Mail
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
  mediaType?: "image" | "video" | null;
  mediaData?: string | null;
  mediaName?: string | null;
  replyTo?: ReplyToData | null;
  isRead: boolean;
  isDelivered?: boolean;
  deliveredAt?: string | null;
  readAt?: string | null;
  isEdited: boolean;
  isDeleted?: boolean;
  retentionHours: number;
  createdAt: string;
}

interface AcceptedFriend {
  connectionId: string;
  partnerId: string;
  partnerName: string;
  partnerEmail?: string;
  roomId: string;
  retentionHours?: number;
  unreadCount?: number;
  lastMessage?: {
    text: string;
    sender: string;
    senderId: string;
    isMe: boolean;
    isRead: boolean;
    isDelivered: boolean;
    createdAt: string;
  } | null;
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
  userEmail?: string;
  userName: string;
  isTyping: boolean;
  isOnline: boolean;
  isMe: boolean;
  lastSeenAt: string | null;
}

interface CallSession {
  callId: string;
  callerId: string;
  callerName: string;
  recipientId: string;
  recipientName: string;
  roomId: string;
  callType: "audio" | "video";
  status: "calling" | "incoming" | "connected";
  isMuted: boolean;
  isVideoOff: boolean;
  durationSec: number;
}

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
      "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🤫", "🤥", "😶", "😐", 
      "😑", "😬", "🫠", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", 
      "😪", "😵", "😵‍💫", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", 
      "🤠", "😈", "👿", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖"
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
      "☕", "🍵", "🧋", "🍻", "🥂", "🍷", "🍕", "🍔", "🍟", "🌮", "🍣", "🍩", 
      "🍫", "🍿", "🥑", "🍎", "🍓", "🎂", "🏋️", "🏃", "🧘", "🚴", "🏊", "⚽", 
      "🏀", "🎮", "🎧", "🎬", "🚗", "✈️", "🏖️", "⛺"
    ]
  }
];

function formatWhatsAppTime(dateString?: string | null) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0 && d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function cleanPreviewText(rawText?: string | null): string {
  if (!rawText) return "";
  const trimmed = rawText.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed.text || (parsed.mediaType === "image" ? "📷 Photo" : parsed.mediaType === "video" ? "🎥 Video" : trimmed);
    } catch (_) {
      return trimmed;
    }
  }
  return trimmed;
}

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
  const currentSender = customName.trim() || accountName;

  // Connections state (Friend Request / Accept model)
  const [acceptedFriends, setAcceptedFriends] = useState<AcceptedFriend[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<PendingIncomingRequest[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<PendingOutgoingRequest[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<AcceptedFriend | null>(null);
  const selectedFriendRef = useRef<AcceptedFriend | null>(null);
  selectedFriendRef.current = selectedFriend;

  // WhatsApp Layout States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "requests">("all");
  const [mobileView, setMobileView] = useState<"list" | "chat">("chat");
  const mobileViewRef = useRef<"list" | "chat">(mobileView);
  mobileViewRef.current = mobileView;
  
  // UI Panels
  const [showAddFriendForm, setShowAddFriendForm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const showProfileModalRef = useRef(showProfileModal);
  showProfileModalRef.current = showProfileModal;
  const [requestEmailInput, setRequestEmailInput] = useState("");
  const [requestStatusMsg, setRequestStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [retentionHours, setRetentionHours] = useState<number>(24);
  const [replyingTo, setReplyingTo] = useState<ReplyToData | null>(null);
  
  // Online presence & typing state
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const isTypingRef = useRef<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Mobile Tap-to-Action Menu state
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Copy message state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Message Info Modal state
  const [selectedInfoMsg, setSelectedInfoMsg] = useState<MessageItem | null>(null);

  // Photo & Video Sharing state
  const [stagedMedia, setStagedMedia] = useState<{
    type: "image" | "video";
    dataUrl: string;
    name: string;
  } | null>(null);
  const [isCompressingMedia, setIsCompressingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<{
    type: "image" | "video";
    url: string;
    name?: string;
    msgId?: string;
    isMe?: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WebRTC Voice & Video Calling State & References
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const activeCallRef = useRef<CallSession | null>(null);
  activeCallRef.current = activeCall;

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const processedCandidatesRef = useRef<Set<string>>(new Set());
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const attachMediaStreams = useCallback(() => {
    if (localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play().catch(() => {});
      }
    }
    if (remoteAudioRef.current && remoteStreamRef.current) {
      if (remoteAudioRef.current.srcObject !== remoteStreamRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    if (activeCall?.status === "connected") {
      attachMediaStreams();
      const interval = setInterval(attachMediaStreams, 800);
      return () => clearInterval(interval);
    }
  }, [activeCall?.status, activeCall?.callType, attachMediaStreams]);

  // Ref anchors for stable callback references across renders
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onMessagesReadRef = useRef(onMessagesRead);
  onMessagesReadRef.current = onMessagesRead;

  // Visual Viewport tracking for mobile keyboard with background body locking
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportTop, setViewportTop] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const updateViewport = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
        setViewportTop(0);
      } else {
        setViewportHeight(window.innerHeight);
        setViewportTop(0);
      }
    };

    updateViewport();
    window.visualViewport?.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("scroll", updateViewport);

    return () => {
      document.body.style.overflow = originalOverflow || "";
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
    };
  }, [isOpen]);

  // Handle mobile browser back button to close chat modal gracefully without leaving page
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    let isPushed = false;
    if (!window.history.state?.secretChatModal) {
      const stateObj = { ...(window.history.state || {}), secretChatModal: true };
      window.history.pushState(stateObj, "");
      isPushed = true;
    }

    const handlePopState = () => {
      if (showProfileModalRef.current) {
        setShowProfileModal(false);
      } else if (mobileViewRef.current === "chat") {
        setMobileView("list");
      } else {
        onCloseRef.current();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (isPushed && window.history.state?.secretChatModal) {
        try {
          window.history.back();
        } catch (_) {}
      }
    };
  }, [isOpen]);

  // Universal Gesture Swipe for Laptop (Mouse / Trackpad) and Mobile (Touch)
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const pointerStartXRef = useRef<number>(0);
  const pointerStartYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, msgId: string) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerStartXRef.current = e.clientX;
    pointerStartYRef.current = e.clientY;
    isDraggingRef.current = false;
    activePointerIdRef.current = e.pointerId;
    setSwipingId(msgId);
    setSwipeOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipingId || activePointerIdRef.current !== e.pointerId) return;
    const deltaX = e.clientX - pointerStartXRef.current;
    const deltaY = e.clientY - pointerStartYRef.current;

    if (!isDraggingRef.current) {
      if (Math.abs(deltaX) > 5 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isDraggingRef.current = true;
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch (_) {}
      } else if (Math.abs(deltaY) > 6) {
        return;
      }
    }

    if (isDraggingRef.current) {
      e.preventDefault();
      const damped = deltaX > 0 ? Math.min(80, deltaX * 0.8) : Math.max(-80, deltaX * 0.8);
      setSwipeOffset(damped);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>, msg: MessageItem) => {
    if (swipingId === msg._id && isDraggingRef.current) {
      const isMe = msg.senderId === currentUserId || msg.sender.toLowerCase() === currentSender.toLowerCase();

      if (isMe) {
        if (swipeOffset < -35) {
          setReplyingTo({ id: msg._id, sender: msg.sender, text: msg.text || (msg.mediaType === "image" ? "📷 Photo" : "🎥 Video") });
          focusInput();
        } else if (swipeOffset > 35) {
          setActiveActionMenuId((prev) => (prev === msg._id ? null : msg._id));
        }
      } else {
        if (swipeOffset > 35) {
          setReplyingTo({ id: msg._id, sender: msg.sender, text: msg.text || (msg.mediaType === "image" ? "📷 Photo" : "🎥 Video") });
          focusInput();
        } else if (swipeOffset < -35) {
          setActiveActionMenuId((prev) => (prev === msg._id ? null : msg._id));
        }
      }
    }

    try {
      if (activePointerIdRef.current !== null) {
        (e.currentTarget as HTMLElement).releasePointerCapture(activePointerIdRef.current);
      }
    } catch (_) {}

    activePointerIdRef.current = null;
    isDraggingRef.current = false;
    setSwipingId(null);
    setSwipeOffset(0);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (activePointerIdRef.current !== null) {
        (e.currentTarget as HTMLElement).releasePointerCapture(activePointerIdRef.current);
      }
    } catch (_) {}
    activePointerIdRef.current = null;
    isDraggingRef.current = false;
    setSwipingId(null);
    setSwipeOffset(0);
  };

  // Quick Emoji Picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState<string>("smileys");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatFeedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (smooth = true) => {
    if (chatFeedRef.current) {
      if (smooth) {
        chatFeedRef.current.scrollTo({
          top: chatFeedRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
      }
    }
  };

  // Reply Jump & Highlight state
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  const handleJumpToMessage = (targetMsgId?: string, targetText?: string) => {
    let targetEl: HTMLElement | null = null;
    let foundId: string | null = null;

    if (targetMsgId) {
      targetEl = document.getElementById(`chat-msg-${targetMsgId}`);
      if (targetEl) foundId = targetMsgId;
    }

    if (!targetEl && targetText) {
      const match = messages.find(
        (m) => m.text === targetText || (m.mediaName && targetText.includes(m.mediaName))
      );
      if (match) {
        targetEl = document.getElementById(`chat-msg-${match._id}`);
        foundId = match._id;
      }
    }

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      if (foundId) {
        setHighlightedMsgId(foundId);
        setTimeout(() => {
          setHighlightedMsgId((prev) => (prev === foundId ? null : prev));
        }, 2200);
      }
    }
  };

  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stop Ringtone Loop
  const stopRingtone = useCallback(() => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  }, []);

  // Web Audio Ringtone Synthesizer Burst
  const playSingleRingtoneBurst = useCallback((type: "outgoing" | "incoming") => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === "outgoing") {
        // Outgoing classic soft dual-frequency ringback tone (440Hz + 480Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.setValueAtTime(0.08, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.4);
        osc2.stop(now + 1.4);
      } else {
        // Incoming melodic chime ringtone (Pleasant WhatsApp / iPhone style arpeggio)
        const notes = [
          { freq: 659.25, time: 0.00, dur: 0.12 }, // E5
          { freq: 830.61, time: 0.13, dur: 0.12 }, // G#5
          { freq: 987.77, time: 0.26, dur: 0.12 }, // B5
          { freq: 1318.51, time: 0.39, dur: 0.22 }, // E6
          { freq: 987.77, time: 0.65, dur: 0.12 }, // B5
          { freq: 1318.51, time: 0.78, dur: 0.35 }, // E6
        ];

        notes.forEach(({ freq, time, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + time);

          gain.gain.setValueAtTime(0.18, now + time);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + time);
          osc.stop(now + time + dur);
        });

        // Secondary echoing chime in the second half of the burst
        const echoNotes = [
          { freq: 659.25, time: 1.15, dur: 0.12 },
          { freq: 830.61, time: 1.28, dur: 0.12 },
          { freq: 987.77, time: 1.41, dur: 0.12 },
          { freq: 1318.51, time: 1.54, dur: 0.38 },
        ];

        echoNotes.forEach(({ freq, time, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + time);

          gain.gain.setValueAtTime(0.16, now + time);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + time);
          osc.stop(now + time + dur);
        });
      }
    } catch (_) {}
  }, []);

  // Continuous Ringtone Scheduler
  const startRingtone = useCallback((type: "outgoing" | "incoming") => {
    stopRingtone();
    playSingleRingtoneBurst(type);
    const intervalTime = type === "incoming" ? 2600 : 3500;
    ringtoneIntervalRef.current = setInterval(() => {
      playSingleRingtoneBurst(type);
    }, intervalTime);
  }, [stopRingtone, playSingleRingtoneBurst]);

  // Reactive Ringtone Controller: Rings continuously when incoming or calling, stops when connected/ended
  useEffect(() => {
    if (activeCall?.status === "incoming") {
      startRingtone("incoming");
    } else if (activeCall?.status === "calling") {
      startRingtone("outgoing");
    } else {
      stopRingtone();
    }
    return () => {
      stopRingtone();
    };
  }, [activeCall?.status, startRingtone, stopRingtone]);

  // Stop WebRTC and reset call states
  const cleanupCall = useCallback(() => {
    stopRingtone();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    syncPresence(false);
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    processedCandidatesRef.current.clear();
    setActiveCall(null);
  }, [stopRingtone]);

  // Fetch 1-on-1 messages strictly isolated by connection room
  const fetchMessagesForPartner = useCallback(async (friend: AcceptedFriend | null, markRead = true) => {
    if (!friend || (!friend.partnerId && !friend.roomId && !friend.connectionId)) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const queryParams = new URLSearchParams();
      if (friend.connectionId) queryParams.set("connectionId", friend.connectionId);
      if (friend.roomId) queryParams.set("roomId", friend.roomId);
      if (friend.partnerId) queryParams.set("recipientId", friend.partnerId);
      queryParams.set("markRead", markRead ? "true" : "false");

      const res = await fetch(`/api/chat/messages?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
          if (markRead && onMessagesReadRef.current) {
            onMessagesReadRef.current();
          }
        }
      }
    } catch (err) {
      console.error("Error fetching 1-on-1 messages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
          if (prev && accepted.some((p) => p.connectionId === prev.connectionId)) {
            const current = accepted.find((p) => p.connectionId === prev.connectionId);
            if (current) {
              if (
                current.unreadCount === prev.unreadCount &&
                current.partnerName === prev.partnerName &&
                current.retentionHours === prev.retentionHours &&
                current.lastMessage?.text === prev.lastMessage?.text
              ) {
                return prev;
              }
              return current;
            }
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
  const syncPresence = useCallback(async (isTypingState?: boolean) => {
    try {
      const typingVal = typeof isTypingState === "boolean" ? isTypingState : isTypingRef.current;
      await fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isTyping: typingVal,
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

  // Voice & Video Call Signaling Poller
  const checkIncomingAndCallStatus = useCallback(async () => {
    try {
      const currentCall = activeCallRef.current;

      if (currentCall) {
        const res = await fetch(`/api/chat/call?callId=${currentCall.callId}`);
        if (res.ok) {
          const data = await res.json();
          const callData = data.call;
          if (callData) {
            if (callData.status === "declined" || callData.status === "ended" || callData.status === "missed") {
              cleanupCall();
              if (selectedFriendRef.current) {
                fetchMessagesForPartner(selectedFriendRef.current, true);
              }
            } else if (callData.status === "accepted" && currentCall.status === "calling" && callData.answer) {
              const pc = peerConnectionRef.current;
              if (pc && pc.signalingState !== "stable") {
                try {
                  const sdpAnswer = JSON.parse(callData.answer);
                  await pc.setRemoteDescription(new RTCSessionDescription(sdpAnswer));
                  setActiveCall((prev) => (prev ? { ...prev, status: "connected" } : null));
                  setTimeout(attachMediaStreams, 100);
                } catch (e) {
                  console.error("Error setting remote SDP answer:", e);
                }
              }
            }

            // Ingest new remote ICE candidates
            const pc = peerConnectionRef.current;
            if (pc && pc.remoteDescription) {
              const isCaller = currentCall.callerId === currentUserId;
              const remoteCandidates = isCaller ? callData.recipientCandidates : callData.callerCandidates;
              if (remoteCandidates && Array.isArray(remoteCandidates)) {
                for (const candStr of remoteCandidates) {
                  if (!processedCandidatesRef.current.has(candStr)) {
                    processedCandidatesRef.current.add(candStr);
                    try {
                      await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candStr)));
                    } catch (e) {
                      console.error("Error adding remote ICE candidate:", e);
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        const res = await fetch("/api/chat/call");
        if (res.ok) {
          const data = await res.json();
          if (data.incomingCall && data.incomingCall.status === "ringing") {
            const inc = data.incomingCall;
            setActiveCall({
              callId: inc._id,
              callerId: inc.callerId,
              callerName: inc.callerName,
              recipientId: inc.recipientId,
              recipientName: inc.recipientName,
              roomId: inc.roomId,
              callType: inc.callType === "video" ? "video" : "audio",
              status: "incoming",
              isMuted: false,
              isVideoOff: false,
              durationSec: 0,
            });
          }
        }
      }
    } catch (err) {
      console.error("Call status check error:", err);
    }
  }, [cleanupCall, fetchMessagesForPartner, attachMediaStreams, currentUserId]);

  // Initiate Outgoing WebRTC Call (Voice or Video)
  const handleStartCall = async (type: "audio" | "video") => {
    if (!selectedFriend || activeCall) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    syncPresence(false);

    try {
      const isVideo = type === "video";
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
      });
      localStreamRef.current = stream;
      remoteStreamRef.current = new MediaStream();
      processedCandidatesRef.current.clear();

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302"] }
        ]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((t) => {
            if (!remoteStreamRef.current?.getTracks().some((x) => x.id === t.id)) {
              remoteStreamRef.current?.addTrack(t);
            }
          });
        } else if (event.track) {
          if (!remoteStreamRef.current.getTracks().some((x) => x.id === event.track.id)) {
            remoteStreamRef.current.addTrack(event.track);
          }
        }
        attachMediaStreams();
      };

      let pendingCandidates: any[] = [];
      let callSessionId: string | null = null;

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          if (callSessionId) {
            try {
              await fetch("/api/chat/call", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  callId: callSessionId,
                  action: "ice-candidate",
                  candidate: JSON.stringify(event.candidate),
                }),
              });
            } catch (_) {}
          } else {
            pendingCandidates.push(event.candidate);
          }
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const res = await fetch("/api/chat/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: selectedFriend.partnerId,
          recipientName: selectedFriend.partnerName,
          recipientEmail: selectedFriend.partnerEmail,
          callType: type,
          offer: JSON.stringify(pc.localDescription || offer),
          candidates: pendingCandidates,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        callSessionId = data.callId;
        setActiveCall({
          callId: data.callId,
          callerId: currentUserId,
          callerName: currentSender,
          recipientId: selectedFriend.partnerId,
          recipientName: selectedFriend.partnerName,
          roomId: data.call.roomId,
          callType: type,
          status: "calling",
          isMuted: false,
          isVideoOff: false,
          durationSec: 0,
        });

        if (pendingCandidates.length > 0) {
          for (const cand of pendingCandidates) {
            try {
              await fetch("/api/chat/call", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  callId: data.callId,
                  action: "ice-candidate",
                  candidate: JSON.stringify(cand),
                }),
              });
            } catch (_) {}
          }
        }
      }
    } catch (err: any) {
      alert(`${type === "video" ? "Camera and Microphone" : "Microphone"} access is required: ` + (err.message || err));
      cleanupCall();
    }
  };

  // Accept Incoming WebRTC Call
  const handleAcceptCall = async () => {
    if (!activeCall) return;

    try {
      const isVideo = activeCall.callType === "video";
      const callRes = await fetch(`/api/chat/call?callId=${activeCall.callId}`);
      const callData = (await callRes.json()).call;
      if (!callData || !callData.offer) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
      });
      localStreamRef.current = stream;
      remoteStreamRef.current = new MediaStream();
      processedCandidatesRef.current.clear();

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302"] }
        ]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((t) => {
            if (!remoteStreamRef.current?.getTracks().some((x) => x.id === t.id)) {
              remoteStreamRef.current?.addTrack(t);
            }
          });
        } else if (event.track) {
          if (!remoteStreamRef.current.getTracks().some((x) => x.id === event.track.id)) {
            remoteStreamRef.current.addTrack(event.track);
          }
        }
        attachMediaStreams();
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate && activeCallRef.current?.callId) {
          try {
            await fetch("/api/chat/call", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                callId: activeCallRef.current.callId,
                action: "ice-candidate",
                candidate: JSON.stringify(event.candidate),
              }),
            });
          } catch (_) {}
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(callData.offer)));

      if (callData.callerCandidates && Array.isArray(callData.callerCandidates)) {
        for (const candStr of callData.callerCandidates) {
          if (!processedCandidatesRef.current.has(candStr)) {
            processedCandidatesRef.current.add(candStr);
            try {
              await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candStr)));
            } catch (_) {}
          }
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await new Promise((resolve) => setTimeout(resolve, 300));

      await fetch("/api/chat/call", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId: activeCall.callId,
          action: "answer",
          answer: JSON.stringify(pc.localDescription || answer),
        }),
      });

      setActiveCall((prev) => (prev ? { ...prev, status: "connected" } : null));
      setTimeout(attachMediaStreams, 100);

      const matchingFriend = acceptedFriends.find(
        (f) => f.partnerId === activeCall.callerId || f.partnerName.toLowerCase() === activeCall.callerName.toLowerCase()
      );
      if (matchingFriend) {
        setSelectedFriend(matchingFriend);
      }
    } catch (err: any) {
      console.error("Error accepting call:", err);
      cleanupCall();
    }
  };

  // Decline Incoming Call
  const handleDeclineCall = async () => {
    if (!activeCall) return;
    const callId = activeCall.callId;
    cleanupCall();
    try {
      await fetch("/api/chat/call", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, action: "decline" }),
      });
      if (selectedFriendRef.current) {
        fetchMessagesForPartner(selectedFriendRef.current, true);
      }
    } catch (_) {}
  };

  // End Active Call
  const handleEndCall = async () => {
    if (!activeCall) return;
    const callId = activeCall.callId;
    const duration = activeCall.durationSec;
    cleanupCall();
    try {
      await fetch("/api/chat/call", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, action: "end", durationSec: duration }),
      });
      if (selectedFriendRef.current) {
        fetchMessagesForPartner(selectedFriendRef.current, true);
      }
    } catch (_) {}
  };

  // Toggle Microphone Mute
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setActiveCall((prev) => (prev ? { ...prev, isMuted: !audioTrack.enabled } : null));
      }
    }
  };

  // Toggle Camera in Video Call
  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setActiveCall((prev) => (prev ? { ...prev, isVideoOff: !videoTrack.enabled } : null));
      }
    }
  };

  // Active call duration counter
  useEffect(() => {
    if (activeCall?.status === "connected") {
      callTimerRef.current = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, durationSec: prev.durationSec + 1 } : null));
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [activeCall?.status]);

  // Main polling interval
  useEffect(() => {
    if (!isOpen) return;

    fetchConnections();
    syncPresence(false);
    checkIncomingAndCallStatus();

    let messageInterval: NodeJS.Timeout;
    let presenceInterval: NodeJS.Timeout;
    let connectionInterval: NodeJS.Timeout;
    let callInterval: NodeJS.Timeout;

    const startIntervals = () => {
      const isVisible = typeof document !== "undefined" && document.visibilityState === "visible";
      const msgFreq = isVisible ? 600 : 4000;
      const presFreq = isVisible ? 1200 : 5000;
      const connFreq = isVisible ? 2500 : 8000;
      const callFreq = isVisible ? 1000 : 3000;

      clearInterval(messageInterval);
      clearInterval(presenceInterval);
      clearInterval(connectionInterval);
      clearInterval(callInterval);

      messageInterval = setInterval(() => {
        if (selectedFriendRef.current) {
          fetchMessagesForPartner(selectedFriendRef.current, true);
        }
      }, msgFreq);

      presenceInterval = setInterval(() => {
        syncPresence();
      }, presFreq);

      connectionInterval = setInterval(() => {
        fetchConnections();
      }, connFreq);

      callInterval = setInterval(() => {
        checkIncomingAndCallStatus();
      }, callFreq);
    };

    startIntervals();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchConnections();
        if (selectedFriendRef.current) {
          fetchMessagesForPartner(selectedFriendRef.current, true);
        }
        syncPresence();
        checkIncomingAndCallStatus();
      }
      startIntervals();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showProfileModalRef.current) {
          setShowProfileModal(false);
        } else {
          onCloseRef.current();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(messageInterval);
      clearInterval(presenceInterval);
      clearInterval(connectionInterval);
      clearInterval(callInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, fetchConnections, fetchMessagesForPartner, syncPresence, checkIncomingAndCallStatus]);

  // When selected friend changes, reload messages and retention
  useEffect(() => {
    if (isOpen && selectedFriend) {
      if (selectedFriend.retentionHours !== undefined) {
        setRetentionHours(selectedFriend.retentionHours);
      }
      setLoading(true);
      fetchMessagesForPartner(selectedFriend, true);
    }
  }, [selectedFriend?.connectionId, isOpen, fetchMessagesForPartner]);

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
    const val = e.target.value;
    setInputText(val);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (!val.trim()) {
      isTypingRef.current = false;
      syncPresence(false);
      return;
    }

    isTypingRef.current = true;
    syncPresence(true);

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      syncPresence(false);
    }, 2000);
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleBackspaceEmoji = () => {
    setInputText((prev) => {
      const chars = Array.from(prev);
      chars.pop();
      return chars.join("");
    });
    setTimeout(() => inputRef.current?.focus(), 10);
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
        const connRes = await fetch("/api/chat/connections");
        if (connRes.ok) {
          const data = await connRes.json();
          const accepted: AcceptedFriend[] = data.accepted || [];
          setAcceptedFriends(accepted);
          setPendingIncoming(data.pendingIncoming || []);
          setPendingOutgoing(data.pendingOutgoing || []);

          if (action === "accept") {
            const newlyAccepted = accepted.find((f) => f.connectionId === connectionId) || accepted[accepted.length - 1];
            if (newlyAccepted) {
              setSelectedFriend(newlyAccepted);
              setMobileView("chat");
            }
          }
        }
        if (onMessagesReadRef.current) onMessagesReadRef.current();
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
        setShowProfileModal(false);
        if (selectedFriend?.connectionId === connectionId) {
          setSelectedFriend(null);
          setMessages([]);
          setMobileView("list");
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

  const compressImage = (file: File): Promise<{ dataUrl: string; name: string }> => {
    return new Promise((resolve) => {
      const processImageElement = (img: HTMLImageElement, cleanupUrl?: string) => {
        try {
          const canvas = document.createElement("canvas");
          const maxDimension = 1280;
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width || 800;
          canvas.height = height || 600;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            fallbackFileReader();
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL("image/jpeg", 0.78);
          if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
          resolve({ dataUrl: compressed, name: file.name });
        } catch (_) {
          fallbackFileReader();
        }
      };

      const fallbackFileReader = () => {
        const reader = new FileReader();
        reader.onload = () => resolve({ dataUrl: reader.result as string, name: file.name });
        reader.onerror = () => resolve({ dataUrl: "", name: file.name });
        reader.readAsDataURL(file);
      };

      try {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => processImageElement(img, objectUrl);
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          fallbackFileReader();
        };
        img.src = objectUrl;
      } catch (_) {
        fallbackFileReader();
      }
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    setMediaError(null);

    const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic|heif|bmp|svg)$/i.test(file.name) || file.type === "";
    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|3gp)$/i.test(file.name);

    if (!isImage && !isVideo) {
      setMediaError("Only image and video files are supported.");
      return;
    }

    if (isVideo && file.size > 15 * 1024 * 1024) {
      setMediaError("Video exceeds 15MB limit. Please select a shorter video.");
      return;
    }

    setIsCompressingMedia(true);
    try {
      if (isImage) {
        const compressed = await compressImage(file);
        if (compressed.dataUrl) {
          setStagedMedia({
            type: "image",
            dataUrl: compressed.dataUrl,
            name: compressed.name,
          });
        }
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setStagedMedia({
            type: "video",
            dataUrl: ev.target?.result as string,
            name: file.name,
          });
          setIsCompressingMedia(false);
        };
        reader.onerror = () => {
          setMediaError("Failed to read video file");
          setIsCompressingMedia(false);
        };
        reader.readAsDataURL(file);
        return;
      }
    } catch (err: any) {
      setMediaError(err.message || "Failed to process media file");
    } finally {
      setIsCompressingMedia(false);
      focusInput();
    }
  };

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  };

  // Send message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !stagedMedia) || !selectedFriend || sending) {
      focusInput();
      return;
    }

    const currentPartner = selectedFriend;
    const textToSend = inputText.trim();
    const replyToSend = replyingTo;
    const mediaToSend = stagedMedia;

    setInputText("");
    setReplyingTo(null);
    setStagedMedia(null);
    setSending(true);

    focusInput();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    syncPresence(false);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: currentSender,
          recipientId: currentPartner.partnerId,
          connectionId: currentPartner.connectionId,
          roomId: currentPartner.roomId,
          text: textToSend,
          mediaType: mediaToSend?.type || null,
          mediaData: mediaToSend?.dataUrl || null,
          mediaName: mediaToSend?.name || null,
          replyTo: replyToSend,
          retentionHours,
        }),
      });

      if (res.ok) {
        await fetchMessagesForPartner(currentPartner, true);
        await fetchConnections();
        scrollToBottom(false);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
      focusInput();
    }
  };

  // Edit sent message
  const handleSaveEdit = async (msgId: string) => {
    if (!editText.trim() || !selectedFriend) return;

    try {
      const res = await fetch("/api/chat/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: msgId,
          text: editText.trim(),
        }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditText("");
        if (typeof window !== "undefined") {
          window.scrollTo(0, 0);
          document.documentElement.scrollLeft = 0;
          document.body.scrollLeft = 0;
        }
        await fetchMessagesForPartner(selectedFriend, true);
        await fetchConnections();
      }
    } catch (err) {
      console.error("Error updating message:", err);
    }
  };

  // Delete a single message for everyone
  const handleDeleteSingleMessage = async (msgId: string) => {
    if (!confirm("Delete this message for everyone?")) return;
    try {
      const res = await fetch(`/api/chat/messages?id=${msgId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedFriend) {
          await fetchMessagesForPartner(selectedFriend, true);
          await fetchConnections();
        }
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // Clear conversation for me
  const handleClearAll = async () => {
    if (!selectedFriend || !confirm(`Clear all messages in your conversation with ${selectedFriend.partnerName}?`)) return;

    try {
      const queryParams = new URLSearchParams({
        clearAll: "true",
        connectionId: selectedFriend.connectionId,
        roomId: selectedFriend.roomId,
        recipientId: selectedFriend.partnerId,
      });

      const res = await fetch(`/api/chat/messages?${queryParams.toString()}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages([]);
        await fetchConnections();
        setShowProfileModal(false);
      }
    } catch (err) {
      console.error("Error clearing chat:", err);
    }
  };

  // Update disappearing message retention (0 = Off / Keep forever, 12 = 12h, 24 = 24h, 168 = 7d)
  const handleUpdateRetention = async (hours: number) => {
    if (!selectedFriend) return;
    setRetentionHours(hours);

    try {
      await fetch("/api/chat/connections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: selectedFriend.connectionId,
          retentionHours: hours,
        }),
      });
      await fetchConnections();
    } catch (err) {
      console.error("Error updating retention:", err);
    }
  };

  // Robust Presence & Last Seen matcher for any partner
  const getPartnerPresence = useCallback(
    (partner: { partnerId?: string; partnerName: string; partnerEmail?: string } | null) => {
      if (!partner) return null;
      const pEmail = partner.partnerEmail?.toLowerCase().trim();
      const pName = partner.partnerName.toLowerCase().trim();
      const pId = partner.partnerId;

      return (
        activeUsers.find((u) => {
          if (u.isMe) return false;
          const uEmail = u.userEmail?.toLowerCase().trim();
          const uName = u.userName.toLowerCase().trim();

          // 1. Match by verified user email
          if (pEmail && uEmail && pEmail === uEmail) return true;
          // 2. Match by direct user ID
          if (pId && u.userId === pId) return true;
          // 3. Match if userId is the email
          if (pEmail && u.userId.toLowerCase() === pEmail) return true;
          // 4. Match by name
          if (pName && uName && (pName === uName || uName.includes(pName) || pName.includes(uName))) return true;
          return false;
        }) || null
      );
    },
    [activeUsers]
  );

  const friendPresence = getPartnerPresence(selectedFriend);
  const isFriendOnline = friendPresence?.isOnline ?? false;
  const myPresence = activeUsers.find((u) => u.isMe);

  const formatLastSeen = (dateInput?: string | Date | null) => {
    if (!dateInput) return "offline";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "offline";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (diffMinutes < 1) {
      return "just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (now.toDateString() === date.toDateString()) {
      return `today at ${timeStr}`;
    } else {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (yesterday.toDateString() === date.toDateString()) {
        return `yesterday at ${timeStr}`;
      } else {
        const monthDay = date.toLocaleDateString([], { month: "short", day: "numeric" });
        return `${monthDay} at ${timeStr}`;
      }
    }
  };

  // Filter friends list
  const filteredFriends = acceptedFriends.filter((friend) => {
    const matchesSearch = friend.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) || (friend.partnerEmail && friend.partnerEmail.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (activeTab === "unread") {
      return (friend.unreadCount || 0) > 0;
    }
    return true;
  });

  const totalUnreadAll = acceptedFriends.reduce((sum, f) => sum + (f.unreadCount || 0), 0);
  const totalPendingRequests = pendingIncoming.length + pendingOutgoing.length;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden w-full max-w-full overflow-x-hidden"
      style={
        viewportHeight && typeof window !== "undefined" && window.innerWidth < 640
          ? {
              height: `${viewportHeight}px`,
              top: 0,
              bottom: "auto",
              left: 0,
              right: 0,
              position: "fixed",
            }
          : undefined
      }
    >
      {/* Hidden audio element for remote WebRTC audio stream */}
      <audio ref={remoteAudioRef} autoPlay />

      <div 
        className="w-full max-w-full sm:max-w-5xl md:max-w-6xl bg-[#030308]/98 backdrop-blur-2xl border-0 sm:border border-white/10 sm:rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_40px_rgba(20,184,166,0.12)] light:bg-white light:border-slate-200 light:shadow-2xl overflow-hidden overflow-x-hidden flex flex-row h-full sm:h-[680px] sm:max-h-[92vh] relative font-sans transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* LEFT SIDEBAR: WhatsApp Web Contact List (Chats, Search, Tabs) */}
        {/* ========================================================= */}
        <div 
          className={`w-full sm:w-[300px] md:w-[330px] lg:w-[360px] border-r border-white/10 flex flex-col flex-shrink-0 bg-[#070712] light:bg-[#f0f2f5] light:border-slate-200 transition-all ${
            mobileView === "chat" ? "hidden sm:flex" : "flex"
          }`}
        >
          {/* Sidebar Top Header */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-white/10 bg-[#0a0a1a] light:bg-[#f0f2f5] light:border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                  {currentSender.slice(0, 2).toUpperCase()}
                </div>
                {myPresence?.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#070712] light:border-white shadow-sm"></span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate light:text-slate-900">Chats</h3>
                <p className="text-[10px] text-teal-400 font-mono font-medium truncate light:text-teal-600 flex items-center gap-1">
                  <Lock size={10} /> AES-256 E2EE
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Add / Connect Friend Button */}
              <button
                type="button"
                onClick={() => setShowAddFriendForm(!showAddFriendForm)}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs active:scale-95 touch-manipulation ${
                  showAddFriendForm
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-white/[0.07] border border-white/10 text-slate-200 hover:bg-white/15 light:bg-slate-200 light:border-slate-300 light:text-slate-700"
                }`}
                title="New Chat (Add Friend by Email)"
              >
                <UserPlus size={15} />
              </button>

              {/* Close Modal (Mobile / Desktop) */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/[0.07] border border-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-all cursor-pointer light:bg-slate-200 light:border-slate-300 light:text-slate-700 light:hover:text-red-600 active:scale-95 touch-manipulation"
                title="Close (Esc)"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-2.5 border-b border-white/5 bg-[#05050e] light:bg-white light:border-slate-200 flex-shrink-0">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-slate-400 light:text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or start a new chat"
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-base sm:text-xs text-white placeholder-slate-500 outline-none focus:border-teal-500 light:bg-slate-100 light:border-slate-200 light:text-slate-900 light:placeholder-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-slate-400 hover:text-white text-xs cursor-pointer light:hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs: All / Unread / Requests */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer touch-manipulation active:scale-95 ${
                  activeTab === "all"
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 light:bg-teal-600 light:text-white"
                    : "bg-white/[0.04] text-slate-400 hover:text-white light:bg-slate-100 light:text-slate-600 light:hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("unread")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 touch-manipulation active:scale-95 ${
                  activeTab === "unread"
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 light:bg-teal-600 light:text-white"
                    : "bg-white/[0.04] text-slate-400 hover:text-white light:bg-slate-100 light:text-slate-600 light:hover:bg-slate-200"
                }`}
              >
                <span>Unread</span>
                {totalUnreadAll > 0 && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-bold flex items-center justify-center">
                    {totalUnreadAll}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("requests")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 touch-manipulation active:scale-95 ${
                  activeTab === "requests"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 light:bg-amber-600 light:text-white"
                    : "bg-white/[0.04] text-slate-400 hover:text-white light:bg-slate-100 light:text-slate-600 light:hover:bg-slate-200"
                }`}
              >
                <span>Requests</span>
                {totalPendingRequests > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {totalPendingRequests}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Add Friend Form Dropdown */}
          {showAddFriendForm && (
            <div className="p-3 bg-[#0c0c1e] border-b border-white/10 flex-shrink-0 animate-in fade-in duration-150 light:bg-slate-100 light:border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider font-mono flex items-center gap-1">
                  <UserPlus size={12} /> Add Friend by Email
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddFriendForm(false)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSendConnectionRequest} className="space-y-2">
                <input
                  type="email"
                  value={requestEmailInput}
                  onChange={(e) => setRequestEmailInput(e.target.value)}
                  placeholder="friend@example.com..."
                  className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-3 py-2 text-base sm:text-xs text-white outline-none focus:border-teal-500 light:bg-white light:border-slate-300 light:text-slate-900"
                />
                <button
                  type="submit"
                  disabled={!requestEmailInput.trim() || isSubmittingRequest}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-98 touch-manipulation"
                >
                  {isSubmittingRequest ? "Sending Request..." : "Send Request"}
                </button>
                {requestStatusMsg && (
                  <div className={`text-[11px] p-2 rounded-lg ${requestStatusMsg.type === "success" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                    {requestStatusMsg.text}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Contacts & Pending Requests List Feed */}
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-white/5 light:divide-slate-200">
            {/* Incoming Requests Section */}
            {(activeTab === "requests" || (activeTab === "all" && pendingIncoming.length > 0)) && pendingIncoming.length > 0 && (
              <div className="p-2.5 bg-amber-500/[0.08] border-b border-amber-500/20 space-y-2 light:bg-amber-500/10">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                  <Bell size={12} className="animate-bounce" /> Friend Requests ({pendingIncoming.length})
                </div>
                {pendingIncoming.map((req) => (
                  <div key={req.connectionId} className="bg-black/40 light:bg-white p-2.5 rounded-xl border border-amber-500/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {req.requesterName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate light:text-slate-900">{req.requesterName}</h4>
                        <p className="text-[10px] text-slate-400 truncate light:text-slate-500">{req.requesterEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRespondRequest(req.connectionId, "accept")}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1 active:scale-98 touch-manipulation"
                      >
                        <Check size={12} /> Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespondRequest(req.connectionId, "decline")}
                        className="flex-1 py-1.5 bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1 light:bg-slate-200 light:text-slate-700 active:scale-98 touch-manipulation"
                      >
                        <X size={12} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Outgoing Pending Requests (in Requests Tab) */}
            {activeTab === "requests" && pendingOutgoing.length > 0 && (
              <div className="p-2.5 bg-indigo-500/[0.08] border-b border-indigo-500/20 space-y-2 light:bg-indigo-50">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
                  <Clock size={12} /> Sent Requests ({pendingOutgoing.length})
                </div>
                {pendingOutgoing.map((req) => (
                  <div key={req.connectionId} className="bg-black/40 light:bg-white p-2.5 rounded-xl border border-indigo-500/20 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate light:text-slate-900">{req.recipientName || req.recipientEmail}</h4>
                      <p className="text-[10px] text-slate-400 truncate light:text-slate-500">{req.recipientEmail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveConnection(req.connectionId, req.recipientName || req.recipientEmail, true)}
                      className="px-2 py-1 bg-red-500/15 hover:bg-red-500/30 text-red-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 active:scale-95 touch-manipulation"
                    >
                      <X size={11} /> Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Accepted Friends WhatsApp Chat Cards */}
            {activeTab !== "requests" && (
              <>
                {filteredFriends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                    <Users size={28} className="text-slate-500 light:text-slate-400" />
                    <p className="text-xs text-slate-400 light:text-slate-600">
                      {searchQuery ? "No contacts matching search" : "No friends connected yet"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddFriendForm(true)}
                      className="text-xs text-teal-400 font-bold hover:underline cursor-pointer active:scale-95 touch-manipulation"
                    >
                      + Connect with a friend
                    </button>
                  </div>
                ) : (
                  filteredFriends.map((p) => {
                    const isSelected = selectedFriend?.connectionId === p.connectionId;
                    const pPresence = getPartnerPresence(p);
                    const isPOnline = pPresence?.isOnline ?? false;
                    const isPTyping = pPresence?.isTyping ?? false;
                    const previewText = cleanPreviewText(p.lastMessage?.text);

                    return (
                      <div
                        key={p.connectionId}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedFriend(p);
                          setMobileView("chat");
                          fetchMessagesForPartner(p, true);
                        }}
                        className={`group flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-all border-b border-white/[0.04] light:border-slate-200/60 relative select-none touch-manipulation active:bg-white/[0.08] ${
                          isSelected
                            ? "bg-teal-500/15 border-l-4 border-l-teal-400 light:bg-slate-200"
                            : "hover:bg-white/[0.04] light:hover:bg-slate-100"
                        }`}
                      >
                        {/* Avatar + Online Indicator */}
                        <div className="relative flex-shrink-0">
                          <div className="w-11 h-11 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 font-bold text-sm flex items-center justify-center shadow-inner light:bg-teal-100 light:text-teal-700 light:border-teal-300">
                            {p.partnerName.slice(0, 2).toUpperCase()}
                          </div>
                          {isPOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#070712] light:border-white shadow-sm animate-pulse"></span>
                          )}
                        </div>

                        {/* Contact Info & Last Message Snippet */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className={`text-xs sm:text-sm font-bold truncate ${isSelected ? "text-teal-300 light:text-teal-900" : "text-slate-200 light:text-slate-900"}`}>
                              {p.partnerName}
                            </h4>
                            <span className="text-[10px] text-slate-400 light:text-slate-500 font-mono flex-shrink-0">
                              {p.lastMessage ? formatWhatsAppTime(p.lastMessage.createdAt) : ""}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1.5">
                            <p className="text-xs text-slate-400 truncate light:text-slate-600 flex items-center gap-1 min-w-0">
                              {isPTyping ? (
                                <span className="text-teal-400 font-bold animate-pulse light:text-teal-600">✍️ typing...</span>
                              ) : previewText ? (
                                <>
                                  {p.lastMessage?.isMe && (
                                    <span className={p.lastMessage?.isRead ? "text-teal-400" : "text-slate-500"}>
                                      <CheckCheck size={13} className="inline flex-shrink-0" />
                                    </span>
                                  )}
                                  <span className="truncate">{previewText}</span>
                                </>
                              ) : (
                                <span className="italic text-slate-500">No messages yet</span>
                              )}
                            </p>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {/* Unread Count Badge */}
                              {(p.unreadCount || 0) > 0 && (
                                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-black text-[10px] font-black flex items-center justify-center shadow-sm">
                                  {p.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANE: Active Conversation Window / Welcome Splash */}
        {/* ========================================================= */}
        <div 
          className={`flex-1 flex flex-col h-full bg-[#030308] light:bg-[#efeae2] relative min-w-0 ${
            mobileView === "list" ? "hidden sm:flex" : "flex"
          }`}
        >
          {!selectedFriend ? (
            /* WhatsApp Web Welcome Splash Screen on Desktop */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shadow-lg light:bg-teal-50 light:border-teal-200 light:text-teal-600">
                <Shield size={40} />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-lg font-bold text-white light:text-slate-900">Encrypted Secret Chat</h3>
                <p className="text-xs text-slate-400 leading-relaxed light:text-slate-600">
                  Select a contact from the sidebar or click <strong>+</strong> to start an end-to-end encrypted private conversation.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-teal-400 font-mono font-medium light:text-teal-700">
                  <Lock size={12} /> Disappearing Messages & E2EE Calling Enabled
                </div>
              </div>
            </div>
          ) : (
            /* Active 1-on-1 Chat Conversation */
            <>
              {/* Top Chat Header: Clean & Spacious */}
              <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-white/10 bg-[#070712]/90 backdrop-blur-xl light:bg-[#f0f2f5] light:border-slate-200 flex-shrink-0 pt-[max(0.625rem,env(safe-area-inset-top))] transition-colors">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileView("list");
                    }}
                    className="sm:hidden p-1.5 -ml-1 text-slate-300 hover:text-white cursor-pointer light:text-slate-700 active:scale-95 touch-manipulation"
                    title="Back to chats list"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  {/* Clickable Profile Section (Opens Contact Info Modal) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileModal(true);
                    }}
                    className="flex items-center gap-2.5 cursor-pointer group py-1 px-1.5 -mx-1.5 rounded-xl hover:bg-white/[0.06] light:hover:bg-slate-200/70 transition-all select-none touch-manipulation active:scale-[0.98] text-left border-0 bg-transparent"
                    title="View Contact Info, Disappearing Messages & Settings"
                  >
                    {/* Avatar & Online Presence */}
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 font-bold text-xs sm:text-sm shadow-inner flex items-center justify-center light:bg-teal-100 light:border-teal-300 light:text-teal-700">
                        {selectedFriend.partnerName.slice(0, 2).toUpperCase()}
                      </div>
                      {isFriendOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-[#070712] light:border-white shadow-sm"></span>
                      )}
                    </div>

                    {/* Contact Name & Live Status with chevron cue */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="text-xs sm:text-sm font-bold text-white truncate light:text-slate-900 group-hover:text-teal-300 light:group-hover:text-teal-700 transition-colors">
                          {selectedFriend.partnerName}
                        </h3>
                        <ChevronDown size={13} className="text-slate-400 group-hover:text-teal-300 transition-colors flex-shrink-0" />
                      </div>
                      <p className="text-[9px] sm:text-[10px] tracking-wide truncate mt-0.5">
                        {activeCall ? (
                          <span className="text-teal-400 font-bold flex items-center gap-1 light:text-teal-600 animate-pulse">
                            📞 {activeCall.status === "connected" ? "In Call" : activeCall.status === "calling" ? "Calling..." : "Incoming Call..."}
                          </span>
                        ) : friendPresence?.isTyping ? (
                          <span className="text-teal-400 font-bold flex items-center gap-1 animate-pulse light:text-teal-600">
                            ✍️ typing...
                          </span>
                        ) : isFriendOnline ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1 light:text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping flex-shrink-0"></span>
                            Online
                          </span>
                        ) : friendPresence?.lastSeenAt ? (
                          <span className="text-slate-400 truncate block light:text-slate-500">
                            last seen {formatLastSeen(friendPresence.lastSeenAt)}
                          </span>
                        ) : (
                          <span className="text-slate-400 truncate block light:text-slate-500">
                            {retentionHours > 0 ? `Disappearing • ${retentionHours}h` : "Encrypted Chat"}
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Header Right Action Buttons: Voice Call, Video Call, Details, Panic Close */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  {/* Voice Call Button */}
                  <button
                    type="button"
                    onClick={() => handleStartCall("audio")}
                    disabled={Boolean(activeCall)}
                    className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 touch-manipulation ${
                      activeCall && activeCall.callType === "audio"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-white/[0.07] border-white/10 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-400 light:bg-slate-200 light:border-slate-300 light:text-slate-700 light:hover:text-emerald-700 shadow-sm"
                    }`}
                    title="Start Encrypted Voice Call"
                  >
                    <Phone size={15} />
                    <span className="hidden md:inline text-xs font-bold">Audio</span>
                  </button>

                  {/* Video Call Button */}
                  <button
                    type="button"
                    onClick={() => handleStartCall("video")}
                    disabled={Boolean(activeCall)}
                    className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 touch-manipulation ${
                      activeCall && activeCall.callType === "video"
                        ? "bg-teal-500/20 text-teal-400 border-teal-500/40"
                        : "bg-white/[0.07] border-white/10 hover:bg-teal-500/20 text-slate-200 hover:text-teal-400 light:bg-slate-200 light:border-slate-300 light:text-slate-700 light:hover:text-teal-700 shadow-sm"
                    }`}
                    title="Start Encrypted Video Call"
                  >
                    <Video size={16} />
                    <span className="hidden md:inline text-xs font-bold">Video</span>
                  </button>

                  {/* Panic / Close Button */}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-white/[0.07] border border-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-all cursor-pointer light:bg-slate-200 light:border-slate-300 light:text-slate-700 active:scale-95 touch-manipulation ml-1"
                    title="Close (Esc)"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* In-Call Active Floating Overlay Bar (Audio / Video) */}
              {activeCall && (
                <div className="p-3 bg-gradient-to-r from-teal-950/95 via-emerald-950/95 to-teal-950/95 border-b border-teal-500/40 backdrop-blur-xl flex items-center justify-between gap-2 z-20 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center animate-bounce flex-shrink-0">
                      {activeCall.callType === "video" ? <Video size={16} /> : <PhoneCall size={16} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>
                          {activeCall.status === "calling"
                            ? `Calling ${activeCall.recipientName}...`
                            : activeCall.status === "incoming"
                            ? `Incoming ${activeCall.callType === "video" ? "Video" : "Voice"} Call from ${activeCall.callerName}...`
                            : `In ${activeCall.callType === "video" ? "Video" : "Voice"} Call with ${selectedFriend.partnerName}`}
                        </span>
                      </h4>
                      <p className="text-[10px] text-emerald-300 font-mono">
                        {activeCall.status === "connected" ? (
                          <span>🟢 Active Call: {Math.floor(activeCall.durationSec / 60)}:{String(activeCall.durationSec % 60).padStart(2, "0")}</span>
                        ) : (
                          "Ringing..."
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {activeCall.status === "incoming" ? (
                      <>
                        <button
                          type="button"
                          onClick={handleAcceptCall}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1 active:scale-95 touch-manipulation"
                        >
                          {activeCall.callType === "video" ? <Video size={13} /> : <Phone size={13} />} Accept
                        </button>
                        <button
                          type="button"
                          onClick={handleDeclineCall}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1 active:scale-95 touch-manipulation"
                        >
                          <PhoneOff size={13} /> Decline
                        </button>
                      </>
                    ) : (
                      <>
                        {activeCall.status === "connected" && (
                          <>
                            <button
                              type="button"
                              onClick={handleToggleMute}
                              className={`p-2 rounded-xl transition-all cursor-pointer active:scale-95 touch-manipulation ${
                                activeCall.isMuted
                                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                                  : "bg-white/10 text-white hover:bg-white/20"
                              }`}
                              title={activeCall.isMuted ? "Unmute Mic" : "Mute Mic"}
                            >
                              {activeCall.isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                            </button>
                            {activeCall.callType === "video" && (
                              <button
                                type="button"
                                onClick={handleToggleVideo}
                                className={`p-2 rounded-xl transition-all cursor-pointer active:scale-95 touch-manipulation ${
                                  activeCall.isVideoOff
                                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                                    : "bg-white/10 text-white hover:bg-white/20"
                                }`}
                                title={activeCall.isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
                              >
                                {activeCall.isVideoOff ? <VideoOff size={15} /> : <Video size={15} />}
                              </button>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={handleEndCall}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1 active:scale-95 touch-manipulation"
                        >
                          <PhoneOff size={13} /> End
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Video Call Full-Pane Viewport when Video Call Connected */}
              {activeCall && activeCall.callType === "video" && activeCall.status === "connected" && (
                <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
                  {/* Remote video stream */}
                  <video 
                    ref={(el) => {
                      remoteVideoRef.current = el;
                      if (el && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
                        el.srcObject = remoteStreamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover" 
                  />
                  {/* Picture-in-Picture Local Camera */}
                  <div className="absolute top-4 right-4 w-28 h-36 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 z-30">
                    <video 
                      ref={(el) => {
                        localVideoRef.current = el;
                        if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                          el.srcObject = localStreamRef.current;
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
              )}

              {/* Message Feed Container (Hidden during full-screen video call) */}
              {!(activeCall && activeCall.callType === "video" && activeCall.status === "connected") && (
                <div 
                  ref={chatFeedRef}
                  onClick={() => setActiveActionMenuId(null)}
                  className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-5 space-y-3 bg-[#030308] bg-radial-[at_top_right] from-teal-950/15 via-[#030308] to-[#030308] light:bg-[#efeae2] light:bg-none overscroll-contain touch-pan-y transition-colors"
                >
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 light:text-slate-500">
                      <RefreshCw size={20} className="animate-spin text-teal-400 light:text-teal-600" />
                      <p className="text-xs font-mono">Decrypting communications with {selectedFriend.partnerName}...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[140px] my-auto text-center space-y-2 p-4 sm:p-6 border border-dashed border-white/10 rounded-2xl bg-white/[0.04] backdrop-blur-md light:border-slate-300 light:bg-white/70">
                      <div className="p-2.5 rounded-full bg-teal-500/20 text-teal-400 light:bg-teal-500/15 light:text-teal-600">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono light:text-slate-800">
                          Conversation with {selectedFriend.partnerName}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 max-w-sm light:text-slate-600">
                          {retentionHours > 0
                            ? `Messages are end-to-end encrypted and self-destruct in ${retentionHours} hours.`
                            : "Messages are end-to-end encrypted with AES-256 GCM."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === currentUserId || msg.sender.toLowerCase() === currentSender.toLowerCase();
                      const isEditing = editingId === msg._id;
                      const isCopied = copiedId === msg._id;
                      const isMenuOpen = activeActionMenuId === msg._id;

                      return (
                        <div
                          id={`chat-msg-${msg._id}`}
                          key={msg._id}
                          className={`flex flex-col relative transition-all duration-300 rounded-2xl p-0.5 group ${
                            isMe ? "items-end" : "items-start"
                          } ${
                            highlightedMsgId === msg._id
                              ? "ring-2 ring-teal-300 bg-teal-500/25 shadow-[0_0_20px_rgba(20,184,166,0.6)] scale-[1.02]"
                              : ""
                          }`}
                        >
                          {/* Quoted Message Preview if Reply */}
                          {msg.replyTo && (msg.replyTo.text || (msg.replyTo.sender && msg.replyTo.sender !== ":")) && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJumpToMessage(msg.replyTo?.id, msg.replyTo?.text);
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 mb-1 text-[10px] rounded-lg border cursor-pointer max-w-[85%] sm:max-w-md ${
                                isMe
                                  ? "bg-teal-950/60 border-teal-500/30 text-teal-300 mr-1 light:bg-teal-100 light:border-teal-300 light:text-teal-800"
                                  : "bg-white/[0.06] border-white/10 text-slate-300 ml-1 light:bg-slate-100 light:border-slate-300 light:text-slate-700"
                              }`}
                            >
                              <CornerDownRight size={11} className="flex-shrink-0" />
                              {msg.replyTo.sender && <span className="font-bold">{msg.replyTo.sender}:</span>}
                              <span className="truncate">{msg.replyTo.text}</span>
                            </div>
                          )}

                          {/* Swipeable Message Container */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionMenuId((prev) => (prev === msg._id ? null : msg._id));
                            }}
                            onPointerDown={(e) => handlePointerDown(e, msg._id)}
                            onPointerMove={handlePointerMove}
                            onPointerUp={(e) => handlePointerUp(e, msg)}
                            onPointerCancel={handlePointerCancel}
                            style={{
                              transform: swipingId === msg._id ? `translateX(${swipeOffset}px)` : "none",
                              transition: swipingId === msg._id ? "none" : "transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)",
                            }}
                            className={`relative max-w-[88%] sm:max-w-md rounded-2xl p-2.5 sm:p-3 text-xs shadow-md transition-shadow select-none touch-pan-y cursor-pointer ${
                              isMe
                                ? "bg-gradient-to-r from-teal-900/80 to-emerald-900/80 border border-teal-500/30 text-teal-50 rounded-tr-xs light:bg-gradient-to-r light:from-[#d9fdd3] light:to-[#d9fdd3] light:border-slate-300/40 light:text-slate-900"
                                : "bg-[#101026] border border-white/10 text-slate-100 rounded-tl-xs light:bg-white light:border-slate-200 light:text-slate-900"
                            }`}
                          >
                            {/* Sender Alias Header */}
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`text-[10px] font-bold ${isMe ? "text-teal-300 light:text-teal-700" : "text-emerald-400 light:text-emerald-700"}`}>
                                {msg.sender}
                              </span>
                            </div>

                            {/* Media Attachment (Photo / Video) */}
                            {msg.mediaData && !msg.isDeleted && (
                              <div className="mb-2 rounded-xl overflow-hidden border border-white/10 bg-black/40 light:bg-slate-100 light:border-slate-200">
                                {msg.mediaType === "image" ? (
                                  <img
                                    src={msg.mediaData}
                                    alt={msg.mediaName || "Shared image"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLightboxMedia({ type: "image", url: msg.mediaData!, name: msg.mediaName || "image.jpg", msgId: msg._id, isMe });
                                    }}
                                    className="max-h-60 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                  />
                                ) : (
                                  <video
                                    src={msg.mediaData}
                                    controls
                                    className="max-h-60 w-full object-cover rounded-xl"
                                  />
                                )}
                              </div>
                            )}

                            {/* Message Body Text or Inline Edit */}
                            {msg.isDeleted ? (
                              <p className="italic text-slate-400 light:text-slate-500 flex items-center gap-1 text-[11px] sm:text-[12px]">
                                <Ban size={13} className="text-slate-500 flex-shrink-0" />
                                <span>This message was deleted</span>
                              </p>
                            ) : isEditing ? (
                              <div className="space-y-1.5 my-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full bg-white/10 border border-teal-400/40 rounded px-2.5 py-1.5 text-base sm:text-xs text-white outline-none focus:border-teal-400 light:bg-slate-100 light:border-teal-600 light:text-slate-900"
                                  autoFocus
                                />
                                <div className="flex gap-1 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(null);
                                      if (typeof window !== "undefined") {
                                        window.scrollTo(0, 0);
                                        document.documentElement.scrollLeft = 0;
                                        document.body.scrollLeft = 0;
                                      }
                                    }}
                                    className="px-2 py-0.5 text-[10px] bg-white/10 hover:bg-white/20 rounded text-slate-300 light:bg-slate-200 light:text-slate-700"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(msg._id)}
                                    className="px-2 py-0.5 text-[10px] bg-teal-600 hover:bg-teal-500 rounded text-white font-bold"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words leading-relaxed text-[12px] sm:text-[13px]">
                                {msg.text}
                              </p>
                            )}

                            {/* Timestamp & Status Footer */}
                            <div className="flex items-center justify-end gap-1.5 mt-1 pt-0.5 text-[9px] text-slate-400 light:text-slate-500">
                              {msg.isEdited && !msg.isDeleted && <span className="italic text-[8px] opacity-80">(edited)</span>}
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              {isMe && !msg.isDeleted && (
                                <span className={msg.isRead ? "text-teal-400 light:text-teal-600" : "text-slate-500"}>
                                  <CheckCheck size={12} />
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Message Actions Toolbar (Hover on Desktop / Tap on Mobile) */}
                          {!msg.isDeleted && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              className={`flex items-center gap-1 mt-1 p-1 rounded-2xl bg-[#0c0c1e]/95 border border-white/15 shadow-xl z-20 transition-all light:bg-white light:border-slate-300 light:shadow-2xl ${
                                isMenuOpen 
                                  ? "flex opacity-100 scale-100" 
                                  : "hidden group-hover:flex opacity-0 group-hover:opacity-100"
                              }`}
                            >
                              {/* Reply */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReplyingTo({ id: msg._id, sender: msg.sender, text: msg.text || (msg.mediaType === "image" ? "📷 Photo" : "🎥 Video") });
                                  setActiveActionMenuId(null);
                                  focusInput();
                                }}
                                className="p-1.5 sm:p-1 rounded-xl hover:bg-white/15 text-slate-300 light:text-slate-700 hover:text-teal-400 light:hover:text-teal-600 light:hover:bg-slate-100 transition-colors cursor-pointer active:scale-95 touch-manipulation"
                                title="Reply"
                              >
                                <Reply size={14} />
                              </button>

                              {/* Copy */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyMessage(msg._id, msg.text);
                                  setActiveActionMenuId(null);
                                }}
                                className="p-1.5 sm:p-1 rounded-xl hover:bg-white/15 text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 light:hover:bg-slate-100 transition-colors cursor-pointer active:scale-95 touch-manipulation"
                                title="Copy"
                              >
                                {isCopied ? <Check size={14} className="text-teal-400 light:text-teal-600" /> : <Copy size={14} />}
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingId(msg._id);
                                  setEditText(msg.text);
                                  setActiveActionMenuId(null);
                                }}
                                className="p-1.5 sm:p-1 rounded-xl hover:bg-white/15 text-slate-300 light:text-slate-700 hover:text-amber-400 light:hover:text-amber-600 light:hover:bg-slate-100 transition-colors cursor-pointer active:scale-95 touch-manipulation"
                                title="Edit Message"
                              >
                                <Pencil size={14} />
                              </button>

                              {/* Delete Single Message */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSingleMessage(msg._id);
                                  setActiveActionMenuId(null);
                                }}
                                className="p-1.5 sm:p-1 rounded-xl hover:bg-red-500/20 text-slate-300 light:text-slate-700 hover:text-red-400 light:hover:text-red-600 light:hover:bg-red-50 transition-colors cursor-pointer active:scale-95 touch-manipulation"
                                title="Delete Message"
                              >
                                <Trash2 size={14} />
                              </button>

                              {/* Info Diagnostics */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedInfoMsg(msg);
                                  setActiveActionMenuId(null);
                                }}
                                className="p-1.5 sm:p-1 rounded-xl hover:bg-white/15 text-slate-300 light:text-slate-700 hover:text-teal-400 light:hover:text-teal-600 light:hover:bg-slate-100 transition-colors cursor-pointer active:scale-95 touch-manipulation"
                                title="Message Info"
                              >
                                <Info size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Replying Preview Bar */}
              {replyingTo && (
                <div className="px-3 py-1.5 bg-teal-950/70 border-t border-teal-500/30 flex items-center justify-between gap-2 text-xs text-teal-200">
                  <div className="flex items-center gap-1.5 truncate">
                    <Reply size={13} className="text-teal-400 flex-shrink-0" />
                    <span className="font-bold">{replyingTo.sender}:</span>
                    <span className="truncate">{replyingTo.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-slate-400 hover:text-white text-xs p-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Staged Media Preview */}
              {stagedMedia && (
                <div className="p-2 bg-black/60 border-t border-white/10 flex items-center justify-between gap-2 text-xs text-white">
                  <div className="flex items-center gap-2">
                    {stagedMedia.type === "image" ? <ImageIcon size={16} className="text-teal-400" /> : <Film size={16} className="text-teal-400" />}
                    <span className="truncate max-w-xs">{stagedMedia.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStagedMedia(null)}
                    className="text-slate-400 hover:text-red-400 p-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {/* Emoji Picker Dropdown */}
              {showEmojiPicker && (
                <div className="p-3 bg-[#0a0a1a] border-t border-white/10 max-h-48 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2 pb-1 border-b border-white/10">
                    {EMOJI_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveEmojiTab(cat.id)}
                        className={`px-2 py-0.5 rounded text-xs transition-all cursor-pointer ${
                          activeEmojiTab === cat.id ? "bg-teal-500/30 text-teal-300 font-bold" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {cat.icon}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleBackspaceEmoji}
                      className="ml-auto px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-xs cursor-pointer flex items-center gap-1"
                    >
                      <Delete size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 text-base sm:text-lg">
                    {EMOJI_CATEGORIES.find((c) => c.id === activeEmojiTab)?.emojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleInsertEmoji(emoji)}
                        className="hover:scale-125 transition-transform p-1 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Message Input Bar */}
              <form onSubmit={handleSend} className="p-2 sm:p-3 border-t border-white/10 bg-[#070712] light:bg-[#f0f2f5] light:border-slate-200 flex items-center gap-1.5 sm:gap-2 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {/* Media Attachment Clip Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressingMedia}
                  className="p-2 rounded-xl text-slate-400 hover:text-teal-400 hover:bg-white/5 transition-all cursor-pointer light:hover:text-teal-700 active:scale-95 touch-manipulation"
                  title="Attach Photo or Video"
                >
                  {isCompressingMedia ? <Loader2 size={18} className="animate-spin text-teal-400" /> : <Paperclip size={18} />}
                </button>

                {/* Emoji Picker Button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-xl transition-all cursor-pointer active:scale-95 touch-manipulation ${
                    showEmojiPicker ? "text-teal-400 bg-teal-500/20" : "text-slate-400 hover:text-teal-400 hover:bg-white/5"
                  }`}
                  title="Insert Emoji"
                >
                  <Smile size={18} />
                </button>

                {/* Main Text Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  onBlur={() => {
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    isTypingRef.current = false;
                    syncPresence(false);
                  }}
                  placeholder={`Message ${selectedFriend.partnerName} securely...`}
                  className="flex-1 bg-white/[0.07] border border-white/10 rounded-xl px-3 py-2 text-base sm:text-xs text-white placeholder-slate-500 outline-none focus:border-teal-500 light:bg-white light:border-slate-300 light:text-slate-900 light:placeholder-slate-400"
                  autoFocus
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !stagedMedia) || sending}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-90 disabled:opacity-40 text-white transition-all cursor-pointer shadow-md flex-shrink-0 active:scale-95 touch-manipulation"
                  title="Send Message"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONTACT PROFILE & SETTINGS MODAL (Global Dialog Level) */}
      {/* ========================================================= */}
      {showProfileModal && selectedFriend && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.stopPropagation();
              setShowProfileModal(false);
              setMobileView("chat");
            }
          }}
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="bg-[#0b0b1a] border border-white/15 rounded-3xl p-4 sm:p-6 max-w-md w-full space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto overscroll-contain light:bg-white light:border-slate-300 light:text-slate-900 my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 light:border-slate-200">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 light:text-slate-900">
                <User size={16} className="text-teal-400" /> Contact Details
              </h3>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileModal(false);
                  setMobileView("chat");
                }}
                className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer light:bg-slate-100 light:text-slate-600 light:hover:bg-slate-200 active:scale-95 touch-manipulation"
                title="Close Details & Return to Chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Card Summary */}
            <div className="flex flex-col items-center text-center space-y-2 pt-1">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-xl border-2 border-white/20">
                  {selectedFriend.partnerName.slice(0, 2).toUpperCase()}
                </div>
                {isFriendOnline && (
                  <span className="absolute bottom-0 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 border-2 border-[#0b0b1a] light:border-white shadow-sm"></span>
                )}
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white light:text-slate-900">{selectedFriend.partnerName}</h4>
                {selectedFriend.partnerEmail && (
                  <p className="text-xs text-slate-400 flex items-center justify-center gap-1 light:text-slate-600">
                    <Mail size={12} /> {selectedFriend.partnerEmail}
                  </p>
                )}
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-[10px] text-teal-300 font-mono light:bg-teal-50 light:border-teal-300 light:text-teal-800">
                  <ShieldCheck size={12} /> End-to-End Encrypted (AES-256)
                </div>
              </div>
            </div>

            {/* Disappearing Messages Setting */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 space-y-2.5 light:bg-slate-100 light:border-slate-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-teal-400 light:text-teal-600" />
                  <h5 className="text-xs font-bold text-white light:text-slate-900">Disappearing Messages</h5>
                </div>
                <span className="text-[10px] font-mono font-bold text-teal-400 light:text-teal-700">
                  {retentionHours === 0 ? "Off" : `${retentionHours}h timer`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed light:text-slate-600">
                New messages in this chat will self-destruct for both participants after the selected duration.
              </p>
              {/* Option Pills */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { label: "Off", hours: 0 },
                  { label: "12 Hours", hours: 12 },
                  { label: "24 Hours", hours: 24 },
                  { label: "7 Days", hours: 168 },
                ].map((opt) => (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => handleUpdateRetention(opt.hours)}
                    className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer text-center active:scale-95 touch-manipulation ${
                      retentionHours === opt.hours
                        ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md border border-teal-400/40"
                        : "bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 light:bg-white light:border-slate-300 light:text-slate-700 light:hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: Clear Chat & Remove Connection */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleClearAll}
                disabled={messages.length === 0}
                className="w-full py-2.5 px-3 bg-white/[0.06] hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 touch-manipulation light:bg-amber-50 light:border-amber-300 light:text-amber-800 light:hover:bg-amber-100"
              >
                <Trash2 size={14} /> Clear Messages History
              </button>

              <button
                type="button"
                onClick={() => handleRemoveConnection(selectedFriend.connectionId, selectedFriend.partnerName)}
                className="w-full py-2.5 px-3 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 touch-manipulation light:bg-red-50 light:border-red-300 light:text-red-700 light:hover:bg-red-100"
              >
                <UserMinus size={14} /> Remove {selectedFriend.partnerName} from Friends
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Lightbox Zoom Modal */}
      {lightboxMedia && (
        <div 
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 z-[105] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <a
              href={lightboxMedia.url}
              download={lightboxMedia.name || "media-download"}
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              title="Download"
            >
              <Download size={18} />
            </a>
            <button
              onClick={() => setLightboxMedia(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-red-500/30 text-white transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
          <img
            src={lightboxMedia.url}
            alt={lightboxMedia.name || "Preview"}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Message Info Modal */}
      {selectedInfoMsg && (
        <div 
          onClick={() => setSelectedInfoMsg(null)}
          className="fixed inset-0 z-[105] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0b0b1a] border border-white/15 rounded-2xl p-4 max-w-sm w-full space-y-3 shadow-2xl light:bg-white light:border-slate-300 light:text-slate-800"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2 light:border-slate-200">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5 light:text-slate-900">
                <Info size={14} className="text-teal-400 light:text-teal-600" /> Message Diagnostics
              </h4>
              <button onClick={() => setSelectedInfoMsg(null)} className="text-slate-400 hover:text-white text-xs light:text-slate-600">✕</button>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300 light:text-slate-700">
              <div className="flex justify-between"><span className="text-slate-500 light:text-slate-500">Sender:</span> <span className="font-bold light:text-slate-900">{selectedInfoMsg.sender}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 light:text-slate-500">Sent at:</span> <span className="light:text-slate-900">{new Date(selectedInfoMsg.createdAt).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 light:text-slate-500">Delivered:</span> <span className="light:text-slate-900">{selectedInfoMsg.deliveredAt ? new Date(selectedInfoMsg.deliveredAt).toLocaleTimeString() : "Delivered"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 light:text-slate-500">Read:</span> <span className="light:text-slate-900">{selectedInfoMsg.isRead ? "Read ✓✓" : "Delivered ✓"}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
