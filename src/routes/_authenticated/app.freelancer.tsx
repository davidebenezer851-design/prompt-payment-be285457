import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Plus, Sparkles, Users, MessageSquare, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/freelancer")({
  component: FreelancerHub,
});

function FreelancerHub() {
  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return data;
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["employer-jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gigs")
        .select("*, profiles:owner_id(display_name, role)")
        .eq("type", "job")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["freelancer-services"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gigs")
        .select("*, profiles:owner_id(display_name, role)")
        .eq("type", "service")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
      <p className="eyebrow text-muted-foreground">§ Freelancer hub</p>
      <h1 className="display mt-2 text-5xl md:text-6xl">
        Welcome, <span className="italic text-accent">{profile?.display_name ?? "friend"}</span>.
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Post a service, scroll real jobs from employers, and check out what other freelancers are shipping.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Tile to="/app/gigs/new" icon={Plus} title="Post a service" desc="List what you do, your rate, and samples." accent />
        <Tile to="/app/gigs" icon={Briefcase} title="Find work" desc="Jobs employers are hiring for, right now." />
        <Tile to="/app/freelancers" icon={Users} title="Peers" desc="See other freelancers' profiles & work." />
      </div>

      <Section title="Jobs from employers" link="/app/gigs">
        {jobs.length === 0 && <Empty text="No employer jobs yet." />}
        {jobs.map((g) => <GigRow key={g.id} g={g} />)}
      </Section>

      <Section title="Services from other freelancers" link="/app/gigs">
        {services.length === 0 && <Empty text="Be the first to post a service." />}
        {services.map((g) => <GigRow key={g.id} g={g} />)}
      </Section>
    </main>
  );
}

function Tile({ to, icon: Icon, title, desc, accent }: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string; accent?: boolean }) {
  return (
    <Link to={to} className={`group border p-5 transition-colors ${accent ? "border-accent bg-accent/10 hover:bg-accent hover:text-accent-foreground" : "border-rule hover:border-accent"}`}>
      <Icon className="h-6 w-6" />
      <p className="mt-3 font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground group-hover:text-current/70">{desc}</p>
    </Link>
  );
}

function Section({ title, link, children }: { title: string; link: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="flex items-end justify-between rule-bottom pb-3">
        <h2 className="display text-3xl flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> {title}</h2>
        <Link to={link} className="text-sm text-muted-foreground hover:text-accent inline-flex items-center gap-1">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="sm:col-span-2 py-8 text-center text-sm italic text-muted-foreground">{text}</p>;
}

function GigRow({ g }: { g: { id: string; title: string; description: string; category: string; budget_min: number | null; budget_max: number | null; currency: string; type: string; profiles?: { display_name?: string | null } | null } }) {
  return (
    <Link to="/app/gigs" className="block border border-rule p-4 hover:border-accent transition-colors">
      <p className="eyebrow text-muted-foreground">{g.category}</p>
      <p className="mt-1 font-display text-lg font-semibold line-clamp-1">{g.title}</p>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{g.description}</p>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{g.profiles?.display_name ?? "—"}</span>
        <span className="text-accent">{g.budget_min ? `${g.currency} ${g.budget_min}${g.budget_max ? `–${g.budget_max}` : "+"}` : "Open"}</span>
      </div>
    </Link>
  );
}
