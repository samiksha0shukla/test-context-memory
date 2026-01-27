"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, Sparkles, Network, ArrowRight, ChevronDown, LogOut, Mail, BookOpen, LayoutDashboard } from "lucide-react";
import { DEMO_DATA } from "@/lib/demo-data";

const LandingHeroGraph = dynamic(
  () => import("@/components/visualization/LandingHeroGraph").then((mod) => mod.LandingHeroGraph),
  { ssr: false, loading: () => <div className="w-full max-w-[480px] h-[380px] bg-muted/20 animate-pulse shrink-0" /> }
);

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowProfileDropdown(false);
      }
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(target)) {
        setShowProductsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowProfileDropdown(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between relative">
          {/* Left: Logo */}
          <Logo size={32} />

          {/* Center: Navigation Links - absolutely centered */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="text-sm font-medium text-foreground hover:text-amber-500 transition-colors">
              Home
            </Link>
            <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <div ref={productsDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileDropdown(false);
                  setShowProductsDropdown((v) => !v);
                }}
                aria-expanded={showProductsDropdown}
                aria-haspopup="true"
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Products
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showProductsDropdown ? "rotate-180" : ""}`} />
              </button>
              {showProductsDropdown && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-[220px] bg-card border border-border rounded-lg shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200"
                  role="menu"
                >
                  <Link
                    href="/docs"
                    role="menuitem"
                    onClick={() => setShowProductsDropdown(false)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors border-b border-border"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex flex-col gap-0.5">
                      <span>Pip package</span>
                      <span className="text-xs text-muted-foreground">Docs & API</span>
                    </span>
                  </Link>
                  <Link
                    href="/dashboard"
                    role="menuitem"
                    onClick={() => setShowProductsDropdown(false)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex flex-col gap-0.5">
                      <span>Interactive dashboard</span>
                      <span className="text-xs text-muted-foreground">Visualize memories</span>
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Auth Buttons or Profile */}
          <div className="flex items-center gap-4">
            {isLoading ? null : isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    setShowProductsDropdown(false);
                    setShowProfileDropdown((v) => !v);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <ArrowRight className="w-4 h-4" />
                      Go to Dashboard
                    </Link>
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
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section — two columns: left = text/CTAs, right = bubble graph */}
      <main className="container mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-6">
          <div className="max-w-xl flex-shrink-0">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.15]">
              Give Your AI Agents
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                Context + Memory
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Not just storage, but understanding.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button size="lg" className="rounded-lg bg-foreground text-background hover:bg-foreground/90 px-6">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href={isAuthenticated ? "/demo" : "/signin?redirect=/demo"}>
                <Button size="lg" variant="secondary" className="rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30 px-6">
                  <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                  Try Demo
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:flex md:flex-shrink-0 md:justify-end md:-translate-x-4">
            <LandingHeroGraph data={DEMO_DATA} />
          </div>
        </div>
        <div className="mt-12 md:hidden flex justify-center -translate-x-4">
          <LandingHeroGraph data={DEMO_DATA} />
        </div>

        {/* Features — uniform, color-coded (amber, green, blue) */}
        <div className="mt-28 md:mt-36 grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-border bg-card border-l-4 border-l-amber-500/70">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
              <Brain className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">Living Context Graphs</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              ContextMemory builds living context graphs from your AI interactions.
              Watch as semantic and episodic memories form bubbles and connections.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card border-l-4 border-l-green-600/70">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <Network className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">Smarter Agent Responses</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Power smarter, more contextual agent responses with interconnected memory bubbles
              that understand relationships between ideas.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card border-l-4 border-l-blue-500/70">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">Beyond Storage</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Not just storage, but true understanding. Your AI agents gain context awareness
              that grows and evolves with every interaction.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-24 bg-muted/20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Built with ContextMemory - AI Memory Made Visual
            </p>
            <div className="flex items-center gap-6">
              {/* X (Twitter) */}
              <a
                href="https://x.com/contextmemory"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="https://linkedin.com/company/contextmemory"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              {/* Email */}
              <a
                href="mailto:hello@contextmemory.ai"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
