import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Printer, MessageSquare, CheckCircle2, Clock, AlertCircle,
  Building2, Camera, Download, Check, Edit3, Loader2, Copy,
  CreditCard, Landmark, FileText, Sparkles
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { ManufacturerOrder, Customer, CHEST_SIZES, fmt } from '../../hooks/useOrderStore';
import {
  CompanyProfile, getCompanyProfile, saveCompanyProfile, numberToWordsIndian
} from '../../lib/companyProfile';
import CompanyProfileModal from './CompanyProfileModal';

interface Props {
  order: ManufacturerOrder;
  customer?: Customer;
  onClose: () => void;
  onEdit?: () => void;
  onReceivePayment?: (customerId: string) => void;
}

export default function JobSheetModal({ order, customer, onClose, onEdit, onReceivePayment }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Company Profile state (persisted to localStorage)
  const [company, setCompany] = useState<CompanyProfile>(getCompanyProfile);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Sharing states
  const [isGeneratingSS, setIsGeneratingSS] = useState(false);
  const [shareSuccessToast, setShareSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (shareSuccessToast) {
      const t = setTimeout(() => setShareSuccessToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [shareSuccessToast]);

  const halfRate = order.halfRate ?? 320;
  const fullRate = order.fullRate ?? 350;

  // Calculate totals from sizeQuantities
  const sizeMap = order.sizeQuantities || {};
  let computedHalf = 0;
  let computedFull = 0;

  CHEST_SIZES.forEach(sz => {
    const q = sizeMap[sz];
    if (q) {
      computedHalf += q.half || 0;
      computedFull += q.full || 0;
    }
  });

  const totalHalf = order.totalHalfQty ?? computedHalf;
  const totalFull = order.totalFullQty ?? computedFull;
  const totalQty = order.totalQty ?? (totalHalf + totalFull);

  // Status mapping
  const stages = order.stageStatus || {
    design: 'done',
    fabric: 'done',
    print: 'pending',
    stitch: 'pending',
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'done':
        return <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs"><CheckCircle2 size={12} /> Done</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 text-blue-700 font-bold text-xs"><Clock size={12} /> In Progress</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-xs"><AlertCircle size={12} /> Pending</span>;
    }
  };

  const advances = [
    { label: 'Advance payment 1', amount: order.advance1 ?? (order.advancePayments?.[0]?.amount || 0) },
    { label: 'Advance payment 2', amount: order.advance2 ?? (order.advancePayments?.[1]?.amount || 0) },
    { label: 'Advance payment 3', amount: order.advance3 ?? (order.advancePayments?.[2]?.amount || 0) },
  ];

  const totalPaid = advances.reduce((s, a) => s + (a.amount || 0), 0) || order.totalPaid || 0;
  const balance = order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, order.grandTotal - totalPaid);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Generate Screenshot Image from sheetRef
  const generateScreenshotBlob = async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    if (!sheetRef.current) return null;
    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2.5, // Crisp retina resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      return new Promise(resolve => {
        canvas.toBlob(blob => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve({ blob, dataUrl: canvas.toDataURL('image/png') });
        }, 'image/png');
      });
    } catch (err) {
      console.error('Error generating screenshot:', err);
      return null;
    }
  };

  // Download Screenshot as PNG
  const handleDownloadScreenshot = async () => {
    setIsGeneratingSS(true);
    const result = await generateScreenshotBlob();
    setIsGeneratingSS(false);

    if (!result) return;

    const link = document.createElement('a');
    link.download = `Invoice-${order.orderNumber}.png`;
    link.href = result.dataUrl;
    link.click();
    setShareSuccessToast('Invoice image downloaded successfully!');
  };

  // Share Screenshot on WhatsApp
  const handleWhatsAppImageShare = async () => {
    setIsGeneratingSS(true);
    const result = await generateScreenshotBlob();
    setIsGeneratingSS(false);

    if (!result) {
      alert('Could not capture invoice image. Please try again.');
      return;
    }

    const { blob, dataUrl } = result;
    const fileName = `Invoice-${order.orderNumber}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });
    const phone = customer?.whatsapp || customer?.phone || '';

    // 1. Check if native Web Share with files is supported
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Tax Invoice - ${order.orderNumber}`,
          text: `*${company.companyName}*\nTAX INVOICE: *${order.orderNumber}*\nCustomer: ${customer?.businessName || customer?.name || 'Customer'}\nTotal Qty: ${totalQty} pcs\nTotal: ${fmt(order.grandTotal)}\nBalance Due: ${fmt(balance)}`,
        });
        setShareSuccessToast('Shared successfully!');
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('Share failed:', err);
        } else {
          return;
        }
      }
    }

    // 2. Clipboard copy
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setShareSuccessToast('📋 Invoice image copied! Paste (Ctrl+V) in WhatsApp.');
      }
    } catch (e) {
      console.warn('Clipboard error:', e);
    }

    // 3. Download file
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();

    // 4. Open WhatsApp
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `*${company.companyName}*\n` +
      `📄 *TAX INVOICE / JOB CARD: ${order.orderNumber}*\n` +
      `👤 Party: *${customer?.businessName || customer?.name || 'Valued Customer'}*\n` +
      `📦 Total Qty: *${totalQty} pcs* (H: ${totalHalf} | F: ${totalFull})\n` +
      `💰 Grand Total: *${fmt(order.grandTotal)}*\n` +
      `✅ Paid: *${fmt(totalPaid)}*\n` +
      `⚠️ Balance Due: *${fmt(balance)}*\n\n` +
      `📸 _Invoice copy attached below._`;

    const waUrl = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
  };

  const termsList = (company.terms || '')
    .split('\n')
    .map(t => t.trim())
    .filter(Boolean);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:w-full print:rounded-none"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Top Action Bar (hidden on print) ─────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-[#E8E4DE] bg-[#FAF8F5] rounded-t-2xl print:hidden shrink-0 gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#E4572E] text-white flex items-center justify-center font-black text-sm">
                F
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-[#171717] flex items-center gap-2">
                  <span>Manufacturing Invoice</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-200">
                    {order.orderNumber}
                  </span>
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  Factory job sheet & professional tax invoice
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Company & Bank Profile Button */}
              <button
                type="button"
                onClick={() => setShowCompanyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#52525B] hover:text-[#171717] hover:border-[#E4572E]/50 transition-all shadow-2xs"
                title="Edit Company Name, Address, GSTIN & Bank Details"
              >
                <Building2 size={13} className="text-[#E4572E]" />
                <span>Company & Bank</span>
              </button>

              {/* Receive Payment (if due) */}
              {balance > 0 && onReceivePayment && (
                <button
                  type="button"
                  onClick={() => onReceivePayment(order.customerId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all shadow-2xs"
                >
                  <CreditCard size={13} className="text-emerald-600" />
                  <span>Receive Payment</span>
                </button>
              )}

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#171717] hover:bg-gray-50 transition-all shadow-2xs"
              >
                <Printer size={13} />
                <span>Print (A4)</span>
              </button>

              {/* Download Screenshot */}
              <button
                type="button"
                onClick={handleDownloadScreenshot}
                disabled={isGeneratingSS}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#171717] hover:bg-gray-50 transition-all shadow-2xs disabled:opacity-50"
                title="Download invoice image"
              >
                {isGeneratingSS ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                <span>Download SS</span>
              </button>

              {/* Share WhatsApp as Image */}
              <button
                type="button"
                onClick={handleWhatsAppImageShare}
                disabled={isGeneratingSS}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
              >
                {isGeneratingSS ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
                <span>Share WhatsApp</span>
              </button>

              {onEdit && (
                <button
                  type="button"
                  onClick={() => { onClose(); onEdit(); }}
                  className="px-3 py-1.5 rounded-xl bg-[#E4572E] text-white text-xs font-bold hover:bg-[#D4431B] transition-all shadow-2xs"
                >
                  Edit Order
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-[#F0EDE8] text-[#71717A] ml-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Toast alert when screenshot shared/downloaded */}
          {shareSuccessToast && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-800 font-bold flex items-center justify-between print:hidden">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                {shareSuccessToast}
              </span>
              <button type="button" onClick={() => setShareSuccessToast(null)}>
                <X size={13} />
              </button>
            </div>
          )}

          {/* ── Printable Invoice Document Container ────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0 print:overflow-visible bg-[#F8F7F4] print:bg-white">
            
            {/* The A4 / Standard Professional Invoice Document */}
            <div
              ref={sheetRef}
              id="printable-job-sheet"
              className="bg-white border-2 border-slate-900 max-w-[850px] mx-auto p-6 sm:p-8 font-sans text-slate-900 shadow-md print:shadow-none print:border-2 print:border-slate-900 print:p-6 print:m-0"
            >
              {/* ── 1. TAX INVOICE HEADER: Company Profile & Document Title ──── */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                {/* Company Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-[#E4572E] text-white font-black text-base flex items-center justify-center print:border print:border-black">
                      F
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">
                      {company.companyName}
                    </h1>
                    <button
                      type="button"
                      onClick={() => setShowCompanyModal(true)}
                      className="print:hidden text-gray-400 hover:text-[#E4572E] p-1 rounded"
                      title="Edit Company Details"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                  {company.tagline && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mt-1">
                      {company.tagline}
                    </p>
                  )}
                  <p className="text-xs text-slate-700 mt-1 leading-snug">
                    {company.address}{company.cityStatePin ? `, ${company.cityStatePin}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-700 mt-1">
                    <span>Phone: <strong className="text-slate-900">{company.phone}</strong></span>
                    {company.email && <span>Email: <strong className="text-slate-900">{company.email}</strong></span>}
                    {company.gstin && <span>GSTIN: <strong className="font-mono text-slate-900">{company.gstin}</strong></span>}
                    {company.state && <span>State: <strong className="text-slate-900">{company.state} (Code: {company.stateCode || '27'})</strong></span>}
                  </div>
                </div>

                {/* Tax Invoice Badge & Order Meta */}
                <div className="text-right sm:self-center shrink-0 border-2 border-slate-900 bg-slate-50 px-4 py-2.5 rounded-sm min-w-[200px]">
                  <span className="inline-block px-2 py-0.5 rounded bg-slate-900 text-white font-black text-[10px] tracking-widest uppercase mb-1">
                    TAX INVOICE
                  </span>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Original for Recipient
                  </p>
                  <div className="mt-1.5 space-y-0.5 text-xs">
                    <p className="font-bold text-slate-700">
                      Invoice #: <strong className="font-mono text-slate-900 text-sm font-black">{order.orderNumber}</strong>
                    </p>
                    <p className="text-slate-700">
                      Date: <strong className="text-slate-900">{order.orderDate || '—'}</strong>
                    </p>
                    <p className="text-slate-700">
                      Due: <strong className="text-slate-900">{order.deliveryDate || 'On Delivery'}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* ── 2. PARTY (BILL TO) & JOB SPECIFICATIONS GRID ─────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b-2 border-slate-900 pb-4 mb-4 text-xs">
                {/* Bill To Card */}
                <div className="border border-slate-300 rounded p-3 bg-slate-50/50 print:bg-transparent">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2">
                    <span className="font-black uppercase tracking-wider text-slate-900 text-[11px]">
                      Billed To (Customer Details)
                    </span>
                    {customer?.customerType && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 uppercase font-bold">
                        {customer.customerType}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-sm text-slate-900">
                      {customer?.businessName || customer?.name || 'Customer Name'}
                    </p>
                    {customer?.businessName && customer?.name && customer.name !== customer.businessName && (
                      <p className="text-slate-700">Attn: <strong>{customer.name}</strong></p>
                    )}
                    {customer?.phone && (
                      <p className="text-slate-700">Mobile: <strong className="text-slate-900">{customer.phone}</strong></p>
                    )}
                    {customer?.billingAddress && (
                      <p className="text-slate-600 leading-snug">Address: {customer.billingAddress}</p>
                    )}
                    {customer?.gstin && (
                      <p className="text-slate-700 font-mono">GSTIN: <strong className="text-slate-900">{customer.gstin}</strong></p>
                    )}
                  </div>
                </div>

                {/* Job Specifications Card */}
                <div className="border border-slate-300 rounded p-3 bg-slate-50/50 print:bg-transparent">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2">
                    <span className="font-black uppercase tracking-wider text-slate-900 text-[11px]">
                      Manufacturing Specifications
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Delivery: {order.deliveryDate || 'Standard'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Fabric</span>
                      <strong className="text-slate-900">{order.fabric || 'N. Net'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Print Type</span>
                      <strong className="text-slate-900">{order.printDetails || 'Full Sublimation'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Collar</span>
                      <strong className="text-slate-900">{order.collarType || 'Ready made'} ({order.collarColor || 'Black'})</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Sleeve / Piping</span>
                      <strong className="text-slate-900">{order.handColor || 'Printed'} ({order.handStripeOrPiping || 'Black'})</strong>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Production Stage:</span>
                      <div className="flex gap-2">
                        {getStatusBadge(stages.fabric)}
                        <span className="text-slate-300">|</span>
                        {getStatusBadge(stages.stitch)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 3. GARMENT SIZING BREAKDOWN TABLE ──────────────────────────── */}
              <div className="border border-slate-900 rounded-xs overflow-hidden mb-4">
                <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span>Size-Wise Quantity & Rates</span>
                  <span className="text-[11px] font-mono tracking-normal opacity-90">
                    Half: ₹{halfRate} | Full: ₹{fullRate}
                  </span>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2 text-left">Chest Size</th>
                      <th className="px-3 py-2 text-center">Half Sleeve</th>
                      <th className="px-3 py-2 text-center">Full Sleeve</th>
                      <th className="px-3 py-2 text-center">Total Qty</th>
                      <th className="px-3 py-2 text-right">Rate (₹)</th>
                      <th className="px-3 py-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {CHEST_SIZES.filter(sz => (sizeMap[sz]?.half || 0) + (sizeMap[sz]?.full || 0) > 0).map(sz => {
                      const h = sizeMap[sz]?.half || 0;
                      const f = sizeMap[sz]?.full || 0;
                      const rowQty = h + f;
                      const rowAmount = (h * halfRate) + (f * fullRate);
                      return (
                        <tr key={sz} className="hover:bg-slate-50/50">
                          <td className="px-3 py-1.5 font-bold font-mono text-slate-900">{sz}"</td>
                          <td className="px-3 py-1.5 text-center font-semibold">{h || '—'}</td>
                          <td className="px-3 py-1.5 text-center font-semibold">{f || '—'}</td>
                          <td className="px-3 py-1.5 text-center font-bold text-slate-900">{rowQty} pcs</td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-600">
                            {h > 0 && f > 0 ? `₹${halfRate} / ₹${fullRate}` : h > 0 ? `₹${halfRate}` : `₹${fullRate}`}
                          </td>
                          <td className="px-3 py-1.5 text-right font-black font-mono text-slate-900">
                            {fmt(rowAmount)}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Fallback if no specific size map filled */}
                    {CHEST_SIZES.filter(sz => (sizeMap[sz]?.half || 0) + (sizeMap[sz]?.full || 0) > 0).length === 0 && (
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Custom Garments (Mixed)</td>
                        <td className="px-3 py-2 text-center font-semibold">{totalHalf}</td>
                        <td className="px-3 py-2 text-center font-semibold">{totalFull}</td>
                        <td className="px-3 py-2 text-center font-black">{totalQty} pcs</td>
                        <td className="px-3 py-2 text-right font-mono">₹{halfRate}</td>
                        <td className="px-3 py-2 text-right font-black font-mono">{fmt(order.grandTotal)}</td>
                      </tr>
                    )}
                  </tbody>
                  {/* Totals Row */}
                  <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-bold text-slate-900">
                    <tr>
                      <td className="px-3 py-2 uppercase tracking-wider font-black">Total Quantity</td>
                      <td className="px-3 py-2 text-center font-black">{totalHalf}</td>
                      <td className="px-3 py-2 text-center font-black">{totalFull}</td>
                      <td className="px-3 py-2 text-center font-black text-sm text-[#E4572E]">{totalQty} pcs</td>
                      <td className="px-3 py-2 text-right text-slate-600 font-normal">Total</td>
                      <td className="px-3 py-2 text-right font-black text-sm font-mono text-slate-900">
                        {fmt(order.grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* ── 4. TWO-COLUMN FINANCIAL & PAYMENT SUMMARY (myBillBook style) ── */}
              <div className="border-2 border-slate-900 rounded p-4 text-xs mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Left Column: Amount in Words + Bank Details + Terms */}
                  <div className="space-y-3">
                    {/* Amount in Words */}
                    <div className="bg-slate-50 border border-slate-300 p-2.5 rounded">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        Amount in Words:
                      </span>
                      <strong className="text-xs text-slate-900 font-semibold italic">
                        {numberToWordsIndian(order.grandTotal)}
                      </strong>
                    </div>

                    {/* Bank & UPI Details Box */}
                    <div className="bg-slate-50 border border-slate-300 p-2.5 rounded">
                      <div className="flex items-center gap-1.5 font-black uppercase text-[10px] text-slate-700 tracking-wider mb-1.5">
                        <Landmark size={13} className="text-[#E4572E]" />
                        <span>Bank & UPI Details for Payment</span>
                      </div>
                      <div className="space-y-0.5 text-xs text-slate-800">
                        {company.bankName && <p>Bank Name: <strong className="text-slate-900">{company.bankName}</strong></p>}
                        {company.accountNumber && <p>Account No: <strong className="font-mono text-slate-900">{company.accountNumber}</strong></p>}
                        {company.ifscCode && <p>IFSC Code: <strong className="font-mono text-slate-900">{company.ifscCode}</strong></p>}
                        {company.accountHolder && <p>A/c Name: <strong>{company.accountHolder}</strong></p>}
                        {company.upiId && <p>UPI ID: <strong className="font-mono text-[#E4572E]">{company.upiId}</strong></p>}
                        {!company.accountNumber && !company.upiId && (
                          <p className="text-[11px] text-slate-500 italic">
                            Click "Company & Bank" above to add your bank details.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    {termsList.length > 0 && (
                      <div className="text-[10px] text-slate-600 leading-tight">
                        <span className="font-bold uppercase text-slate-700 block mb-1">Terms & Conditions:</span>
                        <ul className="list-decimal pl-3 space-y-0.5">
                          {termsList.map((term, i) => (
                            <li key={i}>{term.replace(/^\d+\.\s*/, '')}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Financial Breakdown Calculation */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-300 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-200 text-xs">
                        <span className="text-slate-600">Subtotal ({totalQty} pcs):</span>
                        <strong className="text-slate-900 font-mono">{fmt(order.grandTotal)}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200 text-xs text-emerald-700 font-bold">
                        <span>Advance / Received:</span>
                        <span className="font-mono">{fmt(totalPaid)}</span>
                      </div>
                      {advances.filter(a => (a.amount || 0) > 0).map((a, i) => (
                        <div key={i} className="flex justify-between text-[11px] text-slate-500 pl-2">
                          <span>{a.label}:</span>
                          <span className="font-mono">{fmt(a.amount)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t-2 border-slate-900 mt-4 space-y-2">
                      <div className="flex justify-between items-center text-sm font-black">
                        <span className="uppercase text-slate-900">Total Amount:</span>
                        <span className="text-base text-slate-900 font-mono">{fmt(order.grandTotal)}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm font-black p-2 rounded bg-white border border-slate-300">
                        <span className="uppercase text-red-700">Balance Due:</span>
                        <span className={`text-base font-mono ${balance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {balance > 0 ? fmt(balance) : 'CLEARED'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 5. AUTHORIZED SIGNATORY FOOTER ────────────────────────────── */}
              <div className="mt-6 pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs items-end">
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Thank you for your business!
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    This is a computer generated invoice and requires no physical seal.
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-slate-800 text-xs mb-8">
                    For {company.companyName}
                  </p>
                  <div className="border-t border-slate-400 pt-1 inline-block min-w-[160px] text-center">
                    <span className="text-[11px] font-semibold text-slate-600">Authorized Signatory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Company Profile Edit Modal */}
      <CompanyProfileModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        profile={company}
        onSave={updated => setCompany(updated)}
      />
    </>
  );
}
