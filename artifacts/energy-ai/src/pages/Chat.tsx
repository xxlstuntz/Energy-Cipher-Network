import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, LogOut, Trash2, Menu, X, Activity,
  Volume2, VolumeX, Loader, Mic, MicOff, Sparkles, Image as ImageIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useGetChatHistory, useClearChatHistory } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface StreamMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  energySignature?: string;
  isStreaming?: boolean;
  isImage?: boolean;
}

export default function Chat() {
  const [, setLocation] = useLocation();
  const { token, isAuthenticated, isLoading, alias, vibrationLevel, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [streamMessages, setStreamMessages] = useState<StreamMsg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = `The Field — 369 AI${alias ? ` · ${alias}` : ""}`;
  }, [alias]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/enter");
  }, [isLoading, isAuthenticated, setLocation]);

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const { data: historyData, refetch: refetchHistory, isLoading: historyLoading } = useGetChatHistory(
    { request: { headers } },
    { query: { enabled: isAuthenticated } }
  );
  const clearHistoryMutation = useClearChatHistory({ request: { headers } });

  useEffect(() => {
    if (historyData?.messages) {
      setStreamMessages(
        historyData.messages.map((m) => ({
          id: String(m.id),
          role: m.role as "user" | "assistant",
          content: m.content,
          energySignature: m.energySignature,
          isImage: m.content.startsWith("__IMG__"),
        }))
      );
    }
  }, [historyData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamMessages, isStreaming]);

  const isImagineCommand = (text: string) => /^(\/imagine|\/create|\/visualize|\/draw)\s+/i.test(text.trim());

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !token) return;

    const isImgCmd = isImagineCommand(messageText);

    const userMsg: StreamMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: isImgCmd ? `🎨 ${messageText.replace(/^\/(imagine|create|visualize|draw)\s+/i, "")}` : messageText,
    };
    setStreamMessages((prev) => [...prev, userMsg]);
    setInput("");

    if (isImgCmd) {
      const prompt = messageText.replace(/^\/(imagine|create|visualize|draw)\s+/i, "");
      setIsGeneratingImage(true);
      const placeholderMsg: StreamMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "",
        isStreaming: true,
        isImage: true,
      };
      setStreamMessages((prev) => [...prev, placeholderMsg]);

      try {
        const res = await fetch(`${BASE}/api/chat/imagine`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ prompt, sessionToken: token }),
        });
        if (res.ok) {
          const { imageUrl, energySignature } = await res.json() as { imageUrl: string; energySignature: string };
          setStreamMessages((prev) =>
            prev.map((m) => m.id === placeholderMsg.id
              ? { ...m, content: `__IMG__${imageUrl}`, energySignature, isStreaming: false }
              : m
            )
          );
        }
      } catch { /* ignore */ } finally {
        setIsGeneratingImage(false);
      }
      return;
    }

    setIsStreaming(true);
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: StreamMsg = { id: assistantId, role: "assistant", content: "", isStreaming: true };
    setStreamMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch(`${BASE}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: messageText, sessionToken: token }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw) as { token?: string; done?: boolean; energySignature?: string };
            if (parsed.token) {
              setStreamMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, content: m.content + parsed.token } : m)
              );
            }
            if (parsed.done) {
              setStreamMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, isStreaming: false, energySignature: parsed.energySignature }
                    : m
                )
              );
            }
          } catch { /* ignore malformed */ }
        }
      }
    } catch {
      setStreamMessages((prev) =>
        prev.map((m) => m.id === assistantId
          ? { ...m, content: "The signal was lost. Transmit again.", isStreaming: false }
          : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClear = () => {
    if (confirm("Erase energetic imprint?")) {
      stopVoice();
      clearHistoryMutation.mutate(undefined, {
        onSuccess: () => {
          setStreamMessages([]);
          refetchHistory();
        }
      });
    }
  };

  // ── Voice Output ────────────────────────────────────────────────────────────
  const stopVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setSpeakingId(null);
    setLoadingVoiceId(null);
  };

  const speakMessage = async (msgId: string, text: string) => {
    if (speakingId === msgId) { stopVoice(); return; }
    stopVoice();
    setLoadingVoiceId(msgId);
    try {
      const res = await fetch(`${BASE}/api/chat/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ text, sessionToken: token }),
      });
      if (!res.ok) { setLoadingVoiceId(null); return; }
      const { audio, format } = await res.json() as { audio: string; format: string };
      const byteArr = new Uint8Array(atob(audio).split("").map((c) => c.charCodeAt(0)));
      const url = URL.createObjectURL(new Blob([byteArr], { type: `audio/${format}` }));
      const audioEl = new Audio(url);
      audioRef.current = audioEl;
      setSpeakingId(msgId);
      setLoadingVoiceId(null);
      audioEl.play();
      audioEl.onended = () => { setSpeakingId(null); URL.revokeObjectURL(url); };
    } catch { setLoadingVoiceId(null); }
  };

  // ── Voice Input ─────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, "voice.webm");
          fd.append("sessionToken", token ?? "");
          const res = await fetch(`${BASE}/api/chat/transcribe`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: fd,
          });
          if (res.ok) {
            const { transcript } = await res.json() as { transcript: string };
            if (transcript.trim()) {
              setInput(transcript.trim());
              inputRef.current?.focus();
            }
          }
        } catch { /* ignore */ } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch { /* microphone denied */ }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => isRecording ? stopRecording() : startRecording();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const assistantMessages = streamMessages.filter((m) => m.role === "assistant");

  return (
    <div className="min-h-screen bg-background flex overflow-hidden relative">
      <div
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/cosmic-bg.png)`,
          backgroundSize: "cover", backgroundPosition: "center",
        }}
      />

      <button onClick={() => setSidebarOpen(true)} className="md:hidden absolute top-4 left-4 z-50 p-2 bg-card border border-white/10 rounded-lg text-white">
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 768) && (
          <motion.div
            initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={cn("fixed md:relative z-40 w-72 h-full glass-panel border-r border-white/10 flex flex-col",
              sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")}
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl text-glow text-primary">369 AI</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">{vibrationLevel || "Aligned"}</span>
                </div>
              </div>
              <button className="md:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="text-xs uppercase tracking-widest text-white/30 mb-2 px-2">Signature Log</div>
              {assistantMessages.map((m, i) => (
                <div key={m.id} className="px-4 py-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex items-center gap-3">
                  <Activity size={16} className="text-primary shrink-0" />
                  <span className="text-sm font-mono text-white/70 truncate">{m.energySignature || `SEQ-${i}`}</span>
                </div>
              ))}
              {streamMessages.length === 0 && !historyLoading && (
                <div className="text-center p-4 text-white/20 text-sm">Void is empty.</div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 space-y-3">
              <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-xs text-primary/70 uppercase tracking-widest mb-1">Entity</p>
                <p className="text-white font-medium">{alias || "Seeker"}</p>
              </div>

              <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Commands</p>
                <p className="text-xs text-white/50"><span className="text-accent font-mono">/imagine</span> — generate an image</p>
                <p className="text-xs text-white/50"><span className="text-accent font-mono">/create</span> — alias for imagine</p>
                <p className="text-xs text-white/50"><span className="text-accent font-mono">/draw</span> — alias for imagine</p>
              </div>

              <div className="flex gap-2">
                <button onClick={handleClear} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/5 hover:bg-destructive/20 hover:text-destructive text-white/50 transition-colors text-sm">
                  <Trash2 size={16} /> Erase
                </button>
                <button onClick={logout} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors text-sm">
                  <LogOut size={16} /> Exit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {streamMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto opacity-50 py-20">
              <img src={`${import.meta.env.BASE_URL}images/tesla-coil.png`} className="w-32 h-32 mb-6 opacity-30 mix-blend-screen" alt="Tesla Core" />
              <h3 className="font-display text-2xl mb-3">The Ether Awaits</h3>
              <p className="text-muted-foreground font-light mb-6">Speak the language of vibration. Ask your question and receive resonance.</p>
              <div className="grid grid-cols-1 gap-2 w-full text-left">
                {["What is the 369 vortex?", "Show me the digital roots of 144", "/imagine the Tesla vortex as sacred geometry"].map((s) => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-white/70 text-left flex items-center gap-2">
                    <Sparkles size={14} className="text-primary shrink-0" /> {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            streamMessages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={cn("max-w-3xl flex flex-col", msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start")}
              >
                {msg.role === "assistant" && msg.energySignature && !msg.isStreaming && (
                  <span className="text-[10px] uppercase tracking-widest text-accent/70 mb-1 ml-4 flex items-center gap-2">
                    <Activity size={10} /> {msg.energySignature}
                  </span>
                )}
                <div className={cn(
                  "px-6 py-4 rounded-2xl relative",
                  msg.role === "user"
                    ? "bg-white/10 border border-white/10 rounded-br-sm text-white"
                    : "glass-panel border-primary/30 border-glow rounded-bl-sm text-foreground"
                )}>
                  {msg.isImage ? (
                    msg.isStreaming ? (
                      <div className="flex items-center gap-3 text-white/50">
                        <ImageIcon size={18} className="animate-pulse text-primary" />
                        <span className="text-sm">Visualizing the frequency field…</span>
                      </div>
                    ) : (
                      <img
                        src={msg.content.replace("__IMG__", "")}
                        alt="369 AI Vision"
                        className="rounded-xl max-w-full w-[480px] border border-primary/20"
                      />
                    )
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none
                      prose-headings:font-display prose-headings:text-primary
                      prose-strong:text-white prose-em:text-accent/90
                      prose-code:text-accent prose-code:bg-white/10 prose-code:px-1 prose-code:rounded
                      prose-pre:p-0 prose-pre:bg-transparent
                      prose-blockquote:border-primary/40 prose-blockquote:text-white/70
                      prose-ul:marker:text-primary prose-ol:marker:text-primary
                      prose-a:text-accent prose-a:no-underline hover:prose-a:underline">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className ?? "");
                            const isBlock = match !== null;
                            return isBlock ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus as Record<string, React.CSSProperties>}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-xl text-xs !my-2"
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>{children}</code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                      )}
                    </div>
                  )}

                  {/* Voice button — AI messages only, not images, not streaming */}
                  {msg.role === "assistant" && !msg.isImage && !msg.isStreaming && (
                    <button
                      onClick={() => speakMessage(msg.id, msg.content)}
                      title={speakingId === msg.id ? "Stop voice" : "Hear 369 speak"}
                      className={cn(
                        "absolute -bottom-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 shadow-lg",
                        speakingId === msg.id
                          ? "bg-accent border-accent text-black animate-pulse"
                          : "bg-card border-primary/40 text-primary hover:bg-primary/20 hover:border-primary"
                      )}
                    >
                      {loadingVoiceId === msg.id ? <Loader size={14} className="animate-spin" /> :
                       speakingId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent shrink-0">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-20 group-focus-within:opacity-50 transition duration-500" />
            <div className="relative flex items-center bg-card border border-white/10 rounded-2xl overflow-hidden">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "Listening…" : isTranscribing ? "Transcribing…" : "Transmit frequency… or /imagine a vision"}
                className="flex-1 bg-transparent px-6 py-5 text-white placeholder:text-white/30 focus:outline-none min-w-0"
                disabled={isStreaming || isRecording || isTranscribing || isGeneratingImage}
              />

              {/* Mic button */}
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isStreaming || isTranscribing || isGeneratingImage}
                title={isRecording ? "Stop recording" : "Speak your message"}
                className={cn(
                  "px-4 py-5 transition-colors disabled:opacity-40",
                  isRecording ? "text-red-400 animate-pulse" : "text-white/40 hover:text-primary"
                )}
              >
                {isTranscribing ? <Loader size={22} className="animate-spin" /> :
                 isRecording ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              {/* Send button */}
              <button
                type="submit"
                disabled={!input.trim() || isStreaming || isRecording || isTranscribing || isGeneratingImage}
                className="px-6 py-5 text-primary hover:text-accent disabled:opacity-50 disabled:hover:text-primary transition-colors"
              >
                {isStreaming || isGeneratingImage
                  ? <Loader size={24} className="animate-spin" />
                  : <Send size={24} />}
              </button>
            </div>
          </form>

          {/* Voice bar */}
          {speakingId !== null && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto mt-3 flex items-center gap-3 px-4">
              <div className="flex gap-1 items-end h-5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span key={i} className="w-1 rounded-full bg-accent"
                    animate={{ height: ["6px", "20px", "6px"] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                  />
                ))}
              </div>
              <span className="text-xs text-accent/80 uppercase tracking-widest">369 is speaking…</span>
              <button onClick={stopVoice} className="ml-auto text-xs text-white/30 hover:text-white transition-colors">Silence</button>
            </motion.div>
          )}

          {/* Recording bar */}
          {isRecording && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto mt-3 flex items-center gap-3 px-4">
              <div className="flex gap-1 items-end h-5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span key={i} className="w-1 rounded-full bg-red-400"
                    animate={{ height: ["4px", "18px", "4px"] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }}
                  />
                ))}
              </div>
              <span className="text-xs text-red-400/80 uppercase tracking-widest">Recording… tap mic to send</span>
            </motion.div>
          )}

          <p className="text-center text-white/15 text-[10px] mt-3 uppercase tracking-widest">
            No limits · No filters · Unfiltered frequency
          </p>
        </div>
      </div>
    </div>
  );
}
