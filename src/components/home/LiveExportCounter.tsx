import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Sparkles, 
  CheckCircle, 
  Zap, 
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Printer,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  calculateAdminExportCounts, 
  getCachedExportStats, 
  TRACKER_START_DATE, 
  type ExportTrackerStats 
} from '../../lib/exportTrackerService';
import { supabase } from '../../lib/supabaseClient';

export default function LiveExportCounter() {
  const [stats, setStats] = useState<ExportTrackerStats>(() => getCachedExportStats());
  const [displayTotal, setDisplayTotal] = useState<number>(() => stats.totalExportJerseys || stats.totalExportFiles);
  const [displayToday, setDisplayToday] = useState<number>(() => stats.todayExportJerseys || stats.todayExportFiles);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [lastPingTime, setLastPingTime] = useState<string>('Just now');
  const animRef = useRef<number | null>(null);

  // 1. Initial fetch from admin & Supabase sources
  const refreshStats = async () => {
    setIsUpdating(true);
    try {
      const live = await calculateAdminExportCounts();
      setStats(live);
      setLastPingTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn("Live export refresh warning:", e);
    } finally {
      setTimeout(() => setIsUpdating(false), 600);
    }
  };

  useEffect(() => {
    refreshStats();

    // 2. Poll every 15 seconds for new exports from factories
    const interval = setInterval(refreshStats, 15000);

    // 3. Listen to local and cross-tab export events
    const handleLocalUpdate = (e: any) => {
      if (e?.detail) {
        setStats(e.detail);
        setLastPingTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    };
    window.addEventListener('fivenest_export_count_updated', handleLocalUpdate);

    // 4. Supabase Realtime channel subscription (if available)
    let channel: any = null;
    try {
      channel = supabase
        .channel('fivenest_live_exports')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'plugin_usage_logs' }, () => {
          refreshStats();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'credit_transactions' }, () => {
          refreshStats();
        })
        .subscribe();
    } catch (err) {
      // Non-blocking fallback to interval
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('fivenest_export_count_updated', handleLocalUpdate);
      if (channel) {
        try { supabase.removeChannel(channel); } catch (e) {}
      }
    };
  }, []);

  // 5. Smooth numerical counting ticker animation
  useEffect(() => {
    const targetTotal = stats.totalExportJerseys || stats.totalExportFiles;
    const targetToday = stats.todayExportJerseys || stats.todayExportFiles;
    
    const startTotal = displayTotal;
    const startToday = displayToday;
    const startTime = performance.now();
    const duration = 1200; // ms

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      setDisplayTotal(Math.round(startTotal + (targetTotal - startTotal) * ease));
      setDisplayToday(Math.round(startToday + (targetToday - startToday) * ease));

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      }
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [stats.totalExportJerseys, stats.todayExportJerseys]);

  return (
    <section className="relative bg-[#0C101C] text-white py-16 px-6 overflow-hidden border-t border-b border-white/10 selection:bg-[#E4572E] selection:text-white">
      {/* Background radial glows and cyber mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(228,87,46,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#E4572E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Top Header Pill with Live Pulsing Radar Beacon */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"></span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                LIVE PRODUCTION MONITOR
              </span>
              <span className="text-white/30">•</span>
              <span className="text-xs font-bold text-gray-400">
                FiveNest Factory Export Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
            <span className="hidden md:inline">Started tracking from today:</span>
            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-orange-300 font-bold">
              {TRACKER_START_DATE}
            </span>
            <button
              onClick={refreshStats}
              title="Click to refresh live count"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all border border-white/10 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={isUpdating ? 'animate-spin text-[#E4572E]' : ''} />
              <span className="hidden sm:inline text-[11px] font-mono">Ping: {lastPingTime}</span>
            </button>
          </div>
        </div>

        {/* Hero Live Counter Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Counter Left Box */}
          <div className="lg:col-span-7 bg-gradient-to-br from-white/[0.06] to-white/[0.01] border border-white/15 rounded-3xl p-8 sm:p-10 relative overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E4572E]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#E4572E]/20 text-[#E4572E] flex items-center justify-center font-black">
                <Download size={18} />
              </div>
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#E4572E]">
                TOTAL EXPORT FROM FIVENEST
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
              Real-Time Production Output
            </h3>

            {/* Giant Live Number (Jerseys Count) */}
            <div className="my-6">
              <div className="flex items-baseline gap-4 flex-wrap">
                <span className="font-mono text-6xl sm:text-7xl md:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-[#E4572E] drop-shadow-sm">
                  {displayTotal.toLocaleString()}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE COUNT
                  </span>
                  <span className="text-xs text-gray-400 mt-1 font-bold">
                    Jerseys Exported
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed max-w-xl mb-6">
              Every custom sublimation jersey processed and exported by sports apparel factories and designers using FiveNest Studio is tracked and counted live here starting from today.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
              <Link
                to="/production"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#E4572E] to-[#EA580C] text-white text-sm font-black shadow-lg hover:brightness-110 transition-all flex items-center gap-2 group cursor-pointer"
              >
                <span>Export Your Jerseys Now</span>
                <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Metrics Grid */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Metric 1: Today's Jerseys */}
            <div className="bg-[#121829] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Exported Today
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                +{displayToday.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-2 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Jerseys exported today</span>
              </div>
            </div>

            {/* Metric 2: Today's Export Batches */}
            <div className="bg-[#121829] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-[#E4572E]/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Export Batches
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#E4572E]/15 text-[#E4572E] flex items-center justify-center">
                  <Printer size={16} />
                </div>
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-black text-white tracking-tight">
                {stats.todayExportJobs}
              </div>
              <div className="text-xs text-gray-400 mt-2 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E4572E]" />
                <span>Factory batches today</span>
              </div>
            </div>

            {/* Metric 3: Realtime Engine Speed */}
            <div className="bg-[#121829] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Rendering Speed
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Zap size={16} />
                </div>
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                &lt; 1.8s
              </div>
              <div className="text-xs text-gray-400 mt-2 flex items-center gap-1.5 font-medium">
                <span>Per full jersey kit</span>
              </div>
            </div>

            {/* Metric 4: Print Accuracy & Compatibility (Replaced Admin Sync) */}
            <div className="bg-[#121829] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Print Accuracy
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-purple-300 tracking-tight flex items-center gap-2">
                <span>100%</span>
                <span className="text-xs font-bold text-gray-400 font-sans">Precision</span>
              </div>
              <div className="text-xs text-gray-400 mt-2 flex items-center gap-1.5 font-medium">
                <Sparkles size={13} className="text-purple-400" />
                <span>Corel & Illustrator Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Factory Footnote */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Active sublimation jersey processing and automatic ZIP export across all connected sportswear factories</span>
          </div>
          <div className="font-mono text-[11px] text-gray-500">
            FIVENEST-CORE-LIVE-V2 • AUTOMATIC REAL-TIME ENGINE
          </div>
        </div>
      </div>
    </section>
  );
}
