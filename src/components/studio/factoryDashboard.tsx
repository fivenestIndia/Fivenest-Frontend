import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building2, Package, Play, CheckCircle2, Truck, IndianRupee, Wallet, 
  Plus, ArrowRight, Clock, AlertTriangle, Sparkles, Sliders, RefreshCcw
} from "lucide-react";

interface FactoryDashboardProps {
  onNavigateTab: (tab: string) => void;
  walletBalance?: number;
}

export function FactoryDashboard({ onNavigateTab, walletBalance = 2450 }: FactoryDashboardProps) {
  const statCards = [
    { title: "Pending Orders", value: "18", change: "4 Needs Approval", color: "text-amber-400 border-amber-500/30 bg-amber-500/10", icon: Package },
    { title: "Production Running", value: "7", change: "Plotters Active", color: "text-blue-400 border-blue-500/30 bg-blue-500/10", icon: Play },
    { title: "Ready to Print", value: "12", change: "300 DPI Export Ready", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", icon: CheckCircle2 },
    { title: "Dispatch Today", value: "6", change: "Courier Scheduled", color: "text-purple-400 border-purple-500/30 bg-purple-500/10", icon: Truck },
    { title: "Today's Revenue", value: "₹38,600", change: "14 Invoices Settled", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", icon: IndianRupee },
    { title: "Wallet Balance", value: `₹${walletBalance.toLocaleString("en-IN")}`, change: "Pay-As-You-Go Active", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10", icon: Wallet },
  ];

  const liveTimeline = [
    {
      id: "timeline-1",
      customer: "ABC Sports Manufacturers",
      orderNum: "#5412",
      stage: "Printing Sublimation Roll",
      progress: 85,
      status: "info",
      statusText: "Processing (85%)",
      time: "09:00 AM",
      jerseys: "200 Jerseys",
      due: "Due Tomorrow",
    },
    {
      id: "timeline-2",
      customer: "RR Cricket Club",
      orderNum: "#5413",
      stage: "Design Review & Sleeve Check",
      progress: 40,
      status: "warning",
      statusText: "Design Review",
      time: "10:30 AM",
      jerseys: "120 Jerseys",
      due: "Due Jul 28",
    },
    {
      id: "timeline-3",
      customer: "Delhi Warriors Academy",
      orderNum: "#5414",
      stage: "Waiting Customer CSV Approval",
      progress: 15,
      status: "warning",
      statusText: "Waiting Approval",
      time: "11:00 AM",
      jerseys: "300 Jerseys",
      due: "Due Jul 29",
    },
    {
      id: "timeline-4",
      customer: "Apex Football League",
      orderNum: "#5410",
      stage: "300 DPI Export Complete",
      progress: 100,
      status: "success",
      statusText: "Ready to Print",
      time: "08:15 AM",
      jerseys: "150 Jerseys",
      due: "Today",
    },
  ];

  return (
    <div className="space-y-8 font-sans p-2 md:p-4 text-left">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 size={16} />
            <span>FiveNest Factory Operating System</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Today's Factory Overview</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">Live status of factory orders, plotter queues, revenue & bottlenecks.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab("orders")}
            className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>+ New Factory Order</span>
          </button>

          <button
            onClick={() => onNavigateTab("wallet")}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Wallet size={16} className="text-cyan-400" />
            <span>Recharge Wallet</span>
          </button>
        </div>
      </div>

      {/* 6 Top Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-3xl p-5 bg-slate-900/60 border border-slate-800 backdrop-blur-xl hover:border-cyan-500/30 transition-all shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">{card.title}</span>
                  <div className={`p-2 rounded-xl border ${card.color}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">{card.value}</div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-semibold text-slate-400 flex items-center justify-between">
                <span>{card.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Layout: Live Production Timeline & Bottlenecks */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Today's Live Production Timeline */}
        <div className="lg:col-span-8 space-y-4 rounded-3xl bg-slate-900/60 border border-slate-800 p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-cyan-400" />
              <h2 className="text-lg font-black text-white">Today's Live Production Timeline</h2>
            </div>
            <button
              onClick={() => onNavigateTab("orders")}
              className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
            >
              View All Orders <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-4 pt-2">
            {liveTimeline.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigateTab("orders")}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-400">{item.time}</span>
                    <span className="font-black text-white text-sm">{item.customer}</span>
                    <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{item.orderNum}</span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      item.status === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : item.status === "info"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {item.statusText}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Stage: {item.stage}</span>
                  <span>{item.jerseys} · <strong className="text-slate-300">{item.due}</strong></span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${item.progress}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.status === "success"
                        ? "bg-emerald-400"
                        : item.status === "info"
                        ? "bg-blue-500"
                        : "bg-amber-400"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Factory Shortcuts & AI Assistant Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Production Assistant Panel */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-purple-500/30 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={16} />
              <span>AI Factory Assistant</span>
            </div>
            <h3 className="text-lg font-black text-white">AI Production Insight</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Order #5412 (ABC Sports) has 200 panels ready. Plotter Roll #3 capacity is at 94%. Recommended: Export now to avoid cutting delays.
            </p>

            <button
              onClick={() => onNavigateTab("printQueue")}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
            >
              <span>Export Order #5412 to Plotter</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Quick Factory Navigation Shortcuts */}
          <div className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-white mb-3">Quick Factory Modules</h3>

            <button
              onClick={() => onNavigateTab("production")}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-between transition-all"
            >
              <span>⚙️ Factory Bottlenecks Tracker</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => onNavigateTab("printQueue")}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-between transition-all"
            >
              <span>🖨️ Live 300 DPI Print Queue</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => onNavigateTab("customers")}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-between transition-all"
            >
              <span>👥 Customer Memory CRM</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
