"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import dynamic from "next/dynamic";
import { Logo } from "@/components/ui/Logo";

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
      {/* Minimal Header with Logo */}
      <header className="px-6 py-4">
        <Logo size={32} showText={true} />
      </header>

      {/* Main Content - Clean Split View */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Left: Chat Panel */}
        <div
          className={`${
            isChatOpen ? 'w-full md:w-[35%]' : 'w-0'
          } flex flex-col transition-all duration-300 overflow-hidden`}
        >
          <ChatPanel
            conversationId={conversationId}
            onMessageSent={handleMessageSent}
          />
        </div>

        {/* Right: Memory Visualization */}
        <div className={`${
          isChatOpen ? 'hidden md:flex md:w-[65%]' : 'flex w-full'
        } flex-col transition-all duration-300`}>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Memory Network
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Semantic facts (amber) & episodic bubbles (blue)
              </p>
            </div>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
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
