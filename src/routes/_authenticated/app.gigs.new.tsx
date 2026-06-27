import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Paperclip } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/gigs/new")({
  component: NewGig,
});

type Pending = { file: File; id: string };

function NewGig() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [type, setType] = useState<"job" | "service">("job");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [tags, setTags] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [files, setFiles] = useState<Pending[]>([]);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).map((f) => ({ file: f, id: crypto.randomUUID() }));
    setFiles((prev) => [...prev, ...next]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");

      const uploadedLinks: string[] = [];
      for (const p of files) {
        const path = `gigs/${u.user.id}/${Date.now()}-${p.file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("attachments").upload(path, p.file, { upsert: false });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("attachments").createSignedUrl(path, 60 * 60 * 24 * 365);
        if (signed?.signedUrl) uploadedLinks.push(`📎 ${p.file.name} — ${signed.signedUrl}`);
      }

      const fullDesc = uploadedLinks.length
        ? `${description}\n\n— Attachments —\n${uploadedLinks.join("\n")}`
        : description;

      const { error } = await supabase.from("gigs").insert({
        owner_id: u.user.id,
        title, description: fullDesc, category, type, currency,
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

        <div>
          <p className="eyebrow text-muted-foreground mb-2">Attachments</p>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
            className={`border-2 border-dashed p-6 text-center transition-colors ${drag ? "border-accent bg-accent/5" : "border-rule"}`}
          >
            <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm">Drag & drop files here</p>
            <p className="text-xs text-muted-foreground">or pick from your device — images, PDFs, docs, anything</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 border border-foreground px-3 py-1.5 text-xs hover:bg-foreground hover:text-background transition-colors">
                <Paperclip className="h-3 w-3" /> From device
              </button>
            </div>
            <input ref={inputRef} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {files.map((p) => (
                <li key={p.id} className="flex items-center justify-between border border-rule px-3 py-2 text-xs">
                  <span className="truncate">{p.file.name} <span className="text-muted-foreground">({Math.round(p.file.size / 1024)} KB)</span></span>
                  <button type="button" onClick={() => setFiles((prev) => prev.filter((x) => x.id !== p.id))} className="text-muted-foreground hover:text-accent">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

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

