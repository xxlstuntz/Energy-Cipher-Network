import React from "react";
import { useLocation } from "wouter";
import { MessageSquare, Users, Rss, Mail, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { path: "/chat",      icon: MessageSquare, label: "369 AI"    },
  { path: "/community", icon: Users,         label: "Room"      },
  { path: "/feed",      icon: Rss,           label: "Feed"      },
  { path: "/dm",        icon: Mail,          label: "Snaps"     },
  { path: "/pricing",   icon: Zap,           label: "Ascend"    },
];

export function NavBar() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 border-t border-white/10 backdrop-blur-xl">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2">
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = location === path || location.startsWith(path + "/");
          return (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[52px]",
                active
                  ? "text-primary bg-primary/10"
                  : "text-white/30 hover:text-white/60"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[9px] uppercase tracking-widest">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
