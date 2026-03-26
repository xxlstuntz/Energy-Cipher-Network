import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface MysticalButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "gold" | "ghost";
  isLoading?: boolean;
}

export const MysticalButton = React.forwardRef<HTMLButtonElement, MysticalButtonProps>(
  ({ className, variant = "primary", isLoading, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary/20 border-primary/50 text-primary-foreground hover:bg-primary/30 hover:border-primary border-glow shadow-[0_0_20px_hsl(var(--primary)/0.3)]",
      gold: "bg-accent/20 border-accent/50 text-accent hover:bg-accent/30 hover:border-accent border-glow-gold text-glow-gold shadow-[0_0_20px_hsl(var(--accent)/0.3)]",
      ghost: "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        disabled={disabled || isLoading}
        className={cn(
          "relative px-8 py-4 rounded-xl border backdrop-blur-md font-display tracking-widest uppercase text-sm transition-all duration-300 overflow-hidden",
          variants[variant],
          (disabled || isLoading) && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit z-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className={cn(
                "w-5 h-5 border-2 border-t-transparent rounded-full",
                variant === 'gold' ? "border-accent" : "border-white"
              )}
            />
          </div>
        )}
        <span className={cn("relative z-10", isLoading && "opacity-0")}>{children}</span>
        
        {/* Sweep effect */}
        {!disabled && !isLoading && (
          <motion.div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
            whileHover={{ translateX: "200%" }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />
        )}
      </motion.button>
    );
  }
);
MysticalButton.displayName = "MysticalButton";
