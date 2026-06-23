import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Freelancify — Invoices that get paid." },
      { name: "description", content: "The invoicing tool for freelancers who'd rather be working. Send a beautiful invoice, get paid, auto-chase what's late." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Marquee />
      <Sections />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="rule-bottom sticky top-0 z-30 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-serif text-2xl tracking-tight">Freelancify<span className="text-accent">.</span></Link>
        <nav className="hidden gap-8 text-sm md:flex">
          <a href="#how" className="hover:text-accent">How it works</a>
          <a href="#features" className="hover:text-accent">Features</a>
          <a href="#pricing" className="hover:text-accent">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden text-sm hover:text-accent md:inline">Sign in</Link>
          <Link to="/auth" search={{ mode: "signup" }} className="bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent transition-colors">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="rule-bottom mx-auto max-w-7xl px-6 py-20 md:py-32">
      <p className="eyebrow text-muted-foreground">Vol. 01 — Invoicing, redesigned for freelancers</p>
      <h1 className="display mt-6 text-[12vw] leading-[0.92] md:text-[8.5rem]">
        Get paid.<br /><span className="italic text-accent">Politely.</span>
      </h1>
      <div className="mt-10 grid gap-10 md:grid-cols-3">
        <div className="md:col-span-1">
          <p className="text-lg leading-relaxed text-muted-foreground">
            Freelancify turns five seconds of typing into an invoice your client actually wants to pay — then chases them so you don't have to.
          </p>
        </div>
        <div className="md:col-span-1 md:col-start-3 flex flex-col gap-3">
          <Link to="/auth" search={{ mode: "signup" }} className="group flex items-center justify-between bg-foreground px-5 py-4 text-background hover:bg-accent transition-colors">
            <span className="text-sm font-medium">Start free — no card</span>
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:rotate-45" />
          </Link>
          <Link to="/auth" className="group flex items-center justify-between border border-foreground px-5 py-4 hover:bg-foreground hover:text-background transition-colors">
            <span className="text-sm font-medium">Sign in</span>
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:rotate-45" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ["Auto-reminders", "Stripe-ready", "Branded PDFs", "Late-fee logic", "WhatsApp nudges", "White-label", "Recurring invoices"];
  return (
    <div className="rule-bottom overflow-hidden bg-foreground py-5 text-background">
      <div className="flex animate-[scroll_30s_linear_infinite] gap-12 whitespace-nowrap eyebrow">
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-12">{t} <span className="text-accent">✦</span></span>
        ))}
      </div>
      <style>{`@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

function Sections() {
  const steps = [
    { n: "01", t: "Type the job", d: "Client, line items, tax, due date. The form takes less than a minute." },
    { n: "02", t: "Send the invoice", d: "A beautifully typeset PDF lands in your client's inbox with a one-click pay link." },
    { n: "03", t: "Get paid", d: "Stripe or your local gateway settles funds. The invoice marks itself paid." },
    { n: "04", t: "Let us chase", d: "Polite emails 3 days before, on the day, and 3 days after. WhatsApp nudges on Gold." },
  ];
  return (
    <section id="how" className="rule-bottom mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-2 md:grid-cols-3">
        <p className="eyebrow text-muted-foreground">§ The Pipeline</p>
        <h2 className="display col-span-2 text-5xl md:text-7xl">From typed to <span className="italic text-accent">paid</span>, in four moves.</h2>
      </div>
      <div className="mt-16 grid gap-px bg-rule md:grid-cols-2">
        {steps.map((s) => (
          <div key={s.n} className="flex flex-col gap-4 bg-background p-8">
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-3xl">{s.n}</span>
              <span className="eyebrow text-accent">Step</span>
            </div>
            <h3 className="text-2xl">{s.t}</h3>
            <p className="text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    { name: "Free", price: "$0", note: "Forever", features: ["Up to 3 invoices/mo", "Branded PDF", "Stripe checkout", "Paid status tracking"], cta: "Start free" },
    { name: "Pro", price: "$12", note: "/month", features: ["Unlimited invoices", "Auto email reminders", "Late-fee automation", "Recurring invoices"], cta: "Go Pro", featured: true },
    { name: "Gold", price: "$29", note: "/month", features: ["Everything in Pro", "WhatsApp + SMS nudges", "White-label branding", "Custom domain"], cta: "Try 14 days free" },
  ];
  return (
    <section id="pricing" className="rule-bottom mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-2 md:grid-cols-3">
        <p className="eyebrow text-muted-foreground">§ Pricing</p>
        <h2 className="display col-span-2 text-5xl md:text-7xl">Honest. <span className="italic text-accent">Flat.</span></h2>
      </div>
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.name} className={`flex flex-col border ${t.featured ? "border-foreground bg-foreground text-background" : "border-rule"} p-8`}>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl">{t.name}</h3>
              {t.featured && <span className="eyebrow text-accent">Recommended</span>}
            </div>
            <p className="mt-6"><span className="display text-6xl">{t.price}</span><span className="text-sm opacity-70">{t.note}</span></p>
            <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-accent shrink-0" />{f}</li>
              ))}
            </ul>
            <Link to="/auth" search={{ mode: "signup" }} className={`mt-8 text-center px-4 py-3 text-sm font-medium transition-colors ${t.featured ? "bg-accent text-background hover:bg-background hover:text-foreground" : "bg-foreground text-background hover:bg-accent"}`}>
              {t.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="rule-bottom mx-auto max-w-7xl px-6 py-24 text-center">
      <p className="eyebrow text-muted-foreground">§ The last line</p>
      <h2 className="display mx-auto mt-6 max-w-4xl text-5xl md:text-8xl">
        Your work is <span className="italic text-accent">good</span>.<br />Your invoices should be too.
      </h2>
      <Link to="/auth" search={{ mode: "signup" }} className="mt-12 inline-flex items-center gap-2 bg-foreground px-8 py-4 text-background hover:bg-accent transition-colors">
        Create your first invoice <ArrowUpRight className="h-5 w-5" />
      </Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-6 py-12 text-sm text-muted-foreground">
      <div className="flex flex-wrap justify-between gap-4">
        <p>© {new Date().getFullYear()} Freelancify Press.</p>
        <p className="italic">Set in Instrument Serif & Inter.</p>
      </div>
    </footer>
  );
}
