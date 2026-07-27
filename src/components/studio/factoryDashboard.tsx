import { useState } from "react";
import { 
  Building2, Package, Play, CheckCircle2, Truck, IndianRupee, Wallet, 
  Plus, ArrowRight, Clock, AlertTriangle, Sparkles, Sliders, RefreshCcw, Eye
} from "lucide-react";

interface FactoryDashboardProps {
  onNavigateTab: (tab: string) => void;
  walletBalance?: number;
}

export function FactoryDashboard({ onNavigateTab, walletBalance = 2450 }: FactoryDashboardProps) {
  const statCards = [
    { title: "Total Active Orders", value: "18 Orders", sub: "4 Needs Approval", color: "text-amber-400 border-amber-500/30 bg-amber-500/10", icon: Package },
    { title: "Plotter Printing Running", value: "7 Orders", sub: "Roll Plotters Active", color: "text-blue-400 border-blue-500/30 bg-blue-500/10", icon: Play },
    { title: "Ready to Dispatch Today", value: "6 Orders", sub: "Courier Scheduled", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", icon: Truck },
    { title: "Today's Revenue Collected", value: "₹38,600", sub: "14 Orders Settled", color: "text-purple-400 border-purple-500/30 bg-purple-500/10", icon: IndianRupee },
  ];

  const activeOrdersList = [
    {
      id: "ord-1",
      orderNo: "1",
      customerName: "Vakratunda Musical Group",
      deliveryDate: "14-04-26",
      qty: "21 Jerseys",
      rate: "₹320/pc",
      status: "Pending Print",
      statusColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    {
      id: "ord-2",
      orderNo: "2",
      customerName: "National Cricket Academy",
      deliveryDate: "28-04-26",
      qty: "65 Jerseys",
      rate: "₹350/pc",
      status: "Printing Active",
      statusColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    {
      id: "ord-3",
      orderNo: "3",
      customerName: "Delhi Warriors League",
      deliveryDate: "30-04-26",
      qty: "120 Jerseys",
      rate: "₹300/pc",
      status: "Ready for Dispatch",
      statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
  ];

  return (
    <div className="space-y-8 font-sans p-2 md:p-4 text-left">
      {/* Step 1: Top Welcome Header */}
      <div className="bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Building2 size={16} />
          <span>FiveNest Factory Dashboard</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Today's Factory Overview</h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
          Simple 3-step dashboard: Monitor live order counts, create new job dockets, and view active order sheets.
        </p>
      </div>

      {/* Step 1: 4 Key Metric Cards (At a Glance) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl hover:border-cyan-500/30 transition-all shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">{card.title}</span>
                  <div className={`p-2.5 rounded-2xl border ${card.color}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-white">{card.value}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-semibold text-slate-400">
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 2: "What Do You Want To Do?" Action Bar */}
      <div className="rounded-3xl p-6 bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Quick Actions — What do you want to do?</h2>
        
        <div className="grid sm:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigateTab("orders")}
            className="p-5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-left transition-all shadow-lg shadow-purple-500/20 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <Plus size={22} className="group-hover:scale-110 transition-transform" />
              <ArrowRight size={16} className="text-purple-200" />
            </div>
            <div className="font-extrabold text-base">Create New Order Docket</div>
            <div className="text-xs text-purple-200 mt-1">Open job docket form for new customer batch</div>
          </button>

          <button
            onClick={() => onNavigateTab("orders")}
            className="p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <Package size={22} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              <ArrowRight size={16} className="text-slate-400" />
            </div>
            <div className="font-bold text-base">View & Search All Orders</div>
            <div className="text-xs text-slate-400 mt-1">Browse, filter and print job docket sheets</div>
          </button>

          <button
            onClick={() => window.location.href = "/studio"}
            className="p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <Sparkles size={22} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <ArrowRight size={16} className="text-slate-400" />
            </div>
            <div className="font-bold text-base">Open Production Studio</div>
            <div className="text-xs text-slate-400 mt-1">Setup artwork, roster & export 300 DPI plotters</div>
          </button>
        </div>
      </div>

      {/* Step 3: Orders Needing Action Today List */}
      <div className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-black text-white">Active Orders Today</h2>
            <p className="text-xs text-slate-400">Click "View Docket Sheet" to open the job card and print for factory operators.</p>
          </div>

          <button
            onClick={() => onNavigateTab("orders")}
            className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
          >
            View All Dockets <ArrowRight size={14} />
          </button>
        </div>

        <div className="space-y-3 pt-2">
          {activeOrdersList.map((ord) => (
            <div
              key={ord.id}
              onClick={() => onNavigateTab("orders")}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-cyan-400 font-bold text-xs bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                  #{ord.orderNo}
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">{ord.customerName}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">{ord.qty} @ {ord.rate} · Delivery: {ord.deliveryDate}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ord.statusColor}`}>
                  {ord.status}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateTab("orders");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Eye size={14} className="text-cyan-400" />
                  <span>View Docket Sheet</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
