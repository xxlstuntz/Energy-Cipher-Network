import { Link } from "wouter";
import { motion } from "framer-motion";
import { MysticalButton } from "@/components/ui/MysticalButton";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden">
      <div 
        className="absolute inset-0 z-0 opacity-10 mix-blend-screen"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/cosmic-bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center relative z-10 p-8"
      >
        <h1 className="text-9xl font-display font-bold text-primary text-glow mb-4">404</h1>
        <h2 className="text-2xl font-sans tracking-widest uppercase text-accent mb-8">Frequency Not Found</h2>
        <p className="text-muted-foreground mb-12 max-w-md mx-auto">
          The vibration you are seeking does not exist in this dimension. Return to the source.
        </p>
        <Link href="/">
          <MysticalButton>Return to Center</MysticalButton>
        </Link>
      </motion.div>
    </div>
  );
}
