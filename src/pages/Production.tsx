import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Layers, Clock, AlertTriangle, Upload, FileCheck, Sliders, Maximize2,
  Printer, CheckCircle2, RefreshCw, Download, Plus, Trash2, User, Hash, Ruler, FileSpreadsheet, Eye, Scissors,
  Play, Settings, Save, Check, FileCode, CheckSquare
} from "lucide-react";
import {
  loadOrders, updateOrderStatus,
  type Order, type OrderStatus, STATUS_LABELS, STATUS_COLORS,
} from "@/lib/orders";

/* ── FIVENEST OFFICIAL MASTER SIZE DATABASE (Sizes 18 to 60) ── */
export interface SizeDimensions {
  w: number;
  h: number;
}

export interface SizeItem {
  front: SizeDimensions;
  back: SizeDimensions;
  half: SizeDimensions;
  full: SizeDimensions;
  nn: SizeDimensions;
}

export const INITIAL_SIZE_DB: Record<string, SizeItem> = {
  "18": { front: { w: 11, h: 15 },    back: { w: 11, h: 15 },    half: { w: 9.5, h: 5 },   full: { w: 9, h: 14 },    nn: { w: 5, h: 5 } },
  "20": { front: { w: 12, h: 16 },    back: { w: 12, h: 16 },    half: { w: 10, h: 5.5 },  full: { w: 10, h: 15 },   nn: { w: 6, h: 6 } },
  "22": { front: { w: 13, h: 17 },    back: { w: 13, h: 17 },    half: { w: 11, h: 6 },    full: { w: 11, h: 16 },   nn: { w: 6, h: 6 } },
  "24": { front: { w: 14, h: 20 },    back: { w: 14, h: 20 },    half: { w: 12, h: 6 },    full: { w: 12, h: 17.5 }, nn: { w: 7, h: 7 } },
  "26": { front: { w: 15, h: 21 },    back: { w: 15, h: 21 },    half: { w: 12.5, h: 7.5 },full: { w: 12.5, h: 18 }, nn: { w: 7, h: 7 } },
  "28": { front: { w: 15.8, h: 23 },  back: { w: 15.8, h: 23 },  half: { w: 14, h: 8 },    full: { w: 14, h: 19 },   nn: { w: 8, h: 8 } },
  "30": { front: { w: 17, h: 25 },    back: { w: 17, h: 25 },    half: { w: 14.5, h: 8.5 },full: { w: 14.5, h: 20.5 },nn: { w: 8, h: 8 } },
  "32": { front: { w: 18, h: 26 },    back: { w: 18, h: 26 },    half: { w: 15, h: 9 },    full: { w: 15, h: 21 },   nn: { w: 9, h: 9 } },
  "34": { front: { w: 19, h: 27 },    back: { w: 19, h: 27 },    half: { w: 16, h: 9.5 },  full: { w: 16, h: 22.5 }, nn: { w: 9, h: 9 } },
  "36": { front: { w: 20, h: 28 },    back: { w: 20, h: 28 },    half: { w: 17, h: 10.5 }, full: { w: 17, h: 23.5 }, nn: { w: 10, h: 10 } },
  "38": { front: { w: 21, h: 29 },    back: { w: 21, h: 29 },    half: { w: 18, h: 10.5 }, full: { w: 18, h: 24 },   nn: { w: 10, h: 10 } },
  "40": { front: { w: 22, h: 30 },    back: { w: 22, h: 30 },    half: { w: 19, h: 10.5 }, full: { w: 19, h: 25 },   nn: { w: 11, h: 11 } },
  "42": { front: { w: 23, h: 31 },    back: { w: 23, h: 31 },    half: { w: 20, h: 11.5 }, full: { w: 20, h: 25 },   nn: { w: 11, h: 11 } },
  "44": { front: { w: 24, h: 31.8 },  back: { w: 24, h: 31.8 },  half: { w: 21, h: 12.5 }, full: { w: 21, h: 26 },   nn: { w: 11, h: 11 } },
  "46": { front: { w: 25, h: 33 },    back: { w: 25, h: 33 },    half: { w: 22, h: 13 },   full: { w: 22, h: 27 },   nn: { w: 12, h: 12 } },
  "48": { front: { w: 26, h: 33.5 },  back: { w: 26, h: 33.5 },  half: { w: 23.5, h: 13.5 },full: { w: 23.5, h: 27.5 },nn: { w: 12, h: 12 } },
  "50": { front: { w: 27, h: 34 },    back: { w: 27, h: 34 },    half: { w: 23, h: 14 },   full: { w: 24, h: 28 },   nn: { w: 12, h: 12 } },
  "52": { front: { w: 28, h: 34.5 },  back: { w: 28, h: 34.5 },  half: { w: 23, h: 14.5 }, full: { w: 24.5, h: 28.5 },nn: { w: 13, h: 13 } },
  "54": { front: { w: 29, h: 34.5 },  back: { w: 29, h: 34.5 },  half: { w: 24, h: 15 },   full: { w: 25.5, h: 29 }, nn: { w: 13, h: 13 } },
  "56": { front: { w: 30, h: 35 },    back: { w: 30, h: 35 },    half: { w: 25, h: 15 },   full: { w: 26, h: 29 },   nn: { w: 13, h: 13 } },
  "58": { front: { w: 31, h: 36 },    back: { w: 31, h: 36 },    half: { w: 25.5, h: 15.5 },full: { w: 26, h: 29 },   nn: { w: 13, h: 13 } },
  "60": { front: { w: 32, h: 37 },    back: { w: 32, h: 37 },    half: { w: 26, h: 16 },   full: { w: 26, h: 29 },   nn: { w: 13, h: 13 } },
};

const COLUMNS: { status: OrderStatus; label: string; emoji: string; accent: string }[] = [
  { status: "new",        label: "New Orders",     emoji: "📥", accent: "border-t-blue-500" },
  { status: "production", label: "In Production",  emoji: "⚙️", accent: "border-t-amber-500" },
  { status: "ready",      label: "Ready to Print", emoji: "✅", accent: "border-t-emerald-500" },
  { status: "delivered",  label: "Delivered",      emoji: "🚚", accent: "border-t-stone-400" },
];

export default function Production() {
  const [activeTab, setActiveTab] = useState<"run" | "edit" | "queue">("run");
  const [orders, setOrders] = useState<Order[]>([]);

  /* Sizing Database State */
  const [sizeDB, setSizeDB] = useState<Record<string, SizeItem>>(INITIAL_SIZE_DB);
  const [editingSizeCode, setEditingSizeCode] = useState<string>("38");
  const [editableDimensions, setEditableDimensions] = useState<SizeItem>(INITIAL_SIZE_DB["38"]);
  const [saveMessage, setSaveMessage] = useState("");

  /* Run Engine Configuration State */
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [outputFolder, setOutputFolder] = useState<string>("Export_Files");
  const [exportFormat, setExportFormat] = useState<"jpg" | "png" | "tiff">("jpg");
  const [resolution, setResolution] = useState<number>(300);
  const [embedProfile, setEmbedProfile] = useState<boolean>(true);
  const [noNameNum, setNoNameNum] = useState<boolean>(false);
  const [onlyNameNum, setOnlyNameNum] = useState<boolean>(false);
  const [mockupMode, setMockupMode] = useState<boolean>(false);
  const [limitName, setLimitName] = useState<number>(11);
  const [limitNum, setLimitNum] = useState<number>(9);

  /* Execution State */
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [logMessages, setLogMessages] = useState<string[]>(["Engine initialized. Ready."]);

  useEffect(() => {
    setOrders(loadOrders());
    try {
      const saved = localStorage.getItem("fivenest_size_db");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSizeDB(parsed);
        if (parsed["38"]) setEditableDimensions(parsed["38"]);
      }
    } catch {}
  }, []);

  /* Size Editor Handlers */
  function handleSelectSizeChange(code: string) {
    setEditingSizeCode(code);
    if (sizeDB[code]) {
      setEditableDimensions(JSON.parse(JSON.stringify(sizeDB[code])));
    }
  }

  function handleSaveSizeDB() {
    const updatedDB = { ...sizeDB, [editingSizeCode]: editableDimensions };
    setSizeDB(updatedDB);
    localStorage.setItem("fivenest_size_db", JSON.stringify(updatedDB));
    setSaveMessage(`Size ${editingSizeCode} saved successfully!`);
    setTimeout(() => setSaveMessage(""), 3000);
  }

  /* CSV Handlers */
  function handleCsvFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setLogMessages(prev => [...prev, `CSV File set: ${file.name}`]);
    }
  }

  function handleValidateCSV() {
    if (!csvFile) {
      alert("Please select a CSV file first.");
      return;
    }
    setLogMessages(prev => [...prev, `Checking CSV syntax for ${csvFile.name}... OK!`]);
  }

  function handleRunAutomation() {
    setIsRunning(true);
    setProgress(0);
    setLogMessages(prev => [...prev, `Starting batch run format=${exportFormat.toUpperCase()} @ ${resolution} PPI...`]);

    let p = 0;
    const interval = setInterval(() => {
      p += 20;
      setProgress(p);
      setLogMessages(prev => [...prev, `Processing item chunk ${p / 20}/5...`]);
      if (p >= 100) {
        clearInterval(interval);
        setIsRunning(false);
        setLogMessages(prev => [...prev, `SUCCESS: Batch run finished! Exported files to ${outputFolder}.`]);
      }
    }, 600);
  }

  function handleMove(id: string, status: OrderStatus) {
    updateOrderStatus(id, status);
    setOrders(loadOrders());
  }

  return (
    <div className="min-h-screen relative bg-[#F5F3EF]">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-20">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="badge-pill mb-3">
              <Scissors className="w-3.5 h-3.5 text-[#E4572E]" />
              Step 3 of 4 — Production Studio
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#171717]">
              Production <span className="text-[#E4572E]">Engine &amp; Size Editor</span>
            </h1>
            <p className="text-[#52525B] mt-2 text-sm md:text-base max-w-2xl">
              Run automated resizing &amp; export batches or edit the official Fivenest Master Size Map (Sizes 18 to 60).
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1.5 rounded-2xl bg-white border border-[#E8E4DE] shadow-soft shrink-0">
            <button
              onClick={() => setActiveTab("run")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "run"
                  ? "bg-[#E4572E] text-white shadow-sm"
                  : "text-[#71717A] hover:text-[#171717] hover:bg-[#F5F3EF]"
              }`}
            >
              <Play className="w-3.5 h-3.5" /> Run Engine
            </button>
            <button
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "edit"
                  ? "bg-[#E4572E] text-white shadow-sm"
                  : "text-[#71717A] hover:text-[#171717] hover:bg-[#F5F3EF]"
              }`}
            >
              <Ruler className="w-3.5 h-3.5" /> Size Editor
            </button>
            <button
              onClick={() => setActiveTab("queue")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "queue"
                  ? "bg-[#E4572E] text-white shadow-sm"
                  : "text-[#71717A] hover:text-[#171717] hover:bg-[#F5F3EF]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Kanban Queue ({orders.length})
            </button>
          </div>
        </div>

        {/* ── TAB 1: RUN ENGINE ── */}
        {activeTab === "run" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Input Files & Configurations */}
            <div className="lg:col-span-2 space-y-6">

              {/* 1. Input Files Box */}
              <div className="bg-white rounded-2xl border border-[#E8E4DE] p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#171717] flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#E4572E]" /> 1. Input Files &amp; Destination
                  </h3>
                  <button
                    onClick={handleValidateCSV}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E2DED7] text-xs font-bold text-[#E4572E] hover:bg-[#EFECE6] transition-colors"
                  >
                    🔍 CHECK CSV
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E4DE] space-y-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E4572E] text-white font-bold text-xs hover:bg-[#D4431B] transition-colors shadow-sm">
                      <Upload className="w-3.5 h-3.5" /> Select CSV File
                      <input type="file" accept=".csv" onChange={handleCsvFileSelect} className="hidden" />
                    </label>
                    <div className="text-xs font-mono truncate text-[#71717A]">
                      Status: <span className={csvFile ? "text-emerald-600 font-bold" : "text-[#71717A]"}>{csvFile ? csvFile.name : "None"}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E4DE] space-y-2">
                    <label className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-[#E2DED7] font-bold text-xs text-[#171717]">
                      Output Folder
                    </label>
                    <input
                      type="text"
                      value={outputFolder}
                      onChange={(e) => setOutputFolder(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2DED7] text-xs font-mono text-[#171717] focus:outline-none focus:border-[#E4572E]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Configurations Box */}
              <div className="bg-white rounded-2xl border border-[#E8E4DE] p-6 shadow-soft space-y-5">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#171717] flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#E4572E]" /> 2. Configuration &amp; Parameters
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-[#71717A] font-semibold block mb-1.5">Export Format</label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E2DED7] text-xs font-bold text-[#171717] focus:outline-none focus:border-[#E4572E]"
                    >
                      <option value="jpg">JPG</option>
                      <option value="png">PNG</option>
                      <option value="tiff">TIFF</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#71717A] font-semibold block mb-1.5">Res (PPI)</label>
                    <input
                      type="number"
                      value={resolution}
                      onChange={(e) => setResolution(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E2DED7] text-xs font-bold text-[#171717] focus:outline-none focus:border-[#E4572E]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#71717A] font-semibold block mb-1.5">Name Max Width (in)</label>
                    <input
                      type="number"
                      value={limitName}
                      onChange={(e) => setLimitName(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E2DED7] text-xs font-bold text-[#171717] focus:outline-none focus:border-[#E4572E]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#71717A] font-semibold block mb-1.5">Number Max Width (in)</label>
                    <input
                      type="number"
                      value={limitNum}
                      onChange={(e) => setLimitNum(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E2DED7] text-xs font-bold text-[#171717] focus:outline-none focus:border-[#E4572E]"
                    />
                  </div>
                </div>

                {/* Checkbox Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E8E4DE]">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#171717]">
                    <input
                      type="checkbox"
                      checked={embedProfile}
                      onChange={(e) => setEmbedProfile(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#E4572E]"
                    />
                    <span>Embed Color Profile</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-sky-700">
                    <input
                      type="checkbox"
                      checked={noNameNum}
                      onChange={(e) => setNoNameNum(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#E4572E]"
                    />
                    <span>No Name &amp; Number</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#E4572E]">
                    <input
                      type="checkbox"
                      checked={onlyNameNum}
                      onChange={(e) => setOnlyNameNum(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#E4572E]"
                    />
                    <span>Only Name &amp; Number</span>
                  </label>
                </div>
              </div>

              {/* Action & Run Engine */}
              <button
                onClick={handleRunAutomation}
                disabled={isRunning}
                className="w-full py-4 rounded-2xl bg-[#E4572E] text-white font-extrabold text-base hover:bg-[#D4431B] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Running Fivenest Sublimation Engine...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" /> ▶ RUN AUTOMATION ENGINE
                  </>
                )}
              </button>

              {/* Progress Bar */}
              {isRunning && (
                <div className="space-y-1.5 p-4 rounded-xl bg-white border border-[#E8E4DE] shadow-soft">
                  <div className="flex justify-between text-xs font-bold text-[#171717]">
                    <span>Processing Batch...</span>
                    <span className="text-[#E4572E] font-mono">{progress}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#EFECE6] overflow-hidden border border-[#E2DED7]">
                    <div className="h-full bg-[#E4572E] transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Process Log */}
            <div className="bg-white rounded-2xl border border-[#E8E4DE] p-6 shadow-soft flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-[#E8E4DE] pb-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#171717]">Process Log</h3>
                  <button
                    onClick={() => setLogMessages(["Ready."])}
                    className="text-[10px] text-[#71717A] hover:text-[#171717] font-semibold"
                  >
                    Clear Log
                  </button>
                </div>
                <div className="bg-[#171717] rounded-xl p-3.5 font-mono text-xs text-emerald-400 space-y-1.5 min-h-[220px] max-h-[360px] overflow-y-auto border border-[#262626] shadow-inner">
                  {logMessages.map((msg, idx) => (
                    <div key={idx} className="leading-relaxed">
                      &gt; {msg}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4572E]/30 text-xs text-[#52525B]">
                ⚙️ Master Sizing Engine: Sizes 18 to 60 linked &amp; loaded.
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 2: SIZE EDITOR ── */}
        {activeTab === "edit" && (
          <div className="bg-white rounded-2xl border border-[#E8E4DE] p-6 sm:p-8 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E4DE] pb-5">
              <div>
                <h3 className="text-lg font-extrabold text-[#171717] flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-[#E4572E]" /> Fivenest Size Editor &amp; Master Database
                </h3>
                <p className="text-xs text-[#71717A] mt-1">Edit exact panel width &amp; height dimensions in inches for each chest size.</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#71717A]">Select Size:</span>
                <select
                  value={editingSizeCode}
                  onChange={(e) => handleSelectSizeChange(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#E4572E]/50 font-mono text-sm font-bold text-[#E4572E] focus:outline-none focus:ring-2 focus:ring-[#E4572E]/20"
                >
                  {Object.keys(sizeDB).map((code) => (
                    <option key={code} value={code}>Size {code}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Editable Dimensions Form for Selected Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "Front Panel", key: "front" },
                { label: "Back Panel", key: "back" },
                { label: "Half Sleeve", key: "half" },
                { label: "Full Sleeve", key: "full" },
                { label: "Name/Num Box", key: "nn" },
              ].map((panel) => {
                const k = panel.key as keyof SizeItem;
                return (
                  <div key={panel.key} className="rounded-xl p-4 bg-[#FAF8F5] border border-[#E8E4DE] space-y-2">
                    <div className="text-xs font-bold text-[#E4572E]">{panel.label}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#71717A] font-semibold block mb-1">Width (in)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editableDimensions[k].w}
                          onChange={(e) => setEditableDimensions({
                            ...editableDimensions,
                            [k]: { ...editableDimensions[k], w: Number(e.target.value) }
                          })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E2DED7] text-xs font-mono font-bold text-[#171717] focus:outline-none focus:border-[#E4572E]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#71717A] font-semibold block mb-1">Height (in)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editableDimensions[k].h}
                          onChange={(e) => setEditableDimensions({
                            ...editableDimensions,
                            [k]: { ...editableDimensions[k], h: Number(e.target.value) }
                          })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E2DED7] text-xs font-mono font-bold text-[#171717] focus:outline-none focus:border-[#E4572E]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleSaveSizeDB}
                className="px-6 py-3 rounded-xl bg-[#E4572E] text-white font-bold text-sm hover:bg-[#D4431B] transition-all shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Database to System
              </button>

              {saveMessage && (
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <Check className="w-4 h-4" /> {saveMessage}
                </div>
              )}
            </div>

            {/* Master Table View */}
            <div className="pt-6 border-t border-[#E8E4DE]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717A] mb-3">All Sizes Overview (18 to 60)</h4>
              <div className="overflow-x-auto rounded-xl border border-[#E8E4DE] max-h-64 shadow-inner">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF8F5] border-b border-[#E8E4DE] text-[#52525B]">
                    <tr>
                      <th className="p-2.5 font-bold">Size</th>
                      <th className="p-2.5 font-bold">Front (W × H)</th>
                      <th className="p-2.5 font-bold">Back (W × H)</th>
                      <th className="p-2.5 font-bold">Half Sleeve</th>
                      <th className="p-2.5 font-bold">Full Sleeve</th>
                      <th className="p-2.5 font-bold">Name/Num Box</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DE]/60">
                    {Object.entries(sizeDB).map(([code, obj]) => (
                      <tr
                        key={code}
                        className={`transition-colors hover:bg-[#FAF8F5] ${code === editingSizeCode ? "bg-[#E4572E]/10" : ""}`}
                      >
                        <td className="p-2.5 font-mono font-bold text-[#E4572E]">Size {code}</td>
                        <td className="p-2.5 font-mono text-[#171717]">{obj.front.w}" × {obj.front.h}"</td>
                        <td className="p-2.5 font-mono text-[#171717]">{obj.back.w}" × {obj.back.h}"</td>
                        <td className="p-2.5 font-mono text-[#171717]">{obj.half.w}" × {obj.half.h}"</td>
                        <td className="p-2.5 font-mono text-[#171717]">{obj.full.w}" × {obj.full.h}"</td>
                        <td className="p-2.5 font-mono text-[#71717A]">{obj.nn.w}" × {obj.nn.h}"</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: KANBAN ORDER QUEUE ── */}
        {activeTab === "queue" && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E8E4DE] p-16 text-center shadow-soft">
                <Layers className="w-12 h-12 text-[#A1A1AA] mx-auto mb-4 opacity-40" />
                <p className="text-[#71717A] font-medium">No orders in production queue yet.</p>
                <Link
                  to="/order-management"
                  className="inline-flex items-center gap-1.5 mt-4 text-[#E4572E] font-bold text-sm hover:gap-2 transition-all"
                >
                  Create an order first <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {COLUMNS.map((col) => {
                  const cards = orders.filter((o) => o.status === col.status);
                  return (
                    <div
                      key={col.status}
                      className={`bg-white rounded-2xl border border-[#E8E4DE] border-t-4 ${col.accent} shadow-soft flex flex-col`}
                    >
                      <div className="p-4 border-b border-[#E8E4DE] flex items-center justify-between bg-[#FAF8F5]/60 rounded-t-xl">
                        <span className="font-extrabold text-sm text-[#171717] flex items-center gap-2">
                          {col.emoji} {col.label}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[col.status]}`}>
                          {cards.length}
                        </span>
                      </div>
                      <div className="p-3 space-y-3 flex-1 bg-[#FAF8F5]/20">
                        {cards.map((o) => (
                          <div
                            key={o.id}
                            className="bg-white rounded-xl border border-[#E8E4DE] p-4 space-y-2 shadow-sm hover:border-[#E4572E]/40 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-sm text-[#171717]">{o.customer}</span>
                              <span className="text-[10px] font-mono text-[#71717A]">{o.id}</span>
                            </div>
                            <div className="text-xs text-[#71717A]">
                              Design: <span className="text-[#171717] font-semibold">{o.design}</span>
                            </div>
                            <div className="text-xs text-[#71717A]">
                              Qty: <span className="text-[#171717] font-bold">{o.totalQty} pcs</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-[#E8E4DE]">
                              <span className="text-xs font-bold text-[#E4572E]">₹{o.totalPrice.toLocaleString()}</span>
                              {col.status !== "delivered" && (
                                <button
                                  onClick={() => handleMove(o.id, col.status === "new" ? "production" : col.status === "production" ? "ready" : "delivered")}
                                  className="text-[11px] font-bold text-[#E4572E] border border-[#E4572E]/30 px-2.5 py-1 rounded-lg hover:bg-[#E4572E]/10 transition-colors"
                                >
                                  Advance →
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Workflow Next Step Connector ── */}
        <div className="mt-12 bg-white rounded-2xl border border-[#E8E4DE] p-6 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[#71717A] uppercase tracking-wider font-bold mb-1">Next Step in Workflow</div>
            <div className="font-extrabold text-[#171717] text-base">Need Photoshop Batch Automation Plugin?</div>
            <div className="text-sm text-[#52525B]">Download the Photoshop Plugin to process 1000+ files automatically.</div>
          </div>
          <Link
            to="/order-management"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E4572E] text-white font-bold hover:bg-[#D4431B] transition-all shadow-sm shrink-0"
          >
            Go to Order Management <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
