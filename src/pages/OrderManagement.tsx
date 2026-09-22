import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Bell, Filter, Download, Settings, Factory, Palette, Printer,
  LayoutDashboard, Users, ShoppingBag, FileText, CreditCard, AlertTriangle,
  BookOpen, BarChart3, X, CheckCircle, ChevronDown, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useOrderStore, BusinessType, fmt, STATUS_COLORS, STATUS_LABELS } from '../hooks/useOrderStore';
import KPICards from '../components/orders/KPICards';
import CustomerPanel from '../components/orders/CustomerPanel';
import TransactionTable, { Column } from '../components/orders/TransactionTable';
import OrderForm from '../components/orders/OrderForm';
import DesignerBillForm from '../components/orders/DesignerBillForm';
import PrintingModule from '../components/orders/PrintingModule';
import PaymentDrawer from '../components/orders/PaymentDrawer';
import LedgerView from '../components/orders/LedgerView';
import ReportsView from '../components/orders/ReportsView';
import JobSheetModal from '../components/orders/JobSheetModal';
import DesignerBillModal from '../components/orders/DesignerBillModal';
import PaymentsHub from '../components/orders/PaymentsHub';
import { ManufacturerOrder, DesignerBill } from '../hooks/useOrderStore';

const cn = (...c: (string|undefined|boolean)[]) => c.filter(Boolean).join(' ');

// ─── Business Mode ────────────────────────────────────────────────────────────
type BusinessMode = 'all' | BusinessType;

// ─── Sub-navigation items per mode ───────────────────────────────────────────
type SubView = 'overview' | 'orders' | 'customers' | 'payments' | 'outstanding' | 'ledger' | 'reports' | 'quotations';

interface NavItem { key: SubView; label: string; icon: React.FC<{size?: number; className?: string}> }

const NAV_ALL: NavItem[] = [
  { key: 'overview',     label: 'Overview',       icon: LayoutDashboard },
  { key: 'customers',    label: 'Customers',      icon: Users           },
  { key: 'payments',     label: 'Payments & Due', icon: CreditCard      },
  { key: 'ledger',       label: 'Ledger',         icon: BookOpen        },
  { key: 'reports',      label: 'Reports',        icon: BarChart3       },
];
const NAV_MFG: NavItem[] = [
  { key: 'orders',       label: 'Orders',         icon: ShoppingBag     },
  { key: 'payments',     label: 'Payments & Due', icon: CreditCard      },
  { key: 'customers',    label: 'Customers',      icon: Users           },
  { key: 'ledger',       label: 'Ledger',         icon: BookOpen        },
  { key: 'reports',      label: 'Reports',        icon: BarChart3       },
];
const NAV_DSG: NavItem[] = [
  { key: 'orders',       label: 'Bills',          icon: FileText        },
  { key: 'payments',     label: 'Payments & Due', icon: CreditCard      },
  { key: 'customers',    label: 'Customers',      icon: Users           },
  { key: 'ledger',       label: 'Ledger',         icon: BookOpen        },
  { key: 'reports',      label: 'Reports',        icon: BarChart3       },
];
const NAV_PRT: NavItem[] = [
  { key: 'orders',       label: 'Orders & Rates', icon: ShoppingBag     },
  { key: 'payments',     label: 'Payments & Due', icon: CreditCard      },
  { key: 'customers',    label: 'Customers',      icon: Users           },
  { key: 'ledger',       label: 'Ledger',         icon: BookOpen        },
  { key: 'reports',      label: 'Reports',        icon: BarChart3       },
];

function getNav(mode: BusinessMode): NavItem[] {
  if (mode === 'all') return NAV_ALL;
  if (mode === 'manufacturer') return NAV_MFG;
  if (mode === 'designer') return NAV_DSG;
  return NAV_PRT;
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  React.useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-[#171717] text-white px-5 py-3 rounded-2xl shadow-2xl"
    >
      <CheckCircle size={18} className="text-emerald-400 shrink-0" />
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14}/></button>
    </motion.div>
  );
}

// ─── Quick New Menu ───────────────────────────────────────────────────────────
function QuickNewMenu({ onMfgOrder, onDesignerBill, onPrintingOrder, onPayment, onCustomer }: {
  onMfgOrder: () => void; onDesignerBill: () => void; onPrintingOrder: () => void;
  onPayment: () => void; onCustomer: () => void;
}) {
  const [open, setOpen] = useState(false);
  const items = [
    { label: 'Manufacturing Order', icon: Factory, color: 'text-[#E4572E]', action: onMfgOrder },
    { label: 'Designer Bill', icon: Palette, color: 'text-purple-600', action: onDesignerBill },
    { label: 'Printing Order', icon: Printer, color: 'text-blue-600', action: onPrintingOrder },
    { label: 'Receive Payment', icon: CreditCard, color: 'text-emerald-600', action: onPayment },
    { label: 'New Customer', icon: Users, color: 'text-zinc-600', action: onCustomer },
  ];

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E4572E] text-white text-sm font-bold hover:bg-[#D4431B] shadow-sm">
        <Plus size={16}/>New<ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')}/>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E8E4DE] rounded-2xl shadow-2xl z-30 overflow-hidden"
            onMouseLeave={() => setOpen(false)}
          >
            {items.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={() => { item.action(); setOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#FAF8F5] text-sm text-[#171717] border-b border-[#F5F3EF] last:border-0">
                  <Icon size={16} className={item.color}/>{item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Business Mode Switcher ───────────────────────────────────────────────────
const MODE_CONFIG: Record<BusinessMode, { label: string; icon?: React.FC<{size?: number; className?: string}>; color: string; iconColor: string }> = {
  all:          { label: 'All Business',    color: 'bg-[#171717] text-white border-[#171717]', iconColor: '' },
  manufacturer: { label: 'Manufacturer',   icon: Factory, color: 'bg-orange-50 text-orange-800 border-orange-200', iconColor: 'text-[#E4572E]' },
  designer:     { label: 'Designer',       icon: Palette, color: 'bg-purple-50 text-purple-800 border-purple-200', iconColor: 'text-purple-600' },
  printing:     { label: 'Printing Owner', icon: Printer, color: 'bg-blue-50 text-blue-800 border-blue-200', iconColor: 'text-blue-600' },
};

// ─── Manufacturer Orders Section ──────────────────────────────────────────────
// ─── Manufacturer Orders Section ──────────────────────────────────────────────
function MfgOrdersView({ store, onEdit, onView, onReceivePayment, onViewLedger }: {
  store: ReturnType<typeof useOrderStore>;
  onEdit: (order: ManufacturerOrder) => void;
  onView: (order: ManufacturerOrder) => void;
  onReceivePayment: (customerId: string) => void;
  onViewLedger?: (customerId: string) => void;
}) {
  const columns: Column<ManufacturerOrder>[] = [
    { key: 'orderNumber', label: 'Order #', sortable: true, render: row => (
      <button onClick={() => onView(row)} className="font-bold font-mono text-sm text-[#E4572E] hover:underline text-left">
        {row.orderNumber}
      </button>
    )},
    { key: 'customerId', label: 'Customer', render: row => {
      const c = store.state.customers.find(x => x.id === row.customerId);
      return (
        <div>
          {onViewLedger ? (
            <button
              type="button"
              onClick={() => onViewLedger(row.customerId)}
              className="font-bold text-sm text-[#171717] hover:text-[#E4572E] hover:underline text-left block"
              title="Click to view Customer Ledger"
            >
              {c?.businessName || '—'}
            </button>
          ) : (
            <p className="font-bold text-sm text-[#171717]">{c?.businessName || '—'}</p>
          )}
          <p className="text-xs text-[#71717A]">{row.teamName || c?.name}</p>
        </div>
      );
    }},
    { key: 'fabric', label: 'Fabric & Print', render: row => (
      <div>
        <span className="font-bold text-xs text-[#171717]">{row.fabric || '—'}</span>
        {row.printDetails && <p className="text-[10px] text-[#71717A]">{row.printDetails}</p>}
      </div>
    )},
    { key: 'totalQty', label: 'Qty', sortable: true, render: row => {
      const total = row.totalQty || row.items?.reduce((s, i) => s + (i.totalQty || 0), 0) || 0;
      return (
        <div>
          <span className="font-black text-sm text-[#171717]">{total} pcs</span>
          {(row.totalHalfQty !== undefined || row.totalFullQty !== undefined) && (
            <p className="text-[10px] text-[#71717A]">H: {row.totalHalfQty || 0} · F: {row.totalFullQty || 0}</p>
          )}
        </div>
      );
    }},
    { key: 'grandTotal', label: 'Order Total', sortable: true, render: row => <span className="font-bold text-sm text-[#171717]">{fmt(row.grandTotal)}</span> },
    { key: 'totalPaid', label: 'Advance Paid', render: row => <span className="text-emerald-600 font-bold text-sm">{fmt(row.totalPaid)}</span> },
    { key: 'outstanding', label: 'Balance Due', sortable: true, render: row => {
      const bal = row.balanceAmount !== undefined ? row.balanceAmount : row.outstanding;
      return (
        <span className={cn('font-black text-sm', bal > 0 ? 'text-red-600' : 'text-emerald-700')}>
          {fmt(bal)}
        </span>
      );
    }},
    { key: 'status', label: 'Stages & Status', render: row => {
      const st = row.stageStatus;
      return (
        <div className="space-y-1">
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border', STATUS_COLORS[row.status])}>
            {STATUS_LABELS[row.status]}
          </span>
          {st && (
            <div className="flex gap-1 text-[9px] font-mono">
              <span title={`Design: ${st.design}`} className={cn('px-1 rounded', st.design==='done'?'bg-emerald-100 text-emerald-800':st.design==='in_progress'?'bg-blue-100 text-blue-800':'bg-gray-100 text-gray-500')}>D</span>
              <span title={`Fabric: ${st.fabric}`} className={cn('px-1 rounded', st.fabric==='done'?'bg-emerald-100 text-emerald-800':st.fabric==='in_progress'?'bg-blue-100 text-blue-800':'bg-gray-100 text-gray-500')}>F</span>
              <span title={`Print: ${st.print}`} className={cn('px-1 rounded', st.print==='done'?'bg-emerald-100 text-emerald-800':st.print==='in_progress'?'bg-blue-100 text-blue-800':'bg-gray-100 text-gray-500')}>P</span>
              <span title={`Stitch: ${st.stitch}`} className={cn('px-1 rounded', st.stitch==='done'?'bg-emerald-100 text-emerald-800':st.stitch==='in_progress'?'bg-blue-100 text-blue-800':'bg-gray-100 text-gray-500')}>S</span>
            </div>
          )}
        </div>
      );
    }},
  ];

  return (
    <TransactionTable<ManufacturerOrder>
      columns={columns}
      rows={store.state.manufacturerOrders}
      actions={['view','edit','payment','delete']}
      onAction={(action, row) => {
        if (action === 'view') onView(row);
        if (action === 'edit') onEdit(row);
        if (action === 'payment') onReceivePayment(row.customerId);
        if (action === 'delete') { if(confirm(`Delete ${row.orderNumber}?`)) store.dispatch({ type: 'DELETE_MFG_ORDER', payload: row.id }); }
      }}
      emptyTitle="No Manufacturing Orders"
      emptyDesc="Start creating orders for your jersey manufacturing business."
    />
  );
}

// ─── Designer Bills Section ───────────────────────────────────────────────────
function DesignerBillsView({ store, onReceivePayment, onView, onViewLedger }: {
  store: ReturnType<typeof useOrderStore>;
  onReceivePayment: (customerId: string) => void;
  onView?: (bill: DesignerBill) => void;
  onViewLedger?: (customerId: string) => void;
}) {
  const columns: Column<DesignerBill>[] = [
    {
      key: 'billNumber',
      label: 'Bill #',
      sortable: true,
      render: row => (
        <button
          type="button"
          onClick={() => onView?.(row)}
          className="font-mono text-xs font-bold text-purple-600 hover:text-purple-800 hover:underline text-left"
          title="Click to view Designer Bill"
        >
          {row.billNumber}
        </button>
      ),
    },
    { key: 'customerId', label: 'Customer', render: row => {
      const c = store.state.customers.find(x => x.id === row.customerId);
      return onViewLedger ? (
        <button
          type="button"
          onClick={() => onViewLedger(row.customerId)}
          className="font-bold text-sm text-[#171717] hover:text-[#E4572E] hover:underline text-left block"
          title="Click to view Customer Ledger"
        >
          {c?.businessName || '—'}
        </button>
      ) : (
        <span className="font-semibold">{c?.businessName||'—'}</span>
      );
    }},
    { key: 'productionJobId', label: 'Job #', hideOnMobile: true, render: row => (
      <span className="text-xs font-mono text-[#52525B]">{row.productionJobId || '—'}</span>
    )},
    { key: 'date', label: 'Date', sortable: true, render: row => (
      <span className="text-xs">{new Date(row.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}</span>
    )},
    { key: 'grandTotal', label: 'Amount', sortable: true, render: row => <span className="font-semibold">{fmt(row.grandTotal)}</span> },
    { key: 'totalPaid', label: 'Paid', render: row => <span className="text-emerald-600 font-semibold">{fmt(row.totalPaid)}</span> },
    { key: 'outstanding', label: 'Outstanding', sortable: true, render: row => (
      <span className={cn('font-bold', row.outstanding > 0 ? 'text-red-600' : 'text-emerald-600')}>{fmt(row.outstanding)}</span>
    )},
    { key: 'paymentStatus', label: 'Status', render: row => (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border', STATUS_COLORS[row.paymentStatus])}>{STATUS_LABELS[row.paymentStatus]}</span>
    )},
  ];

  return (
    <TransactionTable<DesignerBill>
      columns={columns}
      rows={store.state.designerBills}
      actions={['view','payment','delete']}
      onAction={(action, row) => {
        if (action === 'view') onView?.(row);
        if (action === 'payment') onReceivePayment(row.customerId);
        if (action === 'delete') { if(confirm(`Delete ${row.billNumber}?`)) store.dispatch({ type: 'DELETE_DESIGNER_BILL', payload: row.id }); }
      }}
      emptyTitle="No Designer Bills"
      emptyDesc="Designer bills generated from production jobs will appear here."
    />
  );
}

// ─── Payments History View ────────────────────────────────────────────────────

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function OrderManagement() {
  const store = useOrderStore();
  const [businessMode, setBusinessMode] = useState<BusinessMode>('all');
  const [subView, setSubView] = useState<SubView>('overview');
  const [globalSearch, setGlobalSearch] = useState('');

  // Modal states
  const [showMfgForm, setShowMfgForm] = useState(false);
  const [editOrder, setEditOrder] = useState<ManufacturerOrder | null>(null);
  const [jobSheetOrder, setJobSheetOrder] = useState<ManufacturerOrder | null>(null);
  const [viewingDesignerBill, setViewingDesignerBill] = useState<DesignerBill | null>(null);
  const [selectedLedgerCustomerId, setSelectedLedgerCustomerId] = useState<string | undefined>();
  const [mfgPrefillCustomerId, setMfgPrefillCustomerId] = useState<string | undefined>();
  const [showDesignerForm, setShowDesignerForm] = useState(false);
  const [dsgPrefillCustomerId, setDsgPrefillCustomerId] = useState<string | undefined>();
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [paymentCustomerId, setPaymentCustomerId] = useState<string | undefined>();
  const [toast, setToast] = useState<string | null>(null);

  const nav = getNav(businessMode);
  const stats = store.getKPIStats(businessMode);

  const showToast = (msg: string) => { setToast(msg); };

  const openCustomerLedger = (customerId?: string) => {
    if (customerId) setSelectedLedgerCustomerId(customerId);
    setSubView('ledger');
  };

  const openMfgOrder = (customerId?: string) => {
    setMfgPrefillCustomerId(customerId);
    setEditOrder(null);
    setShowMfgForm(true);
    if (businessMode !== 'manufacturer') { setBusinessMode('manufacturer'); setSubView('orders'); }
  };

  const openDesignerBill = (customerId?: string) => {
    setDsgPrefillCustomerId(customerId);
    setShowDesignerForm(true);
    if (businessMode !== 'designer') { setBusinessMode('designer'); setSubView('orders'); }
  };

  const openPayment = (customerId?: string) => {
    setPaymentCustomerId(customerId);
    setShowPaymentDrawer(true);
  };

  const openPrintingOrder = () => {
    setBusinessMode('printing');
    setSubView('orders');
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E8E4DE] shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-4">
          {/* Back to home */}
          <Link to="/" className="flex items-center gap-2 mr-2 shrink-0">
            <span className="w-8 h-8 rounded-xl bg-[#E4572E] flex items-center justify-center text-white font-black text-sm">F</span>
            <span className="text-sm font-bold text-[#171717] hidden sm:block">FiveNest</span>
          </Link>
          <div className="h-6 w-px bg-[#E8E4DE]"/>
          <h1 className="text-sm font-black text-[#171717] hidden md:block whitespace-nowrap">Orders & Bills</h1>

          {/* Global search */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]"/>
            <input
              value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Search customer, order, invoice..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E] focus:ring-1 focus:ring-[#E4572E]/20 bg-[#FAF8F5]"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <QuickNewMenu
              onMfgOrder={() => openMfgOrder()}
              onDesignerBill={() => openDesignerBill()}
              onPrintingOrder={openPrintingOrder}
              onPayment={() => openPayment()}
              onCustomer={() => { setSubView('customers'); }}
            />
            <button onClick={() => openPayment()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm font-semibold hover:bg-[#FAF8F5] whitespace-nowrap">
              <CreditCard size={14} className="text-emerald-600"/> Receive Payment
            </button>
            <button className="p-2 rounded-xl border border-[#E8E4DE] hover:bg-[#FAF8F5] relative">
              <Bell size={16} className="text-[#52525B]"/>
            </button>
          </div>
        </div>
      </header>

      {/* ── Business Mode Switcher ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E8E4DE]">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto">
          {(['all','manufacturer','designer','printing'] as BusinessMode[]).map(mode => {
            const cfg = MODE_CONFIG[mode];
            const Icon = cfg.icon;
            const isActive = businessMode === mode;
            return (
              <button
                key={mode}
                onClick={() => {
                  setBusinessMode(mode);
                  if (mode === 'all') {
                    setSubView('overview');
                  } else {
                    if (subView === 'overview') {
                      setSubView('orders');
                    }
                  }
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap',
                  isActive ? cfg.color : 'bg-white text-[#52525B] border-[#E8E4DE] hover:border-[#E4572E]/30 hover:text-[#171717]'
                )}
              >
                {Icon && <Icon size={15} className={isActive ? '' : cfg.iconColor}/>}
                {cfg.label}
              </button>
            );
          })}

          {/* Consolidated stats in switcher bar */}
          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="text-[#71717A]">
              Outstanding: <span className="font-black text-red-600">{fmt(stats.outstanding)}</span>
            </span>
            <span className="text-[#71717A]">
              This Month: <span className="font-black text-[#E4572E]">{fmt(stats.thisMonth)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex max-w-[1600px] mx-auto w-full">
        {/* Left sidebar nav */}
        <nav className="w-48 shrink-0 bg-white border-r border-[#E8E4DE] py-4 px-3 hidden lg:block">
          <div className="space-y-0.5">
            {nav.map(item => {
              const Icon = item.icon;
              const active = subView === item.key;
              return (
                <button key={item.key} onClick={() => setSubView(item.key)}
                  className={cn('flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all', active ? 'bg-[#E4572E]/10 text-[#E4572E]' : 'text-[#52525B] hover:bg-[#FAF8F5] hover:text-[#171717]')}>
                  <Icon size={15} className={active ? 'text-[#E4572E]' : ''}/>
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content area */}
        <main className="flex-1 p-6 overflow-y-auto min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={`${businessMode}-${subView}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Overview / Dashboard (Consolidated Cockpit for All Business) */}
              {subView === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-[#171717]">
                      Business Command Center
                    </h2>
                    <p className="text-sm text-[#71717A] mt-0.5">
                      Consolidated operations & quick hub for Manufacturing, Design Studio, and Printing
                    </p>
                  </div>
                  <KPICards stats={stats} mode="all" />

                  {/* ── Smart Business Hub (Manufacturer, Designer, Printing Owner Cards) ── */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Manufacturer Card */}
                    <div className="bg-white border border-[#E8E4DE] hover:border-orange-300 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                              <Factory size={18} />
                            </span>
                            <div>
                              <h4 className="font-black text-sm text-[#171717]">Manufacturer</h4>
                              <p className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Sportswear Production</p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                            {store.state.manufacturerOrders.length} Orders
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E4DE] text-xs">
                          <div>
                            <span className="text-[10px] uppercase text-[#71717A] font-bold block">Invoiced</span>
                            <span className="font-black text-[#171717]">{fmt(stats.mfgRevenue)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[#71717A] font-bold block">Balance Due</span>
                            <span className="font-black text-red-600">{fmt(store.state.manufacturerOrders.reduce((s,o)=>s+o.outstanding,0))}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#71717A] px-1 mb-2">
                          <span>In Production: <strong className="text-[#171717]">{store.state.manufacturerOrders.filter(o=>o.status==='production').length}</strong></span>
                          <span>Ready/Sent: <strong className="text-[#171717]">{store.state.manufacturerOrders.filter(o=>o.status==='ready'||o.status==='dispatched').length}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-[#E8E4DE]">
                        <button
                          onClick={() => { setBusinessMode('manufacturer'); setSubView('orders'); }}
                          className="flex-1 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold transition-colors text-center flex items-center justify-center gap-1"
                        >
                          Open Orders <ChevronRight size={14} />
                        </button>
                        <button
                          onClick={() => openMfgOrder()}
                          className="px-3 py-2 rounded-xl bg-[#E4572E] hover:bg-[#D4431B] text-white text-xs font-bold transition-colors"
                          title="New Manufacturer Order"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Designer Studio Card */}
                    <div className="bg-white border border-[#E8E4DE] hover:border-purple-300 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                              <Palette size={18} />
                            </span>
                            <div>
                              <h4 className="font-black text-sm text-[#171717]">Designer Studio</h4>
                              <p className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Artwork & Digitizing</p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                            {store.state.designerBills.length} Bills
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E4DE] text-xs">
                          <div>
                            <span className="text-[10px] uppercase text-[#71717A] font-bold block">Invoiced</span>
                            <span className="font-black text-[#171717]">{fmt(stats.dsgRevenue)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[#71717A] font-bold block">Balance Due</span>
                            <span className="font-black text-red-600">{fmt(store.state.designerBills.reduce((s,b)=>s+b.outstanding,0))}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#71717A] px-1 mb-2">
                          <span>Paid Bills: <strong className="text-emerald-700">{store.state.designerBills.filter(b=>b.paymentStatus==='paid').length}</strong></span>
                          <span>Pending: <strong className="text-red-600">{store.state.designerBills.filter(b=>b.outstanding>0).length}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-[#E8E4DE]">
                        <button
                          onClick={() => { setBusinessMode('designer'); setSubView('orders'); }}
                          className="flex-1 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors text-center flex items-center justify-center gap-1"
                        >
                          Open Bills <ChevronRight size={14} />
                        </button>
                        <button
                          onClick={() => openDesignerBill()}
                          className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
                          title="New Designer Bill"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Printing Owner Card */}
                    <div className="bg-white border border-[#E8E4DE] hover:border-blue-300 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                              <Printer size={18} />
                            </span>
                            <div>
                              <h4 className="font-black text-sm text-[#171717]">Printing Owner</h4>
                              <p className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Sublimation & Print Jobs</p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            {store.state.printingOrders.length} Jobs
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E4DE] text-xs">
                          <div>
                            <span className="text-[10px] uppercase text-[#71717A] font-bold block">Invoiced</span>
                            <span className="font-black text-[#171717]">{fmt(stats.prtRevenue)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[#71717A] font-bold block">Balance Due</span>
                            <span className="font-black text-red-600">{fmt(store.state.printingOrders.reduce((s,o)=>s+o.outstanding,0))}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#71717A] px-1 mb-2">
                          <span>In Printing: <strong className="text-[#171717]">{store.state.printingOrders.filter(o=>o.status==='printing').length}</strong></span>
                          <span>Delivered: <strong className="text-emerald-700">{store.state.printingOrders.filter(o=>o.status==='delivered').length}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-[#E8E4DE]">
                        <button
                          onClick={() => { setBusinessMode('printing'); setSubView('orders'); }}
                          className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-colors text-center flex items-center justify-center gap-1"
                        >
                          Open Printing <ChevronRight size={14} />
                        </button>
                        <button
                          onClick={() => openPrintingOrder()}
                          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                          title="New Printing Order"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Activity feed & Outstanding preview */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Recent transactions */}
                    <div className="bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-[#E8E4DE] flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#171717]">Recent Activity</h3>
                        <button onClick={() => setSubView('orders')} className="text-xs text-[#E4572E] font-semibold hover:underline">View All</button>
                      </div>
                      <div className="divide-y divide-[#F0EDE8]">
                        {[
                          ...store.state.manufacturerOrders.slice(-3).map(o => ({ type: 'manufacturer' as const, number: o.orderNumber, desc: store.state.customers.find(c=>c.id===o.customerId)?.businessName||'—', amount: o.grandTotal, date: o.orderDate, status: o.paymentStatus })),
                          ...store.state.designerBills.slice(-2).map(b => ({ type: 'designer' as const, number: b.billNumber, desc: store.state.customers.find(c=>c.id===b.customerId)?.businessName||'—', amount: b.grandTotal, date: b.date, status: b.paymentStatus })),
                          ...store.state.printingOrders.slice(-2).map(o => ({ type: 'printing' as const, number: o.orderNumber, desc: store.state.customers.find(c=>c.id===o.customerId)?.businessName||'—', amount: o.grandTotal, date: o.date, status: o.paymentStatus })),
                        ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((item, i) => {
                          const TYPE_INFO = { manufacturer: { label: 'MFG', cls: 'bg-orange-100 text-orange-700' }, designer: { label: 'DSG', cls: 'bg-purple-100 text-purple-700' }, printing: { label: 'PRT', cls: 'bg-blue-100 text-blue-700' } };
                          const info = TYPE_INFO[item.type];
                          return (
                            <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAF8F5]">
                              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0', info.cls)}>{info.label}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-mono text-[#71717A]">{item.number}</p>
                                <p className="text-sm font-semibold text-[#171717] truncate">{item.desc}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-black text-[#171717]">{fmt(item.amount)}</p>
                                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', STATUS_COLORS[item.status])}>{STATUS_LABELS[item.status]}</span>
                              </div>
                            </div>
                          );
                        })}
                        {store.state.manufacturerOrders.length + store.state.designerBills.length + store.state.printingOrders.length === 0 && (
                          <div className="text-center py-10 text-[#71717A] text-sm">No transactions yet. Start by creating an order.</div>
                        )}
                      </div>
                    </div>

                    {/* Outstanding summary */}
                    <div className="bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-[#E8E4DE] flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#171717]">Outstanding Summary</h3>
                        <button onClick={() => setSubView('payments')} className="text-xs text-[#E4572E] font-semibold hover:underline">View in Payments →</button>
                      </div>
                      <div className="p-5 space-y-4">
                        {[
                          { label: 'Manufacturer Outstanding', val: store.state.manufacturerOrders.reduce((s,o) => s+o.outstanding, 0), color: 'bg-orange-500' },
                          { label: 'Designer Outstanding', val: store.state.designerBills.reduce((s,b) => s+b.outstanding, 0), color: 'bg-purple-500' },
                          { label: 'Printing Outstanding', val: store.state.printingOrders.reduce((s,o) => s+o.outstanding, 0), color: 'bg-blue-500' },
                        ].map(item => {
                          const total = stats.outstanding || 1;
                          const pct = Math.round((item.val / total) * 100);
                          return (
                            <div key={item.label}>
                              <div className="flex justify-between text-xs font-semibold mb-1.5">
                                <span className="text-[#52525B]">{item.label}</span>
                                <span className="text-[#171717]">{fmt(item.val)}</span>
                              </div>
                              <div className="h-2 bg-[#F0EDE8] rounded-full overflow-hidden">
                                <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{width:`${Math.min(pct,100)}%`}}/>
                              </div>
                            </div>
                          );
                        })}
                        <div className="pt-2 border-t border-[#E8E4DE] flex justify-between">
                          <span className="text-sm font-bold text-[#171717]">Total Outstanding</span>
                          <span className="text-lg font-black text-red-600">{fmt(stats.outstanding)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders sub-view */}
              {subView === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-[#171717]">
                      {businessMode === 'manufacturer' ? 'Manufacturing Orders' :
                       businessMode === 'designer' ? 'Designer Bills' :
                       businessMode === 'printing' ? 'Printing Orders' : 'All Orders'}
                    </h2>
                    {businessMode === 'manufacturer' && (
                      <button onClick={() => openMfgOrder()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E4572E] text-white text-sm font-bold hover:bg-[#D4431B] shadow-sm">
                        <Plus size={16}/> New Order
                      </button>
                    )}
                    {businessMode === 'designer' && (
                      <button onClick={() => openDesignerBill()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 shadow-sm">
                        <Plus size={16}/> New Bill
                      </button>
                    )}
                  </div>
                  {(businessMode === 'manufacturer' || businessMode === 'all') && (
                    <MfgOrdersView
                      store={store}
                      onEdit={order => { setEditOrder(order); setShowMfgForm(true); }}
                      onView={order => setJobSheetOrder(order)}
                      onReceivePayment={openPayment}
                      onViewLedger={openCustomerLedger}
                    />
                  )}
                  {(businessMode === 'designer' || businessMode === 'all') && (
                    <DesignerBillsView
                      store={store}
                      onReceivePayment={openPayment}
                      onView={bill => setViewingDesignerBill(bill)}
                      onViewLedger={openCustomerLedger}
                    />
                  )}
                  {businessMode === 'printing' && (
                    <PrintingModule
                      store={store}
                      onReceivePayment={openPayment}
                      onViewCustomerLedger={openCustomerLedger}
                    />
                  )}
                </div>
              )}

              {/* Customers sub-view */}
              {subView === 'customers' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-[#171717]">Customers</h2>
                  <CustomerPanel
                    store={store}
                    onNewMfgOrder={openMfgOrder}
                    onNewDesignerBill={openDesignerBill}
                    onNewPrintingOrder={openPrintingOrder}
                    onReceivePayment={openPayment}
                    onViewLedger={openCustomerLedger}
                  />
                </div>
              )}

              {/* Payments & Due sub-view (with smart Outstanding Receivables integration) */}
              {subView === 'payments' && (
                <PaymentsHub
                  store={store}
                  mode={businessMode}
                  onReceivePayment={openPayment}
                  onViewLedger={openCustomerLedger}
                />
              )}

              {/* Ledger sub-view */}
              {subView === 'ledger' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-[#171717]">Customer Ledger</h2>
                  <LedgerView
                    store={store}
                    mode={businessMode}
                    customerId={selectedLedgerCustomerId}
                    onSelectCustomer={id => setSelectedLedgerCustomerId(id)}
                    onReceivePayment={openPayment}
                  />
                </div>
              )}

              {/* Reports sub-view */}
              {subView === 'reports' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-black text-[#171717]">Reports & Analytics</h2>
                  <ReportsView store={store}/>
                </div>
              )}

              {/* Mobile nav (bottom) */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E4DE] flex overflow-x-auto z-20 px-2 py-1">
                {nav.map(item => {
                  const Icon = item.icon;
                  const active = subView === item.key;
                  return (
                    <button key={item.key} onClick={() => setSubView(item.key)}
                      className={cn('flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-semibold transition-all whitespace-nowrap', active ? 'text-[#E4572E]' : 'text-[#71717A]')}>
                      <Icon size={18}/>{item.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Global drawers / modals ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showMfgForm && (
          <OrderForm
            store={store}
            editOrder={editOrder}
            prefillCustomerId={mfgPrefillCustomerId}
            onClose={() => { setShowMfgForm(false); setEditOrder(null); setMfgPrefillCustomerId(undefined); }}
            onSaved={() => { setShowMfgForm(false); setEditOrder(null); setMfgPrefillCustomerId(undefined); showToast('Manufacturing order saved!'); }}
          />
        )}
        {showDesignerForm && (
          <DesignerBillForm
            store={store}
            prefillCustomerId={dsgPrefillCustomerId}
            onClose={() => { setShowDesignerForm(false); setDsgPrefillCustomerId(undefined); }}
            onSaved={() => { setShowDesignerForm(false); setDsgPrefillCustomerId(undefined); showToast('Designer bill created!'); }}
          />
        )}
        {showPaymentDrawer && (
          <PaymentDrawer
            store={store}
            customerId={paymentCustomerId}
            onClose={() => { setShowPaymentDrawer(false); setPaymentCustomerId(undefined); }}
            onSaved={() => { setShowPaymentDrawer(false); setPaymentCustomerId(undefined); showToast('Payment recorded!'); }}
          />
        )}
        {jobSheetOrder && (
          <JobSheetModal
            order={jobSheetOrder}
            customer={store.state.customers.find(c => c.id === jobSheetOrder.customerId)}
            onClose={() => setJobSheetOrder(null)}
            onEdit={() => {
              const ord = jobSheetOrder;
              setJobSheetOrder(null);
              setEditOrder(ord);
              setShowMfgForm(true);
            }}
          />
        )}
        {viewingDesignerBill && (
          <DesignerBillModal
            bill={viewingDesignerBill}
            customer={store.state.customers.find(c => c.id === viewingDesignerBill.customerId)}
            onClose={() => setViewingDesignerBill(null)}
            onReceivePayment={openPayment}
            onViewCustomerLedger={openCustomerLedger}
          />
        )}
        {toast && <Toast message={toast} onClose={() => setToast(null)}/>}
      </AnimatePresence>
    </div>
  );
}
