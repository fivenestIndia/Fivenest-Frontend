import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Layers, Clock, AlertTriangle } from "lucide-react";
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
  { status: "ready",      label: "Ready",         emoji: "✅", accent: "border-t-emerald-500" },
  { status: "delivered",  label: "Delivered",     emoji: "🚚", accent: "border-t-slate-500" },
];

const isOverdue = (order: Order) =>
  order.deadline && order.status !== "delivered" && new Date(order.deadline) < new Date();

function OrderCard({ order, onMove }: { order: Order; onMove: (id: string, status: OrderStatus) => void }) {
  const overdue = isOverdue(order);
  const nextStatus: Record<OrderStatus, OrderStatus | null> = {
    new: "production", production: "ready", ready: "delivered", delivered: null,
  };
  const next = nextStatus[order.status];

  return (
    <div className="glass-card rounded-xl border border-border/30 p-4 space-y-3 hover:border-primary/30 transition-all duration-200 hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-sm text-foreground">{order.customer}</div>
          <div className="text-xs text-muted-foreground font-mono">{order.id}</div>
        </div>
        {overdue && (
          <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 border border-red-400/30 rounded-full px-2 py-0.5 font-bold shrink-0">
            <AlertTriangle className="w-2.5 h-2.5" /> Overdue
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="text-foreground font-semibold">{order.sport}</span> · {order.totalQty} jerseys
        </div>
        <div className="text-xs text-muted-foreground truncate" title={order.design}>
          Design: <span className="text-foreground">{order.design}</span>
        </div>
        {order.deadline && (
          <div className={`text-xs flex items-center gap-1 ${overdue ? "text-red-400" : "text-muted-foreground"}`}>
            <Clock className="w-3 h-3" /> {order.deadline}
          </div>
        )}
      </div>

      {/* Price + Size pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(order.sizes)
          .filter(([, qty]) => qty > 0)
          .map(([sz, qty]) => (
            <span key={sz} className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface/80 border border-border/30 text-muted-foreground font-mono">
              {sz}×{qty}
            </span>
          ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/20">
        <span className="text-sm font-black text-primary">₹{order.totalPrice.toLocaleString()}</span>
        {next && (
          <button
            onClick={() => onMove(order.id, next)}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary border border-primary/30 px-2.5 py-1 rounded-lg hover:bg-primary/10 transition-colors"
          >
            → {STATUS_LABELS[next]}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Production() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => { setOrders(loadOrders()); }, []);

  function handleMove(id: string, status: OrderStatus) {
    updateOrderStatus(id, status);
    setOrders(loadOrders());
  }

  const byStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);
  const overdueCount = orders.filter(isOverdue).length;

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      <Navbar />

      <div className="relative container mx-auto px-6 pt-32 pb-20">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest mb-2">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Step 3 of 4
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Production <span className="text-gradient">Queue</span>
            </h1>
            <p className="text-muted-foreground mt-2">Move orders through production stages. Click the arrow on any card to advance it.</p>
          </div>
          <div className="flex gap-3">
            {overdueCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-400/10 border border-red-400/30 text-red-400 text-sm font-semibold">
                <AlertTriangle className="w-4 h-4" /> {overdueCount} overdue
              </div>
            )}
            <Link to="/orders"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border/40 text-sm font-semibold hover:bg-surface/50 transition-colors">
              + New Order
            </Link>
          </div>
        </div>

        {/* ── Kanban board ── */}
        {orders.length === 0 ? (
          <div className="glass-card rounded-2xl border border-border/30 p-16 text-center">
            <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground">No orders yet.</p>
            <Link to="/orders" className="inline-flex items-center gap-1.5 mt-4 text-primary font-semibold text-sm hover:gap-2 transition-all">
              Create your first order <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const cards = byStatus(col.status);
              return (
                <div key={col.status} className={`glass-card rounded-2xl border border-border/30 border-t-2 ${col.accent} flex flex-col`}>
                  {/* Column header */}
                  <div className="p-4 border-b border-border/20">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-foreground flex items-center gap-2">
                        {col.emoji} {col.label}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[col.status]}`}>
                        {cards.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="p-3 space-y-3 flex-1">
                    {cards.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8 opacity-50">Empty</p>
                    ) : (
                      cards.map((order) => (
                        <OrderCard key={order.id} order={order} onMove={handleMove} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Stats summary ── */}
        {orders.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COLUMNS.map((col) => (
              <div key={col.status} className="glass-card rounded-xl border border-border/30 p-4 text-center">
                <div className="text-2xl font-black text-gradient">{byStatus(col.status).length}</div>
                <div className="text-xs text-muted-foreground mt-1">{col.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Next step ── */}
        <div className="mt-12 glass-card rounded-2xl border border-border/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Next Step</div>
            <div className="font-bold text-foreground">Generate print-ready files with the Plugin</div>
            <div className="text-sm text-muted-foreground">Upload design + player data → auto-generate 50+ files in minutes.</div>
          </div>
          <Link to="/plugin" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all glow-sm shrink-0">
            Open Plugin <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
