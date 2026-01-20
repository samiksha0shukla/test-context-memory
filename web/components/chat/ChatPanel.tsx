"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageSquarePlus, Trash2, Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { Message } from "@/types/memory";
import { Button } from "@/components/ui/button";
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

  // Fetch memory stats
  const { data: memoryData } = useSWR(
    `/memories/${conversationId}`,
    () => api.getMemories(conversationId),
    { refreshInterval: 5000 }
  );

  // Calculate stats
  const totalMemories = memoryData?.nodes.length || 0;
  const semanticCount = memoryData?.nodes.filter(n => n.type === "semantic").length || 0;
  const episodicCount = totalMemories - semanticCount;
  const connectionCount = memoryData?.links.length || 0;

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

      // Show toast for extracted memories
      const { semantic, bubbles } = response.extracted_memories;
      if (semantic.length > 0 || bubbles.length > 0) {
        toast.success(
          `✓ Extracted: ${semantic.length} facts, ${bubbles.length} bubbles`,
          { duration: 3000 }
        );
      }

      // Trigger memory graph refresh
      onMessageSent?.();
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message");
      // Remove the user message on error
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

  const handleClearChat = () => {
    setMessages([]);
    toast.info("Chat cleared");
  };

  const handleNewConversation = () => {
    setMessages([]);
    toast.success("Started new conversation");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with stats */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Chat</h2>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              title="New conversation"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="h-8 px-2 text-muted-foreground hover:text-destructive"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Memory Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[hsl(36,100%,70%)]"></div>
            <span>{semanticCount} facts</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[hsl(142,76%,36%)]"></div>
            <span>{episodicCount} bubbles</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{connectionCount} links</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Start a Conversation
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Chat with the AI and watch your memories form a beautiful network
              of connected bubbles.
            </p>
          </div>
        )}

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
                "max-w-[85%] rounded-lg px-4 py-3",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            
            {/* Timestamp */}
            <span className="text-[10px] text-muted-foreground mt-1 px-1">
              {message.timestamp ? formatRelativeTime(message.timestamp) : ""}
            </span>
            
            {/* Memory extraction indicator */}
            {message.role === "assistant" && message.extractedMemories && (
              (message.extractedMemories.semantic.length > 0 || 
               message.extractedMemories.bubbles.length > 0) && (
                <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-emerald-600">
                  <Sparkles className="w-3 h-3" />
                  <span>
                    +{message.extractedMemories.semantic.length} facts, 
                    +{message.extractedMemories.bubbles.length} bubbles
                  </span>
                </div>
              )
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start message-enter">
            <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send)"
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] max-h-[200px]"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-auto"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press <kbd className="px-1 py-0.5 rounded border bg-muted">Enter</kbd>{" "}
          to send, <kbd className="px-1 py-0.5 rounded border bg-muted">Shift+Enter</kbd>{" "}
          for new line
        </p>
      </div>
    </div>
  );
}
