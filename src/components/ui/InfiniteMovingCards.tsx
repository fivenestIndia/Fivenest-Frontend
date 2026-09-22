import React, { useEffect, useState, useRef } from 'react';
import { cn } from '../../lib/utils';

interface Item {
  name: string;
  role: string;
  quote: string;
}

export function InfiniteMovingCards({
  items,
  direction = 'left',
  speed = 'normal',
  pauseOnHover = true,
  className,
}: {
  items: Item[];
  direction?: 'left' | 'right';
  speed?: 'fast' | 'normal' | 'slow';
  pauseOnHover?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);
      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });
      setStart(true);
    }
  }, []);

  const getSpeed = () => {
    if (speed === 'fast') return '20s';
    if (speed === 'normal') return '35s';
    return '50s';
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden",
        pauseOnHover && "hover:[&_ul]:[animation-play-state:paused]",
        className
      )}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)'
      }}
    >
      <style>
        {`
          @keyframes marqueeScroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .animate-scroll {
            animation: marqueeScroll var(--animation-duration) linear infinite;
          }
          .animate-scroll.right {
            animation-direction: reverse;
          }
        `}
      </style>
      <ul
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap",
          start && "animate-scroll",
          direction === 'right' && "right"
        )}
        style={{
          "--animation-duration": getSpeed(),
        } as React.CSSProperties}
      >
        {items.map((item, idx) => (
          <li
            key={idx}
            className="w-[350px] max-w-full relative rounded-2xl border border-white/10 flex-shrink-0 border-slate-700 px-8 py-6 bg-slate-900/50 backdrop-blur-sm"
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
              ></div>
              <span className="relative z-20 text-sm leading-[1.6] text-gray-300 font-normal">
                "{item.quote}"
              </span>
              <div className="relative z-20 mt-6 flex flex-row items-center">
                <span className="flex flex-col gap-1">
                  <span className="text-sm leading-[1.6] text-white font-semibold">
                    {item.name}
                  </span>
                  <span className="text-sm leading-[1.6] text-gray-400 font-normal">
                    {item.role}
                  </span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
}
