import React from 'react';
import { motion } from 'framer-motion';
import { X, Printer, MessageSquare, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { ManufacturerOrder, Customer, CHEST_SIZES, fmt } from '../../hooks/useOrderStore';

interface Props {
  order: ManufacturerOrder;
  customer?: Customer;
  onClose: () => void;
  onEdit?: () => void;
}

export default function JobSheetModal({ order, customer, onClose, onEdit }: Props) {
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
        return <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs"><CheckCircle2 size={13}/> Done</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 text-blue-700 font-bold text-xs"><Clock size={13}/> In Progress</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-xs"><AlertCircle size={13}/> Pending</span>;
    }
  };

  const advances = [
    { label: 'Advance payment 1', amount: order.advance1 ?? (order.advancePayments?.[0]?.amount || 0) },
    { label: 'Advance payment 2', amount: order.advance2 ?? (order.advancePayments?.[1]?.amount || 0) },
    { label: 'Advance payment 3', amount: order.advance3 ?? (order.advancePayments?.[2]?.amount || 0) },
  ];

  const totalPaid = advances.reduce((s, a) => s + (a.amount || 0), 0) || order.totalPaid || 0;
  const balance = order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, order.grandTotal - totalPaid);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const phone = customer?.whatsapp || customer?.phone || '';
    const text = `*JOB SHEET / ORDER CONFIRMATION*\n` +
      `Order No: ${order.orderNumber}\n` +
      `Customer: ${customer?.businessName || customer?.name || 'Customer'}\n` +
      `Delivery Date: ${order.deliveryDate}\n` +
      `Fabric: ${order.fabric || 'N. Net'}\n` +
      `Print: ${order.printDetails || 'Full Sublimation'}\n` +
      `Collar: ${order.collarType || 'Ready made'} (${order.collarColor || 'Black'})\n` +
      `Hand: ${order.handColor || 'Printed'} | Piping: ${order.handStripeOrPiping || 'Black'}\n` +
      `------------------------\n` +
      `Total Quantity: ${totalQty} pcs (Half: ${totalHalf}, Full: ${totalFull})\n` +
      `Total Amount: ₹${order.grandTotal.toLocaleString('en-IN')}\n` +
      `Advance Paid: ₹${totalPaid.toLocaleString('en-IN')}\n` +
      `Balance Amount: ₹${balance.toLocaleString('en-IN')}\n` +
      `------------------------\n` +
      `Thank you for choosing FiveNest!`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(text)}`, '_blank');
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col print:shadow-none print:w-full print:max-w-none print:max-h-none print:rounded-none"
        >
          {/* Action Bar (hidden on print) */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E8E4DE] bg-[#FAF8F5] rounded-t-2xl print:hidden shrink-0">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#E4572E]/10 text-[#E4572E] font-black text-xs uppercase tracking-wider">
                Manufacturing Job Card
              </span>
              <span className="text-sm font-bold text-[#171717]">{order.orderNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] text-xs font-bold text-[#171717] hover:bg-white transition-colors"
              >
                <Printer size={14} /> Print Job Sheet
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                <MessageSquare size={14} /> Share WhatsApp
              </button>
              {onEdit && (
                <button
                  onClick={() => { onClose(); onEdit(); }}
                  className="px-3 py-1.5 rounded-xl bg-[#E4572E] text-white text-xs font-bold hover:bg-[#D4431B] transition-colors"
                >
                  Edit Order
                </button>
              )}
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F0EDE8] ml-2 text-[#71717A]">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Job Sheet Document */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 print:p-0 print:overflow-visible">
            <div className="border-2 border-black max-w-3xl mx-auto bg-white font-sans text-xs sm:text-sm text-black shadow-sm print:shadow-none">
              
              {/* Header Grid: Order NO | Customer Name | Delivery Date | Rates */}
              <div className="grid grid-cols-12 border-b-2 border-black">
                <div className="col-span-2 border-r border-black p-2 bg-gray-50 flex flex-col justify-center text-center">
                  <div className="text-[11px] font-bold uppercase tracking-wider">Order NO</div>
                  <div className="text-base font-black mt-0.5">{order.orderNumber.replace(/MFG-\d{4}-0*/, '#') || order.orderNumber}</div>
                </div>
                <div className="col-span-5 border-r border-black p-2 flex flex-col justify-center">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">CUSTOMER NAME</div>
                  <div className="text-sm sm:text-base font-black truncate">{customer?.businessName || customer?.name || 'Customer Name'}</div>
                  {customer?.phone && <div className="text-[11px] text-gray-600">Mob: {customer.phone}</div>}
                </div>
                <div className="col-span-5 grid grid-cols-2">
                  <div className="border-r border-black p-2 flex flex-col justify-center bg-gray-50">
                    <div className="text-[10px] font-bold uppercase tracking-wider">Delivery Date</div>
                    <div className="text-xs sm:text-sm font-black mt-0.5">{order.deliveryDate || '—'}</div>
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

              {/* Main Body: Two Columns (Left Details & Status / Right Sizing Table) */}
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
              Generated by FiveNest Studio · www.fivenest.in
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
