"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, LogOut, Key } from "lucide-react";
import dynamic from "next/dynamic";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { ApiKeyModal } from "@/components/api-key/ApiKeyModal";

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, refreshApiKeyStatus } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleMessageSent = () => {
    // Memory graph will auto-refresh via SWR mutate
  };

  const handleApiKeySuccess = async () => {
    await refreshApiKeyStatus();
    setShowApiKeyModal(false);
  };

  const userName = user?.name || "User";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top Navbar - thin, matching reference image exactly */}
      <nav className="flex items-center justify-between h-14 px-6 border-b border-border/50 bg-card/50 backdrop-blur-sm flex-shrink-0">
        {/* Left: Logo + Panel Toggle */}
        <div className="flex items-center gap-4">
          <Logo size={28} showText={false} />

          {/* Panel Toggle Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-1.5 hover:bg-muted/50 rounded-md transition-colors"
            aria-label={isChatOpen ? "Close chat" : "Open chat"}
          >
            {isChatOpen ? (
              <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Right: User's Space + Actions */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {userName}'s space
          </span>

          {/* API Key Button */}
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="p-1.5 hover:bg-muted/50 rounded-md transition-colors"
            aria-label="Manage API Key"
            title="Manage API Key"
          >
            <Key className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-1.5 hover:bg-muted/50 rounded-md transition-colors disabled:opacity-50"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* User Avatar/Initial */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-semibold">
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat Panel */}
        <div
          className={`${
            isChatOpen ? 'w-full md:w-[35%]' : 'w-0'
          } flex flex-col transition-all duration-300 overflow-hidden`}
        >
          <ChatPanel onMessageSent={handleMessageSent} />
        </div>

        {/* Right: Memory Visualization */}
        <div className={`${
          isChatOpen ? 'hidden md:flex md:w-[65%]' : 'flex w-full'
        } flex-col transition-all duration-300`}>
          <div className="flex-1 overflow-hidden w-full h-full">
            <MemoryGraph />
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal
          onSuccess={handleApiKeySuccess}
          onClose={() => setShowApiKeyModal(false)}
          canClose={true}
        />
      )}
    </div>
  );
}
