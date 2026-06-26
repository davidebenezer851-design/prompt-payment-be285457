import { useEffect, useState } from "react";

export function SplashScreen() {
  const [gone, setGone] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 700);
    const t2 = setTimeout(() => setGone(true), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/30 blur-[120px] splash-pulse" />
      </div>
      <div className="relative flex flex-col items-center gap-6">
        <div className="flex items-center gap-3 font-display text-3xl font-semibold tracking-tight text-foreground">
          <span className="grid h-9 w-9 place-items-center bg-accent text-accent-foreground text-sm font-bold splash-pop">F</span>
          <span>InstaGig<span className="text-accent">.</span></span>
        </div>
        <div className="h-px w-48 overflow-hidden bg-rule">
          <div className="h-full w-1/3 bg-accent splash-bar" />
        </div>
        <p className="eyebrow text-muted-foreground">§ Loading the marketplace</p>
      </div>
      <style>{`
        @keyframes splash-bar { 0%{transform:translateX(-120%)} 100%{transform:translateX(420%)} }
        .splash-bar { animation: splash-bar 1.1s cubic-bezier(.6,.1,.2,1) infinite; }
        @keyframes splash-pop { 0%{transform:scale(.6);opacity:0} 60%{transform:scale(1.08);opacity:1} 100%{transform:scale(1)} }
        .splash-pop { animation: splash-pop .7s cubic-bezier(.2,.9,.2,1.2) both; }
        @keyframes splash-pulse { 0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(1)} 50%{opacity:.75;transform:translate(-50%,-50%) scale(1.1)} }
        .splash-pulse { animation: splash-pulse 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
