import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { broadcastProfile } from "@/components/user-avatar";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [display_name, setDN] = useState("");
  const [headline, setHL] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [hourly_rate, setRate] = useState("");
  const [location, setLoc] = useState("");
  const [role, setRole] = useState<"freelancer" | "employer">("freelancer");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (p) {
        setDN(p.display_name ?? "");
        setHL(p.headline ?? "");
        setBio(p.bio ?? "");
        setSkills((p.skills ?? []).join(", "));
        setRate(p.hourly_rate?.toString() ?? "");
        setLoc(p.location ?? "");
        setRole((p.role ?? "freelancer") as "freelancer" | "employer");
        setAvatarUrl(p.avatar_url ?? null);
      }
      setLoading(false);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({
      display_name, headline, bio, location, role,
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      hourly_rate: hourly_rate ? Number(hourly_rate) : null,
    }).eq("id", u.user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profile saved");
  }

  async function uploadAvatar(file: File) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const path = `${u.user.id}/avatar-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
    if (upErr) { toast.error(upErr.message); return; }
    const { data: signed } = await supabase.storage.from("attachments").createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed?.signedUrl ?? null;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", u.user.id);
    setAvatarUrl(url);
    broadcastProfile(u.user.id, { avatar_url: url, display_name: display_name || null });
    toast.success("Avatar updated");
  }

  const field = "mt-1 w-full border-b border-foreground bg-transparent py-2 outline-none focus:border-accent";

  if (loading) return <main className="p-10"><p className="text-sm text-muted-foreground">Loading…</p></main>;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10 md:py-14">
      <p className="eyebrow text-muted-foreground">§ Your profile</p>
      <h1 className="display mt-2 text-5xl">Profile.</h1>

      <div className="mt-8 flex items-center gap-4">
        <div className="h-20 w-20 bg-accent text-accent-foreground grid place-items-center font-display text-3xl font-bold overflow-hidden">
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : (display_name || "?").charAt(0).toUpperCase()}
        </div>
        <label className="cursor-pointer border border-foreground px-4 py-2 text-sm hover:bg-foreground hover:text-background transition-colors">
          Upload photo
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
        </label>
      </div>

      <form onSubmit={save} className="mt-8 space-y-5">
        <div>
          <p className="eyebrow text-muted-foreground mb-2">I am a</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setRole("freelancer")} className={`p-3 border text-left ${role === "freelancer" ? "border-accent bg-accent/10" : "border-rule"}`}>Freelancer</button>
            <button type="button" onClick={() => setRole("employer")} className={`p-3 border text-left ${role === "employer" ? "border-accent bg-accent/10" : "border-rule"}`}>Employer</button>
          </div>
        </div>

        <label className="block"><span className="eyebrow text-muted-foreground">Display name</span>
          <input value={display_name} onChange={(e) => setDN(e.target.value)} className={field} required /></label>
        <label className="block"><span className="eyebrow text-muted-foreground">Headline</span>
          <input value={headline} onChange={(e) => setHL(e.target.value)} className={field} placeholder="Full-stack developer · React + Supabase" /></label>
        <label className="block"><span className="eyebrow text-muted-foreground">Bio</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className={`${field} resize-none`} /></label>
        <label className="block"><span className="eyebrow text-muted-foreground">Skills (comma separated)</span>
          <input value={skills} onChange={(e) => setSkills(e.target.value)} className={field} placeholder="react, design, copywriting" /></label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block"><span className="eyebrow text-muted-foreground">Hourly rate (USD)</span>
            <input type="number" value={hourly_rate} onChange={(e) => setRate(e.target.value)} className={field} /></label>
          <label className="block"><span className="eyebrow text-muted-foreground">Location</span>
            <input value={location} onChange={(e) => setLoc(e.target.value)} className={field} placeholder="Lagos, NG" /></label>
        </div>
        <button disabled={saving} className="w-full bg-accent text-accent-foreground px-5 py-3 text-sm font-semibold hover:bg-foreground hover:text-background transition-colors disabled:opacity-50">
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}
