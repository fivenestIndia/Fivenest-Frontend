import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Printer, CheckCircle2, Clock, AlertCircle,
  Building2, Camera, Download, Check, Edit3, Loader2, Copy,
  CreditCard, BookOpen, Layers
} from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  PrintingOrder, Customer, PrintingService, fmt,
  STATUS_LABELS
} from '../../hooks/useOrderStore';

interface Props {
  order: PrintingOrder;
  customer?: Customer;
  service?: PrintingService;
  onClose: () => void;
  onReceivePayment?: (customerId: string) => void;
  onViewCustomerLedger?: (customerId: string) => void;
}

export interface CompanyProfile {
  companyName: string;
  tagline: string;
  address: string;
  cityStatePin: string;
  phone: string;
  email: string;
  gstin: string;
}

const DEFAULT_COMPANY: CompanyProfile = {
  companyName: 'FiveNest Apparels',
  tagline: 'Sportswear & Sublimation Printing Studio',
  address: 'Textile Industrial Hub',
  cityStatePin: 'Maharashtra, India',
  phone: '+91 96640 90039',
  email: 'orders@fivenest.in',
  gstin: '',
};

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
  const [company, setCompany] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem('fn_company_profile');
      if (saved) return { ...DEFAULT_COMPANY, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_COMPANY;
  });

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [tempCompany, setTempCompany] = useState<CompanyProfile>(company);

  // Sharing states
  const [isGeneratingSS, setIsGeneratingSS] = useState(false);
  const [shareSuccessToast, setShareSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (shareSuccessToast) {
      const t = setTimeout(() => setShareSuccessToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [shareSuccessToast]);

  // Save company profile
  const handleSaveCompany = () => {
    setCompany(tempCompany);
    try {
      localStorage.setItem('fn_company_profile', JSON.stringify(tempCompany));
    } catch (e) {
      console.error(e);
    }
    setShowCompanyModal(false);
  };

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
    link.download = `PrintingJobSheet-${order.orderNumber}.png`;
    link.href = result.dataUrl;
    link.click();
    setShareSuccessToast('Screenshot downloaded successfully!');
  };

  // Share Screenshot on WhatsApp
  const handleWhatsAppImageShare = async () => {
    setIsGeneratingSS(true);
    const result = await generateScreenshotBlob();
    setIsGeneratingSS(false);

    if (!result) {
      alert('Could not capture screenshot. Please try again.');
      return;
    }

    const { blob, dataUrl } = result;
    const fileName = `PrintingJobSheet-${order.orderNumber}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });
    const phone = customer?.whatsapp || customer?.phone || '';

    // 1. Check if native Web Share with files is supported (mobile phones, Chrome on Android, Safari on iOS)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Printing Job Card - ${order.orderNumber}`,
          text: `*${company.companyName}*\nPrinting Job Card: *${order.orderNumber}*\nService: ${service?.name || 'Printing'}\nQty: ${order.quantity} pcs\nTotal: ${fmt(order.grandTotal)}\nBalance Due: ${fmt(order.outstanding)}`,
        });
        setShareSuccessToast('Shared successfully!');
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('Native share failed, falling back to download + copy link:', err);
        } else {
          return;
        }
      }
    }

    // 2. Desktop Fallback: Copy image to clipboard, download PNG, and open WhatsApp Web
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setShareSuccessToast('📋 Image copied to clipboard! Paste (Ctrl+V / Cmd+V) in WhatsApp chat.');
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }

    // Auto-download file for easy drag-drop or file attach
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();

    // Open WhatsApp Web with order summary
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `*${company.companyName}*\n` +
      `📄 *PRINTING JOB CARD: ${order.orderNumber}*\n` +
      `👤 Client: *${customer?.businessName || customer?.name || 'Valued Customer'}*\n` +
      `🖨️ Service: *${service?.name || 'Printing'}*\n` +
      `👕 Fabric/Material: ${order.fabric || order.material || 'Standard'}\n` +
      `📐 Print Area: ${order.printArea || 'Standard'}\n` +
      `📦 Quantity: *${order.quantity} pcs* @ ₹${order.appliedRate}/pc\n` +
      `💰 Grand Total: *${fmt(order.grandTotal)}*\n` +
      `✅ Total Paid: *${fmt(order.totalPaid)}*\n` +
      `⚠️ Balance Due: *${fmt(order.outstanding)}*\n\n` +
      `📸 _Job sheet screenshot has been downloaded / copied to clipboard. Please attach to this chat._`;

    const waUrl = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:w-full print:rounded-none"
          onClick={e => e.stopPropagation()}
        >
          {/* Top action toolbar (hidden when printing) */}
          <div className="bg-[#FAF8F5] border-b border-[#E8E4DE] px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                P
              </span>
              <div>
                <h3 className="font-bold text-sm text-[#171717] flex items-center gap-1.5">
                  Printing Job Sheet
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {order.orderNumber}
                  </span>
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  Work order, technical specifications & billing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Edit Company details */}
              <button
                type="button"
                onClick={() => {
                  setTempCompany(company);
                  setShowCompanyModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-semibold text-[#52525B] hover:border-[#E4572E] hover:text-[#E4572E] transition-all shadow-sm"
                title="Update your company/factory name & address on the job sheet"
              >
                <Building2 size={13} />
                <span>Company & Address</span>
              </button>

              {/* Download screenshot */}
              <button
                type="button"
                onClick={handleDownloadScreenshot}
                disabled={isGeneratingSS}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-semibold text-[#171717] hover:bg-[#F5F3EF] transition-all shadow-sm disabled:opacity-50"
                title="Download high-resolution image"
              >
                {isGeneratingSS ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                <span>Download SS</span>
              </button>

              {/* Share on WhatsApp with Screenshot */}
              <button
                type="button"
                onClick={handleWhatsAppImageShare}
                disabled={isGeneratingSS}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
                title="Send Screenshot directly via WhatsApp"
              >
                {isGeneratingSS ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                <span>Share WhatsApp (SS)</span>
              </button>

              {/* Print sheet button */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171717] text-white text-xs font-bold hover:bg-black transition-all shadow-sm"
              >
                <Printer size={13} />
                <span>Print Sheet</span>
              </button>

              {/* Receive Payment Quick Action */}
              {order.outstanding > 0 && onReceivePayment && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReceivePayment(order.customerId);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E4572E] text-white text-xs font-bold hover:bg-[#D4431B] transition-all shadow-sm"
                >
                  <CreditCard size={13} />
                  <span>Receive Payment</span>
                </button>
              )}

              {/* View Customer Ledger */}
              {onViewCustomerLedger && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewCustomerLedger(order.customerId);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-all shadow-sm"
                  title="Open this customer's account ledger"
                >
                  <BookOpen size={13} />
                  <span>Ledger</span>
                </button>
              )}

              {/* Close modal */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-[#E8E4DE] text-[#71717A] hover:text-[#171717] transition-all ml-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Toast Notification for SS actions */}
          <AnimatePresence>
            {shareSuccessToast && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 flex items-center justify-between shrink-0"
              >
                <span className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" />
                  {shareSuccessToast}
                </span>
                <button onClick={() => setShareSuccessToast(null)}>
                  <X size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Printable Job Sheet Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8F7F4] print:p-0 print:bg-white print:overflow-visible">
            <div
              id="printable-printing-job-sheet"
              ref={sheetRef}
              className="bg-white border-2 border-black max-w-[800px] mx-auto p-6 sm:p-8 text-black shadow-sm print:border-2 print:border-black print:shadow-none print:p-6 print:m-0"
            >
              {/* Header: Company Profile */}
              <div className="border-b-2 border-black pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                      {company.companyName}
                    </h1>
                    <button
                      type="button"
                      onClick={() => {
                        setTempCompany(company);
                        setShowCompanyModal(true);
                      }}
                      className="print:hidden text-gray-400 hover:text-[#E4572E] p-1 rounded"
                      title="Edit Company Profile"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                  {company.tagline && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                      {company.tagline}
                    </p>
                  )}
                  <p className="text-xs text-gray-800 mt-1 leading-snug">
                    {company.address}
                    {company.cityStatePin && <span>, {company.cityStatePin}</span>}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-800 mt-1">
                    <span>Phone: <strong>{company.phone}</strong></span>
                    {company.email && <span>Email: <strong>{company.email}</strong></span>}
                    {company.gstin && <span>GSTIN: <strong>{company.gstin}</strong></span>}
                  </div>
                </div>

                <div className="text-right sm:self-center shrink-0 border-2 border-black px-4 py-2 bg-gray-50 print:bg-transparent">
                  <p className="text-xs uppercase tracking-widest font-black text-gray-600">Document</p>
                  <p className="text-base sm:text-lg font-black text-black">PRINTING JOB CARD</p>
                  <p className="text-xs font-mono font-bold text-gray-800">NO: {order.orderNumber}</p>
                </div>
              </div>

              {/* Order Meta & Customer Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b-2 border-black pb-4 mb-4 text-xs">
                {/* Customer Box */}
                <div className="border border-black p-3 bg-gray-50/50 print:bg-transparent">
                  <h4 className="font-black uppercase tracking-wider text-black border-b border-gray-300 pb-1 mb-2 flex items-center justify-between">
                    <span>Client / Party Details</span>
                    {customer?.customerType && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200 uppercase">
                        {customer.customerType}
                      </span>
                    )}
                  </h4>
                  <div className="space-y-1">
                    <p className="font-black text-sm text-black">
                      {customer?.businessName || customer?.name || '—'}
                    </p>
                    {customer?.businessName && customer?.name && (
                      <p className="text-gray-700 font-semibold">Contact: {customer.name}</p>
                    )}
                    <p className="text-gray-800">Phone: <strong>{customer?.phone || '—'}</strong></p>
                    {customer?.whatsapp && customer?.whatsapp !== customer?.phone && (
                      <p className="text-gray-800">WhatsApp: <strong>{customer.whatsapp}</strong></p>
                    )}
                    {customer?.billingAddress && (
                      <p className="text-gray-700 leading-snug">Address: {customer.billingAddress}</p>
                    )}
                    {customer?.gstin && (
                      <p className="text-gray-700 font-mono">GSTIN: {customer.gstin}</p>
                    )}
                  </div>
                </div>

                {/* Job Order Meta Box */}
                <div className="border border-black p-3 bg-gray-50/50 print:bg-transparent">
                  <h4 className="font-black uppercase tracking-wider text-black border-b border-gray-300 pb-1 mb-2">
                    Work Order Info
                  </h4>
                  <div className="grid grid-cols-2 gap-y-1.5">
                    <div>
                      <span className="text-gray-600 block text-[10px] uppercase font-bold">Order Date:</span>
                      <strong className="text-black">{order.date || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-[10px] uppercase font-bold">Required By:</span>
                      <strong className="text-black">{order.requiredDate || 'Urgent'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-[10px] uppercase font-bold">Delivery Date:</span>
                      <strong className="text-black">{order.deliveryDate || 'Pending'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-[10px] uppercase font-bold">Production Stage:</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-black text-[10px] border border-black uppercase bg-gray-100 text-black">
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-gray-600 text-[10px] uppercase font-bold">Payment Status:</span>
                      <span className={`font-black text-xs uppercase ${order.outstanding > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {order.paymentStatus} {order.outstanding > 0 ? `(${fmt(order.outstanding)} Due)` : '(Cleared)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Printing Specifications */}
              <div className="border border-black mb-4">
                <div className="bg-black text-white px-3 py-1.5 font-black uppercase tracking-wider text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} />
                    Printing Technical Specifications
                  </span>
                  <span className="text-[10px] font-mono tracking-normal opacity-90">
                    Service: {service?.name || 'Sublimation / Heat Transfer'}
                  </span>
                </div>

                <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50/30 print:bg-transparent">
                  <div className="border border-gray-300 p-2 rounded bg-white">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Service Type</span>
                    <strong className="text-sm text-black">{service?.name || 'Custom Print'}</strong>
                  </div>
                  <div className="border border-gray-300 p-2 rounded bg-white">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Quantity</span>
                    <strong className="text-sm text-black">{order.quantity} pcs</strong>
                  </div>
                  <div className="border border-gray-300 p-2 rounded bg-white">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Applied Rate</span>
                    <strong className="text-sm text-black">₹{order.appliedRate} / pc</strong>
                  </div>
                  <div className="border border-gray-300 p-2 rounded bg-white">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Fabric / Material</span>
                    <strong className="text-sm text-black">{order.fabric || order.material || 'Polyester'}</strong>
                  </div>

                  <div className="border border-gray-300 p-2 rounded bg-white">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Print Area</span>
                    <strong className="text-sm text-black">{order.printArea || 'Full Body'}</strong>
                  </div>
                  <div className="border border-gray-300 p-2 rounded bg-white">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Garment / Color</span>
                    <strong className="text-sm text-black">{order.color || 'White Base'}</strong>
                  </div>
                  <div className="border border-gray-300 p-2 rounded bg-white">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Artwork Approval</span>
                    <span className="inline-flex items-center gap-1 font-bold text-xs">
                      {order.artworkApproved ? (
                        <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 size={13}/> Approved</span>
                      ) : (
                        <span className="text-amber-700 flex items-center gap-1"><AlertCircle size={13}/> Pending</span>
                      )}
                    </span>
                  </div>
                  <div className="border border-gray-300 p-2 rounded bg-white">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Artwork File</span>
                    <span className="font-mono text-xs truncate block" title={order.artworkFile || '—'}>
                      {order.artworkFile || 'Not uploaded'}
                    </span>
                  </div>
                </div>

                {/* Special Instructions Box */}
                <div className="border-t border-gray-300 p-3 bg-white">
                  <span className="text-[10px] uppercase font-bold text-gray-600 block mb-1">
                    Special Production Instructions & Notes:
                  </span>
                  <p className="text-xs text-gray-800 whitespace-pre-wrap font-medium">
                    {order.specialInstructions || order.notes || 'Ensure accurate color profiling and check for registration marks before batch run.'}
                  </p>
                </div>
              </div>

              {/* Billing & Financial Breakdown */}
              <div className="border-2 border-black mb-4">
                <div className="bg-gray-100 border-b border-black px-3 py-1 font-black uppercase tracking-wider text-xs">
                  Financial Summary & Payment Breakdown
                </div>
                <div className="p-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Column: Charges Table */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between py-0.5 border-b border-gray-200">
                      <span className="text-gray-600">Base Subtotal ({order.quantity} × ₹{order.appliedRate}):</span>
                      <strong className="text-black">{fmt(order.subtotal)}</strong>
                    </div>
                    {order.additionalCharges > 0 && (
                      <div className="flex justify-between py-0.5 border-b border-gray-200">
                        <span className="text-gray-600">Setup / Additional Charges:</span>
                        <strong className="text-black">{fmt(order.additionalCharges)}</strong>
                      </div>
                    )}
                    {order.discount > 0 && (
                      <div className="flex justify-between py-0.5 border-b border-gray-200 text-emerald-700">
                        <span>Discount Applied:</span>
                        <strong>- {fmt(order.discount)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between py-0.5 border-b border-gray-200">
                      <span className="text-gray-600">GST ({order.gstPct}%):</span>
                      <strong className="text-black">{fmt(order.gstAmount)}</strong>
                    </div>
                  </div>

                  {/* Right Column: Net Totals Card */}
                  <div className="bg-gray-50 border border-gray-300 p-3 rounded space-y-2">
                    <div className="flex justify-between items-center text-sm font-black border-b border-gray-300 pb-1">
                      <span>Grand Total:</span>
                      <span className="text-base text-black">{fmt(order.grandTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-700">
                      <span>Total Paid / Advance:</span>
                      <span>{fmt(order.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black pt-1 border-t-2 border-black">
                      <span className="uppercase text-red-700">Balance Due:</span>
                      <span className={`text-base font-black ${order.outstanding > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {fmt(order.outstanding)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures & Footer */}
              <div className="mt-8 pt-4 border-t-2 border-black grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="h-12 border-b border-dashed border-gray-400 mb-1" />
                  <p className="font-bold text-gray-700">Client / Receiver Signature</p>
                  <p className="text-[10px] text-gray-500">I confirm the print specifications & quantities</p>
                </div>
                <div>
                  <div className="h-12 border-b border-dashed border-gray-400 mb-1" />
                  <p className="font-bold text-black">For {company.companyName}</p>
                  <p className="text-[10px] text-gray-500">Authorized Workshop Supervisor</p>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-gray-200 text-center text-[10px] text-gray-500 flex justify-between">
                <span>Print Job Card · Ref: {order.orderNumber}</span>
                <span>Generated via FiveNest Studio on {new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal: Edit Company Profile */}
      <AnimatePresence>
        {showCompanyModal && (
          <div
            className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
            onClick={() => setShowCompanyModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="text-base font-bold text-[#171717] flex items-center gap-2">
                  <Building2 size={18} className="text-[#E4572E]" />
                  Edit Company Profile
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Company / Studio Name *</label>
                  <input
                    value={tempCompany.companyName}
                    onChange={e => setTempCompany({ ...tempCompany, companyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                    placeholder="FiveNest Apparels"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tagline / Business Type</label>
                  <input
                    value={tempCompany.tagline}
                    onChange={e => setTempCompany({ ...tempCompany, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                    placeholder="Sportswear & Sublimation Printing Studio"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Factory / Workshop Address</label>
                  <textarea
                    rows={2}
                    value={tempCompany.address}
                    onChange={e => setTempCompany({ ...tempCompany, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                    placeholder="Textile Industrial Estate, Gala 4"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">City, State, PIN</label>
                  <input
                    value={tempCompany.cityStatePin}
                    onChange={e => setTempCompany({ ...tempCompany, cityStatePin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                    placeholder="e.g. Mumbai, Maharashtra - 400014"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Phone / WhatsApp *</label>
                    <input
                      value={tempCompany.phone}
                      onChange={e => setTempCompany({ ...tempCompany, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                      placeholder="+91 96640 90039"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">GSTIN (Optional)</label>
                    <input
                      value={tempCompany.gstin}
                      onChange={e => setTempCompany({ ...tempCompany, gstin: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                      placeholder="27AAAAA0000A1Z5"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email</label>
                  <input
                    value={tempCompany.email}
                    onChange={e => setTempCompany({ ...tempCompany, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                    placeholder="orders@fivenest.in"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompany}
                  className="px-5 py-2 rounded-xl bg-[#E4572E] text-white text-xs font-bold hover:bg-[#D4431B]"
                >
                  Save Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clean A4 print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-printing-job-sheet, #printable-printing-job-sheet * {
            visibility: visible !important;
          }
          #printable-printing-job-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: 2px solid black !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </>
  );
}
