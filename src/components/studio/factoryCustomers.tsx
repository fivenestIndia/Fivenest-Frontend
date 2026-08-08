import { useState, useEffect } from "react";
import { User, Phone, MapPin, FileText, Image, Type, History, Plus, Search, CheckCircle2, ChevronRight, FolderOpen, Trash2, Edit3, X, Save, Upload } from "lucide-react";

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
    return [
      {
        id: 'cust-1',
        name: "Shirke Sports Wear",
        phone: "+91 97733 58920",
        address: "Industrial Area Phase 2, Ludhiana, Punjab",
        gstin: "03AAAAA0000A1Z5",
        sponsorName: "MAPL Sports",
        preferredFont: "Jersey M54 Bold",
        favoriteCollar: "Sublimation V-Neck",
        favoriteSleeve: "Half Sleeve",
        ordersCount: 5,
        totalSpent: 45000,
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(customers));
  }, [customers, storageKey]);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMemory | null>(customers.length > 0 ? customers[0] : null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<CustomerMemory>>({});

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

  const handleOpenEdit = (customer?: CustomerMemory) => {
    if (customer) {
      setEditFormData({ ...customer });
    } else {
      setEditFormData({
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
        logoUrl: ''
      });
    }
    setEditModalOpen(true);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCustomer = () => {
    if (!editFormData.name?.trim()) {
      alert("Please enter a customer name.");
      return;
    }

    const finalData: CustomerMemory = {
      id: editFormData.id || `cust-${Date.now()}`,
      name: editFormData.name || "Client",
      phone: editFormData.phone || "",
      address: editFormData.address || "",
      gstin: editFormData.gstin || "",
      logoUrl: editFormData.logoUrl || "",
      sponsorName: editFormData.sponsorName || "Default Sponsor",
      preferredFont: editFormData.preferredFont || "Standard Font",
      favoriteCollar: editFormData.favoriteCollar || "V-Neck",
      favoriteSleeve: editFormData.favoriteSleeve || "Half Sleeve",
      ordersCount: Number(editFormData.ordersCount || 1),
      totalSpent: Number(editFormData.totalSpent || 0),
    };

    const idx = customers.findIndex(c => c.id === finalData.id);
    let updated: CustomerMemory[];
    if (idx >= 0) {
      updated = [...customers];
      updated[idx] = finalData;
    } else {
      updated = [finalData, ...customers];
    }

    setCustomers(updated);
    setSelectedCustomer(finalData);
    setEditModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans p-2 md:p-4 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Customer Memory CRM</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Store & customize factory memory: Logos, sponsors, fonts, GST & order history for automatic re-orders.
          </p>
        </div>

        <button
          onClick={() => handleOpenEdit()}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>+ Add Customer Memory Profile</span>
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
          <button
            onClick={() => handleOpenEdit()}
            className="px-6 py-3 rounded-2xl bg-purple-600 text-white font-extrabold text-xs inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create First Customer Profile</span>
          </button>
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
                  <div className="flex items-center gap-3">
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt={c.name} className="w-12 h-12 rounded-2xl object-cover bg-slate-950 border border-slate-700 p-0.5 flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-black flex items-center justify-center text-lg flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-white text-base">{c.name}</h3>
                      <div className="text-xs text-slate-400 mt-0.5">{c.phone} · {c.ordersCount} Past Orders</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-1">
                      <div className="text-sm font-black text-emerald-400">₹{c.totalSpent.toLocaleString("en-IN")}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(c);
                      }}
                      className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black transition-all"
                      title="Edit Customer Details"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomer(c.id);
                      }}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all"
                      title="Delete Profile"
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
                <div className="flex items-center gap-4">
                  {selectedCustomer.logoUrl ? (
                    <img src={selectedCustomer.logoUrl} alt={selectedCustomer.name} className="w-14 h-14 rounded-2xl object-cover border border-cyan-500/40 p-1 bg-slate-950" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-black text-2xl flex items-center justify-center">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedCustomer.name}</h2>
                    <span className="text-xs text-cyan-400 font-bold">Customer Logo & Vault Saved ✓</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleOpenEdit(selectedCustomer)}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-extrabold text-xs flex items-center gap-1.5 hover:bg-cyan-500 hover:text-black transition-all cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>Edit Customer Logo & Profile</span>
                  </button>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Lifetime Value</span>
                    <span className="text-xl font-black text-emerald-400">₹{selectedCustomer.totalSpent.toLocaleString("en-IN")}</span>
                  </div>
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

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">Favorite Collar Style</span>
                  <span className="font-bold text-white">{selectedCustomer.favoriteCollar}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">Favorite Sleeve Style</span>
                  <span className="font-bold text-white">{selectedCustomer.favoriteSleeve}</span>
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

      {/* EDIT CUSTOMER MODAL WITH LOGO UPLOADER */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 text-left shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-xl font-black text-white">Customize Customer CRM Profile & Logo</h2>
              <button onClick={() => setEditModalOpen(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Customer Logo Section */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4">
              {editFormData.logoUrl ? (
                <img src={editFormData.logoUrl} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border border-cyan-400/40 p-1 bg-slate-900" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-dashed border-slate-700 text-slate-500 flex items-center justify-center">
                  <Image size={24} />
                </div>
              )}
              <div className="flex-1 space-y-2 text-xs">
                <label className="block font-bold text-slate-200">Customer Logo (Upload or URL)</label>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                    <Upload size={14} />
                    <span>Upload Logo File</span>
                    <input type="file" accept="image/*" onChange={handleLogoFileUpload} className="hidden" />
                  </label>
                  <input
                    type="text"
                    value={editFormData.logoUrl || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, logoUrl: e.target.value })}
                    placeholder="Or paste Logo Image URL..."
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Customer / Business Name *</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  placeholder="e.g. Shirke Sports Wear"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Phone / WhatsApp Number</label>
                <input
                  type="text"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={editFormData.gstin || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, gstin: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  placeholder="27ABCDE1234F1Z5"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Sponsor Brand Name</label>
                <input
                  type="text"
                  value={editFormData.sponsorName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, sponsorName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  placeholder="e.g. MAPL Graphic"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Preferred Sports Font</label>
                <input
                  type="text"
                  value={editFormData.preferredFont || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, preferredFont: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  placeholder="Jersey M54 Bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Favorite Collar Style</label>
                <input
                  type="text"
                  value={editFormData.favoriteCollar || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, favoriteCollar: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  placeholder="Sublimation V-Neck"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Favorite Sleeve Style</label>
                <input
                  type="text"
                  value={editFormData.favoriteSleeve || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, favoriteSleeve: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  placeholder="Half Sleeve / Full Sleeve"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Total Lifetime Spent (₹)</label>
                <input
                  type="number"
                  value={editFormData.totalSpent || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, totalSpent: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 font-bold mb-1">Delivery Address</label>
                <textarea
                  rows={2}
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  placeholder="Industrial Area Phase 2, Ludhiana"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomer}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-xs flex items-center gap-2"
              >
                <Save size={16} />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
