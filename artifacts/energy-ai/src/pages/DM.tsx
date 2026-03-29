import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Flame, Plus, X, Loader } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { NavBar } from "@/components/NavBar";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Convo {
  partnerAlias: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  streak: number;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function DM() {
  const { token, alias } = useAuth();
  const [, setLocation] = useLocation();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newAlias, setNewAlias] = useState("");

  useEffect(() => {
    document.title = "Snaps — 369 AI";
  }, []);

  useEffect(() => {
    fetch(`${BASE}/api/dm/conversations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((d: { conversations: Convo[] }) => setConvos(d.conversations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const startConvo = () => {
    if (!newAlias.trim()) return;
    setLocation(`/dm/${encodeURIComponent(newAlias.trim())}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg text-white">Snaps</h1>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">Ephemeral transmissions</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 border border-primary/40 text-primary text-sm hover:bg-primary/30 transition-colors"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Conversations */}
      <div className="max-w-2xl mx-auto">
        {loading && <div className="text-center py-16"><Loader size={24} className="animate-spin text-primary mx-auto" /></div>}
        {!loading && convos.length === 0 && (
          <div className="text-center py-20 px-6 text-white/20">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Flame size={28} className="text-white/20" />
            </div>
            <p className="text-sm mb-2">No snaps yet.</p>
            <p className="text-xs text-white/15">Messages disappear after being viewed. 24hr expiry.</p>
            <button onClick={() => setShowNew(true)} className="mt-6 text-primary text-sm hover:underline">Start a snap →</button>
          </div>
        )}

        <div className="divide-y divide-white/5">
          {convos.map((c) => (
            <motion.button
              key={c.partnerAlias}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setLocation(`/dm/${encodeURIComponent(c.partnerAlias)}`)}
              className="w-full px-4 py-4 flex items-center gap-4 hover:bg-white/3 transition-colors text-left"
            >
              {/* Avatar */}
              <div className="relative">
                <div className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center",
                  c.unread > 0 ? "border-primary bg-primary/20" : "border-white/20 bg-white/5"
                )}>
                  <span className="font-mono text-sm text-white/70">{c.partnerAlias.slice(0, 2).toUpperCase()}</span>
                </div>
                {c.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[10px] text-white flex items-center justify-center">
                    {c.unread}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium text-white/90 text-sm">{c.partnerAlias}</span>
                  <span className="text-[10px] text-white/25">{timeAgo(c.lastAt)}</span>
                </div>
                <p className={cn("text-xs truncate", c.unread > 0 ? "text-white/70 font-medium" : "text-white/30")}>
                  {c.lastMessage}
                </p>
              </div>

              {c.streak > 1 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
                  <Flame size={12} className="text-orange-400" />
                  <span className="text-[10px] text-orange-400 font-mono">{c.streak}</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* New DM Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowNew(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-card border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-white">New Snap</h3>
              <button onClick={() => setShowNew(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <p className="text-xs text-white/30 mb-4">Enter the alias of the person you want to reach. Messages expire 24h after being viewed.</p>
            <input
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startConvo()}
              placeholder="Enter their alias…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary mb-4 text-sm"
              autoFocus
            />
            <button onClick={startConvo} disabled={!newAlias.trim()}
              className="w-full py-3 rounded-xl bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 transition-colors text-sm disabled:opacity-40 uppercase tracking-widest"
            >
              Open Field
            </button>
          </motion.div>
        </div>
      )}

      <NavBar />
    </div>
  );
}
