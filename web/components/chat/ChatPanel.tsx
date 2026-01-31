"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, ArrowUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Message } from "@/types/memory";
import type { ExtractedMemory } from "@/types/api";
import { cn, formatRelativeTime } from "@/lib/utils";

interface ChatPanelProps {
  onMessageSent?: () => void;
  onNeedsApiKey?: () => void;
}

export function ChatPanel({ onMessageSent, onNeedsApiKey }: ChatPanelProps) {
  const { user, updateUsageFromChat } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep connection alive and auto-refresh memories
  useSWR(
    "/memories",
    () => api.getMemories(),
    { refreshInterval: 5000 }
  );

  // Fetch chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        const history = await api.getChatHistory();
        // Convert API messages to internal Message format
        const loadedMessages: Message[] = history.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at,
          extractedMemories: msg.extracted_memories ? {
            semantic: (msg.extracted_memories.semantic || []).map((m: ExtractedMemory) => ({
              id: m.id,
              local_id: m.local_id,
              text: m.text,
              type: m.type,
            })),
            bubbles: (msg.extracted_memories.bubbles || []).map((m: ExtractedMemory) => ({
              id: m.id,
              local_id: m.local_id,
              text: m.text,
              type: m.type,
            })),
          } : undefined,
        }));
        setMessages(loadedMessages);
      } catch (error) {
        console.error("Failed to load chat history:", error);
        // Silent fail - just start with empty messages
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [user]);

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
      const response = await api.chat(userMessage.content);

      const assistantMessage: Message = {
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
        extractedMemories: response.extracted_memories,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update usage info from response
      if (response.usage) {
        updateUsageFromChat(response.usage);
      }

      // Show toast for extracted memories with IDs
      const { semantic, bubbles } = response.extracted_memories;
      if (semantic.length > 0 || bubbles.length > 0) {
        const parts = [];
        if (semantic.length > 0) {
          const ids = semantic.map(m => `#${m.local_id}`).join(", ");
          parts.push(`${semantic.length} fact${semantic.length !== 1 ? 's' : ''} (${ids})`);
        }
        if (bubbles.length > 0) {
          const ids = bubbles.map(m => `#${m.local_id}`).join(", ");
          parts.push(`${bubbles.length} bubble${bubbles.length !== 1 ? 's' : ''} (${ids})`);
        }
        toast.success(`Extracted: ${parts.join(", ")}`, { duration: 4000 });
      }

      // Trigger immediate memory graph refresh using SWR mutate
      mutate("/memories");
      onMessageSent?.();
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";

      // Handle API key required error (free trial expired)
      if (errorMessage === "API_KEY_REQUIRED") {
        toast.error("Free trial ended. Please add your OpenRouter API key to continue.");
        onNeedsApiKey?.();
      } else {
        toast.error(errorMessage);
      }

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
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-2" />
            <div className="text-sm text-muted-foreground">Loading chat history...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-sm text-muted-foreground max-w-sm">
              Start a conversation to see your memory bubbles grow
            </div>
          </div>
        ) : null}

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

                {/* Memory extraction indicator */}
                {message.role === "assistant" && message.extractedMemories && (
                  <>
                    {message.extractedMemories.semantic.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 px-1 text-xs text-amber-600">
                        <span>
                          Fact{message.extractedMemories.semantic.length !== 1 ? 's' : ''}: {message.extractedMemories.semantic.map(m => `#${m.local_id}`).join(", ")}
                        </span>
                      </div>
                    )}
                    {message.extractedMemories.bubbles.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 px-1 text-xs text-emerald-600">
                        <span>
                          Bubble{message.extractedMemories.bubbles.length !== 1 ? 's' : ''}: {message.extractedMemories.bubbles.map(m => `#${m.local_id}`).join(", ")}
                        </span>
                      </div>
                    )}
                  </>
                )}
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
        {/* Free trial message counter */}
        {user && !user.usage.has_api_key && (
          <div className="flex items-center justify-center gap-2 mb-3 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{user.usage.free_messages_remaining}</span>
              /{user.usage.free_message_limit} free messages remaining
            </span>
          </div>
        )}

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

          {/* Action Buttons - vertically centered */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
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
