import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeTotals, money, type LineItem } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/new")({
  component: NewInvoice,
});

function todayISO() { return new Date().toISOString().slice(0, 10); }
function addDays(days: number) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function NewInvoice() {
  const navigate = useNavigate();
  const [number, setNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDays(14));
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, rate: 0 }]);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => computeTotals(items, taxRate), [items, taxRate]);

  function updateItem(i: number, patch: Partial<LineItem>) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function addItem() { setItems((a) => [...a, { description: "", quantity: 1, rate: 0 }]); }
  function removeItem(i: number) { setItems((a) => a.filter((_, idx) => idx !== i)); }

  async function save(status: "draft" | "sent") {
    if (!clientName.trim()) { toast.error("Client name required"); return; }
    if (items.some((i) => !i.description.trim())) { toast.error("Each line item needs a description"); return; }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error("Not signed in"); setSaving(false); return; }
    const { data, error } = await supabase.from("invoices").insert({
      user_id: u.user.id,
      invoice_number: number,
      client_name: clientName,
      client_email: clientEmail || null,
      issue_date: issueDate,
      due_date: dueDate,
      line_items: items as unknown as never,
      tax_rate: taxRate,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency,
      notes: notes || null,
      status,
    }).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "sent" ? "Invoice marked as sent" : "Draft saved");
    navigate({ to: "/app/invoice/$id", params: { id: data.id } });
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <p className="eyebrow text-muted-foreground">§ Compose</p>
      <h1 className="display mt-2 text-6xl">New invoice.</h1>

      <div className="mt-12 grid gap-12 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          {/* Meta */}
          <section className="rule-bottom pb-8">
            <h2 className="eyebrow mb-4 text-muted-foreground">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Invoice №"><input value={number} onChange={(e) => setNumber(e.target.value)} className={inputCls} /></Field>
              <Field label="Currency">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
                  <option>USD</option><option>EUR</option><option>GBP</option><option>NGN</option><option>KES</option><option>ZAR</option><option>INR</option>
                </select>
              </Field>
              <Field label="Issue date"><input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputCls} /></Field>
              <Field label="Due date"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} /></Field>
            </div>
          </section>

          {/* Client */}
          <section className="rule-bottom pb-8">
            <h2 className="eyebrow mb-4 text-muted-foreground">Billed to</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Client name"><input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} required /></Field>
              <Field label="Client email"><input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={inputCls} /></Field>
            </div>
          </section>

          {/* Items */}
          <section className="rule-bottom pb-8">
            <h2 className="eyebrow mb-4 text-muted-foreground">Line items</h2>
            <div className="flex flex-col gap-3">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_120px_36px] gap-3 items-center">
                  <input placeholder="Description" value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} className={inputCls} />
                  <input type="number" min="0" step="0.5" value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} className={inputCls} />
                  <input type="number" min="0" step="0.01" value={it.rate} onChange={(e) => updateItem(i, { rate: Number(e.target.value) })} className={inputCls} placeholder="Rate" />
                  <button onClick={() => removeItem(i)} disabled={items.length === 1} className="text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent">
              <Plus className="h-4 w-4" /> Add line
            </button>
          </section>

          {/* Notes */}
          <section>
            <h2 className="eyebrow mb-4 text-muted-foreground">Notes</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Payment terms, thank-you note…" className={inputCls + " resize-none"} />
          </section>
        </div>

        {/* Summary sidebar */}
        <aside className="self-start border border-foreground p-6 md:sticky md:top-24">
          <p className="eyebrow text-muted-foreground">Summary</p>
          <div className="mt-6 space-y-3 text-sm">
            <Row label="Subtotal" value={money(totals.subtotal, currency)} />
            <Row label={`Tax (${taxRate}%)`} value={money(totals.tax, currency)} />
          </div>
          <div className="mt-4">
            <label className="eyebrow text-muted-foreground">Tax %</label>
            <input type="number" min="0" max="100" step="0.5" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className={inputCls + " mt-1"} />
          </div>
          <div className="mt-6 rule-top pt-4">
            <p className="eyebrow text-muted-foreground">Total</p>
            <p className="display mt-1 text-5xl">{money(totals.total, currency)}</p>
          </div>
          <div className="mt-8 flex flex-col gap-2">
            <button disabled={saving} onClick={() => save("sent")} className="bg-foreground px-4 py-3 text-sm font-medium text-background hover:bg-accent transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Save & mark as sent"}
            </button>
            <button disabled={saving} onClick={() => save("draft")} className="border border-foreground px-4 py-3 text-sm font-medium hover:bg-foreground hover:text-background transition-colors disabled:opacity-50">
              Save as draft
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}

const inputCls = "w-full border-b border-foreground bg-transparent py-2 outline-none focus:border-accent text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
