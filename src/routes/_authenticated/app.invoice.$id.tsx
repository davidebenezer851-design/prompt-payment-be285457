import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { money, shortDate, type LineItem } from "@/lib/format";
import { generateInvoicePdf } from "@/lib/pdf";
import { toast } from "sonner";
import { Download, ArrowLeft, Check, Send, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/invoice/$id")({
  component: InvoiceDetail,
});

function InvoiceDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").single();
      return data;
    },
  });

  async function setStatus(status: string) {
    const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked as ${status}`);
    qc.invalidateQueries({ queryKey: ["invoice", id] });
    qc.invalidateQueries({ queryKey: ["invoices"] });
  }

  async function remove() {
    if (!confirm("Delete this invoice permanently?")) return;
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Invoice deleted");
    navigate({ to: "/app" });
  }

  function downloadPdf() {
    if (!invoice) return;
    generateInvoicePdf(
      { ...invoice, line_items: (invoice.line_items as unknown as LineItem[]) ?? [] },
      profile ?? {}
    );
  }

  if (isLoading || !invoice) return <main className="mx-auto max-w-4xl px-6 py-12"><p className="text-muted-foreground">Loading…</p></main>;

  const items = (invoice.line_items as unknown as LineItem[]) ?? [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent">
        <ArrowLeft className="h-4 w-4" /> All invoices
      </Link>

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow text-muted-foreground">Invoice {invoice.invoice_number}</p>
          <p className="mt-1 text-sm">
            Status: <span className="font-medium uppercase tracking-widest text-accent">{invoice.status}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadPdf} className="inline-flex items-center gap-1.5 bg-foreground px-4 py-2 text-sm text-background hover:bg-accent transition-colors">
            <Download className="h-4 w-4" /> Download PDF
          </button>
          {invoice.status !== "paid" && (
            <button onClick={() => setStatus("paid")} className="inline-flex items-center gap-1.5 border border-accent px-4 py-2 text-sm text-accent hover:bg-accent hover:text-background transition-colors">
              <Check className="h-4 w-4" /> Mark paid
            </button>
          )}
          {invoice.status === "draft" && (
            <button onClick={() => setStatus("sent")} className="inline-flex items-center gap-1.5 border border-foreground px-4 py-2 text-sm hover:bg-foreground hover:text-background transition-colors">
              <Send className="h-4 w-4" /> Mark sent
            </button>
          )}
          <button onClick={remove} className="inline-flex items-center gap-1.5 border border-rule px-4 py-2 text-sm text-muted-foreground hover:text-destructive hover:border-destructive transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Invoice paper */}
      <article className="mt-10 border border-rule bg-card p-10 md:p-16 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <h1 className="display text-6xl">Invoice</h1>
          <div className="text-right text-sm">
            <p className="eyebrow text-muted-foreground">№</p>
            <p className="font-medium">{invoice.invoice_number}</p>
            <p className="eyebrow mt-4 text-muted-foreground">Issued</p>
            <p>{shortDate(invoice.issue_date)}</p>
            <p className="eyebrow mt-4 text-muted-foreground">Due</p>
            <p>{shortDate(invoice.due_date)}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 rule-top pt-8">
          <div>
            <p className="eyebrow text-muted-foreground">From</p>
            <p className="mt-2 font-medium">{profile?.business_name || profile?.display_name || "Freelancer"}</p>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Billed to</p>
            <p className="mt-2 font-medium">{invoice.client_name}</p>
            {invoice.client_email && <p className="text-sm text-muted-foreground">{invoice.client_email}</p>}
          </div>
        </div>

        <table className="mt-10 w-full text-sm rule-top">
          <thead>
            <tr className="eyebrow text-muted-foreground rule-bottom">
              <th className="py-3 text-left font-normal">Description</th>
              <th className="py-3 text-right font-normal w-16">Qty</th>
              <th className="py-3 text-right font-normal w-28">Rate</th>
              <th className="py-3 text-right font-normal w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b border-rule last:border-0">
                <td className="py-4">{it.description}</td>
                <td className="py-4 text-right">{it.quantity}</td>
                <td className="py-4 text-right">{money(it.rate, invoice.currency)}</td>
                <td className="py-4 text-right">{money(it.quantity * it.rate, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(Number(invoice.subtotal), invoice.currency)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax ({invoice.tax_rate}%)</span><span>{money(Number(invoice.tax), invoice.currency)}</span></div>
            <div className="rule-top pt-3 flex items-baseline justify-between">
              <span className="eyebrow text-muted-foreground">Total</span>
              <span className="display text-4xl">{money(Number(invoice.total), invoice.currency)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-10 rule-top pt-6">
            <p className="eyebrow text-muted-foreground">Notes</p>
            <p className="mt-2 text-sm italic text-muted-foreground">{invoice.notes}</p>
          </div>
        )}
      </article>
    </main>
  );
}
