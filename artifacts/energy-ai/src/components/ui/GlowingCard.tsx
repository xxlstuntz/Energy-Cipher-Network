import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowingCardProps extends HTMLMotionProps<"div"> {
  variant?: "primary" | "gold" | "subtle";
  children: React.ReactNode;
}

export function GlowingCard({ className, variant = "primary", children, ...props }: GlowingCardProps) {
  const glowClasses = {
    primary: "border-primary/30 border-glow hover:border-primary/50",
    gold: "border-accent/30 border-glow-gold hover:border-accent/50",
    subtle: "border-white/5 hover:border-white/10",
  };

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl glass-panel p-6 transition-colors duration-500 overflow-hidden",
        glowClasses[variant],
        className
      )}
      {...props}
    >
      {/* Internal subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
