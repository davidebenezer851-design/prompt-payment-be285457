import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { MessageSquare, MapPin } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/freelancers")({
  component: Talent,
});

function Talent() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"freelancer" | "employer">("freelancer");

  const { data: people = [], isLoading } = useQuery({
    queryKey: ["people", role],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("role", role).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function chat(otherId: string) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (u.user.id === otherId) { toast.info("That's you!"); return; }
    const [a, b] = [u.user.id, otherId].sort();
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
      <p className="eyebrow text-muted-foreground">§ Community</p>
      <h1 className="display mt-2 text-5xl">{role === "freelancer" ? "Talent." : "Employers."}</h1>

      <div className="mt-6 inline-flex border border-rule">
        <button onClick={() => setRole("freelancer")} className={`px-4 py-2 text-sm ${role === "freelancer" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>Freelancers</button>
        <button onClick={() => setRole("employer")} className={`px-4 py-2 text-sm ${role === "employer" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>Employers</button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && people.length === 0 && <p className="text-sm text-muted-foreground italic">No one here yet.</p>}
        {people.map((p) => (
          <article key={p.id} className="border border-rule p-5 hover:border-accent transition-colors">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 bg-accent text-accent-foreground grid place-items-center font-display text-lg font-bold">
                {(p.display_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg font-semibold truncate">{p.display_name ?? "Anonymous"}</p>
                <p className="text-xs text-muted-foreground truncate">{p.headline ?? (p.role === "freelancer" ? "Freelancer" : "Employer")}</p>
              </div>
            </div>
            {p.bio && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.bio}</p>}
            {p.skills?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {p.skills.slice(0, 4).map((s: string) => (
                  <span key={s} className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-secondary text-muted-foreground">{s}</span>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {p.location && <><MapPin className="h-3 w-3" />{p.location}</>}
                {p.hourly_rate && <span className="ml-2 text-accent">${p.hourly_rate}/hr</span>}
              </div>
              <button onClick={() => chat(p.id)} className="inline-flex items-center gap-1.5 border border-foreground px-3 py-1.5 text-xs font-medium hover:bg-foreground hover:text-background transition-colors">
                <MessageSquare className="h-3 w-3" /> Message
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
