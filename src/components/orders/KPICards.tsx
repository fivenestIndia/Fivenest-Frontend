import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, IndianRupee, CheckCircle, AlertTriangle, Calendar, AlertOctagon, Factory, Palette, Printer } from 'lucide-react';
import { fmt, BusinessType } from '../../hooks/useOrderStore';

interface KPIStats {
  totalOrders: number;
  totalInvoiced: number;
  received: number;
  outstanding: number;
  thisMonth: number;
  overdue: number;
  mfgRevenue: number;
  dsgRevenue: number;
  prtRevenue: number;
}

interface Props {
  stats: KPIStats;
  mode: 'all' | BusinessType;
}

const CARDS = [
  { key: 'totalOrders',   label: 'Total Transactions', icon: TrendingUp,    color: 'zinc',    isCurrency: false },
  { key: 'totalInvoiced', label: 'Total Invoiced',     icon: IndianRupee,   color: 'blue',    isCurrency: true  },
  { key: 'received',      label: 'Amount Received',    icon: CheckCircle,   color: 'emerald', isCurrency: true  },
  { key: 'outstanding',   label: 'Outstanding',        icon: AlertTriangle, color: 'amber',   isCurrency: true  },
  { key: 'thisMonth',     label: 'This Month',         icon: Calendar,      color: 'violet',  isCurrency: true  },
  { key: 'overdue',       label: 'Overdue',            icon: AlertOctagon,  color: 'red',     isCurrency: true  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; icon: string }> = {
  zinc:    { bg: 'bg-zinc-100',    text: 'text-zinc-600',    icon: 'text-zinc-500' },
  blue:    { bg: 'bg-blue-50',     text: 'text-blue-700',    icon: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50',  text: 'text-emerald-700', icon: 'text-emerald-600' },
  amber:   { bg: 'bg-amber-50',    text: 'text-amber-700',   icon: 'text-amber-600' },
  violet:  { bg: 'bg-violet-50',   text: 'text-violet-700',  icon: 'text-violet-600' },
  red:     { bg: 'bg-red-50',      text: 'text-red-700',     icon: 'text-red-600' },
};

export default function KPICards({ stats, mode }: Props) {
  return (
    <div className="space-y-4">
      {/* Main 6 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {CARDS.map((card, i) => {
          const c = COLOR_MAP[card.color];
          const Icon = card.icon;
          const value = stats[card.key as keyof KPIStats] as number;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="bg-white border border-[#E8E4DE] rounded-2xl p-5 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={c.icon} />
              </div>
              <p className="text-2xl font-black text-[#171717]">
                {card.isCurrency ? fmt(value) : value.toLocaleString()}
              </p>
              <p className={`text-[11px] uppercase tracking-widest font-semibold mt-1 ${c.text}`}>
                {card.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Business breakdown row — only for ALL mode */}
      {mode === 'all' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.4 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Manufacturer', value: stats.mfgRevenue, icon: Factory,  bg: 'bg-orange-50',  border: 'border-orange-100', text: 'text-[#E4572E]'   },
            { label: 'Designer',     value: stats.dsgRevenue, icon: Palette,  bg: 'bg-purple-50',  border: 'border-purple-100', text: 'text-purple-700'  },
            { label: 'Printing',     value: stats.prtRevenue, icon: Printer,  bg: 'bg-blue-50',    border: 'border-blue-100',   text: 'text-blue-700'    },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`${item.bg} border ${item.border} rounded-xl p-4 flex items-center gap-3`}>
                <Icon size={20} className={item.text} />
                <div>
                  <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">{item.label}</p>
                  <p className={`text-lg font-black ${item.text}`}>{fmt(item.value)}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
