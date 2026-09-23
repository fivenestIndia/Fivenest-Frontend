import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Printer, CheckCircle2, Clock, AlertCircle,
  Building2, Camera, Download, Check, Edit3, Loader2, Copy,
  CreditCard, BookOpen, Layers, Landmark, MessageSquare
} from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  PrintingOrder, Customer, PrintingService, fmt,
  STATUS_LABELS
} from '../../hooks/useOrderStore';
import {
  CompanyProfile, getCompanyProfile, saveCompanyProfile, numberToWordsIndian
} from '../../lib/companyProfile';
import CompanyProfileModal from './CompanyProfileModal';

interface Props {
  order: PrintingOrder;
  customer?: Customer;
  service?: PrintingService;
  onClose: () => void;
  onReceivePayment?: (customerId: string) => void;
  onViewCustomerLedger?: (customerId: string) => void;
}

export default function PrintingJobSheetModal({
  order,
  customer,
  service,
  onClose,
  onReceivePayment,
  onViewCustomerLedger,
}: Props) {
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

  const handlePrint = () => {
    window.print();
  };

  const generateScreenshotBlob = async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    if (!sheetRef.current) return null;
    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2.5,
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

  const handleDownloadScreenshot = async () => {
    setIsGeneratingSS(true);
    const result = await generateScreenshotBlob();
    setIsGeneratingSS(false);

    if (!result) return;

    const link = document.createElement('a');
    link.download = `PrintingInvoice-${order.orderNumber}.png`;
    link.href = result.dataUrl;
    link.click();
    setShareSuccessToast('Invoice image downloaded successfully!');
  };

  const handleWhatsAppImageShare = async () => {
    setIsGeneratingSS(true);
    const result = await generateScreenshotBlob();
    setIsGeneratingSS(false);

    if (!result) {
      alert('Could not capture invoice screenshot. Please try again.');
      return;
    }

    const { blob, dataUrl } = result;
    const fileName = `PrintingInvoice-${order.orderNumber}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });
    const phone = customer?.whatsapp || customer?.phone || '';

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Printing Tax Invoice - ${order.orderNumber}`,
          text: `*${company.companyName}*\n🖨️ *PRINTING TAX INVOICE: ${order.orderNumber}*\nParty: ${customer?.businessName || customer?.name || 'Customer'}\nService: ${service?.name || 'Sublimation/DTF'}\nQty: ${order.quantity} pcs\nTotal: ${fmt(order.grandTotal)}\nBalance Due: ${fmt(order.outstanding)}`,
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

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setShareSuccessToast('📋 Invoice image copied! Paste (Ctrl+V) in WhatsApp.');
      }
    } catch (e) {
      console.warn('Clipboard error:', e);
    }

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `*${company.companyName}*\n` +
      `🖨️ *PRINTING TAX INVOICE / JOB CARD: ${order.orderNumber}*\n` +
      `👤 Party: *${customer?.businessName || customer?.name || 'Valued Customer'}*\n` +
      `👕 Service: ${service?.name || 'Sublimation Printing'}\n` +
      `📦 Total Qty: *${order.quantity} pcs*\n` +
      `💰 Grand Total: *${fmt(order.grandTotal)}*\n` +
      `✅ Advance Paid: *${fmt(order.totalPaid)}*\n` +
      `⚠️ Balance Due: *${fmt(order.outstanding)}*\n\n` +
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
          {/* Action Bar */}
          <div className="bg-[#FAF8F5] border-b border-[#E8E4DE] px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                P
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-[#171717] flex items-center gap-2">
                  <span>Printing Job Card & Invoice</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                    {order.orderNumber}
                  </span>
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  Sublimation & DTF print job sheet
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowCompanyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#52525B] hover:text-[#171717] hover:border-[#E4572E]/50 transition-all shadow-2xs"
                title="Edit Company Name, Address, GSTIN & Bank Details"
              >
                <Building2 size={13} className="text-[#E4572E]" />
                <span>Company & Bank</span>
              </button>

              {order.outstanding > 0 && onReceivePayment && (
                <button
                  type="button"
                  onClick={() => onReceivePayment(order.customerId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all shadow-2xs"
                >
                  <CreditCard size={13} className="text-emerald-600" />
                  <span>Receive Payment</span>
                </button>
              )}

              {onViewCustomerLedger && order.customerId && (
                <button
                  type="button"
                  onClick={() => { onClose(); onViewCustomerLedger(order.customerId); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#171717] hover:bg-gray-50 transition-all shadow-2xs"
                >
                  <BookOpen size={13} />
                  <span>Ledger</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#171717] hover:bg-gray-50 transition-all shadow-2xs"
              >
                <Printer size={13} />
                <span>Print (A4)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadScreenshot}
                disabled={isGeneratingSS}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#171717] hover:bg-gray-50 transition-all shadow-2xs disabled:opacity-50"
              >
                {isGeneratingSS ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                <span>Download SS</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppImageShare}
                disabled={isGeneratingSS}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
              >
                {isGeneratingSS ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
                <span>Share WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-[#F0EDE8] text-[#71717A] ml-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

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

          {/* Printable Job Sheet Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8F7F4] print:p-0 print:bg-white print:overflow-visible">
            <div
              id="printable-printing-job-sheet"
              ref={sheetRef}
              className="bg-white border-2 border-slate-900 max-w-[850px] mx-auto p-6 sm:p-8 font-sans text-slate-900 shadow-md print:shadow-none print:border-2 print:border-slate-900 print:p-6 print:m-0"
            >
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-base flex items-center justify-center print:border print:border-black">
                      P
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">
                      {company.companyName}
                    </h1>
                    <button
                      type="button"
                      onClick={() => setShowCompanyModal(true)}
                      className="print:hidden text-gray-400 hover:text-blue-600 p-1 rounded"
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

                <div className="text-right sm:self-center shrink-0 border-2 border-slate-900 bg-slate-50 px-4 py-2.5 rounded-sm min-w-[200px]">
                  <span className="inline-block px-2 py-0.5 rounded bg-blue-700 text-white font-black text-[10px] tracking-widest uppercase mb-1">
                    TAX INVOICE
                  </span>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Printing Work Order
                  </p>
                  <div className="mt-1.5 space-y-0.5 text-xs">
                    <p className="font-bold text-slate-700">
                      Invoice #: <strong className="font-mono text-slate-900 text-sm font-black">{order.orderNumber}</strong>
                    </p>
                    <p className="text-slate-700">
                      Date: <strong className="text-slate-900">{order.date || '—'}</strong>
                    </p>
                    <p className="text-slate-700">
                      Due: <strong className="text-slate-900">{order.deliveryDate || order.requiredDate || 'On Delivery'}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Box + Work Order Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b-2 border-slate-900 pb-4 mb-4 text-xs">
                <div className="border border-slate-300 rounded p-3 bg-slate-50/50 print:bg-transparent">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2">
                    <span className="font-black uppercase tracking-wider text-slate-900 text-[11px]">
                      Billed To (Client / Party Details)
                    </span>
                    {customer?.customerType && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 uppercase font-bold">
                        {customer.customerType}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-sm text-slate-900">{customer?.businessName || customer?.name || '—'}</p>
                    {customer?.businessName && customer?.name && <p className="text-slate-700">Contact: <strong>{customer.name}</strong></p>}
                    <p className="text-slate-700">Phone: <strong className="text-slate-900">{customer?.phone || '—'}</strong></p>
                    {customer?.billingAddress && <p className="text-slate-600 leading-snug">Address: {customer.billingAddress}</p>}
                    {customer?.gstin && <p className="text-slate-700 font-mono">GSTIN: <strong className="text-slate-900">{customer.gstin}</strong></p>}
                  </div>
                </div>

                <div className="border border-slate-300 rounded p-3 bg-slate-50/50 print:bg-transparent">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2">
                    <span className="font-black uppercase tracking-wider text-slate-900 text-[11px]">
                      Printing Schedule & Status
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      SAC: 9988
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1.5">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Order Date:</span>
                      <strong className="text-slate-900">{order.date || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Required Date:</span>
                      <strong className="text-slate-900">{order.requiredDate || 'Standard'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Delivery Date:</span>
                      <strong className="text-slate-900">{order.deliveryDate || 'Pending'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Production Status:</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-black text-[10px] bg-slate-200 text-slate-900 uppercase">
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="border border-slate-900 rounded-xs overflow-hidden mb-4">
                <div className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase tracking-wider text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} />
                    Printing Technical Specifications
                  </span>
                  <span className="text-[10px] font-mono tracking-normal opacity-90">
                    Service: {service?.name || 'Sublimation / Heat Transfer'}
                  </span>
                </div>

                <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/50 print:bg-transparent">
                  <div className="border border-slate-300 p-2 rounded bg-white">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Service Type</span>
                    <strong className="text-sm text-slate-900">{service?.name || 'Custom Print'}</strong>
                  </div>
                  <div className="border border-slate-300 p-2 rounded bg-white">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Quantity</span>
                    <strong className="text-sm text-slate-900">{order.quantity} pcs</strong>
                  </div>
                  <div className="border border-slate-300 p-2 rounded bg-white">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Applied Rate</span>
                    <strong className="text-sm text-slate-900">₹{order.appliedRate} / pc</strong>
                  </div>
                  <div className="border border-slate-300 p-2 rounded bg-white">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Fabric / Material</span>
                    <strong className="text-sm text-slate-900">{order.fabric || order.material || 'Polyester'}</strong>
                  </div>

                  {order.printArea && (
                    <div className="border border-slate-300 p-2 rounded bg-white">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Print Area</span>
                      <strong className="text-xs text-slate-900">{order.printArea}</strong>
                    </div>
                  )}
                  {order.color && (
                    <div className="border border-slate-300 p-2 rounded bg-white">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Base Color</span>
                      <strong className="text-xs text-slate-900">{order.color}</strong>
                    </div>
                  )}
                  {order.artworkFile && (
                    <div className="border border-slate-300 p-2 rounded bg-white col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Artwork Reference</span>
                      <strong className="text-xs text-slate-900 truncate block">{order.artworkFile}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Billing Itemized Table */}
              <div className="border border-slate-900 rounded-xs overflow-hidden mb-4">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="text-left px-3 py-2 uppercase font-black">#</th>
                      <th className="text-left px-3 py-2 uppercase font-black">Particulars / Job Description</th>
                      <th className="text-center px-3 py-2 uppercase font-black">Quantity</th>
                      <th className="text-right px-3 py-2 uppercase font-black">Unit Rate (₹)</th>
                      <th className="text-right px-3 py-2 uppercase font-black">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-mono text-slate-500">1</td>
                      <td className="px-3 py-2 font-bold text-slate-900">
                        {service?.name || 'Custom Sublimation / DTF Printing'}
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                          Fabric: {order.fabric || order.material || 'Standard'} · Color: {order.color || 'White'}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-slate-900">{order.quantity} pcs</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">₹{order.appliedRate}</td>
                      <td className="px-3 py-2 text-right font-black font-mono text-slate-900">{fmt(order.subtotal)}</td>
                    </tr>
                    {order.additionalCharges > 0 && (
                      <tr className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-mono text-slate-500">2</td>
                        <td className="px-3 py-2 text-slate-800">Setup & Rush Charges</td>
                        <td className="px-3 py-2 text-center text-slate-500">—</td>
                        <td className="px-3 py-2 text-right text-slate-500">—</td>
                        <td className="px-3 py-2 text-right font-bold font-mono text-slate-900">{fmt(order.additionalCharges)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-bold text-slate-900">
                    <tr>
                      <td colSpan={2} className="px-3 py-2 uppercase tracking-wider font-black">Total Quantity</td>
                      <td className="px-3 py-2 text-center font-black text-sm text-[#E4572E]">{order.quantity} pcs</td>
                      <td className="px-3 py-2 text-right text-slate-600 font-normal">Subtotal</td>
                      <td className="px-3 py-2 text-right font-black text-sm font-mono text-slate-900">{fmt(order.subtotal + (order.additionalCharges || 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Two Column Totals & Bank Summary */}
              <div className="border-2 border-slate-900 rounded p-4 text-xs mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Left Column: Words + Bank + Terms */}
                  <div className="space-y-3">
                    <div className="bg-slate-50 border border-slate-300 p-2.5 rounded">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        Amount in Words:
                      </span>
                      <strong className="text-xs text-slate-900 font-semibold italic">
                        {numberToWordsIndian(order.grandTotal)}
                      </strong>
                    </div>

                    <div className="bg-slate-50 border border-slate-300 p-2.5 rounded">
                      <div className="flex items-center gap-1.5 font-black uppercase text-[10px] text-slate-700 tracking-wider mb-1.5">
                        <Landmark size={13} className="text-blue-600" />
                        <span>Bank & UPI Details for Payment</span>
                      </div>
                      <div className="space-y-0.5 text-xs text-slate-800">
                        {company.bankName && <p>Bank Name: <strong className="text-slate-900">{company.bankName}</strong></p>}
                        {company.accountNumber && <p>Account No: <strong className="font-mono text-slate-900">{company.accountNumber}</strong></p>}
                        {company.ifscCode && <p>IFSC Code: <strong className="font-mono text-slate-900">{company.ifscCode}</strong></p>}
                        {company.accountHolder && <p>A/c Name: <strong>{company.accountHolder}</strong></p>}
                        {company.upiId && <p>UPI ID: <strong className="font-mono text-blue-700">{company.upiId}</strong></p>}
                        {!company.accountNumber && !company.upiId && (
                          <p className="text-[11px] text-slate-500 italic">
                            Click "Company & Bank" above to add your bank details.
                          </p>
                        )}
                      </div>
                    </div>

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

                  {/* Right Column: Calculations */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-300 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-200 text-xs">
                        <span className="text-slate-600">Subtotal ({order.quantity} pcs):</span>
                        <strong className="text-slate-900 font-mono">{fmt(order.subtotal)}</strong>
                      </div>
                      {order.additionalCharges > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-200 text-xs">
                          <span className="text-slate-600">Additional Charges:</span>
                          <strong className="text-slate-900 font-mono">+{fmt(order.additionalCharges)}</strong>
                        </div>
                      )}
                      {order.discount > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-200 text-xs text-emerald-700">
                          <span>Discount:</span>
                          <strong className="font-mono">- {fmt(order.discount)}</strong>
                        </div>
                      )}
                      {order.gstAmount > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-200 text-xs">
                          <span className="text-slate-600">GST ({order.gstPct}%):</span>
                          <strong className="text-slate-900 font-mono">{fmt(order.gstAmount)}</strong>
                        </div>
                      )}
                      <div className="flex justify-between py-1 border-b border-slate-200 text-xs text-emerald-700 font-bold">
                        <span>Advance / Received:</span>
                        <strong className="font-mono">{fmt(order.totalPaid)}</strong>
                      </div>
                    </div>

                    <div className="pt-3 border-t-2 border-slate-900 mt-4 space-y-2">
                      <div className="flex justify-between items-center text-sm font-black">
                        <span className="uppercase text-slate-900">Total Amount:</span>
                        <span className="text-base text-slate-900 font-mono">{fmt(order.grandTotal)}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm font-black p-2 rounded bg-white border border-slate-300">
                        <span className="uppercase text-red-700">Balance Due:</span>
                        <span className={`text-base font-mono ${order.outstanding > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {order.outstanding > 0 ? fmt(order.outstanding) : 'CLEARED'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatory Footer */}
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

      <CompanyProfileModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        profile={company}
        onSave={updated => setCompany(updated)}
      />
    </>
  );
}
