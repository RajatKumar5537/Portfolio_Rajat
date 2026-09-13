"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CheckCheck,
  Reply,
  Edit3,
  Trash2,
  Pin,
  Sparkles,
  FileText,
  Download,
  Copy,
  Info,
} from "lucide-react";
import TapbackMenu from "./TapbackMenu";
import InvisibleInk from "../effects/InvisibleInk";
import VoiceMemoPlayer from "./VoiceMemoPlayer";
import MessageInfoModal from "./MessageInfoModal";
import MediaViewerModal from "./MediaViewerModal";
import { getFallbackAvatar } from "@/lib/avatars";
import { soundEngine } from "@/lib/audio";

interface ReactionItem {
  userId: string;
  userName: string;
  emoji: string;
}

export interface MessageProps {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  isMe: boolean;
  text: string;
  effect?: "fireworks" | "balloons" | "confetti" | "lasers" | "love" | "shooting_star" | "good_morning" | "good_night" | "invisible_ink" | "slam" | "loud" | "gentle" | null;
  mediaType?: "image" | "video" | "audio" | "file" | null;
  mediaData?: string | null;
  mediaName?: string | null;
  mediaSize?: string | null;
  audioDuration?: number;
  reactions?: ReactionItem[];
  replyTo?: { id: string; senderName: string; text: string; mediaType?: string } | null;
  readBy?: Array<{ userId: string; userName?: string; readAt: string | Date }>;
  isRead?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
  createdAt: string | Date;
}

interface MessageBubbleComponentProps {
  message: MessageProps;
  currentUserId: string;
  partnerName?: string;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: MessageProps) => void;
  onEdit: (message: MessageProps) => void;
  onDelete: (messageId: string) => void;
  onTogglePin: (messageId: string, isPinned: boolean) => void;
  onTriggerEffect?: (effectName: any) => void;
  onJumpToMessage?: (messageId: string) => void;
  isHighlighted?: boolean;
  showAvatar?: boolean;
}

export default function MessageBubble({
  message,
  currentUserId,
  partnerName,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onTogglePin,
  onTriggerEffect,
  onJumpToMessage,
  isHighlighted = false,
  showAvatar = true,
}: MessageBubbleComponentProps) {
  const [showTapback, setShowTapback] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [copied, setCopied] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);

  // Universal gesture swipe (left or right) to reply
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const pointerStartXRef = useRef<number>(0);
  const pointerStartYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerStartXRef.current = e.clientX;
    pointerStartYRef.current = e.clientY;
    isDraggingRef.current = false;
    activePointerIdRef.current = e.pointerId;
    setSwipeOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    const deltaX = e.clientX - pointerStartXRef.current;
    const deltaY = e.clientY - pointerStartYRef.current;

    if (!isDraggingRef.current) {
      if (Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        isDraggingRef.current = true;
        setIsSwiping(true);
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch (_) {}
      } else if (Math.abs(deltaY) > 8) {
        return;
      }
    }

    if (isDraggingRef.current) {
      // Damped smooth spring resistance
      const damped = deltaX > 0 ? Math.min(85, deltaX * 0.75) : Math.max(-85, deltaX * 0.75);
      setSwipeOffset(damped);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      // Swiping either left or right past 35px triggers reply!
      if (Math.abs(swipeOffset) > 35) {
        soundEngine.playTapback();
        onReply(message);
      }
    }

    try {
      if (activePointerIdRef.current !== null) {
        (e.currentTarget as HTMLElement).releasePointerCapture(activePointerIdRef.current);
      }
    } catch (_) {}

    activePointerIdRef.current = null;
    isDraggingRef.current = false;
    setIsSwiping(false);
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
    setIsSwiping(false);
    setSwipeOffset(0);
  };

  const isShortText = Boolean(
    message.text &&
    message.text.trim().length <= 5 &&
    !message.text.includes(" ") &&
    !message.text.includes("\n") &&
    !message.mediaData
  );

  const isMe = message.isMe;

  const timeStr = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const groupedReactions = (message.reactions || []).reduce<Record<string, { count: number; userNames: string[] }>>(
    (acc, curr) => {
      if (!acc[curr.emoji]) acc[curr.emoji] = { count: 0, userNames: [] };
      acc[curr.emoji].count += 1;
      acc[curr.emoji].userNames.push(curr.userName);
      return acc;
    },
    {}
  );

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit({ ...message, text: editText.trim() });
    }
    setIsEditing(false);
  };

  const handleCopy = () => {
    if (message.text) {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(message.text).catch(() => {});
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownloadMedia = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!message.mediaData) return;
    const link = document.createElement("a");
    link.href = message.mediaData;
    const defaultExt = message.mediaType === "video" ? "mp4" : "jpg";
    link.download = message.mediaName || `media_${Date.now()}.${defaultExt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMotionProps = () => {
    if (message.effect === "slam") {
      return { initial: { scale: 2.5, y: -45, opacity: 0 }, animate: { scale: 1, y: 0, opacity: 1 }, transition: { type: "spring" as const, stiffness: 450, damping: 16 } };
    }
    if (message.effect === "loud") {
      return { initial: { scale: 0.8, opacity: 0 }, animate: { scale: [1, 1.3, 0.95, 1.1, 1], rotate: [0, -3.5, 3.5, -2, 0], opacity: 1 }, transition: { duration: 0.7 } };
    }
    if (message.effect === "gentle") {
      return { initial: { scale: 0.45, opacity: 0, y: 10 }, animate: { scale: 1, opacity: 1, y: 0 }, transition: { duration: 0.8 } };
    }
    return { initial: { opacity: 0, scale: 0.97, y: 4 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { duration: 0.15 } };
  };

  const motionProps = getMotionProps();

  return (
    <>
      <div
        id={`chat-msg-${message._id}`}
        className={`relative flex flex-col select-none transition-all duration-300 ${
          isMe ? "items-end pr-2 sm:pr-3 pl-8 sm:pl-16" : "items-start pl-2 sm:pl-3 pr-8 sm:pr-16"
        } ${
          isHighlighted
            ? "ring-2 ring-[#007AFF] bg-blue-500/20 rounded-3xl p-1 shadow-[0_0_30px_rgba(0,122,255,0.7)] scale-[1.02]"
            : ""
        }`}
      >
        {message.isPinned && (
          <div className="flex items-center gap-1 text-[10px] text-amber-400/90 mb-1 px-1 font-medium">
            <Pin className="w-3 h-3 fill-current" />
            <span>Pinned</span>
          </div>
        )}

        <div className={`flex items-end gap-2 max-w-[88%] sm:max-w-md md:max-w-lg lg:max-w-xl ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          {!isMe && showAvatar && (
            <img
              src={message.senderAvatar || getFallbackAvatar(message.senderName, "user")}
              alt={message.senderName}
              className="w-7 h-7 rounded-full object-cover border border-white/10 shadow-sm flex-shrink-0 mb-1"
            />
          )}

          <div
            className={`relative group touch-pan-y max-w-full min-w-0 flex flex-col ${isMe ? "items-end" : "items-start"}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            style={{
              transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : "none",
              transition: isSwiping ? "none" : "transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)",
            }}
          >
            {/* Visual Reply Cue on swipe left or right */}
            {isSwiping && Math.abs(swipeOffset) > 12 && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 z-0 flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/30 text-blue-400 border border-blue-400/40 pointer-events-none transition-transform ${
                  swipeOffset > 0 ? "-left-9" : "-right-9"
                }`}
                style={{
                  transform: `translateY(-50%) scale(${Math.min(1.15, Math.abs(swipeOffset) / 35)})`,
                  opacity: Math.min(1, Math.abs(swipeOffset) / 25),
                }}
              >
                <Reply className="w-4 h-4 text-[#007AFF]" />
              </div>
            )}
            {/* TAPBACK REACTION POPUP */}
            <AnimatePresence>
              {showTapback && (
                <TapbackMenu
                  currentReactions={message.reactions || []}
                  currentUserId={currentUserId}
                  isMe={isMe}
                  onSelectReaction={(emoji) => { onReact(message._id, emoji); setShowTapback(false); }}
                  onClose={() => setShowTapback(false)}
                />
              )}
            </AnimatePresence>

            {/* REPLY QUOTE PREVIEW - Click to jump to original message */}
            {message.replyTo && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (message.replyTo?.id && onJumpToMessage) {
                    onJumpToMessage(message.replyTo.id);
                  }
                }}
                className={`mb-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] max-w-full cursor-pointer hover:opacity-80 active:scale-[0.98] transition-all ${
                  isMe
                    ? "bg-blue-900/50 border-blue-300/30 text-blue-100 hover:bg-blue-900/70"
                    : "bg-white/[0.06] border-white/10 text-slate-300 hover:bg-white/[0.12]"
                }`}
                title="Click to jump to replied message"
              >
                <Reply className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                {message.replyTo.senderName && <span className="font-bold">{message.replyTo.senderName}:</span>}
                <span className="truncate">{message.replyTo.text || "[Media Attachment]"}</span>
              </div>
            )}

            {/* MAIN MESSAGE BUBBLE */}
            <motion.div
              initial={motionProps.initial}
              animate={motionProps.animate}
              transition={motionProps.transition}
              onContextMenu={(e) => { e.preventDefault(); setShowTapback(true); }}
              onClick={() => setShowActions((v) => !v)}
              className={`relative rounded-[20px] shadow-sm select-none touch-pan-y cursor-pointer ${
                message.isDeleted
                  ? "bg-[#2C2C2E] text-slate-400 italic border border-white/[0.06]"
                  : isMe
                  ? "bg-[#007AFF] text-white rounded-br-[5px]"
                  : "bg-[#2C2C2E] text-white rounded-bl-[5px] border border-white/[0.06]"
              }`}
              style={{
                width: "fit-content",
                maxWidth: "100%",
                minWidth: "56px",
                minHeight: "38px",
                paddingLeft: "18px",
                paddingRight: "18px",
                paddingTop: "9px",
                paddingBottom: "9px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {/* Sender Name only in Group Chats on received messages */}
              {!isMe && showAvatar && !message.isDeleted && (
                <div className="text-[11px] font-semibold text-blue-400 mb-1 select-none text-left">
                  {message.senderName || "Member"}
                </div>
              )}

              {message.isDeleted ? (
                <span className="text-slate-400 italic text-[13px] flex items-center gap-1.5 text-left">
                  <span>🚫</span>
                  <span>This message was deleted</span>
                </span>
              ) : isEditing ? (
                <div className="space-y-1.5 my-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                    className="w-full bg-white/15 border border-white/30 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white text-left"
                    autoFocus
                  />
                  <div className="flex gap-1.5 justify-end">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-2.5 py-1 text-[10px] bg-white/15 hover:bg-white/25 rounded-lg text-white cursor-pointer">Cancel</button>
                    <button type="button" onClick={handleSaveEdit} className="px-2.5 py-1 text-[10px] bg-white text-blue-600 rounded-lg font-bold cursor-pointer hover:bg-white/90">Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-center">
                  {message.mediaType === "image" && message.mediaData && (
                    <div className="relative rounded-2xl overflow-hidden bg-black/30 mb-1 group/media max-w-full">
                      <img
                        src={message.mediaData}
                        alt={message.mediaName || "Photo"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMediaViewer(true);
                        }}
                        className="w-full max-h-72 object-cover rounded-2xl hover:scale-[1.01] transition-transform cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={handleDownloadMedia}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md shadow-md border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer z-10"
                        title="Download Photo"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {message.mediaType === "video" && message.mediaData && (
                    <div className="relative rounded-2xl overflow-hidden bg-black/30 mb-1 group/media max-w-full">
                      <video
                        src={message.mediaData}
                        controls
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMediaViewer(true);
                        }}
                        className="w-full max-h-72 rounded-2xl cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={handleDownloadMedia}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md shadow-md border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer z-10"
                        title="Download Video"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {message.mediaType === "audio" && message.mediaData && (
                    <VoiceMemoPlayer audioSrc={message.mediaData} durationSec={message.audioDuration || 0} isMe={isMe} />
                  )}
                  {message.mediaType === "file" && (
                    <a href={message.mediaData || "#"} download={message.mediaName || "attachment"} onClick={(e) => e.stopPropagation()} className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${isMe ? "bg-white/15 hover:bg-white/25 text-white" : "bg-black/40 hover:bg-black/60 text-slate-200"}`}>
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-white" /></div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-xs font-semibold truncate">{message.mediaName || "Document"}</div>
                        <div className="text-[10px] opacity-75 font-mono">{message.mediaSize || "File"}</div>
                      </div>
                      <Download className="w-4 h-4 opacity-80 hover:opacity-100 ml-1" />
                    </a>
                  )}
                  {/* Clean Native iMessage Typography: Card perfectly hugs text in both width & height */}
                  {message.text && (
                    <div className="select-text">
                      {message.effect === "invisible_ink" ? (
                        <InvisibleInk>
                          <p className={`whitespace-pre-wrap break-words [word-break:break-word] leading-[1.38] text-[15px] sm:text-[15.5px] font-normal text-white tracking-[-0.01em] m-0 p-0 ${
                            isShortText ? "text-center" : "text-left"
                          }`}>
                            {message.text}
                          </p>
                        </InvisibleInk>
                      ) : (
                        <p className={`whitespace-pre-wrap break-words [word-break:break-word] leading-[1.38] text-[15px] sm:text-[15.5px] font-normal text-white tracking-[-0.01em] m-0 p-0 ${
                          isShortText ? "text-center" : "text-left"
                        }`}>
                          {message.text}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* REACTIONS ATTACHED TO BUBBLE */}
              {Object.keys(groupedReactions).length > 0 && (
                <div
                  onClick={(e) => { e.stopPropagation(); setShowTapback(true); }}
                  className={`absolute -bottom-2.5 z-10 cursor-pointer select-none flex items-center gap-0.5 px-2 py-0.5 bg-[#1C1C1E] border border-white/20 rounded-full shadow-lg ${isMe ? "right-2" : "left-2"}`}
                >
                  {Object.entries(groupedReactions).map(([emoji, data]) => (
                    <span key={emoji} className="text-xs flex items-center leading-none" title={data.userNames.join(", ")}>
                      {emoji}{data.count > 1 && <span className="text-[9px] font-bold ml-0.5 text-blue-400">{data.count}</span>}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* EFFECT REPLAY BADGE OUTSIDE BUBBLE (Native Apple iMessage Style) */}
            {!message.isDeleted && message.effect && message.effect !== "invisible_ink" && (
              <div className={`mt-1 flex ${isMe ? "justify-end mr-1" : "justify-start ml-1"}`}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onTriggerEffect && onTriggerEffect(message.effect); }}
                  className="inline-flex items-center gap-1 text-[10.5px] px-2.5 py-0.5 rounded-full font-medium bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Replay Effect"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span className="capitalize">Replay {message.effect.replace("_", " ")}</span>
                </button>
              </div>
            )}

            {/* STATUS & TIMESTAMP BELOW BUBBLE (Native iOS iMessage Style) */}
            {!message.isDeleted && (
              <div
                className={`mt-1 flex items-center gap-1.5 text-[11px] text-zinc-400 select-none ${
                  isMe ? "justify-end mr-1" : "justify-start ml-1"
                }`}
              >
                {message.isEdited && <span className="opacity-75 italic text-[8.5px]">(edited)</span>}
                <span>{timeStr}</span>
                {isMe && (
                  <>
                    <span className={message.isRead ? "text-zinc-300 font-medium" : "text-zinc-500"}>
                      {message.isRead ? "Read" : "Sent"}
                    </span>
                    {message.isRead ? (
                      <CheckCheck className="w-3.5 h-3.5 inline text-[#007AFF]" />
                    ) : (
                      <Check className="w-3.5 h-3.5 inline text-zinc-500" />
                    )}
                  </>
                )}
              </div>
            )}

            {/* ACTION BAR - below bubble, tap on mobile */}
            <AnimatePresence>
              {showActions && !message.isDeleted && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  onClick={(e) => e.stopPropagation()}
                  className={`mt-2 flex items-center gap-1 p-1 rounded-2xl bg-[#141420]/95 border border-white/15 shadow-2xl backdrop-blur-xl z-20 md:hidden ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <button type="button" onClick={() => { onReply(message); setShowActions(false); }} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={handleCopy} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title={copied ? "Copied!" : "Copy"}><Copy className={`w-3.5 h-3.5 ${copied ? "text-blue-400" : ""}`} /></button>
                  <button type="button" onClick={() => { setShowTapback(true); setShowActions(false); }} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="React"><Sparkles className="w-3.5 h-3.5 text-amber-400" /></button>
                  <button type="button" onClick={() => { setShowInfoModal(true); setShowActions(false); }} className="p-1.5 rounded-xl text-slate-300 hover:text-blue-400 hover:bg-white/10 transition-all cursor-pointer" title="Message Info"><Info className="w-3.5 h-3.5 text-blue-400" /></button>
                  {isMe && <button type="button" onClick={() => { setIsEditing(true); setShowActions(false); }} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>}
                  <button type="button" onClick={() => { onTogglePin(message._id, !message.isPinned); setShowActions(false); }} className="p-1.5 rounded-xl text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-all cursor-pointer" title={message.isPinned ? "Unpin" : "Pin"}><Pin className="w-3.5 h-3.5" /></button>
                  {isMe && <button type="button" onClick={() => { onDelete(message._id); setShowActions(false); }} className="p-1.5 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-500/20 transition-all cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Desktop: hover action bar to the side */}
            {!message.isDeleted && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`hidden md:flex absolute top-1.5 ${isMe ? "-left-2 -translate-x-full" : "-right-2 translate-x-full"} opacity-0 group-hover:opacity-100 transition-all items-center gap-0.5 bg-[#141420]/90 backdrop-blur-xl border border-white/15 p-1 rounded-2xl shadow-2xl z-20`}
              >
                <button type="button" onClick={() => setShowTapback(!showTapback)} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="React"><Sparkles className="w-3.5 h-3.5 text-amber-400" /></button>
                <button type="button" onClick={() => onReply(message)} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={handleCopy} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title={copied ? "Copied!" : "Copy"}><Copy className={`w-3.5 h-3.5 ${copied ? "text-blue-400" : ""}`} /></button>
                <button type="button" onClick={() => setShowInfoModal(true)} className="p-1.5 rounded-xl text-slate-300 hover:text-blue-400 hover:bg-white/10 transition-all cursor-pointer" title="Message Info"><Info className="w-3.5 h-3.5 text-blue-400" /></button>
                {isMe && <button type="button" onClick={() => setIsEditing(true)} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>}
                <button type="button" onClick={() => onTogglePin(message._id, !message.isPinned)} className="p-1.5 rounded-xl text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-all cursor-pointer" title={message.isPinned ? "Unpin" : "Pin"}><Pin className="w-3.5 h-3.5" /></button>
                {isMe && <button type="button" onClick={() => onDelete(message._id)} className="p-1.5 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-500/20 transition-all cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MESSAGE INFO MODAL */}
      <MessageInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        message={message}
        partnerName={partnerName}
      />

      {/* FULLSCREEN MEDIA VIEWER MODAL */}
      {showMediaViewer && message.mediaData && (message.mediaType === "image" || message.mediaType === "video") && (
        <MediaViewerModal
          isOpen={showMediaViewer}
          mediaType={message.mediaType}
          mediaData={message.mediaData}
          mediaName={message.mediaName}
          mediaSize={message.mediaSize}
          onClose={() => setShowMediaViewer(false)}
        />
      )}
    </>
  );
}
