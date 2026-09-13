"use client";

import React, { useState, useRef, useEffect } from "react";

interface InvisibleInkProps {
  children: React.ReactNode;
}

export default function InvisibleInk({ children }: InvisibleInkProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isRevealed) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = container.offsetWidth || 200;
    canvas.height = container.offsetHeight || 40;

    let particles = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.8 + 0.2,
    }));

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.fillStyle = `rgba(255, 215, 0, ${p.alpha})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = "#FFD700";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isRevealed]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block cursor-pointer select-none group"
      onMouseEnter={() => setIsRevealed(true)}
      onTouchStart={() => setIsRevealed(true)}
      onClick={() => setIsRevealed(!isRevealed)}
    >
      <div
        className={`transition-all duration-700 ${
          isRevealed
            ? "filter-none opacity-100"
            : "blur-md opacity-30 select-none pointer-events-none"
        }`}
      >
        {children}
      </div>

      {!isRevealed && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full rounded-xl pointer-events-none"
        />
      )}
    </div>
  );
}
