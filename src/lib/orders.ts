// Central order management — localStorage-backed, works fully offline
export type OrderStatus = "new" | "production" | "ready" | "delivered";
export type Sport = "Football" | "Cricket" | "Kabaddi" | "Basketball" | "Hockey" | "Esports" | "Other";

export type Order = {
  id: string;
  customer: string;
  phone: string;
  sport: Sport | string;
  design: string;
  sizes: { XS: number; S: number; M: number; L: number; XL: number; XXL: number };
  totalQty: number;
  colors: string;
  notes: string;
  deadline: string;
  pricePerPiece: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
};

const KEY = "fivenest_orders";

export function loadOrders(): Order[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]): void {
  localStorage.setItem(KEY, JSON.stringify(orders));
}

export function createOrder(data: Omit<Order, "id" | "createdAt" | "status" | "totalQty" | "totalPrice">): Order {
  const totalQty = Object.values(data.sizes).reduce((a, b) => a + b, 0);
  const order: Order = {
    ...data,
    id: `ORD-${Date.now()}`,
    status: "new",
    totalQty,
    totalPrice: totalQty * data.pricePerPiece,
    createdAt: new Date().toISOString(),
  };
  const orders = loadOrders();
  saveOrders([order, ...orders]);
  return order;
}

export function updateOrderStatus(id: string, status: OrderStatus): void {
  const orders = loadOrders();
  saveOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
}

export function deleteOrder(id: string): void {
  saveOrders(loadOrders().filter((o) => o.id !== id));
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New Order",
  production: "In Production",
  ready: "Ready",
  delivered: "Delivered",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  production: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  ready: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  delivered: "text-slate-400 bg-slate-400/10 border-slate-400/30",
};
