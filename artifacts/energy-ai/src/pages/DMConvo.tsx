import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Flame, Send, Eye } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { NavBar } from "@/components/NavBar";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface DMsg {
  id: string;
  fromAlias: string;
  toAlias: string;
  content: string;
  viewed: boolean;
  viewedAt: string | null;
  streak: number;
  mine: boolean;
  createdAt: string;
}

export default function DMConvo() {
  const { token, alias } = useAuth();
  const params = useParams<{ alias: string }>();
  const [, setLocation] = useLocation();
  const partnerAlias = decodeURIComponent(params.alias ?? "");

  const [messages, setMessages] = useState<DMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streak, setStreak] = useState(0);
  const [openingSnap, setOpeningSnap] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `Snap with ${partnerAlias} — 369 AI`;
  }, [partnerAlias]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${BASE}/api/dm/${encodeURIComponent(partnerAlias)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { messages: DMsg[] };
        setMessages(data.messages);
        const last = data.messages[data.messages.length - 1];
        if (last) setStreak(last.streak);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [token, partnerAlias]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    try {
      await fetch(`${BASE}/api/dm/${encodeURIComponent(partnerAlias)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text }),
      });
      await fetchMessages();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  const handleOpenSnap = (msgId: string) => {
    setOpeningSnap(msgId);
    setTimeout(() => setOpeningSnap(null), 2500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-white/5 px-4 py-4 flex items-center gap-3">
        <button onClick={() => setLocation("/dm")} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-sm font-mono text-primary">{partnerAlias.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <p className="text-white font-medium text-sm">{partnerAlias}</p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">Ephemeral · 24hr expiry</p>
        </div>
        {streak > 1 && (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30">
            <Flame size={14} className="text-orange-400" />
            <span className="text-sm text-orange-400 font-mono font-bold">{streak}</span>
          </div>
        )}
      </div>

      {/* Snap notice */}
      <div className="text-center py-3 text-[10px] text-white/20 uppercase tracking-widest border-b border-white/5">
        Snaps open once · Disappear after 24 hours · {streak > 1 ? `🔥 ${streak} day streak` : "Start a streak by snapping daily"}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-white/20">
            <p className="text-sm">No snaps yet.</p>
            <p className="text-xs mt-2 text-white/10">Send the first transmission.</p>
          </div>
        )}
        {messages.map((msg) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className={cn("flex", msg.mine ? "flex-row-reverse" : "flex-row")}
          >
            <div className={cn("max-w-[78%] flex flex-col gap-1", msg.mine ? "items-end" : "items-start")}>
              {/* Snap bubble */}
              <AnimatePresence mode="wait">
                {msg.mine ? (
                  /* Sent snap - always visible to sender */
                  <motion.div key="sent"
                    className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      msg.viewed
                        ? "bg-white/5 border border-white/10 text-white/40 rounded-tr-sm"
                        : "bg-primary/20 border border-primary/40 text-white rounded-tr-sm"
                    )}
                  >
                    {msg.content}
                    {msg.viewed && (
                      <span className="flex items-center gap-1 text-[10px] text-white/20 mt-1">
                        <Eye size={10} /> Opened
                      </span>
                    )}
                  </motion.div>
                ) : (
                  /* Received snap */
                  openingSnap === msg.id ? (
                    <motion.div key="opening"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="px-4 py-3 rounded-2xl bg-primary/20 border border-primary/50 text-white text-sm leading-relaxed rounded-tl-sm"
                    >
                      {msg.content}
                      <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: "0%" }} animate={{ width: "100%" }}
                          transition={{ duration: 2.5, ease: "linear" }}
                        />
                      </div>
                    </motion.div>
                  ) : msg.viewed ? (
                    <div key="viewed" className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/30 text-sm rounded-tl-sm">
                      {msg.content}
                      <span className="flex items-center gap-1 text-[10px] text-white/20 mt-1"><Eye size={10} /> Viewed</span>
                    </div>
                  ) : (
                    <motion.button key="unopened"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                      onClick={() => handleOpenSnap(msg.id)}
                      className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent/80 border border-primary/60 text-white font-medium text-sm rounded-tl-sm shadow-lg shadow-primary/20"
                    >
                      <div className="w-3 h-3 rounded-full bg-white/80 animate-pulse" />
                      Tap to open snap
                    </motion.button>
                  )
                )}
              </AnimatePresence>
              <span className="text-[9px] text-white/15">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </motion.div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-16 bg-gradient-to-t from-background to-transparent px-4 pb-2">
        <form onSubmit={send} className="flex items-center gap-3 bg-card border border-white/10 rounded-2xl px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Snap to ${partnerAlias}…`}
            className="flex-1 bg-transparent text-white placeholder:text-white/20 focus:outline-none text-sm"
            maxLength={1000}
          />
          <button type="submit" disabled={!input.trim() || sending}
            className="text-primary hover:text-accent disabled:opacity-30 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <NavBar />
    </div>
  );
}
