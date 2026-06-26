import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function getInitials(name: string, email: string) {
  const src = (name || email || "?").trim();
  if (!src) return "?";
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase() || src[0].toUpperCase();
}

export function UserBadge() {
  const [initials, setInitials] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load(userId?: string) {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!mounted) return;
      if (!user) { setInitials(null); return; }
      const { data: p } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
      const name = (p?.display_name as string) || (user.user_metadata?.display_name as string) || "";
      setInitials(getInitials(name, user.email ?? ""));
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  if (!initials) return null;

  return (
    <Link
      to="/app"
      aria-label="Open dashboard"
      title="You're signed in — go to app"
      className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground text-xs font-bold tracking-wide hover:bg-foreground hover:text-background transition-colors"
    >
      {initials}
    </Link>
  );
}

export function useIsSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);
  return signedIn;
}
