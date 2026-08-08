import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Layers, Clock, AlertTriangle, Upload, FileCheck, Sliders, Maximize2,
  Printer, CheckCircle2, RefreshCw, Download, Plus, Trash2, User, Hash, Ruler
} from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  loadOrders, updateOrderStatus,
  type Order, type OrderStatus, STATUS_LABELS, STATUS_COLORS,
} from "@/lib/orders";

const COLUMNS: { status: OrderStatus; label: string; emoji: string; accent: string }[] = [
  { status: "new",        label: "New Orders",    emoji: "📥", accent: "border-t-cyan-500" },
  { status: "production", label: "In Production", emoji: "⚙️", accent: "border-t-yellow-500" },
  { status: "ready",      label: "Ready to Print", emoji: "✅", accent: "border-t-emerald-500" },
  { status: "delivered",  label: "Delivered",     emoji: "🚚", accent: "border-t-slate-500" },
];

const isOverdue = (order: Order) =>
  order.deadline && order.status !== "delivered" && new Date(order.deadline) < new Date();

export default function Production() {
  const [activeTab, setActiveTab] = useState<"queue" | "resizer">("resizer");
  const [orders, setOrders] = useState<Order[]>([]);

  /* Resizer tool state */
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [paperWidth, setPaperWidth] = useState<number>(44); // inches
  const [dpi, setDpi] = useState<number>(300);
  const [bleed, setBleed] = useState<number>(0.5); // inches
  const [players, setPlayers] = useState<Array<{ name: string; number: string; size: string }>>([
    { name: "RAHUL", number: "10", size: "L" },
    { name: "AMIT", number: "07", size: "M" },
    { name: "VIKRAM", number: "18", size: "XL" },
  ]);
  const [newPlayer, setNewPlayer] = useState({ name: "", number: "", size: "L" });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  useEffect(() => {
    const loaded = loadOrders();
    setOrders(loaded);
    if (loaded.length > 0) {
      setSelectedOrder(loaded[0].id);
    }
  }, []);

  function handleMove(id: string, status: OrderStatus) {
    updateOrderStatus(id, status);
    setOrders(loadOrders());
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setDesignImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleAddPlayer() {
    if (!newPlayer.name.trim()) return;
    setPlayers([...players, { ...newPlayer, name: newPlayer.name.toUpperCase() }]);
    setNewPlayer({ name: "", number: "", size: "L" });
  }

  function handleRemovePlayer(index: number) {
    setPlayers(players.filter((_, i) => i !== index));
  }

  function handleGenerateFiles() {
    setIsGenerating(true);
    setGeneratedSuccess(false);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedSuccess(true);
    }, 1500);
  }

  const byStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);
  const overdueCount = orders.filter(isOverdue).length;

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      <Navbar />

      <div className="relative container mx-auto px-6 pt-32 pb-20">

        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest mb-2">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Step 3 of 4 — Production Studio
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              Production & <span className="text-gradient">Data Resizer</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Upload design, configure print roll size & DPI, add player names & numbers, and process print-ready files.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex glass p-1.5 rounded-2xl border border-border/40 shrink-0">
            <button
              onClick={() => setActiveTab("resizer")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "resizer"
                  ? "bg-primary text-primary-foreground shadow-md glow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Maximize2 className="w-4 h-4" /> Print Resizer & File Prep
            </button>
            <button
              onClick={() => setActiveTab("queue")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "queue"
                  ? "bg-primary text-primary-foreground shadow-md glow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-4 h-4" /> Kanban Queue ({orders.length})
            </button>
          </div>
        </div>

        {/* ── TAB 1: PRODUCTION RESIZER & PRINT PREP ── */}
        {activeTab === "resizer" && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Config Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Box 1: Design Upload & Canvas Settings */}
              <div className="glass-card rounded-2xl border border-border/30 p-6 space-y-5">
                <h3 className="text-lg font-black flex items-center gap-2 text-foreground">
                  <Upload className="w-5 h-5 text-primary" /> 1. Upload Design Graphic
                </h3>

                <div className="relative border-2 border-dashed border-border/50 hover:border-primary/50 rounded-2xl p-6 text-center transition-colors bg-surface/20">
                  {designImage ? (
                    <div className="space-y-3">
                      <img src={designImage} alt="Design preview" className="max-h-40 mx-auto rounded-lg object-contain shadow-md" />
                      <button
                        onClick={() => setDesignImage(null)}
                        className="text-xs text-red-400 font-semibold hover:underline"
                      >
                        Remove / Change Image
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer space-y-2 block">
                      <Upload className="w-8 h-8 text-primary mx-auto opacity-70" />
                      <div className="text-sm font-bold text-foreground">Click to upload Jersey Design</div>
                      <div className="text-xs text-muted-foreground">PNG, JPG, PSD, SVG (Max 50MB)</div>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Print Paper & Size Configuration */}
                <div className="space-y-4 pt-2 border-t border-border/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-primary" /> Print Roll & Resolution Setup
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Roll Width</label>
                      <select
                        value={paperWidth}
                        onChange={(e) => setPaperWidth(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-surface/60 border border-border/40 text-xs font-semibold focus:outline-none focus:border-primary/50"
                      >
                        <option value={44}>44 inches (Standard)</option>
                        <option value={60}>60 inches (Wide Roll)</option>
                        <option value={24}>24 inches (Desktop Plotter)</option>
                        <option value={11.7}>A3 Size (Panel)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Print Resolution</label>
                      <select
                        value={dpi}
                        onChange={(e) => setDpi(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-surface/60 border border-border/40 text-xs font-semibold focus:outline-none focus:border-primary/50"
                      >
                        <option value={300}>300 DPI (High Quality)</option>
                        <option value={150}>150 DPI (Fast Print)</option>
                        <option value={600}>600 DPI (Ultra Precision)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Seam Bleed Margin</label>
                    <input
                      type="number" step="0.1" value={bleed}
                      onChange={(e) => setBleed(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-surface/60 border border-border/40 text-xs font-semibold focus:outline-none focus:border-primary/50"
                      placeholder="0.5 inches"
                    />
                  </div>
                </div>
              </div>

              {/* Box 2: Player Data Input (Names & Numbers) */}
              <div className="glass-card rounded-2xl border border-border/30 p-6 space-y-4 flex flex-col">
                <h3 className="text-lg font-black flex items-center gap-2 text-foreground">
                  <User className="w-5 h-5 text-primary" /> 2. Player Data (Names & Numbers)
                </h3>

                {/* Quick Add Player Form */}
                <div className="grid grid-cols-3 gap-2 bg-surface/30 p-3 rounded-xl border border-border/30">
                  <input
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    placeholder="Name (e.g. VIRAT)"
                    className="px-2.5 py-1.5 rounded-lg bg-surface/80 border border-border/40 text-xs focus:outline-none focus:border-primary/50 font-bold uppercase"
                  />
                  <input
                    value={newPlayer.number}
                    onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
                    placeholder="No. (18)"
                    className="px-2.5 py-1.5 rounded-lg bg-surface/80 border border-border/40 text-xs focus:outline-none focus:border-primary/50 font-bold"
                  />
                  <div className="flex gap-1">
                    <select
                      value={newPlayer.size}
                      onChange={(e) => setNewPlayer({ ...newPlayer, size: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg bg-surface/80 border border-border/40 text-xs font-semibold"
                    >
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                    <button
                      onClick={handleAddPlayer}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Player List */}
                <div className="flex-1 overflow-y-auto max-h-56 space-y-2 pr-1">
                  {players.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl glass border border-border/30 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-black text-foreground">{p.name}</span>
                          <span className="text-muted-foreground ml-2">#{p.number}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-surface/80 border border-border/30 font-mono text-[10px] text-muted-foreground font-bold">
                          {p.size}
                        </span>
                        <button onClick={() => handleRemovePlayer(idx)} className="text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 3: Print Layout Preview & File Generation */}
              <div className="glass-card rounded-2xl border border-border/30 p-6 space-y-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2 text-foreground mb-3">
                    <Printer className="w-5 h-5 text-primary" /> 3. Live Print Preview & Export
                  </h3>

                  {/* Mock Jersey Print Preview */}
                  <div className="relative rounded-2xl border border-border/40 bg-gradient-to-b from-surface/40 to-surface/80 p-4 text-center overflow-hidden min-h-[160px] flex flex-col items-center justify-center">
                    <div className="absolute top-2 left-2 text-[10px] text-muted-foreground font-mono">
                      Roll: {paperWidth}" | {dpi} DPI | Seam: +{bleed}"
                    </div>

                    {designImage ? (
                      <div className="relative group w-full max-w-[140px] aspect-[3/4]">
                        <img src={designImage} alt="Design preview" className="w-full h-full object-contain rounded-md" />
                        {players.length > 0 && (
                          <div className="absolute inset-x-0 bottom-4 text-center bg-black/60 backdrop-blur-xs py-1 px-2 rounded text-white">
                            <div className="text-[10px] font-black tracking-widest">{players[0].name}</div>
                            <div className="text-xs font-black text-primary">{players[0].number}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Maximize2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40 animate-pulse" />
                        <div className="text-xs text-muted-foreground">Upload design to see live resized preview</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="space-y-2">
                  <button
                    onClick={handleGenerateFiles}
                    disabled={isGenerating}
                    className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all glow-sm flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Processing {players.length} Files...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" /> Generate {players.length} Print-Ready Files
                      </>
                    )}
                  </button>

                  {generatedSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> {players.length} files resized & generated!
                      </span>
                      <button className="underline font-bold hover:text-emerald-300">Download ZIP</button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── TAB 2: KANBAN PRODUCTION QUEUE ── */}
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
                  const cards = byStatus(col.status);
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
