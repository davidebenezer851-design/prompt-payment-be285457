export function money(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n || 0);
}

export function shortDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export type LineItem = {
  description: string;
  quantity: number;
  rate: number;
};

export function computeTotals(items: LineItem[], taxRate: number) {
  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0);
  const tax = subtotal * ((Number(taxRate) || 0) / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}
