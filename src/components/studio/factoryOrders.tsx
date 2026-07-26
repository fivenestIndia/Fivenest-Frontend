import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Plus, Filter, CheckCircle2, Clock, AlertTriangle, ArrowRight, X, 
  FileSpreadsheet, Palette, Cpu, Download, Receipt, Send, Sparkles, User, Truck
} from "lucide-react";

export interface OrderItem {
  id: string;
  orderNum: string;
  customerName: string;
  jerseysCount: number;
  status: "printing" | "pending" | "completed" | "generating";
  statusText: string;
  dueDate: string;
  totalAmount: number;
  advancePaid: number;
  csvUploaded: boolean;
  artworkApproved: boolean;
  templateName: string;
}

const sampleOrders: OrderItem[] = [
  {
    id: "ord-5412",
    orderNum: "#5412",
    customerName: "ABC Sports Manufacturers",
    jerseysCount: 200,
    status: "printing",
    statusText: "Printing",
    dueDate: "Due Tomorrow",
    totalAmount: 24000,
    advancePaid: 10000,
    csvUploaded: true,
    artworkApproved: true,
    templateName: "Cricket Pro 2026",
  },
  {
    id: "ord-5413",
    orderNum: "#5413",
    customerName: "School Tournament League",
    jerseysCount: 120,
    status: "pending",
    statusText: "Approval Pending",
    dueDate: "Due Jul 28",
    totalAmount: 14400,
    advancePaid: 5000,
    csvUploaded: true,
    artworkApproved: false,
    templateName: "Football Striker",
  },
  {
    id: "ord-5414",
    orderNum: "#5414",
    customerName: "Mumbai Club Apparel",
    jerseysCount: 300,
    status: "completed",
    statusText: "Completed",
    dueDate: "Completed Today",
    totalAmount: 36000,
    advancePaid: 36000,
    csvUploaded: true,
    artworkApproved: true,
    templateName: "Kabaddi Champion",
  },
  {
    id: "ord-5415",
    orderNum: "#5415",
    customerName: "Delhi Academy Sports",
    jerseysCount: 85,
    status: "generating",
    statusText: "Generating...",
    dueDate: "Due Jul 29",
    totalAmount: 10200,
    advancePaid: 3000,
    csvUploaded: true,
    artworkApproved: true,
    templateName: "Basketball Slam",
  },
];

interface FactoryOrdersProps {
  onNavigateTab?: (tab: string) => void;
}

export function FactoryOrders({ onNavigateTab }: FactoryOrdersProps) {
  const [orders, setOrders] = useState<OrderItem[]>(sampleOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "printing" | "pending" | "completed">("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(sampleOrders[0]);

  const filteredOrders = orders.filter((ord) => {
    const matchesFilter = activeFilter === "all" || ord.status === activeFilter;
    const matchesSearch =
      ord.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.orderNum.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans p-2 md:p-4 text-left">
      {/* Top Header & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Factory Orders Hub</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">Order-centric management: artwork, CSV, production, and invoices in one view.</p>
        </div>

        <button
          onClick={() => {
            const newOrd: OrderItem = {
              id: `ord-${Date.now()}`,
              orderNum: `#${Math.floor(5400 + Math.random() * 100)}`,
              customerName: "New Factory Client",
              jerseysCount: 100,
              status: "pending",
              statusText: "Approval Pending",
              dueDate: "Due Tomorrow",
              totalAmount: 12000,
              advancePaid: 4000,
              csvUploaded: false,
              artworkApproved: false,
              templateName: "Cricket Pro 2026",
            };
            setOrders([newOrd, ...orders]);
            setSelectedOrder(newOrd);
          }}
          className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>+ New Order</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders by customer or order # (e.g. ABC Sports, #5412)..."
            className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-white text-xs md:text-sm focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "all", label: "All Orders" },
            { id: "printing", label: "Printing" },
            { id: "pending", label: "Approval Pending" },
            { id: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === tab.id
                  ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order List & Order Details Unified View */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Order Cards List */}
        <div className="lg:col-span-6 space-y-4">
          {filteredOrders.map((ord) => {
            const isSelected = selectedOrder?.id === ord.id;
            return (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? "bg-slate-900/90 border-cyan-500/60 shadow-xl shadow-cyan-500/10"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-cyan-400 font-bold text-sm bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                      {ord.orderNum}
                    </span>
                    <h3 className="font-bold text-white text-base">{ord.customerName}</h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      ord.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : ord.status === "printing"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                        : ord.status === "generating"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {ord.statusText}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>{ord.jerseysCount} Jerseys · Template: {ord.templateName}</span>
                  <span className="font-black text-white text-sm">₹{ord.totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Details Single Unified View Panel */}
        {selectedOrder && (
          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-cyan-500/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-mono font-black text-cyan-400">{selectedOrder.orderNum}</span>
                  <h2 className="text-xl font-black text-white">{selectedOrder.customerName}</h2>
                </div>
                <span className="text-xs text-slate-400">{selectedOrder.jerseysCount} Jerseys · {selectedOrder.dueDate}</span>
              </div>

              {/* PRIMARY AI ACTION BUTTON (PURPLE) */}
              <button
                onClick={() => {
                  alert(`AI Nesting & 300 DPI Export initiated for Order ${selectedOrder.orderNum}`);
                  if (onNavigateTab) onNavigateTab("printQueue");
                }}
                className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-purple-500/30 transition-all cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Generate Files (AI)</span>
              </button>
            </div>

            {/* Unified Order Specs Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Customer CRM</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <User size={14} className="text-cyan-400" />
                  {selectedOrder.customerName}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Artwork Status</span>
                <span className={`font-bold flex items-center gap-1.5 ${selectedOrder.artworkApproved ? "text-emerald-400" : "text-amber-400"}`}>
                  <Palette size={14} />
                  {selectedOrder.artworkApproved ? "Approved ✓" : "Pending Review"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Roster CSV File</span>
                <span className={`font-bold flex items-center gap-1.5 ${selectedOrder.csvUploaded ? "text-emerald-400" : "text-amber-400"}`}>
                  <FileSpreadsheet size={14} />
                  {selectedOrder.csvUploaded ? "Uploaded ✓" : "Missing CSV"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Selected Pattern</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Cpu size={14} className="text-purple-400" />
                  {selectedOrder.templateName}
                </span>
              </div>
            </div>

            {/* Payment & Invoice Summary */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Total Order Value:</span>
                <span className="font-bold text-white">₹{selectedOrder.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Advance Paid:</span>
                <span className="font-bold text-emerald-400">₹{selectedOrder.advancePaid.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800">
                <span className="font-bold text-white">Remaining Balance:</span>
                <span className="font-black text-amber-400 text-sm">
                  ₹{(selectedOrder.totalAmount - selectedOrder.advancePaid).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Secondary Actions Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  alert(`Invoice Payment link sent for Order ${selectedOrder.orderNum}`);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send size={14} className="text-cyan-400" />
                <span>Send Invoice Link</span>
              </button>

              <button
                onClick={() => {
                  alert(`Downloading ready files for Order ${selectedOrder.orderNum}`);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download size={14} className="text-emerald-400" />
                <span>Download ZIP</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
