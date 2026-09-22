import React from 'react';
import { cn } from '../../lib/utils';

interface BackgroundBeamsProps {
  className?: string;
}

export function BackgroundBeams({ className }: BackgroundBeamsProps) {
  const beams = [
    { left: '5%', duration: 15, delay: 0, opacity: 0.5 },
    { left: '15%', duration: 12, delay: 2, opacity: 0.6 },
    { left: '25%', duration: 18, delay: 5, opacity: 0.4 },
    { left: '35%', duration: 10, delay: 1, opacity: 0.7 },
    { left: '45%', duration: 20, delay: 4, opacity: 0.3 },
    { left: '55%', duration: 14, delay: 7, opacity: 0.5 },
    { left: '65%', duration: 16, delay: 3, opacity: 0.8 },
    { left: '75%', duration: 11, delay: 8, opacity: 0.6 },
    { left: '85%', duration: 19, delay: 6, opacity: 0.4 },
    { left: '95%', duration: 13, delay: 9, opacity: 0.5 },
    { left: '50%', duration: 17, delay: 2, opacity: 0.7 },
    { left: '20%', duration: 9, delay: 10, opacity: 0.5 },
  ];

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <style>
        {`
          @keyframes beamFall {
            from { transform: translateY(-200px); }
            to { transform: translateY(calc(100vh + 200px)); }
          }
        `}
      </style>
      {beams.map((beam, i) => (
        <div
          key={i}
          className="absolute top-[-200px]"
          style={{
            left: beam.left,
            width: '1px',
            height: '200px',
            background: 'linear-gradient(to bottom, transparent, rgba(249,115,22,0.8), transparent)',
            opacity: beam.opacity,
            animation: `beamFall ${beam.duration}s linear ${beam.delay}s infinite`
          }}
        />
      ))}
    </div>
  );
}
