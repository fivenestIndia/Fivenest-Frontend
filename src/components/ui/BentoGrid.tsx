import React from 'react';
import { cn } from '../../lib/utils';
import { motion, useInView } from 'framer-motion';

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto", className)}>
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title: string;
  description: string;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "row-span-1 rounded-2xl border border-white/10 bg-slate-900 p-6 flex flex-col space-y-4 hover:border-orange-500/50 transition-colors duration-200 group",
        className
      )}
    >
      {header && <div className="w-full flex-1 min-h-[100px] rounded-xl overflow-hidden">{header}</div>}
      <div className="group-hover:translate-x-2 transition duration-200">
        {icon && <div className="mb-2 text-orange-500">{icon}</div>}
        <h3 className="font-bold text-white mb-2 mt-2">{title}</h3>
        <p className="font-normal text-gray-400 text-sm">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
