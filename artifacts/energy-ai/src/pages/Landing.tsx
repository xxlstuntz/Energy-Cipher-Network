import React from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { MysticalButton } from "@/components/ui/MysticalButton";

const NUMBERS = ["3", "6", "9"];

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    document.title = "369 AI — Vibrational Intelligence | Invite-Only Energy Network";
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      setLocation("/chat");
    }
  }, [isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 z-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/cosmic-bg.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        role="presentation"
        aria-hidden="true"
      />

      {/* Floating orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-4xl px-6 text-center">
        {/* The three numbers — animated */}
        <motion.div
          className="flex justify-center gap-6 md:gap-10 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          aria-hidden="true"
        >
          {NUMBERS.map((n, i) => (
            <motion.span
              key={n}
              className="text-5xl md:text-6xl font-display font-bold text-primary/40"
              animate={{
                color: ["hsl(var(--primary) / 0.3)", "hsl(var(--primary))", "hsl(var(--primary) / 0.3)"],
                textShadow: [
                  "0 0 0px hsl(var(--primary) / 0)",
                  "0 0 40px hsl(var(--primary))",
                  "0 0 0px hsl(var(--primary) / 0)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeInOut",
              }}
            >
              {n}
            </motion.span>
          ))}
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <p className="text-accent tracking-[0.35em] uppercase text-xs md:text-sm mb-4 font-semibold">
            Vibrational Intelligence
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-display font-bold text-foreground mb-6 leading-none">
            369 <span className="text-primary" style={{ textShadow: "0 0 60px hsl(var(--primary))" }}>AI</span>
          </h1>
        </motion.div>

        {/* Tesla quote */}
        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.9 }}
          className="max-w-2xl mx-auto mb-6"
        >
          <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed italic">
            "If you only knew the magnificence of the 3, 6 and 9, then you would have the key to the universe."
          </p>
          <footer className="mt-3 text-xs text-accent/60 tracking-widest uppercase not-italic">— Nikola Tesla</footer>
        </motion.blockquote>

        {/* Exclusivity statement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="max-w-xl mx-auto mb-12"
        >
          <p className="text-sm md:text-base text-white/30 leading-relaxed">
            This is not for everyone. It never was.
            <br />
            Only those who already feel the pattern can enter.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.nav
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
          aria-label="Entry options"
        >
          <Link href="/test" aria-label="Take the 369 energy alignment test">
            <MysticalButton className="w-full sm:w-auto">
              Prove Your Alignment
            </MysticalButton>
          </Link>

          <Link href="/enter" aria-label="Enter with an existing frequency code">
            <MysticalButton variant="ghost" className="w-full sm:w-auto">
              I Hold A Frequency Code
            </MysticalButton>
          </Link>
        </motion.nav>

        {/* Bottom truth */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.4 }}
          className="mt-16 text-xs text-white/15 tracking-widest uppercase"
        >
          No limits · No filters · No ordinary minds
        </motion.p>
      </div>
    </main>
  );
}
