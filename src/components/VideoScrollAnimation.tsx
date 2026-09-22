import React, { useRef, useState, useCallback } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

/**
 * VideoScrollAnimation
 * 
 * Interactive 3D Jersey Showcase: plays frame-by-frame on scroll.
 */

interface VideoScrollAnimationProps {
  src?: string;
  scrollHeight?: string;
}

export default function VideoScrollAnimation({
  src = '/jersey-3d.mp4',
  scrollHeight = '450vh',
}: VideoScrollAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [phase, setPhase] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const handleVideoLoaded = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setVideoDuration(video.duration);
    setIsLoaded(true);
    video.currentTime = 0;
  }, []);

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const video = videoRef.current;
    if (!video || !videoDuration) return;

    const targetTime = progress * videoDuration;
    video.currentTime = targetTime;

    if (progress < 0.25) setPhase(0);
    else if (progress < 0.55) setPhase(1);
    else if (progress < 0.80) setPhase(2);
    else setPhase(3);
  });

  const phaseLabels = [
    'Plain Canvas: Master Artwork Uploaded',
    'Design Integration: Colors & Decals Applied',
    '360° Inspection: Precision Vector Placement',
    'Batch Ready: 500+ Unique Jerseys Exported',
  ];

  const phaseNames = ['Base', 'Design', '360°', 'Batch'];

  return (
    <section
      ref={containerRef}
      className="relative bg-[#0F0F12] text-white"
      style={{ height: scrollHeight }}
    >
      {/* ── STICKY VIEWPORT ─────────────────────────────────── */}
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center bg-[#0F0F12]">
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        {/* Ambient Warm Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(228, 87, 46, 0.12) 0%, transparent 60%)',
          }}
        />

        {/* ── TOP BADGE / PHASE LABEL ───────────────────────── */}
        <div className="absolute top-10 md:top-14 left-0 right-0 text-center z-20 px-4">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-[#E4572E] animate-pulse" />
            <span className="text-xs md:text-sm font-semibold text-white tracking-wide">
              {phaseLabels[phase]}
            </span>
          </motion.div>
        </div>

        {/* ── RIGHT PHASE INDICATORS ────────────────────────── */}
        <div className="absolute right-5 md:right-10 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 z-20">
          {phaseNames.map((label, i) => (
            <div key={label} className="flex items-center gap-2.5 justify-end">
              <span
                className={`text-[11px] font-semibold tracking-wider uppercase transition-colors duration-300 ${
                  phase === i ? 'text-[#E4572E]' : 'text-zinc-500'
                }`}
              >
                {label}
              </span>
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  phase === i
                    ? 'bg-[#E4572E] scale-125 shadow-[0_0_12px_rgba(228,87,46,0.9)]'
                    : phase > i
                    ? 'bg-zinc-600'
                    : 'bg-zinc-800'
                }`}
              />
            </div>
          ))}
        </div>

        {/* ── VIDEO PLAYER WITH MIX-BLEND-MODE SCREEN ───────── */}
        <div className="relative w-full h-full flex items-center justify-center z-10 px-4">
          {!isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
              <div className="w-12 h-12 rounded-full border-2 border-[#E4572E]/30 border-t-[#E4572E] animate-spin mb-4" />
              <p className="text-zinc-400 text-sm font-medium">Loading 3D Jersey Model...</p>
            </div>
          )}

          <video
            ref={videoRef}
            src={src}
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={handleVideoLoaded}
            className={`max-w-full max-h-[82vh] w-auto h-auto object-contain transition-opacity duration-500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          />

          {/* Seamless Bottom Vignette */}
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#0F0F12] to-transparent pointer-events-none" />
        </div>

        {/* ── BOTTOM SCROLL INSTRUCTION ─────────────────────── */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 z-20">
          <p className="text-zinc-400 text-[11px] font-bold tracking-widest uppercase">
            Scroll to rotate & inspect jersey in 3D
          </p>
          <div className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center pt-1.5">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-2 bg-[#E4572E] rounded-full"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
