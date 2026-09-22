import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';

// ─── Jersey SVG Component ──────────────────────────────────────────────────
interface JerseySVGProps {
  primaryColor?: string;
  secondaryColor?: string;
  stripeColor?: string;
  name?: string;
  number?: string | number;
  designOpacity?: number;
  style?: React.CSSProperties;
  className?: string;
  scale?: number;
}

function JerseySVG({
  primaryColor = '#ffffff',
  secondaryColor = '#e8e8e8',
  stripeColor = '#f97316',
  name = '',
  number = '',
  designOpacity = 0,
  style = {},
  className = '',
  scale = 1,
}: JerseySVGProps) {
  const hasDesign = designOpacity > 0;

  return (
    <svg
      viewBox="0 0 300 340"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ ...style, filter: hasDesign ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' : 'drop-shadow(0 8px 20px rgba(0,0,0,0.15))' }}
    >
      <defs>
        {/* Jersey gradient */}
        <linearGradient id={`jerseyGrad-${primaryColor.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="60%" stopColor={primaryColor} stopOpacity="0.92" />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>

        {/* Design overlay gradient */}
        <linearGradient id="designGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stripeColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={stripeColor} stopOpacity="0.6" />
        </linearGradient>

        {/* Side panel gradient */}
        <linearGradient id="sideGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={stripeColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={stripeColor} stopOpacity="0.4" />
        </linearGradient>

        {/* 3D shading */}
        <linearGradient id="shading" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
          <stop offset="30%" stopColor="#000000" stopOpacity="0" />
          <stop offset="70%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>

        {/* Clip path for jersey shape */}
        <clipPath id="jerseyClip">
          <path d="
            M 60 30
            C 60 30, 80 20, 100 15
            L 150 8
            L 200 15
            C 220 20, 240 30, 240 30
            L 270 60
            L 250 85
            L 235 75
            L 235 320
            L 65 320
            L 65 75
            L 50 85
            L 30 60
            Z
          " />
        </clipPath>
      </defs>

      {/* ── Main Jersey Body ─────────────────────────────────── */}
      {/* Base fill */}
      <path
        d="
          M 60 30
          C 60 30, 80 20, 100 15
          L 150 8
          L 200 15
          C 220 20, 240 30, 240 30
          L 270 60
          L 250 85
          L 235 75
          L 235 320
          L 65 320
          L 65 75
          L 50 85
          L 30 60
          Z
        "
        fill={`url(#jerseyGrad-${primaryColor.replace('#', '')})`}
        stroke={secondaryColor}
        strokeWidth="1"
      />

      {/* ── Collar ────────────────────────────────────────── */}
      <path
        d="M 112 15 Q 150 35 188 15 Q 175 50 150 52 Q 125 50 112 15 Z"
        fill={hasDesign ? stripeColor : '#d0d0d0'}
        opacity={hasDesign ? designOpacity : 1}
        style={{ transition: 'fill 0.5s, opacity 0.5s' }}
      />

      {/* ── Design Overlay: Side Panels ──────────────────── */}
      {hasDesign && (
        <>
          {/* Left side panel */}
          <path
            d="M 65 75 L 65 320 L 105 320 L 105 75 Z"
            fill={stripeColor}
            opacity={designOpacity * 0.85}
          />
          {/* Right side panel */}
          <path
            d="M 195 75 L 195 320 L 235 320 L 235 75 Z"
            fill={stripeColor}
            opacity={designOpacity * 0.85}
          />
          {/* Shoulder stripe left */}
          <path
            d="M 65 75 L 50 85 L 30 60 L 60 30 C 70 35 80 55 85 75 Z"
            fill={stripeColor}
            opacity={designOpacity * 0.7}
          />
          {/* Shoulder stripe right */}
          <path
            d="M 235 75 L 250 85 L 270 60 L 240 30 C 230 35 220 55 215 75 Z"
            fill={stripeColor}
            opacity={designOpacity * 0.7}
          />
          {/* Chest band */}
          <rect
            x="65" y="110" width="170" height="18"
            fill={stripeColor}
            opacity={designOpacity * 0.5}
            rx="2"
          />
        </>
      )}

      {/* ── Sleeves ───────────────────────────────────────── */}
      {/* Left sleeve */}
      <path
        d="M 65 75 L 50 85 L 30 60 L 60 30 C 70 40 72 60 68 75 Z"
        fill={hasDesign ? stripeColor : `url(#jerseyGrad-${primaryColor.replace('#', '')})`}
        opacity={hasDesign ? designOpacity * 0.8 : 1}
        stroke={secondaryColor}
        strokeWidth="0.5"
      />
      {/* Right sleeve */}
      <path
        d="M 235 75 L 250 85 L 270 60 L 240 30 C 230 40 228 60 232 75 Z"
        fill={hasDesign ? stripeColor : `url(#jerseyGrad-${primaryColor.replace('#', '')})`}
        opacity={hasDesign ? designOpacity * 0.8 : 1}
        stroke={secondaryColor}
        strokeWidth="0.5"
      />

      {/* ── Number ────────────────────────────────────────── */}
      {number !== '' && (
        <text
          x="150"
          y="230"
          textAnchor="middle"
          fontSize="88"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          fill="white"
          opacity={designOpacity}
          letterSpacing="-4"
          style={{
            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
          }}
        >
          {number}
        </text>
      )}

      {/* ── Name ──────────────────────────────────────────── */}
      {name !== '' && (
        <text
          x="150"
          y="285"
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          fontFamily="Arial Black, sans-serif"
          fill="white"
          opacity={designOpacity}
          letterSpacing="4"
        >
          {name.toUpperCase()}
        </text>
      )}

      {/* ── 3D Shading overlay ────────────────────────────── */}
      <path
        d="
          M 60 30
          C 60 30, 80 20, 100 15
          L 150 8
          L 200 15
          C 220 20, 240 30, 240 30
          L 270 60
          L 250 85
          L 235 75
          L 235 320
          L 65 320
          L 65 75
          L 50 85
          L 30 60
          Z
        "
        fill="url(#shading)"
        pointerEvents="none"
      />

      {/* ── Stitching details ─────────────────────────────── */}
      <line x1="65" y1="75" x2="65" y2="320" stroke={hasDesign ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)'} strokeWidth="1" strokeDasharray="4,4" />
      <line x1="235" y1="75" x2="235" y2="320" stroke={hasDesign ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)'} strokeWidth="1" strokeDasharray="4,4" />
    </svg>
  );
}

// ─── Player data for the final spread ─────────────────────────────────────
const players = [
  { name: 'RAHUL', number: 7, primaryColor: '#f97316', secondaryColor: '#ea580c', stripeColor: '#1a1a2e' },
  { name: 'PRIYA', number: 11, primaryColor: '#3b82f6', secondaryColor: '#2563eb', stripeColor: '#ffffff' },
  { name: 'ARUN', number: 23, primaryColor: '#10b981', secondaryColor: '#059669', stripeColor: '#fbbf24' },
  { name: 'SARA', number: 5, primaryColor: '#8b5cf6', secondaryColor: '#7c3aed', stripeColor: '#f0fdf4' },
  { name: 'VIJAY', number: 17, primaryColor: '#ef4444', secondaryColor: '#dc2626', stripeColor: '#fef3c7' },
  { name: 'MEERA', number: 9, primaryColor: '#0ea5e9', secondaryColor: '#0284c7', stripeColor: '#ffd700' },
];

// ─── Main Jersey Animation Component ──────────────────────────────────────
export default function JerseyScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const [labelText, setLabelText] = useState('Plain canvas. Ready to become extraordinary.');

  // Track scroll within this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth spring for scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    restDelta: 0.001,
  });

  // ── Derived animation values ──────────────────────────────
  // Rotation: 0→0 (Phase1 idle), then 0→360 in Phase 3
  const rawRotation = useTransform(smoothProgress, [0.5, 0.78], [0, 360]);
  const rotation = useSpring(rawRotation, { stiffness: 30, damping: 15 });

  // Gentle idle rotation in phase 1
  const idleRotation = useTransform(smoothProgress, [0, 0.25], [-8, 8]);

  // Design opacity: fades in during Phase 2
  const designOpacity = useTransform(smoothProgress, [0.22, 0.5], [0, 1]);

  // Scale: starts at 1.1, zooms out to 0.65 during phase 3, then stays
  const centerScale = useTransform(smoothProgress, [0.5, 0.78, 0.82], [1.1, 0.7, 0.6]);

  // Center jersey Y position
  const centerY = useTransform(smoothProgress, [0.78, 0.85], [0, -180]);

  // Center jersey X position  
  const centerX = useTransform(smoothProgress, [0.78, 0.85], [0, 0]);

  // Spread jerseys opacity
  const spreadOpacity = useTransform(smoothProgress, [0.8, 0.95], [0, 1]);

  // Update phase and label based on progress
  useEffect(() => {
    const unsubscribe = smoothProgress.on('change', (v) => {
      if (v < 0.22) {
        setPhase(0);
        setLabelText('A blank canvas. Ready to become extraordinary.');
      } else if (v < 0.52) {
        setPhase(1);
        setLabelText('Your design comes alive — colors, stripes, identity.');
      } else if (v < 0.80) {
        setPhase(2);
        setLabelText('Inspect every angle. 360° production-ready.');
      } else {
        setPhase(3);
        setLabelText('One design. Hundreds of unique jerseys. Instantly.');
      }
    });
    return unsubscribe;
  }, [smoothProgress]);

  // Compute rotateY for 3D effect: combine idle + phase3 rotation
  const getRotateY = () => {
    // We use a CSS approach with transforms
    return rotation;
  };

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: '600vh' }} // Tall container — animation plays over 600vh of scroll
    >
      {/* ── STICKY VIEWPORT ─────────────────────────────────── */}
      <div
        className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center"
        style={{
          background: 'linear-gradient(to bottom, #09090b, #0f0f14, #09090b)',
        }}
      >
        {/* Background grid */}
        <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

        {/* Radial glow that pulses with phase */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: phase >= 1 ? 1 : 0.3,
          }}
          transition={{ duration: 1 }}
          style={{
            background: phase >= 1
              ? 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(249,115,22,0.12), transparent)'
              : 'radial-gradient(ellipse 40% 30% at 50% 50%, rgba(255,255,255,0.04), transparent)',
          }}
        />

        {/* ── TOP LABEL ─────────────────────────────────────── */}
        <div className="absolute top-10 left-0 right-0 text-center z-10 px-4">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
            className="px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm"
          >
            {labelText}
          </motion.span>
        </div>

        {/* ── PHASE INDICATOR DOTS ─────────────────────────── */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
          {['Plain', 'Design', '360°', 'Batch'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 justify-end">
              <span className={`text-xs transition-all duration-300 ${phase === i ? 'text-orange-400' : 'text-zinc-700'}`}>
                {label}
              </span>
              <div
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  phase === i ? 'bg-orange-500 scale-150 shadow-[0_0_8px_rgba(249,115,22,0.8)]' :
                  phase > i ? 'bg-orange-700' : 'bg-zinc-700'
                }`}
              />
            </div>
          ))}
        </div>

        {/* ── MAIN CONTENT AREA ─────────────────────────────── */}
        <div className="relative w-full h-full flex items-center justify-center">

          {/* ── PHASES 0-2: Single Center Jersey ─────────────── */}
          {phase < 3 && (
            <motion.div
              className="absolute"
              style={{
                y: centerY,
                scale: centerScale,
                transformPerspective: 1200,
                transformStyle: 'preserve-3d',
              }}
            >
              <motion.div
                style={{
                  rotateY: phase < 2 ? idleRotation : rotation,
                  transformPerspective: 1200,
                }}
                animate={{
                  rotateY: phase < 2 ? undefined : undefined,
                }}
              >
                <motion.div
                  initial={false}
                  animate={{ scale: 1 }}
                  style={{ width: 280, height: 320 }}
                >
                  {/* Back of jersey (visible when rotated past 90°) */}
                  <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                    <JerseySVG
                      primaryColor={phase >= 1 ? '#f97316' : '#f5f5f5'}
                      secondaryColor={phase >= 1 ? '#ea580c' : '#e0e0e0'}
                      stripeColor={phase >= 1 ? '#1a1a1a' : '#cccccc'}
                      name={phase >= 1 ? 'RAHUL' : ''}
                      number={phase >= 1 ? 7 : ''}
                      designOpacity={phase >= 1 ? 1 : 0}
                      style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }}
                    />
                  </div>
                  {/* Front of jersey */}
                  <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                    <MotionJersey
                      phase={phase}
                      designOpacity={designOpacity}
                    />
                  </div>
                </motion.div>
              </motion.div>

              {/* Floor shadow */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 rounded-full blur-2xl"
                style={{
                  bottom: -40,
                  width: 200,
                  height: 30,
                  background: 'rgba(249,115,22,0.2)',
                  opacity: phase >= 1 ? 0.8 : 0.3,
                }}
              />
            </motion.div>
          )}

          {/* ── PHASE 3: Multiple Jerseys Spread ─────────────── */}
          <AnimatePresence>
            {phase === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {/* Section title */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="absolute top-16 left-0 right-0 text-center"
                >
                  <h3 className="text-white font-extrabold" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
                    One batch. <span className="gradient-text">Every player. Every size.</span>
                  </h3>
                  <p className="text-zinc-400 mt-2 text-sm md:text-base">
                    Fivenest generates all variations instantly — names, numbers, colors.
                  </p>
                </motion.div>

                {/* Jersey grid */}
                <div
                  className="grid gap-3 md:gap-5 px-4 mt-16"
                  style={{
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    maxWidth: 700,
                    width: '100%',
                  }}
                >
                  {players.map((player, i) => (
                    <motion.div
                      key={player.name}
                      initial={{ opacity: 0, y: 60, scale: 0.7, rotateY: -30 }}
                      animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                      transition={{
                        delay: i * 0.12,
                        duration: 0.6,
                        type: 'spring',
                        stiffness: 80,
                        damping: 12,
                      }}
                      whileHover={{
                        scale: 1.12,
                        y: -10,
                        rotateY: 15,
                        zIndex: 10,
                        transition: { duration: 0.3 },
                      }}
                      className="flex flex-col items-center cursor-pointer"
                      style={{ perspective: 800, transformStyle: 'preserve-3d' }}
                    >
                      <JerseySVG
                        primaryColor={player.primaryColor}
                        secondaryColor={player.secondaryColor}
                        stripeColor={player.stripeColor}
                        name={player.name}
                        number={player.number}
                        designOpacity={1}
                        style={{ width: '100%', maxWidth: 180 }}
                      />
                      {/* Player label */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.12 + 0.4 }}
                        className="mt-2 text-center"
                      >
                        <p className="text-white text-xs font-bold">{player.name}</p>
                        <p className="text-zinc-500 text-[10px]">#{player.number}</p>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="absolute bottom-12 left-0 right-0 text-center"
                >
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      500+ jerseys in one batch
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.3s' }} />
                      Unlimited color variants
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.6s' }} />
                      Auto name & number
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── PHASE 0: Floating particles around plain jersey ── */}
          {phase === 0 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-zinc-600"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          )}

          {/* ── PHASE 1: Color spray effect ─────────────────── */}
          {phase === 1 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 4 + Math.random() * 8,
                    height: 4 + Math.random() * 8,
                    background: ['#f97316', '#fbbf24', '#fb923c'][i % 3],
                    left: `${30 + Math.random() * 40}%`,
                    top: `${25 + Math.random() * 50}%`,
                    filter: 'blur(1px)',
                  }}
                  animate={{
                    x: [(Math.random() - 0.5) * 100],
                    y: [(Math.random() - 0.5) * 80],
                    opacity: [0, 0.8, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 1.5 + Math.random(),
                    repeat: Infinity,
                    delay: Math.random() * 1.5,
                    repeatDelay: Math.random() * 0.5,
                  }}
                />
              ))}
            </div>
          )}

          {/* ── PHASE 2: Rotation speed lines ────────────────── */}
          {phase === 2 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-px"
                  style={{
                    width: 60 + Math.random() * 120,
                    background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.6), transparent)',
                    top: `${35 + i * 6}%`,
                    left: i % 2 === 0 ? '5%' : 'auto',
                    right: i % 2 !== 0 ? '5%' : 'auto',
                  }}
                  animate={{
                    scaleX: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                    repeatDelay: 0.3,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── SCROLL INDICATOR ───────────────────────────────── */}
        {phase < 3 && (
          <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2">
            <p className="text-zinc-600 text-xs tracking-widest uppercase">Scroll to animate</p>
            <motion.div
              animate={{ y: [0, 8, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-5 h-8 rounded-full border-2 border-zinc-700 flex items-start justify-center pt-1"
            >
              <div className="w-1 h-2 bg-orange-500 rounded-full" />
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── MotionJersey wraps JerseySVG with motion values ──────────────────────
function MotionJersey({
  phase,
  designOpacity,
}: {
  phase: number;
  designOpacity: any;
}) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const unsubscribe = designOpacity.on('change', (v: number) => {
      setOpacity(v);
    });
    return unsubscribe;
  }, [designOpacity]);

  return (
    <JerseySVG
      primaryColor={phase >= 1 ? '#f97316' : '#f5f5f5'}
      secondaryColor={phase >= 1 ? '#ea580c' : '#e8e8e8'}
      stripeColor={phase >= 1 ? '#1a1a1a' : '#cccccc'}
      name={phase >= 1 ? 'RAHUL' : ''}
      number={phase >= 1 ? 7 : ''}
      designOpacity={opacity}
      style={{ width: '100%', height: '100%', transition: 'filter 0.8s' }}
    />
  );
}
