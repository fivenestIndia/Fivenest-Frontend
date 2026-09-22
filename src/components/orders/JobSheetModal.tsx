import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Printer, MessageSquare, CheckCircle2, Clock, AlertCircle,
  Building2, Camera, Download, Check, Edit3, Loader2, Copy
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { ManufacturerOrder, Customer, CHEST_SIZES, fmt } from '../../hooks/useOrderStore';

interface Props {
  order: ManufacturerOrder;
  customer?: Customer;
  onClose: () => void;
  onEdit?: () => void;
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
  tagline: 'Sportswear & Jersey Manufacturing Studio',
  address: 'Textile Industrial Hub',
  cityStatePin: 'Maharashtra, India',
  phone: '+91 96640 90039',
  email: 'orders@fivenest.in',
  gstin: '',
};

export default function JobSheetModal({ order, customer, onClose, onEdit }: Props) {
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
        return <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs"><CheckCircle2 size={13} /> Done</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 text-blue-700 font-bold text-xs"><Clock size={13} /> In Progress</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-xs"><AlertCircle size={13} /> Pending</span>;
    }
  };

  const advances = [
    { label: 'Advance payment 1', amount: order.advance1 ?? (order.advancePayments?.[0]?.amount || 0) },
    { label: 'Advance payment 2', amount: order.advance2 ?? (order.advancePayments?.[1]?.amount || 0) },
    { label: 'Advance payment 3', amount: order.advance3 ?? (order.advancePayments?.[2]?.amount || 0) },
  ];

  const totalPaid = advances.reduce((s, a) => s + (a.amount || 0), 0) || order.totalPaid || 0;
  const balance = order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, order.grandTotal - totalPaid);

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
    link.download = `JobSheet-${order.orderNumber}.png`;
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
    const fileName = `JobSheet-${order.orderNumber}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });
    const phone = customer?.whatsapp || customer?.phone || '';

    // 1. Check if native Web Share with files is supported (mobile phones, Chrome on Android, Safari on iOS)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Job Sheet ${order.orderNumber}`,
          text: `Manufacturing Job Sheet for ${customer?.businessName || customer?.name || 'Customer'}`,
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.log('Native share failed or dismissed, falling back:', err);
        } else {
          return;
        }
      }
    }

    // 2. Desktop fallback:
    // Copy screenshot to clipboard
    let copiedToClipboard = false;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        copiedToClipboard = true;
      }
    } catch (clipErr) {
      console.log('Clipboard copy failed:', clipErr);
    }

    // Automatically trigger download of PNG
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();

    // Open WhatsApp Web or App
    const textMsg = `*JOB SHEET #${order.orderNumber}*\nCustomer: ${customer?.businessName || customer?.name || 'Customer'}\nTotal Qty: ${totalQty} pcs\nTotal Amount: ₹${order.grandTotal.toLocaleString('en-IN')}\nBalance: ₹${balance.toLocaleString('en-IN')}\n\n(Screenshot downloaded & copied to clipboard - please paste Ctrl+V or attach image)`;
    const waUrl = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(textMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(textMsg)}`;
    window.open(waUrl, '_blank');

    setShareSuccessToast(
      copiedToClipboard
        ? '📸 Screenshot copied to Clipboard & Downloaded! Just press Ctrl+V in WhatsApp to send the image.'
        : '📸 Screenshot Downloaded! Please attach the image in WhatsApp.'
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm print:hidden" onClick={onClose} />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 print:p-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col print:shadow-none print:w-full print:max-w-none print:max-h-none print:rounded-none"
        >
          {/* Action Bar (hidden on print) */}
          <div className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-[#E8E4DE] bg-[#FAF8F5] rounded-t-2xl print:hidden shrink-0 gap-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#E4572E]/10 text-[#E4572E] font-black text-xs uppercase tracking-wider">
                Manufacturing Job Card
              </span>
              <span className="text-sm font-bold text-[#171717]">{order.orderNumber}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Company Info Button */}
              <button
                onClick={() => { setTempCompany(company); setShowCompanyModal(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#52525B] hover:text-[#171717] hover:border-[#E4572E]/40 transition-colors"
                title="Edit your factory/company name & address"
              >
                <Building2 size={13} className="text-[#E4572E]" /> Company & Address
              </button>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#171717] hover:bg-gray-50 transition-colors"
              >
                <Printer size={13} /> Print Sheet
              </button>

              {/* Download Screenshot */}
              <button
                onClick={handleDownloadScreenshot}
                disabled={isGeneratingSS}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#171717] hover:bg-gray-50 transition-colors"
                title="Download screenshot as PNG image"
              >
                {isGeneratingSS ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                Download SS
              </button>

              {/* Share WhatsApp as Image */}
              <button
                onClick={handleWhatsAppImageShare}
                disabled={isGeneratingSS}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isGeneratingSS ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
                Share WhatsApp (SS)
              </button>

              {onEdit && (
                <button
                  onClick={() => { onClose(); onEdit(); }}
                  className="px-3 py-1.5 rounded-xl bg-[#E4572E] text-white text-xs font-bold hover:bg-[#D4431B] transition-colors"
                >
                  Edit Order
                </button>
              )}

              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F0EDE8] ml-1 text-[#71717A]">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Toast alert when screenshot shared/downloaded */}
          {shareSuccessToast && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 font-bold flex items-center justify-between print:hidden">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                {shareSuccessToast}
              </span>
              <button onClick={() => setShareSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Printable & Screenshot Job Sheet Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 print:p-0 print:overflow-visible bg-[#FAF8F5]/50 print:bg-white">
            
            {/* The exact printable job sheet captured by html2canvas */}
            <div
              ref={sheetRef}
              id="printable-job-sheet"
              className="border-2 border-black max-w-3xl mx-auto bg-white font-sans text-xs sm:text-sm text-black shadow-md print:shadow-none print:border-2 print:border-black"
            >
              {/* ── 0. COMPANY / USER HEADER (Company Name, Tagline, Address, Phone, GSTIN) ── */}
              <div className="border-b-2 border-black p-3 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black tracking-tight uppercase text-black">
                      {company.companyName}
                    </span>
                  </div>
                  {company.tagline && (
                    <p className="text-[10px] sm:text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                      {company.tagline}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-800 mt-0.5">
                    <strong>Address:</strong> {company.address}{company.cityStatePin ? `, ${company.cityStatePin}` : ''}
                  </p>
                </div>

                <div className="text-left sm:text-right text-[11px] text-gray-900 shrink-0 font-medium">
                  {company.phone && (
                    <p><strong>Phone:</strong> {company.phone}</p>
                  )}
                  {company.email && (
                    <p><strong>Email:</strong> {company.email}</p>
                  )}
                  {company.gstin && (
                    <p><strong>GSTIN:</strong> {company.gstin}</p>
                  )}
                </div>
              </div>

              {/* ── 1. ORDER HEADER: Order NO | Customer Name & Address | Delivery Date | Rates ── */}
              <div className="grid grid-cols-12 border-b-2 border-black">
                {/* Order NO */}
                <div className="col-span-2 border-r border-black p-2 bg-gray-50 flex flex-col justify-center text-center">
                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Order NO</div>
                  <div className="text-base sm:text-lg font-black mt-0.5">
                    {order.orderNumber.replace(/MFG-\d{4}-0*/, '#') || order.orderNumber}
                  </div>
                </div>

                {/* Customer Details & Address */}
                <div className="col-span-5 border-r border-black p-2 flex flex-col justify-center">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">CUSTOMER NAME</div>
                  <div className="text-sm sm:text-base font-black truncate">
                    {customer?.businessName || customer?.name || 'Customer Name'}
                  </div>
                  {customer?.name && customer?.businessName && customer.name !== customer.businessName && (
                    <div className="text-[11px] text-gray-700 font-medium">Attn: {customer.name}</div>
                  )}
                  {customer?.phone && (
                    <div className="text-[11px] text-gray-800">Mob: {customer.phone}</div>
                  )}
                  {customer?.billingAddress && (
                    <div className="text-[10px] text-gray-600 truncate mt-0.5">
                      Addr: {customer.billingAddress}
                    </div>
                  )}
                </div>

                {/* Delivery Date & Rate */}
                <div className="col-span-5 grid grid-cols-2">
                  <div className="border-r border-black p-2 flex flex-col justify-center bg-gray-50">
                    <div className="text-[10px] font-bold uppercase tracking-wider">Delivery Date</div>
                    <div className="text-xs sm:text-sm font-black mt-0.5">
                      {order.deliveryDate || '—'}
                    </div>
                  </div>
                  <div className="p-2 flex flex-col justify-center text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-700">Rate</div>
                    <div className="text-[11px] mt-0.5 font-bold">
                      Half: <span className="font-black text-black">₹{halfRate}</span>
                    </div>
                    <div className="text-[11px] font-bold">
                      Full: <span className="font-black text-black">₹{fullRate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2. MAIN BODY: Two Columns (Left Details & Status / Right Sizing Table) ── */}
              <div className="grid grid-cols-12">
                
                {/* Left Column: Order Details + Status + Payments */}
                <div className="col-span-7 border-r-2 border-black flex flex-col">
                  
                  {/* ORDER DETAILS Section */}
                  <div className="border-b border-black">
                    <div className="bg-gray-100 p-1.5 text-center font-black uppercase tracking-wider border-b border-black text-xs">
                      ORDER DETAILS
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        {[
                          { no: 1, label: 'Fabric', val: order.fabric || 'N. Net' },
                          { no: 2, label: 'Print details', val: order.printDetails || 'Full Sublimation' },
                          { no: 3, label: 'Collar Type', val: order.collarType || 'Ready made' },
                          { no: 4, label: 'Collar color', val: order.collarColor || 'Black' },
                          { no: 5, label: 'Hand color', val: order.handColor || 'Printed' },
                          { no: 6, label: 'Hand stripe or piping', val: order.handStripeOrPiping || 'Black' },
                        ].map(row => (
                          <tr key={row.no} className="border-b border-black last:border-0">
                            <td className="w-8 p-1.5 text-center font-bold border-r border-black bg-gray-50">{row.no}</td>
                            <td className="p-1.5 font-bold border-r border-black w-44">{row.label}</td>
                            <td className="p-1.5 font-black text-gray-900">{row.val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ORDER STATUS Section */}
                  <div className="border-b border-black">
                    <div className="bg-gray-100 p-1.5 text-center font-black uppercase tracking-wider border-b border-black text-xs">
                      ORDER STATUS
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        {[
                          { no: 1, label: 'Design', status: stages.design },
                          { no: 2, label: 'Fabric', status: stages.fabric },
                          { no: 3, label: 'Print', status: stages.print },
                          { no: 4, label: 'Stitch', status: stages.stitch },
                        ].map(row => (
                          <tr key={row.no} className="border-b border-black last:border-0">
                            <td className="w-8 p-1.5 text-center font-bold border-r border-black bg-gray-50">{row.no}</td>
                            <td className="p-1.5 font-bold border-r border-black w-44">{row.label}</td>
                            <td className="p-1.5 capitalize font-black">{getStatusBadge(row.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* PAYMENT DETAILS Section */}
                  <div className="flex-1 flex flex-col justify-end">
                    <div className="bg-gray-100 p-1.5 text-center font-black uppercase tracking-wider border-b border-black text-xs">
                      PAYMENT DETAILS
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        {advances.map((adv, idx) => (
                          <tr key={idx} className="border-b border-black">
                            <td className="w-8 p-1.5 text-center font-bold border-r border-black bg-gray-50">{idx + 1}</td>
                            <td className="p-1.5 font-bold border-r border-black w-44">{adv.label}</td>
                            <td className="p-1.5 font-black text-emerald-700 text-right pr-4">
                              {adv.amount > 0 ? adv.amount : '—'}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-b-2 border-black bg-gray-50">
                          <td colSpan={2} className="p-1.5 font-black uppercase tracking-wider pl-3">
                            TOTAL AMOUNT
                          </td>
                          <td className="p-1.5 font-black text-sm text-right pr-4">
                            ₹{order.grandTotal.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr className="bg-white">
                          <td colSpan={2} className="p-1.5 font-black uppercase tracking-wider pl-3">
                            Balance Amount
                          </td>
                          <td className={`p-1.5 font-black text-sm text-right pr-4 ${balance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                            ₹{balance.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* Right Column: Quantity Details (Sizing 20-50) */}
                <div className="col-span-5 flex flex-col">
                  <div className="bg-gray-100 p-1.5 text-center font-black uppercase tracking-wider border-b border-black text-xs">
                    Quantity Details
                  </div>
                  
                  {/* Table Header: Size | Half | Full */}
                  <div className="grid grid-cols-3 border-b border-black bg-gray-50 text-center font-black text-xs py-1">
                    <div className="border-r border-black">Size</div>
                    <div className="border-r border-black">Half</div>
                    <div>Full</div>
                  </div>

                  {/* Sizing Rows: 20 to 50 */}
                  <div className="flex-1 divide-y divide-black">
                    {CHEST_SIZES.map(sz => {
                      const q = sizeMap[sz];
                      const half = q?.half || 0;
                      const full = q?.full || 0;
                      const hasQty = half > 0 || full > 0;

                      return (
                        <div
                          key={sz}
                          className={`grid grid-cols-3 text-center text-xs py-1 ${hasQty ? 'bg-amber-50/70 font-black' : ''}`}
                        >
                          <div className="border-r border-black font-bold">{sz}</div>
                          <div className="border-r border-black text-gray-900">{half > 0 ? half : ''}</div>
                          <div className="text-gray-900">{full > 0 ? full : ''}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sizing Totals */}
                  <div className="border-t-2 border-black bg-gray-100">
                    <div className="grid grid-cols-3 text-center font-black text-xs py-1.5 border-b border-black">
                      <div className="border-r border-black uppercase tracking-wider">Total</div>
                      <div className="border-r border-black text-black">{totalHalf}</div>
                      <div className="text-black">{totalFull}</div>
                    </div>
                    <div className="p-2 text-center bg-gray-200">
                      <span className="font-black uppercase tracking-wider mr-2 text-xs">Total Quantity</span>
                      <span className="text-base font-black text-black">{totalQty}</span>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Print Footer Notice */}
            <div className="text-center text-[10px] text-gray-400 mt-4 print:mt-2">
              Generated by {company.companyName} · Powered by FiveNest Studio
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── COMPANY PROFILE EDIT MODAL ── */}
      <AnimatePresence>
        {showCompanyModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-[#E4572E]" />
                  <h3 className="font-black text-base text-[#171717]">Company / User Details</h3>
                </div>
                <button onClick={() => setShowCompanyModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-gray-500">
                These company and address details will be printed on all Job Sheets and included in WhatsApp screenshots.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Company / User Name *</label>
                  <input
                    value={tempCompany.companyName}
                    onChange={e => setTempCompany({ ...tempCompany, companyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-bold outline-none focus:border-[#E4572E]"
                    placeholder="e.g. FiveNest Apparels"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tagline / Subtitle</label>
                  <input
                    value={tempCompany.tagline}
                    onChange={e => setTempCompany({ ...tempCompany, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                    placeholder="e.g. Custom Jersey & Sportswear Manufacturing"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Factory / Office Address *</label>
                  <input
                    value={tempCompany.address}
                    onChange={e => setTempCompany({ ...tempCompany, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                    placeholder="e.g. Gala 4, Industrial Area, Textile Zone"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">City, State & PIN</label>
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

      {/* Global CSS for clean A4 printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-job-sheet, #printable-job-sheet * {
            visibility: visible !important;
          }
          #printable-job-sheet {
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
