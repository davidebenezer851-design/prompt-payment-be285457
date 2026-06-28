import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import {
  Briefcase, Users, Wallet, LayoutGrid, Search, Bell, MessageSquare, Plus,
  Star, MapPin, X, Send, Shield, AlertTriangle, ArrowUpRight, DollarSign, Clock,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

type Tab = "jobs" | "talent" | "client" | "wallet";

const TABS: { id: Tab; label: string; icon: typeof Briefcase }[] = [
  { id: "jobs", label: "Browse Jobs", icon: Briefcase },
  { id: "talent", label: "Freelancer Directory", icon: Users },
  { id: "client", label: "Client Dashboard", icon: LayoutGrid },
  { id: "wallet", label: "Wallet & Escrow", icon: Wallet },
];

function Dashboard() {
  const [tab, setTab] = useState<Tab>("jobs");
  const [q, setQ] = useState("");
  const [applyTo, setApplyTo] = useState<any | null>(null);
  const [postOpen, setPostOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me-dash"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return { ...data, email: u.user.email, uid: u.user.id };
    },
  });

  useEffect(() => {
    if (me?.role === "employer") setTab("client");
  }, [me?.role]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top utility bar */}
      <div className="rule-bottom px-4 sm:px-8 py-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find jobs or freelancers…"
            className="w-full bg-secondary/60 border border-rule pl-9 pr-3 py-2 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>
        <button className="p-2 hover:text-accent transition-colors" aria-label="Notifications"><Bell className="h-5 w-5" /></button>
        <Link to="/app/messages" className="p-2 hover:text-accent transition-colors" aria-label="Messages"><MessageSquare className="h-5 w-5" /></Link>
      </div>

      {/* Tabs */}
      <div className="rule-bottom px-4 sm:px-8 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${active ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="h-4 w-4" /> {t.label}
                {active && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-8 py-8 max-w-7xl mx-auto w-full">
        {tab === "jobs" && <JobsView q={q} onApply={setApplyTo} />}
        {tab === "talent" && <TalentView q={q} />}
        {tab === "client" && <ClientView q={q} me={me} onPost={() => setPostOpen(true)} />}
        {tab === "wallet" && <WalletView me={me} />}
      </div>

      {applyTo && <ApplyDrawer gig={applyTo} onClose={() => setApplyTo(null)} />}
      {postOpen && <PostJobModal onClose={() => setPostOpen(false)} />}
    </div>
  );
}

/* ---------------- Browse Jobs ---------------- */
function JobsView({ q, onApply }: { q: string; onApply: (g: any) => void }) {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs-feed"],
    queryFn: async () => {
      const { data } = await supabase.from("gigs").select("*, profiles:owner_id(display_name)").eq("type", "job").eq("status", "open").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!q) return jobs;
    const s = q.toLowerCase();
    return jobs.filter((j: any) => j.title.toLowerCase().includes(s) || j.description.toLowerCase().includes(s) || (j.tags ?? []).some((t: string) => t.toLowerCase().includes(s)));
  }, [jobs, q]);

  return (
    <section>
      <Header eyebrow="§ Open jobs" title="Browse jobs" sub="Real briefs from real clients. Apply with one click." />
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && filtered.length === 0 && <Empty text="No jobs match your search." />}
      <div className="mt-6 space-y-3">
        {filtered.map((j: any) => (
          <article key={j.id} className="group border border-rule p-5 hover:border-accent transition-all hover:translate-x-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-accent/15 text-accent border border-accent/30">
                    {j.budget_min ? "Fixed" : "Hourly"}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{j.category}</span>
                </div>
                <h3 className="mt-2 font-display text-xl font-semibold">{j.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{j.description}</p>
                {j.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {j.tags.slice(0, 6).map((t: string) => (
                      <span key={t} className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-secondary text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">Posted by {j.profiles?.display_name ?? "Client"}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-3 shrink-0">
                <p className="text-accent font-display font-semibold whitespace-nowrap">
                  {j.budget_min ? `${j.currency} ${j.budget_min}${j.budget_max ? `–${j.budget_max}` : "+"}` : "Open"}
                </p>
                <button onClick={() => onApply(j)} className="bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold hover:bg-foreground hover:text-background transition-colors inline-flex items-center gap-1.5">
                  Apply Now <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Talent ---------------- */
function TalentView({ q }: { q: string }) {
  const { data: people = [], isLoading } = useQuery({
    queryKey: ["talent-feed"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("role", "freelancer").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!q) return people;
    const s = q.toLowerCase();
    return people.filter((p: any) => (p.display_name ?? "").toLowerCase().includes(s) || (p.headline ?? "").toLowerCase().includes(s) || (p.skills ?? []).some((t: string) => t.toLowerCase().includes(s)));
  }, [people, q]);

  return (
    <section>
      <Header eyebrow="§ Talent directory" title="Hire freelancers" sub="Hand-picked makers, designers, devs and writers." />
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && filtered.length === 0 && <Empty text="No freelancers yet." />}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p: any) => (
          <article key={p.id} className="group border border-rule p-5 hover:border-accent hover:bg-secondary/30 transition-all">
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 bg-accent text-accent-foreground grid place-items-center font-display text-xl font-bold">
                {(p.display_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg font-semibold truncate">{p.display_name ?? "Anonymous"}</p>
                <p className="text-xs text-muted-foreground truncate">{p.headline ?? "Freelancer"}</p>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-accent text-accent" />)}
                  <span className="text-muted-foreground ml-1">5.0</span>
                </div>
              </div>
            </div>
            {p.bio && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.bio}</p>}
            {p.skills?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.skills.slice(0, 4).map((s: string) => (
                  <span key={s} className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-secondary text-muted-foreground">{s}</span>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between rule-top pt-3">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                {p.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location}</span>}
                {p.hourly_rate && <span className="text-accent font-semibold">${p.hourly_rate}/hr</span>}
              </div>
              <button onClick={() => hireFreelancer(p.id)} className="bg-foreground text-background px-3 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-foreground transition-colors">
                Hire
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

async function hireFreelancer(otherId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  if (u.user.id === otherId) { toast.info("That's you."); return; }
  const [a, b] = [u.user.id, otherId].sort();
  const { data: existing } = await supabase.from("conversations").select("id").eq("user_a", a).eq("user_b", b).maybeSingle();
  let convId = existing?.id;
  if (!convId) {
    const { data, error } = await supabase.from("conversations").insert({ user_a: a, user_b: b }).select("id").single();
    if (error) { toast.error(error.message); return; }
    convId = data.id;
  }
  window.location.href = `/app/messages?c=${convId}`;
}

/* ---------------- Client Dashboard ---------------- */
function ClientView({ q, me, onPost }: { q: string; me: any; onPost: () => void }) {
  const { data: mine = [] } = useQuery({
    queryKey: ["my-postings", me?.uid],
    enabled: !!me?.uid,
    queryFn: async () => {
      const { data } = await supabase.from("gigs").select("*").eq("owner_id", me.uid).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!q) return mine;
    const s = q.toLowerCase();
    return mine.filter((j: any) => j.title.toLowerCase().includes(s));
  }, [mine, q]);

  return (
    <section>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <Header eyebrow="§ Your postings" title="Client dashboard" sub="Post jobs, track applications, manage your hires." />
        <button onClick={onPost} className="bg-accent text-accent-foreground px-5 py-2.5 text-sm font-semibold hover:bg-foreground hover:text-background transition-colors inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Post a New Job
        </button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Active postings" value={mine.filter((m: any) => m.status === "open").length} />
        <Stat label="Total jobs" value={mine.length} />
        <Stat label="Categories" value={new Set(mine.map((m: any) => m.category)).size} />
      </div>

      <div className="mt-8 space-y-3">
        <p className="eyebrow text-muted-foreground">Your jobs</p>
        {filtered.length === 0 && <Empty text="No postings yet. Click 'Post a New Job' to get started." />}
        {filtered.map((j: any) => (
          <article key={j.id} className="border border-rule p-5 hover:border-accent transition-colors flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{j.category}</span>
                <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 ${j.status === "open" ? "bg-accent/15 text-accent border border-accent/30" : "bg-secondary text-muted-foreground"}`}>{j.status}</span>
              </div>
              <h3 className="mt-1 font-display text-lg font-semibold">{j.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{j.description}</p>
            </div>
            <p className="text-sm text-accent whitespace-nowrap">
              {j.budget_min ? `${j.currency} ${j.budget_min}${j.budget_max ? `–${j.budget_max}` : "+"}` : "Open"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Wallet ---------------- */
function WalletView({ me }: { me: any }) {
  const { data: txs = [] } = useQuery({
    queryKey: ["my-tx", me?.uid],
    enabled: !!me?.uid,
    queryFn: async () => {
      const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const available = txs.filter((t: any) => t.status === "available").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const escrow = txs.filter((t: any) => t.status === "escrow").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const pending = txs.filter((t: any) => t.status === "pending").reduce((s: number, t: any) => s + Number(t.amount), 0);

  return (
    <section>
      <Header eyebrow="§ Wallet" title="Wallet & Escrow" sub="Track balances, escrow funds, and payouts." />

      <div className="mt-4 border border-accent/40 bg-accent/10 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <p className="text-sm">
          <span className="font-semibold text-accent">Payouts are securely handled via Stripe Connect.</span>{" "}
          <span className="text-muted-foreground">Please check regional availability before onboarding.</span>
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <BalanceCard label="Available Balance" amount={available} icon={DollarSign} accent />
        <BalanceCard label="Funds in Escrow" amount={escrow} icon={Shield} />
        <BalanceCard label="Pending Payouts" amount={pending} icon={Clock} />
      </div>

      <div className="mt-10">
        <p className="eyebrow text-muted-foreground rule-bottom pb-3">Recent transactions</p>
        {txs.length === 0 && <Empty text="No transactions yet. Hire a freelancer or complete a job to see activity here." />}
        <div className="mt-3 space-y-2">
          {txs.map((t: any) => (
            <div key={t.id} className="border border-rule p-4 flex items-center justify-between hover:border-accent transition-colors">
              <div>
                <p className="font-display font-semibold capitalize">{t.kind}</p>
                <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()} · ref {t.reference ?? "—"}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-accent">{t.currency} {Number(t.amount).toFixed(2)}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Atoms ---------------- */
function Header({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div>
      <p className="eyebrow text-muted-foreground">{eyebrow}</p>
      <h1 className="display mt-1 text-4xl md:text-5xl">{title}</h1>
      <p className="mt-2 text-muted-foreground max-w-xl">{sub}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-rule p-5 hover:border-accent transition-colors">
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
    </div>
  );
}

function BalanceCard({ label, amount, icon: Icon, accent }: { label: string; amount: number; icon: typeof DollarSign; accent?: boolean }) {
  return (
    <div className={`border p-5 transition-colors ${accent ? "border-accent bg-accent/5" : "border-rule hover:border-accent"}`}>
      <div className="flex items-center justify-between">
        <p className="eyebrow text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${accent ? "text-accent" : "text-muted-foreground"}`} />
      </div>
      <p className={`mt-3 font-display text-3xl ${accent ? "text-accent" : ""}`}>${amount.toFixed(2)}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-12 text-center text-sm italic text-muted-foreground border border-dashed border-rule">{text}</p>;
}

/* ---------------- Apply Drawer ---------------- */
function ApplyDrawer({ gig, onClose }: { gig: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [cover, setCover] = useState("");
  const [bid, setBid] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error("Sign in"); setBusy(false); return; }
    const { error } = await supabase.from("proposals").insert({
      gig_id: gig.id, freelancer_id: u.user.id, cover_letter: cover, bid_amount: bid ? Number(bid) : null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Proposal sent.");
    qc.invalidateQueries({ queryKey: ["jobs-feed"] });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button className="flex-1 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <aside className="w-full max-w-md bg-background border-l border-rule p-6 overflow-y-auto animate-in slide-in-from-right">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-muted-foreground">Apply to</p>
            <h2 className="display text-2xl mt-1">{gig.title}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-accent"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{gig.description}</p>

        <label className="mt-6 block">
          <span className="eyebrow text-muted-foreground">Cover letter</span>
          <textarea value={cover} onChange={(e) => setCover(e.target.value)} rows={6}
            className="mt-2 w-full bg-secondary/60 border border-rule p-3 text-sm outline-none focus:border-accent resize-none"
            placeholder="Why you, why this gig…" />
        </label>
        <label className="mt-4 block">
          <span className="eyebrow text-muted-foreground">Your bid ({gig.currency})</span>
          <input value={bid} onChange={(e) => setBid(e.target.value)} type="number" inputMode="decimal"
            className="mt-2 w-full bg-secondary/60 border border-rule px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder={gig.budget_min ?? "0"} />
        </label>

        <button onClick={submit} disabled={busy || !cover.trim()}
          className="mt-6 w-full bg-accent text-accent-foreground px-4 py-3 text-sm font-semibold hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-2">
          <Send className="h-4 w-4" /> {busy ? "Sending…" : "Send Proposal"}
        </button>
      </aside>
    </div>
  );
}

/* ---------------- Post Job Modal ---------------- */
function PostJobModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setBusy(false); return; }
    const { error } = await supabase.from("gigs").insert({
      owner_id: u.user.id, title, description: desc, type: "job",
      budget_min: budget ? Number(budget) : null, currency: "USD", category: "general",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Job posted.");
    qc.invalidateQueries({ queryKey: ["my-postings"] });
    qc.invalidateQueries({ queryKey: ["jobs-feed"] });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-background border border-rule p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow text-muted-foreground">New posting</p>
            <h2 className="display text-2xl mt-1">Post a Job</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-accent"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="eyebrow text-muted-foreground">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full bg-secondary/60 border border-rule px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Logo design for SaaS startup" />
          </label>
          <label className="block">
            <span className="eyebrow text-muted-foreground">Budget (USD)</span>
            <input value={budget} onChange={(e) => setBudget(e.target.value)} type="number"
              className="mt-2 w-full bg-secondary/60 border border-rule px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="500" />
          </label>
          <label className="block">
            <span className="eyebrow text-muted-foreground">Description</span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5}
              className="mt-2 w-full bg-secondary/60 border border-rule p-3 text-sm outline-none focus:border-accent resize-none"
              placeholder="What needs to be done, deliverables, deadline…" />
          </label>
        </div>

        <button onClick={submit} disabled={busy || !title.trim() || !desc.trim()}
          className="mt-6 w-full bg-accent text-accent-foreground px-4 py-3 text-sm font-semibold hover:bg-foreground hover:text-background transition-colors disabled:opacity-40">
          {busy ? "Posting…" : "Publish Job"}
        </button>
      </div>
    </div>
  );
}
