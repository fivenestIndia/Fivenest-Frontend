import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Download, Printer, Send, Trash2, Edit2, CheckCircle, 
  Clock, DollarSign, Search, Sparkles, FileText, X, User, QrCode, ArrowUpRight, RotateCcw
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

/**
 * Derives the unique localStorage key scoped to the individual logged-in user.
 * Each user gets their own completely isolated billing ledger.
 */
export const getBillingStorageKey = (userEmail?: string | null): string => {
  const email = (userEmail || '').trim().toLowerCase();
  if (email) {
    return `fivenest_invoice_bill_records_${email}`;
  }
  try {
    const activeStr = localStorage.getItem('fivenest_active_user');
    if (activeStr) {
      const active = JSON.parse(activeStr);
      if (active?.email) {
        return `fivenest_invoice_bill_records_${active.email.trim().toLowerCase()}`;
      }
    }
  } catch (e) {}
  return 'fivenest_invoice_bill_records_guest';
};

/**
 * Helper to format date with 12-hour AM/PM time (e.g. 21-09-2026, 11:04 PM)
 */
export const formatDateTime = (dateObj: Date = new Date()): string => {
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  const hourStr = String(hours ? hours : 12).padStart(2, '0');
  return `${day}-${month}-${year}, ${hourStr}:${minutes} ${ampm}`;
};

// Default is completely cleared with no dummy records
export const defaultBillingRecords: BillingRecord[] = [];

/**
 * Global helper to automatically record a new entry into the Invoice & Bill ledger
 * scoped strictly to the individual logged-in user ID / email.
 */
export const recordBillingExport = (data: {
  customerName?: string;
  fileName?: string;
  whatsapp?: string;
  qty: number;
  rate?: number;
  designCharges?: number;
  status?: 'Completed' | 'Pending';
}, userEmail?: string | null): BillingRecord => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dateStr = formatDateTime(now);

  const storageKey = getBillingStorageKey(userEmail);
  let currentList: BillingRecord[] = [];
  try {
    const str = localStorage.getItem(storageKey);
    if (str) {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) currentList = parsed;
    }
  } catch (e) {
    console.error('Error reading billing records:', e);
  }

  // Generate sequence number based on current user's count
  const seq = String(currentList.length + 1).padStart(2, '0');
  const orderCode = `FN-26-${day}${month}-${seq}`;

  const newRecord: BillingRecord = {
    id: `FN-EXP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    orderCode,
    date: dateStr,
    customerName: data.customerName?.trim() || 'Deep Textile',
    fileName: data.fileName?.trim() || (data.customerName?.trim() ? `${data.customerName.trim()} - ${data.qty} jerseys` : `Blue Dragon XI (${data.qty} pcs)`),
    whatsapp: data.whatsapp?.trim() || '',
    qty: data.qty > 0 ? data.qty : 1,
    rate: data.rate !== undefined ? data.rate : 5,
    designCharges: data.designCharges !== undefined ? data.designCharges : 0,
    status: data.status || 'Pending'
  };

  const updatedList = [newRecord, ...currentList];
  try {
    localStorage.setItem(storageKey, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Error saving billing records:', e);
  }

  // Notify listeners immediately with user storage key details
  window.dispatchEvent(new CustomEvent('fivenest-billing-updated', { 
    detail: { record: newRecord, storageKey, userEmail: userEmail || 'guest' } 
  }));
  return newRecord;
};

export const BillingSystem: React.FC<BillingSystemProps> = ({ 
  records = [], 
  metadata, 
  currentUser 
}) => {
  const userStorageKey = getBillingStorageKey(currentUser?.email);

  const [billingList, setBillingList] = useState<BillingRecord[]>(() => {
    try {
      // Clear legacy dummy sample records if present
      const oldGlobal = localStorage.getItem('fivenest_invoice_bill_records');
      if (oldGlobal && oldGlobal.includes('rec-1')) {
        localStorage.removeItem('fivenest_invoice_bill_records');
      }

      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out dummy sample rows if any exist from earlier test
          return parsed.filter(r => !r.id.startsWith('rec-'));
        }
      }
    } catch (e) {}
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending'>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<BillingRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<BillingRecord | null>(null);

  // Editable Studio UPI ID
  const [upiId, setUpiId] = useState<string>(() => {
    return localStorage.getItem('fivenest_upi_id') || 'vilesh332-1@okhdfcbank';
  });

  const handleUpiChange = (newVal: string) => {
    setUpiId(newVal);
    localStorage.setItem('fivenest_upi_id', newVal);
  };

  // Reload billing data for the specific active user
  const refreshBillingData = useCallback(() => {
    const activeKey = getBillingStorageKey(currentUser?.email);
    try {
      const saved = localStorage.getItem(activeKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBillingList(parsed.filter(r => !r.id.startsWith('rec-')));
          return;
        }
      }
    } catch (e) {}
    setBillingList([]);
  }, [currentUser?.email]);

  // Sync whenever user changes or custom update event occurs
  useEffect(() => {
    refreshBillingData();
  }, [currentUser?.email, refreshBillingData]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const activeKey = getBillingStorageKey(currentUser?.email);
      if (e.key === activeKey) {
        refreshBillingData();
      }
    };
    const handleCustomUpdate = () => {
      refreshBillingData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('fivenest-billing-updated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('fivenest-billing-updated', handleCustomUpdate);
    };
  }, [currentUser?.email, refreshBillingData]);

  // Save changes to current user's isolated storage
  const saveList = (newList: BillingRecord[]) => {
    setBillingList(newList);
    const activeKey = getBillingStorageKey(currentUser?.email);
    try {
      localStorage.setItem(activeKey, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save billing records:', e);
    }
    window.dispatchEvent(new CustomEvent('fivenest-billing-updated', {
      detail: { records: newList, storageKey: activeKey, userEmail: currentUser?.email || 'guest' }
    }));
  };

  // Clear all billing data for this account
  const handleClearAll = () => {
    const userLabel = currentUser?.email ? currentUser.email : 'Guest';
    if (window.confirm(`Are you sure you want to clear all billing records for [${userLabel}]? This cannot be undone.`)) {
      saveList([]);
    }
  };

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
      (rec.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.orderCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.fileName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.whatsapp || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Actions
  const handleAddRecord = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const formattedDate = formatDateTime(today);
    const newCode = `FN-26-${day}${month}-${String(billingList.length + 1).padStart(2, '0')}`;

    const newRec: BillingRecord = {
      id: `REC-${Date.now()}`,
      orderCode: newCode,
      date: formattedDate,
      customerName: currentUser?.name || 'New Customer',
      fileName: 'Sublimation Order',
      whatsapp: '',
      qty: 1,
      rate: 5,
      designCharges: 0,
      status: 'Pending'
    };

    const updated = [newRec, ...billingList];
    saveList(updated);
    setEditingRecord(newRec);
  };

  const handleImportCurrentOrder = () => {
    const totalRosterQty = records.reduce((acc, r) => acc + (r.qty || 1), 0);
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const formattedDate = formatDateTime(today);
    const newCode = `FN-26-${day}${month}-${String(billingList.length + 1).padStart(2, '0')}`;

    const cleanCust = metadata?.customerName?.trim() || currentUser?.name || 'Deep Textile';
    const cleanFile = metadata?.fileName?.trim() || (metadata?.customerName?.trim() ? `${metadata.customerName.trim()} - ${totalRosterQty || 1} jersey data` : `Blue Dragon XI (${totalRosterQty || 1} pcs)`);

    const importedRec: BillingRecord = {
      id: `REC-${Date.now()}`,
      orderCode: newCode,
      date: formattedDate,
      customerName: cleanCust,
      fileName: cleanFile,
      whatsapp: metadata?.whatsapp?.trim() || '',
      qty: totalRosterQty > 0 ? totalRosterQty : 1,
      rate: 5,
      designCharges: metadata?.designCharges || 0,
      status: 'Pending'
    };

    const updated = [importedRec, ...billingList];
    saveList(updated);
    setEditingRecord(importedRec);
  };

  const handleUpdateRecord = (updated: BillingRecord) => {
    const newList = billingList.map(r => r.id === updated.id ? updated : r);
    saveList(newList);
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this billing entry?')) {
      const newList = billingList.filter(r => r.id !== id);
      saveList(newList);
    }
  };

  // WhatsApp Message Formatter & Direct Payment Link
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
◆ Date & Time : ${rec.date}
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

    const cleanPhone = (rec.whatsapp || '').replace(/\D/g, '');
    const url = cleanPhone 
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  const exportCSV = () => {
    const headers = [
      'Order Code', 
      'Date & Time', 
      'Customer Name', 
      'File Name (.csv Data)', 
      'Whatsapp Contact No', 
      'Quantity', 
      'Rate', 
      'Total', 
      'Whats app Payment Link', 
      'Design Charges', 
      'Final Total', 
      'Billing Status'
    ];
    
    const rows = billingList.map(r => {
      const total = calculateTotal(r);
      const finalTotal = calculateFinalTotal(r);
      const cleanPhone = (r.whatsapp || '').replace(/\D/g, '');
      const waLink = cleanPhone ? `https://wa.me/91${cleanPhone}` : `https://wa.me/`;

      return [
        r.orderCode,
        r.date,
        `"${(r.customerName || '').replace(/"/g, '""')}"`,
        `"${(r.fileName || '').replace(/"/g, '""')}"`,
        `"${r.whatsapp || ''}"`,
        r.qty,
        r.rate,
        total,
        waLink,
        r.designCharges,
        finalTotal,
        r.status
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const userLabel = currentUser?.name ? currentUser.name.replace(/\s+/g, '_') : 'User';
    link.download = `FiveNest_${userLabel}_Billing_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="billing-system-container fade-in" style={{ padding: '8px 4px 40px 4px' }}>
      
      {/* Top Banner: User Ledger & UPI Setup */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        background: '#FFFFFF',
        border: '1px solid #E8E4DE',
        padding: '12px 18px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: currentUser ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #FF6B3D 0%, #E4572E 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            {currentUser ? <User size={17} /> : <FileText size={17} />}
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#171717', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              Invoice & Bill Ledger
              <span style={{ 
                fontSize: '10px', 
                background: currentUser ? '#ECFDF5' : '#F5F3EF', 
                color: currentUser ? '#047857' : '#686661', 
                border: currentUser ? '1px solid #A7F3D0' : '1px solid #D8D5CF', 
                padding: '2px 8px', 
                borderRadius: '6px', 
                fontWeight: '800' 
              }}>
                {currentUser ? `User: ${currentUser.email}` : 'Guest Mode (Local Storage)'}
              </span>
            </h2>
            <p style={{ fontSize: '11px', color: '#787672', margin: '2px 0 0' }}>
              {currentUser 
                ? `All data saved under individual login user ID: ${currentUser.email}` 
                : 'Sign in to automatically sync and isolate your billing ledger to your personal account.'}
            </p>
          </div>
        </div>

        {/* UPI ID Field */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#F9FAFB',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <QrCode size={14} style={{ color: '#059669' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#4B5563' }}>UPI ID:</span>
            <input 
              type="text" 
              value={upiId}
              onChange={(e) => handleUpiChange(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#059669',
                fontSize: '12px',
                fontWeight: '800',
                width: '180px',
                outline: 'none',
                fontFamily: 'monospace'
              }}
              title="Click to edit UPI ID for WhatsApp payment links"
            />
          </div>
        </div>
      </div>

      {/* Top 3 Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        
        {/* Total Payment Received Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          borderLeft: '4px solid #10B981'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Total Payment Received
            </span>
            <CheckCircle size={18} style={{ color: '#10B981' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>
            ₹{totalReceived.toLocaleString('en-IN')}
          </div>
          <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', margin: 0 }}>
            Completed billing entries
          </p>
        </div>

        {/* Total Pending Payment Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          borderLeft: '4px solid #F59E0B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#D97706', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Total Pending Payment
            </span>
            <Clock size={18} style={{ color: '#F59E0B' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', margin: 0 }}>
            Awaiting client confirmation
          </p>
        </div>

        {/* Total Grand Revenue Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          borderLeft: '4px solid #E4572E'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#E4572E', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Total Grand Revenue
            </span>
            <DollarSign size={18} style={{ color: '#E4572E' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>
            ₹{totalGrandRevenue.toLocaleString('en-IN')}
          </div>
          <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', margin: 0 }}>
            {billingList.length} total active records
          </p>
        </div>

      </div>

      {/* Toolbar & Filters */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E8E4DE',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Search & Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search Customer, Order Code, File Name, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: '36px',
                fontSize: '12px',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                width: '100%',
                background: '#FFFFFF',
                color: '#111827'
              }}
            />
          </div>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              width: '130px',
              fontSize: '12px',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              padding: '0 10px',
              background: '#FFFFFF',
              color: '#374151',
              fontWeight: '600',
              cursor: 'pointer'
            }}
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
            onClick={handleImportCurrentOrder}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '700',
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#F5F3EF',
              border: '1px solid #D8D5CF',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Import active Step 2 order into billing"
          >
            <Sparkles size={14} style={{ color: '#E4572E' }} />
            Import Current Job ({records.reduce((a, r) => a + (r.qty || 1), 0)} pcs)
          </button>

          <button 
            type="button" 
            onClick={exportCSV}
            disabled={billingList.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '700',
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              color: billingList.length === 0 ? '#9CA3AF' : '#374151',
              cursor: billingList.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={14} />
            Export CSV
          </button>

          <button 
            type="button" 
            onClick={handleAddRecord}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '800',
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#E4572E',
              border: '1px solid #E4572E',
              color: '#FFFFFF',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(228,87,46,0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={15} />
            Add New Entry
          </button>

          {billingList.length > 0 && (
            <button 
              type="button" 
              onClick={handleClearAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: '700',
                padding: '8px 12px',
                borderRadius: '8px',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#DC2626',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Clear all billing data for this account"
            >
              <Trash2 size={13} />
              Clear All
            </button>
          )}
        </div>

      </div>

      {/* Main Billing Table matching User Excel Format */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E8E4DE',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ overflowX: 'auto', maxHeight: '620px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1100px' }}>
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#111827' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>Order Code</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>Date & Time</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>Coustomer Name</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>File Name (.csv Data)</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>Whatsapp Contact No</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>Quantity</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>Rate</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>Total</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800' }}>Whats app Payment Link</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>Design Charges</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>Final Total</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800' }}>Billing Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '50px 20px', color: '#9CA3AF' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <FileText size={36} style={{ color: '#D1D5DB' }} />
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#4B5563' }}>
                        No billing records found for this account.
                      </div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', maxWidth: '420px', lineHeight: '1.5' }}>
                        Whenever you export in <strong>Step 3: Export</strong>, a new entry will automatically appear here. You can also click <strong>"+ Add New Entry"</strong> or <strong>"Import Current Job"</strong>.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((rec, idx) => {
                  const total = calculateTotal(rec);
                  const finalTotal = calculateFinalTotal(rec);
                  const isEditing = editingRecord?.id === rec.id;
                  const isEven = idx % 2 === 0;

                  return (
                    <tr 
                      key={rec.id} 
                      style={{ 
                        borderBottom: '1px solid #F1F5F9',
                        background: isEditing ? '#FFFBF7' : (isEven ? '#FFFFFF' : '#FAFAFA'),
                        transition: 'background 0.15s ease'
                      }}
                    >
                      
                      {/* 1. Order Code */}
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: '#E4572E', whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editingRecord.orderCode}
                            onChange={(e) => setEditingRecord({ ...editingRecord, orderCode: e.target.value })}
                            style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '120px' }}
                          />
                        ) : rec.orderCode}
                      </td>

                      {/* 2. Date & Time */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#374151' }}>
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editingRecord.date}
                            onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                            style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '160px' }}
                          />
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={12} style={{ color: '#9CA3AF' }} />
                            {rec.date}
                          </span>
                        )}
                      </td>

                      {/* 3. Customer Name */}
                      <td style={{ padding: '10px 14px', fontWeight: '600', color: '#111827' }}>
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editingRecord.customerName}
                            onChange={(e) => setEditingRecord({ ...editingRecord, customerName: e.target.value })}
                            style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '130px' }}
                          />
                        ) : rec.customerName}
                      </td>

                      {/* 4. File Name (.csv Data) */}
                      <td style={{ padding: '10px 14px', color: '#4B5563', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editingRecord.fileName}
                            onChange={(e) => setEditingRecord({ ...editingRecord, fileName: e.target.value })}
                            style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '170px' }}
                          />
                        ) : rec.fileName}
                      </td>

                      {/* 5. Whatsapp Contact No */}
                      <td style={{ padding: '10px 14px', color: '#374151', whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <input 
                            type="text"
                            value={editingRecord.whatsapp}
                            onChange={(e) => setEditingRecord({ ...editingRecord, whatsapp: e.target.value })}
                            style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '110px' }}
                            placeholder="Phone No"
                          />
                        ) : (rec.whatsapp || '-')}
                      </td>

                      {/* 6. Quantity */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>
                        {isEditing ? (
                          <input 
                            type="number"
                            value={editingRecord.qty}
                            onChange={(e) => setEditingRecord({ ...editingRecord, qty: Number(e.target.value) })}
                            style={{ padding: '4px 6px', fontSize: '11px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '60px', textAlign: 'right' }}
                          />
                        ) : rec.qty}
                      </td>

                      {/* 7. Rate */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#374151' }}>
                        {isEditing ? (
                          <input 
                            type="number"
                            value={editingRecord.rate}
                            onChange={(e) => setEditingRecord({ ...editingRecord, rate: Number(e.target.value) })}
                            style={{ padding: '4px 6px', fontSize: '11px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '60px', textAlign: 'right' }}
                          />
                        ) : rec.rate}
                      </td>

                      {/* 8. Total */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600', color: '#111827' }}>
                        {total}
                      </td>

                      {/* 9. Whats app Payment Link */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => handleWhatsAppSend(rec)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563EB',
                            textDecoration: 'underline',
                            fontWeight: '600',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: 0
                          }}
                          title="Click to send WhatsApp payment request with UPI link"
                        >
                          Send Payment Link
                          <ArrowUpRight size={12} style={{ color: '#2563EB' }} />
                        </button>
                      </td>

                      {/* 10. Design Charges */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: rec.designCharges > 0 ? '#C2410C' : '#6B7280' }}>
                        {isEditing ? (
                          <input 
                            type="number"
                            value={editingRecord.designCharges}
                            onChange={(e) => setEditingRecord({ ...editingRecord, designCharges: Number(e.target.value) })}
                            style={{ padding: '4px 6px', fontSize: '11px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '60px', textAlign: 'right' }}
                          />
                        ) : rec.designCharges}
                      </td>

                      {/* 11. Final Total */}
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', color: '#111827' }}>
                        {finalTotal}
                      </td>

                      {/* 12. Billing Status Dropdown */}
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
                            background: (isEditing ? editingRecord.status : rec.status) === 'Completed' ? '#ECFDF5' : '#FFFBEB',
                            border: (isEditing ? editingRecord.status : rec.status) === 'Completed' ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                            color: (isEditing ? editingRecord.status : rec.status) === 'Completed' ? '#047857' : '#B45309',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="Completed">Completed</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </td>

                      {/* 13. Actions */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {isEditing ? (
                            <button 
                              type="button" 
                              onClick={() => {
                                handleUpdateRecord(editingRecord);
                                setEditingRecord(null);
                              }}
                              style={{
                                background: '#10B981',
                                border: 'none',
                                color: '#FFFFFF',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Save
                            </button>
                          ) : (
                            <>
                              {/* Invoice Modal Button */}
                              <button 
                                type="button" 
                                onClick={() => setSelectedInvoice(rec)}
                                style={{
                                  background: '#F5F3EF',
                                  border: '1px solid #D8D5CF',
                                  color: '#374151',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="View & Print Tax Invoice"
                              >
                                <FileText size={12} />
                                Invoice
                              </button>

                              <button 
                                type="button" 
                                onClick={() => setEditingRecord(rec)}
                                style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '4px' }}
                                title="Edit Row"
                              >
                                <Edit2 size={13} />
                              </button>

                              <button 
                                type="button" 
                                onClick={() => handleDeleteRecord(rec.id)}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                                title="Delete Row"
                              >
                                <Trash2 size={13} />
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

      {/* 🧾 TAX INVOICE & UPI PAY MODAL */}
      {selectedInvoice && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setSelectedInvoice(null)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '680px',
              background: '#FFFFFF',
              color: '#111827',
              borderRadius: '16px',
              padding: '28px 32px',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E5E7EB', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => window.print()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#E4572E',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={15} />
                  Print / Save PDF
                </button>

                <button 
                  type="button" 
                  onClick={() => handleWhatsAppSend(selectedInvoice)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={15} />
                  Send WhatsApp Bill
                </button>
              </div>

              <button 
                onClick={() => setSelectedInvoice(null)} 
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Printable Invoice Sheet */}
            <div id="printable-invoice" style={{ fontFamily: 'system-ui, sans-serif' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E4572E', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#E4572E', margin: 0, textTransform: 'uppercase' }}>
                    FiveNest Web Studio
                  </h1>
                  <p style={{ fontSize: '11px', color: '#6B7280', margin: '4px 0 0' }}>
                    Precision Sublimation & Sportswear Printing Solutions
                  </p>
                  <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0' }}>
                    GSTIN / Tax ID: 27ABCDE1234F1Z5 | Support: support@fivenest.in
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0, textTransform: 'uppercase' }}>
                    TAX INVOICE
                  </h2>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: '#E4572E', margin: '4px 0 0' }}>
                    #{selectedInvoice.orderCode}
                  </p>
                  <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0' }}>
                    Date & Time: <strong>{selectedInvoice.date}</strong>
                  </p>
                </div>
              </div>

              {/* Bill To & Reference */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Billed To:</span>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: '0 0 2px' }}>{selectedInvoice.customerName}</h3>
                  {selectedInvoice.whatsapp && (
                    <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>Contact: +91 {selectedInvoice.whatsapp}</p>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Order Reference:</span>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#334155', margin: '0 0 4px' }}>{selectedInvoice.fileName}</p>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    color: selectedInvoice.status === 'Completed' ? '#047857' : '#B45309',
                    background: selectedInvoice.status === 'Completed' ? '#ECFDF5' : '#FFFBEB',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    display: 'inline-block'
                  }}>
                    Status: {selectedInvoice.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>Description</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800' }}>Qty</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800' }}>Rate (₹)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>Sublimation Apparel Printing</strong><br />
                      <span style={{ fontSize: '11px', color: '#64748B' }}>{selectedInvoice.fileName}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700' }}>{selectedInvoice.qty} pcs</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>₹{selectedInvoice.rate.toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{calculateTotal(selectedInvoice).toFixed(2)}</td>
                  </tr>

                  {selectedInvoice.designCharges > 0 && (
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px' }}>
                        <strong>Custom Design & Artwork Setup Charges</strong>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>1 job</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>₹{selectedInvoice.designCharges.toFixed(2)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{selectedInvoice.designCharges.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '2px solid #E2E8F0', paddingTop: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', maxWidth: '300px' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#334155' }}>Payment Terms:</p>
                  <p style={{ margin: 0 }}>Payment due upon invoice receipt. Scan UPI QR Code or click Pay Now button to settle balance.</p>
                </div>

                <div style={{ width: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#64748B' }}>
                    <span>Subtotal:</span>
                    <span>₹{calculateTotal(selectedInvoice).toFixed(2)}</span>
                  </div>
                  {selectedInvoice.designCharges > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#64748B' }}>
                      <span>Design Fee:</span>
                      <span>₹{selectedInvoice.designCharges.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '15px', fontWeight: '900', color: '#E4572E', borderTop: '2px solid #E4572E', marginTop: '6px' }}>
                    <span>Final Total:</span>
                    <span>₹{calculateFinalTotal(selectedInvoice).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* UPI QR Payment Block */}
              <div style={{ 
                padding: '16px 20px', 
                background: '#F8FAFC', 
                borderRadius: '10px', 
                border: '1.5px solid #CBD5E1', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: '20px' 
              }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <QrCode size={16} style={{ color: '#059669' }} /> Instant UPI Payment (GPay / PhonePe / Paytm / BHIM)
                  </h4>
                  <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#64748B', lineHeight: '1.4' }}>
                    Scan QR code with any UPI app or click below to launch payment.
                  </p>
                  <div style={{ fontSize: '11px', color: '#1E293B', fontWeight: '700', marginBottom: '10px' }}>
                    UPI ID: <span style={{ color: '#059669', background: '#FFFFFF', padding: '3px 8px', borderRadius: '4px', border: '1px solid #D1D5DB', fontFamily: 'monospace' }}>{upiId}</span>
                  </div>
                  
                  <a 
                    href={`upi://pay?pa=${upiId}&pn=FiveNest&am=${calculateFinalTotal(selectedInvoice)}&cu=INR`}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontSize: '11px', 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      textDecoration: 'none', 
                      background: '#059669', 
                      color: '#FFFFFF', 
                      fontWeight: '800',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    <DollarSign size={14} /> Pay ₹{calculateFinalTotal(selectedInvoice)} via GPay / PhonePe
                  </a>
                </div>

                <div style={{ textAlign: 'center', background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <img 
                    src={`https://quickchart.io/qr?size=300&text=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=FiveNest&am=${calculateFinalTotal(selectedInvoice)}&cu=INR`)}`} 
                    alt="UPI Payment QR Code" 
                    style={{ width: '105px', height: '105px', display: 'block' }}
                  />
                  <span style={{ fontSize: '9px', fontWeight: '800', color: '#059669', display: 'block', marginTop: '4px' }}>
                    SCAN TO PAY ₹{calculateFinalTotal(selectedInvoice)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '14px', fontSize: '11px', color: '#9CA3AF' }}>
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
