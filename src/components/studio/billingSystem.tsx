import React, { useState, useEffect, useCallback } from 'react';
import { 
  Receipt, Plus, Download, Printer, Send, Trash2, Edit2, CheckCircle, 
  Clock, DollarSign, Search, Sparkles, FileText, X, User, QrCode, Building2,
  Package, Palette, Layers, CheckCircle2, ChevronRight, Phone, MapPin, Percent, CreditCard, ShieldCheck, Tag,
  Mail, MessageSquare, Copy, Check, Upload, Image as ImageIcon, Settings, FileSpreadsheet, Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import type { PlayerRecord, OrderMetadata } from './orderEntry';
import type { OrderItem } from './factoryOrders';
import { CustomerMemory } from './factoryCustomers';
import { ProductItem, getStoredProducts, saveStoredProducts } from './productCatalogDb';

export interface InvoiceLineItem {
  id: string;
  description: string;
  hsnCode: string;
  qty: number;
  unit: string;
  rate: number;
  taxPercent: number; // e.g. 5, 12, 18
  amount: number;
}

export interface BillingRecord {
  id: string;
  orderCode: string;
  date: string;
  dueDate?: string;
  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  customerAddress?: string;
  customerLogoUrl?: string;
  fileName: string; // Order description
  whatsapp: string;
  qty: number;
  rate: number;
  designCharges: number;
  status: 'Completed' | 'Pending' | 'Cancelled' | 'Overdue' | 'Draft';
  advance?: number;
  rolePanel?: 'printing' | 'factory' | 'designer';
  lineItems?: InvoiceLineItem[];
  discount?: number;
  gstType?: 'CGST_SGST' | 'IGST';
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  logoUrl: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  upiId: string;
}

interface BillingSystemProps {
  records?: PlayerRecord[];
  metadata?: OrderMetadata;
  currentUser?: { email: string; name: string; balance: number } | null;
  orders?: OrderItem[];
}

export const BillingSystem: React.FC<BillingSystemProps> = ({ records = [], metadata, currentUser, orders = [] }) => {
  // Active Panel Role Selection (Printing Owner | Factory Owner | Designer)
  const [activeRolePanel, setActiveRolePanel] = useState<'printing' | 'factory' | 'designer'>('printing');

  // Customer CRM Database loaded from localStorage
  const customerStorageKey = currentUser?.email ? `fivenest_factory_customers_${currentUser.email}` : 'fivenest_factory_customers_default';
  const [customerDb, setCustomerDb] = useState<CustomerMemory[]>([]);

  // Product Database Catalog loaded from helper
  const [productsDb, setProductsDb] = useState<ProductItem[]>(getStoredProducts());
  const [showProductModal, setShowProductModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Business Profile Persistence (Company Name, Logo, Details, UPI)
  const profileStorageKey = currentUser?.email ? `fivenest_business_profile_${currentUser.email.toLowerCase().trim()}` : 'fivenest_business_profile_default';
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem(profileStorageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      name: 'Vakratunda Sublimation Apparel',
      tagline: 'Sportswear Printing & Garment Manufacturing',
      logoUrl: '',
      gstin: '27ABCDE1234F1Z5',
      phone: '+91 98765 43210',
      email: 'billing@fivenest.in',
      address: 'Sportswear Industrial Complex, Market Hub',
      bankName: 'HDFC Bank Ltd',
      accountNo: '50200012345678',
      ifsc: 'HDFC0000123',
      upiId: 'vilesh332-1@okhdfcbank'
    };
  });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Save Business Profile
  useEffect(() => {
    localStorage.setItem(profileStorageKey, JSON.stringify(businessProfile));
    if (businessProfile.upiId) {
      localStorage.setItem('fivenest_upi_id', businessProfile.upiId);
    }
  }, [businessProfile, profileStorageKey]);

  // Scoped key per user for Billing Records
  const userStorageKey = currentUser?.email 
    ? `fivenest_billing_records_${currentUser.email.toLowerCase().trim()}` 
    : 'fivenest_billing_records_guest';

  const [billingList, setBillingList] = useState<BillingRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending' | 'Draft'>('All');
  
  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<BillingRecord | null>(null);

  // Invoice Builder Modal State (Refrens / MyBillBook Customizer)
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [builderData, setBuilderData] = useState<Partial<BillingRecord>>({
    orderCode: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    customerName: '',
    whatsapp: '',
    customerGstin: '',
    customerAddress: '',
    fileName: 'Sublimation Sportswear Printing',
    status: 'Pending',
    advance: 0,
    discount: 0,
    gstType: 'CGST_SGST',
    rolePanel: 'printing',
    lineItems: [
      { id: '1', description: 'Sublimation Full Jersey Printing', hsnCode: '998898', qty: 50, unit: 'pcs', rate: 15, taxPercent: 12, amount: 750 }
    ]
  });

  // Load Customer Database from CRM
  useEffect(() => {
    const savedCust = localStorage.getItem(customerStorageKey);
    if (savedCust) {
      try {
        setCustomerDb(JSON.parse(savedCust));
      } catch (e) {}
    }
  }, [customerStorageKey]);

  // Load User-Scoped Billing Data
  const loadBillingData = useCallback(() => {
    const userEmail = currentUser?.email || 'guest';
    const keysToCheck = [
      `fivenest_studio_export_billing_${userEmail.toLowerCase().trim()}`,
      `fivenest_billing_records_${userEmail.toLowerCase().trim()}`,
      `fivenest_studio_export_billing_all`,
      `fivenest_studio_export_billing_guest`
    ];

    let studioExportsMap = new Map<string, BillingRecord>();

    const deletedKey = `fivenest_billing_deleted_ids_${userEmail.toLowerCase().trim()}`;
    let deletedIds: Set<string> = new Set();
    try {
      const deletedStr = localStorage.getItem(deletedKey);
      if (deletedStr) deletedIds = new Set(JSON.parse(deletedStr));
    } catch (e) {}

    keysToCheck.forEach(k => {
      const str = localStorage.getItem(k);
      if (str) {
        try {
          const list: BillingRecord[] = JSON.parse(str);
          list.forEach(item => {
            if (item && item.id && !studioExportsMap.has(item.id) && !deletedIds.has(item.id)) {
              studioExportsMap.set(item.id, item);
            }
          });
        } catch (e) {}
      }
    });

    let studioExports = Array.from(studioExportsMap.values());

    // Sync from Order Dockets if available
    let syncedFromOrders: BillingRecord[] = [];
    if (orders && orders.length > 0) {
      syncedFromOrders = orders.map((o) => {
        let totalQty = 0;
        o.sizeGrid.forEach((row) => {
          totalQty += Number(row.halfQty || 0) + Number(row.fullQty || 0);
        });

        const isPrintOnly = o.orderScope === 'printing-only';
        const designCost = o.designCost !== undefined ? o.designCost : (isPrintOnly ? totalQty * 3 : 0);

        return {
          id: o.id,
          orderCode: `ORD-#${o.orderNo}`,
          date: o.deliveryDate || new Date().toLocaleDateString('en-IN'),
          customerName: o.customerName,
          fileName: `${isPrintOnly ? '🖨️ Order Docket (Print)' : '🏭 Order Docket (Mfg)'} (${totalQty} pcs)`,
          whatsapp: '',
          qty: totalQty,
          rate: o.ratePerPiece,
          designCharges: designCost,
          status: o.statusPrint === 'Done' && o.statusStitch === 'Done' ? 'Completed' : 'Pending',
          advance: o.advancePaid || 0,
          rolePanel: isPrintOnly ? 'printing' : 'factory'
        };
      });
    }

    const combinedList = [...studioExports, ...syncedFromOrders];
    if (combinedList.length === 0) {
      setBillingList([
        { id: '1', orderCode: 'INV-2026-1001', date: new Date().toLocaleDateString('en-IN'), customerName: 'Shirke Sports Mfg', fileName: 'MAPL Sublimation Jersey Order (191 pcs)', whatsapp: '9773358920', qty: 191, rate: 15, designCharges: 500, status: 'Completed', advance: 1000, rolePanel: 'printing' }
      ]);
    } else {
      setBillingList(combinedList);
    }
  }, [orders, currentUser?.email]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  // Save billing data changes to localStorage
  useEffect(() => {
    if (billingList.length > 0) {
      localStorage.setItem(userStorageKey, JSON.stringify(billingList));
    }
  }, [billingList, userStorageKey]);

  // Invoice Math Helpers
  const getItemSubtotal = (items?: InvoiceLineItem[], fallbackQty = 1, fallbackRate = 0) => {
    if (items && items.length > 0) {
      return items.reduce((acc, it) => acc + (it.qty * it.rate), 0);
    }
    return fallbackQty * fallbackRate;
  };

  const getItemTaxTotal = (items?: InvoiceLineItem[]) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((acc, it) => acc + ((it.qty * it.rate) * (it.taxPercent / 100)), 0);
  };

  const calculateFinalTotal = (rec: BillingRecord) => {
    if (rec.lineItems && rec.lineItems.length > 0) {
      const subtotal = getItemSubtotal(rec.lineItems);
      const tax = getItemTaxTotal(rec.lineItems);
      const disc = rec.discount || 0;
      return Math.max(0, subtotal + tax + rec.designCharges - disc);
    }
    return (rec.qty * rec.rate) + rec.designCharges - (rec.discount || 0);
  };

  const calculateBalanceDue = (rec: BillingRecord) => {
    const total = calculateFinalTotal(rec);
    return Math.max(0, total - (rec.advance || 0));
  };

  // Filtered List by Role & Search
  const filteredList = billingList.filter(rec => {
    const matchesRole = !rec.rolePanel || rec.rolePanel === activeRolePanel;
    const matchesSearch = 
      rec.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.whatsapp.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    return matchesRole && matchesSearch && matchesStatus;
  });

  // Totals calculations for summary cards
  const totalReceived = filteredList
    .filter(r => r.status === 'Completed')
    .reduce((sum, r) => sum + calculateFinalTotal(r), 0);

  const totalPending = filteredList
    .filter(r => r.status === 'Pending' || r.status === 'Draft')
    .reduce((sum, r) => sum + calculateBalanceDue(r), 0);

  const totalGrandRevenue = totalReceived + totalPending;

  // Open Invoice Builder Modal
  const handleOpenBuilder = (existing?: BillingRecord) => {
    if (existing) {
      setBuilderData({ ...existing });
    } else {
      const roleProducts = productsDb.filter(p => p.category === activeRolePanel);
      const firstProd = roleProducts[0] || productsDb[0];

      setBuilderData({
        id: `inv-${Date.now()}`,
        orderCode: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        customerName: '',
        whatsapp: '',
        customerGstin: '',
        customerAddress: '',
        fileName: `${activeRolePanel === 'printing' ? 'Sublimation Print Order' : activeRolePanel === 'factory' ? 'Bulk Jersey Order' : '3D Jersey Design Order'}`,
        status: 'Pending',
        advance: 0,
        discount: 0,
        gstType: 'CGST_SGST',
        designCharges: 0,
        rolePanel: activeRolePanel,
        lineItems: [
          {
            id: `item-${Date.now()}`,
            description: firstProd ? firstProd.name : 'Custom Sublimation Item',
            hsnCode: firstProd ? firstProd.hsnCode : '998898',
            qty: 50,
            unit: firstProd ? firstProd.unit : 'pcs',
            rate: firstProd ? firstProd.defaultRate : 15,
            taxPercent: firstProd ? firstProd.taxPercent : 12,
            amount: 50 * (firstProd ? firstProd.defaultRate : 15)
          }
        ]
      });
    }
    setShowBuilderModal(true);
  };

  // Save Custom Invoice from Builder
  const handleSaveInvoiceFromBuilder = () => {
    if (!builderData.customerName?.trim()) {
      alert('Please enter or select a Customer Name.');
      return;
    }

    const finalRec: BillingRecord = {
      id: builderData.id || `inv-${Date.now()}`,
      orderCode: builderData.orderCode || `INV-${Date.now()}`,
      date: builderData.date || new Date().toLocaleDateString('en-IN'),
      dueDate: builderData.dueDate,
      customerName: builderData.customerName || 'Client',
      customerPhone: builderData.customerPhone || builderData.whatsapp,
      customerGstin: builderData.customerGstin,
      customerAddress: builderData.customerAddress,
      customerLogoUrl: builderData.customerLogoUrl,
      fileName: builderData.fileName || 'Sportswear Order',
      whatsapp: builderData.whatsapp || builderData.customerPhone || '',
      qty: builderData.lineItems ? builderData.lineItems.reduce((a, b) => a + Number(b.qty), 0) : Number(builderData.qty || 1),
      rate: builderData.lineItems && builderData.lineItems.length > 0 ? builderData.lineItems[0].rate : Number(builderData.rate || 0),
      designCharges: Number(builderData.designCharges || 0),
      status: builderData.status || 'Pending',
      advance: Number(builderData.advance || 0),
      discount: Number(builderData.discount || 0),
      gstType: builderData.gstType || 'CGST_SGST',
      rolePanel: builderData.rolePanel || activeRolePanel,
      lineItems: builderData.lineItems || []
    };

    const existingIdx = billingList.findIndex(r => r.id === finalRec.id);
    if (existingIdx >= 0) {
      const updated = [...billingList];
      updated[existingIdx] = finalRec;
      setBillingList(updated);
    } else {
      setBillingList([finalRec, ...billingList]);
    }

    setShowBuilderModal(false);
    setSelectedInvoice(finalRec);
  };

  // Message Generator Helper
  const getInvoiceSummaryText = (rec: BillingRecord) => {
    const finalTotal = calculateFinalTotal(rec);
    const balanceDue = calculateBalanceDue(rec);
    const currentUpi = businessProfile.upiId || 'vilesh332-1@okhdfcbank';
    const upiUrlRaw = `upi://pay?pa=${currentUpi}&pn=${encodeURIComponent(businessProfile.name)}&am=${balanceDue}&cu=INR`;
    const qrUrl = `https://quickchart.io/qr?size=500&text=${encodeURIComponent(upiUrlRaw)}`;

    return {
      finalTotal,
      balanceDue,
      currentUpi,
      upiUrlRaw,
      qrUrl,
      text: 
`🧾 *TAX INVOICE #${rec.orderCode}*
Hello *${rec.customerName}*,

Here is your tax invoice summary from *${businessProfile.name}*:
________________________________________

◆ *Order Reference*: ${rec.fileName}
◆ *Date*: ${rec.date}
◆ *Total Quantity*: ${rec.qty} pcs
◆ *Final Total*: ₹${finalTotal.toLocaleString('en-IN')}
◆ *Advance Paid*: ₹${(rec.advance || 0).toLocaleString('en-IN')}
*◆ BALANCE DUE*: ₹${balanceDue.toLocaleString('en-IN')}
________________________________________

💳 *PAY BALANCE VIA UPI*:
${upiUrlRaw}

📲 *SCAN UPI QR CODE*:
${qrUrl}

Thank you for your business!
— ${businessProfile.name}`
    };
  };

  // PDF Generation Helper Function (html2canvas + jsPDF)
  const handleDownloadPdf = async (rec: BillingRecord) => {
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById('printable-invoice');
      if (!element) {
        alert('Invoice preview document not found.');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${rec.orderCode}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('PDF generation completed via print dialog.');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 1. WhatsApp Share with PDF Download
  const handleWhatsAppWithPdf = async (rec: BillingRecord) => {
    // Generate and download PDF
    await handleDownloadPdf(rec);

    const info = getInvoiceSummaryText(rec);
    const pdfMsg = `📎 *PDF TAX INVOICE ATTACHED*: Invoice_${rec.orderCode}.pdf\n\n` + info.text;

    const cleanPhone = (rec.whatsapp || rec.customerPhone || '').replace(/\D/g, '');
    const url = cleanPhone 
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(pdfMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(pdfMsg)}`;
    window.open(url, '_blank');
  };

  // 2. Email Share
  const handleEmailSend = (rec: BillingRecord) => {
    const info = getInvoiceSummaryText(rec);
    const subject = encodeURIComponent(`Tax Invoice #${rec.orderCode} from ${businessProfile.name}`);
    const body = encodeURIComponent(info.text);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // 3. SMS Share
  const handleSmsSend = (rec: BillingRecord) => {
    const info = getInvoiceSummaryText(rec);
    const cleanPhone = (rec.whatsapp || rec.customerPhone || '').replace(/\D/g, '');
    const body = encodeURIComponent(info.text);
    window.open(`sms:${cleanPhone}?body=${body}`, '_blank');
  };

  // 4. Copy Invoice Text to Clipboard
  const handleCopyInvoiceText = (rec: BillingRecord) => {
    const info = getInvoiceSummaryText(rec);
    navigator.clipboard.writeText(info.text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // Delete invoice
  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Delete this invoice entry permanently?')) {
      setBillingList(billingList.filter(r => r.id !== id));
    }
  };

  // Profile Logo File Upload Handler
  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessProfile(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 font-sans p-2 md:p-4 text-left">

      {/* 🏆 PANEL ROLE SWITCHER HEADER */}
      <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              🧾 Refrens & MyBillBook Style Custom Invoicing
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Invoices, Billing & Payment Tracker</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Generate custom GST invoices, download high-definition PDF invoices, & send instant WhatsApp/Email/SMS payment links.
          </p>
        </div>

        {/* 3 Panel Mode Selector Buttons */}
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-950 border border-slate-800 gap-1.5">
          <button
            onClick={() => setActiveRolePanel('printing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeRolePanel === 'printing'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Printer size={15} />
            <span>Printing Owner Panel</span>
          </button>

          <button
            onClick={() => setActiveRolePanel('factory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeRolePanel === 'factory'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 size={15} />
            <span>Factory Owner Panel</span>
          </button>

          <button
            onClick={() => setActiveRolePanel('designer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeRolePanel === 'designer'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette size={15} />
            <span>Designer Panel</span>
          </button>
        </div>
      </div>

      {/* Account Profile & Company Logo / UPI Config Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30">
        <div className="flex items-center gap-3">
          {businessProfile.logoUrl ? (
            <img src={businessProfile.logoUrl} alt="Company Logo" className="w-12 h-12 rounded-xl object-contain bg-slate-900 border border-cyan-400/40 p-1" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black text-lg">
              {businessProfile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-xs font-extrabold text-white flex items-center gap-2">
              <span>{businessProfile.name}</span>
              <span className="text-cyan-400 text-[10px] font-bold uppercase">({activeRolePanel} Mode)</span>
            </div>
            <div className="text-[11px] text-slate-400">
              GSTIN: <strong className="text-slate-200">{businessProfile.gstin}</strong> | UPI: <strong className="text-emerald-400 font-mono">{businessProfile.upiId}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Company Profile & Logo Customizer Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600 hover:text-white text-purple-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Settings size={14} />
            <span>Edit Company Profile & Logo</span>
          </button>

          {/* Product Catalog DB Button */}
          <button
            onClick={() => setShowProductModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Tag size={14} className="text-cyan-400" />
            <span>Manage Product Catalog ({productsDb.length})</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-emerald-500/30 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Received</span>
            <CheckCircle size={20} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">₹{totalReceived.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-400 mt-1">From completed orders</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-amber-500/30 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Balance Due / Pending</span>
            <Clock size={20} className="text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">₹{totalPending.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-400 mt-1">Awaiting client payment</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-purple-500/30 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Total Revenue</span>
            <DollarSign size={20} className="text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white">₹{totalGrandRevenue.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-400 mt-1">{filteredList.length} invoices recorded</p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, code, or item..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs md:text-sm focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-bold focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        {/* Create Custom Invoice Button */}
        <button
          onClick={() => handleOpenBuilder()}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>+ Create Custom Invoice</span>
        </button>
      </div>

      {/* Main Invoices Table */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-extrabold uppercase tracking-wider">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Order / File Details</th>
                <th className="p-4 text-center">Download / Share PDF</th>
                <th className="p-4 text-right">Qty</th>
                <th className="p-4 text-right">Final Amount</th>
                <th className="p-4 text-right">Balance Due</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 italic">
                    No invoices found matching current filter. Click "+ Create Custom Invoice" to generate a bill.
                  </td>
                </tr>
              ) : (
                filteredList.map((rec) => {
                  const finalTotal = calculateFinalTotal(rec);
                  const balanceDue = calculateBalanceDue(rec);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-black text-cyan-400">{rec.orderCode}</td>
                      <td className="p-4 text-slate-300">{rec.date}</td>
                      <td className="p-4 font-bold text-white">{rec.customerName}</td>
                      <td className="p-4 text-slate-400 max-w-[200px] truncate">{rec.fileName}</td>
                      
                      {/* PDF Download & WhatsApp Buttons */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedInvoice(rec);
                              setTimeout(() => handleDownloadPdf(rec), 300);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-black font-extrabold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                            title="Download PDF Invoice"
                          >
                            <Download size={13} />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInvoice(rec);
                              setTimeout(() => handleWhatsAppWithPdf(rec), 300);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white font-extrabold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                            title="Download PDF & Send via WhatsApp"
                          >
                            <Send size={13} />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </td>

                      <td className="p-4 text-right font-bold text-slate-200">{rec.qty}</td>
                      <td className="p-4 text-right font-black text-white">₹{finalTotal.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right font-black text-amber-400">₹{balanceDue.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          rec.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          rec.status === 'Pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedInvoice(rec)}
                            className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all cursor-pointer"
                            title="View / Print Invoice"
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenBuilder(rec)}
                            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="Edit Invoice"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                            title="Delete Invoice"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🏢 USER COMPANY PROFILE & LOGO EDIT MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 text-left shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Business Branding & Settings</span>
                <h2 className="text-xl font-black text-white">Customize Company Profile & Logo</h2>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Company Logo Image Uploader */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4">
              {businessProfile.logoUrl ? (
                <img src={businessProfile.logoUrl} alt="Company Logo" className="w-16 h-16 rounded-2xl object-contain bg-slate-900 border border-cyan-400/40 p-1" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-dashed border-slate-700 text-slate-500 flex items-center justify-center">
                  <ImageIcon size={24} />
                </div>
              )}
              <div className="flex-1 space-y-2 text-xs">
                <label className="block font-bold text-slate-200">Company Logo (Renders on top of Tax Invoice)</label>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                    <Upload size={14} />
                    <span>Upload Logo File</span>
                    <input type="file" accept="image/*" onChange={handleCompanyLogoUpload} className="hidden" />
                  </label>
                  <input
                    type="text"
                    value={businessProfile.logoUrl || ''}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, logoUrl: e.target.value })}
                    placeholder="Or paste Logo Image URL..."
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block text-slate-400 font-bold mb-1">User Company Name (Header Title) *</label>
                <input
                  type="text"
                  value={businessProfile.name}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-black text-sm"
                  placeholder="e.g. Vakratunda Sublimation Apparel"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Company Tagline / Subtitle</label>
                <input
                  type="text"
                  value={businessProfile.tagline}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, tagline: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  placeholder="Sportswear Printing OS"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={businessProfile.gstin}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, gstin: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  placeholder="27ABCDE1234F1Z5"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={businessProfile.phone}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Email Address</label>
                <input
                  type="text"
                  value={businessProfile.email}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  placeholder="billing@fivenest.in"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 font-bold mb-1">Factory / Office Address</label>
                <input
                  type="text"
                  value={businessProfile.address}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  placeholder="Industrial Complex, Ludhiana"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Bank Name</label>
                <input
                  type="text"
                  value={businessProfile.bankName}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, bankName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  placeholder="HDFC Bank Ltd"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Account Number</label>
                <input
                  type="text"
                  value={businessProfile.accountNo}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, accountNo: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  placeholder="50200012345678"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={businessProfile.ifsc}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, ifsc: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  placeholder="HDFC0000123"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">UPI VPA ID (For Instant QR Code)</label>
                <input
                  type="text"
                  value={businessProfile.upiId}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, upiId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold"
                  placeholder="vpa@upi"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-xs"
              >
                Save Business Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛠️ INVOICE BUILDER MODAL */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl text-left space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                  Custom Invoice Maker (Refrens / MyBillBook Mode)
                </span>
                <h2 className="text-2xl font-black text-white mt-0.5">Generate Tax Invoice for {businessProfile.name}</h2>
              </div>
              <button
                onClick={() => setShowBuilderModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer Database Dropdown & Quick Selection */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <User size={14} /> Customer Selection (Select from Customer CRM Database)
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Select Existing Customer CRM Profile</label>
                  <select
                    onChange={(e) => {
                      const found = customerDb.find(c => c.id === e.target.value);
                      if (found) {
                        setBuilderData(prev => ({
                          ...prev,
                          customerName: found.name,
                          whatsapp: found.phone,
                          customerPhone: found.phone,
                          customerGstin: found.gstin,
                          customerAddress: found.address,
                          customerLogoUrl: found.logoUrl
                        }));
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">-- Choose from Customer Database --</option>
                    {customerDb.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Customer / Business Name *</label>
                  <input
                    type="text"
                    value={builderData.customerName || ''}
                    onChange={(e) => setBuilderData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="e.g. Shirke Sports Wear"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">WhatsApp Phone Number</label>
                  <input
                    type="text"
                    value={builderData.whatsapp || ''}
                    onChange={(e) => setBuilderData(prev => ({ ...prev, whatsapp: e.target.value, customerPhone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={builderData.customerGstin || ''}
                    onChange={(e) => setBuilderData(prev => ({ ...prev, customerGstin: e.target.value }))}
                    placeholder="27ABCDE1234F1Z5"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Billing Address</label>
                  <input
                    type="text"
                    value={builderData.customerAddress || ''}
                    onChange={(e) => setBuilderData(prev => ({ ...prev, customerAddress: e.target.value }))}
                    placeholder="Factory Complex, Market"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table with Product Catalog Dropdown */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Package size={14} /> Product Items (Select from Product Catalog Database)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const roleProducts = productsDb.filter(p => p.category === activeRolePanel);
                    const firstProd = roleProducts[0] || productsDb[0];
                    const newItem: InvoiceLineItem = {
                      id: `item-${Date.now()}`,
                      description: firstProd ? firstProd.name : 'Sublimation Print Item',
                      hsnCode: firstProd ? firstProd.hsnCode : '998898',
                      qty: 10,
                      unit: firstProd ? firstProd.unit : 'pcs',
                      rate: firstProd ? firstProd.defaultRate : 15,
                      taxPercent: firstProd ? firstProd.taxPercent : 12,
                      amount: 150
                    };
                    setBuilderData(prev => ({
                      ...prev,
                      lineItems: [...(prev.lineItems || []), newItem]
                    }));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-extrabold text-xs flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>+ Add Product Row</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {(builderData.lineItems || []).map((item, idx) => (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid md:grid-cols-12 gap-3 items-center text-xs">
                    
                    {/* Item Select Dropdown */}
                    <div className="md:col-span-4">
                      <label className="block text-[10px] text-slate-400 mb-1">Item Description</label>
                      <select
                        value={item.description}
                        onChange={(e) => {
                          const foundProd = productsDb.find(p => p.name === e.target.value);
                          const updated = [...(builderData.lineItems || [])];
                          if (foundProd) {
                            updated[idx] = {
                              ...updated[idx],
                              description: foundProd.name,
                              hsnCode: foundProd.hsnCode,
                              unit: foundProd.unit,
                              rate: foundProd.defaultRate,
                              taxPercent: foundProd.taxPercent,
                              amount: updated[idx].qty * foundProd.defaultRate
                            };
                          } else {
                            updated[idx].description = e.target.value;
                          }
                          setBuilderData(prev => ({ ...prev, lineItems: updated }));
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:outline-none"
                      >
                        <option value={item.description}>{item.description}</option>
                        {productsDb.map(p => (
                          <option key={p.id} value={p.name}>{p.name} (₹{p.defaultRate}/{p.unit})</option>
                        ))}
                      </select>
                    </div>

                    {/* HSN */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-400 mb-1">HSN/SAC</label>
                      <input
                        type="text"
                        value={item.hsnCode}
                        onChange={(e) => {
                          const updated = [...(builderData.lineItems || [])];
                          updated[idx].hsnCode = e.target.value;
                          setBuilderData(prev => ({ ...prev, lineItems: updated }));
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none"
                      />
                    </div>

                    {/* Qty */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-400 mb-1">Qty ({item.unit})</label>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => {
                          const qtyVal = Number(e.target.value);
                          const updated = [...(builderData.lineItems || [])];
                          updated[idx].qty = qtyVal;
                          updated[idx].amount = qtyVal * updated[idx].rate;
                          setBuilderData(prev => ({ ...prev, lineItems: updated }));
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold text-right focus:outline-none"
                      />
                    </div>

                    {/* Rate */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-400 mb-1">Rate (₹)</label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => {
                          const rateVal = Number(e.target.value);
                          const updated = [...(builderData.lineItems || [])];
                          updated[idx].rate = rateVal;
                          updated[idx].amount = updated[idx].qty * rateVal;
                          setBuilderData(prev => ({ ...prev, lineItems: updated }));
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold text-right focus:outline-none"
                      />
                    </div>

                    {/* Amount & Remove */}
                    <div className="md:col-span-2 flex items-center justify-between gap-2 text-right">
                      <div>
                        <span className="block text-[10px] text-slate-400">Total</span>
                        <span className="font-extrabold text-cyan-400">₹{(item.qty * item.rate).toLocaleString('en-IN')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (builderData.lineItems || []).filter((_, i) => i !== idx);
                          setBuilderData(prev => ({ ...prev, lineItems: updated }));
                        }}
                        className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Advance Payments Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 grid md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-200">Invoice Settings & Payment Terms</h4>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Design / Artwork Charges (₹)</label>
                  <input
                    type="number"
                    value={builderData.designCharges || 0}
                    onChange={(e) => setBuilderData(prev => ({ ...prev, designCharges: Number(e.target.value) }))}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={builderData.discount || 0}
                    onChange={(e) => setBuilderData(prev => ({ ...prev, discount: Number(e.target.value) }))}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Advance Received (₹)</label>
                  <input
                    type="number"
                    value={builderData.advance || 0}
                    onChange={(e) => setBuilderData(prev => ({ ...prev, advance: Number(e.target.value) }))}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-bold"
                  />
                </div>
              </div>

              {/* Calculated Totals Box */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>Item Subtotal:</span>
                    <span className="font-bold">₹{getItemSubtotal(builderData.lineItems, builderData.qty, builderData.rate).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Design Charges:</span>
                    <span className="font-bold">₹{(builderData.designCharges || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Discount:</span>
                    <span className="font-bold text-rose-400">- ₹{(builderData.discount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-200 text-sm font-black pt-2 border-t border-slate-800">
                    <span>Grand Total:</span>
                    <span className="text-white">₹{calculateFinalTotal(builderData as BillingRecord).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-amber-400 text-sm font-black pt-2 border-t border-slate-800">
                    <span>Balance Due:</span>
                    <span>₹{calculateBalanceDue(builderData as BillingRecord).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveInvoiceFromBuilder}
                  className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-extrabold text-xs flex justify-center items-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <CheckCircle2 size={16} />
                  <span>Save Invoice & Preview</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 🏷️ PRODUCT CATALOG DATABASE MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-3xl max-h-[85vh] overflow-y-auto text-left space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                  Product & Service Catalog Database
                </span>
                <h2 className="text-2xl font-black text-white mt-0.5">Manage Factory Products</h2>
              </div>
              <button onClick={() => setShowProductModal(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  const newP: ProductItem = {
                    id: `p-${Date.now()}`,
                    name: 'New Custom Sportswear Item',
                    category: activeRolePanel,
                    hsnCode: '998898',
                    unit: 'pcs',
                    defaultRate: 200,
                    taxPercent: 12,
                    description: 'Custom factory product service'
                  };
                  const updated = [newP, ...productsDb];
                  setProductsDb(updated);
                  saveStoredProducts(updated);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Product to Catalog
              </button>
            </div>

            <div className="space-y-4">
              {productsDb.map((p, idx) => (
                <div key={p.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="grid md:grid-cols-12 gap-3 items-center">
                    
                    {/* Name */}
                    <div className="md:col-span-4">
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Product / Service Name</label>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const updated = [...productsDb];
                          updated[idx].name = e.target.value;
                          setProductsDb(updated);
                          saveStoredProducts(updated);
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Category */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Panel Category</label>
                      <select
                        value={p.category}
                        onChange={(e) => {
                          const updated = [...productsDb];
                          updated[idx].category = e.target.value as any;
                          setProductsDb(updated);
                          saveStoredProducts(updated);
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-cyan-400 font-bold focus:outline-none"
                      >
                        <option value="printing">Printing</option>
                        <option value="factory">Factory</option>
                        <option value="designer">Designer</option>
                      </select>
                    </div>

                    {/* HSN */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">HSN/SAC Code</label>
                      <input
                        type="text"
                        value={p.hsnCode}
                        onChange={(e) => {
                          const updated = [...productsDb];
                          updated[idx].hsnCode = e.target.value;
                          setProductsDb(updated);
                          saveStoredProducts(updated);
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none"
                      />
                    </div>

                    {/* Rate */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Default Rate (₹)</label>
                      <input
                        type="number"
                        value={p.defaultRate}
                        onChange={(e) => {
                          const updated = [...productsDb];
                          updated[idx].defaultRate = Number(e.target.value);
                          setProductsDb(updated);
                          saveStoredProducts(updated);
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-bold text-right focus:outline-none"
                      />
                    </div>

                    {/* Delete */}
                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                      <select
                        value={p.unit}
                        onChange={(e) => {
                          const updated = [...productsDb];
                          updated[idx].unit = e.target.value;
                          setProductsDb(updated);
                          saveStoredProducts(updated);
                        }}
                        className="px-2 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-[11px]"
                      >
                        <option value="pcs">pcs</option>
                        <option value="sq ft">sq ft</option>
                        <option value="meters">meters</option>
                        <option value="hrs">hrs</option>
                        <option value="job">job</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = productsDb.filter(item => item.id !== p.id);
                          setProductsDb(updated);
                          saveStoredProducts(updated);
                        }}
                        className="p-2 text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🧾 INVOICE PREVIEW & PRINT MODAL WITH USER COMPANY LOGO & MULTI-CHANNEL SHARE */}
      {selectedInvoice && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
          onClick={() => setSelectedInvoice(null)}
        >
          <div 
            className="bg-white text-slate-900 rounded-2xl p-6 md:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Multi-Channel Action Controls */}
            <div className="no-print flex flex-wrap justify-between items-center pb-4 mb-6 border-b border-slate-200 gap-3">
              <div className="flex flex-wrap items-center gap-2">
                
                {/* 📥 Download High-Def PDF Button */}
                <button
                  onClick={() => handleDownloadPdf(selectedInvoice)}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-extrabold text-xs flex items-center gap-2 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                  title="Download High Definition PDF Invoice Document"
                >
                  {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Invoice'}</span>
                </button>

                {/* 💬 Send PDF + WhatsApp */}
                <button
                  onClick={() => handleWhatsAppWithPdf(selectedInvoice)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 hover:bg-emerald-500 cursor-pointer"
                  title="Download PDF Invoice & Share via WhatsApp with Payment Link"
                >
                  <Send size={15} />
                  <span>WhatsApp PDF & Link</span>
                </button>

                {/* 📧 Email */}
                <button
                  onClick={() => handleEmailSend(selectedInvoice)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center gap-1.5 hover:bg-blue-500 cursor-pointer"
                  title="Share Invoice via Email"
                >
                  <Mail size={15} />
                  <span>Email</span>
                </button>

                {/* 📋 Copy */}
                <button
                  onClick={() => handleCopyInvoiceText(selectedInvoice)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 font-extrabold text-xs flex items-center gap-1.5 hover:bg-slate-200 cursor-pointer"
                  title="Copy Invoice details & payment link"
                >
                  {copiedToast ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  <span>{copiedToast ? 'Copied!' : 'Copy Link'}</span>
                </button>

                {/* 🖨️ Print */}
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center gap-1.5 hover:bg-slate-800 cursor-pointer"
                >
                  <Printer size={15} />
                  <span>Print</span>
                </button>
              </div>

              <button onClick={() => setSelectedInvoice(null)} className="p-2 text-slate-500 hover:text-slate-900">
                <X size={20} />
              </button>
            </div>

            {/* Printable Invoice Document Sheet */}
            <div id="printable-invoice" className="font-sans text-left text-slate-900 p-2 bg-white">
              
              {/* Top User Business Header with Custom Logo */}
              <div className="flex justify-between items-start border-b-2 border-cyan-500 pb-4 mb-6">
                <div className="flex items-center gap-4">
                  {businessProfile.logoUrl ? (
                    <img src={businessProfile.logoUrl} alt={businessProfile.name} className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-1" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-cyan-600 text-white font-black text-2xl flex items-center justify-center">
                      {businessProfile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-black text-cyan-600 uppercase tracking-tight">{businessProfile.name}</h1>
                    <p className="text-xs text-slate-500">{businessProfile.tagline}</p>
                    <p className="text-xs text-slate-500 mt-0.5">GSTIN: {businessProfile.gstin} | Phone: {businessProfile.phone}</p>
                    <p className="text-xs text-slate-500">{businessProfile.address}</p>
                  </div>
                </div>

                <div className="text-right">
                  <h2 className="text-xl font-extrabold text-slate-800 uppercase">TAX INVOICE</h2>
                  <p className="text-sm font-black text-cyan-600 mt-1">#{selectedInvoice.orderCode}</p>
                  <p className="text-xs text-slate-500 mt-1">Date: <strong>{selectedInvoice.date}</strong></p>
                </div>
              </div>

              {/* Bill To with Customer Logo & Order Reference */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-100 border border-slate-200 mb-6 text-xs">
                <div className="flex items-start gap-3">
                  {selectedInvoice.customerLogoUrl ? (
                    <img src={selectedInvoice.customerLogoUrl} alt={selectedInvoice.customerName} className="w-12 h-12 rounded-lg object-cover border border-slate-300 bg-white p-0.5" />
                  ) : null}
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">BILLED TO</span>
                    <h3 className="text-base font-bold text-slate-900">{selectedInvoice.customerName}</h3>
                    {selectedInvoice.whatsapp && <p className="text-slate-600 mt-0.5">Phone: +91 {selectedInvoice.whatsapp}</p>}
                    {selectedInvoice.customerGstin && <p className="text-slate-600 font-mono">GSTIN: {selectedInvoice.customerGstin}</p>}
                    {selectedInvoice.customerAddress && <p className="text-slate-600">{selectedInvoice.customerAddress}</p>}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">ORDER REFERENCE</span>
                  <p className="font-bold text-slate-800">{selectedInvoice.fileName}</p>
                  <div className="mt-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      selectedInvoice.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Status: {selectedInvoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs mb-6 border-collapse">
                <thead>
                  <tr className="bg-slate-200 border-b-2 border-slate-300 font-bold text-slate-700">
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">HSN/SAC</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Rate (₹)</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 ? (
                    selectedInvoice.lineItems.map(it => (
                      <tr key={it.id}>
                        <td className="p-3 font-semibold">{it.description}</td>
                        <td className="p-3 text-center font-mono text-slate-600">{it.hsnCode}</td>
                        <td className="p-3 text-center font-bold">{it.qty} {it.unit}</td>
                        <td className="p-3 text-right">₹{it.rate.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold">₹{(it.qty * it.rate).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-3 font-semibold">{selectedInvoice.fileName}</td>
                      <td className="p-3 text-center font-mono text-slate-600">998898</td>
                      <td className="p-3 text-center font-bold">{selectedInvoice.qty} pcs</td>
                      <td className="p-3 text-right">₹{selectedInvoice.rate.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold">₹{(selectedInvoice.qty * selectedInvoice.rate).toFixed(2)}</td>
                    </tr>
                  )}

                  {selectedInvoice.designCharges > 0 && (
                    <tr>
                      <td className="p-3 font-semibold">Custom Design & Artwork Setup Charges</td>
                      <td className="p-3 text-center font-mono text-slate-600">998391</td>
                      <td className="p-3 text-center font-bold">1 job</td>
                      <td className="p-3 text-right">₹{selectedInvoice.designCharges.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold">₹{selectedInvoice.designCharges.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="flex justify-between items-start pt-4 border-t-2 border-slate-200 mb-6 text-xs">
                <div className="max-w-xs text-slate-500 text-[11px]">
                  <p className="font-bold text-slate-800 mb-1">Bank Payment Transfer Details:</p>
                  <p>Bank: {businessProfile.bankName}</p>
                  <p>A/C: {businessProfile.accountNo} | IFSC: {businessProfile.ifsc}</p>
                  <p className="mt-1 font-bold text-cyan-700">UPI ID: {businessProfile.upiId}</p>
                </div>

                <div className="w-56 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{getItemSubtotal(selectedInvoice.lineItems, selectedInvoice.qty, selectedInvoice.rate).toFixed(2)}</span>
                  </div>
                  {selectedInvoice.designCharges > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Design Fee:</span>
                      <span>₹{selectedInvoice.designCharges.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span>- ₹{selectedInvoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
                    <span>Grand Total:</span>
                    <span>₹{calculateFinalTotal(selectedInvoice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-700">
                    <span>Advance Paid:</span>
                    <span>₹{(selectedInvoice.advance || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-amber-700 pt-1 border-t border-slate-300">
                    <span>Balance Due:</span>
                    <span>₹{calculateBalanceDue(selectedInvoice).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* ⚡ Instant UPI Payment QR Code Section */}
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                    <QrCode size={16} /> Instant UPI Payment (GPay / PhonePe / Paytm / BHIM)
                  </h4>
                  <p className="text-[11px] text-purple-700 mt-1">
                    Scan QR code using GPay or PhonePe to settle balance of ₹{calculateBalanceDue(selectedInvoice).toFixed(2)}
                  </p>
                  <p className="text-xs font-mono font-bold text-purple-900 mt-2">UPI ID: {businessProfile.upiId}</p>
                </div>

                <div className="bg-white p-2 rounded-lg border border-purple-200 text-center">
                  <img
                    src={`https://quickchart.io/qr?size=300&text=${encodeURIComponent(`upi://pay?pa=${businessProfile.upiId}&pn=${encodeURIComponent(businessProfile.name)}&am=${calculateBalanceDue(selectedInvoice)}&cu=INR`)}`}
                    alt="UPI QR Code"
                    className="w-24 h-24 block"
                  />
                  <span className="text-[9px] font-bold text-purple-900 block mt-1">SCAN TO PAY</span>
                </div>
              </div>

              <div className="mt-6 text-center text-[11px] text-slate-400 pt-4 border-t border-slate-200">
                Thank you for your business with {businessProfile.name}! ⚡
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};
