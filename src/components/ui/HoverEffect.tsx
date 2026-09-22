import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface Item {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function HoverEffect({ items, className }: { items: Item[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {items.map((item, idx) => (
        <Card key={idx} item={item} />
      ))}
    </div>
  );
}

function Card({ item }: { item: Item }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      className="relative rounded-2xl border border-white/10 bg-slate-900 overflow-hidden h-full p-6 flex flex-col group"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {isHovering && (
        <div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(249,115,22,0.15), transparent 80%)`,
          }}
        />
      )}
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-4 text-orange-500">{item.icon}</div>
        <h3 className="font-bold text-lg text-white mb-2">{item.title}</h3>
        <p className="text-gray-400 text-sm flex-grow">{item.description}</p>
      </div>
    </div>
  );
}
