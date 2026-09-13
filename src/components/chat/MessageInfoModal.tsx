"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, CheckCheck, Clock, ShieldCheck, Sparkles, FileText, Info } from "lucide-react";
import { MessageProps } from "./MessageBubble";
import { getFallbackAvatar } from "@/lib/avatars";

interface MessageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: MessageProps | null;
  partnerName?: string;
}

export default function MessageInfoModal({
  isOpen,
  onClose,
  message,
  partnerName = "Contact",
}: MessageInfoModalProps) {
  if (!isOpen || !message) return null;

  const formatDate = (dateInput: string | Date | undefined) => {
    if (!dateInput) return "—";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const isRead = Boolean(message.isRead || (message.readBy && message.readBy.length > 0));
  const readList = message.readBy || [];
  const isShortPreview = Boolean(
    message.text &&
    message.text.trim().length <= 3 &&
    !message.text.includes(" ") &&
    !message.text.includes("\n") &&
    !message.mediaData
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="w-full max-w-md bg-[#101018] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-[#007AFF] flex items-center justify-center">
                <Info size={16} />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">Message Info</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 p-5 overflow-y-auto space-y-5 scrollbar-thin">
            {/* Message Bubble Preview */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-black/40 border border-white/10">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono mb-2.5">
                Message Preview
              </div>
              <div className={`flex w-full ${message.isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`rounded-[20px] shadow-md select-text ${
                    isShortPreview
                      ? "w-fit min-w-[56px] min-h-[36px] px-4 py-2 flex items-center justify-center text-center"
                      : "w-fit max-w-[85%] px-4 py-2.5 flex flex-col justify-center text-left"
                  } ${
                    message.isMe
                      ? "bg-[#007AFF] text-white rounded-br-[5px]"
                      : "bg-[#2C2C2E] text-white rounded-bl-[5px] border border-white/10"
                  }`}
                >
                  {message.mediaType === "image" && message.mediaData && (
                    <img
                      src={message.mediaData}
                      alt="attachment"
                      className="max-h-40 rounded-xl object-cover mb-2"
                    />
                  )}
                  {message.mediaType === "file" && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-black/20 mb-1">
                      <FileText size={16} className="text-blue-200" />
                      <span className="truncate">{message.mediaName || "File"}</span>
                    </div>
                  )}
                  {message.text && (
                    <p className={`whitespace-pre-wrap break-words [word-break:break-word] leading-[1.38] text-sm font-normal text-white m-0 p-0 ${isShortPreview ? "text-center" : "text-left"}`}>
                      {message.text}
                    </p>
                  )}
                  {message.effect && (
                    <div className="mt-1 text-[10px] text-blue-100 flex items-center gap-1 opacity-90">
                      <Sparkles size={11} className="text-amber-300" />
                      <span className="capitalize">{message.effect.replace("_", " ")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Read & Delivery Timeline */}
            <div className="space-y-3">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                Status & Timestamps
              </div>

              {/* READ STATUS */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isRead ? "bg-blue-500/20 text-[#007AFF]" : "bg-white/10 text-slate-400"}`}>
                      <CheckCheck size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Read</h4>
                      <p className="text-[10px] text-slate-400">
                        {isRead ? "Seen by recipient" : "Not read yet"}
                      </p>
                    </div>
                  </div>
                  {isRead && (
                    <span className="text-[10px] font-bold text-[#007AFF] bg-blue-500/10 px-2 py-0.5 rounded-full">
                      Seen
                    </span>
                  )}
                </div>

                {/* Who read and when */}
                {isRead && readList.length > 0 ? (
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    {readList.map((reader, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={getFallbackAvatar(reader.userName || partnerName, "user")}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="font-semibold text-slate-200 truncate">
                            {reader.userName || partnerName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                          {formatDate(reader.readAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : isRead ? (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
                    <span>{partnerName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* DELIVERED STATUS */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white/10 text-slate-300 flex items-center justify-center">
                    <CheckCheck size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Delivered</h4>
                    <p className="text-[10px] text-slate-400">Delivered to server</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatDate(message.createdAt)}
                </span>
              </div>

              {/* SENT STATUS */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white/10 text-slate-300 flex items-center justify-center">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Sent</h4>
                    <p className="text-[10px] text-slate-400">Sent by {message.senderName}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatDate(message.createdAt)}
                </span>
              </div>
            </div>

            {/* Encryption & Security Note */}
            <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-500/20 flex items-center gap-2.5 text-[11px] text-blue-300">
              <ShieldCheck size={18} className="text-[#007AFF] flex-shrink-0" />
              <span>
                Protected with AES-256-GCM End-to-End Encryption. Only conversation participants can view this message.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-5 py-3.5 border-t border-white/10 bg-[#101018] flex justify-end z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#007AFF] hover:bg-[#0069D9] active:scale-95 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/20"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
