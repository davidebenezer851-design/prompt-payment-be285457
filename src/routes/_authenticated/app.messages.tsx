import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Send, Paperclip, FileText } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { toast } from "sonner";

const search = z.object({ c: z.string().optional() });

export const Route = createFileRoute("/_authenticated/app/messages")({
  validateSearch: search,
  component: Messages,
});

type Conv = { id: string; user_a: string; user_b: string; other?: { id: string; display_name: string | null } };
type Msg = { id: string; conversation_id: string; sender_id: string; body: string | null; attachment_url: string | null; attachment_name: string | null; created_at: string };

function Messages() {
  const { c: initial } = Route.useSearch();
  const qc = useQueryClient();
  const [me, setMe] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | undefined>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, []);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", me],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase.from("conversations").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      const others = Array.from(new Set((data ?? []).map((c) => c.user_a === me ? c.user_b : c.user_a)));
      const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", others);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((c) => ({ ...c, other: map.get(c.user_a === me ? c.user_b : c.user_a) })) as Conv[];
    },
  });

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  const active = conversations.find((c) => c.id === activeId);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await supabase.from("messages").select("*").eq("conversation_id", activeId!).order("created_at");
      if (error) throw error;
      return data as Msg[];
    },
  });

  useEffect(() => {
    if (!activeId) return;
    const ch = supabase.channel(`msg:${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", activeId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId, qc]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !me || (!text.trim())) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({ conversation_id: activeId, sender_id: me, body: text.trim() });
    setSending(false);
    if (error) toast.error(error.message); else setText("");
  }

  async function attachFile(file: File) {
    if (!activeId || !me) return;
    const path = `${me}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
    if (upErr) { toast.error(upErr.message); return; }
    const { data: signed } = await supabase.storage.from("attachments").createSignedUrl(path, 60 * 60 * 24 * 7);
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId, sender_id: me,
      body: null, attachment_url: signed?.signedUrl ?? path, attachment_name: file.name,
    });
    if (error) toast.error(error.message);
  }

  return (
    <main className="flex-1 flex h-[calc(100vh-0px)] md:h-screen overflow-hidden">
      {/* Conversation list */}
      <aside className="w-72 border-r border-rule flex flex-col">
        <div className="rule-bottom px-5 py-4">
          <p className="eyebrow text-muted-foreground">§ Inbox</p>
          <h2 className="display text-2xl mt-1">Messages.</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="p-5 text-xs text-muted-foreground italic">No conversations yet. Message someone from the Talent or Gigs page.</p>
          )}
          {conversations.map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className={`w-full text-left px-5 py-3 border-b border-rule hover:bg-secondary/40 ${activeId === c.id ? "bg-secondary" : ""}`}>
              <div className="flex items-center gap-3">
                <UserAvatar userId={c.user_a === me ? c.user_b : c.user_a} size={36} nameFallback={c.other?.display_name ?? undefined} />

                <p className="font-medium text-sm truncate">{c.other?.display_name ?? "User"}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Thread */}
      <section className="flex-1 flex flex-col min-w-0">
        {!active ? (
          <div className="flex-1 grid place-items-center text-muted-foreground">
            <p className="display italic text-2xl">Select a conversation</p>
          </div>
        ) : (
          <>
            <header className="rule-bottom px-6 py-4">
              <p className="eyebrow text-muted-foreground">Chatting with</p>
              <p className="font-display text-xl font-semibold">{active.other?.display_name ?? "User"}</p>
            </header>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
              {messages.length === 0 && <p className="text-center text-xs text-muted-foreground italic mt-10">No messages yet — say hi.</p>}
              {messages.map((m) => {
                const mine = m.sender_id === me;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 text-sm ${mine ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"}`}>
                      {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                      {m.attachment_url && (
                        <a href={m.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
                          <FileText className="h-4 w-4" /> {m.attachment_name ?? "file"}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={send} className="rule-top px-4 py-3 flex items-center gap-2">
              <label className="cursor-pointer text-muted-foreground hover:text-accent p-2">
                <Paperclip className="h-5 w-5" />
                <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) attachFile(f); e.target.value = ""; }} />
              </label>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…"
                className="flex-1 bg-transparent border border-rule px-3 py-2 text-sm outline-none focus:border-accent" />
              <button disabled={sending || !text.trim()} className="bg-accent text-accent-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
