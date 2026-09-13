"use client";

import React, { useEffect, useRef } from "react";
import { soundEngine } from "@/lib/audio";

interface FullScreenEffectsProps {
  effect: "fireworks" | "balloons" | "confetti" | "lasers" | "love" | "shooting_star" | "good_morning" | "good_night" | null;
  onComplete?: () => void;
}

export default function FullScreenEffects({ effect, onComplete }: FullScreenEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!effect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High-DPI Retina Support for crystal-clear rendering on iPhones & mobile
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const updateCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    let animationFrameId: number;
    let isRunning = true;
    const timeoutIds: any[] = [];

    // Play sound
    if (effect === "fireworks") {
      soundEngine.playFireworksCrackle();
    } else if (effect === "good_morning") {
      soundEngine.playMorningChime();
    } else if (effect === "good_night") {
      soundEngine.playNightChime();
    } else {
      soundEngine.playTapback();
    }

    /* -------------------------------------------------------------
       1. FIREWORKS / FIRECRACKER ENGINE (Authentic Multi-Zone Starburst matching Screenshot 2)
       ------------------------------------------------------------- */
    if (effect === "fireworks") {
      interface FireworkParticle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        alpha: number;
        color: string;
        size: number;
        decay: number;
        friction: number;
        gravity: number;
        trail: Array<{ x: number; y: number }>;
        isSparkle: boolean;
      }

      interface SparkleEmber {
        x: number;
        y: number;
        vx: number;
        vy: number;
        alpha: number;
        decay: number;
        color: string;
        size: number;
        jitterAmp: number;
      }

      const particles: FireworkParticle[] = [];
      const embers: SparkleEmber[] = [];
      let flashAlpha = 0;

      // Color palettes for starburst zones
      const pinkShades = ["#FF2D55", "#FF375F", "#FF6584", "#FFFFFF", "#FF85A2"];
      const greenShades = ["#30D158", "#34C759", "#A8F53B", "#FFFFFF", "#72F576"];
      const whiteGoldShades = ["#FFFFFF", "#FFF4A3", "#FFD700", "#FFE57F", "#F5F5F7"];

      const triggerBurst = (cx: number, cy: number, primary: boolean = false) => {
        if (!isRunning) return;
        soundEngine.playFireworksCrackle();
        flashAlpha = primary ? 0.32 : 0.16;

        const rayCount = primary ? 260 : 160;
        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
          // Determine color based on spatial angle to match Screenshot 2:
          // Bottom arc (angle between ~0.1pi and 0.9pi): hot pink/magenta
          // Right/upper arc (angle between -0.4pi and 0.2pi): neon lime-green
          // Center/top/everywhere: bright diamond white & gold
          let color: string;
          const normAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          if (normAngle > 0.35 * Math.PI && normAngle < 0.95 * Math.PI) {
            // Lower hemisphere: vivid pink/magenta sparks
            color = Math.random() > 0.25 ? pinkShades[Math.floor(Math.random() * pinkShades.length)] : whiteGoldShades[0];
          } else if (normAngle > 1.65 * Math.PI || normAngle < 0.25 * Math.PI) {
            // Right quadrant: vivid lime-green sparks
            color = Math.random() > 0.25 ? greenShades[Math.floor(Math.random() * greenShades.length)] : whiteGoldShades[0];
          } else {
            // Upper and left: brilliant white & champagne gold
            color = whiteGoldShades[Math.floor(Math.random() * whiteGoldShades.length)];
          }

          // Varied velocity produces dense inner core + long radiating streaks
          const speed = primary
            ? Math.pow(Math.random(), 0.45) * 11.5 + 2.5
            : Math.pow(Math.random(), 0.45) * 8.5 + 1.8;

          particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            color,
            size: Math.random() * 2.6 + 1.2,
            decay: Math.random() * 0.012 + 0.009,
            friction: 0.962,
            gravity: 0.075,
            trail: [{ x: cx, y: cy }],
            isSparkle: Math.random() > 0.4,
          });
        }

        // Crackling stardust embers drifting in the burst cloud
        const emberCount = primary ? 160 : 80;
        for (let e = 0; e < emberCount; e++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 5 + 0.5;
          embers.push({
            x: cx + (Math.random() - 0.5) * 20,
            y: cy + (Math.random() - 0.5) * 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.5,
            alpha: 1,
            decay: Math.random() * 0.008 + 0.006,
            color: Math.random() > 0.5 ? "#FFD700" : (Math.random() > 0.5 ? "#FFFFFF" : "#FF375F"),
            size: Math.random() * 1.8 + 0.8,
            jitterAmp: Math.random() * 1.8 + 0.8,
          });
        }
      };

      // Initial Grand Central Burst matching Screenshot 2 position
      triggerBurst(width * 0.48, height * 0.36, true);

      // Complementary secondary bursts creating dynamic multi-tier spectacle
      timeoutIds.push(setTimeout(() => triggerBurst(width * 0.72, height * 0.30, false), 380));
      timeoutIds.push(setTimeout(() => triggerBurst(width * 0.26, height * 0.42, false), 750));
      timeoutIds.push(setTimeout(() => triggerBurst(width * 0.52, height * 0.34, true), 1300));
      timeoutIds.push(setTimeout(() => triggerBurst(width * 0.38, height * 0.28, false), 2100));
      timeoutIds.push(setTimeout(() => triggerBurst(width * 0.68, height * 0.38, false), 2800));

      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);

        // 1. Detonation flash glow
        if (flashAlpha > 0.01) {
          ctx.save();
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
          flashAlpha *= 0.76;
        }

        // 2. Starburst Streak Rays with trailing tails
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 7) p.trail.shift();

          p.vx *= p.friction;
          p.vy *= p.friction;
          p.vy += p.gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);

          // Draw radiant streak beam
          if (p.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let t = 1; t < p.trail.length; t++) {
              ctx.lineTo(p.trail[t].x, p.trail[t].y);
            }
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size;
            ctx.lineCap = "round";
            ctx.stroke();
          }

          // Glowing spark tip
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.size * 0.8), 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();

          ctx.restore();
        }

        // 3. Crackling sparkle embers
        for (let e = embers.length - 1; e >= 0; e--) {
          const emb = embers[e];
          emb.vx *= 0.98;
          emb.vy += 0.04;
          emb.x += emb.vx + (Math.random() - 0.5) * emb.jitterAmp;
          emb.y += emb.vy;
          emb.alpha -= emb.decay;

          if (emb.alpha <= 0) {
            embers.splice(e, 1);
            continue;
          }

          ctx.save();
          // Twinkle effect
          const twinkleAlpha = emb.alpha * (0.6 + Math.random() * 0.4);
          ctx.globalAlpha = Math.max(0, twinkleAlpha);
          ctx.beginPath();
          ctx.arc(emb.x, emb.y, emb.size, 0, Math.PI * 2);
          ctx.fillStyle = emb.color;
          ctx.fill();
          ctx.restore();
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       2. BALLOONS ENGINE (Authentic Hero Balloon & Companions matching Screenshot 1)
       ------------------------------------------------------------- */
    else if (effect === "balloons") {
      // 1. Giant Translucent Blue Hero Balloon (dominates foreground left-center like Screenshot 1)
      const heroRx = Math.min(width * 0.44, 210);
      const heroRy = Math.min(width * 0.54, 270);
      const heroBalloon = {
        x: width * 0.38,
        y: height + heroRy + 40,
        rx: heroRx,
        ry: heroRy,
        vy: -2.7,
        swayPhase: 0,
        swaySpeed: 0.016,
      };

      // 2. Realistic Companion Balloons in background with varied depths & colors
      const companionDefs = [
        { color: "#38A8F8", highlight: "rgba(255,255,255,0.75)", rx: heroRx * 0.38, ry: heroRy * 0.38, xRatio: 0.44, yOffset: 120, vy: -2.3, alpha: 0.8 }, // translucent behind hero
        { color: "#FF3B30", highlight: "#FF9E99", rx: 42, ry: 54, xRatio: 0.82, yOffset: 60, vy: -2.9, alpha: 0.95 }, // vivid red
        { color: "#34C759", highlight: "#96EDB0", rx: 36, ry: 46, xRatio: 0.88, yOffset: 160, vy: -2.8, alpha: 0.95 }, // lime green
        { color: "#007AFF", highlight: "#82BEFF", rx: 34, ry: 44, xRatio: 0.78, yOffset: 240, vy: -3.0, alpha: 0.92 }, // cyan blue
        { color: "#FFCC00", highlight: "#FFF099", rx: 40, ry: 50, xRatio: 0.18, yOffset: 200, vy: -2.7, alpha: 0.95 }, // golden yellow
        { color: "#AF52DE", highlight: "#E0ACFC", rx: 38, ry: 48, xRatio: 0.26, yOffset: 320, vy: -2.8, alpha: 0.95 }, // purple
        { color: "#FF9500", highlight: "#FFD285", rx: 35, ry: 45, xRatio: 0.65, yOffset: 380, vy: -3.1, alpha: 0.95 }, // orange
        { color: "#FF2D55", highlight: "#FFA3B5", rx: 38, ry: 48, xRatio: 0.85, yOffset: 460, vy: -2.9, alpha: 0.95 }, // ruby pink
        { color: "#5856D6", highlight: "#B0AEF5", rx: 36, ry: 46, xRatio: 0.12, yOffset: 420, vy: -2.8, alpha: 0.95 }, // indigo
      ];

      const companionBalloons = companionDefs.map((def) => ({
        x: width * def.xRatio,
        y: height + def.yOffset + 50,
        rx: def.rx,
        ry: def.ry,
        vy: def.vy,
        color: def.color,
        highlight: def.highlight,
        alpha: def.alpha,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.015,
      }));

      // Render standard companion balloon
      const drawCompanionBalloon = (
        x: number,
        y: number,
        rx: number,
        ry: number,
        color: string,
        highlight: string,
        alpha: number,
        sway: number
      ) => {
        ctx.save();
        ctx.globalAlpha = alpha;

        // String
        ctx.beginPath();
        ctx.moveTo(x, y + ry + 4);
        ctx.quadraticCurveTo(x + sway * 10, y + ry + 40, x - sway * 5, y + ry + 80);
        ctx.strokeStyle = "rgba(230, 230, 245, 0.65)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Body
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(x - rx * 0.32, y - ry * 0.35, rx * 0.08, x, y, ry * 1.1);
        grad.addColorStop(0, highlight);
        grad.addColorStop(0.65, color);
        grad.addColorStop(1, "rgba(0, 0, 0, 0.45)");
        ctx.fillStyle = grad;
        ctx.fill();

        // Knot
        ctx.beginPath();
        ctx.ellipse(x, y + ry + 3, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Specular highlight
        ctx.beginPath();
        ctx.ellipse(x - rx * 0.35, y - ry * 0.38, rx * 0.22, ry * 0.14, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.fill();

        ctx.restore();
      };

      // Render Hero Balloon matching Screenshot 1 (translucent cyan-blue, elegant curved crescent shine, knot & string)
      const drawHeroBalloon = (x: number, y: number, rx: number, ry: number, sway: number) => {
        ctx.save();

        // 1. Long Braided White String dropping straight down
        ctx.beginPath();
        ctx.moveTo(x, y + ry + 6);
        ctx.quadraticCurveTo(x + sway * 12, y + ry + 90, x + sway * 4, y + ry + 300);
        ctx.lineTo(x + sway * 4, height + 80);
        ctx.strokeStyle = "rgba(245, 245, 255, 0.78)";
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // 2. Translucent 3D Balloon Body
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        const heroGrad = ctx.createRadialGradient(x - rx * 0.28, y - ry * 0.32, rx * 0.1, x, y, ry * 1.05);
        heroGrad.addColorStop(0, "rgba(125, 205, 255, 0.82)");
        heroGrad.addColorStop(0.48, "rgba(0, 138, 255, 0.85)");
        heroGrad.addColorStop(0.85, "rgba(0, 95, 220, 0.90)");
        heroGrad.addColorStop(1, "rgba(0, 60, 175, 0.94)");
        ctx.fillStyle = heroGrad;
        ctx.fill();

        // Subtle glowing perimeter rim
        ctx.strokeStyle = "rgba(180, 225, 255, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 3. Elegant Left-Side Curved Specular Crescent Highlight (Iconic iMessage Balloon feature from Screenshot 1)
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x - rx * 0.74, y - ry * 0.08, rx * 0.085, ry * 0.46, -0.16, 0, Math.PI * 2);
        const rimGrad = ctx.createLinearGradient(x - rx * 0.8, y - ry * 0.5, x - rx * 0.6, y + ry * 0.4);
        rimGrad.addColorStop(0, "rgba(255, 255, 255, 0.15)");
        rimGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.85)");
        rimGrad.addColorStop(0.75, "rgba(255, 255, 255, 0.60)");
        rimGrad.addColorStop(1, "rgba(255, 255, 255, 0.10)");
        ctx.fillStyle = rimGrad;
        ctx.fill();
        ctx.restore();

        // Secondary soft top-center highlight
        ctx.beginPath();
        ctx.ellipse(x - rx * 0.2, y - ry * 0.45, rx * 0.25, ry * 0.15, -0.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.40)";
        ctx.fill();

        // 4. Realistic Tied Balloon Neck Knot at base
        ctx.beginPath();
        ctx.ellipse(x, y + ry + 4, 8, 4.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#005CBD";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x - 5, y + ry + 2);
        ctx.lineTo(x + 5, y + ry + 2);
        ctx.lineTo(x + 7, y + ry + 9);
        ctx.lineTo(x - 7, y + ry + 9);
        ctx.closePath();
        ctx.fillStyle = "#004B9E";
        ctx.fill();

        ctx.restore();
      };

      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);

        // Render companion balloons in background
        for (const cb of companionBalloons) {
          cb.y += cb.vy;
          cb.swayPhase += cb.swaySpeed;
          const sway = Math.sin(cb.swayPhase);
          cb.x += sway * 0.5;
          drawCompanionBalloon(cb.x, cb.y, cb.rx, cb.ry, cb.color, cb.highlight, cb.alpha, sway);
        }

        // Render Hero Balloon in foreground
        heroBalloon.y += heroBalloon.vy;
        heroBalloon.swayPhase += heroBalloon.swaySpeed;
        const heroSway = Math.sin(heroBalloon.swayPhase);
        drawHeroBalloon(heroBalloon.x + heroSway * 10, heroBalloon.y, heroBalloon.rx, heroBalloon.ry, heroSway);

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       3. CONFETTI ENGINE (Vibrant 3D Tumbling Ribbons & Flakes matching Screenshot 4)
       ------------------------------------------------------------- */
    else if (effect === "confetti") {
      // Palette from Apple iMessage Send with Confetti (Screenshot 4)
      const confettiColors = [
        { front: "#007AFF", back: "#0055B3" }, // Sky Azure
        { front: "#3552FF", back: "#2034BF" }, // Royal Blue
        { front: "#FF2D55", back: "#B81434" }, // Hot Magenta / Ruby
        { front: "#FF375F", back: "#BD173B" }, // Crimson Pink
        { front: "#FFD60A", back: "#C4A200" }, // Sunflower Yellow
        { front: "#FF9500", back: "#B86500" }, // Tangy Orange
        { front: "#30D158", back: "#1D8F39" }, // Lime Green
        { front: "#00E5FF", back: "#009BB0" }, // Electric Cyan
        { front: "#BF5AF2", back: "#7D2DA8" }, // Violet Purple
        { front: "#FFFFFF", back: "#D0D0D5" }, // Crisp White
      ];

      // Screen packed with dense fluttering ribbons matching Screenshot 4
      const pieceCount = Math.max(160, Math.min(240, Math.floor(width / 2.2)));
      const pieces = Array.from({ length: pieceCount }).map(() => {
        const colorPair = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        const isRibbon = Math.random() > 0.22; // 78% rectangular strips, 22% square flakes
        const w = isRibbon ? Math.random() * 8 + 12 : Math.random() * 4 + 7;
        const h = isRibbon ? Math.random() * 3 + 5 : w;

        return {
          // Spread across and above viewport so full screen is immediately alive
          x: Math.random() * width,
          y: Math.random() * height * 1.1 - height * 0.4,
          vx: (Math.random() - 0.5) * 2.4,
          vy: Math.random() * 2.8 + 2.4,
          w,
          h,
          frontColor: colorPair.front,
          backColor: colorPair.back,
          rotZ: Math.random() * 360,
          rotSpeedZ: (Math.random() - 0.5) * 6,
          rotX: Math.random() * Math.PI * 2,
          rotSpeedX: Math.random() * 0.08 + 0.04,
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: Math.random() * 0.04 + 0.02,
          swayAmp: Math.random() * 2.2 + 1.2,
        };
      });

      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);

        for (const p of pieces) {
          p.swayPhase += p.swaySpeed;
          p.x += p.vx + Math.sin(p.swayPhase) * p.swayAmp;
          p.y += p.vy;
          p.rotZ += p.rotSpeedZ;
          p.rotX += p.rotSpeedX;

          // Recycle pieces that fall below the screen to maintain continuous cascade
          if (p.y > height + 20) {
            p.y = -Math.random() * 50 - 10;
            p.x = Math.random() * width;
          }

          // 3D Tumbling Paper projection
          const cosX = Math.cos(p.rotX);
          const flipHeight = p.h * Math.abs(cosX);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotZ * Math.PI) / 180);

          // Render front or shaded back face based on flip angle
          ctx.fillStyle = cosX >= 0 ? p.frontColor : p.backColor;
          ctx.fillRect(-p.w / 2, -flipHeight / 2, p.w, flipHeight);

          ctx.restore();
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       4. LOVE / HEARTS ENGINE (Apple iMessage Style: 3D Glossy, razor sharp)
       ------------------------------------------------------------- */
    else if (effect === "love") {
      let time = 0;

      // Companion floating hearts
      const heartCount = Math.max(10, Math.min(22, Math.floor(width / 38)));
      const hearts = Array.from({ length: heartCount }).map(() => ({
        x: Math.random() * width,
        y: height + Math.random() * (height * 0.8),
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 2.5 + 2.0),
        scale: Math.random() * 0.5 + 0.45,
        alpha: Math.random() * 0.4 + 0.6,
        swayPhase: Math.random() * Math.PI * 2,
      }));

      // Hero Heart (centered, inflates and pulses like iOS iMessage Send with Love)
      const hero = {
        x: width / 2,
        y: height * 0.85,
        scale: 0.2,
        targetScale: Math.min(width, height) > 500 ? 1.5 : 1.15,
        vy: -2.2,
        alpha: 1,
      };

      const drawHeart = (cx: number, cy: number, scale: number, alpha: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        // 1. Precise 3D Heart Path
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.bezierCurveTo(-2, 10, -38, -20, -38, -48);
        ctx.bezierCurveTo(-38, -74, -10, -82, 0, -62);
        ctx.bezierCurveTo(10, -82, 38, -74, 38, -48);
        ctx.bezierCurveTo(38, -20, 2, 10, 0, 15);
        ctx.closePath();

        // 2. Rich Deep Ruby Gradient
        const grad = ctx.createLinearGradient(-30, -80, 30, 20);
        grad.addColorStop(0, "#FF375F");
        grad.addColorStop(0.55, "#E6002B");
        grad.addColorStop(1, "#8A0014");
        ctx.fillStyle = grad;
        ctx.fill();

        // 3. Crisp Inner Contour Line
        ctx.strokeStyle = "rgba(255, 120, 150, 0.5)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 4. Specular Curved Gloss Highlight (Left lobe)
        ctx.beginPath();
        ctx.ellipse(-16, -58, 11, 5, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
        ctx.fill();

        // 5. Subtle secondary highlight (Right lobe)
        ctx.beginPath();
        ctx.ellipse(18, -55, 6, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.fill();

        ctx.restore();
      };

      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);
        time += 0.05;

        // Draw companion floating hearts
        for (const h of hearts) {
          h.y += h.vy;
          h.swayPhase += 0.03;
          h.x += h.vx + Math.sin(h.swayPhase) * 0.9;
          drawHeart(h.x, h.y, h.scale, h.alpha);
        }

        // Draw & animate Hero Heart with heartbeat pulsation
        if (hero.y > -150) {
          hero.y += hero.vy;
          if (hero.scale < hero.targetScale) {
            hero.scale += (hero.targetScale - hero.scale) * 0.06;
          }
          const pulse = hero.scale * (1 + Math.sin(time * 3) * 0.06);
          drawHeart(hero.x, hero.y, pulse, hero.alpha);
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       5. LASERS ENGINE (Sharp modern beams)
       ------------------------------------------------------------- */
    else if (effect === "lasers") {
      let time = 0;
      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);
        time += 0.04;

        const beams = 8;
        for (let i = 0; i < beams; i++) {
          const originX = (i / beams) * width + width / (beams * 2);
          const targetX = width / 2 + Math.sin(time + i) * (width * 0.55);
          const targetY = height;

          ctx.beginPath();
          ctx.moveTo(originX, 0);
          ctx.lineTo(targetX, targetY);

          const hue = (time * 55 + i * 42) % 360;
          ctx.strokeStyle = `hsl(${hue}, 100%, 65%)`;
          ctx.lineWidth = 3 + Math.sin(time * 2 + i) * 1.5;
          ctx.stroke();
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       6. SHOOTING STAR ENGINE (Crisp sparkling trail)
       ------------------------------------------------------------- */
    else if (effect === "shooting_star") {
      let star = {
        x: width * 0.05 + Math.random() * width * 0.2,
        y: height * 0.05 + Math.random() * height * 0.15,
        vx: 13 + Math.random() * 6,
        vy: 5 + Math.random() * 4,
        trail: [] as { x: number; y: number }[],
      };

      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);

        star.x += star.vx;
        star.y += star.vy;
        star.trail.push({ x: star.x, y: star.y });
        if (star.trail.length > 25) star.trail.shift();

        // Trail
        for (let i = 0; i < star.trail.length; i++) {
          const t = star.trail[i];
          const progress = i / star.trail.length;
          ctx.save();
          ctx.globalAlpha = progress * 0.85;
          ctx.beginPath();
          ctx.arc(t.x, t.y, progress * 4, 0, Math.PI * 2);
          ctx.fillStyle = "#FFD60A";
          ctx.fill();
          ctx.restore();
        }

        // Head
        ctx.beginPath();
        ctx.arc(star.x, star.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();

        if (star.x > width + 80 || star.y > height + 80) {
          star.x = width * 0.05;
          star.y = Math.random() * height * 0.25;
          star.trail = [];
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       7. GOOD MORNING / SUNRISE ENGINE (Radiant Sun, Golden Beams & Morning Dew)
       ------------------------------------------------------------- */
    else if (effect === "good_morning") {
      let time = 0;
      const startTime = performance.now();
      const totalDuration = 8000;

      let sunY = height * 0.95;
      const targetSunY = height * 0.44;
      const sunX = width * 0.5;
      const sunRadius = Math.max(38, Math.min(width, height) * 0.13);

      // Shimmering morning motes / golden sun dust
      const moteCount = Math.max(25, Math.min(50, Math.floor(width / 20)));
      const motes = Array.from({ length: moteCount }).map(() => ({
        x: Math.random() * width,
        y: height * 0.4 + Math.random() * height * 0.7,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(Math.random() * 1.6 + 0.8),
        size: Math.random() * 3 + 1.2,
        alpha: Math.random() * 0.7 + 0.3,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.4 ? "#FFE082" : (Math.random() > 0.5 ? "#FFD54F" : "#FFFFFF"),
      }));

      // Morning birds soaring across the horizon
      const birds = [
        { x: width * 0.15, y: height * 0.38, vx: 1.4, vy: -0.15, size: 7, phase: 0 },
        { x: width * 0.22, y: height * 0.42, vx: 1.3, vy: -0.12, size: 5.5, phase: 1.2 },
        { x: width * 0.29, y: height * 0.35, vx: 1.45, vy: -0.18, size: 6, phase: 2.4 },
      ];

      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);

        const elapsed = performance.now() - startTime;
        time += 0.03;

        // Smooth master opacity envelope: fade in over 800ms, fade out over last 1200ms
        let masterAlpha = 1;
        if (elapsed < 800) {
          masterAlpha = elapsed / 800;
        } else if (elapsed > totalDuration - 1200) {
          masterAlpha = Math.max(0, (totalDuration - elapsed) / 1200);
        }

        ctx.save();
        ctx.globalAlpha = masterAlpha;

        // Smoothly rise the sun towards target height
        sunY += (targetSunY - sunY) * 0.032;

        // 1. Warm Radiant Sunrise Ambient Sky Bloom
        const skyGlow = ctx.createRadialGradient(
          sunX,
          sunY,
          sunRadius * 0.2,
          sunX,
          sunY,
          Math.max(width, height) * 0.95
        );
        skyGlow.addColorStop(0, "rgba(255, 255, 255, 0.45)");
        skyGlow.addColorStop(0.18, "rgba(255, 224, 130, 0.35)");
        skyGlow.addColorStop(0.42, "rgba(255, 152, 0, 0.22)");
        skyGlow.addColorStop(0.75, "rgba(255, 87, 34, 0.12)");
        skyGlow.addColorStop(1, "rgba(255, 112, 67, 0)");
        ctx.fillStyle = skyGlow;
        ctx.fillRect(0, 0, width, height);

        // 2. Rotating Radiant Golden Coronal Sunbeams
        const rayCount = 14;
        const maxRayLen = Math.max(width, height) * 1.5;
        for (let i = 0; i < rayCount; i++) {
          const baseAngle = (i / rayCount) * Math.PI * 2 + time * 0.15;
          const raySpan = ((Math.PI * 2) / rayCount) * 0.42;
          const pulseAlpha = 0.15 + Math.sin(time * 2.2 + i * 0.8) * 0.06;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(sunX, sunY);
          ctx.arc(sunX, sunY, maxRayLen, baseAngle - raySpan / 2, baseAngle + raySpan / 2);
          ctx.closePath();

          const rayGrad = ctx.createRadialGradient(sunX, sunY, sunRadius, sunX, sunY, maxRayLen);
          rayGrad.addColorStop(0, `rgba(255, 235, 59, ${pulseAlpha * 1.5})`);
          rayGrad.addColorStop(0.35, `rgba(255, 193, 7, ${pulseAlpha})`);
          rayGrad.addColorStop(0.8, `rgba(255, 152, 0, ${pulseAlpha * 0.3})`);
          rayGrad.addColorStop(1, "rgba(255, 152, 0, 0)");

          ctx.fillStyle = rayGrad;
          ctx.fill();
          ctx.restore();
        }

        // 3. Hero Sun Core (Luminous multi-layered orb)
        // Outer corona pulse
        const coronaRadius = sunRadius * (1.35 + Math.sin(time * 3) * 0.06);
        const coronaGrad = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, coronaRadius);
        coronaGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        coronaGrad.addColorStop(0.5, "rgba(255, 235, 59, 0.6)");
        coronaGrad.addColorStop(0.85, "rgba(255, 152, 0, 0.25)");
        coronaGrad.addColorStop(1, "rgba(255, 152, 0, 0)");
        ctx.fillStyle = coronaGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, coronaRadius, 0, Math.PI * 2);
        ctx.fill();

        // Solid brilliant solar disk
        const sunGrad = ctx.createRadialGradient(sunX, sunY - sunRadius * 0.2, sunRadius * 0.1, sunX, sunY, sunRadius);
        sunGrad.addColorStop(0, "#FFFFFF");
        sunGrad.addColorStop(0.3, "#FFF9C4");
        sunGrad.addColorStop(0.7, "#FFD54F");
        sunGrad.addColorStop(1, "#FF9800");
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // 4. Cinematic Solar Lens Flares
        const flares = [
          { dist: 0.35, r: 16, color: "rgba(255, 255, 255, 0.28)" },
          { dist: 0.65, r: 28, color: "rgba(255, 215, 64, 0.18)" },
          { dist: 0.95, r: 45, color: "rgba(255, 171, 64, 0.12)" },
        ];
        const flareDx = width * 0.25;
        const flareDy = height * 0.28;
        flares.forEach((fl) => {
          ctx.beginPath();
          ctx.arc(sunX - flareDx * fl.dist, sunY - flareDy * fl.dist, fl.r, 0, Math.PI * 2);
          ctx.fillStyle = fl.color;
          ctx.fill();
        });

        // 5. Floating Morning Dew / Sunlight Motes
        for (const m of motes) {
          m.y += m.vy;
          m.phase += 0.04;
          m.x += m.vx + Math.sin(m.phase) * 0.7;

          if (m.y < -20) {
            m.y = height + 10;
            m.x = Math.random() * width;
          }

          const shimmer = m.alpha * (0.65 + Math.sin(time * 4 + m.phase) * 0.35);
          ctx.save();
          ctx.globalAlpha = Math.max(0, shimmer * masterAlpha);
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
          ctx.fillStyle = m.color;
          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.restore();
        }

        // 6. Graceful Morning Bird Silhouettes
        ctx.fillStyle = "rgba(45, 25, 10, 0.68)";
        for (const b of birds) {
          b.x += b.vx;
          b.y += b.vy;
          b.phase += 0.15;
          const flap = Math.sin(b.phase) * 3.5;

          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.beginPath();
          ctx.moveTo(-b.size, flap);
          ctx.quadraticCurveTo(-b.size * 0.5, -b.size * 0.8 + flap * 0.5, 0, 0);
          ctx.quadraticCurveTo(b.size * 0.5, -b.size * 0.8 + flap * 0.5, b.size, flap);
          ctx.quadraticCurveTo(b.size * 0.4, 1, 0, 0);
          ctx.quadraticCurveTo(-b.size * 0.4, 1, -b.size, flap);
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       8. GOOD NIGHT / CELESTIAL STARRY NIGHT (Crescent Moon, Constellations & Stardust)
       ------------------------------------------------------------- */
    else if (effect === "good_night") {
      let time = 0;
      const startTime = performance.now();
      const totalDuration = 8000;

      // Celestial Crescent Moon
      const moonX = width * 0.5;
      let moonY = height * 0.65;
      const targetMoonY = height * 0.32;
      const moonRadius = Math.max(42, Math.min(width, height) * 0.13);

      // Starfield (twinkling diamonds across the night sky)
      const starCount = Math.max(60, Math.min(130, Math.floor(width / 8)));
      const stars = Array.from({ length: starCount }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.88,
        size: Math.random() * 2.2 + 0.8,
        baseAlpha: Math.random() * 0.55 + 0.35,
        freq: Math.random() * 2.5 + 1.2,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.4 ? "#FFFFFF" : (Math.random() > 0.5 ? "#E0E7FF" : "#FEF08A"),
        isSparkle: Math.random() > 0.75,
      }));

      // Drifting Night Stardust / Fireflies
      const stardustCount = 32;
      const stardust = Array.from({ length: stardustCount }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.6 + 0.2),
        size: Math.random() * 2.5 + 1.0,
        alpha: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
      }));

      // Periodic Shooting Star
      let shootingStar: { x: number; y: number; vx: number; vy: number; len: number; active: boolean } | null = null;
      timeoutIds.push(
        setTimeout(() => {
          shootingStar = { x: width * 0.15, y: height * 0.12, vx: 9.5, vy: 4.8, len: 90, active: true };
        }, 1600)
      );
      timeoutIds.push(
        setTimeout(() => {
          shootingStar = { x: width * 0.45, y: height * 0.08, vx: 10.5, vy: 5.2, len: 100, active: true };
        }, 4400)
      );

      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);

        const elapsed = performance.now() - startTime;
        time += 0.03;

        // Smooth master opacity envelope
        let masterAlpha = 1;
        if (elapsed < 800) {
          masterAlpha = elapsed / 800;
        } else if (elapsed > totalDuration - 1200) {
          masterAlpha = Math.max(0, (totalDuration - elapsed) / 1200);
        }

        ctx.save();
        ctx.globalAlpha = masterAlpha;

        // Moon smooth glide
        moonY += (targetMoonY - moonY) * 0.03;

        // 1. Deep Celestial Midnight Indigo & Royal Violet Sky Tint
        const nightSky = ctx.createLinearGradient(0, 0, 0, height);
        nightSky.addColorStop(0, "rgba(10, 10, 28, 0.65)");
        nightSky.addColorStop(0.5, "rgba(22, 17, 48, 0.55)");
        nightSky.addColorStop(1, "rgba(15, 23, 42, 0.45)");
        ctx.fillStyle = nightSky;
        ctx.fillRect(0, 0, width, height);

        // 2. Twinkling Diamond Starfield
        for (const s of stars) {
          const twinkle = s.baseAlpha * (0.6 + 0.4 * Math.sin(time * s.freq + s.phase));
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, twinkle * masterAlpha));
          ctx.fillStyle = s.color;

          if (s.isSparkle) {
            // 4-Point Diamond Sparkle Star
            const arm = s.size * 2.2;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y - arm);
            ctx.quadraticCurveTo(s.x, s.y, s.x + arm, s.y);
            ctx.quadraticCurveTo(s.x, s.y, s.x, s.y + arm);
            ctx.quadraticCurveTo(s.x, s.y, s.x - arm, s.y);
            ctx.quadraticCurveTo(s.x, s.y, s.x, s.y - arm);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // 3. Shooting Star Streak
        if (shootingStar && shootingStar.active) {
          shootingStar.x += shootingStar.vx;
          shootingStar.y += shootingStar.vy;

          ctx.save();
          const starGrad = ctx.createLinearGradient(
            shootingStar.x - (shootingStar.vx / 10) * shootingStar.len,
            shootingStar.y - (shootingStar.vy / 10) * shootingStar.len,
            shootingStar.x,
            shootingStar.y
          );
          starGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
          starGrad.addColorStop(0.7, "rgba(254, 240, 138, 0.6)");
          starGrad.addColorStop(1, "rgba(255, 255, 255, 0.95)");

          ctx.strokeStyle = starGrad;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(
            shootingStar.x - (shootingStar.vx / 10) * shootingStar.len,
            shootingStar.y - (shootingStar.vy / 10) * shootingStar.len
          );
          ctx.lineTo(shootingStar.x, shootingStar.y);
          ctx.stroke();

          // Spark head
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(shootingStar.x, shootingStar.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (shootingStar.x > width + 100 || shootingStar.y > height + 100) {
            shootingStar.active = false;
          }
        }

        // 4. Luminous Crescent Moon Halo
        const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.4, moonX, moonY, moonRadius * 2.4);
        moonGlow.addColorStop(0, "rgba(254, 240, 138, 0.42)");
        moonGlow.addColorStop(0.35, "rgba(199, 210, 254, 0.22)");
        moonGlow.addColorStop(0.75, "rgba(99, 102, 241, 0.08)");
        moonGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius * 2.4, 0, Math.PI * 2);
        ctx.fill();

        // 5. Authentic 3D Crescent Moon Path
        ctx.save();
        ctx.translate(moonX, moonY);
        ctx.rotate(-0.25 + Math.sin(time * 0.8) * 0.03);

        ctx.beginPath();
        // Outer arc
        ctx.arc(0, 0, moonRadius, -Math.PI * 0.45, Math.PI * 0.55, false);
        // Inner cutout arc
        ctx.arc(-moonRadius * 0.45, -moonRadius * 0.08, moonRadius * 0.85, Math.PI * 0.52, -Math.PI * 0.42, true);
        ctx.closePath();

        // Shimmering Golden-Pearl Moon Gradient
        const moonGrad = ctx.createLinearGradient(-moonRadius * 0.5, -moonRadius, moonRadius, moonRadius);
        moonGrad.addColorStop(0, "#FFFFFF");
        moonGrad.addColorStop(0.4, "#FEF9C3");
        moonGrad.addColorStop(0.75, "#FDE047");
        moonGrad.addColorStop(1, "#EAB308");
        ctx.fillStyle = moonGrad;
        ctx.shadowColor = "#FEF08A";
        ctx.shadowBlur = 18;
        ctx.fill();

        // Lunar Gloss Specular Edge
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();

        // 6. Floating Night Stardust / Fireflies
        for (const dust of stardust) {
          dust.y += dust.vy;
          dust.phase += 0.03;
          dust.x += dust.vx + Math.sin(dust.phase) * 0.5;

          if (dust.y < -10) {
            dust.y = height + 10;
            dust.x = Math.random() * width;
          }

          const glow = dust.alpha * (0.6 + Math.sin(time * 3 + dust.phase) * 0.4);
          ctx.save();
          ctx.globalAlpha = Math.max(0, glow * masterAlpha);
          ctx.beginPath();
          ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
          ctx.fillStyle = "#A5B4FC";
          ctx.shadowColor = "#818CF8";
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    // Auto dismiss after 8s for fireworks, good_morning, and good_night (7-8s as requested) and 7s for others
    const handleDismiss = () => {
      isRunning = false;
      clearTimeout(timer);
      timeoutIds.forEach((id) => clearTimeout(id));
      cancelAnimationFrame(animationFrameId);
      if (ctx) ctx.clearRect(0, 0, width, height);
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    };

    const effectDuration =
      effect === "fireworks" || effect === "good_morning" || effect === "good_night" ? 8000 : 7000;
    const timer = setTimeout(handleDismiss, effectDuration);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      isRunning = false;
      clearTimeout(timer);
      timeoutIds.forEach((id) => clearTimeout(id));
      cancelAnimationFrame(animationFrameId);
      if (ctx) ctx.clearRect(0, 0, width, height);
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [effect]);

  if (!effect) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}
