import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Printer, CheckCircle2, Building2, Camera, Download, Edit3,
  Loader2, CreditCard, BookOpen, Layers, Landmark, MessageSquare,
  FileDown, ShieldCheck, Calendar, Hash, Phone, MapPin, Mail
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  PrintingOrder, Customer, PrintingService, fmt, fmtFull,
  STATUS_LABELS
} from '../../hooks/useOrderStore';
import {
  CompanyProfile, getCompanyProfile, numberToWordsIndian
} from '../../lib/companyProfile';
import CompanyProfileModal from './CompanyProfileModal';

interface Props {
  order: PrintingOrder;
  customer?: Customer;
  service?: PrintingService;
  onClose: () => void;
  onReceivePayment?: (customerId: string) => void;
  onViewCustomerLedger?: (customerId: string) => void;
  onEditOrder?: () => void;
}

export default function PrintingJobSheetModal({
  order,
  customer,
  service,
  onClose,
  onReceivePayment,
  onViewCustomerLedger,
  onEditOrder,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Company Profile state (persisted to localStorage)
  const [company, setCompany] = useState<CompanyProfile>(getCompanyProfile);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Export & sharing states
  const [isGeneratingSS, setIsGeneratingSS] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
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

  const generateScreenshotBlob = async (): Promise<{ blob: Blob; dataUrl: string; width: number; height: number } | null> => {
    if (!sheetRef.current) return null;
    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve({
            blob,
            dataUrl: canvas.toDataURL('image/png'),
            width: canvas.width,
            height: canvas.height,
          });
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
    setShareSuccessToast('High-res Invoice PNG downloaded!');
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    const result = await generateScreenshotBlob();
    setIsGeneratingPDF(false);

    if (!result) {
      alert('Could not generate PDF. Please try again.');
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const ratio = result.width / result.height;
      let renderW = maxW;
      let renderH = renderW / ratio;
      if (renderH > maxH) {
        renderH = maxH;
        renderW = renderH * ratio;
      }
      const xOffset = (pageW - renderW) / 2;
      pdf.addImage(result.dataUrl, 'PNG', xOffset, margin, renderW, renderH, undefined, 'FAST');
      pdf.save(`TaxInvoice-${order.orderNumber}.pdf`);
      setShareSuccessToast('A4 Tax Invoice PDF downloaded!');
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF export failed. You can also use Print (A4) -> Save as PDF.');
    }
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

    const itemsSummary =
      order.lineItems && order.lineItems.length > 0
        ? order.lineItems.map((l) => `${l.name} (${l.qty} × ₹${l.rate})`).join(', ')
        : `${service?.name || 'Printing'} (${order.quantity} pcs)`;

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Printing Tax Invoice - ${order.orderNumber}`,
          text: `*${company.companyName}*\n🖨️ *TAX INVOICE: ${order.orderNumber}*\nParty: ${customer?.businessName || customer?.name || 'Customer'}\nItems: ${itemsSummary}\nTotal: ${fmtFull(order.grandTotal)}\nBalance Due: ${fmtFull(order.outstanding)}`,
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
    const msg =
      `*${company.companyName}*\n` +
      `🖨️ *TAX INVOICE: ${order.orderNumber}*\n` +
      `👤 Party: *${customer?.businessName || customer?.name || 'Valued Customer'}*\n` +
      `📦 Particulars: ${itemsSummary}\n` +
      `🧾 Total Qty: *${order.quantity} pcs*\n` +
      `💰 Grand Total: *${fmtFull(order.grandTotal)}*\n` +
      `✅ Received: *${fmtFull(order.totalPaid)}*\n` +
      `⚠️ Balance Due: *${fmtFull(order.outstanding)}*\n\n` +
      `📸 _High-resolution invoice attached._`;

    const waUrl = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
  };

  const termsList = (company.terms || '')
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);

  // Build itemized particulars (supports multi-good bills AND legacy single-service bills)
  const invoiceLines =
    order.lineItems && order.lineItems.length > 0
      ? order.lineItems
      : [
          {
            id: 'legacy-1',
            name: service?.name || 'Custom Sublimation / DTF Printing',
            unit: 'pc',
            qty: order.quantity,
            rate: order.appliedRate,
            amount: order.subtotal,
          },
        ];

  const hasSpecs = Boolean(order.fabric || order.material || order.printArea || order.color || order.artworkFile || order.specialInstructions);
  const monogram = (company.companyName || 'FN')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || 'FN';

  const isPaid = order.outstanding <= 0;
  const isPartial = !isPaid && order.totalPaid > 0;
  const upiAmount = order.outstanding > 0 ? order.outstanding : order.grandTotal;
  const upiString = company.upiId
    ? `upi://pay?pa=${encodeURIComponent(company.upiId)}&pn=${encodeURIComponent(company.companyName)}&am=${upiAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Inv ${order.orderNumber}`)}`
    : '';
  const upiQrSrc = upiString
    ? `https://quickchart.io/qr?size=160&margin=1&text=${encodeURIComponent(upiString)}`
    : '';

  const isSameState = !customer?.state || !company.state || customer.state.toLowerCase().trim() === company.state.toLowerCase().trim();

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:w-full print:rounded-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Top Action Toolbar ── */}
          <div className="bg-[#FAF8F5] border-b border-[#E8E4DE] px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#0F172A] text-white flex items-center justify-center font-black text-xs tracking-wider border border-[#E4572E]/50">
                {monogram}
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-[#171717] flex items-center gap-2">
                  <span>Executive Tax Invoice</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                    {order.orderNumber}
                  </span>
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  {invoiceLines.length} {invoiceLines.length === 1 ? 'item' : 'items'} · {order.quantity} pcs · Print-ready A4 layout
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowCompanyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#52525B] hover:text-[#171717] hover:border-[#E4572E]/50 transition-all shadow-2xs"
                title="Edit Company Name, Address, GSTIN & Bank Details"
              >
                <Building2 size={13} className="text-[#E4572E]" />
                <span>Company &amp; Bank</span>
              </button>

              {onEditOrder && (
                <button
                  type="button"
                  onClick={onEditOrder}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-xs font-bold hover:bg-blue-100 transition-all shadow-2xs"
                >
                  <Edit3 size={13} />
                  <span>Edit Bill</span>
                </button>
              )}

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
                  onClick={() => {
                    onClose();
                    onViewCustomerLedger(order.customerId);
                  }}
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
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-2xs disabled:opacity-50"
              >
                {isGeneratingPDF ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadScreenshot}
                disabled={isGeneratingSS}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#171717] hover:bg-gray-50 transition-all shadow-2xs disabled:opacity-50"
              >
                {isGeneratingSS ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                <span>PNG</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppImageShare}
                disabled={isGeneratingSS}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
              >
                {isGeneratingSS ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
                <span>WhatsApp</span>
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

          {/* ── HIGH-END EXECUTIVE TAX INVOICE CANVAS ── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#EDE9E3] print:p-0 print:bg-white print:overflow-visible">
            <div
              id="printable-printing-job-sheet"
              ref={sheetRef}
              className="bg-white max-w-[840px] mx-auto shadow-xl border border-slate-200 overflow-hidden font-sans text-slate-900 print:shadow-none print:border-0 print:max-w-none print:m-0"
            >
              {/* Signature Dual-Tone Luxury Top Strip */}
              <div className="h-2.5 bg-gradient-to-r from-[#0F172A] via-[#E4572E] to-[#F59E0B]" />

              <div className="p-6 sm:p-8 print:p-6">
                {/* ── 1. HEADER SECTION ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200">
                  {/* Left: Brand Crest & Company Identity */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3.5">
                      <div className="w-13 h-13 min-w-[52px] min-h-[52px] rounded-xl bg-[#0F172A] text-white flex flex-col items-center justify-center relative overflow-hidden shadow-sm border border-slate-800">
                        <div className="absolute top-0 right-0 w-3 h-3 bg-[#E4572E]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />
                        <span className="text-lg font-black tracking-tighter leading-none">{monogram}</span>
                        <span className="text-[7px] font-bold tracking-[0.2em] text-amber-400 uppercase mt-0.5">PRINT</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-2xl sm:text-[26px] font-black uppercase tracking-tight text-[#0F172A] leading-none">
                            {company.companyName}
                          </h1>
                          <button
                            type="button"
                            onClick={() => setShowCompanyModal(true)}
                            className="print:hidden text-slate-400 hover:text-[#E4572E] p-1 rounded"
                            title="Edit company details"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>

                        {company.tagline && (
                          <p className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#E4572E] mt-1">
                            {company.tagline}
                          </p>
                        )}

                        <div className="mt-2 space-y-1 text-[11.5px] text-slate-600 leading-snug">
                          {(company.address || company.cityStatePin) && (
                            <p className="flex items-start gap-1.5">
                              <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                              <span>
                                {company.address}
                                {company.cityStatePin ? `, ${company.cityStatePin}` : ''}
                              </span>
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="inline-flex items-center gap-1">
                              <Phone size={11} className="text-slate-400" />
                              <strong className="text-slate-900">{company.phone}</strong>
                            </span>
                            {company.email && (
                              <span className="inline-flex items-center gap-1">
                                <Mail size={11} className="text-slate-400" />
                                <strong className="text-slate-900">{company.email}</strong>
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {company.gstin && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-800 font-mono">
                                GSTIN: {company.gstin}
                              </span>
                            )}
                            {company.state && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700">
                                State: {company.state} ({company.stateCode || '27'})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Invoice Meta Crest Card */}
                  <div className="shrink-0 w-full sm:w-[235px] bg-[#0F172A] text-white rounded-xl p-4 relative overflow-hidden shadow-sm">
                    <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-[#E4572E]/20" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase text-[#FB923C]">
                        TAX INVOICE
                      </span>
                      <span className="text-[8.5px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-white/10 text-slate-200">
                        ORIGINAL
                      </span>
                    </div>

                    <p className="font-mono text-lg font-black tracking-tight text-white">
                      {order.orderNumber}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-white/15 space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar size={10} /> Date
                        </span>
                        <strong className="font-semibold text-white">{order.date || '—'}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Hash size={10} /> Due / Deliv.
                        </span>
                        <strong className="font-semibold text-white">
                          {order.deliveryDate || order.requiredDate || 'On Delivery'}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-400">Payment</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : isPartial
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                          }`}
                        >
                          {isPaid ? 'PAID IN FULL' : isPartial ? 'PARTIAL PAID' : 'PAYMENT DUE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 2. CLIENT & JOB METADATA CARDS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 text-xs">
                  {/* Billed To */}
                  <div className="rounded-xl border border-slate-200 bg-[#FAFAF9] p-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#E4572E]">
                        Billed To (Client / Party)
                      </span>
                      {customer?.customerType && (
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 uppercase">
                          {customer.customerType}
                        </span>
                      )}
                    </div>
                    <p className="font-black text-base text-[#0F172A] leading-tight">
                      {customer?.businessName || customer?.name || 'Walk-in Client'}
                    </p>
                    <div className="mt-1.5 space-y-1 text-[11.5px] text-slate-600">
                      {customer?.businessName && customer?.name && (
                        <p>
                          Attn: <strong className="text-slate-800">{customer.name}</strong>
                        </p>
                      )}
                      <p>
                        Phone: <strong className="text-slate-900">{customer?.phone || '—'}</strong>
                      </p>
                      {customer?.billingAddress && (
                        <p className="leading-snug text-slate-600">{customer.billingAddress}</p>
                      )}
                      {customer?.gstin && (
                        <p className="font-mono text-[11px] text-slate-800 pt-0.5">
                          GSTIN: <strong>{customer.gstin}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Print Work Order Specs */}
                  <div className="rounded-xl border border-slate-200 bg-[#FAFAF9] p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0F172A] flex items-center gap-1.5">
                          <Layers size={12} className="text-[#E4572E]" />
                          Printing Work Specification
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          SAC 998821
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11.5px]">
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                            Process / Dept
                          </span>
                          <strong className="text-slate-900">{service?.name || 'Sublimation Print'}</strong>
                        </div>
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                            Production Stage
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-800">
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </div>
                        {(order.fabric || order.material) && (
                          <div>
                            <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                              Fabric / Material
                            </span>
                            <strong className="text-slate-800">
                              {[order.fabric, order.material].filter(Boolean).join(' · ')}
                            </strong>
                          </div>
                        )}
                        {(order.color || order.printArea) && (
                          <div>
                            <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                              Color / Area
                            </span>
                            <strong className="text-slate-800">
                              {[order.color, order.printArea].filter(Boolean).join(' · ')}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {order.artworkFile && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 truncate max-w-[180px]">
                          File: <strong className="text-slate-800">{order.artworkFile}</strong>
                        </span>
                        <span className={`font-bold text-[10px] ${order.artworkApproved ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {order.artworkApproved ? '✓ Approved' : 'Pending Check'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 3. LINE-ITEMIZED GOODS / PARTICULARS TABLE ── */}
                <div className="rounded-xl border border-slate-300 overflow-hidden mb-5">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0F172A] text-white border-b-2 border-[#E4572E]">
                        <th className="text-left px-3.5 py-2.5 font-black uppercase tracking-wider text-[10px] w-10">
                          #
                        </th>
                        <th className="text-left px-3.5 py-2.5 font-black uppercase tracking-wider text-[10px]">
                          Goods / Particulars Description
                        </th>
                        <th className="text-center px-3 py-2.5 font-black uppercase tracking-wider text-[10px] w-20">
                          SAC
                        </th>
                        <th className="text-center px-3 py-2.5 font-black uppercase tracking-wider text-[10px] w-16">
                          Unit
                        </th>
                        <th className="text-center px-3 py-2.5 font-black uppercase tracking-wider text-[10px] w-20">
                          Qty
                        </th>
                        <th className="text-right px-3.5 py-2.5 font-black uppercase tracking-wider text-[10px] w-24">
                          Rate (₹)
                        </th>
                        <th className="text-right px-3.5 py-2.5 font-black uppercase tracking-wider text-[10px] w-28">
                          Amount (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {invoiceLines.map((item, idx) => (
                        <tr
                          key={item.id || idx}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]/70'}
                        >
                          <td className="px-3.5 py-3 font-mono font-bold text-slate-400">
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="px-3.5 py-3">
                            <p className="font-extrabold text-[13px] text-[#0F172A] leading-snug">
                              {item.name}
                            </p>
                            {idx === 0 && !order.lineItems?.length && hasSpecs && (
                              <p className="text-[10.5px] text-slate-500 mt-0.5">
                                {[order.fabric, order.material, order.color, order.printArea]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-[11px] text-slate-500">
                            998821
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold uppercase text-slate-700">
                              {item.unit || 'pc'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center font-black text-[13px] text-slate-900 font-mono">
                            {item.qty}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono font-semibold text-slate-700">
                            ₹{Number(item.rate).toLocaleString('en-IN')}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono font-black text-[13px] text-[#0F172A]">
                            {fmtFull(item.amount)}
                          </td>
                        </tr>
                      ))}

                      {order.additionalCharges > 0 && (
                        <tr className="bg-amber-50/40">
                          <td className="px-3.5 py-2.5 font-mono font-bold text-slate-400">
                            {String(invoiceLines.length + 1).padStart(2, '0')}
                          </td>
                          <td className="px-3.5 py-2.5 font-bold text-slate-800">
                            Setup, Screen &amp; Rush Processing Charges
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-[11px] text-slate-500">
                            998821
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-400">—</td>
                          <td className="px-3 py-2.5 text-center text-slate-400">—</td>
                          <td className="px-3.5 py-2.5 text-right text-slate-400">—</td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">
                            {fmtFull(order.additionalCharges)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-300">
                        <td colSpan={4} className="px-3.5 py-2.5 font-black uppercase tracking-wider text-[10.5px] text-slate-700">
                          Total Quantity &amp; Taxable Subtotal
                        </td>
                        <td className="px-3 py-2.5 text-center font-black text-sm text-[#E4572E] font-mono">
                          {order.quantity} pcs
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-[11px] font-bold text-slate-500 uppercase">
                          Subtotal
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-black text-sm font-mono text-[#0F172A]">
                          {fmtFull(order.subtotal + (order.additionalCharges || 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {order.specialInstructions && (
                  <div className="mb-5 px-3.5 py-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[11.5px] text-amber-950">
                    <strong className="uppercase text-[10px] tracking-wider text-amber-800 mr-1.5">
                      Special Notes:
                    </strong>
                    {order.specialInstructions}
                  </div>
                )}

                {/* ── 4. FINANCIAL TOTALS, BANK/UPI QR & AMOUNT IN WORDS ── */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-stretch">
                  {/* Left (7 cols): Amount in Words + Bank & Scannable UPI QR + Terms */}
                  <div className="sm:col-span-7 flex flex-col justify-between gap-3.5">
                    {/* Amount in Words */}
                    <div className="border-l-4 border-[#E4572E] bg-[#FAF8F5] rounded-r-xl px-4 py-2.5">
                      <span className="text-[9.5px] font-black uppercase tracking-[0.14em] text-slate-500 block">
                        Invoice Amount In Words
                      </span>
                      <p className="text-xs font-bold text-[#0F172A] italic mt-0.5">
                        {numberToWordsIndian(order.grandTotal)}
                      </p>
                    </div>

                    {/* Bank & Scannable UPI Card */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between gap-4">
                      <div className="space-y-1 text-[11px] text-slate-700 flex-1">
                        <div className="flex items-center gap-1.5 font-black uppercase text-[10px] tracking-wider text-[#0F172A] pb-1 border-b border-slate-100">
                          <Landmark size={13} className="text-[#E4572E]" />
                          <span>Bank &amp; UPI Payment Details</span>
                        </div>
                        {company.bankName && (
                          <p>
                            Bank: <strong className="text-slate-900">{company.bankName}</strong>
                          </p>
                        )}
                        {company.accountNumber && (
                          <p>
                            A/c No: <strong className="font-mono text-slate-900">{company.accountNumber}</strong>
                          </p>
                        )}
                        {company.ifscCode && (
                          <p>
                            IFSC: <strong className="font-mono text-slate-900">{company.ifscCode}</strong>
                          </p>
                        )}
                        {company.accountHolder && (
                          <p>
                            Beneficiary: <strong className="text-slate-900">{company.accountHolder}</strong>
                          </p>
                        )}
                        {company.upiId && (
                          <p className="pt-0.5">
                            UPI ID:{' '}
                            <strong className="font-mono text-[#E4572E] bg-[#FFF5F2] px-1.5 py-0.5 rounded border border-[#F5C4B2]">
                              {company.upiId}
                            </strong>
                          </p>
                        )}
                        {!company.accountNumber && !company.upiId && (
                          <p className="text-[11px] text-slate-400 italic">
                            Click &ldquo;Company &amp; Bank&rdquo; above to display bank &amp; UPI QR on invoices.
                          </p>
                        )}
                      </div>

                      {/* Auto UPI QR Code */}
                      {upiQrSrc && !qrFailed && (
                        <div className="shrink-0 text-center bg-[#FAF8F5] border border-slate-200 rounded-lg p-1.5">
                          <img
                            src={upiQrSrc}
                            alt="UPI QR"
                            crossOrigin="anonymous"
                            onError={() => setQrFailed(true)}
                            className="w-20 h-20 object-contain rounded"
                          />
                          <span className="block text-[8px] font-black uppercase tracking-wider text-slate-600 mt-1">
                            Scan to Pay {fmt(upiAmount)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Terms & Conditions */}
                    {termsList.length > 0 && (
                      <div className="text-[10px] text-slate-500 leading-snug px-1">
                        <span className="font-black uppercase tracking-wider text-slate-700 block mb-1">
                          Terms &amp; Declarations:
                        </span>
                        <ul className="list-decimal pl-3.5 space-y-0.5">
                          {termsList.map((term, i) => (
                            <li key={i}>{term.replace(/^\d+\.\s*/, '')}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right (5 cols): Executive Totals Card */}
                  <div className="sm:col-span-5 rounded-xl border border-slate-200 bg-[#FAFAF9] p-4 flex flex-col justify-between">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                        <span className="text-slate-600">Taxable Value</span>
                        <strong className="font-mono text-slate-900">
                          {fmtFull(order.subtotal + (order.additionalCharges || 0))}
                        </strong>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-slate-200/80 text-emerald-700">
                          <span>Discount Allowed</span>
                          <strong className="font-mono">- {fmtFull(order.discount)}</strong>
                        </div>
                      )}
                      {order.gstAmount > 0 && (
                        isSameState ? (
                          <>
                            <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                              <span className="text-slate-600">CGST @ {order.gstPct / 2}%</span>
                              <strong className="font-mono text-slate-900">{fmtFull(order.gstAmount / 2)}</strong>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                              <span className="text-slate-600">SGST @ {order.gstPct / 2}%</span>
                              <strong className="font-mono text-slate-900">{fmtFull(order.gstAmount / 2)}</strong>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                            <span className="text-slate-600">IGST @ {order.gstPct}%</span>
                            <strong className="font-mono text-slate-900">{fmtFull(order.gstAmount)}</strong>
                          </div>
                        )
                      )}
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/80 text-emerald-700 font-bold">
                        <span>Advance / Paid</span>
                        <strong className="font-mono">{fmtFull(order.totalPaid)}</strong>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {/* Grand Total Dark Highlight */}
                      <div className="bg-[#0F172A] text-white rounded-xl px-4 py-3 flex items-center justify-between">
                        <div>
                          <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-300 block">
                            Grand Total
                          </span>
                          <span className="text-[9px] text-slate-400">Incl. all taxes</span>
                        </div>
                        <span className="text-xl font-black font-mono text-white tracking-tight">
                          {fmtFull(order.grandTotal)}
                        </span>
                      </div>

                      {/* Balance Due / Cleared Box */}
                      <div
                        className={`rounded-xl px-4 py-2.5 flex items-center justify-between border ${
                          isPaid
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                      >
                        <span className="text-[10.5px] font-black uppercase tracking-wider">
                          {isPaid ? 'Settlement Status' : 'Balance Due'}
                        </span>
                        <span className="font-mono font-black text-sm">
                          {isPaid ? '✓ SETTLED IN FULL' : fmtFull(order.outstanding)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 5. AUTHENTIC SIGNATORY FOOTER ── */}
                <div className="mt-7 pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end text-xs">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0F172A]">
                      <ShieldCheck size={14} className="text-[#E4572E]" />
                      <span>Thank you for printing with {company.companyName}!</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Subject to local jurisdiction · Computer generated authentic tax invoice.
                    </p>
                  </div>

                  <div className="flex justify-between sm:justify-end gap-8">
                    <div className="text-center">
                      <div className="h-10" />
                      <div className="border-t border-slate-300 pt-1 min-w-[120px]">
                        <span className="text-[10px] font-semibold text-slate-500">Receiver&apos;s Signature</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10.5px] font-extrabold text-[#0F172A] mb-7">
                        For {company.companyName}
                      </p>
                      <div className="border-t border-slate-800 pt-1 min-w-[140px]">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          Authorized Signatory
                        </span>
                      </div>
                    </div>
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
        onSave={(updated) => setCompany(updated)}
      />
    </>
  );
}
