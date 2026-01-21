"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { Message } from "@/types/memory";
import { cn, formatRelativeTime } from "@/lib/utils";

interface ChatPanelProps {
  conversationId: number;
  onMessageSent?: () => void;
}

export function ChatPanel({ conversationId, onMessageSent }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep connection alive (data not used in Pickle OS minimal design)
  useSWR(
    `/memories/${conversationId}`,
    () => api.getMemories(conversationId),
    { refreshInterval: 5000 }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.chat(userMessage.content, conversationId);

      const assistantMessage: Message = {
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
        extractedMemories: response.extracted_memories,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Trigger memory graph refresh
      onMessageSent?.();
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-sm text-muted-foreground max-w-sm">
              Start a conversation to see your memory bubbles grow
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <>
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col message-enter",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-muted/70 text-foreground"
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="text-xs text-muted-foreground mt-1.5 px-1">
                  {message.timestamp ? formatRelativeTime(message.timestamp) : ""}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start message-enter">
                <div className="bg-muted/70 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Minimal Input Area */}
      <div className="px-6 py-5 border-t border-border/50">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Talk to your memory"
            className="w-full resize-none rounded-xl border border-input bg-background/50 px-4 py-3 pr-20 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:border-accent min-h-[56px] max-h-[160px] transition-all"
            disabled={isLoading}
            rows={1}
          />

          {/* Action Buttons */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-lg bg-foreground text-background hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
