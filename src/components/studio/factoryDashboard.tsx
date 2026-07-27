import { useState } from "react";
import { 
  Building2, Package, Play, CheckCircle2, Truck, IndianRupee, Wallet, 
  Plus, ArrowRight, Clock, AlertTriangle, Sparkles, Sliders, RefreshCcw, Eye, FolderOpen
} from "lucide-react";

export interface SizeQtyRow {
  size: string;
  halfQty: number;
  fullQty: number;
}

export interface OrderItem {
  id: string;
  orderNo: string;
  customerName: string;
  deliveryDate: string;
  ratePerPiece: number;
  
  fabricType: string;
  printDetails: string;
  collarType: string;
  collarColor: string;
  handColor: string;
  handStripePiping: string;

  statusDesign: "Done" | "Pending";
  statusFabric: "Done" | "Pending";
  statusPrint: "Done" | "Pending";
  statusStitch: "Done" | "Pending";

  sizeGrid: SizeQtyRow[];

  advance1: number;
  advance2: number;
  advance3: number;
}

interface FactoryDashboardProps {
  onNavigateTab: (tab: string) => void;
  walletBalance?: number;
  orders?: OrderItem[];
  onRequestNewOrder?: () => void;
}

export function FactoryDashboard({ 
  onNavigateTab, 
  walletBalance = 2450, 
  orders = [],
  onRequestNewOrder
}: FactoryDashboardProps) {

  // Dynamic calculations from real user orders
  const totalActiveOrders = orders.length;
  const printingRunning = orders.filter((o) => o.statusPrint === "Done" && o.statusStitch === "Pending").length;
  const readyToDispatch = orders.filter((o) => o.statusStitch === "Done").length;
  
  let todayRevenue = 0;
  orders.forEach((o) => {
    todayRevenue += Number(o.advance1 || 0) + Number(o.advance2 || 0) + Number(o.advance3 || 0);
  });

  const statCards = [
    { 
      title: "Total Active Orders", 
      value: `${totalActiveOrders} Orders`, 
      sub: totalActiveOrders > 0 ? `${orders.filter(o => o.statusDesign === 'Pending').length} Needs Approval` : "No Orders Pending", 
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10", 
      icon: Package 
    },
    { 
      title: "Plotter Printing Running", 
      value: `${printingRunning} Orders`, 
      sub: printingRunning > 0 ? "Roll Plotters Active" : "No Active Plotters", 
      color: "text-blue-400 border-blue-500/30 bg-blue-500/10", 
      icon: Play 
    },
    { 
      title: "Ready to Dispatch Today", 
      value: `${readyToDispatch} Orders`, 
      sub: readyToDispatch > 0 ? "Courier Scheduled" : "None Pending", 
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", 
      icon: Truck 
    },
    { 
      title: "Today's Revenue Collected", 
      value: `₹${todayRevenue.toLocaleString("en-IN")}`, 
      sub: `${orders.length} Orders Logged`, 
      color: "text-purple-400 border-purple-500/30 bg-purple-500/10", 
      icon: IndianRupee 
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
          Live dynamic overview: Monitor active order counts, create new job dockets, and view order sheets.
        </p>
      </div>

      {/* Step 1: 4 Key Metric Cards (Dynamically calculated from real orders) */}
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
            onClick={() => {
              onNavigateTab("orders");
              if (onRequestNewOrder) onRequestNewOrder();
            }}
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

      {/* Step 3: Orders Needing Action Today List (Dynamic render) */}
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

        {orders.length === 0 ? (
          /* CLEAN EMPTY STATE WHEN 0 ORDERS EXIST */
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
              <FolderOpen size={24} />
            </div>
            <div className="font-bold text-white text-sm">No Active Order Dockets Found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are currently 0 order dockets saved in your hub. Click "+ Create New Order Docket" to create your first order.
            </p>
            <button
              onClick={() => {
                onNavigateTab("orders");
                if (onRequestNewOrder) onRequestNewOrder();
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>+ Create First Order Docket</span>
            </button>
          </div>
        ) : (
          /* DYNAMIC LIST OF ACTIVE ORDERS */
          <div className="space-y-3 pt-2">
            {orders.map((ord) => {
              let totalQty = 0;
              ord.sizeGrid.forEach((row) => {
                totalQty += Number(row.halfQty || 0) + Number(row.fullQty || 0);
              });

              return (
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
                      <div className="text-xs text-slate-400 mt-0.5">{totalQty} Jerseys @ ₹{ord.ratePerPiece}/pc · Delivery: {ord.deliveryDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      ord.statusPrint === "Done" && ord.statusStitch === "Done"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : ord.statusPrint === "Done"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}>
                      {ord.statusPrint === "Done" && ord.statusStitch === "Done" ? "Ready for Dispatch" : ord.statusPrint === "Done" ? "Printing Active" : "Pending Print"}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
