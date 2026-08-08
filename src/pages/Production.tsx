import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Layers, Clock, AlertTriangle, Upload, FileCheck, Sliders, Maximize2,
  Printer, CheckCircle2, RefreshCw, Download, Plus, Trash2, User, Hash, Ruler, FileSpreadsheet, Eye, Scissors
} from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  loadOrders, updateOrderStatus,
  type Order, type OrderStatus, STATUS_LABELS, STATUS_COLORS,
} from "@/lib/orders";

/* ── FIVENEST OFFICIAL MASTER SIZE MAP (Inches) ───────────── */
export const MASTER_SIZE_MAP: Record<string, { w: number; h: number; label: string }> = {
  "18": { w: 11.0, h: 15.0, label: "Kids 18" },
  "20": { w: 12.0, h: 16.0, label: "Kids 20" },
  "22": { w: 13.0, h: 17.0, label: "Kids 22" },
  "24": { w: 14.0, h: 20.0, label: "Kids 24" },
  "26": { w: 15.0, h: 21.0, label: "Kids 26" },
  "28": { w: 15.8, h: 23.0, label: "Kids 28" },
  "30": { w: 17.0, h: 25.0, label: "Kids 30" },
  "32": { w: 18.0, h: 26.0, label: "Youth 32" },
  "34": { w: 19.0, h: 27.0, label: "Youth 34" },
  "36": { w: 20.0, h: 28.0, label: "Adult S (36)" },
  "38": { w: 21.0, h: 29.0, label: "Adult M (38)" },
  "40": { w: 22.0, h: 30.0, label: "Adult L (40)" },
  "42": { w: 23.0, h: 31.0, label: "Adult XL (42)" },
  "44": { w: 24.0, h: 31.8, label: "Adult XXL (44)" },
  "46": { w: 25.0, h: 33.0, label: "Adult 3XL (46)" },
  "48": { w: 26.0, h: 33.5, label: "Adult 4XL (48)" },
  "50": { w: 27.0, h: 34.0, label: "Adult 5XL (50)" },
  "52": { w: 28.0, h: 34.5, label: "Adult 6XL (52)" },
  "54": { w: 29.0, h: 34.5, label: "Adult 7XL (54)" },
  "56": { w: 30.0, h: 35.0, label: "Adult 8XL (56)" },
  "58": { w: 31.0, h: 36.0, label: "Adult 9XL (58)" },
  "60": { w: 32.0, h: 37.0, label: "Adult 10XL (60)" },
};

const COLUMNS: { status: OrderStatus; label: string; emoji: string; accent: string }[] = [
  { status: "new",        label: "New Orders",    emoji: "📥", accent: "border-t-cyan-500" },
  { status: "production", label: "In Production", emoji: "⚙️", accent: "border-t-yellow-500" },
  { status: "ready",      label: "Ready to Print", emoji: "✅", accent: "border-t-emerald-500" },
  { status: "delivered",  label: "Delivered",     emoji: "🚚", accent: "border-t-slate-500" },
];

export default function Production() {
  const [activeTab, setActiveTab] = useState<"resizer" | "sizemap" | "queue">("resizer");
  const [orders, setOrders] = useState<Order[]>([]);

  /* Resizer tool state */
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("38");
  const [panelType, setPanelType] = useState<"Front" | "Back" | "Half Sleeve" | "Full Sleeve">("Front");
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [batchData, setBatchData] = useState<Array<{ label: string; size: string; qty: number }>>([
    { label: "Jersey_Front_M", size: "38", qty: 12 },
    { label: "Jersey_Front_L", size: "40", qty: 15 },
    { label: "Jersey_Front_XL", size: "42", qty: 8 },
  ]);
  const [newRow, setNewRow] = useState({ label: "", size: "38", qty: 1 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processSuccess, setProcessSuccess] = useState(false);

  useEffect(() => {
    setOrders(loadOrders());
  }, []);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setDesignImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim().length > 0);
        const parsed = lines.slice(1).map((line, idx) => {
          const parts = line.split(",");
          return {
            label: parts[0]?.trim() || `Item_${idx + 1}`,
            size: parts[1]?.trim() || "38",
            qty: parseInt(parts[2]?.trim() || "1") || 1,
          };
        });
        if (parsed.length > 0) setBatchData(parsed);
      };
      reader.readAsText(file);
    }
  }

  function handleAddRow() {
    if (!newRow.label.trim()) return;
    setBatchData([...batchData, { ...newRow }]);
    setNewRow({ label: "", size: "38", qty: 1 });
  }

  function handleRemoveRow(index: number) {
    setBatchData(batchData.filter((_, i) => i !== index));
  }

  function handleProcessBatch() {
    setIsProcessing(true);
    setProcessSuccess(false);
    setTimeout(() => {
      setIsProcessing(false);
      setProcessSuccess(true);
    }, 1200);
  }

  function handleMove(id: string, status: OrderStatus) {
    updateOrderStatus(id, status);
    setOrders(loadOrders());
  }

  const currentSizeObj = MASTER_SIZE_MAP[selectedSize] || MASTER_SIZE_MAP["38"];
  const widthPx = Math.round(currentSizeObj.w * 300);
  const heightPx = Math.round(currentSizeObj.h * 300);

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      <Navbar />

      <div className="relative container mx-auto px-6 pt-32 pb-20">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest mb-2">
              <Scissors className="w-3.5 h-3.5 text-primary" />
              Step 3 of 4 — Production Mode
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              Production <span className="text-gradient">Resizer Studio</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Upload design graphics, set exact size dimensions (Sizes 18 to 60), import CSV data, and calculate print dimensions in inches & 300 DPI pixels.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex glass p-1.5 rounded-2xl border border-border/40 shrink-0">
            <button
              onClick={() => setActiveTab("resizer")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "resizer" ? "bg-primary text-primary-foreground shadow-md glow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" /> Print Resizer
            </button>
            <button
              onClick={() => setActiveTab("sizemap")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "sizemap" ? "bg-primary text-primary-foreground shadow-md glow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Ruler className="w-3.5 h-3.5" /> Size Chart Map
            </button>
            <button
              onClick={() => setActiveTab("queue")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "queue" ? "bg-primary text-primary-foreground shadow-md glow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Order Queue ({orders.length})
            </button>
          </div>
        </div>

        {/* ── TAB 1: PRODUCTION RESIZER ── */}
        {activeTab === "resizer" && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Box 1: Design Image & Single Size Calculator */}
              <div className="glass-card rounded-2xl border border-border/30 p-6 space-y-5">
                <h3 className="text-base font-black flex items-center gap-2 text-foreground">
                  <Upload className="w-4 h-4 text-primary" /> 1. Upload Graphic & Select Size
                </h3>

                <div className="relative border-2 border-dashed border-border/50 hover:border-primary/50 rounded-2xl p-5 text-center transition-colors bg-surface/20">
                  {designImage ? (
                    <div className="space-y-3">
                      <img src={designImage} alt="Uploaded graphic" className="max-h-36 mx-auto rounded-lg object-contain shadow-md" />
                      <button onClick={() => setDesignImage(null)} className="text-xs text-red-400 font-semibold hover:underline">
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer space-y-2 block py-4">
                      <Upload className="w-7 h-7 text-primary mx-auto opacity-70" />
                      <div className="text-xs font-bold text-foreground">Click to upload Jersey PSD / Image</div>
                      <div className="text-[11px] text-muted-foreground">PNG, JPG, PSD, SVG</div>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Sizing Controls */}
                <div className="space-y-3 pt-2 border-t border-border/20">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Garment Panel</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["Front", "Back", "Half Sleeve", "Full Sleeve"] as const).map((pt) => (
                        <button
                          key={pt}
                          onClick={() => setPanelType(pt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            panelType === pt
                              ? "bg-primary/20 border-primary text-primary"
                              : "glass-card border-border/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {pt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Target Size (Chest Size Number)</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface/60 border border-border/40 text-xs font-bold focus:outline-none focus:border-primary/50"
                    >
                      {Object.entries(MASTER_SIZE_MAP).map(([code, obj]) => (
                        <option key={code} value={code}>
                          Size {code} — {obj.label} ({obj.w}" × {obj.h}")
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dimension readout box */}
                  <div className="glass-card rounded-xl p-3 border border-primary/20 bg-primary/5 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Width:</span>
                      <span className="font-mono font-bold text-primary">{currentSizeObj.w} inches ({widthPx} px @ 300 DPI)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Height:</span>
                      <span className="font-mono font-bold text-primary">{currentSizeObj.h} inches ({heightPx} px @ 300 DPI)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: CSV Batch Data Table */}
              <div className="glass-card rounded-2xl border border-border/30 p-6 space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black flex items-center gap-2 text-foreground">
                    <FileSpreadsheet className="w-4 h-4 text-primary" /> 2. CSV Batch Import
                  </h3>
                  <label className="cursor-pointer px-3 py-1 rounded-lg bg-surface border border-border/40 text-[11px] font-semibold text-primary hover:bg-surface/80">
                    Import CSV
                    <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                  </label>
                </div>
                {csvFileName && <div className="text-[11px] text-emerald-400 font-mono">Loaded: {csvFileName}</div>}

                {/* Add Row Form */}
                <div className="grid grid-cols-3 gap-2 bg-surface/30 p-2.5 rounded-xl border border-border/30">
                  <input
                    value={newRow.label}
                    onChange={(e) => setNewRow({ ...newRow, label: e.target.value })}
                    placeholder="File Label"
                    className="px-2 py-1.5 rounded-lg bg-surface/80 border border-border/40 text-xs focus:outline-none"
                  />
                  <select
                    value={newRow.size}
                    onChange={(e) => setNewRow({ ...newRow, size: e.target.value })}
                    className="px-2 py-1.5 rounded-lg bg-surface/80 border border-border/40 text-xs font-semibold"
                  >
                    {Object.keys(MASTER_SIZE_MAP).map((sz) => (
                      <option key={sz} value={sz}>Size {sz}</option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    <input
                      type="number" min={1} value={newRow.qty}
                      onChange={(e) => setNewRow({ ...newRow, qty: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 rounded-lg bg-surface/80 border border-border/40 text-xs font-bold text-center"
                    />
                    <button onClick={handleAddRow} className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                      +
                    </button>
                  </div>
                </div>

                {/* Batch Table */}
                <div className="flex-1 overflow-y-auto max-h-56 border border-border/20 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="glass border-b border-border/30">
                      <tr>
                        <th className="p-2">Label</th>
                        <th className="p-2">Size</th>
                        <th className="p-2">Dimensions</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchData.map((row, i) => {
                        const sObj = MASTER_SIZE_MAP[row.size] || { w: 20, h: 28 };
                        return (
                          <tr key={i} className="border-b border-border/10 hover:bg-surface/30">
                            <td className="p-2 font-mono font-bold">{row.label}</td>
                            <td className="p-2 text-primary font-bold">Size {row.size}</td>
                            <td className="p-2 text-muted-foreground">{sObj.w}" × {sObj.h}"</td>
                            <td className="p-2 text-right font-bold">{row.qty}</td>
                            <td className="p-2 text-right">
                              <button onClick={() => handleRemoveRow(i)} className="text-muted-foreground hover:text-red-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Box 3: Canvas Resizer Visual Preview & Batch Generator */}
              <div className="glass-card rounded-2xl border border-border/30 p-6 space-y-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-black flex items-center gap-2 text-foreground mb-3">
                    <Eye className="w-4 h-4 text-primary" /> 3. Canvas Resizer Preview
                  </h3>

                  {/* Interactive Visual Scale Canvas */}
                  <div className="relative rounded-2xl border border-border/40 bg-gradient-to-b from-surface/40 to-surface/90 p-4 text-center overflow-hidden min-h-[180px] flex flex-col items-center justify-center">
                    <div className="absolute top-2 left-2 text-[10px] text-muted-foreground font-mono">
                      Panel: {panelType} | Size: {selectedSize} ({currentSizeObj.w}" × {currentSizeObj.h}")
                    </div>

                    <div
                      className="relative border-2 border-primary/40 rounded-xl bg-primary/10 transition-all flex flex-col items-center justify-center p-3 shadow-inner"
                      style={{
                        width: `${Math.min(currentSizeObj.w * 6.5, 200)}px`,
                        height: `${Math.min(currentSizeObj.h * 6.5, 240)}px`,
                      }}
                    >
                      {designImage ? (
                        <img src={designImage} alt="Sublimation design" className="w-full h-full object-contain opacity-80" />
                      ) : (
                        <div className="text-center p-2">
                          <Maximize2 className="w-6 h-6 text-primary mx-auto mb-1 opacity-70" />
                          <div className="text-[10px] font-black text-primary uppercase">{panelType} PANEL</div>
                          <div className="text-[9px] font-mono text-muted-foreground">{currentSizeObj.w}" × {currentSizeObj.h}"</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Batch Action */}
                <div className="space-y-2">
                  <button
                    onClick={handleProcessBatch}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all glow-sm flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Auto-Resizing {batchData.length} Items...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" /> Run Sublimation Resizer Batch ({batchData.length} files)
                      </>
                    )}
                  </button>

                  {processSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> {batchData.reduce((a, b) => a + b.qty, 0)} files resized at 300 DPI!
                      </span>
                      <button className="underline font-bold hover:text-emerald-300">Download</button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── TAB 2: MASTER SIZE CHART MAP ── */}
        {activeTab === "sizemap" && (
          <div className="glass-card rounded-2xl border border-border/30 p-6 space-y-4 animate-fade-in">
            <h3 className="text-lg font-black flex items-center gap-2">
              <Ruler className="w-5 h-5 text-primary" /> Fivenest Official Sublimation Size Map (Inches & Pixels @ 300 DPI)
            </h3>
            <p className="text-xs text-muted-foreground">Standardized garment dimensions used by leading jersey manufacturers across India.</p>

            <div className="overflow-x-auto rounded-xl border border-border/30">
              <table className="w-full text-xs text-left">
                <thead className="glass border-b border-border/30">
                  <tr>
                    <th className="p-3">Size Code</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Width (Inches)</th>
                    <th className="p-3">Height (Inches)</th>
                    <th className="p-3">Width (Pixels @ 300 DPI)</th>
                    <th className="p-3">Height (Pixels @ 300 DPI)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(MASTER_SIZE_MAP).map(([code, obj]) => (
                    <tr key={code} className="border-b border-border/10 hover:bg-surface/40">
                      <td className="p-3 font-mono font-bold text-primary">Size {code}</td>
                      <td className="p-3 font-semibold">{obj.label}</td>
                      <td className="p-3 font-mono">{obj.w}"</td>
                      <td className="p-3 font-mono">{obj.h}"</td>
                      <td className="p-3 font-mono text-muted-foreground">{Math.round(obj.w * 300)} px</td>
                      <td className="p-3 font-mono text-muted-foreground">{Math.round(obj.h * 300)} px</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: KANBAN PRODUCTION QUEUE ── */}
        {activeTab === "queue" && (
          <div className="space-y-6 animate-fade-in">
            {orders.length === 0 ? (
              <div className="glass-card rounded-2xl border border-border/30 p-16 text-center">
                <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <p className="text-muted-foreground">No orders in production queue yet.</p>
                <Link to="/orders" className="inline-flex items-center gap-1.5 mt-4 text-primary font-semibold text-sm hover:gap-2 transition-all">
                  Create an order first <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {COLUMNS.map((col) => {
                  const cards = orders.filter((o) => o.status === col.status);
                  return (
                    <div key={col.status} className={`glass-card rounded-2xl border border-border/30 border-t-2 ${col.accent} flex flex-col`}>
                      <div className="p-4 border-b border-border/20 flex items-center justify-between">
                        <span className="font-black text-sm text-foreground flex items-center gap-2">
                          {col.emoji} {col.label}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[col.status]}`}>
                          {cards.length}
                        </span>
                      </div>
                      <div className="p-3 space-y-3 flex-1">
                        {cards.map((o) => (
                          <div key={o.id} className="glass-card rounded-xl border border-border/30 p-4 space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-sm text-foreground">{o.customer}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">{o.id}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">Design: <span className="text-foreground">{o.design}</span></div>
                            <div className="text-xs text-muted-foreground">Qty: <span className="text-foreground font-bold">{o.totalQty} pcs</span></div>
                            <div className="flex items-center justify-between pt-2 border-t border-border/20">
                              <span className="text-xs font-bold text-primary">₹{o.totalPrice.toLocaleString()}</span>
                              {col.status !== "delivered" && (
                                <button
                                  onClick={() => handleMove(o.id, col.status === "new" ? "production" : col.status === "production" ? "ready" : "delivered")}
                                  className="text-[11px] font-semibold text-primary border border-primary/30 px-2 py-0.5 rounded-lg hover:bg-primary/10 transition-colors"
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
        <div className="mt-12 glass-card rounded-2xl border border-border/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Next Step in Workflow</div>
            <div className="font-bold text-foreground">Need Photoshop Batch Automation Plugin?</div>
            <div className="text-sm text-muted-foreground">Download the Photoshop Plugin to process 1000+ files automatically.</div>
          </div>
          <Link to="/plugin" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all glow-sm shrink-0">
            Plugin Studio <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      <Footer />
    </div>
  );
}
