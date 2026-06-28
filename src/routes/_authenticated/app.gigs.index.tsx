import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Plus, Search, MessageSquare } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/gigs/")({
  component: GigsPage,
});

const CATEGORIES = ["all", "design", "development", "writing", "marketing", "video", "general"];

function GigsPage() {
  const navigate = useNavigate();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "job" | "service">("all");

  const { data: gigs = [], isLoading } = useQuery({
    queryKey: ["gigs", cat, type],
    queryFn: async () => {
      let query = supabase.from("gigs").select("*, profiles:owner_id(display_name, avatar_url, role)").order("created_at", { ascending: false });
      if (cat !== "all") query = query.eq("category", cat);
      if (type !== "all") query = query.eq("type", type);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = gigs.filter((g) =>
    q ? g.title.toLowerCase().includes(q.toLowerCase()) || g.description.toLowerCase().includes(q.toLowerCase()) : true
  );

  async function contact(ownerId: string) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (u.user.id === ownerId) {
      toast.info("That's your own gig!");
      return;
    }
    const [a, b] = [u.user.id, ownerId].sort();
    const { data: existing } = await supabase.from("conversations").select("id").eq("user_a", a).eq("user_b", b).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data, error } = await supabase.from("conversations").insert({ user_a: a, user_b: b }).select("id").single();
      if (error) { toast.error(error.message); return; }
      convId = data.id;
    }
    navigate({ to: "/app/messages", search: { c: convId } });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 rule-bottom pb-6">
        <div>
          <p className="eyebrow text-muted-foreground">§ Marketplace</p>
          <h1 className="display mt-2 text-5xl">Gigs.</h1>
        </div>
        <Link to="/app/gigs/new" className="inline-flex items-center gap-2 bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:bg-foreground hover:text-background transition-colors">
          <Plus className="h-4 w-4" /> Post a gig
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gigs…"
            className="w-full border border-rule bg-transparent pl-10 pr-3 py-2.5 text-sm outline-none focus:border-accent" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="border border-rule bg-background px-3 py-2.5 text-sm focus:border-accent outline-none">
          <option value="all">All types</option>
          <option value="job">Jobs</option>
          <option value="service">Services</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1 text-xs uppercase tracking-widest border transition-colors ${cat === c ? "border-accent bg-accent text-accent-foreground" : "border-rule text-muted-foreground hover:border-foreground hover:text-foreground"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="py-16 text-center display italic text-3xl text-muted-foreground">No gigs found.</p>
        )}
        {filtered.map((g) => {
          const profile = (g as { profiles?: { display_name?: string | null; role?: string | null } }).profiles;
          return (
            <article key={g.id} className="border border-rule p-6 hover:border-accent transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 border ${g.type === "job" ? "border-accent text-accent" : "border-foreground"}`}>
                      {g.type === "job" ? "Job" : "Service"}
                    </span>
                    <span className="eyebrow text-muted-foreground">{g.category}</span>
                  </div>
                  <h3 className="mt-3 font-display text-2xl font-semibold">{g.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {g.tags?.map((t: string) => (
                      <span key={t} className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-secondary text-muted-foreground">{t}</span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Posted by <span className="text-foreground">{profile?.display_name ?? "Anonymous"}</span></p>
                </div>
                <div className="text-right">
                  <p className="display text-2xl text-accent">
                    {g.budget_min ? `${g.currency} ${g.budget_min}${g.budget_max ? `–${g.budget_max}` : "+"}` : "Open"}
                  </p>
                  <button onClick={() => contact(g.owner_id)} className="mt-3 inline-flex items-center gap-2 border border-foreground px-3 py-2 text-xs font-medium hover:bg-foreground hover:text-background transition-colors">
                    <MessageSquare className="h-3.5 w-3.5" /> Contact
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
