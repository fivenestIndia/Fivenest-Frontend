import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

interface ExportProcessingModalProps {
  isOpen: boolean;
  progress: number;       // 0–100 numeric
  statusText: string;     // current step text
  totalPanels: number;
  orderName?: string;
}

const STEPS = [
  { at: 0,   label: 'Initialising' },
  { at: 8,   label: 'Loading assets' },
  { at: 15,  label: 'Colour profile' },
  { at: 25,  label: 'Front panels' },
  { at: 45,  label: 'Back panels' },
  { at: 62,  label: 'Compositing' },
  { at: 74,  label: 'DPI scaling' },
  { at: 82,  label: 'Building ZIP' },
  { at: 90,  label: 'Preview PDF' },
  { at: 97,  label: 'Saving files' },
  { at: 100, label: 'Complete!' },
];

function getActiveStep(pct: number) {
  let active = STEPS[0];
  for (const s of STEPS) {
    if (pct >= s.at) active = s;
  }
  return active;
}

/* ─── Canvas particle emitter ─────────────────────────────── */
function ParticleCanvas({ running }: { running: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    type P = { x:number; y:number; vx:number; vy:number; r:number; alpha:number; color:string; life:number; maxLife:number };
    const palette = ['#E4572E','#F5A67D','#FFF3EF','#FFD6C4','#FFFFFF','#F0B27A','#E8734A'];
    const particles: P[] = [];

    function spawn() {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.4;
      const life  = 55 + Math.random() * 75;
      particles.push({
        x: canvas!.width / 2 + (Math.random() - 0.5) * 80,
        y: canvas!.height * 0.45,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        r: 1.5 + Math.random() * 3,
        alpha: 1,
        color: palette[Math.floor(Math.random() * palette.length)],
        life, maxLife: life
      });
    }

    let frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      if (running && frame % 2 === 0) { spawn(); spawn(); spawn(); }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.035; p.life--;
        p.alpha = (p.life / p.maxLife) * 0.85;
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
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: '18px' }}
    />
  );
}

/* ─── SVG circular ring ────────────────────────────────────── */
function OrbRing({ pct }: { pct: number }) {
  const r = 68;
  const circ = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  return (
    <svg width="160" height="160" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      <defs>
        <linearGradient id="epg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E4572E"/>
          <stop offset="100%" stopColor="#F5A67D"/>
        </linearGradient>
      </defs>
      <circle cx="80" cy="80" r={r} fill="none" stroke="#2A1A10" strokeWidth="6"/>
      <circle
        cx="80" cy="80" r={r}
        fill="none"
        stroke="url(#epg)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        style={{ transition: 'stroke-dasharray 0.35s ease' }}
      />
    </svg>
  );
}

/* ─── Inline CSS styles injected once ─────────────────────── */
const STYLE_ID = 'fnest-export-modal-styles';
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
    @keyframes fnest-fade-in  { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
    @keyframes fnest-scan     { 0%{top:0%;opacity:0.7} 100%{top:100%;opacity:0} }
    @keyframes fnest-spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes fnest-spin-rev { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
    @keyframes fnest-blink    { 0%,100%{opacity:1} 50%{opacity:0.25} }
    @keyframes fnest-pulse    { 0%,100%{transform:scale(0.94);opacity:0.5} 50%{transform:scale(1.05);opacity:0.25} }
    @keyframes fnest-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
    @keyframes fnest-slide-in { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
    .fnest-gear-main { animation: fnest-spin 3.5s linear infinite; }
    .fnest-gear-sec  { animation: fnest-spin-rev 2.4s linear infinite; }
    .fnest-blink     { animation: fnest-blink 1s ease-in-out infinite; }
    .fnest-pulse-ring { animation: fnest-pulse 2s ease-in-out infinite; }
    .fnest-float     { animation: fnest-float 3.5s ease-in-out infinite; }
    .fnest-log-line  { animation: fnest-slide-in 0.18s ease both; }
    .fnest-cursor    { animation: fnest-blink 1s step-start infinite; }
    .fnest-spin-sm   { animation: fnest-spin 1.4s linear infinite; }
  `;
  document.head.appendChild(el);
}

/* ─── Main modal rendered via React Portal ─────────────────── */
function ModalContent({
  isOpen, progress, statusText, totalPanels, orderName
}: ExportProcessingModalProps) {
  const [displayPct, setDisplayPct] = useState(0);
  const [logLines, setLogLines]     = useState<string[]>([]);
  const logRef  = useRef<HTMLDivElement>(null);
  const prevAt  = useRef(-1);

  /* inject keyframe styles */
  useEffect(() => { ensureStyles(); }, []);

  /* smooth counter */
  useEffect(() => {
    const target = Math.round(progress);
    if (target === 0) { setDisplayPct(0); return; }
    const t = setInterval(() => setDisplayPct(d => d < target ? Math.min(d + 1, target) : d), 16);
    return () => clearInterval(t);
  }, [progress]);

  /* reset on open */
  useEffect(() => {
    if (isOpen) { setDisplayPct(0); setLogLines([]); prevAt.current = -1; }
  }, [isOpen]);

  /* log entries */
  useEffect(() => {
    const step = getActiveStep(Math.round(progress));
    if (step.at > prevAt.current) {
      prevAt.current = step.at;
      setLogLines(l => [...l.slice(-20), `[${String(Math.round(progress)).padStart(3,' ')}%] ${step.label === 'Complete!' ? 'Export complete — download starting' : step.label}`]);
    }
    if (statusText) {
      const short = statusText.length > 75 ? statusText.slice(0, 72) + '…' : statusText;
      setLogLines(l => l[l.length - 1] === short ? l : [...l.slice(-20), short]);
    }
  }, [progress, statusText]);

  /* auto-scroll log */
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  if (!isOpen) return null;

  const isDone = progress >= 100;
  const activeStep = getActiveStep(Math.round(progress));

  /* Overlay — rendered via portal at body level */
  return (
    <div style={{
      position: 'fixed', inset: 0,
      zIndex: 2147483647,           /* max z-index, above everything */
      background: 'rgba(10,6,3,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fnest-fade-in 0.25s ease both',
    }}>
      {/* Modal card */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        width: '580px', maxWidth: '94vw',
        background: '#18100A',
        border: `1px solid ${isDone ? '#2F7D5C' : '#3D2010'}`,
        borderRadius: '20px',
        boxShadow: '0 40px 100px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)',
        padding: '30px 28px 22px',
        fontFamily: '"Inter", system-ui, sans-serif',
        transition: 'border-color 0.4s ease',
      }}>

        {/* Particle canvas */}
        <ParticleCanvas running={!isDone} />

        {/* CRT scan line */}
        {!isDone && (
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, transparent, rgba(228,87,46,0.5), transparent)',
            animation: 'fnest-scan 2.6s linear infinite',
            pointerEvents: 'none', zIndex: 1, top: 0,
          }}/>
        )}

        {/* ── HEADER ROW ── */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
              <div className="fnest-blink" style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: isDone ? '#2F7D5C' : '#E4572E',
                boxShadow: isDone ? '0 0 8px #2F7D5C88' : '0 0 12px #E4572E88',
              }}/>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#686661', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {isDone ? 'FiveNest Studio · Export Complete' : 'FiveNest Studio · Production Renderer'}
              </span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#F5F3EF', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              {isDone ? '✓ Files Ready to Download' : 'Rendering Production Files…'}
            </div>
            {orderName && (
              <div style={{ fontSize: '12px', color: '#686661', marginTop: '4px' }}>
                {orderName} · <strong style={{ color: '#F0B27A' }}>{totalPanels}</strong> panels
              </div>
            )}
          </div>

          {/* Gears */}
          <div className="fnest-float" style={{ position: 'relative', width: '68px', height: '68px', flexShrink: 0 }}>
            <div className="fnest-gear-main" style={{ position: 'absolute', top: 0, right: 0 }}>
              <svg width="44" height="44" viewBox="0 0 44 44">
                {[0,40,80,120,160,200,240,280,320].map((a,i) => (
                  <rect key={i} x="20.5" y="4" width="3" height="7" rx="1.5"
                    fill={isDone ? '#2F7D5C' : '#E4572E'} transform={`rotate(${a} 22 22)`} opacity="0.9"/>
                ))}
                <circle cx="22" cy="22" r="13" fill="none" stroke={isDone ? '#2F7D5C' : '#E4572E'} strokeWidth="2.5" strokeDasharray="5 4"/>
                <circle cx="22" cy="22" r="6" fill={isDone ? '#2F7D5C' : '#E4572E'} opacity="0.7"/>
              </svg>
            </div>
            <div className="fnest-gear-sec" style={{ position: 'absolute', bottom: 2, left: 0 }}>
              <svg width="28" height="28" viewBox="0 0 28 28">
                {[0,60,120,180,240,300].map((a,i) => (
                  <rect key={i} x="12.5" y="2" width="3" height="5" rx="1.5"
                    fill="#A87519" transform={`rotate(${a} 14 14)`} opacity="0.9"/>
                ))}
                <circle cx="14" cy="14" r="9" fill="none" stroke="#A87519" strokeWidth="2" strokeDasharray="4 3"/>
                <circle cx="14" cy="14" r="4" fill="#A87519" opacity="0.6"/>
              </svg>
            </div>
          </div>
        </div>

        {/* ── PROGRESS ORB ── */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            <div className="fnest-pulse-ring" style={{
              position: 'absolute', inset: '-10px', borderRadius: '50%',
              border: '2px solid rgba(228,87,46,0.2)',
              display: isDone ? 'none' : 'block',
            }}/>
            <OrbRing pct={displayPct} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: '40px', fontWeight: '900', letterSpacing: '-0.04em',
                color: isDone ? '#2F7D5C' : '#E4572E',
                transition: 'color 0.5s ease',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}>
                {displayPct}
              </span>
              <span style={{ fontSize: '14px', color: '#686661', fontWeight: '700', marginTop: '0px' }}>%</span>
            </div>
          </div>
        </div>

        {/* Current step label */}
        <div style={{
          position: 'relative', zIndex: 2,
          textAlign: 'center', marginBottom: '16px',
          fontSize: '13px', fontWeight: '600',
          color: isDone ? '#2F7D5C' : '#F0B27A',
          letterSpacing: '-0.01em', minHeight: '20px',
          transition: 'color 0.4s ease',
        }}>
          {isDone ? '🎉 All panels exported successfully!' : activeStep.label}
        </div>

        {/* ── STEP PIPELINE ── */}
        <div style={{ position: 'relative', zIndex: 2, marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {STEPS.filter((_,i) => i < 9).map((s, i, arr) => {
              const done    = displayPct > s.at;
              const current = displayPct >= s.at && (i === arr.length - 1 || displayPct < arr[i + 1]?.at);
              return (
                <React.Fragment key={s.at}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', flexShrink: 0, width: i === arr.length - 1 ? '50px' : '44px' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: isDone ? '#2F7D5C' : done ? '#E4572E' : current ? 'rgba(228,87,46,0.25)' : '#221208',
                      border: isDone ? '2px solid #2F7D5C' : (done || current) ? '2px solid #E4572E' : '2px solid #3D2010',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      boxShadow: current && !isDone ? '0 0 10px rgba(228,87,46,0.7)' : 'none',
                    }}>
                      {(done || isDone) && (
                        <svg width="9" height="9" viewBox="0 0 9 9">
                          <path d="M1.5 4.5l2 2L7.5 2" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {current && !isDone && !done && (
                        <div className="fnest-blink" style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#E4572E' }}/>
                      )}
                    </div>
                    <span style={{ fontSize: '7.5px', color: done || current || isDone ? '#686661' : '#3D2010', textAlign: 'center', lineHeight: 1.2, fontWeight: '600' }}>
                      {s.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{
                      flex: 1, height: '2px', minWidth: '2px',
                      background: done || isDone ? 'linear-gradient(90deg, #E4572E, #F5A67D)' : '#221208',
                      transition: 'background 0.4s ease',
                      marginBottom: '14px',
                    }}/>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── TERMINAL LOG ── */}
        <div
          ref={logRef}
          style={{
            position: 'relative', zIndex: 2,
            background: '#0B0705',
            border: '1px solid #2A1408',
            borderRadius: '8px',
            padding: '9px 12px',
            height: '100px',
            overflowY: 'auto',
            fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
            fontSize: '10.5px', lineHeight: '1.75', color: '#686661',
          }}
        >
          <div style={{ color: '#E4572E', fontWeight: '700', fontSize: '9px', letterSpacing: '0.1em', marginBottom: '3px' }}>
            ▶ FIVENEST PRODUCTION RENDERER v2.1 — {new Date().getFullYear()}
          </div>
          {logLines.map((line, i) => (
            <div key={i} className="fnest-log-line" style={{ color: i === logLines.length - 1 ? '#F5A67D' : '#4A3020' }}>
              {line}
            </div>
          ))}
          {!isDone && <span className="fnest-cursor" style={{ color: '#E4572E', fontWeight: '700' }}>█</span>}
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: '12px', paddingTop: '12px',
          borderTop: '1px solid #221208',
        }}>
          <div style={{ fontSize: '11px', color: '#4A3020' }}>
            {isDone
              ? <span style={{ color: '#2F7D5C', fontWeight: '700' }}>✓ Your download has started automatically</span>
              : <span>Processing <strong style={{ color: '#F0B27A' }}>{totalPanels}</strong> panels — please do not close this tab</span>
            }
          </div>
          {!isDone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#4A3020' }}>
              <svg width="11" height="11" viewBox="0 0 12 12" className="fnest-spin-sm">
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
}

/* ─── Exported component — uses React Portal ──────────────── */
export const ExportProcessingModal: React.FC<ExportProcessingModalProps> = (props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !props.isOpen) return null;

  return ReactDOM.createPortal(
    <ModalContent {...props} />,
    document.body
  );
};
