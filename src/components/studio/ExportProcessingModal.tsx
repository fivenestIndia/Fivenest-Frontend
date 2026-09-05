import React, { useEffect, useRef, useState } from 'react';

interface ExportProcessingModalProps {
  isOpen: boolean;
  progress: number;       // 0–100 numeric
  statusText: string;     // current step text
  totalPanels: number;
  orderName?: string;
}

const STEPS = [
  { at: 0,   label: 'Initialising render engine' },
  { at: 8,   label: 'Loading custom fonts & assets' },
  { at: 15,  label: 'Applying colour profiles' },
  { at: 25,  label: 'Rendering front panels' },
  { at: 45,  label: 'Rendering back panels & sleeves' },
  { at: 62,  label: 'Compositing overlays & logos' },
  { at: 74,  label: 'DPI scaling to production resolution' },
  { at: 82,  label: 'Compiling ZIP package' },
  { at: 90,  label: 'Generating preview PDF' },
  { at: 97,  label: 'Finalising & saving files' },
  { at: 100, label: 'Export complete!' },
];

function getActiveStep(pct: number) {
  let active = STEPS[0];
  for (const s of STEPS) {
    if (pct >= s.at) active = s;
  }
  return active;
}

/* ─── Particle canvas ─────────────────────────────────────── */
function ParticleCanvas({ running }: { running: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; alpha: number;
      color: string; life: number; maxLife: number;
    };

    const palette = [
      '#E4572E','#F5A67D','#FFF3EF','#FFD6C4',
      '#FFFFFF','#F0B27A','#E8734A','#FAC8A8'
    ];
    const particles: Particle[] = [];

    function spawn() {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.2;
      const life  = 60 + Math.random() * 80;
      particles.push({
        x: canvas!.width / 2 + (Math.random() - 0.5) * 60,
        y: canvas!.height / 2 + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6,
        r: 2 + Math.random() * 3,
        alpha: 1,
        color: palette[Math.floor(Math.random() * palette.length)],
        life, maxLife: life
      });
    }

    let frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      if (running && frame % 3 === 0) { spawn(); spawn(); }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.04;
        p.life--;
        p.alpha = p.life / p.maxLife;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      frame++;
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

/* ─── Spinning gear SVG ───────────────────────────────────── */
function Gear({ size = 48, speed = 4, color = '#E4572E', reverse = false }: {
  size?: number; speed?: number; color?: string; reverse?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{
      animation: `spin${reverse ? 'Rev' : ''} ${speed}s linear infinite`,
    }}>
      <style>{`
        @keyframes spinRev { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
      `}</style>
      <path fill={color} d="
        M24 4 L26.5 2.5 L28 6 L31.5 5.5 L31.5 9.2 L35 10 L33.5 13.2 L36.5 15.5 L34 18
        L36 21.5 L32.5 23 L32.5 26.5 L29 27.5 L28.5 31 L24.5 31 L23 34.5 L19.5 33.5
        L17 36.5 L14 34.5 L11 36 L9.5 32.5 L6 31.5 L6.5 28 L3.5 26.5 L4 23 L1.5 21
        L3.5 18 L1.5 15 L4.5 13 L3.5 9.5 L7 9.5 L8 6 L11.5 6.5 L13 3.5 L16.5 5
        L18.5 2.5 Z
      " opacity="0.15"/>
      <path fill={color} d="
        M24 8 a16 16 0 1 1 0 32 a16 16 0 0 1 0-32z
      " opacity="0"/>
      <circle cx="24" cy="24" r="14" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="6 4"/>
      <circle cx="24" cy="24" r="6" fill={color} opacity="0.7"/>
      {[0,45,90,135,180,225,270,315].map((a,i) => (
        <rect key={i} x="22.5" y="9" width="3" height="6" rx="1.5" fill={color}
          transform={`rotate(${a} 24 24)`} opacity="0.85"/>
      ))}
    </svg>
  );
}

/* ─── Orb ring animation ──────────────────────────────────── */
function OrbRing({ progress }: { progress: number }) {
  const r = 68;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;

  return (
    <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="80" cy="80" r={r} fill="none" stroke="#F5E9E5" strokeWidth="6"/>
      <circle
        cx="80" cy="80" r={r}
        fill="none"
        stroke="url(#prog-grad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.4s ease' }}
      />
      <defs>
        <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E4572E"/>
          <stop offset="100%" stopColor="#F5A67D"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Main modal ──────────────────────────────────────────── */
export const ExportProcessingModal: React.FC<ExportProcessingModalProps> = ({
  isOpen, progress, statusText, totalPanels, orderName
}) => {
  const [displayPct, setDisplayPct] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const prevPct = useRef(0);

  /* smooth display counter */
  useEffect(() => {
    const target = Math.round(progress);
    const step = () => {
      setDisplayPct(d => {
        if (d < target) return Math.min(d + 1, target);
        return d;
      });
    };
    const t = setInterval(step, 18);
    return () => clearInterval(t);
  }, [progress]);

  /* reset on open */
  useEffect(() => {
    if (isOpen) { setDisplayPct(0); setLogLines([]); prevPct.current = 0; }
  }, [isOpen]);

  /* log steps as they unlock */
  useEffect(() => {
    const active = getActiveStep(Math.round(progress));
    if (active.at > prevPct.current) {
      setLogLines(l => [...l.slice(-18), `[${String(Math.round(progress)).padStart(3,' ')}%] ${active.label}`]);
      prevPct.current = active.at;
    }
    if (statusText && !logLines.includes(statusText)) {
      setLogLines(l => {
        const shortText = statusText.length > 72 ? statusText.slice(0, 69) + '…' : statusText;
        if (l[l.length - 1] === shortText) return l;
        return [...l.slice(-18), shortText];
      });
    }
  }, [progress, statusText]);

  /* auto-scroll log */
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  if (!isOpen) return null;

  const isDone = progress >= 100;
  const activeStep = getActiveStep(Math.round(progress));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,10,8,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      animation: 'fadeIn 0.25s ease',
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scanLine {
          0%   { top: 0%; opacity:0.6 }
          100% { top: 100%; opacity:0 }
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes spinRev { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); opacity: 0.7 }
          50%  { transform: scale(1.04); opacity: 0.4 }
          100% { transform: scale(0.95); opacity: 0.7 }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px) }
          50%     { transform: translateY(-8px) }
        }
        @keyframes slide-in {
          from { opacity:0; transform: translateX(-8px) }
          to   { opacity:1; transform: translateX(0) }
        }
        .log-line { animation: slide-in 0.2s ease; }
        .cursor-blink { animation: blink 1s step-start infinite; }
      `}</style>

      {/* Modal card */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        width: '560px', maxWidth: '96vw',
        background: '#1A1008',
        border: '1px solid #3D2010',
        borderRadius: '18px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(228,87,46,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        padding: '32px 28px 24px',
        fontFamily: '"Inter", system-ui, sans-serif',
      }}>
        {/* Particle effect */}
        <ParticleCanvas running={!isDone} />

        {/* CRT scan line effect */}
        {!isDone && (
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(228,87,46,0.4) 50%, transparent 100%)',
            animation: 'scanLine 2.8s linear infinite',
            pointerEvents: 'none', zIndex: 1,
          }}/>
        )}

        {/* Top row: brand + gears */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDone ? '#2F7D5C' : '#E4572E', animation: isDone ? 'none' : 'blink 1s ease-in-out infinite', boxShadow: isDone ? '0 0 8px #2F7D5C' : '0 0 10px #E4572E' }}/>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#92908A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {isDone ? 'Export Complete' : 'Production Renderer'}
              </span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#F5F3EF', marginTop: '4px', letterSpacing: '-0.03em' }}>
              {isDone ? '✓ Files Ready' : 'Processing Files…'}
            </div>
            {orderName && (
              <div style={{ fontSize: '12px', color: '#686661', marginTop: '2px' }}>
                {orderName} · {totalPanels} panels
              </div>
            )}
          </div>

          {/* Gears cluster */}
          <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0, animation: 'float 3.5s ease-in-out infinite' }}>
            <div style={{ position: 'absolute', top: 0, right: 0 }}>
              <Gear size={40} speed={3.5} color={isDone ? '#2F7D5C' : '#E4572E'} />
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0 }}>
              <Gear size={26} speed={2.5} color="#A87519" reverse />
            </div>
          </div>
        </div>

        {/* Central orb + percent */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            {/* Pulse ring */}
            <div style={{
              position: 'absolute', inset: '-8px', borderRadius: '50%',
              border: '2px solid rgba(228,87,46,0.18)',
              animation: isDone ? 'none' : 'pulse-ring 2s ease-in-out infinite',
            }}/>
            <OrbRing progress={displayPct} />
            {/* Center text */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: '36px', fontWeight: '900', letterSpacing: '-0.04em',
                color: isDone ? '#2F7D5C' : '#E4572E',
                fontVariantNumeric: 'tabular-nums',
                transition: 'color 0.4s ease',
              }}>
                {displayPct}
              </span>
              <span style={{ fontSize: '13px', color: '#686661', fontWeight: '600', marginTop: '-2px' }}>
                %
              </span>
            </div>
          </div>
        </div>

        {/* Current step label */}
        <div style={{
          position: 'relative', zIndex: 2,
          textAlign: 'center',
          fontSize: '13px', fontWeight: '600', color: '#F0B27A',
          marginBottom: '16px',
          minHeight: '20px',
          letterSpacing: '-0.01em',
        }}>
          {isDone ? '🎉 Your panels are ready to download!' : activeStep.label}
        </div>

        {/* Step pipeline */}
        <div style={{ position: 'relative', zIndex: 2, marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto', paddingBottom: '4px' }}>
            {STEPS.filter((_,i) => i < 8).map((s, i, arr) => {
              const done    = displayPct > s.at;
              const current = displayPct >= s.at && (i === arr.length - 1 || displayPct < arr[i + 1].at);
              return (
                <React.Fragment key={s.at}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                    flexShrink: 0, width: '56px',
                  }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: done ? '#E4572E' : current ? 'rgba(228,87,46,0.3)' : '#2A1A10',
                      border: current ? '2px solid #E4572E' : done ? '2px solid #E4572E' : '2px solid #3D2010',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      boxShadow: current ? '0 0 10px rgba(228,87,46,0.6)' : 'none',
                    }}>
                      {done && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                      {current && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#E4572E', animation:'blink 1s ease infinite' }}/>}
                    </div>
                    <span style={{ fontSize: '8px', color: done || current ? '#92908A' : '#3D2010', textAlign: 'center', lineHeight: 1.2, fontWeight: '600' }}>
                      {s.label.split(' ').slice(0,2).join(' ')}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{
                      flex: 1, height: '2px',
                      background: done ? 'linear-gradient(90deg, #E4572E, #F5A67D)' : '#2A1A10',
                      transition: 'background 0.4s ease',
                      marginBottom: '15px', flexShrink: 0, minWidth: '4px',
                    }}/>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Terminal log */}
        <div
          ref={logRef}
          style={{
            position: 'relative', zIndex: 2,
            background: '#0D0806',
            border: '1px solid #2A1A10',
            borderRadius: '8px',
            padding: '10px 12px',
            height: '110px',
            overflowY: 'auto',
            fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
            fontSize: '11px',
            lineHeight: '1.7',
            color: '#92908A',
          }}
        >
          <div style={{ color: '#E4572E', fontWeight: '700', marginBottom: '4px', fontSize: '10px', letterSpacing: '0.08em' }}>
            ▶ FIVENEST PRODUCTION RENDERER v2
          </div>
          {logLines.map((line, i) => (
            <div key={i} className="log-line" style={{ color: i === logLines.length - 1 ? '#F5A67D' : '#686661' }}>
              {line}
            </div>
          ))}
          {!isDone && (
            <span className="cursor-blink" style={{ color: '#E4572E', fontWeight: '700' }}>█</span>
          )}
        </div>

        {/* Bottom bar: stats */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid #2A1A10',
        }}>
          <div style={{ fontSize: '11px', color: '#686661' }}>
            {isDone
              ? <span style={{ color: '#2F7D5C', fontWeight: '700' }}>✓ Download starting automatically</span>
              : <span>Rendering <strong style={{ color: '#F0B27A' }}>{totalPanels}</strong> panels at high resolution…</span>
            }
          </div>
          {!isDone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#686661' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: 'spin 1.5s linear infinite' }}>
                <circle cx="6" cy="6" r="5" fill="none" stroke="#3D2010" strokeWidth="2"/>
                <path d="M6 1 A5 5 0 0 1 11 6" fill="none" stroke="#E4572E" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Please wait…
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
