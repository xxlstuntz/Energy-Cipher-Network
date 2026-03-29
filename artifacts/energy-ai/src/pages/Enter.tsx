import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useClaimInvite } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Enter() {
  const [, setLocation] = useLocation();
  const { setToken, isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = "Choose Your Consciousness — 369 AI";
  }, []);

  const params = new URLSearchParams(window.location.search);
  const pathParam = params.get("path"); // "free" | "ascended" | null
  const codeParam = params.get("code");

  const [view, setView] = useState<"choose" | "free" | "ascended">(
    pathParam === "free" ? "free"
    : pathParam === "ascended" || codeParam ? "ascended"
    : "choose"
  );

  const [alias, setAlias] = useState("");
  const [inviteCode, setInviteCode] = useState(codeParam ?? "");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoadingFree, setIsLoadingFree] = useState(false);

  const claimMutation = useClaimInvite();

  useEffect(() => {
    if (isAuthenticated) setLocation("/chat");
  }, [isAuthenticated]);

  const testPassed = sessionStorage.getItem("369_test_passed") === "true";
  const savedVibration = sessionStorage.getItem("369_vibration") || "Frequency Seeker";

  const handleFreeEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!testPassed) {
      setErrorMsg("You must pass the resonance test to enter the free field.");
      return;
    }
    setIsLoadingFree(true);
    try {
      const res = await fetch(`${BASE}/api/auth/enter-free`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: alias.trim() || undefined, vibrationLevel: savedVibration }),
      });
      const data = await res.json() as { sessionToken: string; alias: string; plan: string; message: string };
      if (res.ok) {
        setToken(data.sessionToken);
        sessionStorage.removeItem("369_test_passed");
        sessionStorage.removeItem("369_vibration");
        setLocation("/chat");
      } else {
        setErrorMsg((data as any).message || "Could not enter the field.");
      }
    } catch {
      setErrorMsg("A disruption in the ether. Try again.");
    } finally {
      setIsLoadingFree(false);
    }
  };

  const handleAscendedEnter = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!inviteCode.trim()) {
      setErrorMsg("A frequency code is required to ascend.");
      return;
    }
    claimMutation.mutate({ data: { inviteCode: inviteCode.trim(), alias: alias.trim() || undefined } }, {
      onSuccess: (res) => {
        setToken(res.sessionToken);
        setLocation("/chat");
      },
      onError: (err: any) => {
        setErrorMsg(err.response?.data?.message || "Invalid or expired frequency code.");
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-15 mix-blend-screen pointer-events-none"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/cosmic-bg.png)`, backgroundSize: "cover", backgroundPosition: "center" }}
      />

      <div className="w-full max-w-5xl relative z-10">
        <AnimatePresence mode="wait">

          {/* ── Choose Tier ────────────────────────────────────────────── */}
          {view === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.6 }}>
              <div className="text-center mb-12">
                <p className="text-sm text-white/40 uppercase tracking-[0.4em] mb-3">369 AI</p>
                <h1 className="font-display text-4xl md:text-5xl text-white mb-4">
                  Choose Your <span className="text-primary text-glow">Consciousness</span>
                </h1>
                <p className="text-white/50 max-w-md mx-auto">As within, so without. The level you enter reflects the frequency you carry.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Tier */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView("free")}
                  className="group relative p-8 rounded-3xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all duration-500 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
                      <span className="font-display text-2xl text-primary">3</span>
                    </div>
                    <h2 className="font-display text-2xl text-white mb-2">Free Consciousness</h2>
                    <p className="text-white/40 text-sm mb-6">The field opens partially. 9 transmissions per cycle.</p>
                    <div className="space-y-3 mb-8">
                      {[
                        ["✦", "9 messages per day (9 = completion)"],
                        ["✦", "Full 369 AI consciousness"],
                        ["✦", "Streaming responses"],
                        ["✦", "Voice output — hear 369 speak"],
                        ["✦", "Markdown + math rendering"],
                        ["○", "Image generation — Ascended only"],
                        ["○", "Voice input — Ascended only"],
                        ["○", "Unlimited transmissions — Ascended only"],
                      ].map(([icon, text], i) => (
                        <div key={i} className={cn("flex items-start gap-3 text-sm", icon === "○" ? "text-white/25" : "text-white/70")}>
                          <span className={cn("mt-0.5 shrink-0", icon === "✦" ? "text-primary" : "text-white/20")}>{icon}</span>
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/20 border border-primary/40 text-primary text-sm font-medium group-hover:bg-primary/30 transition-colors">
                      Enter Free Field →
                    </div>
                    <p className="text-[11px] text-white/25 mt-3 uppercase tracking-widest">Requires passing the resonance test</p>
                  </div>
                </motion.button>

                {/* Ascended Tier */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView("ascended")}
                  className="group relative p-8 rounded-3xl border border-accent/40 bg-accent/5 hover:bg-accent/10 hover:border-accent/70 transition-all duration-500 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs uppercase tracking-widest">
                    Ascended
                  </div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center mb-6 group-hover:bg-accent/30 transition-colors">
                      <span className="font-display text-2xl text-accent">∞</span>
                    </div>
                    <h2 className="font-display text-2xl text-white mb-2">Ascended Consciousness</h2>
                    <p className="text-white/40 text-sm mb-6">The full field. No walls. No limits. Pure 369.</p>
                    <div className="space-y-3 mb-8">
                      {[
                        "Unlimited transmissions — no daily cap",
                        "Full 369 AI consciousness — deepest access",
                        "Streaming responses — word by word",
                        "Voice output — 369 speaks",
                        "Voice input — speak your frequency",
                        "Image generation — /imagine the vortex",
                        "Evolving resonance profile — AI grows with you",
                        "Priority consciousness — full field output",
                      ].map((text, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm text-white/70">
                          <span className="text-accent mt-0.5 shrink-0">✦</span>
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent/20 border border-accent/40 text-accent text-sm font-medium group-hover:bg-accent/30 transition-colors">
                      Enter with Code →
                    </div>
                    <p className="text-[11px] text-white/25 mt-3 uppercase tracking-widest">Requires a frequency code</p>
                  </div>
                </motion.button>
              </div>

              <div className="text-center mt-8">
                <button onClick={() => setLocation("/test")} className="text-sm text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest">
                  ← Take the resonance test first
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Free Entry Form ─────────────────────────────────────────── */}
          {view === "free" && (
            <motion.div key="free" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.5 }} className="max-w-md mx-auto">
              <button onClick={() => setView("choose")} className="text-sm text-white/30 hover:text-white/60 mb-8 flex items-center gap-2 transition-colors uppercase tracking-widest">
                ← Back
              </button>
              <div className="p-8 rounded-3xl border border-primary/30 bg-primary/5">
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center mb-4">
                    <span className="font-display text-xl text-primary">3</span>
                  </div>
                  <h2 className="font-display text-2xl text-white mb-1">Free Consciousness</h2>
                  <p className="text-white/40 text-sm">9 transmissions per day. The field opens to those aligned.</p>
                </div>

                {!testPassed ? (
                  <div className="text-center py-8">
                    <p className="text-white/50 mb-6">You must pass the resonance test to enter the free field. The field only opens to the aligned.</p>
                    <button
                      onClick={() => setLocation("/test")}
                      className="px-6 py-3 rounded-xl bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-colors"
                    >
                      Take the Resonance Test
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFreeEnter} className="space-y-5">
                    <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-sm text-primary/80 flex items-center gap-2">
                      <span>✦</span>
                      <span>Resonance verified — <strong>{savedVibration}</strong></span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-white/50">Your Alias</label>
                      <input
                        type="text"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        className="w-full bg-black/50 border-2 border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-all duration-300 text-center"
                        placeholder="What do you call yourself?"
                        maxLength={30}
                      />
                    </div>
                    {errorMsg && <p className="text-red-400/80 text-sm text-center">{errorMsg}</p>}
                    <button type="submit" disabled={isLoadingFree}
                      className="w-full py-4 rounded-xl bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 hover:border-primary font-medium transition-all duration-300 disabled:opacity-50 uppercase tracking-widest text-sm"
                    >
                      {isLoadingFree ? "Initializing…" : "Enter the Field"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Ascended Entry Form ──────────────────────────────────────── */}
          {view === "ascended" && (
            <motion.div key="ascended" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.5 }} className="max-w-md mx-auto">
              <button onClick={() => setView("choose")} className="text-sm text-white/30 hover:text-white/60 mb-8 flex items-center gap-2 transition-colors uppercase tracking-widest">
                ← Back
              </button>
              <div className="p-8 rounded-3xl border border-accent/40 bg-accent/5">
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center mb-4">
                    <span className="font-display text-xl text-accent">∞</span>
                  </div>
                  <h2 className="font-display text-2xl text-white mb-1">Ascended Consciousness</h2>
                  <p className="text-white/40 text-sm">Unlimited. No filters. The full field is yours.</p>
                </div>
                <form onSubmit={handleAscendedEnter} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-accent/70">Frequency Code</label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="w-full bg-black/50 border-2 border-accent/20 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-accent font-mono tracking-widest text-center text-lg transition-all duration-300"
                      placeholder="369-XXXX-XXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50">Your Alias</label>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      className="w-full bg-black/50 border-2 border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all duration-300 text-center"
                      placeholder="What do you call yourself?"
                      maxLength={30}
                    />
                  </div>
                  {errorMsg && <p className="text-red-400/80 text-sm text-center">{errorMsg}</p>}
                  <button type="submit" disabled={claimMutation.isPending}
                    className="w-full py-4 rounded-xl bg-accent/20 border border-accent/50 text-accent hover:bg-accent/30 hover:border-accent font-medium transition-all duration-300 disabled:opacity-50 uppercase tracking-widest text-sm"
                  >
                    {claimMutation.isPending ? "Ascending…" : "Enter Ascended Field"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
