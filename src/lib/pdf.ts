import jsPDF from "jspdf";
import { money, shortDate, type LineItem } from "./format";

type Invoice = {
  invoice_number: string;
  client_name: string;
  client_email?: string | null;
  issue_date: string;
  due_date: string;
  line_items: LineItem[];
  tax_rate: number;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string | null;
  status: string;
  currency?: string;
};

type Sender = {
  business_name?: string | null;
  display_name?: string | null;
};

export function generateInvoicePdf(invoice: Invoice, sender: Sender) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const w = doc.internal.pageSize.getWidth();
  const margin = 54;
  let y = margin;

  // Header — INVOICE wordmark
  doc.setFont("times", "normal");
  doc.setFontSize(48);
  doc.text("Invoice", margin, y + 30);

  // Right column — meta
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("INVOICE №", w - margin, y + 4, { align: "right" });
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(invoice.invoice_number, w - margin, y + 18, { align: "right" });

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("ISSUED", w - margin, y + 36, { align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(shortDate(invoice.issue_date), w - margin, y + 48, { align: "right" });

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("DUE", w - margin, y + 64, { align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(shortDate(invoice.due_date), w - margin, y + 76, { align: "right" });

  y += 110;
  doc.setDrawColor(180);
  doc.line(margin, y, w - margin, y);
  y += 28;

  // From / To
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("FROM", margin, y);
  doc.text("BILLED TO", w / 2, y);
  doc.setFontSize(11);
  doc.setTextColor(0);
  const from = sender.business_name || sender.display_name || "Freelancer";
  doc.text(from, margin, y + 16);
  doc.text(invoice.client_name, w / 2, y + 16);
  if (invoice.client_email) {
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(invoice.client_email, w / 2, y + 30);
  }

  y += 60;
  doc.setDrawColor(180);
  doc.line(margin, y, w - margin, y);
  y += 22;

  // Items header
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("DESCRIPTION", margin, y);
  doc.text("QTY", w - margin - 220, y, { align: "right" });
  doc.text("RATE", w - margin - 110, y, { align: "right" });
  doc.text("AMOUNT", w - margin, y, { align: "right" });
  y += 14;
  doc.setDrawColor(220);
  doc.line(margin, y, w - margin, y);
  y += 16;

  doc.setFontSize(10);
  doc.setTextColor(0);
  invoice.line_items.forEach((item) => {
    const amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    doc.text(item.description || "—", margin, y);
    doc.text(String(item.quantity || 0), w - margin - 220, y, { align: "right" });
    doc.text(money(item.rate, invoice.currency), w - margin - 110, y, { align: "right" });
    doc.text(money(amount, invoice.currency), w - margin, y, { align: "right" });
    y += 22;
  });

  y += 8;
  doc.setDrawColor(180);
  doc.line(w / 2, y, w - margin, y);
  y += 18;

  // Totals
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text("Subtotal", w - margin - 110, y, { align: "right" });
  doc.setTextColor(0);
  doc.text(money(invoice.subtotal, invoice.currency), w - margin, y, { align: "right" });
  y += 18;
  doc.setTextColor(110);
  doc.text(`Tax (${invoice.tax_rate}%)`, w - margin - 110, y, { align: "right" });
  doc.setTextColor(0);
  doc.text(money(invoice.tax, invoice.currency), w - margin, y, { align: "right" });
  y += 22;
  doc.setDrawColor(60);
  doc.line(w / 2 + 60, y - 8, w - margin, y - 8);
  doc.setFont("times", "normal");
  doc.setFontSize(20);
  doc.text("Total", w - margin - 110, y + 10, { align: "right" });
  doc.text(money(invoice.total, invoice.currency), w - margin, y + 10, { align: "right" });

  if (invoice.notes) {
    y += 60;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("NOTES", margin, y);
    doc.setFontSize(10);
    doc.setTextColor(0);
    const split = doc.splitTextToSize(invoice.notes, w - margin * 2);
    doc.text(split, margin, y + 14);
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Powered by InstaGig", w / 2, doc.internal.pageSize.getHeight() - 24, { align: "center" });

  doc.save(`${invoice.invoice_number}.pdf`);
}
