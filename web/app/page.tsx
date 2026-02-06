"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, ArrowRight, ChevronDown, LogOut, Mail, BookOpen, LayoutDashboard, ArrowUpRight, Zap, GitBranch, Menu, X } from "lucide-react";
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between relative">
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

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 hover:bg-muted/50 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-md">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <Link
                href="/"
                onClick={() => setShowMobileMenu(false)}
                className="block py-2 text-sm font-medium text-foreground"
              >
                Home
              </Link>
              <Link
                href="/docs"
                onClick={() => setShowMobileMenu(false)}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Docs
              </Link>
              <Link
                href="/demo"
                onClick={() => setShowMobileMenu(false)}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Live Demo
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setShowMobileMenu(false)}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              <div className="pt-3 border-t border-border/40 flex gap-2">
                {isAuthenticated && user ? (
                  <>
                    <span className="text-sm text-muted-foreground py-2">{user.name}</span>
                    <button
                      onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                      className="text-sm text-red-500 py-2 ml-auto"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/signin" onClick={() => setShowMobileMenu(false)}>
                      <Button variant="ghost" size="sm">Sign In</Button>
                    </Link>
                    <Link href="/signup" onClick={() => setShowMobileMenu(false)}>
                      <Button size="sm" className="rounded-full">Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="relative">
        <section className="container mx-auto px-4 md:px-6 pt-12 pb-12 md:pt-28 md:pb-24">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-8">
            {/* Left — text content */}
            <div className="max-w-xl flex-shrink-0 space-y-6 md:space-y-8">
              {/* Simple beta indicator */}
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Public beta
              </span>

              <div className="space-y-4 md:space-y-5">
                <h1 className="text-[2rem] sm:text-[2.5rem] md:text-[3.5rem] font-bold tracking-tight text-foreground leading-[1.1]">
                  Give Your AI Agents
                  <br />
                  <span className="landing-gradient-text">Context + Memory</span>
                </h1>
                <p className="text-base md:text-xl text-muted-foreground leading-relaxed max-w-md">
                  Give your agents persistent context that grows, connects, and evolves with every conversation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto rounded-full bg-foreground text-background hover:bg-foreground/90 px-6 md:px-7 h-11 md:h-12 text-sm font-semibold shadow-lg shadow-foreground/10">
                    Start building
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="ghost" className="w-full sm:w-auto rounded-full h-11 md:h-12 text-sm font-semibold text-muted-foreground hover:text-foreground px-6 md:px-7 border border-border hover:border-border/80 hover:bg-muted/30">
                    Live demo
                    <ArrowUpRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>

              {/* Quick proof points */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs md:text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                  Multi-Provider
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
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="3" />
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="19" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                  <circle cx="5" cy="12" r="2" />
                  <line x1="12" y1="9" x2="12" y2="7" />
                  <line x1="15" y1="12" x2="17" y2="12" />
                  <line x1="12" y1="15" x2="12" y2="17" />
                  <line x1="9" y1="12" x2="7" y2="12" />
                </svg>
              </div>
              <h3 className="text-[0.9375rem] font-semibold text-foreground mb-2">Bubbles, not rows</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Memories live as semantic facts and episodic bubbles. They connect automatically — no graph database needed.
              </p>
            </div>

            <div className="group landing-feature-card p-6 rounded-2xl border border-border/60 bg-card hover:border-green-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/5">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-5 group-hover:bg-green-500/15 transition-colors">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-[0.9375rem] font-semibold text-foreground mb-2">Search by meaning</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                FAISS-powered vector search finds related memories even when the words don&apos;t match. Fast, accurate, scalable.
              </p>
            </div>

            <div className="group landing-feature-card p-6 rounded-2xl border border-border/60 bg-card hover:border-blue-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-5 group-hover:bg-blue-500/15 transition-colors">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-[0.9375rem] font-semibold text-foreground mb-2">Works anywhere</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                pip install and you&apos;re done. SQLite out of the box, PostgreSQL when you scale. OpenAI or Claude via OpenRouter.
              </p>
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
