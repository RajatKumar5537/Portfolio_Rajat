"use client";

import React, { useState, useRef } from "react";
import { Check, Sparkles, Upload, RefreshCw } from "lucide-react";
import { PRESET_3D_AVATARS } from "@/lib/avatars";

interface AvatarPickerProps {
  selectedUrl: string;
  onSelect: (url: string) => void;
  userName?: string;
}

export default function AvatarPicker({
  selectedUrl,
  onSelect,
}: AvatarPickerProps) {
  const [activeTab, setActiveTab] = useState<"3d" | "upload">("3d");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isCustomUploaded =
    selectedUrl.startsWith("data:image/") ||
    (!selectedUrl.includes("raw.githubusercontent.com") &&
      !selectedUrl.includes("dicebear.com"));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      onSelect(base64String);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full bg-neutral-900/80 border border-white/10 rounded-2xl p-3 sm:p-4 space-y-3 shadow-inner">
      {/* Segmented Tab Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-xl border border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("3d")}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all select-none cursor-pointer ${
            activeTab === "3d"
              ? "bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/30"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>3D Preset Memojis</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all select-none cursor-pointer ${
            activeTab === "upload"
              ? "bg-[#007AFF] text-white shadow-md shadow-[#007AFF]/30"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-blue-300" />
          <span>Upload Custom Photo</span>
        </button>
      </div>

      {/* Tab 1: 3D Avatars (Spacious Grid) */}
      {activeTab === "3d" && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3 pt-0.5">
          {PRESET_3D_AVATARS.map((avatar) => {
            const isSelected = selectedUrl === avatar.url;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => onSelect(avatar.url)}
                className={`relative rounded-2xl p-2 sm:p-2.5 transition-all flex flex-col items-center justify-center cursor-pointer group ${
                  isSelected
                    ? "bg-[#007AFF]/25 border-2 border-[#007AFF] shadow-lg shadow-[#007AFF]/25 ring-2 ring-[#007AFF]/20 scale-[1.02]"
                    : "bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 hover:scale-[1.02]"
                }`}
                title={avatar.name}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex items-center justify-center group-hover:rotate-6 transition-transform">
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    className="w-full h-full object-contain drop-shadow-md"
                    loading="lazy"
                  />
                </div>
                <span className="text-[10px] sm:text-xs text-neutral-300 group-hover:text-white truncate w-full text-center mt-1 font-medium">
                  {avatar.name}
                </span>

                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#007AFF] text-white flex items-center justify-center shadow-md ring-1 ring-neutral-900">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab 2: Custom Photo Upload */}
      {activeTab === "upload" && (
        <div className="pt-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {isCustomUploaded ? (
            <div className="flex items-center justify-between p-4 bg-black/50 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={selectedUrl}
                  alt="Custom Uploaded Photo"
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500 shadow-md flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-emerald-400">Custom Photo Active</p>
                  <p className="text-xs text-neutral-400 truncate">Stored securely with your profile</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex-shrink-0 ml-3"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-4 py-7 px-5 border border-dashed border-white/20 hover:border-[#007AFF] rounded-2xl cursor-pointer bg-black/25 hover:bg-white/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 border border-blue-500/30">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">
                  {isUploading ? "Reading photo..." : "Upload Your Portrait Photo"}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Click to choose PNG, JPG or WebP image from your device
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
