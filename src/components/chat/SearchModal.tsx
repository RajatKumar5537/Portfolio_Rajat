"use client";

import React, { useState } from "react";
import { X, Search, Sparkles, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  onSelectMessage: (messageId: string) => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  messages,
  onSelectMessage,
}: SearchModalProps) {
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const results = query.trim()
    ? messages.filter((m) =>
        (m.text || "").toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <AnimatePresence>
      <div
        style={{
          paddingTop: "max(16px, calc(env(safe-area-inset-top, 0px) + 12px))",
          paddingBottom: "max(16px, calc(env(safe-area-inset-bottom, 0px) + 12px))",
        }}
        className="safe-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg min-h-[460px] max-h-[85dvh] flex flex-col bg-neutral-900/95 border border-white/15 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl"
        >
          {/* Header Bar */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-white/10 bg-[#16161c] flex-shrink-0 z-20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Search Messages</h2>
                <p className="text-xs text-neutral-400">Find keywords in this conversation</p>
              </div>
            </div>

            {/* Prominent High-Contrast Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all border border-white/20 shadow-md flex-shrink-0 cursor-pointer"
              title="Close"
            >
              <X className="w-4.5 h-4.5 text-white stroke-[2.5]" />
            </button>
          </div>

          <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.07] focus-within:bg-white/[0.07] border border-white/10 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 rounded-2xl transition-all shadow-inner flex-shrink-0">
              <Search className="w-4.5 h-4.5 text-neutral-400 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search keywords, texts, quotes..."
                className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-neutral-500 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results List or Empty Prompt */}
            <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[220px]">
              {!query.trim() ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-neutral-400 shadow-inner">
                    <MessageSquare className="w-7 h-7 stroke-1 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-white">Search Chat History</p>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                    Type a keyword above to find matching encrypted messages.
                  </p>
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                  <p className="text-sm font-semibold text-white">No Matching Messages</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    No results found for &ldquo;{query}&rdquo;.
                  </p>
                </div>
              ) : (
                results.map((m) => (
                  <button
                    key={m._id}
                    onClick={() => {
                      onSelectMessage(m._id);
                      onClose();
                    }}
                    className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-left transition-all group cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                      <span className="font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                        {m.senderName}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {new Date(m.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-200 line-clamp-2">{m.text}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
