import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { 
  Check, 
  Sparkles, 
  Cpu, 
  Zap, 
  Printer, 
  Download, 
  Layers, 
  Terminal, 
  Activity, 
  Palette, 
  Loader2,
  Box,
  CheckCircle2
} from 'lucide-react';

export interface ExportProcessingModalProps {
  isOpen: boolean;
  progress: number;       // 0–100 numeric
  statusText: string;     // current step text
  totalPanels: number;
  orderName?: string;
}

// Normalized pipeline milestones
const PIPELINE_STEPS = [
  { id: 'init',      at: 0,   label: 'Init',          fullLabel: 'Initialising Engine',   icon: Zap },
  { id: 'assets',    at: 10,  label: 'Assets',        fullLabel: 'Loading Hi-Res Assets', icon: Layers },
  { id: 'color',     at: 20,  label: 'Colour Profile', fullLabel: 'Calibrating CMYK Profile', icon: Palette },
  { id: 'front',     at: 35,  label: 'Front Panels',  fullLabel: 'Rasterising Front Panels', icon: Printer },
  { id: 'back',      at: 55,  label: 'Back Panels',   fullLabel: 'Rasterising Back Panels',  icon: Printer },
  { id: 'composite', at: 70,  label: 'Compositing',   fullLabel: 'Compositing & DPI Scaling', icon: Cpu },
  { id: 'bundle',    at: 85,  label: 'ZIP Archive',   fullLabel: 'Compiling Output Archive',  icon: Box },
  { id: 'complete',  at: 100, label: 'Ready',         fullLabel: 'Ready for Download',       icon: Download },
];

function getActiveStep(pct: number) {
  let active = PIPELINE_STEPS[0];
  for (const s of PIPELINE_STEPS) {
    if (pct >= s.at) active = s;
  }
  return active;
}

/* ─── High-Efficiency Vibrant Particle Aurora Canvas ──────────────── */
function VibrantParticleCanvas({ running, isDone }: { running: boolean; isDone: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const doneBursted = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      color: string;
      life: number;
      maxLife: number;
      glow: number;
    };

    // Vibrant energetic palette matching FiveNest theme
    const activePalette = [
      '#FF5500', // Vibrant Neon Orange
      '#FF7A00', // Bright Orange
      '#FFAA00', // Radiant Amber Gold
      '#FFD000', // Cyber Yellow
      '#FF3B30', // Electric Coral
      '#FFFFFF', // Starlight White
      '#FB923C', // Soft Orange
    ];

    const donePalette = [
      '#10B981', // Emerald Neon
      '#34D399', // Mint
      '#6EE7B7', // Soft Emerald
      '#FFB800', // Gold
      '#FFFFFF', // White
    ];

    const particles: Particle[] = [];

    const spawn = (count: number = 1, burst: boolean = false) => {
      if (!canvas) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const palette = isDone ? donePalette : activePalette;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = burst 
          ? (2.0 + Math.random() * 5.0) 
          : (0.6 + Math.random() * 2.0);
        const life = burst 
          ? (60 + Math.random() * 50) 
          : (40 + Math.random() * 60);

        particles.push({
          x: w / 2 + (Math.random() - 0.5) * (burst ? 40 : 100),
          y: h * 0.42 + (Math.random() - 0.5) * (burst ? 40 : 70),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (burst ? 0.2 : 0.6), // upward buoyant drift
          r: 1.2 + Math.random() * (burst ? 3.5 : 2.5),
          alpha: 1,
          color: palette[Math.floor(Math.random() * palette.length)],
          life,
          maxLife: life,
          glow: Math.random() > 0.4 ? 8 : 0,
        });
      }
    };

    let frame = 0;
    const animate = () => {
      if (!canvas) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      if (isDone && !doneBursted.current) {
        doneBursted.current = true;
        spawn(60, true);
      }

      if (running && !isDone && frame % 2 === 0) {
        spawn(2, false);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.015; // gentle upward anti-gravity float
        p.vx *= 0.985;
        p.life--;
        p.alpha = (p.life / p.maxLife);

        if (p.life <= 0 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha * 0.9));
        if (p.glow > 0) {
          ctx.shadowBlur = p.glow;
          ctx.shadowColor = p.color;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      frame++;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, isDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        borderRadius: '24px',
        zIndex: 1,
      }}
    />
  );
}

/* ─── Precision Cyber Radial HUD Gauge ────────────────────────────── */
function CyberDialGauge({ pct, isDone }: { pct: number; isDone: boolean }) {
  const size = 180;
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Outer ambient energy ring pulsing */}
      <div 
        className={isDone ? 'fnest-pulse-glow-done' : 'fnest-pulse-glow-active'}
        style={{
          position: 'absolute',
          inset: '-16px',
          borderRadius: '50%',
          filter: 'blur(16px)',
          opacity: isDone ? 0.35 : 0.45,
          background: isDone 
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255, 85, 0, 0.5) 0%, rgba(255, 170, 0, 0.2) 50%, transparent 70%)',
          pointerEvents: 'none',
          transition: 'all 0.6s ease'
        }}
      />

      {/* Rotating outer radar track */}
      <div 
        className={isDone ? 'fnest-radar-slow' : 'fnest-radar-fast'}
        style={{
          position: 'absolute',
          inset: '-6px',
          borderRadius: '50%',
          border: '1px dashed rgba(255, 255, 255, 0.12)',
          borderTopColor: isDone ? '#10B981' : '#FF7A00',
          borderRightColor: 'transparent',
          pointerEvents: 'none',
          transition: 'border-color 0.5s ease'
        }}
      />

      {/* Decorative tick marks (8 radial pips) */}
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <linearGradient id="fnest-dial-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF3B00" />
            <stop offset="35%" stopColor="#FF6B00" />
            <stop offset="70%" stopColor="#FFA114" />
            <stop offset="100%" stopColor="#FFD000" />
          </linearGradient>
          <linearGradient id="fnest-dial-done" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <filter id="fnest-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.07)"
          strokeWidth={strokeWidth}
        />

        {/* Secondary inner ring line */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 12}
          fill="none"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />

        {/* Animated Progress Gauge */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDone ? "url(#fnest-dial-done)" : "url(#fnest-dial-grad)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter="url(#fnest-glow)"
          style={{
            transition: 'stroke-dashoffset 0.28s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
          }}
        />
      </svg>

      {/* Center HUD Info */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}>
        {isDone ? (
          <div className="fnest-bounce-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.6), inset 0 1px 0 rgba(255,255,255,0.4)',
              marginBottom: '6px',
            }}>
              <Check size={32} color="#FFFFFF" strokeWidth={3} />
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '0.12em',
              color: '#34D399',
              textTransform: 'uppercase',
              textShadow: '0 0 10px rgba(52, 211, 153, 0.5)'
            }}>
              Completed
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span style={{
                fontSize: '44px',
                fontWeight: '900',
                letterSpacing: '-0.04em',
                fontFamily: '"JetBrains Mono", "Inter", monospace',
                color: '#FFFFFF',
                textShadow: '0 0 20px rgba(255, 85, 0, 0.4), 0 2px 4px rgba(0,0,0,0.8)',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {pct}
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: '800',
                color: '#FF7A00',
                textShadow: '0 0 10px rgba(255, 122, 0, 0.6)'
              }}>
                %
              </span>
            </div>

            {/* Dynamic mini indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginTop: '5px',
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div className="fnest-pulse-dot" style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#FF5500',
                boxShadow: '0 0 8px #FF5500'
              }} />
              <span style={{
                fontSize: '9px',
                fontWeight: '700',
                letterSpacing: '0.08em',
                color: '#E2E8F0',
                textTransform: 'uppercase'
              }}>
                300 DPI
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Kinetic Cyber Processing Core (Top-Right Badge) ────────────── */
function KineticProcessingBadge({ isDone }: { isDone: boolean }) {
  return (
    <div style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer counter-rotating ring */}
      <div 
        className={isDone ? 'fnest-spin-slow' : 'fnest-spin-reverse'}
        style={{
          position: 'absolute',
          inset: '0px',
          borderRadius: '50%',
          border: '1.5px dashed',
          borderColor: isDone ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 122, 0, 0.4)',
          transition: 'border-color 0.5s ease',
        }}
      />
      {/* Inner forward-spinning segmented ring */}
      <div 
        className={isDone ? 'fnest-spin-slow' : 'fnest-spin-forward'}
        style={{
          position: 'absolute',
          inset: '6px',
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: isDone ? '#10B981' : '#FF5500',
          borderRightColor: isDone ? '#34D399' : '#FFAA00',
          filter: isDone ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.5))' : 'drop-shadow(0 0 6px rgba(255, 85, 0, 0.5))',
          transition: 'all 0.5s ease',
        }}
      />
      {/* Center glowing core icon */}
      <div style={{
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        background: isDone 
          ? 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(10, 15, 13, 0.9) 100%)'
          : 'radial-gradient(circle, rgba(255, 85, 0, 0.3) 0%, rgba(18, 12, 10, 0.9) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 122, 0, 0.3)'}`,
        boxShadow: isDone ? '0 0 14px rgba(16, 185, 129, 0.3)' : '0 0 14px rgba(255, 85, 0, 0.3)',
      }}>
        {isDone ? (
          <Sparkles size={15} color="#34D399" />
        ) : (
          <Printer size={15} color="#FF7A00" />
        )}
      </div>
    </div>
  );
}

/* ─── Styles Injection ────────────────────────────────────────────── */
const STYLE_ID = 'fnest-vibrant-export-modal-v3';
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
    @keyframes fnest-modal-enter {
      0% { opacity: 0; transform: scale(0.93) translateY(14px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes fnest-spin-forward {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes fnest-spin-reverse {
      from { transform: rotate(0deg); }
      to { transform: rotate(-360deg); }
    }
    @keyframes fnest-spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes fnest-pulse-glow {
      0%, 100% { transform: scale(0.95); opacity: 0.35; }
      50% { transform: scale(1.08); opacity: 0.65; }
    }
    @keyframes fnest-pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(0.7); }
    }
    @keyframes fnest-bounce-in {
      0% { transform: scale(0.4); opacity: 0; }
      70% { transform: scale(1.15); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes fnest-laser-sweep {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(250%); }
    }
    @keyframes fnest-log-slide {
      from { opacity: 0; transform: translateX(-5px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fnest-cursor-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    .fnest-modal-enter { animation: fnest-modal-enter 0.32s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .fnest-spin-forward { animation: fnest-spin-forward 3.2s linear infinite; }
    .fnest-spin-reverse { animation: fnest-spin-reverse 4.5s linear infinite; }
    .fnest-spin-slow { animation: fnest-spin-slow 8s linear infinite; }
    .fnest-radar-fast { animation: fnest-spin-forward 6s linear infinite; }
    .fnest-radar-slow { animation: fnest-spin-forward 16s linear infinite; }
    .fnest-pulse-glow-active { animation: fnest-pulse-glow 2.4s ease-in-out infinite; }
    .fnest-pulse-glow-done { animation: fnest-pulse-glow 3.5s ease-in-out infinite; }
    .fnest-pulse-dot { animation: fnest-pulse-dot 1.2s ease-in-out infinite; }
    .fnest-bounce-in { animation: fnest-bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
    .fnest-laser-sweep { animation: fnest-laser-sweep 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
    .fnest-log-line { animation: fnest-log-slide 0.16s ease-out both; }
    .fnest-cursor { animation: fnest-cursor-blink 0.9s step-start infinite; }
    
    /* Scrollbar styling for terminal */
    .fnest-term-scroll::-webkit-scrollbar { width: 4px; }
    .fnest-term-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    .fnest-term-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
    .fnest-term-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,85,0,0.5); }
  `;
  document.head.appendChild(el);
}

/* ─── Modal Content Component ─────────────────────────────────────── */
function ModalContent({
  isOpen,
  progress,
  statusText,
  totalPanels,
  orderName,
}: ExportProcessingModalProps) {
  const [displayPct, setDisplayPct] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const prevAt = useRef(-1);

  useEffect(() => {
    ensureStyles();
  }, []);

  // Smooth numeric counter
  useEffect(() => {
    const target = Math.round(progress);
    if (target === 0) {
      setDisplayPct(0);
      return;
    }
    const timer = setInterval(() => {
      setDisplayPct((d) => {
        if (d < target) return Math.min(d + 1, target);
        return d;
      });
    }, 14);
    return () => clearInterval(timer);
  }, [progress]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setDisplayPct(0);
      setLogLines([]);
      prevAt.current = -1;
    }
  }, [isOpen]);

  // Append logs
  useEffect(() => {
    const step = getActiveStep(Math.round(progress));
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (step.at > prevAt.current) {
      prevAt.current = step.at;
      const msg = step.id === 'complete' 
        ? 'Export completed! Finalising download bundle...' 
        : step.fullLabel;
      setLogLines((lines) => [
        ...lines.slice(-25),
        `[${timeStr}] [${String(Math.round(progress)).padStart(3, ' ')}%] ▶ ${msg}`,
      ]);
    }

    if (statusText) {
      const clean = statusText.length > 70 ? statusText.slice(0, 68) + '…' : statusText;
      setLogLines((lines) => {
        if (lines.length > 0 && lines[lines.length - 1].endsWith(clean)) return lines;
        return [...lines.slice(-25), `[${timeStr}] ${clean}`];
      });
    }
  }, [progress, statusText]);

  // Auto-scroll terminal
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logLines]);

  if (!isOpen) return null;

  const isDone = progress >= 100;
  const activeStep = getActiveStep(Math.round(progress));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647, // Above all overlays
        background: 'rgba(5, 7, 10, 0.86)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* ── Outer Glowing Card Frame ── */}
      <div
        className="fnest-modal-enter"
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '620px',
          maxWidth: '96vw',
          background: 'linear-gradient(165deg, #12151D 0%, #0B0D13 55%, #07090D 100%)',
          borderRadius: '24px',
          border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.45)' : 'rgba(255, 85, 0, 0.35)'}`,
          boxShadow: isDone 
            ? '0 30px 90px -15px rgba(0, 0, 0, 0.95), 0 0 60px -10px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            : '0 35px 100px -15px rgba(0, 0, 0, 0.95), 0 0 70px -10px rgba(255, 85, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          padding: '28px 28px 22px',
          fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
          color: '#F8FAFC',
          transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
        }}
      >
        {/* Top edge vibrant neon laser shimmer */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: isDone
              ? 'linear-gradient(90deg, transparent, #10B981, #34D399, transparent)'
              : 'linear-gradient(90deg, transparent, #FF3B00, #FF7A00, #FFD000, transparent)',
            opacity: 0.9,
          }}
        >
          <div
            className="fnest-laser-sweep"
            style={{
              width: '40%',
              height: '100%',
              background: '#FFFFFF',
              filter: 'blur(2px)',
            }}
          />
        </div>

        {/* Dynamic Canvas Sparkles / Stardust */}
        <VibrantParticleCanvas running={!isDone} isDone={isDone} />

        {/* Ambient background depth glows */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: isDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 85, 0, 0.18)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'background 0.5s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: '-40px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: isDone ? 'rgba(5, 150, 105, 0.1)' : 'rgba(255, 170, 0, 0.12)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* ── HEADER ROW ── */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div>
            {/* Top pill badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div
                className="fnest-pulse-dot"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isDone ? '#10B981' : '#FF5500',
                  boxShadow: isDone ? '0 0 10px #10B981' : '0 0 10px #FF5500',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: isDone ? '#34D399' : '#FF7A00',
                  textShadow: isDone ? '0 0 10px rgba(52, 211, 153, 0.3)' : '0 0 10px rgba(255, 122, 0, 0.3)',
                }}
              >
                {isDone ? 'FiveNest Production · Ready' : 'FiveNest Studio · Production Renderer'}
              </span>
            </div>

            {/* Main Title */}
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '800',
                letterSpacing: '-0.025em',
                margin: 0,
                color: '#FFFFFF',
                lineHeight: 1.25,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isDone ? (
                <>
                  <CheckCircle2 size={24} color="#10B981" />
                  Files Ready to Download!
                </>
              ) : (
                'Rendering Production Files...'
              )}
            </h2>

            {/* Sub-meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '12px', color: '#94A3B8' }}>
              {orderName ? (
                <span style={{ color: '#E2E8F0', fontWeight: '600' }}>{orderName}</span>
              ) : (
                <span>High-Speed Sublimation Roll</span>
              )}
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <span style={{ 
                background: 'rgba(255, 85, 0, 0.12)', 
                border: '1px solid rgba(255, 85, 0, 0.25)', 
                color: '#FF944D', 
                padding: '1px 7px', 
                borderRadius: '6px', 
                fontWeight: '700', 
                fontSize: '11px' 
              }}>
                {totalPanels} {totalPanels === 1 ? 'Panel' : 'Panels'}
              </span>
            </div>
          </div>

          {/* Kinetic Animated Processing Core */}
          <KineticProcessingBadge isDone={isDone} />
        </div>

        {/* ── CENTERPIECE: CYBER DIAL GAUGE ── */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '12px 0 16px',
          }}
        >
          <CyberDialGauge pct={displayPct} isDone={isDone} />
        </div>

        {/* ── ACTIVE PHASE STATUS PILL ── */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: isDone 
                ? 'rgba(16, 185, 129, 0.12)' 
                : 'linear-gradient(135deg, rgba(255, 85, 0, 0.15) 0%, rgba(255, 170, 0, 0.08) 100%)',
              border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 85, 0, 0.35)'}`,
              boxShadow: isDone
                ? '0 0 15px rgba(16, 185, 129, 0.15)'
                : '0 0 15px rgba(255, 85, 0, 0.15)',
              transition: 'all 0.4s ease',
            }}
          >
            {isDone ? (
              <Sparkles size={14} color="#34D399" />
            ) : (
              <Loader2 size={14} color="#FF7A00" className="fnest-spin-forward" />
            )}
            <span
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: isDone ? '#34D399' : '#FFAA55',
                letterSpacing: '-0.01em',
              }}
            >
              {isDone ? 'All panels rendered & archived successfully!' : activeStep.fullLabel}
            </span>
          </div>
        </div>

        {/* ── STEP PROGRESSION PIPELINE ── */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {PIPELINE_STEPS.map((step, idx) => {
              const isPassed = displayPct > step.at;
              const isCurrent = displayPct >= step.at && (idx === PIPELINE_STEPS.length - 1 || displayPct < PIPELINE_STEPS[idx + 1]?.at);
              const StepIcon = step.icon;

              return (
                <React.Fragment key={step.id}>
                  {/* Step Node */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '5px',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isDone 
                          ? '#10B981' 
                          : isPassed 
                            ? 'linear-gradient(135deg, #FF5500, #FF8800)' 
                            : isCurrent 
                              ? 'rgba(255, 85, 0, 0.25)' 
                              : 'rgba(255, 255, 255, 0.05)',
                        border: `1.5px solid ${
                          isDone 
                            ? '#34D399' 
                            : (isPassed || isCurrent) 
                              ? '#FF7A00' 
                              : 'rgba(255, 255, 255, 0.12)'
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isCurrent && !isDone 
                          ? '0 0 12px rgba(255, 85, 0, 0.8)' 
                          : isPassed 
                            ? '0 0 8px rgba(255, 85, 0, 0.3)' 
                            : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isPassed || isDone ? (
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      ) : isCurrent ? (
                        <div
                          className="fnest-pulse-dot"
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#FF7A00',
                            boxShadow: '0 0 6px #FF7A00',
                          }}
                        />
                      ) : (
                        <StepIcon size={10} color="#64748B" />
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: isCurrent ? '800' : '600',
                        color: isDone 
                          ? '#34D399' 
                          : isCurrent 
                            ? '#FF944D' 
                            : isPassed 
                              ? '#E2E8F0' 
                              : '#64748B',
                        textAlign: 'center',
                        lineHeight: 1.1,
                        letterSpacing: '-0.01em',
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connecting line */}
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: '2px',
                        margin: '0 4px 14px',
                        background: isDone 
                          ? '#10B981' 
                          : isPassed 
                            ? 'linear-gradient(90deg, #FF5500, #FFAA00)' 
                            : 'rgba(255, 255, 255, 0.08)',
                        boxShadow: isPassed && !isDone 
                          ? '0 0 6px rgba(255, 85, 0, 0.4)' 
                          : 'none',
                        transition: 'all 0.35s ease',
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── TERMINAL CONSOLE ── */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            background: '#07090D',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Terminal Title Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                <Terminal size={11} color="#94A3B8" />
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', letterSpacing: '0.04em' }}>
                  FIVENEST OUTPUT LOG
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#64748B' }}>
              <Activity size={10} color={isDone ? '#10B981' : '#FF7A00'} />
              <span>300 DPI HI-RES STREAM</span>
            </div>
          </div>

          {/* Log Window */}
          <div
            ref={logRef}
            className="fnest-term-scroll"
            style={{
              padding: '8px 12px',
              height: '92px',
              overflowY: 'auto',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: '11px',
              lineHeight: 1.65,
              color: '#94A3B8',
            }}
          >
            {logLines.map((line, i) => {
              const isLast = i === logLines.length - 1;
              return (
                <div
                  key={i}
                  className="fnest-log-line"
                  style={{
                    color: isLast 
                      ? (isDone ? '#34D399' : '#FFAA55') 
                      : '#94A3B8',
                    fontWeight: isLast ? '700' : '400',
                    textShadow: isLast 
                      ? (isDone ? '0 0 8px rgba(52, 211, 153, 0.4)' : '0 0 8px rgba(255, 170, 85, 0.3)') 
                      : 'none',
                  }}
                >
                  {line}
                </div>
              );
            })}
            {!isDone && (
              <span className="fnest-cursor" style={{ color: '#FF7A00', fontWeight: '900', marginLeft: '2px' }}>
                █
              </span>
            )}
          </div>
        </div>

        {/* ── FOOTER ROW ── */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isDone ? (
              <span style={{ color: '#34D399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Check size={14} color="#10B981" />
                Download package generated & dispatched to browser
              </span>
            ) : (
              <span>
                Processing <strong style={{ color: '#FFAA55' }}>{totalPanels}</strong> production panels — please keep tab open
              </span>
            )}
          </div>

          {!isDone ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#FF944D', fontWeight: '600' }}>
              <Loader2 size={13} color="#FF7A00" className="fnest-spin-forward" />
              <span>Processing...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#34D399', fontWeight: '700' }}>
              <Download size={13} color="#10B981" />
              <span>Downloaded</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Exported Component using React Portal ───────────────────────── */
export const ExportProcessingModal: React.FC<ExportProcessingModalProps> = (props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !props.isOpen) return null;

  return ReactDOM.createPortal(<ModalContent {...props} />, document.body);
};
export default ExportProcessingModal;
