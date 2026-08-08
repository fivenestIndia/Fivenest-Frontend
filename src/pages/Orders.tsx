import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Search, Trash2, ArrowRight, X, ChevronDown,
  ClipboardList, User, Phone, Calendar, Tag, Layers
} from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  loadOrders, createOrder, deleteOrder, updateOrderStatus,
  type Order, type OrderStatus, STATUS_LABELS, STATUS_COLORS,
} from "@/lib/orders";

const SPORTS = ["Football", "Cricket", "Kabaddi", "Basketball", "Hockey", "Esports", "Other"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const STATUS_OPTS: { val: OrderStatus | "all"; label: string }[] = [
  { val: "all", label: "All Orders" },
  { val: "new", label: "New" },
  { val: "production", label: "In Production" },
  { val: "ready", label: "Ready" },
  { val: "delivered", label: "Delivered" },
];

const emptyForm = {
  customer: "", phone: "", sport: "Football", design: "", colors: "", notes: "",
  deadline: "", pricePerPiece: 0,
  sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  useEffect(() => { setOrders(loadOrders()); }, []);

  const refresh = () => setOrders(loadOrders());

  /* ── filtered list ── */
  const visible = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.customer.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.design.toLowerCase().includes(q);
    }
    return true;
  });

  /* ── form helpers ── */
  const totalQty = Object.values(form.sizes).reduce((a, b) => a + b, 0);
  const totalPrice = totalQty * form.pricePerPiece;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer.trim()) { setFormError("Customer name is required."); return; }
    if (!form.design.trim()) { setFormError("Design reference is required."); return; }
    if (totalQty === 0) { setFormError("Add at least 1 jersey in sizes."); return; }
    if (!form.deadline) { setFormError("Deadline is required."); return; }
    setFormError("");
    createOrder({ ...form, sizes: form.sizes as Order["sizes"] });
    setForm(emptyForm);
    setShowForm(false);
    refresh();
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this order?")) return;
    deleteOrder(id);
    refresh();
  }

  function handleStatusChange(id: string, status: OrderStatus) {
    updateOrderStatus(id, status);
    refresh();
  }

  const isOverdue = (deadline: string) => deadline && new Date(deadline) < new Date() ? true : false;

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      <Navbar />

      <div className="relative container mx-auto px-6 pt-32 pb-20">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest mb-2">
              <ClipboardList className="w-3.5 h-3.5 text-primary" />
              Step 2 of 4
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Order <span className="text-gradient">Management</span>
            </h1>
            <p className="text-muted-foreground mt-2">Record customer orders, track quantities and deadlines.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all glow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> New Order
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, order ID, design…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface/60 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 backdrop-blur"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTS.map((s) => (
              <button
                key={s.val}
                onClick={() => setFilter(s.val)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  filter === s.val
                    ? "bg-primary text-primary-foreground border-primary glow-sm"
                    : "glass-card border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Orders table ── */}
        {visible.length === 0 ? (
          <div className="glass-card rounded-2xl border border-border/30 p-16 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground">No orders yet. Click <strong className="text-foreground">New Order</strong> to create your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border/30">
            <table className="w-full text-sm">
              <thead>
                <tr className="glass border-b border-border/30">
                  {["Order ID", "Customer", "Sport", "Design", "Qty", "Deadline", "Status", "Total", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((o, i) => (
                  <tr key={o.id} className={`border-b border-border/20 transition-colors hover:bg-surface/30 ${i % 2 === 0 ? "bg-surface/10" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.id}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{o.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.sport}</td>
                    <td className="px-4 py-3 max-w-[120px] truncate text-muted-foreground">{o.design}</td>
                    <td className="px-4 py-3 font-bold text-foreground">{o.totalQty}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-xs font-semibold ${isOverdue(o.deadline) && o.status !== "delivered" ? "text-red-400" : "text-muted-foreground"}`}>
                      {o.deadline || "—"}{isOverdue(o.deadline) && o.status !== "delivered" ? " ⚠" : ""}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative group inline-block">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${STATUS_COLORS[o.status]}`}>
                          {STATUS_LABELS[o.status]} <ChevronDown className="w-3 h-3" />
                        </span>
                        <div className="absolute top-full left-0 mt-1 glass-card border border-border/40 rounded-xl overflow-hidden z-20 min-w-[140px] hidden group-hover:block shadow-2xl">
                          {(["new", "production", "ready", "delivered"] as OrderStatus[]).map((st) => (
                            <button key={st} onClick={() => handleStatusChange(o.id, st)}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-surface/50 transition-colors ${o.status === st ? "text-primary" : "text-muted-foreground"}`}>
                              {STATUS_LABELS[st]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">₹{o.totalPrice.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to="/production" title="View in Production" className="text-muted-foreground hover:text-primary transition-colors"><ArrowRight className="w-4 h-4" /></Link>
                        <button onClick={() => handleDelete(o.id)} title="Delete" className="text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Summary footer ── */}
        {orders.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>{orders.length} total orders</span>
            <span>·</span>
            <span>{orders.filter(o => o.status === "new").length} new</span>
            <span>·</span>
            <span>{orders.filter(o => o.status === "production").length} in production</span>
            <span>·</span>
            <span className="text-primary font-semibold">
              ₹{orders.reduce((a, o) => a + o.totalPrice, 0).toLocaleString()} total value
            </span>
          </div>
        )}

        {/* ── Next step ── */}
        <div className="mt-12 glass-card rounded-2xl border border-border/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Next Step</div>
            <div className="font-bold text-foreground">View your orders in the Production Queue</div>
            <div className="text-sm text-muted-foreground">Track each order through production stages.</div>
          </div>
          <Link to="/production" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all glow-sm shrink-0">
            Production Queue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── New Order Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
          <div className="w-full max-w-2xl glass border border-border/40 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <h2 className="text-xl font-black">New Order</h2>
              <button onClick={() => { setShowForm(false); setFormError(""); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><User className="w-3.5 h-3.5" /> Customer Name *</label>
                  <input value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} placeholder="e.g. Rahul Singh"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface/60 border border-border/40 text-sm focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Phone className="w-3.5 h-3.5" /> Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface/60 border border-border/40 text-sm focus:outline-none focus:border-primary/50" />
                </div>
              </div>

              {/* Sport + Design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Layers className="w-3.5 h-3.5" /> Sport</label>
                  <select value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface/60 border border-border/40 text-sm focus:outline-none focus:border-primary/50">
                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Tag className="w-3.5 h-3.5" /> Design Reference *</label>
                  <input value={form.design} onChange={e => setForm(f => ({ ...f, design: e.target.value }))} placeholder="e.g. FC-Football-Blue-001"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface/60 border border-border/40 text-sm focus:outline-none focus:border-primary/50" />
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Sizes & Quantities *</label>
                <div className="grid grid-cols-6 gap-2">
                  {SIZES.map(sz => (
                    <div key={sz} className="text-center">
                      <div className="text-xs text-muted-foreground mb-1 font-semibold">{sz}</div>
                      <input
                        type="number" min={0} value={form.sizes[sz]}
                        onChange={e => setForm(f => ({ ...f, sizes: { ...f.sizes, [sz]: Number(e.target.value) } }))}
                        className="w-full px-2 py-2 rounded-lg bg-surface/60 border border-border/40 text-sm text-center focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">Total: <strong className="text-foreground">{totalQty} jerseys</strong></div>
              </div>

              {/* Colors + Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Colors / Custom Notes</label>
                  <input value={form.colors} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))} placeholder="e.g. Red & Black, name on back"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface/60 border border-border/40 text-sm focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Price Per Jersey (₹)</label>
                  <input type="number" min={0} value={form.pricePerPiece} onChange={e => setForm(f => ({ ...f, pricePerPiece: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface/60 border border-border/40 text-sm focus:outline-none focus:border-primary/50" />
                </div>
              </div>

              {/* Deadline + Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Calendar className="w-3.5 h-3.5" /> Deadline *</label>
                  <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface/60 border border-border/40 text-sm focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Internal Notes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions…"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface/60 border border-border/40 text-sm focus:outline-none focus:border-primary/50" />
                </div>
              </div>

              {/* Total */}
              {totalQty > 0 && totalPrice > 0 && (
                <div className="glass-card rounded-xl p-4 border border-primary/20 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{totalQty} jerseys × ₹{form.pricePerPiece}</span>
                  <span className="text-lg font-black text-gradient">Total: ₹{totalPrice.toLocaleString()}</span>
                </div>
              )}

              {formError && <p className="text-sm text-red-400 font-semibold">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setFormError(""); }}
                  className="flex-1 px-4 py-3 rounded-xl border border-border/40 text-sm font-semibold hover:bg-surface/50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all glow-sm">
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
