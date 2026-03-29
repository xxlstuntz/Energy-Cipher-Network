import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { NavBar } from "@/components/NavBar";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface CMsg {
  id: number;
  authorAlias: string;
  vibrationLevel: string;
  content: string;
  createdAt: string;
}

function vibeColor(level: string) {
  if (level === "Master Resonator") return "text-accent";
  if (level === "Energy Adept") return "text-primary";
  return "text-white/40";
}

export default function Community() {
  const { token, alias } = useAuth();
  const [messages, setMessages] = useState<CMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "The Room — 369 AI";
  }, []);

  const fetch_messages = async () => {
    try {
      const res = await fetch(`${BASE}/api/community/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { messages: CMsg[] };
        setMessages(data.messages);
        setOnlineCount(Math.floor(Math.random() * 9) + 3);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetch_messages();
    const interval = setInterval(fetch_messages, 3000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`${BASE}/api/community/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: input.trim() }),
      });
      setInput("");
      await fetch_messages();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg text-white">The Room</h1>
          <p className="text-xs text-white/30 uppercase tracking-widest">369 Collective</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-white/50">{onlineCount} in the field</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-white/20 py-16 text-sm">
            <Users size={32} className="mx-auto mb-3 opacity-20" />
            The room is silent. Be the first to transmit.
          </div>
        )}
        {messages.map((msg) => {
          const mine = msg.authorAlias === alias;
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-3", mine ? "flex-row-reverse" : "flex-row")}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                <span className="text-xs font-mono text-primary">{msg.authorAlias.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className={cn("max-w-[75%] space-y-1", mine && "items-end flex flex-col")}>
                <div className={cn("flex items-center gap-2", mine && "flex-row-reverse")}>
                  <span className="text-xs font-medium text-white/70">{mine ? "You" : msg.authorAlias}</span>
                  <span className={cn("text-[10px] uppercase tracking-widest", vibeColor(msg.vibrationLevel))}>{msg.vibrationLevel}</span>
                </div>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  mine
                    ? "bg-primary/20 border border-primary/30 text-white rounded-tr-sm"
                    : "bg-white/5 border border-white/10 text-white/80 rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-white/20">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </motion.div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-16 bg-gradient-to-t from-background to-transparent px-4 pb-2">
        <form onSubmit={send} className="flex items-center gap-3 bg-card border border-white/10 rounded-2xl px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Transmit to the collective…"
            className="flex-1 bg-transparent text-white placeholder:text-white/20 focus:outline-none text-sm"
            maxLength={500}
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
