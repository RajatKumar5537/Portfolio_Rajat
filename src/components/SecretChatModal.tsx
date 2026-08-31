"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  X, Send, Reply, Pencil, Trash2, Shield, User, 
  Sparkles, RefreshCw, Check, Ban, Smile, Copy, CheckCheck,
  Users, ChevronDown, UserCheck, UserPlus, UserMinus, Bell, Lock, Delete, Info,
  Paperclip, Image as ImageIcon, Film, Download, Loader2
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
  roomId: string;
  retentionHours?: number;
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
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Visual Viewport tracking for mobile keyboard
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !isOpen) return;

    const updateViewportHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    updateViewportHeight();
    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.visualViewport?.addEventListener("scroll", updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.visualViewport?.removeEventListener("scroll", updateViewportHeight);
      window.removeEventListener("resize", updateViewportHeight);
    };
  }, [isOpen]);

  useEffect(() => {
    if (viewportHeight && chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [viewportHeight]);

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

    // Detect horizontal drag intent
    if (!isDraggingRef.current) {
      if (Math.abs(deltaX) > 5 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isDraggingRef.current = true;
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch (_) {}
      } else if (Math.abs(deltaY) > 6) {
        return; // Natural vertical scroll
      }
    }

    if (isDraggingRef.current) {
      e.preventDefault();
      // Elastic damping
      const damped = deltaX > 0 ? Math.min(80, deltaX * 0.8) : Math.max(-80, deltaX * 0.8);
      setSwipeOffset(damped);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>, msg: MessageItem) => {
    if (swipingId === msg._id && isDraggingRef.current) {
      if (swipeOffset > 35) {
        // Swiped Right -> Instant Reply
        setReplyingTo({ id: msg._id, sender: msg.sender, text: msg.text });
        focusInput();
      } else if (swipeOffset < -35) {
        // Swiped Left -> Toggle Actions Toolbar
        setActiveActionMenuId((prev) => (prev === msg._id ? null : msg._id));
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll helper that strictly scrolls only the chat container, never the window/body
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

    // Lock body scrolling when modal is active
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

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
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, fetchConnections, fetchMessagesForPartner, syncPresence, onClose]);

  // When selected friend changes, reload messages and retention
  useEffect(() => {
    if (isOpen && selectedFriend) {
      if (selectedFriend.retentionHours) {
        setRetentionHours(selectedFriend.retentionHours as 12 | 24);
      }
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

  const compressImage = (file: File): Promise<{ dataUrl: string; name: string }> => {
    return new Promise((resolve) => {
      const processImageElement = (img: HTMLImageElement, cleanupUrl?: string) => {
        try {
          const canvas = document.createElement("canvas");
          const maxDimension = 1280; // Optimal HD for mobile & fast delivery
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
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 10);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 120);
    }
  };

  // Send 1-on-1 message handler with keyboard focus persistence
  const handleSend = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
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
    syncPresence(false);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: currentSender,
          recipientId: currentPartner.partnerId,
          text: textToSend,
          mediaType: mediaToSend?.type || null,
          mediaData: mediaToSend?.dataUrl || null,
          mediaName: mediaToSend?.name || null,
          replyTo: replyToSend,
          retentionHours,
        }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(() => scrollToBottom(true), 30);
        if (onMessagesRead) onMessagesRead();
        fetchMessagesForPartner(currentPartner.partnerId, true);
      }
    } catch (err) {
      console.error("Error sending 1-on-1 message:", err);
    } finally {
      setSending(false);
      focusInput();
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

  // Clear 1-on-1 conversation for current user only
  const handleClearAll = async () => {
    if (!selectedFriend) return;
    if (!confirm(`Clear conversation with ${selectedFriend.partnerName} for you? (Your friend will still keep their chat history)`)) return;

    try {
      const res = await fetch(`/api/chat/messages?clearAll=true&recipientId=${encodeURIComponent(selectedFriend.partnerId)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages([]);
      }
    } catch (err) {
      console.error("Error clearing conversation:", err);
    }
  };

  // Update per-user disappearing messages retention (12h or 24h)
  const handleUpdateRetention = async (hours: 12 | 24) => {
    setRetentionHours(hours);
    if (!selectedFriend) return;

    try {
      await fetch("/api/chat/connections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: selectedFriend.connectionId, retentionHours: hours }),
      });
      fetchMessagesForPartner(selectedFriend.partnerId, true);
    } catch (err) {
      console.error("Error updating retention:", err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden"
      style={viewportHeight && typeof window !== "undefined" && window.innerWidth < 640 ? { height: `${viewportHeight}px`, top: 0, bottom: "auto", position: "fixed" } : undefined}
    >
      <div 
        className="w-full sm:max-w-2xl bg-white dark:bg-[#090913] border-0 sm:border border-slate-200 dark:border-white/10 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-[640px] sm:max-h-[90vh] relative font-sans transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header (Zero-Knowledge 1-on-1 Tunnel) */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 dark:border-white/10 bg-[#f0f2f5] dark:bg-[#111b21] flex-shrink-0 pt-[max(0.625rem,env(safe-area-inset-top))] transition-colors">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Avatar & Online Presence */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-500/15 dark:bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold text-xs sm:text-sm">
                {selectedFriend ? selectedFriend.partnerName.slice(0, 2).toUpperCase() : <Lock size={16} />}
              </div>
              {friendPresence && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111b21] shadow-sm"></span>
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
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {selectedFriend ? selectedFriend.partnerName : "Friend Chat"}
                </h3>
                {acceptedFriends.length > 1 && (
                  <ChevronDown size={14} className="text-slate-500 dark:text-slate-400 group-hover:text-teal-500 transition-transform" />
                )}
                <span className="text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-mono font-normal flex-shrink-0">
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
                  <span className="text-slate-500 dark:text-slate-400 truncate block">
                    {selectedFriend ? `Chat with ${selectedFriend.partnerName}` : "Connect with a friend to start"} • {retentionHours}h
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
                  ? "bg-[#005c4b] text-white font-bold"
                  : "bg-slate-200/80 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400"
              }`}
              title="Connect with Friend (Send Request)"
            >
              <UserPlus size={14} />
              <span className="hidden sm:inline text-[10px]">Add Friend</span>
            </button>

            {/* Per-user disappearing messages toggle */}
            <div className="flex items-center bg-slate-200/80 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-0.5 sm:p-1 text-[8px] sm:text-[9px] font-mono">
              <button
                type="button"
                onClick={() => handleUpdateRetention(12)}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-all cursor-pointer ${
                  retentionHours === 12 ? "bg-[#005c4b] text-white font-bold" : "text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200"
                }`}
                title="Disappear messages older than 12 hours for your view"
              >
                12h
              </button>
              <button
                type="button"
                onClick={() => handleUpdateRetention(24)}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-all cursor-pointer ${
                  retentionHours === 24 ? "bg-[#005c4b] text-white font-bold" : "text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200"
                }`}
                title="Disappear messages older than 24 hours for your view"
              >
                24h
              </button>
            </div>

            {/* Clear Conversation for Me Button */}
            {selectedFriend && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={messages.length === 0}
                className="p-2 sm:p-1.5 rounded-xl bg-slate-200/80 dark:bg-white/5 hover:bg-red-500/20 text-slate-700 dark:text-slate-400 hover:text-red-600 border border-slate-300 dark:border-white/5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                title="Clear conversation for you"
              >
                <Trash2 size={15} />
              </button>
            )}

            {/* Panic / Close button */}
            <button
              onClick={onClose}
              className="p-2 sm:p-1.5 rounded-xl bg-slate-200/80 dark:bg-white/5 hover:bg-red-500/20 text-slate-700 dark:text-slate-400 hover:text-red-600 border border-slate-300 dark:border-white/5 transition-all cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
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
          <div className="p-3.5 bg-slate-100 dark:bg-[#111b21] border-b border-slate-200 dark:border-white/10 flex-shrink-0 animate-in fade-in slide-in-from-top-2 duration-150 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Users size={12} className="text-teal-600 dark:text-teal-400" />
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
                          ? "bg-[#005c4b] text-white font-bold shadow-sm"
                          : "bg-white dark:bg-[#202c33] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200/60 dark:border-white/5"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFriend(p);
                          setShowFriendPicker(false);
                        }}
                        className="flex items-center gap-2.5 truncate flex-1 text-left cursor-pointer"
                      >
                        <div className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "bg-white/20 text-white" : "bg-teal-500/15 text-teal-700 dark:text-teal-400"
                        }`}>
                          {p.partnerName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate">{p.partnerName}</span>
                        {isSelected && <UserCheck size={14} className="flex-shrink-0 ml-1 text-teal-200" />}
                      </button>

                      {/* Remove / Unfriend Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveConnection(p.connectionId, p.partnerName, false);
                        }}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ml-2 flex-shrink-0 ${
                          isSelected ? "hover:bg-white/20 text-white/80 hover:text-white" : "hover:bg-red-500/10 text-slate-400 hover:text-red-500"
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
        <div className="flex items-center justify-between px-3 sm:px-5 py-1.5 bg-[#f7f8fa] dark:bg-[#111b21] border-b border-slate-200 dark:border-white/5 text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400 flex-shrink-0 transition-colors">
          <div className="flex items-center gap-1.5 truncate">
            <User size={11} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <span className="hidden sm:inline">Logged in as:</span>
            {!isEditingName ? (
              <span className="font-bold text-slate-900 dark:text-slate-200 truncate">{currentSender}</span>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={accountName}
                  className="bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-slate-100 outline-none w-24 sm:w-28"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="text-teal-600 dark:text-teal-400 hover:opacity-80 p-1"
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
                className="text-[9px] text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 underline ml-0.5 cursor-pointer"
              >
                (Edit)
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 font-mono flex-shrink-0">
            <span>Chat:</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">{selectedFriend ? selectedFriend.partnerName : "None"}</span>
          </div>
        </div>

        {/* Message Feed (Warm ivory light WhatsApp wallpaper, dark wallpaper in dark mode) */}
        <div 
          ref={chatFeedRef}
          onClick={() => setActiveActionMenuId(null)}
          className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-5 space-y-3 bg-[#efeae2] dark:bg-[#0b141a] overscroll-contain touch-pan-y transition-colors"
        >
          {!selectedFriend ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-6 sm:p-8 bg-white/70 dark:bg-white/[0.02] rounded-2xl border border-slate-300/60 dark:border-white/5">
              <div className="p-3.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400">
                <Shield size={32} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Connect with Friends</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
                  To begin chatting, enter your friend&apos;s exact email address to send a friend request. Once they accept, your conversation will appear here.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddFriendForm(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#005c4b] hover:bg-[#00705a] text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  <UserPlus size={14} />
                  <span>Connect Friend</span>
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <RefreshCw size={20} className="animate-spin text-teal-600 dark:text-teal-400" />
              <p className="text-xs font-mono">Decrypting communications with {selectedFriend.partnerName}...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-6 sm:p-8 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl bg-white/70 dark:bg-white/[0.02]">
              <div className="p-3 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 font-mono">
                  Conversation with {selectedFriend.partnerName}
                </h4>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
                  Only you and {selectedFriend.partnerName} can access this conversation. Messages are encrypted with AES-256 and self-destruct in {retentionHours} hours.
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
                  key={msg._id}
                  className={`flex flex-col relative ${isMe ? "items-end" : "items-start"}`}
                >
                  {/* Quoted Message Preview if Reply */}
                  {msg.replyTo && (
                    <div
                      className={`mb-1 px-3 py-1.5 rounded-xl text-[10px] border-l-2 bg-white/80 dark:bg-white/[0.05] border-teal-600 max-w-[85%] sm:max-w-md shadow-xs ${
                        isMe ? "text-right mr-1" : "text-left ml-1"
                      }`}
                    >
                      <span className="text-[8px] font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400 font-mono block">
                        Replying to @{msg.replyTo.sender}
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 line-clamp-1 italic text-[10px]">
                        &quot;{msg.replyTo.text}&quot;
                      </p>
                    </div>
                  )}

                  {/* Inline Edit Form */}
                  {isEditing ? (
                    <div className="bg-white dark:bg-[#121226] border border-teal-500/40 p-2.5 sm:p-3 rounded-2xl space-y-2 w-full max-w-md shadow-lg my-1">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-white/10 border border-slate-300 dark:border-white/15 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500 placeholder-slate-400"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditText("");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-white/5 text-[10px] text-slate-700 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-white/10 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(msg._id)}
                          className="px-3 py-1 rounded-lg bg-[#005c4b] text-[10px] text-white font-bold hover:bg-[#00705a] cursor-pointer shadow-sm"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : msg.isDeleted ? (
                    /* Deleted Message Bubble */
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words relative transition-all border border-slate-300/60 dark:border-white/5 bg-white/70 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 italic flex items-center gap-1.5 ${
                        isMe ? "rounded-tr-xs" : "rounded-tl-xs"
                      }`}
                    >
                      <Ban size={12} className="text-slate-400 flex-shrink-0" />
                      <span>This message was deleted</span>
                    </div>
                  ) : (
                    /* Clean Modern Message Bubble */
                    <div 
                      className="relative group max-w-[85%] sm:max-w-[75%] touch-pan-y select-none"
                      onPointerDown={(e) => handlePointerDown(e, msg._id)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={(e) => handlePointerUp(e, msg)}
                      onPointerCancel={handlePointerCancel}
                    >
                      {/* Swipe Right Visual Hint (Reply ↩️) */}
                      {swipingId === msg._id && swipeOffset > 15 && (
                        <div 
                          className="absolute -left-9 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-teal-500/25 text-teal-600 dark:text-teal-400 border border-teal-500/40 pointer-events-none transition-transform shadow-lg"
                          style={{
                            transform: `translateY(-50%) scale(${Math.min(1.15, 0.5 + swipeOffset / 45)})`,
                            opacity: Math.min(1, swipeOffset / 30),
                          }}
                        >
                          <Reply size={14} className="stroke-[2.5]" />
                        </div>
                      )}

                      {/* Swipe Left Visual Hint (Quick Actions ⚙️) */}
                      {swipingId === msg._id && swipeOffset < -15 && (
                        <div 
                          className="absolute -right-9 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/25 text-indigo-500 dark:text-indigo-400 border border-indigo-500/40 pointer-events-none transition-transform shadow-lg"
                          style={{
                            transform: `translateY(-50%) scale(${Math.min(1.15, 0.5 + Math.abs(swipeOffset) / 45)})`,
                            opacity: Math.min(1, Math.abs(swipeOffset) / 30),
                          }}
                        >
                          <Info size={14} className="stroke-[2.5]" />
                        </div>
                      )}

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isDraggingRef.current) {
                            setActiveActionMenuId(isMenuOpen ? null : msg._id);
                          }
                        }}
                        style={{
                          transform: swipingId === msg._id ? `translateX(${swipeOffset}px)` : "translateX(0)",
                          transition: swipingId === msg._id ? "none" : "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                        }}
                        className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words cursor-pointer select-none relative shadow-sm hover:brightness-105 active:scale-[0.99] ${
                          isMenuOpen ? "ring-2 ring-teal-400/60 shadow-md" : ""
                        } ${
                          isMe
                            ? "bg-[#005c4b] dark:bg-[#005c4b] text-white rounded-tr-xs"
                            : "bg-white dark:bg-[#202c33] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-white/5 rounded-tl-xs shadow-xs"
                        }`}
                      >
                        {/* Media Display (Photo / Video) */}
                        {msg.mediaType === "image" && msg.mediaData && (
                          <div className="mb-1 rounded-xl overflow-hidden cursor-pointer group/media relative shadow-sm">
                            <img
                              src={msg.mediaData}
                              alt={msg.mediaName || "Photo"}
                              className="max-h-60 sm:max-h-72 w-auto max-w-full rounded-xl object-cover hover:scale-[1.01] transition-transform duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxMedia({
                                  type: "image",
                                  url: msg.mediaData!,
                                  name: msg.mediaName || "photo.jpg",
                                });
                              }}
                            />
                          </div>
                        )}

                        {msg.mediaType === "video" && msg.mediaData && (
                          <div className="mb-1 rounded-xl overflow-hidden max-w-xs bg-black/90 shadow-sm">
                            <video
                              src={msg.mediaData}
                              controls
                              playsInline
                              preload="metadata"
                              className="max-h-60 sm:max-h-72 w-full rounded-xl object-contain"
                            />
                          </div>
                        )}

                        {/* Text and Inline Timestamp */}
                        {msg.text && (
                          <span className={`whitespace-pre-wrap font-medium ${isMe ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
                            {msg.text}
                          </span>
                        )}
                        <span className="text-[9px] font-mono ml-2.5 inline-flex items-center gap-1 float-right mt-1 select-none">
                          <span className={isMe ? "text-emerald-200/90 font-mono" : "text-slate-400 dark:text-slate-400 font-mono"}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.isEdited && (
                            <span className={isMe ? "text-[8px] text-white/70" : "text-[8px] text-slate-400"}>
                              (edited)
                            </span>
                          )}
                          {isMe && (
                            <span className="inline-flex items-center ml-0.5" title={msg.isRead ? "Read" : msg.isDelivered ? "Delivered" : "Sent"}>
                              {msg.isRead ? (
                                <CheckCheck size={13} className="text-sky-300 dark:text-sky-300 drop-shadow-[0_0_2px_#38bdf8] stroke-[2.5]" />
                              ) : msg.isDelivered ? (
                                <CheckCheck size={13} className="text-white/60 dark:text-white/60 stroke-[1.8]" />
                              ) : (
                                <Check size={13} className="text-white/60 dark:text-white/60 stroke-[1.8]" />
                              )}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Tap / Long-press Action Sheet (WhatsApp style floating toolbar) */}
                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute ${
                            isMe ? "right-0" : "left-0"
                          } -top-11 z-40 flex items-center gap-0.5 p-1 bg-slate-900/95 dark:bg-[#0c0c1e]/95 light:bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo({ id: msg._id, sender: msg.sender, text: msg.text });
                              setActiveActionMenuId(null);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-white hover:bg-white/15 transition-colors cursor-pointer"
                          >
                            <Reply size={13} className="text-teal-400" />
                            <span>Reply</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleCopyMessage(msg._id, msg.text);
                              setActiveActionMenuId(null);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-white hover:bg-white/15 transition-colors cursor-pointer"
                          >
                            {isCopied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} className="text-indigo-400" />}
                            <span>{isCopied ? "Copied" : "Copy"}</span>
                          </button>

                          {isMe && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInfoMsg(msg);
                                setActiveActionMenuId(null);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-white hover:bg-white/15 transition-colors cursor-pointer"
                              title="Message Info"
                            >
                              <Info size={13} className="text-sky-400" />
                              <span>Info</span>
                            </button>
                          )}

                          {isMe && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(msg._id);
                                setEditText(msg.text);
                                setActiveActionMenuId(null);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-white hover:bg-white/15 transition-colors cursor-pointer"
                            >
                              <Pencil size={13} className="text-amber-400" />
                              <span>Edit</span>
                            </button>
                          )}

                          {isMe && (
                            <button
                              type="button"
                              onClick={() => {
                                handleDelete(msg._id);
                                setActiveActionMenuId(null);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/25 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setActiveActionMenuId(null)}
                            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-0.5 cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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

        {/* Modern Categorized WhatsApp-Style Emoji Picker */}
        {showEmojiPicker && (
          <div 
            className="px-3 py-2.5 bg-slate-100 dark:bg-[#101024] light:bg-slate-100 border-t border-slate-200 dark:border-white/10 light:border-slate-200 flex-shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-150 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Category Bar + Backspace + Close */}
            <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {EMOJI_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      setActiveEmojiTab(cat.id);
                    }}
                    onClick={() => setActiveEmojiTab(cat.id)}
                    className={`px-2 py-1 rounded-lg text-sm sm:text-base transition-all cursor-pointer select-none ${
                      activeEmojiTab === cat.id
                        ? "bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold scale-110 shadow-sm"
                        : "opacity-60 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-white/5"
                    }`}
                    title={cat.name}
                  >
                    {cat.icon}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Backspace Button */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleBackspaceEmoji();
                  }}
                  onClick={handleBackspaceEmoji}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Backspace"
                >
                  <Delete size={15} />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Emojis Grid (Categorized & Scrollable) */}
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 sm:gap-1.5 max-h-36 sm:max-h-48 overflow-y-auto pr-1">
              {(EMOJI_CATEGORIES.find((c) => c.id === activeEmojiTab)?.emojis || []).map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleInsertEmoji(emoji);
                  }}
                  onClick={() => handleInsertEmoji(emoji)}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 light:hover:bg-slate-200 text-lg sm:text-xl transition-transform hover:scale-125 active:scale-95 cursor-pointer select-none"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Staged Media Preview Bar */}
        {stagedMedia && (
          <div className="p-2 sm:p-2.5 mx-2.5 sm:mx-3.5 mb-1 bg-slate-100 dark:bg-white/[0.06] light:bg-slate-100 border border-teal-500/30 rounded-xl flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {stagedMedia.type === "image" ? (
                <img
                  src={stagedMedia.dataUrl}
                  alt="Preview"
                  className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-teal-500/40"
                />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-black/60 flex items-center justify-center text-teal-400 flex-shrink-0 border border-teal-500/40">
                  <Film size={22} />
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                  {stagedMedia.name}
                </p>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                  {stagedMedia.type === "image" ? "Photo attached (Add caption & send)" : "Video clip attached (Add caption & send)"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStagedMedia(null)}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Remove attachment"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Media Processing / Upload Error */}
        {mediaError && (
          <div className="mx-3.5 mb-1 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-500 flex items-center justify-between">
            <span>{mediaError}</span>
            <button type="button" onClick={() => setMediaError(null)} className="text-red-400 hover:text-red-300">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Input Bar (Div container to prevent form submit keyboard dismiss) */}
        <div 
          className="p-2.5 sm:p-3.5 bg-[#f0f2f5] dark:bg-[#111b21] border-t border-slate-200 dark:border-white/10 flex-shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))] transition-colors"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-[#202c33] border border-slate-300 dark:border-white/10 focus-within:border-teal-600 rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 transition-all shadow-sm">
            {/* Attachment Button (Photo / Video) */}
            <button
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressingMedia}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer flex-shrink-0"
              title="Attach Photo or Video"
            >
              {isCompressingMedia ? <Loader2 size={17} className="animate-spin text-teal-600 dark:text-teal-400" /> : <Paperclip size={17} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Emoji Button */}
            <button
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => {
                e.preventDefault();
                setShowEmojiPicker(!showEmojiPicker);
                focusInput();
              }}
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                focusInput();
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex-shrink-0 ${
                showEmojiPicker
                  ? "bg-teal-500/20 text-teal-700 dark:text-teal-400"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              placeholder={
                stagedMedia
                  ? "Add a caption..."
                  : selectedFriend
                  ? `Message ${selectedFriend.partnerName} securely...`
                  : "Add or accept a friend above to message..."
              }
              disabled={!selectedFriend}
              className="w-full bg-transparent text-base sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none py-1 font-sans font-medium disabled:opacity-50"
            />

            <button
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => {
                e.preventDefault();
                handleSend();
              }}
              onTouchEnd={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className={`p-2 sm:p-2.5 rounded-lg bg-[#005c4b] hover:bg-[#00705a] text-white transition-all flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center select-none ${
                (!inputText.trim() && !stagedMedia) || !selectedFriend
                  ? "opacity-35 cursor-not-allowed"
                  : "opacity-100 cursor-pointer shadow-md active:scale-95"
              }`}
              title="Send Message"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
        {/* Message Info Modal */}
        {selectedInfoMsg && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
            onClick={() => setSelectedInfoMsg(null)}
          >
            <div 
              className="w-full max-w-sm bg-white dark:bg-[#121226] border border-slate-200 dark:border-white/15 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Info size={16} className="text-teal-500" />
                  Message Info
                </h3>
                <button 
                  type="button" 
                  onClick={() => setSelectedInfoMsg(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Message Preview */}
              <div className="bg-slate-100 dark:bg-white/[0.04] p-3 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-words">
                &quot;{selectedInfoMsg.text}&quot;
              </div>

              {/* Timestamps */}
              <div className="space-y-3 text-xs">
                {/* Read */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCheck size={16} className="text-[#38bdf8] drop-shadow-[0_0_2px_#0284c7]" />
                    <span className="font-bold">Read</span>
                  </div>
                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    {selectedInfoMsg.isRead && selectedInfoMsg.readAt
                      ? new Date(selectedInfoMsg.readAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                      : selectedInfoMsg.isRead 
                      ? "Read" 
                      : "Not read yet"}
                  </span>
                </div>

                {/* Delivered */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCheck size={16} className="text-slate-400 dark:text-slate-400" />
                    <span className="font-bold">Delivered</span>
                  </div>
                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    {selectedInfoMsg.isDelivered && selectedInfoMsg.deliveredAt
                      ? new Date(selectedInfoMsg.deliveredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                      : selectedInfoMsg.isDelivered 
                      ? "Delivered" 
                      : "Sending / Waiting..."}
                  </span>
                </div>

                {/* Sent */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check size={16} className="text-slate-400 dark:text-slate-400" />
                    <span className="font-bold">Sent</span>
                  </div>
                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    {new Date(selectedInfoMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full-Screen Lightbox Modal for Images & Videos */}
        {lightboxMedia && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => setLightboxMedia(null)}
          >
            <div 
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-11 right-0 flex items-center gap-2">
                <a
                  href={lightboxMedia.url}
                  download={lightboxMedia.name || "media_attachment"}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  title="Download Media"
                >
                  <Download size={18} />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxMedia(null)}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  title="Close Lightbox"
                >
                  <X size={18} />
                </button>
              </div>

              {lightboxMedia.type === "image" ? (
                <img
                  src={lightboxMedia.url}
                  alt={lightboxMedia.name || "Full Image"}
                  className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
                />
              ) : (
                <video
                  src={lightboxMedia.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl bg-black"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
