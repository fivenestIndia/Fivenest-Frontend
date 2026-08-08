import { useState } from "react";
import { 
  Building2, Package, Play, CheckCircle2, Truck, IndianRupee, Wallet, 
  Plus, ArrowRight, Clock, AlertTriangle, Sparkles, Sliders, RefreshCcw, Eye, FolderOpen,
  Printer, Scissors, TrendingUp, TrendingDown
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
  
  orderScope?: 'full-manufacturing' | 'printing-only';
  designCost?: number;

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
  currentUser?: { email: string; name: string; balance: number } | null;
}

export function FactoryDashboard({ 
  onNavigateTab, 
  walletBalance = 2450, 
  orders = [],
  onRequestNewOrder,
  currentUser
}: FactoryDashboardProps) {

  // Dynamic calculations from real user orders
  const totalActiveOrders = orders.length;
  const manufacturingCount = orders.filter((o) => o.orderScope !== "printing-only").length;
  const printingOnlyCount = orders.filter((o) => o.orderScope === "printing-only").length;

  const printingRunning = orders.filter((o) => o.statusPrint === "Done" && o.statusStitch === "Pending").length;
  const readyToDispatch = orders.filter((o) => o.statusStitch === "Done").length;
  
  let totalRevenue = 0;
  let totalDesignCost = 0;

  // Calculate Web Studio 300 DPI RIP Plotter Package Export Debits (scoped + deduplicated + respects deletes)
  try {
    const userEmail = (currentUser?.email || 'guest').toLowerCase().trim();
    const keysToCheck = [
      `fivenest_studio_export_billing_${userEmail}`,
      `fivenest_studio_export_billing_all`,
      `fivenest_studio_export_billing_guest`
    ];

    const deletedKey = `fivenest_billing_deleted_ids_${userEmail}`;
    let deletedIds: Set<string> = new Set();
    try {
      const deletedStr = localStorage.getItem(deletedKey);
      if (deletedStr) deletedIds = new Set(JSON.parse(deletedStr));
    } catch (e) {}

    const seen = new Set<string>();
    keysToCheck.forEach(k => {
      const str = localStorage.getItem(k);
      if (str) {
        try {
          const list: any[] = JSON.parse(str);
          list.forEach((item) => {
            if (item?.id && !seen.has(item.id) && !deletedIds.has(item.id)) {
              seen.add(item.id);
              totalDesignCost += Number(item.designCharges || 0);
            }
          });
        } catch (e) {}
      }
    });
  } catch (e) {}

  orders.forEach((o) => {
    let totalQty = 0;
    o.sizeGrid.forEach((row) => {
      totalQty += Number(row.halfQty || 0) + Number(row.fullQty || 0);
    });

    const isPrintOnly = o.orderScope === "printing-only";
    const advanceReceived = Number(o.advance1 || 0) + Number(o.advance2 || 0) + Number(o.advance3 || 0);
    const designDebit = o.designCost !== undefined ? o.designCost : (isPrintOnly ? totalQty * 3 : 0);

    totalRevenue += advanceReceived;
    totalDesignCost += designDebit;
  });

  const netOverallBudget = totalRevenue - totalDesignCost;

  const statCards = [
    { 
      title: "Total Revenue Received", 
      value: `+₹${totalRevenue.toLocaleString("en-IN")}`, 
      sub: `${totalActiveOrders} Total Orders (Client Payments)`, 
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", 
      icon: TrendingUp 
    },
    { 
      title: "Software Design Export Cost", 
      value: `-₹${totalDesignCost.toLocaleString("en-IN")}`, 
      sub: `RIP Plotter Debits (${totalDesignCost > 0 ? '₹3/pc panels' : '0 debits'})`, 
      color: "text-rose-400 border-rose-500/30 bg-rose-500/10", 
      icon: TrendingDown 
    },
    { 
      title: "Actual Net Factory Balance", 
      value: `₹${netOverallBudget.toLocaleString("en-IN")}`, 
      sub: netOverallBudget >= 0 ? "Actual Net Profit" : "Budget Allocation Needed", 
      color: "text-purple-400 border-purple-500/30 bg-purple-500/10", 
      icon: Wallet 
    },
    { 
      title: "Order Scope Breakdown", 
      value: `${totalActiveOrders} Dockets`, 
      sub: `${manufacturingCount} Full Mfg · ${printingOnlyCount} Print Only`, 
      color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10", 
      icon: Package 
    },
  ];

  return (
    <div className="space-y-8 font-sans p-2 md:p-4 text-left">
      {/* Step 1: Top Welcome Header */}
      <div className="bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Building2 size={16} />
          <span>FiveNest Dual Scope Factory Dashboard</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Overall Factory Financial Budget</h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
          Tracks client revenue vs 300 DPI design production costs (minus balance debits) to calculate your net factory profit.
        </p>
      </div>

      {/* Step 1: 4 Key Metric Cards (Dynamic Financial & Scope Breakdown) */}
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
            <div className="text-xs text-purple-200 mt-1">Full Manufacturing or Print-Only batch</div>
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

      {/* Step 3: Orders Needing Action Today List (Dynamic render with Scope Badges) */}
      <div className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-black text-white">Active Orders & Production Costs</h2>
            <p className="text-xs text-slate-400">Shows order scope, client rate, and design production cost debits.</p>
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
          /* DYNAMIC LIST OF ACTIVE ORDERS WITH SCOPE BADGES & DESIGN DEBIT COSTS */
          <div className="space-y-3 pt-2">
            {orders.map((ord) => {
              let totalQty = 0;
              ord.sizeGrid.forEach((row) => {
                totalQty += Number(row.halfQty || 0) + Number(row.fullQty || 0);
              });

              const isPrintOnly = ord.orderScope === "printing-only";
              const orderDesignCost = ord.designCost !== undefined ? ord.designCost : (isPrintOnly ? totalQty * 3 : 0);
              const clientAdvance = Number(ord.advance1 || 0) + Number(ord.advance2 || 0) + Number(ord.advance3 || 0);

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
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">{ord.customerName}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          isPrintOnly
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        }`}>
                          {isPrintOnly ? "🖨️ Print Only" : "🏭 Full Mfg"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {totalQty} Jerseys @ ₹{ord.ratePerPiece}/pc · Delivery: {ord.deliveryDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs">
                      {clientAdvance > 0 && (
                        <div className="text-emerald-400 font-bold">+₹{clientAdvance.toLocaleString("en-IN")} <span className="text-[10px] text-slate-400 font-normal">(Client Payment)</span></div>
                      )}
                      {orderDesignCost > 0 && (
                        <div className="text-rose-400 font-bold">-₹{orderDesignCost.toLocaleString("en-IN")} <span className="text-[10px] text-slate-400 font-normal">(Export Cost)</span></div>
                      )}
                    </div>

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
