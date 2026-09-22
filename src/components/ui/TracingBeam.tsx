import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface TracingBeamProps {
  children: React.ReactNode;
  className?: string;
}

export function TracingBeam({ children, className = '' }: TracingBeamProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  // Spring-smooth the raw scroll value for a fluid feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  // Translate the glowing dot from 0% to ~95% down the rail
  const dotY = useTransform(smoothProgress, [0, 1], ['0%', '95%']);

  // Fade in the line as user starts scrolling
  const lineOpacity = useTransform(smoothProgress, [0, 0.05], [0, 1]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Beam rail — hidden on mobile, visible md+ */}
      <div className="hidden md:block absolute left-0 top-0 bottom-0 w-8 pointer-events-none select-none">
        {/* Static background rail */}
        <motion.div
          style={{ opacity: lineOpacity }}
          className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-700/50 to-transparent"
        />

        {/* Filled progress line (scales from top as user scrolls) */}
        <motion.div
          style={{
            opacity: lineOpacity,
            scaleY: smoothProgress,
            originY: 0,
          }}
          className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-orange-500/80 via-orange-400/60 to-transparent"
        />

        {/* Glowing dot */}
        <motion.div
          style={{ top: dotY }}
          className="absolute left-4 -translate-x-1/2 -translate-y-1/2"
        >
          {/* Outer glow ring */}
          <span className="absolute inset-0 rounded-full bg-orange-500/30 blur-md scale-[2.5]" />
          {/* Inner dot */}
          <span className="relative block w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_0_10px_2px_rgba(249,115,22,0.6)]" />
        </motion.div>
      </div>

      {/* Content — shifted right on md+ to clear the beam */}
      <div className="md:pl-10">{children}</div>
    </div>
  );
}

export default TracingBeam;
