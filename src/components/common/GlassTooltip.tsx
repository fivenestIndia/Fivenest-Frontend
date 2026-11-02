import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipData {
  text: string;
  x: number;
  y: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Format title text by converting shortcuts like (Ctrl+;) or (V) into frosted keycaps
 * and bullet separators (•) into vibrant brand dots.
 */
function renderFormattedContent(text: string) {
  // Check for bullet separator
  const parts = text.split('•');
  return parts.map((part, idx) => {
    // Check for keyboard shortcuts in parentheses e.g. (Ctrl+;) or (V) or (Ctrl+.)
    const shortcutMatch = part.match(/\(([^)]+)\)$/);
    let label = part.trim();
    let shortcut = '';

    if (shortcutMatch) {
      shortcut = shortcutMatch[1];
      label = label.replace(/\s*\([^)]+\)$/, '').trim();
    }

    return (
      <React.Fragment key={idx}>
        {idx > 0 && (
          <span className="inline-block mx-1.5 text-[#E4572E] font-black text-xs select-none">
            •
          </span>
        )}
        <span>{label}</span>
        {shortcut && (
          <kbd
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              marginLeft: '6px',
              padding: '1.5px 6px',
              borderRadius: '5px',
              background: 'rgba(255, 255, 255, 0.14)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              color: '#F8FAFC',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.3px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              verticalAlign: 'baseline',
              lineHeight: '1.2'
            }}
          >
            {shortcut}
          </kbd>
        )}
      </React.Fragment>
    );
  });
}

export default function GlassTooltip() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [visible, setVisible] = useState(false);
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const showTimeoutRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Global listener for pointerover / mouseover
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[title], [data-tooltip], [data-glass-title]') as HTMLElement;
      if (!target || target === activeTargetRef.current) return;

      const rawText = target.getAttribute('title') || target.getAttribute('data-tooltip') || target.getAttribute('data-glass-title');
      if (!rawText || !rawText.trim()) return;

      // Suppress browser native tooltip by swapping to data-glass-title
      if (target.hasAttribute('title')) {
        target.setAttribute('data-glass-title', rawText);
        target.removeAttribute('title');
      }

      activeTargetRef.current = target;
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);

      showTimeoutRef.current = setTimeout(() => {
        if (!activeTargetRef.current) return;
        const rect = activeTargetRef.current.getBoundingClientRect();

        let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';
        let x = rect.left + rect.width / 2;
        let y = rect.top - 8;

        // If inside the CorelDraw / Studio vertical toolbox on the left side
        const isToolbox = activeTargetRef.current.closest('.cd-toolbox') || rect.left < 85;
        if (isToolbox) {
          placement = 'right';
          x = rect.right + 10;
          y = rect.top + rect.height / 2;
        } else if (rect.top < 65) {
          // Near top of viewport: position below
          placement = 'bottom';
          x = rect.left + rect.width / 2;
          y = rect.bottom + 8;
        } else if (rect.right > window.innerWidth - 140) {
          // Near right edge: position left
          placement = 'left';
          x = rect.left - 10;
          y = rect.top + rect.height / 2;
        }

        setTooltip({ text: rawText.trim(), x, y, placement });
        setVisible(true);
      }, 70); // snappy 70ms response
    };

    // Global listener for mouseout
    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement;
      if (activeTargetRef.current) {
        if (!related || !activeTargetRef.current.contains(related)) {
          // Restore title attribute
          if (activeTargetRef.current.hasAttribute('data-glass-title')) {
            activeTargetRef.current.setAttribute('title', activeTargetRef.current.getAttribute('data-glass-title')!);
            activeTargetRef.current.removeAttribute('data-glass-title');
          }
          activeTargetRef.current = null;
          if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
          setVisible(false);
          setTimeout(() => setTooltip(null), 150);
        }
      }
    };

    const handleHideImmediate = () => {
      if (activeTargetRef.current?.hasAttribute('data-glass-title')) {
        activeTargetRef.current.setAttribute('title', activeTargetRef.current.getAttribute('data-glass-title')!);
        activeTargetRef.current.removeAttribute('data-glass-title');
      }
      activeTargetRef.current = null;
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      setVisible(false);
      setTooltip(null);
    };

    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    window.addEventListener('scroll', handleHideImmediate, { passive: true, capture: true });
    document.addEventListener('pointerdown', handleHideImmediate, { passive: true });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('scroll', handleHideImmediate, { capture: true });
      document.removeEventListener('pointerdown', handleHideImmediate);
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      // Final cleanup of any elements left with data-glass-title
      document.querySelectorAll('[data-glass-title]').forEach((el) => {
        el.setAttribute('title', el.getAttribute('data-glass-title')!);
        el.removeAttribute('data-glass-title');
      });
    };
  }, []);

  if (!tooltip || typeof document === 'undefined') return null;

  // Compute transform based on placement
  let transform = 'translate(-50%, -100%)';
  if (tooltip.placement === 'bottom') transform = 'translate(-50%, 0)';
  else if (tooltip.placement === 'right') transform = 'translate(0, -50%)';
  else if (tooltip.placement === 'left') transform = 'translate(-100%, -50%)';

  // Safeguard viewport bounds
  const clampedX = Math.max(12, Math.min(window.innerWidth - 12, tooltip.x));
  const clampedY = Math.max(8, Math.min(window.innerHeight - 8, tooltip.y));

  return createPortal(
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        left: `${clampedX}px`,
        top: `${clampedY}px`,
        transform,
        zIndex: 9999999,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.14s cubic-bezier(0.16, 1, 0.3, 1), transform 0.14s cubic-bezier(0.16, 1, 0.3, 1)',
        // ─── PREMIUM FROSTED GLASS EFFECT ───
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(16px) saturate(190%)',
        WebkitBackdropFilter: 'blur(16px) saturate(190%)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 1px 0 rgba(255, 255, 255, 0.25)',
        borderRadius: '8px',
        color: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        fontSize: '11px',
        fontWeight: 600,
        padding: '6px 12px',
        letterSpacing: '0.2px',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        lineHeight: '1.3'
      }}
    >
      {renderFormattedContent(tooltip.text)}
    </div>,
    document.body
  );
}
