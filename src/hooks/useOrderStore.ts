// ─── Orders & Bills Management — Central Data Store ────────────────────────────
// Uses useReducer + localStorage for persistence.
// All types, actions, selectors, and derived calculations live here.
// ─────────────────────────────────────────────────────────────────────────────

import { useReducer, useEffect, useCallback } from 'react';

// ─────────────── TYPES ───────────────────────────────────────────────────────

export type BusinessType = 'manufacturer' | 'designer' | 'printing';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';
export type PaymentMode = 'cash' | 'upi' | 'bank' | 'card' | 'cheque' | 'other';

// ── Customer ──────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  whatsapp: string;
  email: string;
  gstin: string;
  billingAddress: string;
  shippingAddress: string;
  state: string;
  customerType: 'retailer' | 'wholesaler' | 'direct';
  openingBalance: number; // positive = they owe us
  openingBalanceDate: string;
  notes: string;
  createdAt: string;
}

// ── Order Item ────────────────────────────────────────────────────────────────
export interface OrderItem {
  id: string;
  product: string;
  category: string;
  sku: string;
  sizes: Record<string, number>; // { XS: 10, S: 25, M: 40 }
  totalQty: number;
  rate: number;
  discount: number;
  taxPct: number;
  amount: number;
}

// ── Manufacturer Order ────────────────────────────────────────────────────────
export type MfgOrderStatus = 'draft' | 'confirmed' | 'production' | 'ready' | 'dispatched' | 'completed' | 'cancelled';

export interface ManufacturerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: string;
  deliveryDate: string;
  dueDate: string;
  priority: 'normal' | 'urgent' | 'express';
  status: MfgOrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  // Custom jersey fields
  teamName: string;
  tournamentName: string;
  playerNames: string;
  playerNumbers: string;
  sponsor: string;
  collarType: string;
  sleeveType: string;
  fabric: string;
  jerseyType: string;
  shortsRequired: boolean;
  sublimation: boolean;
  embroidery: boolean;
  printing: boolean;
  packaging: boolean;
  specialInstructions: string;
  referenceDesign: string;
  // Pricing
  itemsTotal: number;
  printingCharges: number;
  packagingCharges: number;
  additionalCharges: number;
  discount: number;
  gstPct: number;
  gstAmount: number;
  shipping: number;
  roundOff: number;
  grandTotal: number;
  // Payment
  totalPaid: number;
  outstanding: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ── Designer Bill ─────────────────────────────────────────────────────────────
export interface DesignerBillItem {
  id: string;
  type: 'design' | 'revision' | 'urgent' | 'mockup' | 'logo' | 'pattern' | 'source_file' | 'other';
  description: string;
  amount: number;
}

export type DesignerBillStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface DesignerBill {
  id: string;
  billNumber: string;
  customerId: string;
  productionJobId: string;
  date: string;
  dueDate: string;
  status: DesignerBillStatus;
  paymentStatus: PaymentStatus;
  items: DesignerBillItem[];
  discount: number;
  gstPct: number;
  gstAmount: number;
  grandTotal: number;
  totalPaid: number;
  outstanding: number;
  notes: string;
  createdAt: string;
}

// ── Printing Service (Rate Card) ──────────────────────────────────────────────
export interface PriceSlab {
  minQty: number;
  maxQty: number | null;
  rate: number;
}

export interface CustomerRate {
  customerId: string;
  rate: number;
}

export type PricingMethod = 'per_piece' | 'per_meter' | 'per_sqft' | 'per_sqinch' | 'per_design' | 'per_job';

export interface PrintingService {
  id: string;
  name: string;
  pricingMethod: PricingMethod;
  baseRate: number;
  slabs: PriceSlab[];
  minQuantity: number;
  minCharge: number;
  rushCharge: number;
  setupCharge: number;
  gstPct: number;
  active: boolean;
  customerRates: CustomerRate[];
}

// ── Printing Order ────────────────────────────────────────────────────────────
export type PrintingOrderStatus = 'quotation' | 'received' | 'artwork_pending' | 'artwork_approved' | 'queue' | 'printing' | 'quality_check' | 'ready' | 'delivered' | 'cancelled';

export interface PrintingOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  serviceId: string;
  date: string;
  requiredDate: string;
  deliveryDate: string;
  status: PrintingOrderStatus;
  paymentStatus: PaymentStatus;
  quantity: number;
  appliedRate: number;
  material: string;
  fabric: string;
  color: string;
  printArea: string;
  artworkFile: string;
  artworkApproved: boolean;
  specialInstructions: string;
  subtotal: number;
  additionalCharges: number;
  discount: number;
  gstPct: number;
  gstAmount: number;
  grandTotal: number;
  totalPaid: number;
  outstanding: number;
  notes: string;
  createdAt: string;
}

// ── Payment ───────────────────────────────────────────────────────────────────
export interface PaymentAllocation {
  orderId: string;
  orderType: BusinessType;
  amount: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  date: string;
  amount: number;
  mode: PaymentMode;
  referenceNumber: string;
  notes: string;
  receivedBy: string;
  allocations: PaymentAllocation[];
  createdAt: string;
}

// ── Quotation ─────────────────────────────────────────────────────────────────
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  date: string;
  validUntil: string;
  businessType: BusinessType;
  items: OrderItem[];
  discount: number;
  gstPct: number;
  gstAmount: number;
  grandTotal: number;
  status: QuotationStatus;
  convertedToOrderId: string;
  notes: string;
  terms: string;
  createdAt: string;
}

// ── Ledger Entry (derived) ────────────────────────────────────────────────────
export interface LedgerEntry {
  id: string;
  date: string;
  customerId: string;
  description: string;
  category: BusinessType | 'payment' | 'opening' | 'adjustment';
  transactionType: 'debit' | 'credit';
  amount: number;
  referenceId: string;
  referenceNumber: string;
  balance: number; // running balance per customer (computed)
}

// ── Store State ───────────────────────────────────────────────────────────────
export interface OrderStore {
  customers: Customer[];
  manufacturerOrders: ManufacturerOrder[];
  designerBills: DesignerBill[];
  printingOrders: PrintingOrder[];
  printingServices: PrintingService[];
  payments: Payment[];
  quotations: Quotation[];
  // counters for auto-numbering
  counters: {
    mfg: number;
    dsg: number;
    prt: number;
    pay: number;
    quo: number;
  };
}

// ─────────────── ACTIONS ─────────────────────────────────────────────────────

export type Action =
  // Customers
  | { type: 'ADD_CUSTOMER'; payload: Omit<Customer, 'id' | 'createdAt'> }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  // Manufacturer Orders
  | { type: 'ADD_MFG_ORDER'; payload: Omit<ManufacturerOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_MFG_ORDER'; payload: ManufacturerOrder }
  | { type: 'DELETE_MFG_ORDER'; payload: string }
  // Designer Bills
  | { type: 'ADD_DESIGNER_BILL'; payload: Omit<DesignerBill, 'id' | 'billNumber' | 'createdAt'> }
  | { type: 'UPDATE_DESIGNER_BILL'; payload: DesignerBill }
  | { type: 'DELETE_DESIGNER_BILL'; payload: string }
  // Printing Services
  | { type: 'ADD_PRINTING_SERVICE'; payload: Omit<PrintingService, 'id'> }
  | { type: 'UPDATE_PRINTING_SERVICE'; payload: PrintingService }
  | { type: 'DELETE_PRINTING_SERVICE'; payload: string }
  // Printing Orders
  | { type: 'ADD_PRINTING_ORDER'; payload: Omit<PrintingOrder, 'id' | 'orderNumber' | 'createdAt'> }
  | { type: 'UPDATE_PRINTING_ORDER'; payload: PrintingOrder }
  | { type: 'DELETE_PRINTING_ORDER'; payload: string }
  // Payments
  | { type: 'ADD_PAYMENT'; payload: Omit<Payment, 'id' | 'paymentNumber' | 'createdAt'> }
  | { type: 'DELETE_PAYMENT'; payload: string }
  // Quotations
  | { type: 'ADD_QUOTATION'; payload: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'> }
  | { type: 'UPDATE_QUOTATION'; payload: Quotation }
  | { type: 'DELETE_QUOTATION'; payload: string }
  // Reset
  | { type: 'LOAD_STATE'; payload: OrderStore };

// ─────────────── HELPERS ─────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const pad = (n: number, len = 6) => String(n).padStart(len, '0');
const year = () => new Date().getFullYear();

/** Recalculate payment status and outstanding for any order-like record */
function calcPaymentStatus(grandTotal: number, totalPaid: number, dueDate: string): PaymentStatus {
  if (totalPaid >= grandTotal) return 'paid';
  const due = new Date(dueDate);
  if (!isNaN(due.getTime()) && due < new Date() && totalPaid === 0) return 'overdue';
  if (totalPaid > 0) return 'partial';
  return 'unpaid';
}

/** Apply payment allocations to orders — updates totalPaid + outstanding + paymentStatus */
function applyAllocations(state: OrderStore): OrderStore {
  // build paid-per-order maps
  const mfgPaid: Record<string, number> = {};
  const dsgPaid: Record<string, number> = {};
  const prtPaid: Record<string, number> = {};

  for (const pay of state.payments) {
    for (const alloc of pay.allocations) {
      if (alloc.orderType === 'manufacturer') mfgPaid[alloc.orderId] = (mfgPaid[alloc.orderId] ?? 0) + alloc.amount;
      if (alloc.orderType === 'designer') dsgPaid[alloc.orderId] = (dsgPaid[alloc.orderId] ?? 0) + alloc.amount;
      if (alloc.orderType === 'printing') prtPaid[alloc.orderId] = (prtPaid[alloc.orderId] ?? 0) + alloc.amount;
    }
  }

  return {
    ...state,
    manufacturerOrders: state.manufacturerOrders.map(o => {
      const paid = mfgPaid[o.id] ?? 0;
      return { ...o, totalPaid: paid, outstanding: Math.max(0, o.grandTotal - paid), paymentStatus: calcPaymentStatus(o.grandTotal, paid, o.dueDate) };
    }),
    designerBills: state.designerBills.map(b => {
      const paid = dsgPaid[b.id] ?? 0;
      return { ...b, totalPaid: paid, outstanding: Math.max(0, b.grandTotal - paid), paymentStatus: calcPaymentStatus(b.grandTotal, paid, b.dueDate) };
    }),
    printingOrders: state.printingOrders.map(o => {
      const paid = prtPaid[o.id] ?? 0;
      return { ...o, totalPaid: paid, outstanding: Math.max(0, o.grandTotal - paid), paymentStatus: calcPaymentStatus(o.grandTotal, paid, o.deliveryDate) };
    }),
  };
}

// ─────────────── INITIAL SEED DATA ───────────────────────────────────────────

const SEED: OrderStore = {
  counters: { mfg: 3, dsg: 2, prt: 3, pay: 3, quo: 1 },
  printingServices: [
    {
      id: 'svc-1', name: 'Sublimation Printing', pricingMethod: 'per_piece', baseRate: 45,
      slabs: [{ minQty: 1, maxQty: 50, rate: 80 }, { minQty: 51, maxQty: 100, rate: 70 }, { minQty: 101, maxQty: 500, rate: 60 }, { minQty: 501, maxQty: null, rate: 50 }],
      minQuantity: 10, minCharge: 500, rushCharge: 500, setupCharge: 0, gstPct: 12, active: true, customerRates: [],
    },
    {
      id: 'svc-2', name: 'DTF Printing', pricingMethod: 'per_piece', baseRate: 80,
      slabs: [{ minQty: 1, maxQty: 50, rate: 100 }, { minQty: 51, maxQty: 200, rate: 80 }, { minQty: 201, maxQty: null, rate: 65 }],
      minQuantity: 5, minCharge: 300, rushCharge: 300, setupCharge: 200, gstPct: 12, active: true, customerRates: [],
    },
    {
      id: 'svc-3', name: 'Embroidery', pricingMethod: 'per_piece', baseRate: 120,
      slabs: [{ minQty: 1, maxQty: 100, rate: 150 }, { minQty: 101, maxQty: null, rate: 120 }],
      minQuantity: 1, minCharge: 150, rushCharge: 400, setupCharge: 500, gstPct: 12, active: true, customerRates: [],
    },
  ],
  customers: [
    { id: 'cust-1', name: 'Ramesh Sharma', businessName: 'Mumbai Warriors FC', phone: '9876543210', whatsapp: '9876543210', email: 'ramesh@mumbaiwarriors.com', gstin: '27AABCS1234B1ZX', billingAddress: 'Shop 12, Dadar, Mumbai 400014', shippingAddress: 'Same as billing', state: 'Maharashtra', customerType: 'direct', openingBalance: 0, openingBalanceDate: '2026-01-01', notes: 'Regular tournament client', createdAt: '2026-08-01T09:00:00Z' },
    { id: 'cust-2', name: 'Priya Patel', businessName: 'Delhi Tigers CC', phone: '9812345678', whatsapp: '9812345678', email: 'priya@delhitigers.com', gstin: '07AABCP5678C1ZY', billingAddress: 'B-42, Rajouri Garden, Delhi 110027', shippingAddress: 'Same as billing', state: 'Delhi', customerType: 'wholesaler', openingBalance: 5000, openingBalanceDate: '2026-09-01', notes: 'Opening balance from Excel', createdAt: '2026-08-15T10:30:00Z' },
    { id: 'cust-3', name: 'Arun Kumar', businessName: 'Chennai Strikers Sports', phone: '9445678901', whatsapp: '9445678901', email: 'arun@chennaistrikers.com', gstin: '33AABCA9012D1ZZ', billingAddress: '5th Street, T Nagar, Chennai 600017', shippingAddress: 'Same as billing', state: 'Tamil Nadu', customerType: 'retailer', openingBalance: 0, openingBalanceDate: '2026-01-01', notes: '', createdAt: '2026-09-01T08:00:00Z' },
  ],
  manufacturerOrders: [
    {
      id: 'mfg-1', orderNumber: 'MFG-2026-000001', customerId: 'cust-1',
      orderDate: '2026-09-01', deliveryDate: '2026-09-20', dueDate: '2026-09-25',
      priority: 'normal', status: 'completed', paymentStatus: 'paid',
      items: [{ id: 'item-1', product: 'Football Jersey', category: 'Jersey', sku: 'J-102', sizes: { S: 5, M: 10, L: 5, XL: 2 }, totalQty: 22, rate: 450, discount: 0, taxPct: 18, amount: 9900 }],
      teamName: 'Mumbai Warriors FC', tournamentName: 'City Cup 2026', playerNames: 'Sharma, Mehta, Khan...', playerNumbers: '1-22', sponsor: 'SportZone', collarType: 'V-Neck', sleeveType: 'Short', fabric: 'Polyester', jerseyType: 'Football', shortsRequired: true, sublimation: true, embroidery: false, printing: true, packaging: true, specialInstructions: 'Urgent delivery', referenceDesign: 'J-102.psd',
      itemsTotal: 9900, printingCharges: 2200, packagingCharges: 500, additionalCharges: 0, discount: 600, gstPct: 18, gstAmount: 2160, shipping: 0, roundOff: 0, grandTotal: 14160,
      totalPaid: 14160, outstanding: 0, notes: '', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-20T14:00:00Z',
    },
    {
      id: 'mfg-2', orderNumber: 'MFG-2026-000002', customerId: 'cust-2',
      orderDate: '2026-09-05', deliveryDate: '2026-09-30', dueDate: '2026-10-05',
      priority: 'urgent', status: 'production', paymentStatus: 'partial',
      items: [{ id: 'item-2', product: 'Cricket Jersey', category: 'Jersey', sku: 'J-201', sizes: { M: 6, L: 6, XL: 4 }, totalQty: 16, rate: 550, discount: 0, taxPct: 18, amount: 8800 }],
      teamName: 'Delhi Tigers CC', tournamentName: 'DPL 2026', playerNames: 'Patel, Singh, Gupta...', playerNumbers: '1-16', sponsor: '', collarType: 'Round', sleeveType: 'Half', fabric: 'Dri-Fit', jerseyType: 'Cricket', shortsRequired: false, sublimation: true, embroidery: true, printing: false, packaging: true, specialInstructions: '', referenceDesign: '',
      itemsTotal: 8800, printingCharges: 1600, packagingCharges: 400, additionalCharges: 0, discount: 0, gstPct: 18, gstAmount: 1872, shipping: 200, roundOff: 0, grandTotal: 12872,
      totalPaid: 5000, outstanding: 7872, notes: 'Advance received', createdAt: '2026-09-05T11:00:00Z', updatedAt: '2026-09-10T10:00:00Z',
    },
    {
      id: 'mfg-3', orderNumber: 'MFG-2026-000003', customerId: 'cust-3',
      orderDate: '2026-09-10', deliveryDate: '2026-10-10', dueDate: '2026-10-15',
      priority: 'express', status: 'confirmed', paymentStatus: 'unpaid',
      items: [{ id: 'item-3', product: 'Basketball Jersey', category: 'Jersey', sku: 'J-301', sizes: { S: 5, M: 10, L: 10, XL: 5 }, totalQty: 30, rate: 480, discount: 0, taxPct: 18, amount: 14400 }],
      teamName: 'Chennai Strikers', tournamentName: 'State League', playerNames: '', playerNumbers: '', sponsor: 'SportMax', collarType: 'V-Neck', sleeveType: 'Sleeveless', fabric: 'Mesh', jerseyType: 'Basketball', shortsRequired: true, sublimation: true, embroidery: false, printing: true, packaging: false, specialInstructions: 'Player names TBC', referenceDesign: '',
      itemsTotal: 14400, printingCharges: 3000, packagingCharges: 0, additionalCharges: 500, discount: 1000, gstPct: 18, gstAmount: 3042, shipping: 0, roundOff: 0, grandTotal: 19942,
      totalPaid: 0, outstanding: 19942, notes: '', createdAt: '2026-09-10T14:00:00Z', updatedAt: '2026-09-10T14:00:00Z',
    },
  ],
  designerBills: [
    {
      id: 'dsg-1', billNumber: 'DSG-2026-000001', customerId: 'cust-1', productionJobId: 'JOB-1024',
      date: '2026-09-02', dueDate: '2026-09-17', status: 'paid', paymentStatus: 'paid',
      items: [{ id: 'ditem-1', type: 'design', description: 'Football Jersey Base Design', amount: 2000 }, { id: 'ditem-2', type: 'revision', description: '2 Revision Rounds', amount: 500 }, { id: 'ditem-3', type: 'mockup', description: '3D Mockup', amount: 300 }],
      discount: 0, gstPct: 18, gstAmount: 504, grandTotal: 3304, totalPaid: 3304, outstanding: 0, notes: 'Job completed', createdAt: '2026-09-02T10:00:00Z',
    },
    {
      id: 'dsg-2', billNumber: 'DSG-2026-000002', customerId: 'cust-2', productionJobId: 'JOB-1025',
      date: '2026-09-08', dueDate: '2026-09-23', status: 'partial', paymentStatus: 'partial',
      items: [{ id: 'ditem-4', type: 'design', description: 'Cricket Jersey Design', amount: 2500 }, { id: 'ditem-5', type: 'logo', description: 'Team Logo Design', amount: 1500 }],
      discount: 200, gstPct: 18, gstAmount: 684, grandTotal: 4484, totalPaid: 2000, outstanding: 2484, notes: '', createdAt: '2026-09-08T09:00:00Z',
    },
  ],
  printingOrders: [
    {
      id: 'prt-1', orderNumber: 'PRT-2026-000001', customerId: 'cust-1', serviceId: 'svc-1',
      date: '2026-09-02', requiredDate: '2026-09-18', deliveryDate: '2026-09-19',
      status: 'delivered', paymentStatus: 'paid',
      quantity: 22, appliedRate: 70, material: 'Polyester', fabric: '100% Polyester', color: 'Red/White', printArea: 'Full Body', artworkFile: 'artwork-mw-fc.pdf', artworkApproved: true, specialInstructions: '',
      subtotal: 1540, additionalCharges: 0, discount: 0, gstPct: 12, gstAmount: 184.8, grandTotal: 1724.8, totalPaid: 1724.8, outstanding: 0, notes: '', createdAt: '2026-09-02T11:00:00Z',
    },
    {
      id: 'prt-2', orderNumber: 'PRT-2026-000002', customerId: 'cust-3', serviceId: 'svc-1',
      date: '2026-09-12', requiredDate: '2026-10-08', deliveryDate: '',
      status: 'artwork_pending', paymentStatus: 'unpaid',
      quantity: 30, appliedRate: 60, material: 'Mesh', fabric: '100% Mesh', color: 'Yellow/Black', printArea: 'Front + Back + Sleeves', artworkFile: '', artworkApproved: false, specialInstructions: 'Await artwork from client',
      subtotal: 1800, additionalCharges: 500, discount: 0, gstPct: 12, gstAmount: 276, grandTotal: 2576, totalPaid: 0, outstanding: 2576, notes: '', createdAt: '2026-09-12T10:00:00Z',
    },
    {
      id: 'prt-3', orderNumber: 'PRT-2026-000003', customerId: 'cust-2', serviceId: 'svc-3',
      date: '2026-09-06', requiredDate: '2026-09-28', deliveryDate: '',
      status: 'printing', paymentStatus: 'partial',
      quantity: 16, appliedRate: 150, material: 'Dri-Fit', fabric: 'Polyester Blend', color: 'Blue', printArea: 'Left Chest', artworkFile: 'logo-dt.pdf', artworkApproved: true, specialInstructions: '',
      subtotal: 2400, additionalCharges: 500, discount: 0, gstPct: 12, gstAmount: 348, grandTotal: 3248, totalPaid: 1500, outstanding: 1748, notes: '', createdAt: '2026-09-06T12:00:00Z',
    },
  ],
  payments: [
    { id: 'pay-1', paymentNumber: 'PAY-000001', customerId: 'cust-1', date: '2026-09-01', amount: 14160, mode: 'upi', referenceNumber: 'UPI-TXN-112233', notes: 'Full payment', receivedBy: 'Admin', allocations: [{ orderId: 'mfg-1', orderType: 'manufacturer', amount: 14160 }], createdAt: '2026-09-01T15:00:00Z' },
    { id: 'pay-2', paymentNumber: 'PAY-000002', customerId: 'cust-2', date: '2026-09-06', amount: 7000, mode: 'bank', referenceNumber: 'NEFT-778899', notes: 'Advance + design partial', receivedBy: 'Admin', allocations: [{ orderId: 'mfg-2', orderType: 'manufacturer', amount: 5000 }, { orderId: 'dsg-2', orderType: 'designer', amount: 2000 }], createdAt: '2026-09-06T12:00:00Z' },
    { id: 'pay-3', paymentNumber: 'PAY-000003', customerId: 'cust-1', date: '2026-09-03', amount: 5028.8, mode: 'cash', referenceNumber: '', notes: 'Printing + design payment', receivedBy: 'Admin', allocations: [{ orderId: 'prt-1', orderType: 'printing', amount: 1724.8 }, { orderId: 'dsg-1', orderType: 'designer', amount: 3304 }], createdAt: '2026-09-03T16:00:00Z' },
  ],
  quotations: [
    {
      id: 'quo-1', quotationNumber: 'QUO-2026-000001', customerId: 'cust-3', date: '2026-09-09', validUntil: '2026-09-24', businessType: 'manufacturer',
      items: [{ id: 'qitem-1', product: 'Football Jersey', category: 'Jersey', sku: 'J-401', sizes: { M: 20, L: 20, XL: 10 }, totalQty: 50, rate: 450, discount: 0, taxPct: 18, amount: 22500 }],
      discount: 1000, gstPct: 18, gstAmount: 3870, grandTotal: 25370, status: 'sent', convertedToOrderId: '', notes: 'Awaiting confirmation', terms: 'Payment: 50% advance, 50% before delivery', createdAt: '2026-09-09T10:00:00Z',
    },
  ],
};

// ─────────────── REDUCER ──────────────────────────────────────────────────────

function reducer(state: OrderStore, action: Action): OrderStore {
  let next: OrderStore;

  switch (action.type) {
    // ── Customers ──────────────────────────────────────────────────────────
    case 'ADD_CUSTOMER': {
      const customer: Customer = { ...action.payload, id: `cust-${uid()}`, createdAt: now() };
      next = { ...state, customers: [...state.customers, customer] };
      break;
    }
    case 'UPDATE_CUSTOMER': {
      next = { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) };
      break;
    }
    case 'DELETE_CUSTOMER': {
      next = { ...state, customers: state.customers.filter(c => c.id !== action.payload) };
      break;
    }

    // ── Manufacturer Orders ────────────────────────────────────────────────
    case 'ADD_MFG_ORDER': {
      const n = state.counters.mfg + 1;
      const order: ManufacturerOrder = {
        ...action.payload,
        id: `mfg-${uid()}`,
        orderNumber: `MFG-${year()}-${pad(n)}`,
        totalPaid: 0, outstanding: action.payload.grandTotal,
        paymentStatus: 'unpaid',
        createdAt: now(), updatedAt: now(),
      };
      next = { ...state, manufacturerOrders: [...state.manufacturerOrders, order], counters: { ...state.counters, mfg: n } };
      break;
    }
    case 'UPDATE_MFG_ORDER': {
      next = { ...state, manufacturerOrders: state.manufacturerOrders.map(o => o.id === action.payload.id ? { ...action.payload, updatedAt: now() } : o) };
      break;
    }
    case 'DELETE_MFG_ORDER': {
      next = { ...state, manufacturerOrders: state.manufacturerOrders.filter(o => o.id !== action.payload) };
      break;
    }

    // ── Designer Bills ─────────────────────────────────────────────────────
    case 'ADD_DESIGNER_BILL': {
      const n = state.counters.dsg + 1;
      const bill: DesignerBill = {
        ...action.payload,
        id: `dsg-${uid()}`,
        billNumber: `DSG-${year()}-${pad(n)}`,
        totalPaid: 0, outstanding: action.payload.grandTotal,
        paymentStatus: 'unpaid',
        createdAt: now(),
      };
      next = { ...state, designerBills: [...state.designerBills, bill], counters: { ...state.counters, dsg: n } };
      break;
    }
    case 'UPDATE_DESIGNER_BILL': {
      next = { ...state, designerBills: state.designerBills.map(b => b.id === action.payload.id ? action.payload : b) };
      break;
    }
    case 'DELETE_DESIGNER_BILL': {
      next = { ...state, designerBills: state.designerBills.filter(b => b.id !== action.payload) };
      break;
    }

    // ── Printing Services ──────────────────────────────────────────────────
    case 'ADD_PRINTING_SERVICE': {
      const svc: PrintingService = { ...action.payload, id: `svc-${uid()}` };
      next = { ...state, printingServices: [...state.printingServices, svc] };
      break;
    }
    case 'UPDATE_PRINTING_SERVICE': {
      next = { ...state, printingServices: state.printingServices.map(s => s.id === action.payload.id ? action.payload : s) };
      break;
    }
    case 'DELETE_PRINTING_SERVICE': {
      next = { ...state, printingServices: state.printingServices.filter(s => s.id !== action.payload) };
      break;
    }

    // ── Printing Orders ────────────────────────────────────────────────────
    case 'ADD_PRINTING_ORDER': {
      const n = state.counters.prt + 1;
      const order: PrintingOrder = {
        ...action.payload,
        id: `prt-${uid()}`,
        orderNumber: `PRT-${year()}-${pad(n)}`,
        totalPaid: 0, outstanding: action.payload.grandTotal,
        paymentStatus: 'unpaid',
        createdAt: now(),
      };
      next = { ...state, printingOrders: [...state.printingOrders, order], counters: { ...state.counters, prt: n } };
      break;
    }
    case 'UPDATE_PRINTING_ORDER': {
      next = { ...state, printingOrders: state.printingOrders.map(o => o.id === action.payload.id ? action.payload : o) };
      break;
    }
    case 'DELETE_PRINTING_ORDER': {
      next = { ...state, printingOrders: state.printingOrders.filter(o => o.id !== action.payload) };
      break;
    }

    // ── Payments ───────────────────────────────────────────────────────────
    case 'ADD_PAYMENT': {
      const n = state.counters.pay + 1;
      const payment: Payment = { ...action.payload, id: `pay-${uid()}`, paymentNumber: `PAY-${pad(n)}`, createdAt: now() };
      const withPay = { ...state, payments: [...state.payments, payment], counters: { ...state.counters, pay: n } };
      next = applyAllocations(withPay);
      break;
    }
    case 'DELETE_PAYMENT': {
      const withoutPay = { ...state, payments: state.payments.filter(p => p.id !== action.payload) };
      next = applyAllocations(withoutPay);
      break;
    }

    // ── Quotations ─────────────────────────────────────────────────────────
    case 'ADD_QUOTATION': {
      const n = state.counters.quo + 1;
      const quo: Quotation = { ...action.payload, id: `quo-${uid()}`, quotationNumber: `QUO-${year()}-${pad(n)}`, createdAt: now() };
      next = { ...state, quotations: [...state.quotations, quo], counters: { ...state.counters, quo: n } };
      break;
    }
    case 'UPDATE_QUOTATION': {
      next = { ...state, quotations: state.quotations.map(q => q.id === action.payload.id ? action.payload : q) };
      break;
    }
    case 'DELETE_QUOTATION': {
      next = { ...state, quotations: state.quotations.filter(q => q.id !== action.payload) };
      break;
    }

    case 'LOAD_STATE':
      next = action.payload;
      break;

    default:
      return state;
  }

  // Persist after every action
  try { localStorage.setItem('fn_orders_v1', JSON.stringify(next)); } catch { /* quota error ignored */ }
  return next;
}

// ─────────────── SELECTORS ────────────────────────────────────────────────────

/** Get all ledger entries for a customer, sorted by date, with running balance */
export function getCustomerLedger(state: OrderStore, customerId: string): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  const cust = state.customers.find(c => c.id === customerId);
  if (!cust) return [];

  // Opening balance
  if (cust.openingBalance !== 0) {
    entries.push({
      id: `ledger-open-${customerId}`, date: cust.openingBalanceDate, customerId,
      description: 'Opening Balance', category: 'opening',
      transactionType: cust.openingBalance > 0 ? 'debit' : 'credit',
      amount: Math.abs(cust.openingBalance), referenceId: '', referenceNumber: 'OPEN-BAL', balance: 0,
    });
  }

  // Manufacturer orders
  for (const o of state.manufacturerOrders.filter(x => x.customerId === customerId)) {
    entries.push({ id: `ledger-mfg-${o.id}`, date: o.orderDate, customerId, description: `Manufacturing Order — ${o.teamName || o.orderNumber}`, category: 'manufacturer', transactionType: 'debit', amount: o.grandTotal, referenceId: o.id, referenceNumber: o.orderNumber, balance: 0 });
  }

  // Designer bills
  for (const b of state.designerBills.filter(x => x.customerId === customerId)) {
    entries.push({ id: `ledger-dsg-${b.id}`, date: b.date, customerId, description: `Designer Bill${b.productionJobId ? ` — ${b.productionJobId}` : ''}`, category: 'designer', transactionType: 'debit', amount: b.grandTotal, referenceId: b.id, referenceNumber: b.billNumber, balance: 0 });
  }

  // Printing orders
  for (const o of state.printingOrders.filter(x => x.customerId === customerId)) {
    const svc = state.printingServices.find(s => s.id === o.serviceId);
    entries.push({ id: `ledger-prt-${o.id}`, date: o.date, customerId, description: `Printing Order — ${svc?.name ?? 'Printing'}`, category: 'printing', transactionType: 'debit', amount: o.grandTotal, referenceId: o.id, referenceNumber: o.orderNumber, balance: 0 });
  }

  // Payments
  for (const p of state.payments.filter(x => x.customerId === customerId)) {
    entries.push({ id: `ledger-pay-${p.id}`, date: p.date, customerId, description: `Payment — ${p.mode.toUpperCase()}${p.referenceNumber ? ` (${p.referenceNumber})` : ''}`, category: 'payment', transactionType: 'credit', amount: p.amount, referenceId: p.id, referenceNumber: p.paymentNumber, balance: 0 });
  }

  // Sort by date
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate running balance
  let bal = 0;
  for (const e of entries) {
    bal += e.transactionType === 'debit' ? e.amount : -e.amount;
    e.balance = bal;
  }

  return entries;
}

/** Get outstanding totals per customer */
export function getCustomerSummary(state: OrderStore, customerId: string) {
  const mfgTotal = state.manufacturerOrders.filter(o => o.customerId === customerId).reduce((s, o) => s + o.grandTotal, 0);
  const dsgTotal = state.designerBills.filter(b => b.customerId === customerId).reduce((s, b) => s + b.grandTotal, 0);
  const prtTotal = state.printingOrders.filter(o => o.customerId === customerId).reduce((s, o) => s + o.grandTotal, 0);
  const cust = state.customers.find(c => c.id === customerId);
  const openingBal = cust?.openingBalance ?? 0;

  const totalBusiness = mfgTotal + dsgTotal + prtTotal + openingBal;

  const mfgPaid = state.manufacturerOrders.filter(o => o.customerId === customerId).reduce((s, o) => s + o.totalPaid, 0);
  const dsgPaid = state.designerBills.filter(b => b.customerId === customerId).reduce((s, b) => s + b.totalPaid, 0);
  const prtPaid = state.printingOrders.filter(o => o.customerId === customerId).reduce((s, o) => s + o.totalPaid, 0);

  const totalPaid = mfgPaid + dsgPaid + prtPaid;
  const outstanding = totalBusiness - totalPaid;

  const services: BusinessType[] = [];
  if (state.manufacturerOrders.some(o => o.customerId === customerId)) services.push('manufacturer');
  if (state.designerBills.some(b => b.customerId === customerId)) services.push('designer');
  if (state.printingOrders.some(o => o.customerId === customerId)) services.push('printing');

  return {
    totalBusiness, totalPaid, outstanding,
    mfgTotal, dsgTotal, prtTotal, mfgPaid, dsgPaid, prtPaid,
    mfgOutstanding: mfgTotal - mfgPaid,
    dsgOutstanding: dsgTotal - dsgPaid,
    prtOutstanding: prtTotal - prtPaid,
    services,
    lastOrder: state.manufacturerOrders.filter(o => o.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.orderDate ?? '—',
  };
}

/** Get KPI stats for a given business mode */
export function getKPIStats(state: OrderStore, mode: 'all' | BusinessType) {
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const mfgOrders = state.manufacturerOrders;
  const dsgBills = state.designerBills;
  const prtOrders = state.printingOrders;

  const mfgRevenue = mfgOrders.reduce((s, o) => s + o.grandTotal, 0);
  const dsgRevenue = dsgBills.reduce((s, b) => s + b.grandTotal, 0);
  const prtRevenue = prtOrders.reduce((s, o) => s + o.grandTotal, 0);
  const mfgReceived = mfgOrders.reduce((s, o) => s + o.totalPaid, 0);
  const dsgReceived = dsgBills.reduce((s, b) => s + b.totalPaid, 0);
  const prtReceived = prtOrders.reduce((s, o) => s + o.totalPaid, 0);

  const mfgOutstanding = mfgOrders.reduce((s, o) => s + o.outstanding, 0);
  const dsgOutstanding = dsgBills.reduce((s, b) => s + b.outstanding, 0);
  const prtOutstanding = prtOrders.reduce((s, b) => s + b.outstanding, 0);

  const overdue = [...mfgOrders.filter(o => o.paymentStatus === 'overdue'), ...dsgBills.filter(b => b.paymentStatus === 'overdue'), ...prtOrders.filter(o => o.paymentStatus === 'overdue')].reduce((s: number, o: any) => s + o.outstanding, 0);

  const thisMonthRevenue = [
    ...mfgOrders.filter(o => o.orderDate.startsWith(thisMonth)).map(o => o.grandTotal),
    ...dsgBills.filter(b => b.date.startsWith(thisMonth)).map(b => b.grandTotal),
    ...prtOrders.filter(o => o.date.startsWith(thisMonth)).map(o => o.grandTotal),
  ].reduce((s, v) => s + v, 0);

  if (mode === 'all') {
    return { totalOrders: mfgOrders.length + dsgBills.length + prtOrders.length, totalInvoiced: mfgRevenue + dsgRevenue + prtRevenue, received: mfgReceived + dsgReceived + prtReceived, outstanding: mfgOutstanding + dsgOutstanding + prtOutstanding, thisMonth: thisMonthRevenue, overdue, mfgRevenue, dsgRevenue, prtRevenue };
  }
  if (mode === 'manufacturer') return { totalOrders: mfgOrders.length, totalInvoiced: mfgRevenue, received: mfgReceived, outstanding: mfgOutstanding, thisMonth: mfgOrders.filter(o => o.orderDate.startsWith(thisMonth)).reduce((s, o) => s + o.grandTotal, 0), overdue: mfgOrders.filter(o => o.paymentStatus === 'overdue').reduce((s, o) => s + o.outstanding, 0), mfgRevenue, dsgRevenue, prtRevenue };
  if (mode === 'designer') return { totalOrders: dsgBills.length, totalInvoiced: dsgRevenue, received: dsgReceived, outstanding: dsgOutstanding, thisMonth: dsgBills.filter(b => b.date.startsWith(thisMonth)).reduce((s, b) => s + b.grandTotal, 0), overdue: dsgBills.filter(b => b.paymentStatus === 'overdue').reduce((s, b) => s + b.outstanding, 0), mfgRevenue, dsgRevenue, prtRevenue };
  // printing
  return { totalOrders: prtOrders.length, totalInvoiced: prtRevenue, received: prtReceived, outstanding: prtOutstanding, thisMonth: prtOrders.filter(o => o.date.startsWith(thisMonth)).reduce((s, o) => s + o.grandTotal, 0), overdue: prtOrders.filter(o => o.paymentStatus === 'overdue').reduce((s, o) => s + o.outstanding, 0), mfgRevenue, dsgRevenue, prtRevenue };
}

/** Get effective printing rate for a service + customer + quantity */
export function getEffectivePrintingRate(svc: PrintingService, customerId: string, qty: number): number {
  const custRate = svc.customerRates.find(r => r.customerId === customerId);
  if (custRate) return custRate.rate;
  const slab = [...svc.slabs].sort((a, b) => b.minQty - a.minQty).find(s => qty >= s.minQty);
  if (slab) return slab.rate;
  return svc.baseRate;
}

// ─────────────── HOOK ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'fn_orders_v1';

export function useOrderStore() {
  const [state, dispatch] = useReducer(reducer, null, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as OrderStore;
    } catch { /* ignore */ }
    // Bootstrap with seed + apply allocations
    const seeded = applyAllocations(SEED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  });

  // Selectors
  const getCustomer = useCallback((id: string) => state.customers.find(c => c.id === id), [state]);
  const getPrintingService = useCallback((id: string) => state.printingServices.find(s => s.id === id), [state]);

  return {
    state,
    dispatch,
    getCustomer,
    getPrintingService,
    getCustomerLedger: (id: string) => getCustomerLedger(state, id),
    getCustomerSummary: (id: string) => getCustomerSummary(state, id),
    getKPIStats: (mode: 'all' | BusinessType) => getKPIStats(state, mode),
    getEffectivePrintingRate,
  };
}

// ─────────────── UTILS ───────────────────────────────────────────────────────

export const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
export const fmtFull = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const STATUS_COLORS: Record<string, string> = {
  draft:            'bg-zinc-100 text-zinc-600 border-zinc-200',
  confirmed:        'bg-blue-50 text-blue-700 border-blue-200',
  production:       'bg-violet-50 text-violet-700 border-violet-200',
  ready:            'bg-teal-50 text-teal-700 border-teal-200',
  dispatched:       'bg-indigo-50 text-indigo-700 border-indigo-200',
  completed:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled:        'bg-red-50 text-red-700 border-red-200',
  paid:             'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial:          'bg-amber-50 text-amber-700 border-amber-200',
  unpaid:           'bg-zinc-100 text-zinc-600 border-zinc-200',
  overdue:          'bg-red-50 text-red-700 border-red-200',
  sent:             'bg-blue-50 text-blue-700 border-blue-200',
  accepted:         'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected:         'bg-red-50 text-red-700 border-red-200',
  expired:          'bg-zinc-100 text-zinc-600 border-zinc-200',
  converted:        'bg-violet-50 text-violet-700 border-violet-200',
  quotation:        'bg-blue-50 text-blue-700 border-blue-200',
  received:         'bg-indigo-50 text-indigo-700 border-indigo-200',
  artwork_pending:  'bg-amber-50 text-amber-700 border-amber-200',
  artwork_approved: 'bg-teal-50 text-teal-700 border-teal-200',
  queue:            'bg-violet-50 text-violet-700 border-violet-200',
  printing:         'bg-purple-50 text-purple-700 border-purple-200',
  quality_check:    'bg-sky-50 text-sky-700 border-sky-200',
  delivered:        'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', confirmed: 'Confirmed', production: 'In Production',
  ready: 'Ready', dispatched: 'Dispatched', completed: 'Completed', cancelled: 'Cancelled',
  paid: 'Paid', partial: 'Partially Paid', unpaid: 'Unpaid', overdue: 'Overdue',
  sent: 'Sent', accepted: 'Accepted', rejected: 'Rejected', expired: 'Expired', converted: 'Converted',
  quotation: 'Quotation', received: 'Received', artwork_pending: 'Artwork Pending',
  artwork_approved: 'Artwork Approved', queue: 'In Queue', printing: 'Printing',
  quality_check: 'Quality Check', delivered: 'Delivered',
};

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
export const PAYMENT_MODES: PaymentMode[] = ['cash', 'upi', 'bank', 'card', 'cheque', 'other'];
export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = { cash: 'Cash', upi: 'UPI', bank: 'Bank Transfer', card: 'Card', cheque: 'Cheque', other: 'Other' };
