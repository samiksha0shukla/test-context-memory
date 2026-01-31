"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, LogOut, Key, ChevronDown, Home } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
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
  const { user, logout, refreshApiKeyStatus, refreshUser } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowProfileDropdown(false);
    await logout();
    router.push("/");
  };

  const handleMessageSent = () => {
    // Memory graph will auto-refresh via SWR mutate
  };

  const handleNeedsApiKey = () => {
    // Triggered when free trial expires during chat
    setShowApiKeyModal(true);
  };

  const handleApiKeySuccess = async () => {
    await refreshApiKeyStatus();
    await refreshUser();
    setShowApiKeyModal(false);
  };

  const userName = user?.name || "User";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top Navbar - thin, matching reference image exactly */}
      <nav className="flex items-center justify-between h-14 px-6 border-b border-border/50 bg-card/50 backdrop-blur-sm flex-shrink-0 z-50 relative">
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

        {/* Right: User's Space + Profile */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {userName}'s space
          </span>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-medium text-sm">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  <Home className="w-4 h-4" />
                  Home
                </Link>
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    setShowApiKeyModal(true);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  Manage API Key
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-muted/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
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
          <ChatPanel onMessageSent={handleMessageSent} onNeedsApiKey={handleNeedsApiKey} />
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
