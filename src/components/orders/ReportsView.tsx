import React, { useMemo } from 'react';
import { Download, Printer, TrendingUp, Users, IndianRupee } from 'lucide-react';
import { useOrderStore, getCustomerSummary, fmt } from '../../hooks/useOrderStore';

interface Props {
  store: ReturnType<typeof useOrderStore>;
}

const BAR_MAX_WIDTH = 280;

function HorizontalBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const width = max > 0 ? Math.round((value / max) * BAR_MAX_WIDTH) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs font-semibold text-[#52525B] text-right shrink-0">{label}</span>
      <div className="flex-1 bg-[#F0EDE8] rounded-full h-6 overflow-hidden" style={{ maxWidth: `${BAR_MAX_WIDTH}px` }}>
        <div className={`h-full ${color} rounded-full transition-all duration-500 flex items-center`} style={{ width: `${width}px` }}>
          {width > 60 && <span className="text-[10px] font-bold text-white pl-2">{fmt(value)}</span>}
        </div>
      </div>
      {width <= 60 && <span className="text-xs font-bold text-[#171717]">{fmt(value)}</span>}
    </div>
  );
}

export default function ReportsView({ store }: Props) {
  const mfgRevenue = store.state.manufacturerOrders.reduce((s, o) => s + o.grandTotal, 0);
  const dsgRevenue = store.state.designerBills.reduce((s, b) => s + b.grandTotal, 0);
  const prtRevenue = store.state.printingOrders.reduce((s, o) => s + o.grandTotal, 0);
  const maxRevenue = Math.max(mfgRevenue, dsgRevenue, prtRevenue, 1);

  const totalInvoiced = mfgRevenue + dsgRevenue + prtRevenue;
  const totalReceived = [
    ...store.state.manufacturerOrders.map(o => o.totalPaid),
    ...store.state.designerBills.map(b => b.totalPaid),
    ...store.state.printingOrders.map(o => o.totalPaid),
  ].reduce((s, v) => s + v, 0);
  const totalOutstanding = totalInvoiced - totalReceived;
  const totalOrders = store.state.manufacturerOrders.length + store.state.designerBills.length + store.state.printingOrders.length;
  const avgOrder = totalOrders > 0 ? totalInvoiced / totalOrders : 0;
  const overdue = [
    ...store.state.manufacturerOrders.filter(o => o.paymentStatus === 'overdue').map(o => o.outstanding),
    ...store.state.designerBills.filter(b => b.paymentStatus === 'overdue').map(b => b.outstanding),
    ...store.state.printingOrders.filter(o => o.paymentStatus === 'overdue').map(o => o.outstanding),
  ].reduce((s, v) => s + v, 0);

  // Top customers
  const topCustomers = useMemo(() => {
    return store.state.customers.map(c => {
      const s = getCustomerSummary(store.state, c.id);
      return { ...c, summary: s };
    }).sort((a, b) => b.summary.totalBusiness - a.summary.totalBusiness).slice(0, 5);
  }, [store.state]);

  // Monthly revenue (last 6 months)
  const months = useMemo(() => {
    const result: Array<{ label: string; mfg: number; dsg: number; prt: number; total: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('en-IN', { month: 'short' });
      const mfg = store.state.manufacturerOrders.filter(o => o.orderDate.startsWith(key)).reduce((s, o) => s + o.grandTotal, 0);
      const dsg = store.state.designerBills.filter(b => b.date.startsWith(key)).reduce((s, b) => s + b.grandTotal, 0);
      const prt = store.state.printingOrders.filter(o => o.date.startsWith(key)).reduce((s, o) => s + o.grandTotal, 0);
      result.push({ label, mfg, dsg, prt, total: mfg + dsg + prt });
    }
    return result;
  }, [store.state]);

  const maxMonthly = Math.max(...months.map(m => m.total), 1);

  const handleExportCSV = () => {
    const rows = [
      ['Type','Order Number','Customer','Date','Amount','Paid','Outstanding','Status'],
      ...store.state.manufacturerOrders.map(o => {
        const c = store.state.customers.find(x => x.id === o.customerId);
        return ['Manufacturer', o.orderNumber, c?.businessName||'', o.orderDate, o.grandTotal.toFixed(2), o.totalPaid.toFixed(2), o.outstanding.toFixed(2), o.paymentStatus];
      }),
      ...store.state.designerBills.map(b => {
        const c = store.state.customers.find(x => x.id === b.customerId);
        return ['Designer', b.billNumber, c?.businessName||'', b.date, b.grandTotal.toFixed(2), b.totalPaid.toFixed(2), b.outstanding.toFixed(2), b.paymentStatus];
      }),
      ...store.state.printingOrders.map(o => {
        const c = store.state.customers.find(x => x.id === o.customerId);
        return ['Printing', o.orderNumber, c?.businessName||'', o.date, o.grandTotal.toFixed(2), o.totalPaid.toFixed(2), o.outstanding.toFixed(2), o.paymentStatus];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fivenest-report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const KPI_CARDS = [
    { label: 'Total Customers', value: store.state.customers.length.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Invoiced', value: fmt(totalInvoiced), icon: IndianRupee, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Total Collected', value: fmt(totalReceived), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Outstanding', value: fmt(totalOutstanding), icon: IndianRupee, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Overdue', value: fmt(overdue), icon: IndianRupee, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Avg Order Value', value: fmt(avgOrder), icon: TrendingUp, color: 'text-[#E4572E]', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Export actions */}
      <div className="flex justify-end gap-2">
        <button onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E4DE] text-sm font-semibold hover:bg-[#F5F3EF]">
          <Download size={15}/> Export CSV
        </button>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E4DE] text-sm font-semibold hover:bg-[#F5F3EF]">
          <Printer size={15}/> Print Report
        </button>
      </div>

      {/* Revenue by business (bar chart) */}
      <div className="bg-white border border-[#E8E4DE] rounded-2xl p-6">
        <h3 className="text-sm font-black text-[#171717] uppercase tracking-wider mb-5">Revenue by Business Category</h3>
        <div className="space-y-4">
          <HorizontalBar value={mfgRevenue} max={maxRevenue} color="bg-[#E4572E]" label="Manufacturer" />
          <HorizontalBar value={dsgRevenue} max={maxRevenue} color="bg-purple-500" label="Designer" />
          <HorizontalBar value={prtRevenue} max={maxRevenue} color="bg-blue-500" label="Printing" />
        </div>
        <div className="mt-5 pt-4 border-t border-[#E8E4DE] flex justify-between text-sm">
          <span className="text-[#71717A] font-semibold">Total Revenue</span>
          <span className="font-black text-[#171717] text-lg">{fmt(totalInvoiced)}</span>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {KPI_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-[#E8E4DE] rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <Icon size={16} className={card.color}/>
              </div>
              <p className="text-xl font-black text-[#171717]">{card.value}</p>
              <p className="text-xs uppercase tracking-wider text-[#71717A] font-semibold mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Top customers */}
      <div className="bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E4DE] bg-[#FAF8F5]">
          <h3 className="text-sm font-black text-[#171717] uppercase tracking-wider">Top Customers</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8E4DE]">
              {['Rank','Customer','Services','Total Business','Outstanding','Last Order'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-wider font-semibold text-[#71717A]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((c, i) => (
              <tr key={c.id} className="border-t border-[#E8E4DE] hover:bg-[#FAF8F5]">
                <td className="px-5 py-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-zinc-100 text-zinc-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-[#FAF8F5] text-[#71717A]'}`}>
                    {i+1}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <p className="font-bold text-sm text-[#171717]">{c.businessName}</p>
                  <p className="text-xs text-[#71717A]">{c.name}</p>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    {c.summary.services.map(s => (
                      <span key={s} className="text-[10px] font-black px-1.5 py-0.5 rounded-full border bg-[#FAF8F5] text-[#52525B] border-[#E8E4DE]">
                        {s[0].toUpperCase()}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3 font-semibold text-sm">{fmt(c.summary.totalBusiness)}</td>
                <td className="px-5 py-3">
                  <span className={`text-sm font-bold ${c.summary.outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {fmt(c.summary.outstanding)}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-[#71717A]">
                  {c.summary.lastOrder !== '—' ? new Date(c.summary.lastOrder).toLocaleDateString('en-IN', {day:'2-digit',month:'short'}) : '—'}
                </td>
              </tr>
            ))}
            {topCustomers.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-[#71717A] text-sm">No customers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Monthly revenue chart */}
      <div className="bg-white border border-[#E8E4DE] rounded-2xl p-6">
        <h3 className="text-sm font-black text-[#171717] uppercase tracking-wider mb-5">Monthly Revenue — Last 6 Months</h3>
        <div className="flex items-end gap-3 h-40">
          {months.map((m) => {
            const totalH = maxMonthly > 0 ? (m.total / maxMonthly) * 128 : 0;
            const mfgH = m.total > 0 ? (m.mfg / m.total) * totalH : 0;
            const dsgH = m.total > 0 ? (m.dsg / m.total) * totalH : 0;
            const prtH = m.total > 0 ? (m.prt / m.total) * totalH : 0;
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[10px] font-bold text-[#71717A]">{m.total > 0 ? fmt(m.total) : ''}</p>
                <div className="w-full flex flex-col justify-end" style={{ height: '128px' }}>
                  <div className="flex flex-col-reverse w-full rounded-t-lg overflow-hidden">
                    {prtH > 0 && <div style={{ height: `${prtH}px` }} className="bg-blue-400 w-full"/>}
                    {dsgH > 0 && <div style={{ height: `${dsgH}px` }} className="bg-purple-400 w-full"/>}
                    {mfgH > 0 && <div style={{ height: `${mfgH}px` }} className="bg-[#E4572E] w-full"/>}
                    {m.total === 0 && <div style={{ height: '4px' }} className="bg-[#E8E4DE] w-full rounded-t-sm"/>}
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#52525B]">{m.label}</p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#E8E4DE]">
          {[
            { color: 'bg-[#E4572E]', label: 'Manufacturer' },
            { color: 'bg-purple-400', label: 'Designer' },
            { color: 'bg-blue-400', label: 'Printing' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${l.color}`}/>
              <span className="text-xs text-[#71717A] font-semibold">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
