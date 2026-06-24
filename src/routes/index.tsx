import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, Zap, Send, BadgeDollarSign, Bell } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InstaGig — Invoices that get paid." },
      { name: "description", content: "Send a beautiful invoice in 60 seconds. Get paid by card. Let us chase the late ones — politely, automatically." },
    ],
  }),
  component: Landing,
});

function Landing() {
  useReveal();
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Nav />
      <Hero />
      <Marquee />
      <Sections />
      <Showcase />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-rule">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center bg-accent text-accent-foreground text-[11px] font-bold">F</span>
          InstaGig
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="hidden text-sm text-muted-foreground hover:text-foreground md:inline transition-colors">Sign in</Link>
          <Link to="/auth" search={{ mode: "signup" }} className="group inline-flex items-center gap-1.5 bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-foreground hover:text-background transition-colors">
            Get started <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative grain overflow-hidden border-b border-rule">
      {/* Red orb */}
      <div className="pointer-events-none absolute -right-40 top-10 h-[36rem] w-[36rem] rounded-full bg-accent/30 blur-[140px]" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-[24rem] w-[24rem] rounded-full bg-accent/15 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-32 md:pb-32">
        <div className="inline-flex items-center gap-2 border border-rule bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur reveal">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          v01 — Built for freelancers who'd rather be working
        </div>

        <h1 className="display mt-8 text-[15vw] md:text-[10rem] leading-[0.92]">
          <span className="hero-line"><span>Get paid.</span></span>
          <span className="hero-line delay-2">
            <span className="display-serif hero-shimmer hero-cursor">Politely.</span>
          </span>
        </h1>

        <div className="mt-12 grid gap-10 md:grid-cols-12 md:items-end reveal">
          <p className="md:col-span-5 text-lg leading-relaxed text-muted-foreground">
            InstaGig turns five seconds of typing into an invoice your client <em className="text-foreground not-italic">actually</em> wants to pay — then chases the late ones so you don't have to.
          </p>
          <div className="md:col-span-4 md:col-start-9 flex flex-col gap-3">
            <Link to="/auth" search={{ mode: "signup" }} className="group flex items-center justify-between bg-accent px-5 py-4 text-accent-foreground hover:bg-foreground hover:text-background transition-colors glow-blood">
              <span className="text-sm font-medium">Start free — no card</span>
              <ArrowUpRight className="h-5 w-5 transition-transform group-hover:rotate-45" />
            </Link>
            <Link to="/auth" className="group flex items-center justify-between border border-foreground/30 px-5 py-4 hover:border-foreground hover:bg-foreground hover:text-background transition-colors">
              <span className="text-sm font-medium">Sign in</span>
              <ArrowUpRight className="h-5 w-5 transition-transform group-hover:rotate-45" />
            </Link>
          </div>
        </div>

        {/* stat row */}
        <div className="mt-20 grid grid-cols-2 gap-px bg-rule md:grid-cols-4 reveal">
          {[
            { k: "60s", v: "to draft an invoice" },
            { k: "0%", v: "platform fee" },
            { k: "3", v: "auto-reminders" },
            { k: "24/7", v: "Stripe payouts" },
          ].map((s) => (
            <div key={s.v} className="bg-background p-6">
              <div className="display text-5xl text-accent">{s.k}</div>
              <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ["Auto-reminders", "Stripe-ready", "Branded PDFs", "Late-fee logic", "WhatsApp nudges", "White-label", "Recurring invoices"];
  return (
    <div className="overflow-hidden bg-accent py-4 text-accent-foreground border-b border-rule">
      <div className="flex animate-[scroll_30s_linear_infinite] gap-12 whitespace-nowrap eyebrow">
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-12">{t} <span>✦</span></span>
        ))}
      </div>
      <style>{`@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

function Sections() {
  const steps = [
    { n: "01", icon: Zap, t: "Type the job", d: "Client, line items, tax, due date. Less than a minute. Pre-filled templates for repeat clients." },
    { n: "02", icon: Send, t: "Send the invoice", d: "A beautifully typeset PDF lands in your client's inbox with a one-click pay link." },
    { n: "03", icon: BadgeDollarSign, t: "Get paid", d: "Stripe or your local gateway settles funds. The invoice marks itself paid." },
    { n: "04", icon: Bell, t: "Let us chase", d: "Polite emails 3 days before, on the day, and 3 days after. WhatsApp nudges on Gold." },
  ];
  return (
    <section id="how" className="border-b border-rule">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-2 md:grid-cols-12">
          <p className="eyebrow text-accent md:col-span-3">§ The Pipeline</p>
          <h2 className="display md:col-span-9 text-5xl md:text-7xl">
            From typed to <span className="display-serif text-accent">paid</span>,<br />in four moves.
          </h2>
        </div>
        <div className="mt-16 grid gap-px bg-rule md:grid-cols-2">
          {steps.map(({ n, t, d, icon: Icon }) => (
            <div key={n} className="group relative flex flex-col gap-4 bg-background p-10 hover:bg-card transition-colors">
              <div className="flex items-center justify-between">
                <span className="display text-5xl text-muted-foreground/40 group-hover:text-accent transition-colors">{n}</span>
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="display text-3xl mt-4">{t}</h3>
              <p className="text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section id="features" className="border-b border-rule">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-12 md:items-center">
          <div className="md:col-span-5">
            <p className="eyebrow text-accent">§ Designed, not generated</p>
            <h2 className="display mt-4 text-5xl md:text-6xl">
              Invoices that don't look like a <span className="display-serif text-accent">spreadsheet</span>.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Every InstaGig invoice is typeset with intent. Clean hierarchy, no clipart, no Comic Sans. Your client sees a document that says you take your work seriously — and pays it accordingly.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {["Auto-numbered & dated", "Tax + discount logic baked in", "Currency-aware for global clients", "One-click PDF export"].map((f) => (
                <li key={f} className="flex items-center gap-3"><Check className="h-4 w-4 text-accent" />{f}</li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-7">
            <FakeInvoice />
          </div>
        </div>
      </div>
    </section>
  );
}

function FakeInvoice() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-accent/20 blur-3xl" />
      <div className="relative bg-card border border-rule p-8 md:p-10 shadow-2xl">
        <div className="flex justify-between items-start">
          <div>
            <div className="eyebrow text-muted-foreground">Invoice</div>
            <div className="display text-3xl mt-1">№ 0042</div>
          </div>
          <div className="text-right">
            <div className="eyebrow text-muted-foreground">Due</div>
            <div className="text-sm mt-1">14 Jul 2026</div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="eyebrow text-muted-foreground">From</div>
            <div className="mt-1">Studio Vermilion</div>
            <div className="text-muted-foreground">hello@vermilion.co</div>
          </div>
          <div>
            <div className="eyebrow text-muted-foreground">To</div>
            <div className="mt-1">Northwind Coffee</div>
            <div className="text-muted-foreground">ops@northwind.cafe</div>
          </div>
        </div>
        <div className="mt-8 border-t border-rule">
          {[
            { d: "Brand identity system", q: 1, p: 4200 },
            { d: "Web design — landing", q: 1, p: 2800 },
            { d: "Packaging mockups", q: 3, p: 480 },
          ].map((r) => (
            <div key={r.d} className="grid grid-cols-12 py-3 border-b border-rule text-sm">
              <div className="col-span-7">{r.d}</div>
              <div className="col-span-2 text-muted-foreground">×{r.q}</div>
              <div className="col-span-3 text-right">${(r.q * r.p).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-between items-baseline">
          <div className="eyebrow text-muted-foreground">Total due</div>
          <div className="display text-5xl text-accent">$8,440</div>
        </div>
      </div>
    </div>
  );
}

function Pricing() {
  const tiers = [
    { name: "Free", price: "$0", note: "Forever", features: ["Up to 3 invoices/mo", "Branded PDF", "Stripe checkout", "Paid status tracking"], cta: "Start free" },
    { name: "Pro", price: "$12", note: "/month", features: ["Unlimited invoices", "Auto email reminders", "Late-fee automation", "Recurring invoices"], cta: "Go Pro", featured: true },
    { name: "Gold", price: "$29", note: "/month", features: ["Everything in Pro", "WhatsApp + SMS nudges", "White-label branding", "Custom domain"], cta: "Try 14 days free" },
  ];
  return (
    <section id="pricing" className="border-b border-rule">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-2 md:grid-cols-12">
          <p className="eyebrow text-accent md:col-span-3">§ Pricing</p>
          <h2 className="display md:col-span-9 text-5xl md:text-7xl">
            Honest. <span className="display-serif text-accent">Flat.</span>
          </h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.name} className={`relative flex flex-col p-8 transition-all ${t.featured ? "bg-accent text-accent-foreground glow-blood" : "bg-card border border-rule hover:border-foreground/40"}`}>
              {t.featured && (
                <span className="absolute -top-3 left-8 bg-foreground text-background px-2 py-0.5 text-[10px] uppercase tracking-widest font-medium">Recommended</span>
              )}
              <h3 className="display text-3xl">{t.name}</h3>
              <p className="mt-6"><span className="display text-6xl">{t.price}</span><span className="text-sm opacity-70">{t.note}</span></p>
              <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2"><Check className={`h-4 w-4 mt-0.5 shrink-0 ${t.featured ? "text-accent-foreground" : "text-accent"}`} />{f}</li>
                ))}
              </ul>
              <Link to="/auth" search={{ mode: "signup" }} className={`mt-8 group flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${t.featured ? "bg-foreground text-background hover:bg-background hover:text-foreground" : "bg-accent text-accent-foreground hover:bg-foreground hover:text-background"}`}>
                {t.cta} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative border-b border-rule overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-accent/10 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[160px]" />
      <div className="relative mx-auto max-w-7xl px-6 py-32 text-center">
        <p className="eyebrow text-accent">§ The last line</p>
        <h2 className="display mx-auto mt-6 max-w-4xl text-5xl md:text-8xl">
          Your work is <span className="display-serif text-accent">good</span>.<br />Your invoices should be too.
        </h2>
        <Link to="/auth" search={{ mode: "signup" }} className="group mt-12 inline-flex items-center gap-2 bg-accent px-8 py-4 text-accent-foreground hover:bg-foreground hover:text-background transition-colors glow-blood">
          Create your first invoice <ArrowUpRight className="h-5 w-5 transition-transform group-hover:rotate-45" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-6 py-12 text-sm text-muted-foreground">
      <div className="flex flex-wrap justify-between gap-4">
        <p>© {new Date().getFullYear()} InstaGig.</p>
        <p>Set in Space Grotesk, Instrument Serif & Inter.</p>
      </div>
    </footer>
  );
}
