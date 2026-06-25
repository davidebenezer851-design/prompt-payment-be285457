import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { money, shortDate } from "@/lib/format";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/invoices")({
  component: InvoiceList,
});

const STATUS_STYLES: Record<string, string> = {
  draft: "text-muted-foreground border-muted-foreground",
  sent: "text-foreground border-foreground",
  paid: "text-accent border-accent",
  overdue: "text-destructive border-destructive",
};

function InvoiceList() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totals = {
    paid: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0),
    outstanding: invoices.filter((i) => i.status !== "paid" && i.status !== "draft").reduce((s, i) => s + Number(i.total), 0),
    draft: invoices.filter((i) => i.status === "draft").length,
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-muted-foreground">§ Ledger</p>
          <h1 className="display mt-2 text-5xl">Invoices.</h1>
        </div>
        <Link to="/app/new" className="inline-flex items-center gap-2 bg-foreground px-5 py-3 text-sm font-medium text-background hover:bg-accent transition-colors">
          <Plus className="h-4 w-4" /> New invoice
        </Link>
      </div>

      <div className="mt-10 grid gap-px bg-rule sm:grid-cols-3">
        <Stat label="Paid" value={money(totals.paid)} />
        <Stat label="Outstanding" value={money(totals.outstanding)} />
        <Stat label="Drafts" value={String(totals.draft)} />
      </div>

      <div className="mt-12 rule-top rule-bottom">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center">
            <p className="display text-3xl italic text-muted-foreground">No invoices yet.</p>
            <Link to="/app/new" className="mt-6 inline-block border-b border-foreground pb-0.5 text-sm hover:text-accent hover:border-accent">Create your first →</Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="eyebrow text-muted-foreground rule-bottom">
                <th className="py-3 text-left font-normal">№</th>
                <th className="py-3 text-left font-normal">Client</th>
                <th className="py-3 text-left font-normal">Issued</th>
                <th className="py-3 text-left font-normal">Due</th>
                <th className="py-3 text-right font-normal">Total</th>
                <th className="py-3 text-right font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-rule last:border-0 hover:bg-secondary/40 transition-colors">
                  <td className="py-4">
                    <Link to="/app/invoice/$id" params={{ id: inv.id }} className="font-serif text-lg hover:text-accent">{inv.invoice_number}</Link>
                  </td>
                  <td className="py-4">{inv.client_name}</td>
                  <td className="py-4 text-sm text-muted-foreground">{shortDate(inv.issue_date)}</td>
                  <td className="py-4 text-sm text-muted-foreground">{shortDate(inv.due_date)}</td>
                  <td className="py-4 text-right font-medium">{money(Number(inv.total), inv.currency)}</td>
                  <td className="py-4 text-right">
                    <span className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_STYLES[inv.status] ?? ""}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-6">
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className="display mt-2 text-4xl">{value}</p>
    </div>
  );
}
