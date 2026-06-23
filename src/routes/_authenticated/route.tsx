import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

function AppShell() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="rule-bottom sticky top-0 z-30 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/app" className="font-serif text-2xl tracking-tight">Freelancify<span className="text-accent">.</span></Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/app" className="hover:text-accent" activeOptions={{ exact: true }} activeProps={{ className: "text-accent" }}>Invoices</Link>
            <Link to="/app/new" className="hover:text-accent" activeProps={{ className: "text-accent" }}>New</Link>
            <span className="hidden text-muted-foreground md:inline">{email}</span>
            <button onClick={signOut} className="text-muted-foreground hover:text-accent">Sign out</button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
