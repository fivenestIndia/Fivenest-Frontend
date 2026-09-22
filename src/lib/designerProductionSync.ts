// ─── Production Billing & Designer Bills Synchronization Bridge ────────────────
// Connects the Order Page's Designer Tab with https://www.fivenest.in/production
// (Invoice & Bills). Supports live two-way sync, shared customer matching, and real-time events.
// ─────────────────────────────────────────────────────────────────────────────

import { Customer, DesignerBill, DesignerBillItem, OrderStore } from '../hooks/useOrderStore';
import {
  BillingRecord,
  getBillingStorageKey,
  formatDateTime
} from '../components/studio/billingSystem';

/**
 * Safely parse date strings from production records (e.g. "22-09-2026, 11:04 PM" or ISO) into "YYYY-MM-DD"
 */
export function parseBillingDate(dStr?: string): string {
  if (!dStr) return new Date().toISOString().slice(0, 10);
  // YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(dStr)) return dStr.slice(0, 10);
  // DD-MM-YYYY format
  const match = dStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (match) {
    const [, day, month, yr] = match;
    return `${yr}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const parsed = new Date(dStr);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

/**
 * Add days to a YYYY-MM-DD date string
 */
function addDays(dStr: string, days: number): string {
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return dStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Retrieve all billing records from Production (active user, guest, and any custom user storage keys)
 */
export function getAllProductionBillingRecords(): BillingRecord[] {
  const recordsMap = new Map<string, BillingRecord>();

  // 1. Try active user key
  try {
    const activeKey = getBillingStorageKey();
    const str = localStorage.getItem(activeKey);
    if (str) {
      const arr = JSON.parse(str);
      if (Array.isArray(arr)) {
        arr.filter(r => r && r.id && !r.id.startsWith('rec-')).forEach(r => recordsMap.set(r.id, r));
      }
    }
  } catch (e) {
    console.error('Error loading active user billing records:', e);
  }

  // 2. Try guest key
  try {
    const guestKey = 'fivenest_invoice_bill_records_guest';
    const str = localStorage.getItem(guestKey);
    if (str) {
      const arr = JSON.parse(str);
      if (Array.isArray(arr)) {
        arr.filter(r => r && r.id && !r.id.startsWith('rec-')).forEach(r => {
          if (!recordsMap.has(r.id)) recordsMap.set(r.id, r);
        });
      }
    }
  } catch (e) {}

  // 3. Scan all keys in localStorage starting with fivenest_invoice_bill_records_
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fivenest_invoice_bill_records_')) {
        const str = localStorage.getItem(key);
        if (str) {
          const arr = JSON.parse(str);
          if (Array.isArray(arr)) {
            arr.filter(r => r && r.id && !r.id.startsWith('rec-')).forEach(r => {
              if (!recordsMap.has(r.id)) recordsMap.set(r.id, r);
            });
          }
        }
      }
    }
  } catch (e) {}

  return Array.from(recordsMap.values());
}

/**
 * Synchronize production billing records into the central OrderStore.
 * - Extracts and creates customers for any unknown parties.
 * - Maps BillingRecords to DesignerBills.
 * - Reflects existing payment allocations.
 */
export function syncProductionBillingToStore(state: OrderStore): OrderStore {
  const prodRecords = getAllProductionBillingRecords();
  if (!prodRecords || prodRecords.length === 0) {
    // If no production records exist, designerBills should be clean/empty
    return {
      ...state,
      designerBills: [],
    };
  }

  const updatedCustomers = [...state.customers];

  // Helper to find or create customer
  const getOrCreateCustomer = (customerName?: string, whatsapp?: string): Customer => {
    const rawName = (customerName || '').trim();
    const cleanName = rawName || 'Direct Customer';
    const cleanPhone = (whatsapp || '').trim();

    // Try finding by businessName or name
    let found = updatedCustomers.find(
      c => c.businessName.toLowerCase() === cleanName.toLowerCase() ||
           c.name.toLowerCase() === cleanName.toLowerCase()
    );

    // Try finding by phone if available
    if (!found && cleanPhone) {
      found = updatedCustomers.find(c => c.phone === cleanPhone || c.whatsapp === cleanPhone);
    }

    if (found) return found;

    // Create new customer
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) || 'party';
    const newCust: Customer = {
      id: `cust-prod-${slug}-${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      businessName: cleanName,
      phone: cleanPhone,
      whatsapp: cleanPhone,
      email: '',
      gstin: '',
      billingAddress: '',
      shippingAddress: '',
      state: '',
      customerType: 'direct',
      openingBalance: 0,
      openingBalanceDate: new Date().toISOString().slice(0, 10),
      notes: 'Customer linked from Production Studio (Invoice & Bills)',
      createdAt: new Date().toISOString(),
    };

    updatedCustomers.push(newCust);
    return newCust;
  };

  // Convert each BillingRecord to DesignerBill
  const syncedBills: DesignerBill[] = prodRecords.map(rec => {
    const cust = getOrCreateCustomer(rec.customerName, rec.whatsapp);
    const dateStr = parseBillingDate(rec.date);
    const dueDateStr = addDays(dateStr, 15);

    const printingAmt = (rec.qty || 1) * (rec.rate || 0);
    const designAmt = rec.designCharges || 0;
    const grandTotal = printingAmt + designAmt;

    const items: DesignerBillItem[] = [
      {
        id: `${rec.id}-item-print`,
        type: 'design',
        description: `${rec.fileName || 'Jersey Processing & Export'} (${rec.qty || 1} pcs @ ₹${rec.rate || 0})`,
        amount: printingAmt,
      },
    ];

    if (designAmt > 0) {
      items.push({
        id: `${rec.id}-item-design`,
        type: 'design',
        description: 'Design & Artwork Customization Charges',
        amount: designAmt,
      });
    }

    // Check payment allocations from payments recorded in Order Management
    const allocatedPaid = state.payments.reduce((sum, p) => {
      const match = p.allocations.find(a => (a.orderId === rec.id || a.orderId === rec.orderCode) && a.orderType === 'designer');
      return sum + (match ? match.amount : 0);
    }, 0);

    const basePaid = rec.status === 'Completed' ? grandTotal : (rec.advance || 0);
    const totalPaid = Math.min(grandTotal, Math.max(basePaid, allocatedPaid));
    const outstanding = Math.max(0, grandTotal - totalPaid);

    const isPaid = totalPaid >= grandTotal && grandTotal > 0;
    const isPartial = totalPaid > 0 && totalPaid < grandTotal;

    const paymentStatus: DesignerBill['paymentStatus'] = isPaid ? 'paid' : isPartial ? 'partial' : 'unpaid';
    const status: DesignerBill['status'] = rec.status === 'Cancelled' ? 'cancelled' : isPaid ? 'paid' : isPartial ? 'partial' : 'sent';

    return {
      id: rec.id,
      billNumber: rec.orderCode || `DSG-${rec.id.slice(-6)}`,
      customerId: cust.id,
      productionJobId: rec.orderCode,
      date: dateStr,
      dueDate: dueDateStr,
      status,
      paymentStatus,
      items,
      discount: 0,
      gstPct: 0,
      gstAmount: 0,
      grandTotal,
      totalPaid,
      outstanding,
      notes: rec.fileName ? `Production File: ${rec.fileName}` : 'Generated from Production Studio',
      createdAt: new Date(dateStr).toISOString(),
    };
  });

  return {
    ...state,
    customers: updatedCustomers,
    designerBills: syncedBills,
  };
}

/**
 * Save or update a DesignerBill in Production's Invoice & Bill storage
 */
export function saveDesignerBillToProduction(bill: DesignerBill, customer?: Customer): void {
  try {
    const activeKey = getBillingStorageKey();
    let currentList: BillingRecord[] = [];
    const str = localStorage.getItem(activeKey);
    if (str) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) currentList = parsed;
      } catch {}
    }

    const printItem = bill.items[0];
    const designItem = bill.items.find(i => i !== printItem);

    const updatedRecord: BillingRecord = {
      id: bill.id,
      orderCode: bill.billNumber || bill.productionJobId || `FN-DSG-${Date.now().toString().slice(-4)}`,
      date: formatDateTime(new Date(bill.date || Date.now())),
      customerName: customer?.businessName || customer?.name || 'Direct Customer',
      fileName: printItem?.description || 'Custom Jersey Design',
      whatsapp: customer?.whatsapp || customer?.phone || '',
      qty: 1,
      rate: printItem?.amount || bill.grandTotal,
      designCharges: designItem?.amount || 0,
      status: bill.paymentStatus === 'paid' ? 'Completed' : 'Pending',
      advance: bill.totalPaid || 0,
    };

    const idx = currentList.findIndex(r => r.id === bill.id || r.orderCode === bill.billNumber);
    if (idx >= 0) {
      currentList[idx] = updatedRecord;
    } else {
      currentList = [updatedRecord, ...currentList];
    }

    localStorage.setItem(activeKey, JSON.stringify(currentList));
    window.dispatchEvent(new CustomEvent('fivenest-billing-updated', {
      detail: { record: updatedRecord, storageKey: activeKey }
    }));
  } catch (e) {
    console.error('Error saving designer bill to production:', e);
  }
}

/**
 * Remove a DesignerBill from all Production storage keys
 */
export function deleteDesignerBillFromProduction(billIdOrNumber: string): void {
  try {
    const keysToCheck = [getBillingStorageKey(), 'fivenest_invoice_bill_records_guest'];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fivenest_invoice_bill_records_') && !keysToCheck.includes(key)) {
        keysToCheck.push(key);
      }
    }

    for (const k of keysToCheck) {
      const str = localStorage.getItem(k);
      if (str) {
        try {
          const arr = JSON.parse(str);
          if (Array.isArray(arr)) {
            const filtered = arr.filter(
              (r: BillingRecord) => r.id !== billIdOrNumber && r.orderCode !== billIdOrNumber
            );
            if (filtered.length !== arr.length) {
              localStorage.setItem(k, JSON.stringify(filtered));
            }
          }
        } catch {}
      }
    }

    window.dispatchEvent(new CustomEvent('fivenest-billing-updated', {
      detail: { deletedId: billIdOrNumber }
    }));
  } catch (e) {
    console.error('Error deleting bill from production:', e);
  }
}

/**
 * Update payment status / advance in Production storage when received in Order Management
 */
export function updateProductionBillingPayment(
  billIdOrNumber: string,
  paidAmount: number,
  isFullyPaid: boolean
): void {
  try {
    const keysToCheck = [getBillingStorageKey(), 'fivenest_invoice_bill_records_guest'];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fivenest_invoice_bill_records_') && !keysToCheck.includes(key)) {
        keysToCheck.push(key);
      }
    }

    for (const k of keysToCheck) {
      const str = localStorage.getItem(k);
      if (str) {
        try {
          const arr = JSON.parse(str);
          if (Array.isArray(arr)) {
            let modified = false;
            const updated = arr.map((r: BillingRecord) => {
              if (r.id === billIdOrNumber || r.orderCode === billIdOrNumber) {
                modified = true;
                return {
                  ...r,
                  status: isFullyPaid ? ('Completed' as const) : r.status,
                  advance: paidAmount,
                };
              }
              return r;
            });
            if (modified) {
              localStorage.setItem(k, JSON.stringify(updated));
            }
          }
        } catch {}
      }
    }

    window.dispatchEvent(new CustomEvent('fivenest-billing-updated', {
      detail: { updatedId: billIdOrNumber, paidAmount, isFullyPaid }
    }));
  } catch (e) {
    console.error('Error updating production billing payment:', e);
  }
}
