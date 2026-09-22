import { useState, useEffect } from "react";
import { User, Phone, MapPin, FileText, Image, Type, History, Plus, Search, CheckCircle2, ChevronRight, FolderOpen, Trash2 } from "lucide-react";

export interface CustomerMemory {
  id: string;
  name: string;
  phone: string;
  address: string;
  gstin: string;
  logoUrl?: string;
  sponsorName: string;
  preferredFont: string;
  favoriteCollar: string;
  favoriteSleeve: string;
  ordersCount: number;
  totalSpent: number;
}

interface FactoryCustomersProps {
  currentUserEmail?: string;
}

export function FactoryCustomers({ currentUserEmail }: FactoryCustomersProps) {
  const storageKey = currentUserEmail ? `fivenest_factory_customers_${currentUserEmail}` : 'fivenest_factory_customers_default';

  const [customers, setCustomers] = useState<CustomerMemory[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Clean default state for fresh logins
    return [];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(customers));
  }, [customers, storageKey]);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMemory | null>(customers.length > 0 ? customers[0] : null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.gstin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm("Delete this customer memory profile?")) {
      const updated = customers.filter((c) => c.id !== id);
      setCustomers(updated);
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(updated.length > 0 ? updated[0] : null);
      }
    }
  };

  return (
    <div className="space-y-6 font-sans p-2 md:p-4 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Customer Memory CRM</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">Stores factory memory: Logos, sponsors, fonts, GST & order history for automatic re-orders.</p>
        </div>

        <button
          onClick={() => {
            const newCust: CustomerMemory = {
              id: `cust-${Date.now()}`,
              name: "New Sports Client",
              phone: "+91 98765 43210",
              address: "Sportswear Market, Ludhiana",
              gstin: "03AAAAA0000A1Z5",
              sponsorName: "Sponsor Graphic",
              preferredFont: "Jersey M54",
              favoriteCollar: "V-Neck",
              favoriteSleeve: "Half Sleeve",
              ordersCount: 1,
              totalSpent: 12000,
            };
            const updated = [newCust, ...customers];
            setCustomers(updated);
            setSelectedCustomer(newCust);
          }}
          className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>+ Add Customer Memory</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customer memory by name, phone, or GST..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-white text-xs md:text-sm focus:outline-none focus:border-cyan-400 transition-all"
        />
      </div>

      {/* EMPTY STATE FOR FRESH LOGINS */}
      {customers.length === 0 ? (
        <div className="rounded-3xl p-12 bg-slate-900/40 border border-slate-800 text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
            <FolderOpen size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">No Customer Memory Profiles Saved</h2>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Store your customers' logos, preferred fonts, collar styles, and delivery addresses here for automatic 1-click re-orders.
          </p>
        </div>
      ) : (
        /* Main Layout: Customer List & Customer Detail Card */
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Customer List */}
          <div className="lg:col-span-5 space-y-4">
            {filteredCustomers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-slate-900/90 border-cyan-500/60 shadow-xl shadow-cyan-500/10"
                      : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-white text-base">{c.name}</h3>
                    <div className="text-xs text-slate-400 mt-1">{c.phone} · {c.ordersCount} Past Orders</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-400">₹{c.totalSpent.toLocaleString("en-IN")}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomer(c.id);
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Customer Memory Detail Panel */}
          {selectedCustomer && (
            <div className="lg:col-span-7 rounded-3xl bg-slate-900/90 border border-cyan-500/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedCustomer.name}</h2>
                  <span className="text-xs text-cyan-400 font-bold">Memory Vault Saved ✓</span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Lifetime Value</span>
                  <span className="text-2xl font-black text-emerald-400">₹{selectedCustomer.totalSpent.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Customer Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">Phone Number</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Phone size={14} className="text-cyan-400" />
                    {selectedCustomer.phone}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">GSTIN Number</span>
                  <span className="font-mono font-bold text-white flex items-center gap-1.5">
                    <FileText size={14} className="text-purple-400" />
                    {selectedCustomer.gstin}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">Sponsor Brand</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Image size={14} className="text-amber-400" />
                    {selectedCustomer.sponsorName}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">Preferred Sports Font</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Type size={14} className="text-blue-400" />
                    {selectedCustomer.preferredFont}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold block mb-1">Delivery Address</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <MapPin size={14} className="text-emerald-400 flex-shrink-0" />
                  {selectedCustomer.address}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
