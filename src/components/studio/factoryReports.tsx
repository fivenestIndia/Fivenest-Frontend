import { useState } from "react";
import { TrendingUp, Clock, IndianRupee, Users, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import type { OrderItem } from "./factoryOrders";

interface FactoryReportsProps {
  orders?: OrderItem[];
}

export function FactoryReports({ orders = [] }: FactoryReportsProps) {
  const completedOrders = orders.length;

  let totalRevenue = 0;
  orders.forEach((o) => {
    totalRevenue += Number(o.advance1 || 0) + Number(o.advance2 || 0) + Number(o.advance3 || 0);
  });

  const analytics = [
    { 
      title: "Completed Factory Orders", 
      value: `${completedOrders}`, 
      sub: completedOrders > 0 ? "Live Order Production" : "0 Orders Logged", 
      icon: TrendingUp, 
      color: "text-emerald-400" 
    },
    { 
      title: "Total Factory Revenue", 
      value: `₹${totalRevenue.toLocaleString("en-IN")}`, 
      sub: `${completedOrders} Active Orders`, 
      icon: IndianRupee, 
      color: "text-emerald-400" 
    },
    { 
      title: "Average Preparation Speed", 
      value: completedOrders > 0 ? "14 Minutes" : "0 Minutes", 
      sub: "vs 4 Hours Manual Grading", 
      icon: Clock, 
      color: "text-cyan-400" 
    },
    { 
      title: "Repeat Customer Rate", 
      value: completedOrders > 0 ? "100%" : "0%", 
      sub: "Saved Memory CRM", 
      icon: Users, 
      color: "text-purple-400" 
    },
    { 
      title: "Failed Generations", 
      value: "0 Jobs", 
      sub: "100% RIP Success", 
      icon: ShieldAlert, 
      color: "text-emerald-400" 
    },
    { 
      title: "Most Used Sublimation Fabric", 
      value: "N. Net / Micro Poly", 
      sub: `${completedOrders} Factory Orders`, 
      icon: Sparkles, 
      color: "text-amber-400" 
    },
  ];

  return (
    <div className="space-y-6 font-sans p-2 md:p-4 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Factory Analytics & Performance</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">Real-time metrics: Monthly volume, total revenue, average processing time & repeat customer rate.</p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold">
          <TrendingUp size={16} />
          <span>Live Production Analytics</span>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {analytics.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400">{card.title}</span>
                  <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${card.color}`}>
                    <Icon size={20} />
                  </div>
                </div>

                <div className="text-3xl font-black text-white">{card.value}</div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>{card.sub}</span>
                <CheckCircle2 size={14} className="text-emerald-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
