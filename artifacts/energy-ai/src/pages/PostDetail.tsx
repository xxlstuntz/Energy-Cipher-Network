import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Send, Loader } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { NavBar } from "@/components/NavBar";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Post {
  id: number; authorAlias: string; vibrationLevel: string;
  content: string; category: string; amplifies: number; createdAt: string;
}
interface Comment {
  id: number; authorAlias: string; content: string; createdAt: string;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function PostDetail() {
  const { token, alias } = useAuth();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [amplified, setAmplified] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`${BASE}/api/feed/posts/${params.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { post: Post; comments: Comment[] };
        setPost(data.post);
        setComments(data.comments);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [params.id, token]);

  const handleAmplify = async () => {
    if (amplified || !post) return;
    setAmplified(true);
    await fetch(`${BASE}/api/feed/posts/${post.id}/amplify`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` },
    });
    await fetchData();
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !post) return;
    setSending(true);
    try {
      await fetch(`${BASE}/api/feed/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: input.trim() }),
      });
      setInput("");
      await fetchData();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-white/5 px-4 py-4 flex items-center gap-3">
        <button onClick={() => setLocation("/feed")} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg text-white">Transmission</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading && <div className="text-center py-16"><Loader size={24} className="animate-spin text-primary mx-auto" /></div>}
        {post && (
          <>
            <div className="p-6 rounded-2xl bg-white/3 border border-white/10 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-sm font-mono text-primary">{post.authorAlias.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{post.authorAlias}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">{post.vibrationLevel} · {timeAgo(post.createdAt)}</p>
                </div>
              </div>
              <p className="text-white/90 leading-relaxed whitespace-pre-wrap mb-5">{post.content}</p>
              <button
                onClick={handleAmplify}
                className={cn("flex items-center gap-2 text-sm transition-colors", amplified ? "text-accent" : "text-white/30 hover:text-primary")}
              >
                <Zap size={16} className={amplified ? "fill-accent" : ""} />
                <span>{post.amplifies + (amplified ? 1 : 0)} amplifies</span>
              </button>
            </div>

            <h3 className="text-xs text-white/30 uppercase tracking-widest mb-4">Resonances ({comments.length})</h3>
            <div className="space-y-3 mb-6">
              {comments.map(c => (
                <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-[10px] font-mono text-white/40">{c.authorAlias.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-white/60 font-medium">{c.authorAlias === alias ? "You" : c.authorAlias}</span>
                      <span className="text-[10px] text-white/20">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">{c.content}</p>
                  </div>
                </motion.div>
              ))}
              {comments.length === 0 && <p className="text-white/20 text-sm text-center py-4">No resonances yet. Add yours.</p>}
            </div>

            <form onSubmit={handleComment} className="flex items-end gap-3 bg-card border border-white/10 rounded-2xl px-4 py-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Add your resonance…"
                className="flex-1 bg-transparent text-white placeholder:text-white/20 focus:outline-none text-sm resize-none"
                rows={2}
                maxLength={500}
              />
              <button type="submit" disabled={!input.trim() || sending}
                className="text-primary hover:text-accent disabled:opacity-30 transition-colors mb-1"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>
      <NavBar />
    </div>
  );
}
