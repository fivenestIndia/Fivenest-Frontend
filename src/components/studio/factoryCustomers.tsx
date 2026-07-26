import { useState } from "react";
import { User, Phone, MapPin, FileText, Image, Type, History, Plus, Search, CheckCircle2, ChevronRight } from "lucide-react";

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

const sampleCustomers: CustomerMemory[] = [
  {
    id: "cust-1",
    name: "ABC Sports Manufacturers",
    phone: "+91 98765 43210",
    address: "Industrial Area Phase 2, Ludhiana, Punjab",
    gstin: "03AAAAA0000A1Z5",
    sponsorName: "RedBull Sports",
    preferredFont: "Jersey M54 (Sport Bold)",
    favoriteCollar: "V-Neck Ribbed",
    favoriteSleeve: "Half Sleeve Raglan",
    ordersCount: 14,
    totalSpent: 168000,
  },
  {
    id: "cust-2",
    name: "RR Cricket Club",
    phone: "+91 91234 56789",
    address: "Civil Lines, Jaipur, Rajasthan",
    gstin: "08BBBBB1111B1Z2",
    sponsorName: "Hero MotoCorp",
    preferredFont: "Montserrat Bold",
    favoriteCollar: "Chinese Mandarin Collar",
    favoriteSleeve: "Full Sleeve Regular",
    ordersCount: 8,
    totalSpent: 96000,
  },
  {
    id: "cust-3",
    name: "Delhi Warriors Academy",
    phone: "+91 99887 76655",
    address: "Dwarka Sector 10, New Delhi",
    gstin: "07CCCCC2222C1Z9",
    sponsorName: "Amul Sports",
    preferredFont: "Impact Heavy",
    favoriteCollar: "Round Neck",
    favoriteSleeve: "Half Sleeve Regular",
    ordersCount: 22,
    totalSpent: 264000,
  },
];

export function FactoryCustomers() {
  const [customers, setCustomers] = useState<CustomerMemory[]>(sampleCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMemory | null>(sampleCustomers[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.gstin.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              phone: "+91 90000 00000",
              address: "Sportswear Market, Surat",
              gstin: "24DDDDD3333D1Z4",
              sponsorName: "Local Sponsor",
              preferredFont: "Montserrat Bold",
              favoriteCollar: "V-Neck",
              favoriteSleeve: "Half Sleeve",
              ordersCount: 1,
              totalSpent: 12000,
            };
            setCustomers([newCust, ...customers]);
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

      {/* Main Layout: Customer List & Customer Detail Card */}
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

                <div className="text-right">
                  <div className="text-sm font-black text-emerald-400">₹{c.totalSpent.toLocaleString("en-IN")}</div>
                  <ChevronRight size={16} className="text-slate-500 ml-auto mt-1" />
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

            <div className="pt-2">
              <button
                onClick={() => {
                  alert(`Re-ordering for ${selectedCustomer.name} initiated with saved memory!`);
                }}
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
              >
                <span>Re-Order for {selectedCustomer.name} with Saved Memory</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
