import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, MessageCircle, Plus, X, Loader } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { NavBar } from "@/components/NavBar";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface FeedPost {
  id: number;
  authorAlias: string;
  vibrationLevel: string;
  content: string;
  category: string;
  amplifies: number;
  createdAt: string;
}

const CATEGORIES = [
  { id: "all",      label: "All",       color: "text-white/60" },
  { id: "insight",  label: "⚡ Insight", color: "text-primary"  },
  { id: "idea",     label: "💡 Ideas",  color: "text-accent"   },
  { id: "feedback", label: "✦ Feedback",color: "text-white/60" },
  { id: "bug",      label: "⚠ Bugs",   color: "text-red-400"  },
  { id: "general",  label: "∞ General", color: "text-white/40" },
];

function catColor(cat: string) {
  const map: Record<string, string> = {
    insight: "border-primary/40 bg-primary/10 text-primary",
    idea: "border-accent/40 bg-accent/10 text-accent",
    feedback: "border-white/20 bg-white/5 text-white/60",
    bug: "border-red-400/30 bg-red-400/10 text-red-400",
    general: "border-white/10 bg-white/5 text-white/30",
  };
  return map[cat] ?? map.general;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function Feed() {
  const { token, alias } = useAuth();
  const [, setLocation] = useLocation();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [amplified, setAmplified] = useState<Set<number>>(new Set());
  const [showCompose, setShowCompose] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCat, setNewCat] = useState("general");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    document.title = "The Feed — 369 AI";
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${BASE}/api/feed/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { posts: FeedPost[] };
        setPosts(data.posts);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const handleAmplify = async (postId: number) => {
    if (amplified.has(postId)) return;
    setAmplified(prev => new Set([...prev, postId]));
    try {
      await fetch(`${BASE}/api/feed/posts/${postId}/amplify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchPosts();
    } catch { /* ignore */ }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || posting) return;
    setPosting(true);
    try {
      await fetch(`${BASE}/api/feed/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newContent.trim(), category: newCat }),
      });
      setNewContent("");
      setShowCompose(false);
      await fetchPosts();
    } catch { /* ignore */ } finally {
      setPosting(false);
    }
  };

  const filtered = category === "all" ? posts : posts.filter(p => p.category === category);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-lg text-white">The Feed</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">369 Community</p>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 border border-primary/40 text-primary text-sm hover:bg-primary/30 transition-colors"
          >
            <Plus size={16} /> Post
          </button>
        </div>
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] uppercase tracking-widest whitespace-nowrap border transition-all",
                category === c.id
                  ? "bg-white/10 border-white/30 text-white"
                  : "border-white/5 text-white/30 hover:text-white/50"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {loading && (
          <div className="text-center py-16"><Loader size={24} className="animate-spin text-primary mx-auto" /></div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-white/20">
            <p className="text-sm">No transmissions in this frequency yet.</p>
            <button onClick={() => setShowCompose(true)} className="mt-4 text-primary text-sm hover:underline">Be the first →</button>
          </div>
        )}
        {filtered.map((post) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-white/3 border border-white/8 hover:border-white/15 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-xs font-mono text-primary">{post.authorAlias.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{post.authorAlias}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">{post.vibrationLevel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest border", catColor(post.category))}>
                  {post.category}
                </span>
                <span className="text-[10px] text-white/20">{timeAgo(post.createdAt)}</span>
              </div>
            </div>
            <p className="text-white/80 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleAmplify(post.id)}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors",
                  amplified.has(post.id) ? "text-accent" : "text-white/30 hover:text-primary"
                )}
              >
                <Zap size={15} className={amplified.has(post.id) ? "fill-accent" : ""} />
                <span>{post.amplifies + (amplified.has(post.id) ? 1 : 0)}</span>
              </button>
              <button
                onClick={() => setLocation(`/feed/${post.id}`)}
                className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
              >
                <MessageCircle size={15} /> Respond
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCompose(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-lg bg-card border border-white/10 rounded-3xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg text-white">Transmit to the Field</h3>
                <button onClick={() => setShowCompose(false)} className="text-white/30 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handlePost}>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="What frequency are you carrying right now?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary resize-none text-sm"
                  rows={5}
                  maxLength={1200}
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.slice(1).map(c => (
                      <button key={c.id} type="button" onClick={() => setNewCat(c.id)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border transition-all",
                          newCat === c.id ? "bg-white/15 border-white/30 text-white" : "border-white/10 text-white/30"
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white/20">{newContent.length}/1200</span>
                    <button type="submit" disabled={!newContent.trim() || posting}
                      className="px-5 py-2 rounded-xl bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 transition-colors text-sm disabled:opacity-40"
                    >
                      {posting ? "Sending…" : "Transmit"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <NavBar />
    </div>
  );
}
