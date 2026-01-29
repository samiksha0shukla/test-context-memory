"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, ArrowRight, ChevronDown, LogOut, Mail, BookOpen, LayoutDashboard, ArrowUpRight, Zap, GitBranch } from "lucide-react";
import { DEMO_DATA } from "@/lib/demo-data";

const LandingHeroGraph = dynamic(
  () => import("@/components/visualization/LandingHeroGraph").then((mod) => mod.LandingHeroGraph),
  { ssr: false, loading: () => <div className="w-full max-w-[480px] h-[380px] bg-muted/20 animate-pulse shrink-0 rounded-2xl" /> }
);

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productsDropdownRef = useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle background elements for depth */}
      <div className="landing-grain" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-amber-100/40 via-orange-50/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-50/30 via-transparent to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between relative">
          <Logo size={32} />

          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="text-sm font-medium text-foreground hover:text-amber-600 transition-colors">
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
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-[220px] bg-card border border-border rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200"
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

                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
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
                  <Button variant="ghost" className="text-sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="text-sm rounded-full px-5">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <section className="container mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-12 md:gap-8">
            {/* Left — text content */}
            <div className="max-w-xl flex-shrink-0 space-y-8">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/8 border border-amber-500/15 text-amber-700 text-xs font-medium tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Now in public beta
              </div>

              <div className="space-y-5">
                <h1 className="text-[2.75rem] md:text-[3.5rem] font-bold tracking-tight text-foreground leading-[1.08]">
                  Give Your AI Agents
                  <br />
                  <span className="landing-gradient-text">Context + Memory</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md">
                  Give your agents persistent context that grows, connects, and evolves with every conversation.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-7 h-12 text-sm font-semibold shadow-lg shadow-foreground/10">
                    Start building
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <Link href={isAuthenticated ? "/demo" : "/signin?redirect=/demo"}>
                  <Button size="lg" variant="ghost" className="rounded-full h-12 text-sm font-semibold text-muted-foreground hover:text-foreground px-7 border border-border hover:border-border/80 hover:bg-muted/30">
                    Live demo
                    <ArrowUpRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>

              {/* Quick proof points */}
              <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                  Open source
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                  pip install
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                  Self-hosted
                </span>
              </div>
            </div>

            {/* Right — graph visualization */}
            <div className="hidden md:flex md:flex-shrink-0 md:justify-end">
              <div className="relative">
                {/* Soft glow behind graph */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 via-orange-100/10 to-transparent rounded-3xl blur-2xl scale-110 pointer-events-none" />
                <div className="relative">
                  <LandingHeroGraph data={DEMO_DATA} />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile graph */}
          <div className="mt-12 md:hidden flex justify-center">
            <LandingHeroGraph data={DEMO_DATA} />
          </div>
        </section>

        {/* How it works — inline code snippet */}
        <section className="container mx-auto px-6 pb-20 md:pb-28">
          <div className="landing-code-card rounded-2xl border border-border/60 bg-[#1C1C1C] p-6 md:p-8 max-w-2xl mx-auto shadow-2xl shadow-black/5">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
              <span className="ml-3 text-xs text-white/30 font-mono">quickstart.py</span>
            </div>
            <pre className="text-sm md:text-[0.8125rem] leading-relaxed font-mono overflow-x-auto">
              <code>
                <span className="text-[#c586c0]">from</span>
                <span className="text-[#d4d4d4]"> contextmemory </span>
                <span className="text-[#c586c0]">import</span>
                <span className="text-[#d4d4d4]"> create_table, </span>
                <span className="text-[#4ec9b0]">Memory</span>
                <span className="text-[#d4d4d4]">, SessionLocal</span>
                {"\n\n"}
                <span className="text-[#6a9955]"># Setup</span>
                {"\n"}
                <span className="text-[#dcdcaa]">create_table</span>
                <span className="text-[#d4d4d4]">()</span>
                {"\n"}
                <span className="text-[#9cdcfe]">memory</span>
                <span className="text-[#d4d4d4]"> = </span>
                <span className="text-[#4ec9b0]">Memory</span>
                <span className="text-[#d4d4d4]">(</span>
                <span className="text-[#dcdcaa]">SessionLocal</span>
                <span className="text-[#d4d4d4]">())</span>
                {"\n\n"}
                <span className="text-[#6a9955]"># Add memories from a conversation</span>
                {"\n"}
                <span className="text-[#9cdcfe]">memory</span>
                <span className="text-[#d4d4d4]">.</span>
                <span className="text-[#dcdcaa]">add</span>
                <span className="text-[#d4d4d4]">(</span>
                <span className="text-[#9cdcfe]">messages</span>
                <span className="text-[#d4d4d4]">=[</span>
                {"\n"}
                <span className="text-[#d4d4d4]">    {"{"}</span>
                <span className="text-[#ce9178]">&quot;role&quot;</span>
                <span className="text-[#d4d4d4]">: </span>
                <span className="text-[#ce9178]">&quot;user&quot;</span>
                <span className="text-[#d4d4d4]">, </span>
                <span className="text-[#ce9178]">&quot;content&quot;</span>
                <span className="text-[#d4d4d4]">: </span>
                <span className="text-[#ce9178]">&quot;I love Python programming&quot;</span>
                <span className="text-[#d4d4d4]">{"}"}</span>
                {"\n"}
                <span className="text-[#d4d4d4]">], </span>
                <span className="text-[#9cdcfe]">conversation_id</span>
                <span className="text-[#d4d4d4]">=</span>
                <span className="text-[#b5cea8]">1</span>
                <span className="text-[#d4d4d4]">)</span>
                {"\n\n"}
                <span className="text-[#6a9955]"># Search memories</span>
                {"\n"}
                <span className="text-[#9cdcfe]">results</span>
                <span className="text-[#d4d4d4]"> = </span>
                <span className="text-[#9cdcfe]">memory</span>
                <span className="text-[#d4d4d4]">.</span>
                <span className="text-[#dcdcaa]">search</span>
                <span className="text-[#d4d4d4]">(</span>
                <span className="text-[#ce9178]">&quot;What does the user like?&quot;</span>
                <span className="text-[#d4d4d4]">, </span>
                <span className="text-[#9cdcfe]">conversation_id</span>
                <span className="text-[#d4d4d4]">=</span>
                <span className="text-[#b5cea8]">1</span>
                <span className="text-[#d4d4d4]">)</span>
              </code>
            </pre>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-6 pb-24 md:pb-32">
          <div className="text-center max-w-lg mx-auto mb-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Context, not just storage
            </h2>
            <p className="mt-3 text-muted-foreground">
              Your AI agents deserve memory that understands relationships between ideas, not a flat key-value store.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <div className="group landing-feature-card p-6 rounded-2xl border border-border/60 bg-card hover:border-amber-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-5 group-hover:bg-amber-500/15 transition-colors">
                <Brain className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-[0.9375rem] font-semibold text-foreground mb-2">Living context graphs</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Memories form a living graph. Semantic and episodic nodes connect and strengthen over time, building real understanding.
              </p>
            </div>

            <div className="group landing-feature-card p-6 rounded-2xl border border-border/60 bg-card hover:border-green-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/5">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-5 group-hover:bg-green-500/15 transition-colors">
                <GitBranch className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-[0.9375rem] font-semibold text-foreground mb-2">Relationship-aware recall</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Retrieve memories by meaning, not keywords. Connected nodes surface the full context your agent needs.
              </p>
            </div>

            <div className="group landing-feature-card p-6 rounded-2xl border border-border/60 bg-card hover:border-blue-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-5 group-hover:bg-blue-500/15 transition-colors">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-[0.9375rem] font-semibold text-foreground mb-2">Three lines to integrate</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                pip install, initialize, and go. Works with any Python agent framework — LangChain, CrewAI, or your own.
              </p>
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="border-y border-border/40 bg-muted/20">
          <div className="container mx-auto px-6 py-16 md:py-20 text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Ready to give your agents memory?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Start for free. No credit card, no vendor lock-in.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-7 h-12 text-sm font-semibold shadow-lg shadow-foreground/10">
                  Get started free
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="ghost" className="rounded-full h-12 text-sm font-semibold text-muted-foreground hover:text-foreground px-7 border border-border hover:border-border/80 hover:bg-muted/30">
                  Read the docs
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background">
        <div className="container mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Logo size={24} />
              <span className="text-sm text-muted-foreground">
                AI memory, made visual.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://x.com/contextmemory"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/contextmemory"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="mailto:hello@contextmemory.ai"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="w-[18px] h-[18px]" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
