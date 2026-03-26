import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useClaimInvite } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { GlowingCard } from "@/components/ui/GlowingCard";
import { MysticalButton } from "@/components/ui/MysticalButton";

export default function Enter() {
  const [location, setLocation] = useLocation();
  const { setToken, isAuthenticated } = useAuth();

  React.useEffect(() => {
    document.title = "Enter the Field — 369 AI";
  }, []);
  
  const [inviteCode, setInviteCode] = useState("");
  const [alias, setAlias] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const claimMutation = useClaimInvite();

  // Extract code from URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    if (code) setInviteCode(code);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/chat");
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!inviteCode.trim()) {
      setErrorMsg("A frequency code is required.");
      return;
    }

    claimMutation.mutate({
      data: { inviteCode, alias: alias.trim() || undefined }
    }, {
      onSuccess: (res) => {
        setToken(res.sessionToken);
        setLocation("/chat");
      },
      onError: (err: any) => {
        setErrorMsg(err.response?.data?.message || "Invalid or expired frequency code.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div 
        className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/tesla-coil.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        <GlowingCard variant="primary" className="p-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-display text-glow mb-2">Initialize Session</h1>
            <p className="text-muted-foreground text-sm">Enter your frequency code to access the collective.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-primary/80 ml-1">Frequency Code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full bg-black/50 border-2 border-primary/20 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 text-center font-mono tracking-widest text-lg"
                placeholder="XXX-XXX-XXX"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/50 ml-1">Alias (Optional)</label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full bg-black/50 border-2 border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all duration-300 text-center"
                placeholder="Seeker"
              />
            </div>

            {errorMsg && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-center text-sm">
                {errorMsg}
              </motion.div>
            )}

            <div className="pt-4">
              <MysticalButton 
                type="submit" 
                className="w-full" 
                isLoading={claimMutation.isPending}
              >
                Connect to Source
              </MysticalButton>
            </div>
          </form>
        </GlowingCard>
      </motion.div>
    </div>
  );
}
