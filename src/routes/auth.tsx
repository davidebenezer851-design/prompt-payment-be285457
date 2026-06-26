import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

const search = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Sign in — InstaGig" },
      { name: "description", content: "Join InstaGig as a freelancer or an employer." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [role, setRole] = useState<"freelancer" | "employer">("freelancer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/" });
    });
  }, [navigate]);

  async function goHome() {
    navigate({ to: "/" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { display_name: name || email.split("@")[0], role },
          },
        });
        if (error) throw error;
        toast.success("Welcome to InstaGig!");
        if (data.user) await routeByRole(data.user.id, role);
        else navigate({ to: "/app" });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await routeByRole(data.user.id, role);
        else navigate({ to: "/app" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
    if (!r.redirected && !r.error) navigate({ to: "/app" });
  }


  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="rule-bottom mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">InstaGig<span className="text-accent">.</span></Link>
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-sm hover:text-accent">
          {mode === "signin" ? "Need an account?" : "Have an account?"}
        </button>
      </div>
      <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-7xl gap-12 px-6 py-12 md:grid-cols-2 md:py-20">
        <div className="hidden flex-col justify-between md:flex">
          <p className="eyebrow text-muted-foreground">§ {mode === "signup" ? "New here" : "Welcome back"}</p>
          <div>
            <h1 className="display text-7xl">
              {mode === "signup"
                ? <>Work that <span className="italic text-accent">moves</span>.</>
                : <>Pick up<br />where you <span className="italic text-accent">left off</span>.</>}
            </h1>
            <p className="mt-6 max-w-md text-muted-foreground">
              The freelance marketplace built for people who actually ship. Post a gig, hire talent, chat & send files — all in one place.
            </p>
          </div>
          <p className="text-sm italic text-muted-foreground">Vol. 01 — Est. 2026</p>
        </div>

        <div className="flex flex-col justify-center">
          <p className="eyebrow text-muted-foreground">{mode === "signup" ? "Create account" : "Sign in"}</p>
          <h2 className="display mt-3 text-4xl">{mode === "signup" ? "Two seconds." : "Hello again."}</h2>

          {mode === "signup" && (
            <div className="mt-8">
              <p className="eyebrow text-muted-foreground mb-3">I am a…</p>
              <div className="grid grid-cols-2 gap-3">
                <RoleCard active={role === "freelancer"} onClick={() => setRole("freelancer")} title="Freelancer" desc="Find gigs, get paid" />
                <RoleCard active={role === "employer"} onClick={() => setRole("employer")} title="Employer" desc="Post jobs, hire talent" />
              </div>
            </div>
          )}

          <button onClick={handleGoogle} className="mt-6 flex items-center justify-center gap-3 border border-foreground px-4 py-3 text-sm font-medium hover:bg-foreground hover:text-background transition-colors">
            <GoogleMark /> Continue with Google
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 border-t border-rule" /> OR <div className="flex-1 border-t border-rule" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <label className="block">
                <span className="eyebrow text-muted-foreground">Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} type="text" required className="mt-1 w-full border-b border-foreground bg-transparent py-2 outline-none focus:border-accent" />
              </label>
            )}
            <label className="block">
              <span className="eyebrow text-muted-foreground">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full border-b border-foreground bg-transparent py-2 outline-none focus:border-accent" />
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground">Password</span>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={6} required className="mt-1 w-full border-b border-foreground bg-transparent py-2 outline-none focus:border-accent" />
            </label>
            <button disabled={loading} type="submit" className="mt-2 bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50">
              {loading ? "…" : mode === "signup" ? `Join as ${role}` : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-left border p-4 transition-colors ${active ? "border-accent bg-accent/10" : "border-rule hover:border-foreground"}`}>
      <p className={`font-display text-lg font-semibold ${active ? "text-accent" : ""}`}>{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.2 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.8 6.4 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c11 0 19.5-8 19.5-19.5 0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.8 6.4 29.1 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-2 1.4-4.4 2.1-7 2.1-5.2 0-9.6-3.1-11.3-7.4l-6.5 5C8.9 39 15.9 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6 5.1C40.7 35.5 43.5 30.2 43.5 24c0-1.2-.1-2.4-.4-3.5z"/></svg>
  );
}
