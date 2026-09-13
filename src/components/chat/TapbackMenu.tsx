"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Plus } from "lucide-react";
import { soundEngine } from "@/lib/audio";

interface TapbackMenuProps {
  currentReactions?: Array<{ userId: string; emoji: string }>;
  currentUserId: string;
  onSelectReaction: (emoji: string) => void;
  onClose?: () => void;
  position?: "top" | "bottom";
  isMe?: boolean;
}

const DEFAULT_TAPBACKS = [
  { emoji: "❤️", label: "Love" },
  { emoji: "👍", label: "Like" },
  { emoji: "👎", label: "Dislike" },
  { emoji: "😂", label: "HaHa" },
  { emoji: "‼️", label: "Emphasis" },
  { emoji: "❓", label: "Question" },
];

const EXTENDED_EMOJIS = [
  "🔥", "🎉", "🥰", "🥺", "✨", "💯", "👏", "🚀", 
  "😎", "😍", "🙌", "💀", "🤩", "🤯", "🥳", "⚡"
];

export default function TapbackMenu({
  currentReactions = [],
  currentUserId,
  onSelectReaction,
  onClose,
  position = "top",
  isMe = false,
}: TapbackMenuProps) {
  const [showExtended, setShowExtended] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const myReaction = currentReactions.find((r) => r.userId === currentUserId)?.emoji;

  const handleSelect = (emoji: string) => {
    soundEngine.playTapback();
    onSelectReaction(emoji);
    if (onClose) onClose();
  };

  // Close on outside pointer interaction
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (onClose) onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.8, y: position === "top" ? 8 : -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: position === "top" ? 8 : -8 }}
      transition={{ type: "spring", damping: 22, stiffness: 380 }}
      className={`absolute ${
        position === "top" ? "bottom-full mb-2" : "top-full mt-2"
      } ${isMe ? "right-0 origin-bottom-right" : "left-0 origin-bottom-left"} z-50`}
    >
      <div className="flex items-center gap-1.5 p-1.5 bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.8),0_0_15px_rgba(0,122,255,0.2)]">
        {DEFAULT_TAPBACKS.map((item, idx) => {
          const isSelected = myReaction === item.emoji;
          return (
            <motion.button
              key={item.emoji}
              whileHover={{ scale: 1.28, y: -3 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.025 }}
              onClick={() => handleSelect(item.emoji)}
              title={item.label}
              className={`w-9 h-9 flex items-center justify-center rounded-full text-xl transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#007AFF]/40 border border-[#007AFF] shadow-md shadow-[#007AFF]/30"
                  : "hover:bg-white/15"
              }`}
            >
              {item.emoji}
            </motion.button>
          );
        })}

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowExtended(!showExtended)}
          title="More Emojis"
          className={`w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white transition-all cursor-pointer ${
            showExtended ? "bg-white/20 text-white" : "hover:bg-white/10"
          }`}
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Extended Emojis Drawer */}
      <AnimatePresence>
        {showExtended && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            className={`absolute ${
              isMe ? "right-0" : "left-0"
            } mt-2 p-3 bg-[#1C1C1E]/98 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl grid grid-cols-4 gap-2 z-50 w-52`}
          >
            {EXTENDED_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                className="w-10 h-10 flex items-center justify-center text-xl rounded-xl hover:bg-white/15 hover:scale-115 transition-all cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
