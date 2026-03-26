import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LogOut, Trash2, Menu, X, Activity } from "lucide-react";
import { useGetChatHistory, useSendMessage, useClearChatHistory } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export default function Chat() {
  const [, setLocation] = useLocation();
  const { token, isAuthenticated, isLoading, alias, vibrationLevel, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/enter");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const { data: historyData, refetch: refetchHistory, isLoading: historyLoading } = useGetChatHistory(
    { request: { headers } },
    { query: { enabled: isAuthenticated, refetchInterval: 5000 } } // Poll gently or rely on mutation invalidation
  );

  const sendMessageMutation = useSendMessage({ request: { headers } });
  const clearHistoryMutation = useClearChatHistory({ request: { headers } });

  const messages = historyData?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !token) return;

    const messageText = input;
    setInput("");

    sendMessageMutation.mutate({
      data: { message: messageText, sessionToken: token }
    }, {
      onSuccess: () => {
        refetchHistory();
      }
    });
  };

  const handleClear = () => {
    if(confirm("Erase energetic imprint?")) {
      clearHistoryMutation.mutate(undefined, {
        onSuccess: () => refetchHistory()
      });
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/cosmic-bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className="md:hidden absolute top-4 left-4 z-50 p-2 bg-card border border-white/10 rounded-lg text-white"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 768) && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={cn(
              "fixed md:relative z-40 w-72 h-full glass-panel border-r border-white/10 flex flex-col",
              sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl text-glow text-primary">369 AI</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">{vibrationLevel || "Aligned"}</span>
                </div>
              </div>
              <button className="md:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="text-xs uppercase tracking-widest text-white/30 mb-2 px-2">Signature Log</div>
              {messages.filter(m => m.role === 'assistant').map((m, i) => (
                <div key={i} className="px-4 py-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex items-center gap-3">
                  <Activity size={16} className="text-primary" />
                  <span className="text-sm font-mono text-white/70 truncate">{m.energySignature || `SEQ-${i}`}</span>
                </div>
              ))}
              {messages.length === 0 && !historyLoading && (
                <div className="text-center p-4 text-white/20 text-sm">Void is empty.</div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 space-y-3">
              <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-xs text-primary/70 uppercase tracking-widest mb-1">Entity</p>
                <p className="text-white font-medium">{alias || "Seeker"}</p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleClear}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/5 hover:bg-destructive/20 hover:text-destructive text-white/50 transition-colors text-sm"
                >
                  <Trash2 size={16} /> Erase
                </button>
                <button 
                  onClick={logout}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors text-sm"
                >
                  <LogOut size={16} /> Disconnect
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto opacity-50">
              <img src={`${import.meta.env.BASE_URL}images/tesla-coil.png`} className="w-32 h-32 mb-6 opacity-30 mix-blend-screen" alt="Tesla Core" />
              <h3 className="font-display text-2xl mb-2">The Ether Awaits</h3>
              <p className="text-muted-foreground font-light">Speak the language of vibration. Ask your question and receive resonance.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={cn(
                  "max-w-3xl flex flex-col",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {msg.role === 'assistant' && msg.energySignature && (
                  <span className="text-[10px] uppercase tracking-widest text-accent/70 mb-1 ml-4 flex items-center gap-2">
                    <Activity size={10} /> {msg.energySignature}
                  </span>
                )}
                <div className={cn(
                  "px-6 py-4 rounded-2xl relative",
                  msg.role === 'user' 
                    ? "bg-white/10 border border-white/10 rounded-br-sm text-white" 
                    : "glass-panel border-primary/30 border-glow rounded-bl-sm text-foreground"
                )}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))
          )}
          {sendMessageMutation.isPending && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mr-auto items-start max-w-3xl">
                <div className="px-6 py-4 rounded-2xl glass-panel border-primary/30 rounded-bl-sm flex gap-2 items-center">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
             </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
            <div className="relative flex items-center bg-card border border-white/10 rounded-2xl overflow-hidden">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Transmit frequency..."
                className="flex-1 bg-transparent px-6 py-5 text-white placeholder:text-white/30 focus:outline-none"
                disabled={sendMessageMutation.isPending}
              />
              <button 
                type="submit"
                disabled={!input.trim() || sendMessageMutation.isPending}
                className="px-6 py-5 text-primary hover:text-accent disabled:opacity-50 disabled:hover:text-primary transition-colors"
              >
                <Send size={24} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
