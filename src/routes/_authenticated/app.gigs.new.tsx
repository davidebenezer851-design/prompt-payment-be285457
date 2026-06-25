import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/gigs/new")({
  component: NewGig,
});

function NewGig() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [type, setType] = useState<"job" | "service">("job");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [tags, setTags] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("gigs").insert({
        owner_id: u.user.id,
        title, description, category, type, currency,
        budget_min: min ? Number(min) : null,
        budget_max: max ? Number(max) : null,
        tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      });
      if (error) throw error;
      toast.success("Gig posted!");
      navigate({ to: "/app/gigs" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const field = "mt-1 w-full border-b border-foreground bg-transparent py-2 outline-none focus:border-accent";

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10 md:py-14">
      <p className="eyebrow text-muted-foreground">§ New listing</p>
      <h1 className="display mt-2 text-5xl">Post a gig.</h1>

      <form onSubmit={submit} className="mt-10 space-y-6">
        <div>
          <p className="eyebrow text-muted-foreground mb-2">Type</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setType("job")} className={`p-3 border text-left ${type === "job" ? "border-accent bg-accent/10" : "border-rule"}`}>
              <p className="font-semibold">Job</p>
              <p className="text-xs text-muted-foreground">I want to hire someone</p>
            </button>
            <button type="button" onClick={() => setType("service")} className={`p-3 border text-left ${type === "service" ? "border-accent bg-accent/10" : "border-rule"}`}>
              <p className="font-semibold">Service</p>
              <p className="text-xs text-muted-foreground">I'm offering my skills</p>
            </button>
          </div>
        </div>

        <label className="block">
          <span className="eyebrow text-muted-foreground">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className={field} placeholder="Logo design for SaaS startup" />
        </label>

        <label className="block">
          <span className="eyebrow text-muted-foreground">Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} className={`${field} resize-none`} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="eyebrow text-muted-foreground">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
              <option value="general">General</option>
              <option value="design">Design</option>
              <option value="development">Development</option>
              <option value="writing">Writing</option>
              <option value="marketing">Marketing</option>
              <option value="video">Video</option>
            </select>
          </label>
          <label className="block">
            <span className="eyebrow text-muted-foreground">Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={field}>
              <option>USD</option><option>EUR</option><option>GBP</option><option>NGN</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="eyebrow text-muted-foreground">Min budget</span>
            <input type="number" value={min} onChange={(e) => setMin(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="eyebrow text-muted-foreground">Max budget</span>
            <input type="number" value={max} onChange={(e) => setMax(e.target.value)} className={field} />
          </label>
        </div>

        <label className="block">
          <span className="eyebrow text-muted-foreground">Tags (comma separated)</span>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className={field} placeholder="react, typescript, figma" />
        </label>

        <button disabled={loading} type="submit" className="w-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50">
          {loading ? "Posting…" : "Publish gig"}
        </button>
      </form>
    </main>
  );
}
