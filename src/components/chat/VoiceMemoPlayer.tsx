"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface VoiceMemoPlayerProps {
  audioSrc: string;
  durationSec?: number;
  isMe?: boolean;
}

export default function VoiceMemoPlayer({
  audioSrc,
  durationSec = 0,
  isMe = false,
}: VoiceMemoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSec);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = speed;
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleSpeed = () => {
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * totalDuration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Pre-generate static pseudo waveform bars
  const bars = [
    30, 45, 75, 90, 60, 40, 85, 100, 70, 50, 65, 80, 45, 95, 85, 60, 40, 75, 90,
    55, 35, 65, 80, 50, 30,
  ];

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[200px] max-w-[260px]">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-all ${
          isMe
            ? "bg-white text-blue-600 shadow hover:bg-white/90"
            : "bg-blue-600 text-white shadow hover:bg-blue-500"
        }`}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
      </button>

      {/* Waveform Scrubber */}
      <div className="flex-1 flex flex-col gap-1 cursor-pointer" onClick={handleSeek}>
        <div className="flex items-center gap-[2px] h-6 w-full">
          {bars.map((heightPercent, idx) => {
            const barProgress = (idx / bars.length) * 100;
            const isFilled = barProgress <= progressPercent;
            return (
              <div
                key={idx}
                style={{ height: `${Math.max(15, heightPercent)}%` }}
                className={`flex-1 rounded-full transition-colors duration-100 ${
                  isFilled
                    ? isMe
                      ? "bg-white"
                      : "bg-blue-500"
                    : isMe
                    ? "bg-white/30"
                    : "bg-neutral-600/50"
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono opacity-70">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Speed Multiplier Badge */}
      <button
        type="button"
        onClick={toggleSpeed}
        className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-all ${
          isMe
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
        }`}
      >
        {speed}x
      </button>
    </div>
  );
}
