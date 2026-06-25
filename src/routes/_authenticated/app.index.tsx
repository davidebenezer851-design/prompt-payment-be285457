import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, MessageSquare, Users, FileText, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return data;
    },
  });

  const { data: gigs = [] } = useQuery({
    queryKey: ["gigs-recent"],
    queryFn: async () => {
      const { data } = await supabase.from("gigs").select("*").order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const name = profile?.display_name ?? "there";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
      <p className="eyebrow text-muted-foreground">§ Dashboard</p>
      <h1 className="display mt-2 text-5xl md:text-6xl">Hey, {name}.</h1>
      <p className="mt-3 text-muted-foreground">
        {profile?.role === "employer" ? "Post a gig, find talent, and start collaborating." : "Find your next gig and grow your freelance business."}
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickCard to="/app/gigs" icon={Briefcase} label="Browse Gigs" />
        <QuickCard to="/app/freelancers" icon={Users} label="Find Talent" />
        <QuickCard to="/app/messages" icon={MessageSquare} label="Messages" />
        <QuickCard to="/app/invoices" icon={FileText} label="Invoices" />
      </div>

      <section className="mt-14">
        <div className="flex items-end justify-between rule-bottom pb-3">
          <h2 className="display text-3xl">Latest gigs</h2>
          <Link to="/app/gigs" className="text-sm text-muted-foreground hover:text-accent inline-flex items-center gap-1">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="mt-4 space-y-2">
          {gigs.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground italic">No gigs posted yet. Be the first.</p>}
          {gigs.map((g) => (
            <Link key={g.id} to="/app/gigs" className="block border border-rule p-4 hover:border-accent transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow text-muted-foreground">{g.type === "job" ? "JOB" : "SERVICE"} · {g.category}</p>
                  <p className="font-display text-lg font-semibold mt-1">{g.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{g.description}</p>
                </div>
                <p className="text-sm text-accent whitespace-nowrap">
                  {g.budget_min ? `${g.currency} ${g.budget_min}${g.budget_max ? `–${g.budget_max}` : "+"}` : "—"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function QuickCard({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="group border border-rule p-5 hover:border-accent hover:bg-secondary/40 transition-colors">
      <Icon className="h-6 w-6 text-accent" />
      <p className="mt-3 font-display text-base font-semibold">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1 group-hover:text-accent">Open <ArrowUpRight className="h-3 w-3" /></p>
    </Link>
  );
}
