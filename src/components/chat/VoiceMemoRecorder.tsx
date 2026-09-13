"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send } from "lucide-react";
import { motion } from "framer-motion";

interface VoiceMemoRecorderProps {
  onSendVoiceMemo: (base64Audio: string, durationSec: number) => void;
  onCancel: () => void;
}

export default function VoiceMemoRecorder({
  onSendVoiceMemo,
  onCancel,
}: VoiceMemoRecorderProps) {
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopStreams();
    };
  }, []);

  const stopStreams = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        alert("Audio recording requires a secure connection (HTTPS or localhost). Please open via HTTPS (e.g. https://imessage-web.vercel.app).");
        onCancel();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      // Start duration timer
      let secs = 0;
      timerRef.current = setInterval(() => {
        secs += 1;
        setDuration(secs);
      }, 1000);

      // Audio waveform visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      drawWaveform();
    } catch (err) {
      console.error("Microphone access failed:", err);
      onCancel();
    }
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = 3;
      const gap = 2;
      const totalBars = Math.floor(canvas.width / (barWidth + gap));

      for (let i = 0; i < totalBars; i++) {
        const val = dataArray[i % bufferLength] || 10;
        const height = Math.max(4, (val / 255) * canvas.height * 0.9);
        const x = i * (barWidth + gap);
        const y = (canvas.height - height) / 2;

        ctx.fillStyle = "#FF3B30"; // iOS Voice Memo Red
        ctx.fillRect(x, y, barWidth, height);
      }
    };

    render();
  };

  const handleFinishAndSend = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onSendVoiceMemo(base64, duration);
      };
      reader.readAsDataURL(audioBlob);
      stopStreams();
    };

    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-3 w-full bg-neutral-900/95 border border-red-500/30 rounded-2xl p-2.5 px-4 shadow-xl backdrop-blur-2xl"
    >
      <button
        type="button"
        onClick={() => {
          stopStreams();
          onCancel();
        }}
        className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-red-400 hover:bg-white/10 transition-all"
        title="Discard Recording"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-mono font-medium text-white/90 min-w-[35px]">
          {formatTime(duration)}
        </span>
      </div>

      <div className="flex-1 h-7 flex items-center">
        <canvas ref={canvasRef} width={200} height={28} className="w-full h-full rounded" />
      </div>

      <button
        type="button"
        onClick={handleFinishAndSend}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all"
        title="Send Voice Memo"
      >
        <Send className="w-4 h-4 ml-0.5" />
      </button>
    </motion.div>
  );
}
