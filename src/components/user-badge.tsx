import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { UserAvatar } from "@/components/user-avatar";

export function UserBadge() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => mounted && setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  if (!userId) return null;

  return (
    <Link to="/app" aria-label="Open dashboard" title="You're signed in — go to app" className="block">
      <UserAvatar userId={userId} size={36} className="ring-2 ring-transparent hover:ring-accent transition" />
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
