import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { LayoutDashboard, Briefcase, Users, MessageSquare, FileText, User, Plus, LogOut, Menu, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/freelancer", label: "Freelancer Hub", icon: Briefcase },
  { to: "/app/employer", label: "Employer Hub", icon: Users },
  { to: "/app/gigs", label: "Browse Gigs", icon: Briefcase },
  { to: "/app/freelancers", label: "Talent", icon: Users },
  { to: "/app/messages", label: "Messages", icon: MessageSquare },
  { to: "/app/invoices", label: "Invoices", icon: FileText },
  { to: "/app/profile", label: "Profile", icon: User },
];

function AppShell() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-rule bg-background transform transition-transform sm:relative sm:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="rule-bottom flex items-center justify-between px-6 py-5">
            <Link to="/app" className="font-display text-xl font-semibold tracking-tight">
              InstaGig<span className="text-accent">.</span>
            </Link>
            <button onClick={() => setOpen(false)} className="sm:hidden text-muted-foreground"><X className="h-5 w-5" /></button>
          </div>

          <Link to="/app/gigs/new" onClick={() => setOpen(false)}
            className="mx-4 mt-4 inline-flex items-center justify-center gap-2 bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-foreground hover:text-background transition-colors">
            <Plus className="h-4 w-4" /> Post a gig
          </Link>

          <nav className="mt-6 flex-1 px-3 space-y-1">
            {NAV.map(({ to, label, icon: Icon, exact }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                activeOptions={{ exact: !!exact }}
                activeProps={{ className: "bg-secondary text-accent border-l-2 border-accent" }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-l-2 border-transparent transition-colors">
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </nav>

          <div className="rule-top px-4 py-4">
            <p className="truncate text-xs text-muted-foreground mb-2">{email}</p>
            <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/60 sm:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="rule-bottom flex items-center gap-3 px-4 py-3 sm:hidden">
          <button onClick={() => setOpen(true)} className="text-foreground"><Menu className="h-5 w-5" /></button>
          <Link to="/app" className="font-display text-lg font-semibold">InstaGig<span className="text-accent">.</span></Link>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
