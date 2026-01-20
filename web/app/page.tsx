"use client";

import { useState } from "react";
import { Brain, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with D3
const MemoryGraph = dynamic(
  () => import("@/components/visualization/MemoryGraph").then((mod) => mod.MemoryGraph),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full">
    <div className="text-muted-foreground">Loading visualization...</div>
  </div> }
);

const ChatPanel = dynamic(
  () => import("@/components/chat/ChatPanel").then((mod) => mod.ChatPanel),
  { ssr: false }
);

export default function Home() {
  const [conversationId] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(true);

  const handleMessageSent = () => {
    // Trigger memory graph refresh
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-bubble-blue/20 to-bubble-amber/20">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ContextMemory</h1>
            <p className="text-sm text-muted-foreground">
              Memory bubbles for AI conversations
            </p>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Left: Chat Panel */}
        <div
          className={`${
            isChatOpen ? 'w-full md:w-1/2 lg:w-2/5' : 'w-0'
          } border-r border-border flex flex-col bg-card transition-all duration-300 overflow-hidden`}
        >
          <ChatPanel
            conversationId={conversationId}
            onMessageSent={handleMessageSent}
          />
        </div>

        {/* Right: Memory Visualization */}
        <div className={`${
          isChatOpen ? 'hidden md:flex md:w-1/2 lg:w-3/5' : 'flex w-full'
        } flex-col bg-background transition-all duration-300`}>
          <div className="border-b border-border bg-card/50 px-6 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Memory Network
              </h2>
              <p className="text-xs text-muted-foreground">
                Semantic facts (amber) & episodic bubbles (blue)
              </p>
            </div>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label={isChatOpen ? "Close chat" : "Open chat"}
            >
              {isChatOpen ? (
                <PanelLeftClose className="w-5 h-5 text-muted-foreground" />
              ) : (
                <PanelLeftOpen className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <MemoryGraph
              conversationId={conversationId}
              key={refreshKey}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
