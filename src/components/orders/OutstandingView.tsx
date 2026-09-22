import React, { useMemo, useState } from 'react';
import { AlertCircle, Clock, AlertOctagon, CheckCircle, MessageSquare } from 'lucide-react';
import {
  useOrderStore, BusinessType, fmt, STATUS_COLORS, STATUS_LABELS
} from '../../hooks/useOrderStore';

const cn = (...c: (string|undefined|boolean)[]) => c.filter(Boolean).join(' ');

interface Props {
  store: ReturnType<typeof useOrderStore>;
  mode: 'all' | BusinessType;
  onReceivePayment: (customerId: string) => void;
}

type AgingBucket = 'not_due' | '0_30' | '31_60' | '61_90' | '90plus';

interface OutstandingRow {
  id: string;
  customerId: string;
  customerName: string;
  serviceType: BusinessType;
  orderNumber: string;
  date: string;
  dueDate: string;
  total: number;
  paid: number;
  outstanding: number;
  daysOverdue: number;
  bucket: AgingBucket;
  paymentStatus: string;
}

type OutstandingTab = 'all' | BusinessType | 'overdue' | 'today' | 'week';

const getBucket = (daysOverdue: number): AgingBucket => {
  if (daysOverdue <= 0) return 'not_due';
  if (daysOverdue <= 30) return '0_30';
  if (daysOverdue <= 60) return '31_60';
  if (daysOverdue <= 90) return '61_90';
  return '90plus';
};

const BUCKET_CONFIG: Record<AgingBucket, { label: string; bg: string; text: string; border: string }> = {
  not_due: { label: 'Not Due', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  '0_30':  { label: '0–30 Days', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  '31_60': { label: '31–60 Days', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  '61_90': { label: '61–90 Days', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  '90plus': { label: '90+ Days', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

const TYPE_BADGE: Record<BusinessType, string> = {
  manufacturer: 'bg-orange-50 text-orange-700 border-orange-200',
  designer: 'bg-purple-50 text-purple-700 border-purple-200',
  printing: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function OutstandingView({ store, mode, onReceivePayment }: Props) {
  const [tab, setTab] = useState<OutstandingTab>('all');
  const [customerFilter, setCustomerFilter] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allRows: OutstandingRow[] = useMemo(() => {
    const rows: OutstandingRow[] = [];

    for (const o of store.state.manufacturerOrders.filter(x => x.outstanding > 0)) {
      const cust = store.state.customers.find(c => c.id === o.customerId);
      const due = o.dueDate ? new Date(o.dueDate) : null;
      const days = due ? Math.floor((today.getTime() - due.getTime()) / 86400000) : 0;
      rows.push({
        id: o.id, customerId: o.customerId, customerName: cust?.businessName || '—',
        serviceType: 'manufacturer', orderNumber: o.orderNumber, date: o.orderDate,
        dueDate: o.dueDate, total: o.grandTotal, paid: o.totalPaid, outstanding: o.outstanding,
        daysOverdue: days, bucket: getBucket(days), paymentStatus: o.paymentStatus,
      });
    }

    for (const b of store.state.designerBills.filter(x => x.outstanding > 0)) {
      const cust = store.state.customers.find(c => c.id === b.customerId);
      const due = b.dueDate ? new Date(b.dueDate) : null;
      const days = due ? Math.floor((today.getTime() - due.getTime()) / 86400000) : 0;
      rows.push({
        id: b.id, customerId: b.customerId, customerName: cust?.businessName || '—',
        serviceType: 'designer', orderNumber: b.billNumber, date: b.date,
        dueDate: b.dueDate, total: b.grandTotal, paid: b.totalPaid, outstanding: b.outstanding,
        daysOverdue: days, bucket: getBucket(days), paymentStatus: b.paymentStatus,
      });
    }

    for (const o of store.state.printingOrders.filter(x => x.outstanding > 0)) {
      const cust = store.state.customers.find(c => c.id === o.customerId);
      const due = o.deliveryDate ? new Date(o.deliveryDate) : null;
      const days = due ? Math.floor((today.getTime() - due.getTime()) / 86400000) : 0;
      rows.push({
        id: o.id, customerId: o.customerId, customerName: cust?.businessName || '—',
        serviceType: 'printing', orderNumber: o.orderNumber, date: o.date,
        dueDate: o.deliveryDate, total: o.grandTotal, paid: o.totalPaid, outstanding: o.outstanding,
        daysOverdue: days, bucket: getBucket(days), paymentStatus: o.paymentStatus,
      });
    }

    return rows.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [store.state]);

  const filtered = useMemo(() => {
    let rows = allRows;
    if (mode !== 'all') rows = rows.filter(r => r.serviceType === mode);
    if (customerFilter) rows = rows.filter(r => r.customerName.toLowerCase().includes(customerFilter.toLowerCase()));
    if (tab === 'all') return rows;
    if (tab === 'overdue') return rows.filter(r => r.daysOverdue > 0);
    if (tab === 'today') return rows.filter(r => r.dueDate === today.toISOString().slice(0, 10));
    if (tab === 'week') {
      const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
      return rows.filter(r => r.dueDate && r.dueDate <= nextWeek.toISOString().slice(0, 10) && r.dueDate >= today.toISOString().slice(0, 10));
    }
    return rows.filter(r => r.serviceType === tab);
  }, [allRows, tab, mode, customerFilter, today]);

  // Aging totals
  const aging = useMemo(() => {
    const buckets: Record<AgingBucket, { count: number; total: number }> = {
      not_due: { count: 0, total: 0 }, '0_30': { count: 0, total: 0 }, '31_60': { count: 0, total: 0 }, '61_90': { count: 0, total: 0 }, '90plus': { count: 0, total: 0 },
    };
    for (const row of allRows) {
      buckets[row.bucket].count++;
      buckets[row.bucket].total += row.outstanding;
    }
    return buckets;
  }, [allRows]);

  const totalOutstanding = filtered.reduce((s, r) => s + r.outstanding, 0);

  const sendReminder = (row: OutstandingRow) => {
    const cust = store.state.customers.find(c => c.id === row.customerId);
    if (!cust) return;
    const msg = `Dear ${cust.name}, your payment of ${fmt(row.outstanding)} for order ${row.orderNumber} is ${row.daysOverdue > 0 ? 'overdue' : 'due soon'}. Please settle at the earliest. — FiveNest`;
    window.open(`https://wa.me/91${cust.whatsapp || cust.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const TABS: Array<{ key: OutstandingTab; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'designer', label: 'Designer' },
    { key: 'printing', label: 'Printing' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'today', label: 'Due Today' },
    { key: 'week', label: 'Due This Week' },
  ];

  return (
    <div className="space-y-4">
      {/* Aging summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {(Object.entries(BUCKET_CONFIG) as Array<[AgingBucket, typeof BUCKET_CONFIG[AgingBucket]]>).map(([key, cfg]) => {
          const data = aging[key];
          return (
            <div key={key} className={cn('rounded-xl border p-4', cfg.bg, cfg.border)}>
              <p className={cn('text-[11px] font-bold uppercase tracking-wider', cfg.text)}>{cfg.label}</p>
              <p className={cn('text-xl font-black mt-1', cfg.text)}>{fmt(data.total)}</p>
              <p className={cn('text-[10px]', cfg.text)}>{data.count} invoice{data.count !== 1 ? 's' : ''}</p>
            </div>
          );
        })}
      </div>

      {/* Tab bar + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl p-1 flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', tab === t.key ? 'bg-white shadow-sm text-[#171717]' : 'text-[#71717A] hover:text-[#171717]')}>
              {t.label}
            </button>
          ))}
        </div>
        <input value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}
          placeholder="Filter by customer..." className="px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E] bg-white"/>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#E8E4DE] rounded-2xl">
          <CheckCircle size={40} className="mx-auto text-emerald-400 mb-3"/>
          <p className="font-semibold text-[#52525B]">No Outstanding Invoices</p>
          <p className="text-sm text-[#71717A] mt-1">All invoices are settled for the selected filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E8E4DE]">
                {['Customer','Service','Order / Bill #','Invoice Date','Due Date','Total','Paid','Outstanding','Days Overdue','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[#71717A] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} className={cn('border-t border-[#E8E4DE] transition-colors',
                  row.daysOverdue > 0 ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-[#FAF8F5]'
                )}>
                  <td className="px-4 py-3 font-semibold text-sm text-[#171717]">{row.customerName}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border', TYPE_BADGE[row.serviceType])}>
                      {row.serviceType.charAt(0).toUpperCase()+row.serviceType.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-[#52525B]">{row.orderNumber}</td>
                  <td className="px-4 py-3 text-xs text-[#71717A] whitespace-nowrap">
                    {row.date ? new Date(row.date).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'2-digit'}) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#71717A] whitespace-nowrap">
                    {row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'2-digit'}) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#171717]">{fmt(row.total)}</td>
                  <td className="px-4 py-3 text-sm text-emerald-600 font-semibold">{fmt(row.paid)}</td>
                  <td className="px-4 py-3 text-sm font-black text-red-600">{fmt(row.outstanding)}</td>
                  <td className="px-4 py-3">
                    {row.daysOverdue > 0 ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                        <AlertOctagon size={12}/>{row.daysOverdue}d
                      </span>
                    ) : row.daysOverdue < 0 ? (
                      <span className="flex items-center gap-1 text-xs text-[#71717A]"><Clock size={12}/>{Math.abs(row.daysOverdue)}d left</span>
                    ) : (
                      <span className="text-xs text-amber-600 font-bold">Due Today</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border', STATUS_COLORS[row.paymentStatus])}>
                      {STATUS_LABELS[row.paymentStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onReceivePayment(row.customerId)} title="Receive Payment"
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors">
                        <CheckCircle size={15}/>
                      </button>
                      <button onClick={() => sendReminder(row)} title="Send Reminder via WhatsApp"
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors">
                        <MessageSquare size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#E4572E]/20 bg-[#FAF8F5]">
                <td colSpan={7} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#71717A]">
                  Total Outstanding ({filtered.length} records)
                </td>
                <td className="px-4 py-3 text-base font-black text-red-600">{fmt(totalOutstanding)}</td>
                <td colSpan={3}/>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
