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

const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: "ORD-171501",
    customer: "Mumbai Warriors FC",
    phone: "+91 98765 43210",
    sport: "Football",
    design: "Home Kit 2024",
    sizes: { XS: 2, S: 4, M: 8, L: 6, XL: 2, XXL: 0 },
    totalQty: 22,
    colors: "Navy / Orange",
    notes: "Name and number on back",
    deadline: "2026-10-01",
    pricePerPiece: 650,
    totalPrice: 14300,
    status: "new",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ORD-171502",
    customer: "Delhi Tigers Cricket Club",
    phone: "+91 98234 56789",
    sport: "Cricket",
    design: "Sublimation T20",
    sizes: { XS: 0, S: 2, M: 6, L: 5, XL: 3, XXL: 0 },
    totalQty: 16,
    colors: "Yellow / Black",
    notes: "Sponsor logo on chest",
    deadline: "2026-10-05",
    pricePerPiece: 650,
    totalPrice: 10400,
    status: "production",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ORD-171503",
    customer: "Chennai Super Strikers",
    phone: "+91 98111 22233",
    sport: "Hockey",
    design: "Pro League Kit",
    sizes: { XS: 0, S: 5, M: 10, L: 10, XL: 5, XXL: 0 },
    totalQty: 30,
    colors: "Royal Blue / Gold",
    notes: "Urgent tournament delivery",
    deadline: "2026-09-28",
    pricePerPiece: 650,
    totalPrice: 19500,
    status: "ready",
    createdAt: new Date().toISOString(),
  }
];

export function loadOrders(): Order[] {
  try {
    const data = localStorage.getItem(KEY);
    if (!data || data === "[]") {
      localStorage.setItem(KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
      return INITIAL_DEMO_ORDERS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_DEMO_ORDERS;
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
  new: "text-blue-700 bg-blue-50 border-blue-200",
  production: "text-amber-700 bg-amber-50 border-amber-200",
  ready: "text-emerald-700 bg-emerald-50 border-emerald-200",
  delivered: "text-zinc-600 bg-zinc-100 border-zinc-200",
};
