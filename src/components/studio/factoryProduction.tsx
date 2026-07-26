import { useState } from "react";
import { Printer, Scissors, Shirt, PackageCheck, AlertCircle, CheckCircle2, Play } from "lucide-react";

export function FactoryProduction() {
  const productionStages = [
    {
      stage: "1. Sublimation Roll Printing",
      icon: Printer,
      progress: 55,
      status: "Active on Roll Plotter #2",
      color: "bg-blue-500",
      textColor: "text-blue-400",
      details: "200 Panels @ 300 DPI · Roll width 60\"",
    },
    {
      stage: "2. Laser Fabric Cutting",
      icon: Scissors,
      progress: 100,
      status: "Completed (100%)",
      color: "bg-emerald-400",
      textColor: "text-emerald-400",
      details: "All 200 panels laser cut & size tagged",
    },
    {
      stage: "3. Stitching & Collar Sewing",
      icon: Shirt,
      progress: 30,
      status: "In Progress (Bottleneck Warning)",
      color: "bg-amber-400",
      textColor: "text-amber-400",
      details: "Line #3 active · 60/200 Jerseys stitched",
    },
    {
      stage: "4. Quality Check & Packing",
      icon: PackageCheck,
      progress: 20,
      status: "Queued for Packing",
      color: "bg-purple-400",
      textColor: "text-purple-400",
      details: "40 Jerseys packed in polybags",
    },
  ];

  return (
    <div className="space-y-6 font-sans p-2 md:p-4 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Factory Floor Bottleneck Tracker</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">Live stage progress bars: Printing, Laser Cutting, Stitching Line & Packing.</p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
          <CheckCircle2 size={16} />
          <span>4 Active Lines Running</span>
        </div>
      </div>

      {/* Production Stages Grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {productionStages.map((stg) => {
          const Icon = stg.icon;
          return (
            <div
              key={stg.stage}
              className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{stg.stage}</h3>
                    <span className={`text-xs font-bold ${stg.textColor}`}>{stg.status}</span>
                  </div>
                </div>

                <span className="text-xl font-black text-white">{stg.progress}%</span>
              </div>

              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  style={{ width: `${stg.progress}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${stg.color}`}
                />
              </div>

              <div className="text-xs text-slate-400 font-medium pt-1 border-t border-slate-800/80">
                {stg.details}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
