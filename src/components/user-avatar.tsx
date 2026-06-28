import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Cached = { avatar_url: string | null; display_name: string | null };
const cache = new Map<string, Cached>();
const listeners = new Map<string, Set<(c: Cached) => void>>();

function subscribe(userId: string, cb: (c: Cached) => void) {
  if (!listeners.has(userId)) listeners.set(userId, new Set());
  listeners.get(userId)!.add(cb);
  return () => listeners.get(userId)?.delete(cb);
}

function emit(userId: string, c: Cached) {
  cache.set(userId, c);
  listeners.get(userId)?.forEach((cb) => cb(c));
}

async function loadProfile(userId: string) {
  const { data } = await supabase.from("profiles").select("avatar_url, display_name").eq("id", userId).maybeSingle();
  emit(userId, { avatar_url: data?.avatar_url ?? null, display_name: data?.display_name ?? null });
}

// Global realtime: any profile update broadcasts to subscribers.
let realtimeStarted = false;
function ensureRealtime() {
  if (realtimeStarted) return;
  realtimeStarted = true;
  supabase
    .channel("profiles-broadcast")
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
      const row = payload.new as { id: string; avatar_url: string | null; display_name: string | null };
      if (row?.id) emit(row.id, { avatar_url: row.avatar_url, display_name: row.display_name });
    })
    .subscribe();
}

function initials(name: string | null, fallback = "?") {
  const src = (name || fallback).trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "") || src[0] || "?").toUpperCase();
}

export function UserAvatar({
  userId,
  size = 32,
  className = "",
  nameFallback,
}: {
  userId: string;
  size?: number;
  className?: string;
  nameFallback?: string;
}) {
  const [data, setData] = useState<Cached | null>(cache.get(userId) ?? null);

  useEffect(() => {
    ensureRealtime();
    const cached = cache.get(userId);
    if (cached) setData(cached);
    else loadProfile(userId);
    return subscribe(userId, setData);
  }, [userId]);

  const name = data?.display_name ?? nameFallback ?? null;
  const url = data?.avatar_url ?? null;
  const dim = { width: size, height: size, fontSize: Math.max(10, size * 0.38) };

  return (
    <span
      style={dim}
      className={`inline-grid place-items-center overflow-hidden rounded-full bg-accent text-accent-foreground font-bold tracking-wide ${className}`}
    >
      {url ? (
        <img src={url} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </span>
  );
}

// Helper: tell others a profile changed (call after uploading a new avatar)
export function broadcastProfile(userId: string, c: Cached) {
  emit(userId, c);
}
