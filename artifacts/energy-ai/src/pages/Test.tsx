import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useVerifyEnergyTest } from "@workspace/api-client-react";
import { GlowingCard } from "@/components/ui/GlowingCard";
import { MysticalButton } from "@/components/ui/MysticalButton";
import { Link } from "wouter";

const QUESTIONS = [
  {
    id: "q1",
    text: "What is the sum of the digits of the universe's base frequency (432Hz)?",
    options: ["3", "6", "9", "12"],
  },
  {
    id: "q2",
    text: "In the sequence of doubling (1, 2, 4, 8, 7, 5), which numbers are conspicuously absent, governing the physical realm from the ethereal?",
    options: ["1, 2, 4", "3, 6, 9", "8, 7, 5", "0, 1, 1"],
  },
  {
    id: "q3",
    text: "A circle has 360 degrees (3+6+0=9). Halve it to 180 (1+8+0=9). What is the fundamental geometric property of 9?",
    options: ["It represents chaos", "It is divisible by 3", "It is the highest prime", "It always returns to itself"],
  },
  {
    id: "q4",
    text: "If 3 represents creation and 6 represents preservation, what does 9 represent?",
    options: ["Destruction", "Matter", "Completion and the Void", "Time"],
  },
  {
    id: "q5",
    text: "If energy is frequency, and frequency is vibration, what is the language they use to communicate?",
    options: ["Gravity", "Resonance", "Light", "Sound"],
  },
  {
    id: "q6",
    text: "To find the secrets of the universe, think in terms of...",
    options: ["Mass, Velocity, Time", "Atoms, Quarks, Strings", "Mind, Body, Spirit", "Energy, Frequency, Vibration"],
  }
];

export default function Test() {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{questionId: string, answer: string}[]>([]);
  const [result, setResult] = useState<{passed: boolean, message: string, inviteCode?: string | null} | null>(null);

  const verifyMutation = useVerifyEnergyTest();

  const handleSelect = (answer: string) => {
    const newAnswers = [...answers, { questionId: QUESTIONS[currentIndex].id, answer }];
    setAnswers(newAnswers);

    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(curr => curr + 1);
    } else {
      submitTest(newAnswers);
    }
  };

  const submitTest = (finalAnswers: {questionId: string, answer: string}[]) => {
    verifyMutation.mutate({
      data: { answers: finalAnswers }
    }, {
      onSuccess: (res) => {
        setResult({
          passed: res.passed,
          message: res.message,
          inviteCode: res.inviteCode
        });
        if (res.passed) {
          sessionStorage.setItem("369_vibration", res.vibrationLevel || "Frequency Seeker");
          sessionStorage.setItem("369_test_passed", "true");
        }
      },
      onError: () => {
        setResult({ passed: false, message: "A disruption in the ether prevented verification." });
      }
    });
  };

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
        <GlowingCard variant={result.passed ? "gold" : "primary"} className="w-full max-w-2xl text-center py-16">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
            <h2 className={cn(
              "text-3xl md:text-5xl font-display mb-6",
              result.passed ? "text-accent text-glow-gold" : "text-primary text-glow"
            )}>
              {result.passed ? "Resonance Achieved" : "Frequency Mismatch"}
            </h2>
            <p className="text-xl text-muted-foreground mb-12 font-light">
              {result.message}
            </p>

            {result.passed ? (
              <div className="space-y-4">
                <p className="text-sm text-white/50 uppercase tracking-widest mb-6">Choose your consciousness tier</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/enter?path=free">
                    <MysticalButton>Enter Free Field</MysticalButton>
                  </Link>
                  <Link href="/enter?path=ascended">
                    <MysticalButton variant="gold">Enter Ascended ∞</MysticalButton>
                  </Link>
                </div>
              </div>
            ) : (
              <MysticalButton onClick={() => window.location.reload()}>
                Realign & Retry
              </MysticalButton>
            )}
          </motion.div>
        </GlowingCard>
      </div>
    );
  }

  const question = QUESTIONS[currentIndex];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative">
      <div className="absolute top-8 left-8">
        <Link href="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 text-sm uppercase tracking-widest">
          ← Abandon
        </Link>
      </div>

      <div className="w-full max-w-3xl">
        <div className="mb-12 flex justify-center gap-3">
          {QUESTIONS.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i < currentIndex ? "w-8 bg-primary shadow-[0_0_10px_hsl(var(--primary))]" : 
                i === currentIndex ? "w-16 bg-accent shadow-[0_0_10px_hsl(var(--accent))]" : "w-4 bg-white/10"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <GlowingCard className="p-8 md:p-12">
              <h3 className="text-accent text-sm tracking-[0.3em] mb-4 font-semibold uppercase">
                Frequency {currentIndex + 1} / 6
              </h3>
              <p className="text-2xl md:text-3xl font-display leading-relaxed mb-12">
                {question.text}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(opt)}
                    className="p-6 text-left rounded-xl border border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/50 transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 w-0 bg-gradient-to-r from-primary/20 to-transparent group-hover:w-full transition-all duration-700 ease-out" />
                    <span className="relative z-10 text-foreground group-hover:text-white transition-colors">{opt}</span>
                  </button>
                ))}
              </div>
            </GlowingCard>
          </motion.div>
        </AnimatePresence>

        {verifyMutation.isPending && (
          <div className="mt-8 text-center text-primary animate-pulse tracking-widest uppercase text-sm">
            Analyzing Vibrational Signature...
          </div>
        )}
      </div>
    </div>
  );
}

// Helper utility defined here if not imported
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
