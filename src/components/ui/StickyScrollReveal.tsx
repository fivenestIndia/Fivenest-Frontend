import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface StickyScrollItem {
  title: string;
  description: string;
  icon?: React.ReactNode;
  visual?: React.ReactNode;
}

interface StickyScrollRevealProps {
  content: StickyScrollItem[];
  className?: string;
}

// --- Individual feature row tracked by IntersectionObserver ---
interface FeatureItemProps {
  item: StickyScrollItem;
  index: number;
  isActive: boolean;
  onEnter: (index: number) => void;
}

function FeatureItem({ item, index, isActive, onEnter }: FeatureItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onEnter(index);
        }
      },
      {
        // Fire when item crosses the middle third of the viewport
        rootMargin: '-30% 0px -30% 0px',
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [index, onEnter]);

  return (
    <div
      ref={ref}
      // Each item is ~100vh so there's a proper scroll "beat" per feature
      className="min-h-screen flex items-center py-24"
    >
      <div
        className={`relative pl-6 pr-4 py-6 rounded-xl border transition-all duration-500 ${
          isActive
            ? 'border-orange-500/50 bg-orange-500/5'
            : 'border-zinc-800/60 bg-zinc-900/20'
        }`}
      >
        {/* Left accent bar */}
        <span
          className={`absolute left-0 top-6 bottom-6 w-[3px] rounded-full transition-all duration-500 ${
            isActive
              ? 'bg-gradient-to-b from-orange-400 to-orange-600'
              : 'bg-zinc-700/50'
          }`}
        />

        {/* Icon */}
        {item.icon && (
          <div
            className={`mb-4 w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-500 ${
              isActive
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-zinc-800/60 text-zinc-500'
            }`}
          >
            {item.icon}
          </div>
        )}

        {/* Title */}
        <h3
          className={`text-xl font-semibold mb-3 transition-colors duration-500 ${
            isActive ? 'text-orange-400' : 'text-zinc-300'
          }`}
        >
          {item.title}
        </h3>

        {/* Description */}
        <p
          className={`text-sm leading-relaxed transition-colors duration-500 ${
            isActive ? 'text-zinc-300' : 'text-zinc-500'
          }`}
        >
          {item.description}
        </p>

        {/* Mobile-only inline visual (hidden on lg where sticky panel takes over) */}
        {item.visual && (
          <div className="mt-6 lg:hidden rounded-lg overflow-hidden">{item.visual}</div>
        )}
      </div>
    </div>
  );
}

// --- Main component ---
export function StickyScrollReveal({ content, className = '' }: StickyScrollRevealProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleEnter = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const activeItem = content[activeIndex];

  return (
    <div className={`relative ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">

          {/* LEFT: scrollable feature list */}
          <div className="flex-1 lg:max-w-xl">
            {content.map((item, i) => (
              <FeatureItem
                key={i}
                item={item}
                index={i}
                isActive={activeIndex === i}
                onEnter={handleEnter}
              />
            ))}
          </div>

          {/* RIGHT: sticky visual panel (desktop only) */}
          <div className="hidden lg:block flex-1">
            <div className="sticky top-24 h-[calc(100vh-6rem)] flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* Card shell */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40 aspect-[4/3] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeIndex}
                      initial={{ opacity: 0, y: 16, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -16, scale: 0.97 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="w-full h-full flex flex-col items-center justify-center p-8 gap-6"
                    >
                      {activeItem?.visual ? (
                        <div className="w-full h-full flex items-center justify-center">
                          {activeItem.visual}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4 text-center">
                          {activeItem?.icon && (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                              <span className="scale-[2]">{activeItem.icon}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-lg font-semibold text-white mb-1">
                              {activeItem?.title}
                            </p>
                            <p className="text-sm text-zinc-500 max-w-xs">
                              {activeItem?.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Dot indicators */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  {content.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      aria-label={`Go to feature ${i + 1}`}
                      className={`rounded-full transition-all duration-300 ${
                        i === activeIndex
                          ? 'w-5 h-2 bg-orange-500'
                          : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default StickyScrollReveal;
