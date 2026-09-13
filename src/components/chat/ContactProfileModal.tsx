"use client";

import React, { useState } from "react";
import {
  X,
  Phone,
  Video,
  Search,
  Clock,
  Trash2,
  Image as ImageIcon,
  Mic,
  FileText,
  Shield,
  Bell,
  BellOff,
  Mail,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VoiceMemoPlayer from "./VoiceMemoPlayer";
import MediaViewerModal from "./MediaViewerModal";
import { getFallbackAvatar } from "@/lib/avatars";

interface ContactProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: {
    _id: string;
    type: "direct" | "group";
    name: string;
    icon?: string;
    isOnline?: boolean;
    participants?: string[];
    participantDetails?: any[];
    disappearingHours?: number;
  };
  messages: any[];
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  onOpenSearch: () => void;
  onClearChat: () => void;
  onSetDisappearingTimer: (hours: number) => void;
}

export default function ContactProfileModal({
  isOpen,
  onClose,
  conversation,
  messages,
  onStartAudioCall,
  onStartVideoCall,
  onOpenSearch,
  onClearChat,
  onSetDisappearingTimer,
}: ContactProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"media" | "audio" | "docs" | "settings">("media");
  const [isMuted, setIsMuted] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);

  const handleDownloadMedia = (url: string, name?: string | null, type: "image" | "video" = "image", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    const ext = type === "video" ? "mp4" : "jpg";
    link.download = name || `media_${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  // Filter shared media
  const photoVideos = messages.filter(
    (m) => (m.mediaType === "image" || m.mediaType === "video") && m.mediaData && !m.isDeleted
  );
  const audioNotes = messages.filter(
    (m) => m.mediaType === "audio" && m.mediaData && !m.isDeleted
  );
  const documents = messages.filter(
    (m) => m.mediaType === "file" && !m.isDeleted
  );

  const getTimerLabel = (hours?: number) => {
    if (!hours || hours <= 0) return "Off";
    if (Math.abs(hours - 1 / 60) < 0.001) return "1 Min timer";
    if (hours < 1) return `${Math.round(hours * 60)} Mins timer`;
    if (hours === 1) return "1 Hour timer";
    if (hours === 24) return "24 Hours timer";
    if (hours === 168) return "7 Days timer";
    return `${hours}h timer`;
  };

  const timerOptions = [
    { hours: 0, label: "Off" },
    { hours: 1 / 60, label: "1 Min" },
    { hours: 1, label: "1 Hour" },
    { hours: 24, label: "24 Hours" },
    { hours: 168, label: "7 Days" },
  ];

  const peer = conversation.participantDetails?.[0];

  return (
    <AnimatePresence>
      <div
        style={{
          paddingTop: "max(16px, calc(env(safe-area-inset-top, 0px) + 12px))",
          paddingBottom: "max(16px, calc(env(safe-area-inset-bottom, 0px) + 12px))",
        }}
        className="safe-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-lg bg-[#0b0b1a] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] my-auto"
        >
          {/* Header Bar with Close Button */}
          <div className="px-6 py-4 sm:py-5 flex items-center justify-between border-b border-white/10 bg-white/[0.03] flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {conversation.type === "group" ? "Group Details" : "Contact Profile"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Media, voice notes & conversation settings</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Contact Avatar & Bio Header */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3">
                <img
                  src={conversation.icon || getFallbackAvatar(conversation.name, conversation.type)}
                  alt={conversation.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-blue-400/40 shadow-xl"
                />
                {conversation.type === "direct" && conversation.isOnline && (
                  <span className="absolute bottom-0 right-1 w-4 h-4 rounded-full bg-[#30D158] border-2 border-[#0b0b1a] shadow-sm animate-pulse" />
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{conversation.name}</h2>
              {conversation.type === "direct" && peer?.email && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>{peer.email}</span>
                </p>
              )}

              {/* Status / Bio */}
              <div className="mt-2 px-3.5 py-1 bg-blue-500/10 border border-blue-500/25 rounded-full text-xs text-blue-300 font-mono">
                {peer?.statusMessage || (conversation.isOnline ? "Active now" : "Available")}
              </div>
            </div>

            {/* Quick Action Shortcuts: Generous Grid */}
            <div className="grid grid-cols-4 gap-3 py-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartAudioCall();
                }}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white/[0.05] hover:bg-[#30D158]/20 text-slate-300 hover:text-[#30D158] border border-white/10 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Phone className="w-5 h-5 text-[#30D158]" />
                <span className="text-[11px] font-semibold text-white">Audio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartVideoCall();
                }}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white/[0.05] hover:bg-blue-500/20 text-slate-300 hover:text-blue-400 border border-white/10 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Video className="w-5 h-5 text-blue-400" />
                <span className="text-[11px] font-semibold text-white">FaceTime</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Search className="w-5 h-5 text-blue-400" />
                <span className="text-[11px] font-semibold text-white">Search</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-sm ${
                  isMuted
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-white/[0.05] border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                {isMuted ? <BellOff className="w-5 h-5 text-amber-400" /> : <Bell className="w-5 h-5 text-slate-300" />}
                <span className="text-[11px] font-semibold text-white">{isMuted ? "Muted" : "Mute"}</span>
              </button>
            </div>

            {/* Content Tabs Navigation */}
            <div className="flex items-center gap-1.5 p-1.5 bg-white/[0.05] rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("media")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === "media"
                    ? "bg-[#007AFF] text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Photos ({photoVideos.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("audio")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === "audio"
                    ? "bg-[#007AFF] text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Voice ({audioNotes.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("docs")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === "docs"
                    ? "bg-[#007AFF] text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Files ({documents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-[#007AFF] text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Privacy
              </button>
            </div>

            {/* TAB: MEDIA GALLERY */}
            {activeTab === "media" && (
              <div className="min-h-[160px]">
                {photoVideos.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs flex flex-col items-center gap-2 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                    <span>No photos or videos exchanged yet</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5">
                    {photoVideos.map((m, idx) => (
                      <div
                        key={m._id}
                        onClick={() => setSelectedMediaIndex(idx)}
                        className="relative aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-sm group cursor-pointer"
                        title="Click to view full screen gallery"
                      >
                        {m.mediaType === "video" ? (
                          <video src={m.mediaData} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <img
                            src={m.mediaData}
                            alt={m.mediaName || "Media"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        {/* Quick Download Overlay Button */}
                        <button
                          type="button"
                          onClick={(e) =>
                            handleDownloadMedia(
                              m.mediaData,
                              m.mediaName,
                              m.mediaType === "video" ? "video" : "image",
                              e
                            )
                          }
                          className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 shadow-md transition-all hover:scale-110 active:scale-95 z-10 cursor-pointer opacity-90 group-hover:opacity-100"
                          title="Download Media"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: VOICE NOTES */}
            {activeTab === "audio" && (
              <div className="min-h-[160px] space-y-2.5">
                {audioNotes.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs flex flex-col items-center gap-2 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                    <Mic className="w-8 h-8 text-slate-600" />
                    <span>No audio voice notes recorded in this chat</span>
                  </div>
                ) : (
                  audioNotes.map((m) => (
                    <div key={m._id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-[11px] text-slate-400 mb-1">
                          {m.senderName} • {new Date(m.createdAt).toLocaleDateString()}
                        </div>
                        <VoiceMemoPlayer audioSrc={m.mediaData} durationSec={m.audioDuration} isMe={false} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: DOCUMENTS */}
            {activeTab === "docs" && (
              <div className="min-h-[160px] space-y-2.5">
                {documents.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs flex flex-col items-center gap-2 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                    <FileText className="w-8 h-8 text-slate-600" />
                    <span>No files or documents shared yet</span>
                  </div>
                ) : (
                  documents.map((m) => (
                    <a
                      key={m._id}
                      href={m.mediaData || "#"}
                      download={m.mediaName || "document"}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{m.mediaName || "Document"}</div>
                          <div className="text-[10px] text-slate-400">{m.mediaSize || "File"}</div>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-slate-400 hover:text-white" />
                    </a>
                  ))
                )}
              </div>
            )}

            {/* TAB: PRIVACY & SETTINGS */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                {/* Disappearing Timer */}
                <div className="p-4 bg-white/[0.04] rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4.5 h-4.5 text-blue-400" />
                      <span className="text-xs font-bold text-white">Disappearing Messages</span>
                    </div>
                    <span className="text-xs text-blue-400 font-mono font-bold">
                      {getTimerLabel(conversation.disappearingHours)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    New messages in this chat will self-destruct for both participants after the selected duration.
                  </p>
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {timerOptions.map((opt) => {
                      const isSelected = Math.abs((conversation.disappearingHours || 0) - opt.hours) < 0.001;
                      return (
                        <button
                          key={opt.hours}
                          type="button"
                          onClick={() => onSetDisappearingTimer(opt.hours)}
                          className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#007AFF] text-white shadow-md border border-blue-400/40"
                              : "bg-white/[0.06] hover:bg-white/10 text-slate-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Encryption Info */}
                <div className="flex items-center gap-3.5 p-4 bg-white/[0.04] rounded-2xl border border-white/10 text-xs text-slate-300">
                  <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white block">End-to-End Encrypted (AES-256)</span>
                    <span className="text-[11px] text-slate-400">
                      Messages and calls are secured with AES-256-GCM encryption.
                    </span>
                  </div>
                </div>

                {/* Clear Chat */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onClearChat();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold text-red-300 transition-all cursor-pointer active:scale-98"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Conversation History</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
        {/* FULLSCREEN MEDIA VIEWER MODAL (Gallery Lightbox) */}
        {selectedMediaIndex !== null && (
          <MediaViewerModal
            isOpen={selectedMediaIndex !== null}
            items={photoVideos.map((m) => ({
              type: (m.mediaType === "video" ? "video" : "image") as "image" | "video",
              data: m.mediaData || "",
              name: m.mediaName,
              size: m.mediaSize,
            }))}
            initialIndex={selectedMediaIndex}
            onClose={() => setSelectedMediaIndex(null)}
          />
        )}
      </div>
    </AnimatePresence>
  );
}
