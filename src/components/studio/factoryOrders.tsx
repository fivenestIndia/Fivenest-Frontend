import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Plus, Printer, CheckCircle2, Clock, AlertTriangle, ArrowRight, X, 
  FileSpreadsheet, Palette, Cpu, Download, Receipt, Send, Sparkles, User, Truck,
  Scissors, DollarSign, Calendar, Sliders, Trash2, FolderOpen
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
  
  // Order Scope: Full Garment Manufacturing vs Printing Production Only
  orderScope?: 'full-manufacturing' | 'printing-only';
  designCost?: number; // Auto-calculated design/export production cost (minus balance item)

  // Fabric & Styling Specs
  fabricType: string;
  printDetails: string;
  collarType: string;
  collarColor: string;
  handColor: string;
  handStripePiping: string;

  // Factory Stage Statuses
  statusDesign: "Done" | "Pending";
  statusFabric: "Done" | "Pending";
  statusPrint: "Done" | "Pending";
  statusStitch: "Done" | "Pending";

  // Size Grid (Sizes 20 to 50)
  sizeGrid: SizeQtyRow[];

  // Payment Tranches
  advance1: number;
  advance2: number;
  advance3: number;
}

const defaultSizesList = ["20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44", "46", "48", "50"];

interface FactoryOrdersProps {
  onNavigateTab?: (tab: string) => void;
  currentUserEmail?: string;
  orders?: OrderItem[];
  onOrdersChange?: (orders: OrderItem[]) => void;
}

export function FactoryOrders({ 
  onNavigateTab, 
  currentUserEmail,
  orders: externalOrders,
  onOrdersChange
}: FactoryOrdersProps) {
  // User-scoped storage key
  const storageKey = currentUserEmail ? `fivenest_factory_orders_${currentUserEmail}` : 'fivenest_factory_orders_default';

  const [internalOrders, setInternalOrders] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const orders = externalOrders !== undefined ? externalOrders : internalOrders;

  const setOrders = (newOrders: OrderItem[]) => {
    if (onOrdersChange) {
      onOrdersChange(newOrders);
    } else {
      setInternalOrders(newOrders);
    }
  };

  useEffect(() => {
    if (externalOrders === undefined) {
      localStorage.setItem(storageKey, JSON.stringify(internalOrders));
    }
  }, [internalOrders, externalOrders, storageKey]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(orders.length > 0 ? orders[0] : null);
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);

  // New order modal form state
  const [formOrderScope, setFormOrderScope] = useState<'full-manufacturing' | 'printing-only'>('full-manufacturing');
  const [formOrderNo, setFormOrderNo] = useState(`${orders.length + 1}`);
  const [formCustomerName, setFormCustomerName] = useState("");
  const [formDeliveryDate, setFormDeliveryDate] = useState("");
  const [formRate, setFormRate] = useState(320);

  const [formFabric, setFormFabric] = useState("N. Net");
  const [formPrintDetails, setFormPrintDetails] = useState("Full Sublimation");
  const [formCollarType, setFormCollarType] = useState("Ready made");
  const [formCollarColor, setFormCollarColor] = useState("Black");
  const [formHandColor, setFormHandColor] = useState("Printed");
  const [formHandStripe, setFormHandStripe] = useState("Black");

  const [formAdvance1, setFormAdvance1] = useState(0);
  const [formAdvance2, setFormAdvance2] = useState(0);

  const [formSizeGrid, setFormSizeGrid] = useState<SizeQtyRow[]>(
    defaultSizesList.map((sz) => ({ size: sz, halfQty: 0, fullQty: 0 }))
  );

  const printDocketRef = useRef<HTMLDivElement>(null);

  const calculateTotals = (ord: OrderItem) => {
    let totalHalf = 0;
    let totalFull = 0;
    ord.sizeGrid.forEach((row) => {
      totalHalf += Number(row.halfQty || 0);
      totalFull += Number(row.fullQty || 0);
    });
    const totalQty = totalHalf + totalFull;
    const totalOrderValue = totalQty * ord.ratePerPiece;
    const totalAdvanceReceived = Number(ord.advance1 || 0) + Number(ord.advance2 || 0) + Number(ord.advance3 || 0);
    const balanceAmount = totalOrderValue - totalAdvanceReceived;

    return { totalHalf, totalFull, totalQty, totalOrderValue, totalAdvanceReceived, balanceAmount };
  };

  const handlePrintDocket = () => {
    window.print();
  };

  const handleDeleteOrder = (id: string) => {
    if (window.confirm("Are you sure you want to delete this order docket? This action cannot be undone.")) {
      const updated = orders.filter((o) => o.id !== id);
      setOrders(updated);
      if (selectedOrder?.id === id) {
        setSelectedOrder(updated.length > 0 ? updated[0] : null);
      }
    }
  };

  const handleCreateOrder = () => {
    if (!formCustomerName) {
      alert("Please enter customer name");
      return;
    }

    let calcTotalQty = 0;
    formSizeGrid.forEach((row) => {
      calcTotalQty += Number(row.halfQty || 0) + Number(row.fullQty || 0);
    });

    const perPieceRate = Number(formRate || (formOrderScope === 'printing-only' ? 50 : 320));
    const calculatedDesignCost = calcTotalQty * 3;

    const newOrd: OrderItem = {
      id: `ord-${Date.now()}`,
      orderNo: formOrderNo || `${orders.length + 1}`,
      customerName: formCustomerName,
      deliveryDate: formDeliveryDate || "TBD",
      ratePerPiece: perPieceRate,

      orderScope: formOrderScope,
      designCost: calculatedDesignCost,

      fabricType: formOrderScope === 'printing-only' ? 'Paper Sublimation' : formFabric,
      printDetails: formPrintDetails,
      collarType: formOrderScope === 'printing-only' ? 'N/A' : formCollarType,
      collarColor: formOrderScope === 'printing-only' ? 'N/A' : formCollarColor,
      handColor: formOrderScope === 'printing-only' ? 'N/A' : formHandColor,
      handStripePiping: formOrderScope === 'printing-only' ? 'N/A' : formHandStripe,

      statusDesign: "Done",
      statusFabric: "Done",
      statusPrint: "Pending",
      statusStitch: formOrderScope === 'printing-only' ? "Done" : "Pending",

      sizeGrid: formSizeGrid,

      advance1: Number(formAdvance1 || 0),
      advance2: Number(formAdvance2 || 0),
      advance3: 0,
    };

    const updated = [newOrd, ...orders];
    setOrders(updated);
    setSelectedOrder(newOrd);
    setNewOrderModalOpen(false);
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.orderNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans p-2 md:p-4 text-left">
      {/* Top Header & New Order Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Factory Production Dockets</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Complete job docket: fabric, collar styling, sizes 20-50 matrix, production stages & payment tranches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setNewOrderModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>+ New Production Docket</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search dockets by customer or Order No (e.g. Vakratunda, Order #1)..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-white text-xs md:text-sm focus:outline-none focus:border-cyan-400 transition-all"
        />
      </div>

      {/* EMPTY STATE WHEN NO ORDERS EXIST FOR FRESH LOGIN */}
      {orders.length === 0 ? (
        <div className="rounded-3xl p-12 bg-slate-900/40 border border-slate-800 text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
            <FolderOpen size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">Your Production Docket Hub is Clear</h2>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            All your customer order dockets and job cards are securely isolated under your account. Click below to create your first order docket.
          </p>
          <button
            onClick={() => setNewOrderModalOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/30 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus size={18} />
            <span>+ Create First Order Docket</span>
          </button>
        </div>
      ) : (
        /* Main Order Docket Layout */
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left: Orders Selection Cards */}
          <div className="lg:col-span-4 space-y-4">
            {filteredOrders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              const { totalQty, totalOrderValue, balanceAmount } = calculateTotals(ord);

              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 relative group ${
                    isSelected
                      ? "bg-slate-900/90 border-cyan-500/60 shadow-xl shadow-cyan-500/10"
                      : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-bold text-xs bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                        #{ord.orderNo}
                      </span>
                      <h3 className="font-bold text-white text-sm line-clamp-1">{ord.customerName}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-400">{ord.deliveryDate}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrder(ord.id);
                        }}
                        title="Delete Order Docket"
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{totalQty} Jerseys @ ₹{ord.ratePerPiece}/pc</span>
                    <span className="font-black text-white text-sm">₹{totalOrderValue.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400">Fabric: <strong className="text-white">{ord.fabricType}</strong></span>
                    <span className={`font-bold ${balanceAmount === 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      Balance: ₹{balanceAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Exact Factory Production Docket Sheet (Matching User Image) */}
          {selectedOrder && (
            <div className="lg:col-span-8 bg-white text-black p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 border border-slate-300 print:p-0 print:shadow-none font-sans">
              {/* Top Toolbar Action for Printing & Deleting */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-lg font-mono">
                    Order Docket #{selectedOrder.orderNo}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">Exact Factory Job Card Sheet</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                    className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-rose-200"
                  >
                    <Trash2 size={14} />
                    <span>Delete Docket</span>
                  </button>

                  <button
                    onClick={handlePrintDocket}
                    className="px-4 py-2 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>Print Job Docket Sheet</span>
                  </button>
                </div>
              </div>

              {/* EXACT SPREADSHEET TABLE LAYOUT WITH PERFECT ALIGNMENT & FONT SPACING */}
              <div ref={printDocketRef} className="space-y-4 text-xs font-sans text-black">
                {/* Header Table */}
                <table className="w-full border-collapse border-2 border-black text-left">
                  <tbody>
                    <tr className="border-b border-black font-bold">
                      <td className="p-2.5 border-r border-black w-24 bg-gray-100 uppercase tracking-wider text-[11px]">Order NO</td>
                      <td className="p-2.5 border-r border-black font-black text-base uppercase tracking-tight" colSpan={2}>
                        {selectedOrder.customerName}
                      </td>
                      <td className="p-2.5 border-r border-black w-32 bg-gray-100 uppercase tracking-wider text-[11px]">Delivery Date</td>
                      <td className="p-2.5 w-28 font-bold text-center text-sm">{selectedOrder.deliveryDate}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-2.5 border-r border-black font-black text-center bg-gray-100 text-sm">{selectedOrder.orderNo}</td>
                      <td className="p-2.5 border-r border-black font-bold" colSpan={2}>CUSTOMER NAME: {selectedOrder.customerName}</td>
                      <td className="p-2.5 border-r border-black bg-gray-100 font-bold uppercase tracking-wider text-right">Rate</td>
                      <td className="p-2.5 font-black text-center text-base">₹{selectedOrder.ratePerPiece}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Main 2-Column Section: Left (Order Details + Status + Payments), Right (Quantity Details Size Table) */}
                <div className="grid grid-cols-12 gap-0 border-2 border-black">
                  {/* LEFT SECTION (7 Cols): ORDER DETAILS + STATUS + PAYMENT DETAILS */}
                  <div className="col-span-7 border-r-2 border-black flex flex-col justify-between">
                    {/* 1. ORDER DETAILS TABLE */}
                    <div>
                      <div className="bg-gray-200 p-2.5 font-black uppercase tracking-wider text-center border-b border-black text-xs">
                        ORDER DETAILS
                      </div>
                      <table className="w-full border-collapse text-left text-xs">
                        <tbody>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 border-r border-black w-8 text-center font-bold">1</td>
                            <td className="p-2 border-r border-black font-bold w-40">Fabric</td>
                            <td className="p-2 font-bold text-slate-900">{selectedOrder.fabricType}</td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 border-r border-black w-8 text-center font-bold">2</td>
                            <td className="p-2 border-r border-black font-bold">Print details</td>
                            <td className="p-2 font-bold text-slate-900">{selectedOrder.printDetails}</td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 border-r border-black w-8 text-center font-bold">3</td>
                            <td className="p-2 border-r border-black font-bold">Collar Type</td>
                            <td className="p-2 font-bold text-slate-900">{selectedOrder.collarType}</td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 border-r border-black w-8 text-center font-bold">4</td>
                            <td className="p-2 border-r border-black font-bold">Collar color</td>
                            <td className="p-2 font-bold text-slate-900">{selectedOrder.collarColor}</td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 border-r border-black w-8 text-center font-bold">5</td>
                            <td className="p-2 border-r border-black font-bold">Hand color</td>
                            <td className="p-2 font-bold text-slate-900">{selectedOrder.handColor}</td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="p-2 border-r border-black w-8 text-center font-bold">6</td>
                            <td className="p-2 border-r border-black font-bold">Hand stripe or piping</td>
                            <td className="p-2 font-bold text-slate-900">{selectedOrder.handStripePiping}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* 2. ORDER STATUS TABLE */}
                      <div className="bg-gray-200 p-2.5 font-black uppercase tracking-wider text-center border-t border-b border-black text-xs">
                        ORDER STATUS
                      </div>
                      <table className="w-full border-collapse text-left text-xs">
                        <tbody>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 border-r border-black w-8 text-center font-bold">1</td>
                            <td className="p-2 border-r border-black font-bold w-40">Design</td>
                            <td className="p-2 font-bold">
                              <span className={selectedOrder.statusDesign === "Done" ? "text-emerald-700 font-extrabold" : "text-amber-700"}>
                                {selectedOrder.statusDesign}
                              </span>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 border-r border-black w-8 text-center font-bold">2</td>
                            <td className="p-2 border-r border-black font-bold">Fabric</td>
                            <td className="p-2 font-bold">
                              <span className={selectedOrder.statusFabric === "Done" ? "text-emerald-700 font-extrabold" : "text-amber-700"}>
                                {selectedOrder.statusFabric}
                              </span>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 border-r border-black w-8 text-center font-bold">3</td>
                            <td className="p-2 border-r border-black font-bold">Print</td>
                            <td className="p-2 font-bold">
                              <span className={selectedOrder.statusPrint === "Done" ? "text-emerald-700 font-extrabold" : "text-amber-700"}>
                                {selectedOrder.statusPrint}
                              </span>
                            </td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="p-2 border-r border-black w-8 text-center font-bold">4</td>
                            <td className="p-2 border-r border-black font-bold">Stitch</td>
                            <td className="p-2 font-bold">
                              <span className={selectedOrder.statusStitch === "Done" ? "text-emerald-700 font-extrabold" : "text-amber-700"}>
                                {selectedOrder.statusStitch}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 3. PAYMENT DETAILS TABLE */}
                    <div>
                      <div className="bg-gray-200 p-2.5 font-black uppercase tracking-wider text-center border-t border-b border-black text-xs">
                        PAYMENT DETAILS
                      </div>
                      <table className="w-full border-collapse text-left text-xs">
                        <tbody>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 border-r border-black w-8 text-center font-bold">1</td>
                            <td className="p-2 border-r border-black font-bold w-48">Advance payment 1</td>
                            <td className="p-2 font-black text-emerald-600 text-right text-sm">
                              {selectedOrder.advance1 ? selectedOrder.advance1.toLocaleString("en-IN") : ""}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 border-r border-black w-8 text-center font-bold">2</td>
                            <td className="p-2 border-r border-black font-bold">Advance payment 2</td>
                            <td className="p-2 font-black text-right text-sm">
                              {selectedOrder.advance2 ? selectedOrder.advance2.toLocaleString("en-IN") : ""}
                            </td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="p-2 border-r border-black w-8 text-center font-bold">3</td>
                            <td className="p-2 border-r border-black font-bold">Advance payment 3</td>
                            <td className="p-2 font-black text-right text-sm">
                              {selectedOrder.advance3 ? selectedOrder.advance3.toLocaleString("en-IN") : ""}
                            </td>
                          </tr>
                          <tr className="border-b border-black bg-gray-100 font-bold">
                            <td className="p-2.5 border-r border-black font-black uppercase tracking-wider" colSpan={2}>TOTAL AMOUNT</td>
                            <td className="p-2.5 font-black text-right text-base">
                              ₹{calculateTotals(selectedOrder).totalAdvanceReceived.toLocaleString("en-IN")}
                            </td>
                          </tr>
                          <tr className="font-bold bg-gray-50">
                            <td className="p-2.5 border-r border-black font-black uppercase tracking-wider" colSpan={2}>Balance Amount</td>
                            <td className={`p-2.5 font-black text-right text-base ${calculateTotals(selectedOrder).balanceAmount === 0 ? "text-emerald-700" : "text-red-600"}`}>
                              ₹{calculateTotals(selectedOrder).balanceAmount.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* RIGHT SECTION (5 Cols): QUANTITY DETAILS (SIZES 20 to 50 MATRIX) */}
                  <div className="col-span-5 flex flex-col justify-between">
                    <div>
                      <div className="bg-gray-200 p-2.5 font-black uppercase tracking-wider text-center border-b border-black text-xs">
                        Quantity Details
                      </div>
                      <table className="w-full border-collapse text-center text-xs">
                        <thead>
                          <tr className="border-b border-black font-bold bg-gray-100">
                            <th className="p-2 border-r border-black w-1/3 uppercase">Size</th>
                            <th className="p-2 border-r border-black w-1/3 uppercase">Half</th>
                            <th className="p-2 w-1/3 uppercase">Full</th>
                          </tr>
                        </thead>
                        <tbody>
                          {defaultSizesList.map((sz) => {
                            const matchingRow = selectedOrder.sizeGrid.find((r) => r.size === sz);
                            const half = matchingRow?.halfQty || 0;
                            const full = matchingRow?.fullQty || 0;
                            return (
                              <tr key={sz} className="border-b border-gray-300">
                                <td className="p-1.5 border-r border-black font-bold bg-gray-50 text-slate-800">{sz}</td>
                                <td className="p-1.5 border-r border-black font-extrabold text-slate-900">{half > 0 ? half : ""}</td>
                                <td className="p-1.5 font-extrabold text-slate-900">{full > 0 ? full : ""}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Quantity Totals Footer */}
                    <div className="border-t-2 border-black bg-gray-100">
                      <div className="flex border-b border-black font-bold text-center">
                        <div className="w-1/3 p-2 border-r border-black uppercase font-black">Total</div>
                        <div className="w-1/3 p-2 border-r border-black font-black text-base">
                          {calculateTotals(selectedOrder).totalHalf || 0}
                        </div>
                        <div className="w-1/3 p-2 font-black text-base">
                          {calculateTotals(selectedOrder).totalFull || 0}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 font-black text-sm uppercase">
                        <span>Total Quantity</span>
                        <span className="text-base font-black bg-black text-white px-3 py-1 rounded">
                          {calculateTotals(selectedOrder).totalQty}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NEW ORDER MODAL DOCKET CREATION */}
      <AnimatePresence>
        {newOrderModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full text-white space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h2 className="text-xl font-black">Create New Production Docket Sheet</h2>
                <button
                  onClick={() => setNewOrderModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="block text-slate-300 font-bold">SELECT ORDER PRODUCTION SCOPE</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormOrderScope('full-manufacturing')}
                      className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        formOrderScope === 'full-manufacturing'
                          ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>🏭 Full Garment Manufacturing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormOrderScope('printing-only')}
                      className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        formOrderScope === 'printing-only'
                          ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>🖨️ Printing Production Only</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Order NO</label>
                  <input
                    type="text"
                    value={formOrderNo}
                    onChange={(e) => setFormOrderNo(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">CUSTOMER NAME *</label>
                  <input
                    type="text"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="e.g. Vakratunda Musical Group"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Delivery Date</label>
                  <input
                    type="text"
                    value={formDeliveryDate}
                    onChange={(e) => setFormDeliveryDate(e.target.value)}
                    placeholder="DD-MM-YY (e.g. 14-04-26)"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Rate per pc (₹)</label>
                  <input
                    type="number"
                    value={formRate}
                    onChange={(e) => setFormRate(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Fabric Type</label>
                  <input
                    type="text"
                    value={formFabric}
                    onChange={(e) => setFormFabric(e.target.value)}
                    placeholder="N. Net, Micro Poly, Spandex"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Print Details</label>
                  <input
                    type="text"
                    value={formPrintDetails}
                    onChange={(e) => setFormPrintDetails(e.target.value)}
                    placeholder="Full Sublimation, Front Only"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Collar Type</label>
                  <input
                    type="text"
                    value={formCollarType}
                    onChange={(e) => setFormCollarType(e.target.value)}
                    placeholder="Ready made, Chinese Collar, V-Neck"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Collar Color</label>
                  <input
                    type="text"
                    value={formCollarColor}
                    onChange={(e) => setFormCollarColor(e.target.value)}
                    placeholder="Black, Navy, White"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Hand/Sleeve Color</label>
                  <input
                    type="text"
                    value={formHandColor}
                    onChange={(e) => setFormHandColor(e.target.value)}
                    placeholder="Printed, Solid Black"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Hand Stripe / Piping</label>
                  <input
                    type="text"
                    value={formHandStripe}
                    onChange={(e) => setFormHandStripe(e.target.value)}
                    placeholder="Black Piping, White Stripe"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Advance Payment 1 (₹)</label>
                  <input
                    type="number"
                    value={formAdvance1}
                    onChange={(e) => setFormAdvance1(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 outline-none focus:border-cyan-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Advance Payment 2 (₹)</label>
                  <input
                    type="number"
                    value={formAdvance2}
                    onChange={(e) => setFormAdvance2(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400 font-bold"
                  />
                </div>
              </div>

              {/* Size Grid Quantity Matrix */}
              <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
                <span className="block font-bold text-white">Size-Wise Quantity Matrix (Sizes 20 to 50)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-2xl border border-slate-800">
                  {formSizeGrid.map((row, idx) => (
                    <div key={row.size} className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="font-bold text-cyan-400 block text-center">Size {row.size}</span>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          placeholder="Half"
                          value={row.halfQty || ""}
                          onChange={(e) => {
                            const updated = [...formSizeGrid];
                            updated[idx].halfQty = Number(e.target.value);
                            setFormSizeGrid(updated);
                          }}
                          className="w-1/2 p-1 text-center bg-slate-950 border border-slate-700 rounded text-[11px] text-white"
                        />
                        <input
                          type="number"
                          placeholder="Full"
                          value={row.fullQty || ""}
                          onChange={(e) => {
                            const updated = [...formSizeGrid];
                            updated[idx].fullQty = Number(e.target.value);
                            setFormSizeGrid(updated);
                          }}
                          className="w-1/2 p-1 text-center bg-slate-950 border border-slate-700 rounded text-[11px] text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => setNewOrderModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreateOrder}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25"
                >
                  Save & Generate Production Docket
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
