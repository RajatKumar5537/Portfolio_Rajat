"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";

export interface MediaItem {
  type: "image" | "video";
  data: string;
  name?: string | null;
  size?: string | null;
}

interface MediaViewerModalProps {
  isOpen: boolean;
  mediaType?: "image" | "video";
  mediaData?: string;
  mediaName?: string | null;
  mediaSize?: string | null;
  items?: MediaItem[];
  initialIndex?: number;
  onClose: () => void;
}

export default function MediaViewerModal({
  isOpen,
  mediaType = "image",
  mediaData = "",
  mediaName,
  mediaSize,
  items,
  initialIndex = 0,
  onClose,
}: MediaViewerModalProps) {
  // Build normalized list of media items
  const mediaList: MediaItem[] = React.useMemo(() => {
    if (items && items.length > 0) return items;
    if (mediaData) {
      return [{ type: mediaType, data: mediaData, name: mediaName, size: mediaSize }];
    }
    return [];
  }, [items, mediaData, mediaType, mediaName, mediaSize]);

  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 && initialIndex < mediaList.length ? initialIndex : 0
  );

  // Sync index when initialIndex changes
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < mediaList.length) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, mediaList.length]);

  const currentItem = mediaList[currentIndex] || {
    type: mediaType,
    data: mediaData,
    name: mediaName,
    size: mediaSize,
  };

  const hasMultiple = mediaList.length > 1;

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation: Esc to close, ArrowLeft / ArrowRight to navigate
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && hasMultiple) {
        goToPrev();
      } else if (e.key === "ArrowRight" && hasMultiple) {
        goToNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasMultiple, mediaList.length]);

  // Touch swipe support for mobile
  const touchStartXRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 40 && hasMultiple) {
      if (deltaX > 0) {
        goToPrev();
      } else {
        goToNext();
      }
    }
    touchStartXRef.current = null;
  };

  if (!isOpen || mediaList.length === 0) return null;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentItem.data) return;
    const link = document.createElement("a");
    link.href = currentItem.data;
    const defaultExt = currentItem.type === "video" ? "mp4" : "jpg";
    link.download = currentItem.name || `download_${Date.now()}.${defaultExt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-5 select-none"
      >
        {/* Top Header Bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 text-white pb-3 border-b border-white/10 flex-shrink-0"
        >
          <div className="min-w-0 flex items-center gap-2.5">
            {hasMultiple && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-mono font-semibold text-blue-300 border border-white/10 flex-shrink-0">
                {currentIndex + 1} / {mediaList.length}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold truncate">
                {currentItem.name ||
                  (currentItem.type === "video" ? "Video Attachment" : "Photo Attachment")}
              </h3>
              {currentItem.size && (
                <p className="text-[10px] text-zinc-400 font-mono">{currentItem.size}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Media Content with Left/Right arrows */}
        <div
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden"
        >
          {/* Previous Arrow */}
          {hasMultiple && (
            <button
              type="button"
              onClick={goToPrev}
              className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-md transition-all active:scale-90 cursor-pointer"
              title="Previous (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Active Media */}
          <div className="relative max-w-full max-h-[72vh] flex items-center justify-center">
            {currentItem.type === "image" ? (
              <motion.img
                key={currentItem.data}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                src={currentItem.data}
                alt={currentItem.name || "Photo"}
                className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl border border-white/10 select-none"
              />
            ) : (
              <motion.video
                key={currentItem.data}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                src={currentItem.data}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[72vh] rounded-2xl shadow-2xl border border-white/10 bg-black select-none"
              />
            )}
          </div>

          {/* Next Arrow */}
          {hasMultiple && (
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-md transition-all active:scale-90 cursor-pointer"
              title="Next (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Bottom Thumbnail Scroll Strip */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl mx-auto flex flex-col items-center gap-2 pt-2 flex-shrink-0"
        >
          {hasMultiple && (
            <div className="w-full flex items-center justify-center gap-2 overflow-x-auto py-1.5 px-2 scrollbar-thin">
              {mediaList.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                    currentIndex === idx
                      ? "border-[#007AFF] ring-2 ring-[#007AFF]/40 scale-105"
                      : "border-white/15 opacity-60 hover:opacity-100"
                  }`}
                >
                  {item.type === "video" ? (
                    <video src={item.data} className="w-full h-full object-cover pointer-events-none" />
                  ) : (
                    <img src={item.data} alt={item.name || `Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="text-center text-[11px] text-zinc-500">
            {hasMultiple ? "Swipe or use arrow keys to browse photos • Esc to close" : "Tap anywhere or press Esc to close"}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
