import React, { useState, useEffect } from 'react';
import { 
  Receipt, Plus, Download, Printer, Send, Trash2, Edit2, CheckCircle, 
  Clock, DollarSign, Search, Sparkles, RefreshCw, FileText, X, User, QrCode, Settings
} from 'lucide-react';
import type { PlayerRecord, OrderMetadata } from './orderEntry';

import type { OrderItem } from './factoryOrders';

export interface BillingRecord {
  id: string;
  orderCode: string;
  date: string;
  customerName: string;
  fileName: string;
  whatsapp: string;
  qty: number;
  rate: number;
  designCharges: number;
  status: 'Completed' | 'Pending' | 'Cancelled';
  advance?: number;
}

interface BillingSystemProps {
  records?: PlayerRecord[];
  metadata?: OrderMetadata;
  currentUser?: { email: string; name: string; balance: number } | null;
  orders?: OrderItem[];
}

// Initial sample data pre-populated for guest / demo users
const initialBillingRecords: BillingRecord[] = [
  { id: '1', orderCode: 'FN-26-1605-03', date: '16-05-2026', customerName: 'Shirke', fileName: 'MAPL - 18 teams', whatsapp: '9773358920', qty: 191, rate: 3, designCharges: 560, status: 'Completed' },
];

export const BillingSystem: React.FC<BillingSystemProps> = ({ records = [], metadata, currentUser, orders = [] }) => {
  // Scoped key per user
  const userStorageKey = currentUser?.email 
    ? `fivenest_billing_records_${currentUser.email.toLowerCase().trim()}` 
    : 'fivenest_billing_records_guest';

  const [billingList, setBillingList] = useState<BillingRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending'>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<BillingRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<BillingRecord | null>(null);
  const [showUpiSettings, setShowUpiSettings] = useState(false);

  // Editable Studio UPI ID
  const [upiId, setUpiId] = useState<string>(() => {
    return localStorage.getItem('fivenest_upi_id') || 'vilesh332-1@okhdfcbank';
  });

  const handleUpiChange = (newVal: string) => {
    setUpiId(newVal);
    localStorage.setItem('fivenest_upi_id', newVal);
  };

  // Load user-scoped billing data combining BOTH Order Dockets and Web Studio Print Production Exports
  const loadBillingData = React.useCallback(() => {
    const userEmail = currentUser?.email || 'guest';
    const keysToCheck = [
      `fivenest_studio_export_billing_${userEmail.toLowerCase().trim()}`,
      `fivenest_studio_export_billing_all`,
      `fivenest_studio_export_billing_guest`
    ];

    let studioExportsMap = new Map<string, BillingRecord>();

    // Load deleted IDs so user-deleted entries stay deleted across refreshes
    const deletedKey = `fivenest_billing_deleted_ids_${(currentUser?.email || 'guest').toLowerCase().trim()}`;
    let deletedIds: Set<string> = new Set();
    try {
      const deletedStr = localStorage.getItem(deletedKey);
      if (deletedStr) deletedIds = new Set(JSON.parse(deletedStr));
    } catch (e) {}

    keysToCheck.forEach(k => {
      const str = localStorage.getItem(k);
      if (str) {
        try {
          const list: BillingRecord[] = JSON.parse(str);
          list.forEach(item => {
            if (item && item.id && !studioExportsMap.has(item.id) && !deletedIds.has(item.id)) {
              studioExportsMap.set(item.id, item);
            }
          });
        } catch (e) {}
      }
    });

    const studioExports = Array.from(studioExportsMap.values());

    let syncedFromOrders: BillingRecord[] = [];
    if (orders && orders.length > 0) {
      syncedFromOrders = orders.map((o) => {
        let totalQty = 0;
        o.sizeGrid.forEach((row) => {
          totalQty += Number(row.halfQty || 0) + Number(row.fullQty || 0);
        });

        const advance = Number(o.advance1 || 0) + Number(o.advance2 || 0) + Number(o.advance3 || 0);
        const isPrintOnly = o.orderScope === 'printing-only';
        const designCost = o.designCost !== undefined ? o.designCost : (isPrintOnly ? totalQty * 3 : 0);

        return {
          id: o.id,
          orderCode: `ORD-#${o.orderNo}`,
          date: o.deliveryDate || 'TBD',
          customerName: o.customerName,
          fileName: `${isPrintOnly ? '🖨️ Order Docket (Print)' : '🏭 Order Docket (Mfg)'} (${totalQty} pcs)`,
          whatsapp: '',
          qty: totalQty,
          rate: o.ratePerPiece,
          designCharges: designCost,
          status: o.statusPrint === 'Done' && o.statusStitch === 'Done' ? 'Completed' : 'Pending',
          advance: advance,
        };
      });
    }

    // Combine studio 300 DPI exports + order dockets into master billing ledger
    const combinedList = [...studioExports, ...syncedFromOrders];
    setBillingList(combinedList);
  }, [orders, currentUser?.email]);

  // Run on mount and whenever orders or user changes
  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  // Auto-refresh billing when Studio writes a print export entry to localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('fivenest_studio_export_billing_')) {
        loadBillingData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadBillingData]);

  // Save billing data whenever billingList is modified by user
  useEffect(() => {
    if (billingList.length > 0) {
      localStorage.setItem(userStorageKey, JSON.stringify(billingList));
    }
  }, [billingList, userStorageKey]);

  // Calculations
  const calculateTotal = (rec: BillingRecord) => rec.qty * rec.rate;
  const calculateFinalTotal = (rec: BillingRecord) => calculateTotal(rec) + rec.designCharges;

  const totalReceived = billingList
    .filter(r => r.status === 'Completed')
    .reduce((sum, r) => sum + calculateFinalTotal(r), 0);

  const totalPending = billingList
    .filter(r => r.status === 'Pending')
    .reduce((sum, r) => sum + calculateFinalTotal(r), 0);

  const totalGrandRevenue = totalReceived + totalPending;

  // Filtered List
  const filteredList = billingList.filter(rec => {
    const matchesSearch = 
      rec.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.whatsapp.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Actions
  const handleAddRecord = () => {
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    const newCode = `FN-26-${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}-${String(billingList.length + 1).padStart(2, '0')}`;

    const newRec: BillingRecord = {
      id: Date.now().toString(),
      orderCode: newCode,
      date: formattedDate,
      customerName: currentUser?.name || 'New Client',
      fileName: 'Sublimation Order',
      whatsapp: '',
      qty: 1,
      rate: 10,
      designCharges: 0,
      status: 'Pending'
    };

    setBillingList([newRec, ...billingList]);
    setEditingRecord(newRec);
  };

  const handleImportCurrentOrder = () => {
    const totalRosterQty = records.reduce((acc, r) => acc + (r.qty || 1), 0);
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    const newCode = `FN-26-${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}-${String(billingList.length + 1).padStart(2, '0')}`;

    const importedRec: BillingRecord = {
      id: Date.now().toString(),
      orderCode: newCode,
      date: formattedDate,
      customerName: metadata?.customerName || currentUser?.name || 'Studio Client',
      fileName: `Order #${metadata?.orderNum || '01'} (${totalRosterQty} pcs)`,
      whatsapp: '',
      qty: totalRosterQty > 0 ? totalRosterQty : 1,
      rate: 15,
      designCharges: 0,
      status: 'Pending'
    };

    setBillingList([importedRec, ...billingList]);
    setEditingRecord(importedRec);
  };

  const handleUpdateRecord = (updated: BillingRecord) => {
    setBillingList(billingList.map(r => r.id === updated.id ? updated : r));
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this billing entry?')) {
      setBillingList(billingList.filter(r => r.id !== id));

      // Persist deleted ID so studio export entries don't reappear on refresh
      const deletedKey = `fivenest_billing_deleted_ids_${(currentUser?.email || 'guest').toLowerCase().trim()}`;
      try {
        const existing = localStorage.getItem(deletedKey);
        const deletedList: string[] = existing ? JSON.parse(existing) : [];
        if (!deletedList.includes(id)) {
          deletedList.push(id);
          localStorage.setItem(deletedKey, JSON.stringify(deletedList));
        }
      } catch (e) {}
    }
  };

  // Professional WhatsApp Message Formatter matching Screenshot 2 exactly
  const handleWhatsAppSend = (rec: BillingRecord) => {
    const printingTotal = calculateTotal(rec);
    const finalTotal = calculateFinalTotal(rec);
    const currentUpi = upiId || 'vilesh332-1@okhdfcbank';

    const upiUrlRaw = `upi://pay?pa=${currentUpi}&pn=FiveNest&am=${finalTotal}&cu=INR`;
    const qrUrl = `https://quickchart.io/qr?size=500&text=${encodeURIComponent(upiUrlRaw)}`;

    const messageText = 
`Hello ${rec.customerName},

Your Design Billing Details :
________________________________________

◆ Order Code : ${rec.orderCode}
◆ Date : ${rec.date}
◆ File Name : ${rec.fileName}
◆ Quantity : ${rec.qty}
◆ Rate : ₹${rec.rate}
◆ Printing Total : ₹${printingTotal}
◆ Design Charges : ₹${rec.designCharges}
________________________________________

◆ Final Total Payment : ₹${finalTotal}

◆ Pay Now :
${upiUrlRaw}

◆ QR Payment :
${qrUrl}

◆ Thank You For Your Order
— FiveNest`;

    const cleanPhone = rec.whatsapp.replace(/\D/g, '');
    const url = cleanPhone 
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  const exportCSV = () => {
    const headers = ['Order Code', 'Date', 'Customer Name', 'File Name', 'Whatsapp', 'Quantity', 'Rate', 'Total', 'Design Charges', 'Final Total', 'Status'];
    const rows = billingList.map(r => [
      r.orderCode,
      r.date,
      `"${r.customerName}"`,
      `"${r.fileName}"`,
      r.whatsapp,
      r.qty,
      r.rate,
      calculateTotal(r),
      r.designCharges,
      calculateFinalTotal(r),
      r.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FiveNest_${currentUser?.name || 'Client'}_Billing_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="billing-system-container fade-in" style={{ padding: '4px' }}>
      
      {/* Account User Badge & UPI Config */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', background: 'rgba(155, 77, 255, 0.08)', border: '1px solid rgba(155, 77, 255, 0.25)', padding: '10px 16px', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>
            Account Billing Ledger: <span style={{ color: 'var(--color-primary)' }}>{currentUser ? `${currentUser.name} (${currentUser.email})` : 'Guest Mode (Local Data)'}</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <QrCode size={13} style={{ color: 'var(--color-success)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>UPI ID:</span>
            <input 
              type="text" 
              value={upiId}
              onChange={(e) => handleUpiChange(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#00e676', fontSize: '11px', fontWeight: 'bold', width: '180px', outline: 'none' }}
              title="Click to edit GPay/UPI VPA ID"
            />
          </div>
        </div>
      </div>

      {/* Top Header Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Completed Received Card */}
        <div className="glass-card" style={{ padding: '20px', background: 'rgba(0, 230, 118, 0.06)', borderColor: 'rgba(0, 230, 118, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-success)' }}>TOTAL PAYMENT RECEIVED</span>
            <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: 'white' }}>
            ₹{totalReceived.toLocaleString('en-IN')}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            From completed client billing records
          </p>
        </div>

        {/* Pending Card */}
        <div className="glass-card" style={{ padding: '20px', background: 'rgba(255, 179, 0, 0.06)', borderColor: 'rgba(255, 179, 0, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffb300' }}>TOTAL PENDING PAYMENT</span>
            <Clock size={20} style={{ color: '#ffb300' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: 'white' }}>
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Awaiting client confirmation
          </p>
        </div>

        {/* Total Grand Revenue */}
        <div className="glass-card" style={{ padding: '20px', background: 'rgba(155, 77, 255, 0.06)', borderColor: 'var(--border-active)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)' }}>TOTAL GRAND REVENUE</span>
            <DollarSign size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: 'white' }}>
            ₹{totalGrandRevenue.toLocaleString('en-IN')}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {billingList.length} total active billing entries
          </p>
        </div>

      </div>

      {/* Toolbar & Controls */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        
        {/* Search & Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search Customer, Code, or File..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px', fontSize: '12px' }}
            />
          </div>

          <select 
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{ width: '140px', fontSize: '12px' }}
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleImportCurrentOrder}
            style={{ fontSize: '12px', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={15} style={{ color: 'var(--color-secondary)' }} />
            Import Current Order ({records.reduce((a, r) => a + (r.qty || 1), 0)} pcs)
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={exportCSV}
            style={{ fontSize: '12px', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} />
            Export CSV
          </button>

          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleAddRecord}
            style={{ fontSize: '12px', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            Add New Entry
          </button>
        </div>

      </div>

      {/* Main Billing Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container" style={{ maxHeight: '580px', overflowY: 'auto' }}>
          <table className="custom-table" style={{ fontSize: '12px', width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Order Code</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Customer Name</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>File Name (.csv Data)</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Whatsapp Contact</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Rate (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Design Chg (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Final Total (₹)</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Billing Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No billing records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredList.map((rec) => {
                  const total = calculateTotal(rec);
                  const finalTotal = calculateFinalTotal(rec);
                  const isEditing = editingRecord?.id === rec.id;

                  return (
                    <tr key={rec.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                      
                      {/* Order Code */}
                      <td style={{ padding: '10px 14px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        {isEditing ? (
                          <input 
                            type="text"
                            className="form-input" 
                            value={editingRecord.orderCode}
                            onChange={(e) => setEditingRecord({ ...editingRecord, orderCode: e.target.value })}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          />
                        ) : rec.orderCode}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <input 
                            type="text"
                            className="form-input" 
                            value={editingRecord.date}
                            onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                            style={{ padding: '4px 8px', fontSize: '11px', width: '90px' }}
                          />
                        ) : rec.date}
                      </td>

                      {/* Customer Name */}
                      <td style={{ padding: '10px 14px', fontWeight: '600' }}>
                        {isEditing ? (
                          <input 
                            type="text"
                            className="form-input" 
                            value={editingRecord.customerName}
                            onChange={(e) => setEditingRecord({ ...editingRecord, customerName: e.target.value })}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          />
                        ) : rec.customerName}
                      </td>

                      {/* File Name */}
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <input 
                            type="text"
                            className="form-input" 
                            value={editingRecord.fileName}
                            onChange={(e) => setEditingRecord({ ...editingRecord, fileName: e.target.value })}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          />
                        ) : rec.fileName}
                      </td>

                      {/* Whatsapp */}
                      <td style={{ padding: '10px 14px' }}>
                        {isEditing ? (
                          <input 
                            type="text"
                            className="form-input" 
                            value={editingRecord.whatsapp}
                            onChange={(e) => setEditingRecord({ ...editingRecord, whatsapp: e.target.value })}
                            style={{ padding: '4px 8px', fontSize: '11px', width: '110px' }}
                            placeholder="Phone No"
                          />
                        ) : (
                          rec.whatsapp ? (
                            <button 
                              type="button" 
                              onClick={() => handleWhatsAppSend(rec)}
                              style={{ 
                                background: 'rgba(0, 230, 118, 0.1)', 
                                border: '1px solid rgba(0, 230, 118, 0.3)', 
                                color: 'var(--color-success)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Send size={11} />
                              {rec.whatsapp}
                            </button>
                          ) : <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 'bold' }}>
                        {isEditing ? (
                          <input 
                            type="number"
                            className="form-input" 
                            value={editingRecord.qty}
                            onChange={(e) => setEditingRecord({ ...editingRecord, qty: Number(e.target.value) })}
                            style={{ padding: '4px 6px', fontSize: '11px', width: '60px', textAlign: 'right' }}
                          />
                        ) : rec.qty}
                      </td>

                      {/* Rate */}
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        {isEditing ? (
                          <input 
                            type="number"
                            className="form-input" 
                            value={editingRecord.rate}
                            onChange={(e) => setEditingRecord({ ...editingRecord, rate: Number(e.target.value) })}
                            style={{ padding: '4px 6px', fontSize: '11px', width: '60px', textAlign: 'right' }}
                          />
                        ) : `₹${rec.rate}`}
                      </td>

                      {/* Total */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600' }}>
                        ₹{total.toLocaleString('en-IN')}
                      </td>

                      {/* Design Charges */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: rec.designCharges > 0 ? 'var(--color-secondary)' : 'inherit' }}>
                        {isEditing ? (
                          <input 
                            type="number"
                            className="form-input" 
                            value={editingRecord.designCharges}
                            onChange={(e) => setEditingRecord({ ...editingRecord, designCharges: Number(e.target.value) })}
                            style={{ padding: '4px 6px', fontSize: '11px', width: '60px', textAlign: 'right' }}
                          />
                        ) : (rec.designCharges > 0 ? `₹${rec.designCharges}` : '0')}
                      </td>

                      {/* Final Total */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '900', color: 'white' }}>
                        ₹{finalTotal.toLocaleString('en-IN')}
                      </td>

                      {/* Status Dropdown */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <select 
                          value={isEditing ? editingRecord.status : rec.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as 'Completed' | 'Pending';
                            if (isEditing) {
                              setEditingRecord({ ...editingRecord, status: newStatus });
                            } else {
                              handleUpdateRecord({ ...rec, status: newStatus });
                            }
                          }}
                          style={{
                            background: (isEditing ? editingRecord.status : rec.status) === 'Completed' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 179, 0, 0.15)',
                            border: (isEditing ? editingRecord.status : rec.status) === 'Completed' ? '1px solid var(--color-success)' : '1px solid #ffb300',
                            color: (isEditing ? editingRecord.status : rec.status) === 'Completed' ? 'var(--color-success)' : '#ffb300',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="Completed" style={{ background: '#111', color: '#00e676' }}>Completed</option>
                          <option value="Pending" style={{ background: '#111', color: '#ffb300' }}>Pending</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {isEditing ? (
                            <button 
                              type="button"
                              className="btn btn-success"
                              onClick={() => {
                                handleUpdateRecord(editingRecord);
                                setEditingRecord(null);
                              }}
                              style={{ padding: '4px 8px', fontSize: '10px' }}
                            >
                              Save
                            </button>
                          ) : (
                            <>
                              {/* Generate Invoice Button */}
                              <button 
                                type="button"
                                onClick={() => setSelectedInvoice(rec)}
                                style={{ 
                                  background: 'rgba(155, 77, 255, 0.1)',
                                  border: '1px solid var(--border-active)',
                                  color: 'var(--color-primary)',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Generate Invoice"
                              >
                                <FileText size={13} />
                                Invoice
                              </button>

                              <button 
                                type="button"
                                onClick={() => setEditingRecord(rec)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px' }}
                                title="Edit Row"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button 
                                type="button"
                                onClick={() => handleDeleteRecord(rec.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '3px' }}
                                title="Delete Row"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🧾 PROFESSIONAL TAX INVOICE & UPI PAY MODAL */}
      {selectedInvoice && (
        <div className="modal-backdrop" style={{
          position: 'fixed', inset: 0,
          background: 'rgba(5, 5, 10, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '16px'
        }} onClick={() => setSelectedInvoice(null)}>
          
          <div className="glass-card fade-in" style={{
            width: '100%', maxWidth: '680px',
            background: '#ffffff',
            color: '#111111',
            borderRadius: '12px',
            padding: '30px',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>

            {/* Close & Print Header Controls */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={15} />
                  Print / Save PDF
                </button>

                <button 
                  type="button" 
                  onClick={() => handleWhatsAppSend(selectedInvoice)}
                  className="btn btn-success"
                  style={{ fontSize: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={15} />
                  Send WhatsApp Bill
                </button>
              </div>

              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Printable Invoice Sheet */}
            <div id="printable-invoice" style={{ fontFamily: 'system-ui, sans-serif' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #9b4dff', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#9b4dff', margin: 0, textTransform: 'uppercase' }}>
                    FiveNest Web Studio
                  </h1>
                  <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0' }}>
                    High-Precision Sublimation & Sportswear Printing Solutions
                  </p>
                  <p style={{ fontSize: '11px', color: '#666', margin: '2px 0 0' }}>
                    GSTIN / Tax ID: 27ABCDE1234F1Z5 | Support: support@fivenest.in
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#333', margin: 0, textTransform: 'uppercase' }}>
                    TAX INVOICE
                  </h2>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#9b4dff', margin: '4px 0 0' }}>
                    #{selectedInvoice.orderCode}
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(0,0,0,0.6)', margin: '2px 0 0' }}>
                    Date: <strong>{selectedInvoice.date}</strong>
                  </p>
                </div>
              </div>

              {/* Bill To & Order Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', background: '#f9f9fc', padding: '14px', borderRadius: '8px', border: '1px solid #eee' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Billed To:</span>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#111', margin: '0 0 2px' }}>{selectedInvoice.customerName}</h3>
                  {selectedInvoice.whatsapp && (
                    <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>Contact: +91 {selectedInvoice.whatsapp}</p>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Order Reference:</span>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#333', margin: '0 0 2px' }}>{selectedInvoice.fileName}</p>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    color: selectedInvoice.status === 'Completed' ? '#00c853' : '#ff9100',
                    background: selectedInvoice.status === 'Completed' ? '#e8f5e9' : '#fff3e0',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    display: 'inline-block'
                  }}>
                    Status: {selectedInvoice.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f0f0f5', borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Description</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Rate (₹)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>Sublimation Apparel Printing</strong><br />
                      <span style={{ fontSize: '11px', color: '#666' }}>{selectedInvoice.fileName}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{selectedInvoice.qty} pcs</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>₹{selectedInvoice.rate.toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>₹{calculateTotal(selectedInvoice).toFixed(2)}</td>
                  </tr>

                  {selectedInvoice.designCharges > 0 && (
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>
                        <strong>Custom Design & Artwork Setup Charges</strong>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>1 job</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>₹{selectedInvoice.designCharges.toFixed(2)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>₹{selectedInvoice.designCharges.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '2px solid #eee', paddingTop: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#666', maxWidth: '300px' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#333' }}>Payment Terms:</p>
                  <p style={{ margin: 0 }}>Payment due upon invoice receipt. Scan UPI QR Code or click Pay Now button to settle balance.</p>
                </div>

                <div style={{ width: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#555' }}>
                    <span>Subtotal:</span>
                    <span>₹{calculateTotal(selectedInvoice).toFixed(2)}</span>
                  </div>
                  {selectedInvoice.designCharges > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#555' }}>
                      <span>Design Fee:</span>
                      <span>₹{selectedInvoice.designCharges.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '15px', fontWeight: '900', color: '#9b4dff', borderTop: '2px solid #9b4dff', marginTop: '6px' }}>
                    <span>Final Total:</span>
                    <span>₹{calculateFinalTotal(selectedInvoice).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* ⚡ Professional UPI Payment & QR Code Section */}
              <div style={{ 
                padding: '16px 20px', 
                background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', 
                borderRadius: '10px', 
                border: '1.5px solid #c4b5fd', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: '20px' 
              }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 'bold', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <QrCode size={16} /> Instant UPI Payment (GPay / PhonePe / Paytm / BHIM)
                  </h4>
                  <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#4b5563', lineHeight: '1.4' }}>
                    Scan QR code with GPay/PhonePe or click below to launch UPI app directly.
                  </p>
                  <div style={{ fontSize: '11px', color: '#1f2937', fontWeight: '600', marginBottom: '10px' }}>
                    UPI ID: <span style={{ color: '#6d28d9', background: '#ffffff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #ddd6fe', fontFamily: 'monospace' }}>{upiId}</span>
                  </div>
                  
                  <a 
                    href={`upi://pay?pa=${upiId}&pn=FiveNest&am=${calculateFinalTotal(selectedInvoice)}&cu=INR`}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontSize: '11px', 
                      padding: '8px 16px', 
                      borderRadius: '6px', 
                      textDecoration: 'none', 
                      background: '#6d28d9', 
                      color: '#ffffff', 
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(109, 40, 217, 0.25)'
                    }}
                  >
                    <DollarSign size={14} /> Pay ₹{calculateFinalTotal(selectedInvoice)} via GPay / PhonePe
                  </a>
                </div>

                <div style={{ textAlign: 'center', background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #c4b5fd', boxShadow: '0 4px 12px rgba(109, 40, 217, 0.12)' }}>
                  <img 
                    src={`https://quickchart.io/qr?size=300&text=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=FiveNest&am=${calculateFinalTotal(selectedInvoice)}&cu=INR`)}`} 
                    alt="UPI Payment QR Code" 
                    style={{ width: '110px', height: '110px', display: 'block' }}
                  />
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#6d28d9', display: 'block', marginTop: '4px' }}>
                    SCAN TO PAY ₹{calculateFinalTotal(selectedInvoice)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '14px', fontSize: '11px', color: '#888' }}>
                Thank you for your business with FiveNest Web Studio! ⚡
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

    </div>
  );
};
