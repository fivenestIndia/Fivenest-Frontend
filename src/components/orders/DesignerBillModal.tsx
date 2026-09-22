import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Printer, CheckCircle2, AlertCircle,
  Building2, Camera, Download, Check, Edit3, Loader2,
  CreditCard, BookOpen, FileText, Palette
} from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  DesignerBill, Customer, fmt, STATUS_LABELS
} from '../../hooks/useOrderStore';

interface Props {
  bill: DesignerBill;
  customer?: Customer;
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
  tagline: 'Apparel Design & Mockup Studio',
  address: 'Textile Industrial Hub',
  cityStatePin: 'Maharashtra, India',
  phone: '+91 96640 90039',
  email: 'orders@fivenest.in',
  gstin: '',
};

export default function DesignerBillModal({
  bill,
  customer,
  onClose,
  onReceivePayment,
  onViewCustomerLedger,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);

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
  const [isGeneratingSS, setIsGeneratingSS] = useState(false);
  const [shareSuccessToast, setShareSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (shareSuccessToast) {
      const t = setTimeout(() => setShareSuccessToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [shareSuccessToast]);

  const handleSaveCompany = () => {
    setCompany(tempCompany);
    try {
      localStorage.setItem('fn_company_profile', JSON.stringify(tempCompany));
    } catch (e) {
      console.error(e);
    }
    setShowCompanyModal(false);
  };

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
    link.download = `DesignerBill-${bill.billNumber}.png`;
    link.href = result.dataUrl;
    link.click();
    setShareSuccessToast('Screenshot downloaded successfully!');
  };

  const handleWhatsAppImageShare = async () => {
    setIsGeneratingSS(true);
    const result = await generateScreenshotBlob();
    setIsGeneratingSS(false);

    if (!result) {
      alert('Could not capture screenshot. Please try again.');
      return;
    }

    const { blob, dataUrl } = result;
    const fileName = `DesignerBill-${bill.billNumber}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });
    const phone = customer?.whatsapp || customer?.phone || '';

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Designer Bill - ${bill.billNumber}`,
          text: `*${company.companyName}*\nDesigner Bill: *${bill.billNumber}*\nClient: ${customer?.businessName || customer?.name}\nTotal: ${fmt(bill.grandTotal)}\nBalance Due: ${fmt(bill.outstanding)}`,
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
        setShareSuccessToast('📋 Image copied to clipboard! Paste (Ctrl+V) in WhatsApp chat.');
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
      `🎨 *DESIGNER BILL: ${bill.billNumber}*\n` +
      `👤 Client: *${customer?.businessName || customer?.name || 'Valued Customer'}*\n` +
      `📦 Production Job: ${bill.productionJobId || 'Standard'}\n` +
      `💰 Grand Total: *${fmt(bill.grandTotal)}*\n` +
      `✅ Total Paid: *${fmt(bill.totalPaid)}*\n` +
      `⚠️ Balance Due: *${fmt(bill.outstanding)}*\n\n` +
      `📸 _Invoice image downloaded. Please attach to this chat._`;

    const waUrl = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
  };

  const subtotal = bill.items.reduce((s, i) => s + i.amount, 0);

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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:w-full print:rounded-none"
          onClick={e => e.stopPropagation()}
        >
          {/* Top toolbar */}
          <div className="bg-[#FAF8F5] border-b border-[#E8E4DE] px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm">
                D
              </span>
              <div>
                <h3 className="font-bold text-sm text-[#171717] flex items-center gap-1.5">
                  Designer Bill
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    {bill.billNumber}
                  </span>
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  Design service invoice & artwork charges
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => { setTempCompany(company); setShowCompanyModal(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-semibold text-[#52525B] hover:border-[#E4572E] hover:text-[#E4572E] transition-all shadow-sm"
              >
                <Building2 size={13} />
                <span>Company & Address</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadScreenshot}
                disabled={isGeneratingSS}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] bg-white text-xs font-semibold text-[#171717] hover:bg-[#F5F3EF] transition-all shadow-sm disabled:opacity-50"
              >
                {isGeneratingSS ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                <span>Download SS</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppImageShare}
                disabled={isGeneratingSS}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
              >
                {isGeneratingSS ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                <span>Share WhatsApp (SS)</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171717] text-white text-xs font-bold hover:bg-black transition-all shadow-sm"
              >
                <Printer size={13} />
                <span>Print Bill</span>
              </button>

              {bill.outstanding > 0 && onReceivePayment && (
                <button
                  type="button"
                  onClick={() => { onClose(); onReceivePayment(bill.customerId); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E4572E] text-white text-xs font-bold hover:bg-[#D4431B] transition-all shadow-sm"
                >
                  <CreditCard size={13} />
                  <span>Receive Payment</span>
                </button>
              )}

              {onViewCustomerLedger && (
                <button
                  type="button"
                  onClick={() => { onClose(); onViewCustomerLedger(bill.customerId); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-all shadow-sm"
                >
                  <BookOpen size={13} />
                  <span>Ledger</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-[#E8E4DE] text-[#71717A] hover:text-[#171717] transition-all ml-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Designer Bill */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8F7F4] print:p-0 print:bg-white print:overflow-visible">
            <div
              id="printable-designer-bill"
              ref={sheetRef}
              className="bg-white border-2 border-black max-w-[750px] mx-auto p-6 sm:p-8 text-black shadow-sm print:border-2 print:border-black print:shadow-none print:p-6 print:m-0"
            >
              {/* Header */}
              <div className="border-b-2 border-black pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                      {company.companyName}
                    </h1>
                    <button
                      type="button"
                      onClick={() => { setTempCompany(company); setShowCompanyModal(true); }}
                      className="print:hidden text-gray-400 hover:text-[#E4572E] p-1 rounded"
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

                <div className="text-right sm:self-center shrink-0 border-2 border-black px-4 py-2 bg-purple-50/50 print:bg-transparent">
                  <p className="text-xs uppercase tracking-widest font-black text-gray-600">Invoice</p>
                  <p className="text-base sm:text-lg font-black text-black">DESIGNER BILL</p>
                  <p className="text-xs font-mono font-bold text-gray-800">NO: {bill.billNumber}</p>
                </div>
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b-2 border-black pb-4 mb-4 text-xs">
                <div className="border border-black p-3 bg-gray-50/50 print:bg-transparent">
                  <h4 className="font-black uppercase tracking-wider text-black border-b border-gray-300 pb-1 mb-2">
                    Client Details
                  </h4>
                  <p className="font-black text-sm text-black">{customer?.businessName || customer?.name || '—'}</p>
                  {customer?.businessName && customer?.name && <p className="text-gray-700">Contact: {customer.name}</p>}
                  <p className="text-gray-800">Phone: <strong>{customer?.phone || '—'}</strong></p>
                  {customer?.billingAddress && <p className="text-gray-700 leading-snug">Address: {customer.billingAddress}</p>}
                  {customer?.gstin && <p className="text-gray-700 font-mono">GSTIN: {customer.gstin}</p>}
                </div>

                <div className="border border-black p-3 bg-gray-50/50 print:bg-transparent">
                  <h4 className="font-black uppercase tracking-wider text-black border-b border-gray-300 pb-1 mb-2">
                    Bill Info
                  </h4>
                  <div className="grid grid-cols-2 gap-y-1.5">
                    <div>
                      <span className="text-gray-600 block text-[10px] uppercase font-bold">Bill Date:</span>
                      <strong className="text-black">{bill.date}</strong>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-[10px] uppercase font-bold">Due Date:</span>
                      <strong className="text-black">{bill.dueDate || 'On Receipt'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-[10px] uppercase font-bold">Job Reference:</span>
                      <strong className="text-black font-mono">{bill.productionJobId || 'Direct'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-[10px] uppercase font-bold">Payment Status:</span>
                      <span className={`font-black text-xs uppercase ${bill.outstanding > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {bill.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-black mb-4">
                <table className="w-full text-xs">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="text-left px-3 py-2 uppercase font-black">#</th>
                      <th className="text-left px-3 py-2 uppercase font-black">Service Description</th>
                      <th className="text-left px-3 py-2 uppercase font-black">Type</th>
                      <th className="text-right px-3 py-2 uppercase font-black">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b border-gray-200">
                        <td className="px-3 py-2 font-mono text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2 font-bold text-black">{item.description}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded uppercase font-mono text-[10px] bg-gray-100 font-bold">
                            {item.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-black">{fmt(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-2 border-black p-3 text-xs mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between py-0.5 border-b border-gray-200">
                      <span className="text-gray-600">Subtotal:</span>
                      <strong>{fmt(subtotal)}</strong>
                    </div>
                    {bill.discount > 0 && (
                      <div className="flex justify-between py-0.5 border-b border-gray-200 text-emerald-700">
                        <span>Discount:</span>
                        <strong>- {fmt(bill.discount)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between py-0.5 border-b border-gray-200">
                      <span className="text-gray-600">GST ({bill.gstPct}%):</span>
                      <strong>{fmt(bill.gstAmount)}</strong>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded border border-gray-300 space-y-1.5">
                    <div className="flex justify-between text-sm font-black border-b border-gray-300 pb-1">
                      <span>Total Amount:</span>
                      <span>{fmt(bill.grandTotal)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>Amount Paid:</span>
                      <span>{fmt(bill.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black pt-1 border-t-2 border-black">
                      <span className="uppercase text-red-700">Balance Due:</span>
                      <span className={bill.outstanding > 0 ? 'text-red-700' : 'text-emerald-700'}>
                        {fmt(bill.outstanding)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t-2 border-black grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="h-12 border-b border-dashed border-gray-400 mb-1" />
                  <p className="font-bold text-gray-700">Customer Acceptance</p>
                </div>
                <div>
                  <div className="h-12 border-b border-dashed border-gray-400 mb-1" />
                  <p className="font-bold text-black">For {company.companyName}</p>
                </div>
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
                  <label className="font-bold text-gray-700 block mb-1">Company Name *</label>
                  <input
                    value={tempCompany.companyName}
                    onChange={e => setTempCompany({ ...tempCompany, companyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tagline</label>
                  <input
                    value={tempCompany.tagline}
                    onChange={e => setTempCompany({ ...tempCompany, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={tempCompany.address}
                    onChange={e => setTempCompany({ ...tempCompany, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Phone</label>
                    <input
                      value={tempCompany.phone}
                      onChange={e => setTempCompany({ ...tempCompany, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">GSTIN</label>
                    <input
                      value={tempCompany.gstin}
                      onChange={e => setTempCompany({ ...tempCompany, gstin: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#E4572E]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompany}
                  className="px-5 py-2 rounded-xl bg-[#E4572E] text-white text-xs font-bold"
                >
                  Save Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-designer-bill, #printable-designer-bill * {
            visibility: visible !important;
          }
          #printable-designer-bill {
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
