import { useState } from "react";
import { Printer, Download, CheckCircle2, RefreshCcw, FileText, ArrowRight, Play } from "lucide-react";

export function FactoryPrintQueue() {
  const queueItems = [
    {
      id: "q-1",
      customer: "ABC Sports Manufacturers",
      orderNum: "#5412",
      format: "PDF Roll Layout (300 DPI)",
      status: "ready",
      statusText: "Ready to Print ✓",
      panelsCount: "92 Panels",
      fileSize: "142 MB",
    },
    {
      id: "q-2",
      customer: "RR Cricket Club",
      orderNum: "#5413",
      format: "JPEG Continuous Roll (300 DPI)",
      status: "generating",
      statusText: "Generating (45%)",
      panelsCount: "48 Panels",
      fileSize: "85 MB",
    },
    {
      id: "q-3",
      customer: "Delhi Warriors Academy",
      orderNum: "#5414",
      format: "ZIP Batch Package (300 DPI)",
      status: "queued",
      statusText: "Queued in Line",
      panelsCount: "120 Panels",
      fileSize: "Pending",
    },
  ];

  return (
    <div className="space-y-6 font-sans p-2 md:p-4 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Live 300 DPI Print Queue</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">Download manager for plot-ready continuous roll PDF & JPEG packages.</p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold">
          <Printer size={16} />
          <span>Epson & Mimaki RIP Ready</span>
        </div>
      </div>

      {/* Queue Download Manager List */}
      <div className="space-y-4 max-w-5xl mx-auto">
        {queueItems.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                  item.status === "ready"
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : item.status === "generating"
                    ? "bg-purple-500/10 border border-purple-500/30 text-purple-400"
                    : "bg-slate-800 border border-slate-700 text-slate-400"
                }`}
              >
                {item.status === "ready" ? (
                  <CheckCircle2 size={24} />
                ) : item.status === "generating" ? (
                  <RefreshCcw size={24} className="animate-spin" />
                ) : (
                  <Printer size={24} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-400 text-xs bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {item.orderNum}
                  </span>
                  <h3 className="font-bold text-white text-base">{item.customer}</h3>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {item.format} · {item.panelsCount} · {item.fileSize}
                </div>
              </div>
            </div>

            <div>
              {item.status === "ready" ? (
                <button
                  onClick={() => {
                    alert(`Downloading 300 DPI RIP Package for Order ${item.orderNum}`);
                  }}
                  className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Download size={16} />
                  <span>Download 300 DPI File</span>
                </button>
              ) : item.status === "generating" ? (
                <span className="px-4 py-2 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-2">
                  <RefreshCcw size={14} className="animate-spin" />
                  Generating Roll... 45%
                </span>
              ) : (
                <span className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold">
                  Queued in Line
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
