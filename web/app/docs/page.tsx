"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, ChevronDown, LogOut, Mail, BookOpen, LayoutDashboard } from "lucide-react";

export default function DocsPage() {
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
    <div className="min-h-screen bg-background">
      {/* Header - same as landing, Docs active */}
      <header className="border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between relative">
          <Logo size={32} />
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/docs" className="text-sm font-medium text-foreground text-amber-500 transition-colors">
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
                    {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showProfileDropdown ? "rotate-180" : ""}`} />
                </button>
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

      <main className="container mx-auto px-6 py-8 md:py-12 max-w-4xl">
        {/* Hero */}
        <section className="mb-12">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
            <BookOpen className="w-4 h-4" />
            <span>Context Memory</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Documentation
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Long-term memory for AI conversations — production-ready in minutes.
          </p>
        </section>

        {/* On this page */}
        <nav id="on-this-page" className="mb-10 p-4 rounded-lg border border-border bg-card">
          <h2 className="text-sm font-semibold text-foreground mb-3">On this page</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li><a href="#overview" className="hover:text-foreground transition-colors">Overview</a></li>
            <li><a href="#quick-start" className="hover:text-foreground transition-colors">Quick Start</a></li>
            <li><a href="#setup" className="hover:text-foreground transition-colors">Setup</a></li>
            <li><a href="#core-operations" className="hover:text-foreground transition-colors">Core Operations</a></li>
            <li><a href="#memory-types" className="hover:text-foreground transition-colors">Memory Types</a></li>
            <li><a href="#reference" className="hover:text-foreground transition-colors">Reference</a></li>
          </ul>
        </nav>

        {/* Overview */}
        <section id="overview" className="space-y-6 mb-12 scroll-mt-8">
          <h2 className="text-2xl font-semibold text-foreground">Overview</h2>
          <div className="space-y-4 text-foreground">
            <h3 className="text-lg font-medium text-foreground">Why it matters</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Personalized replies:</strong> Semantic facts and episodic bubbles reduce repeat questions and keep context across chats.</li>
              <li><strong className="text-foreground">Dual memory:</strong> Stable semantic facts and time-bound episodic bubbles with automatic connections.</li>
              <li><strong className="text-foreground">Ready to ship:</strong> SQLite by default, optional PostgreSQL; works with OpenAI or OpenRouter.</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/30 font-medium text-foreground">
                  <th className="px-4 py-2 border-b border-border text-left">Feature</th>
                  <th className="px-4 py-2 border-b border-border text-left">Why it helps</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground text-sm">
                <tr><td className="px-4 py-2 border-b border-border">Fast setup</td><td className="px-4 py-2 border-b border-border">Add a few lines and you’re production-ready — no vector DB or LLM wiring required.</td></tr>
                <tr><td className="px-4 py-2 border-b border-border">FAISS-backed search</td><td className="px-4 py-2 border-b border-border">O(log n) vector search instead of O(n) scans over memories.</td></tr>
                <tr><td className="px-4 py-2 border-b border-border">Smart deduplication</td><td className="px-4 py-2 border-b border-border">ADD/UPDATE/REPLACE/NOOP for semantic facts — duplicates and contradictions handled automatically.</td></tr>
                <tr><td className="px-4 py-2 border-b border-border">Bubble–fact linking</td><td className="px-4 py-2 border-b border-border">New episodic bubbles auto-link to related semantic memories.</td></tr>
                <tr><td className="px-4 py-2 border-b border-border">Multi-provider</td><td className="px-4 py-2 border-b border-border">Same Memory API whether you use OpenAI or OpenRouter (Claude, etc.).</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Start */}
        <section id="quick-start" className="space-y-6 mb-12 scroll-mt-8">
          <h2 className="text-2xl font-semibold text-foreground">Quick Start</h2>
          <p className="text-muted-foreground">
            Install the package, then configure, create tables once at startup, and use one session per request.
          </p>
          <div className="rounded-lg border border-border bg-muted/50 p-4 font-mono text-sm text-foreground overflow-x-auto">
            <pre>pip install contextmemory</pre>
          </div>
          <div className="rounded-lg border border-border bg-muted/50 p-4 font-mono text-sm text-foreground overflow-x-auto">
            <pre>{`from contextmemory import configure, create_table, Memory, SessionLocal

configure(openai_api_key="your-api-key")  # or set OPENAI_API_KEY
create_table()

db = SessionLocal()
memory = Memory(db)

messages = [
    {"role": "user", "content": "Hi, I'm Samiksha and I love Python programming"},
    {"role": "assistant", "content": "Nice to meet you! Python is great."},
]
result = memory.add(messages=messages, conversation_id=1)
# result: {"semantic": ["User is named Samiksha", "User loves Python"], "bubbles": []}

results = memory.search(
    query="What programming language does the user like?",
    conversation_id=1,
    limit=5,
)
# results["results"] includes scored memories (type "semantic" or "bubble")`}</pre>
          </div>
        </section>

        {/* Setup */}
        <section id="setup" className="space-y-6 mb-12 scroll-mt-8">
          <h2 className="text-2xl font-semibold text-foreground">Setup</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Configure</strong> — call <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-sm">configure(...)</code> before any other ops, or set <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-sm">OPENAI_API_KEY</code>, <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-sm">OPENROUTER_API_KEY</code>, <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-sm">DATABASE_URL</code> in the environment.</li>
            <li><strong className="text-foreground">Database</strong> — SQLite at <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-sm">~/.contextmemory/memory.db</code> by default; pass <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-sm">database_url</code> for PostgreSQL.</li>
            <li><strong className="text-foreground">Tables</strong> — call <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-sm">create_table()</code> once at app startup; it’s idempotent.</li>
            <li><strong className="text-foreground">Sessions</strong> — use <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-sm">SessionLocal()</code> per request and close when done.</li>
          </ul>
          <div className="rounded-lg border border-border bg-muted/50 p-4 font-mono text-sm text-foreground overflow-x-auto">
            <pre>{`from contextmemory import configure, SessionLocal, Memory

configure(
    openai_api_key="your-key",
    database_url="postgresql://...",  # optional
)
db = SessionLocal()
memory = Memory(db)`}</pre>
          </div>
        </section>

        {/* Core Operations */}
        <section id="core-operations" className="space-y-8 mb-12 scroll-mt-8">
          <h2 className="text-2xl font-semibold text-foreground">Core Operations</h2>

          <div className="p-5 rounded-lg border border-border bg-card">
            <h3 className="text-lg font-medium text-foreground mb-2">Add</h3>
            <p className="text-muted-foreground text-sm mb-2">Ingest the latest user–assistant turn, extract semantic facts and episodic bubbles, then store and link bubbles to existing memories.</p>
            <p className="font-mono text-sm text-amber-600 dark:text-amber-400 mb-2">memory.add(messages: List[dict], conversation_id: int) → dict</p>
            <p className="text-muted-foreground text-sm">Returns <code className="rounded bg-muted/50 px-1 font-mono">{"{\"semantic\": [...], \"bubbles\": [...]}"}</code>.</p>
          </div>

          <div className="p-5 rounded-lg border border-border bg-card">
            <h3 className="text-lg font-medium text-foreground mb-2">Search</h3>
            <p className="text-muted-foreground text-sm mb-2">Retrieve memories relevant to a query for a given conversation, with scores and optional connected bubbles.</p>
            <p className="font-mono text-sm text-amber-600 dark:text-amber-400 mb-2">memory.search(query, conversation_id, limit=10, include_connections=True) → dict</p>
            <p className="text-muted-foreground text-sm">Returns <code className="rounded bg-muted/50 px-1 font-mono">{"{\"query\", \"total\", \"results\": [...]}"}</code>.</p>
          </div>

          <div className="p-5 rounded-lg border border-border bg-card">
            <h3 className="text-lg font-medium text-foreground mb-2">Update</h3>
            <p className="text-muted-foreground text-sm mb-2">Change the text of an existing memory and refresh its embedding and vector index entry.</p>
            <p className="font-mono text-sm text-amber-600 dark:text-amber-400">memory.update(memory_id: int, text: str) → Memory</p>
          </div>

          <div className="p-5 rounded-lg border border-border bg-card">
            <h3 className="text-lg font-medium text-foreground mb-2">Delete</h3>
            <p className="text-muted-foreground text-sm mb-2">Soft-delete a memory: remove from search and vector index; row is marked inactive.</p>
            <p className="font-mono text-sm text-amber-600 dark:text-amber-400 mb-2">memory.delete(memory_id: int) → dict</p>
            <p className="text-muted-foreground text-sm">Returns <code className="rounded bg-muted/50 px-1 font-mono">{"{\"deleted_memory_id\": int}"}</code>.</p>
          </div>
        </section>

        {/* Memory Types */}
        <section id="memory-types" className="space-y-6 mb-12 scroll-mt-8">
          <h2 className="text-2xl font-semibold text-foreground">Memory Types</h2>
          <p className="text-muted-foreground">
            Context Memory keeps <strong className="text-foreground">semantic facts</strong> (stable truths: name, preferences, role) and <strong className="text-foreground">episodic bubbles</strong> (time-bound moments: current task, “debugging X”). Bubbles can link to related facts; search can return “connected” results.
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/30 font-medium text-foreground">
                  <th className="px-4 py-2 border-b border-border text-left">Aspect</th>
                  <th className="px-4 py-2 border-b border-border text-left">Semantic</th>
                  <th className="px-4 py-2 border-b border-border text-left">Episodic (bubbles)</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground text-sm">
                <tr><td className="px-4 py-2 border-b border-border">Stability</td><td className="px-4 py-2 border-b border-border">Stable over time</td><td className="px-4 py-2 border-b border-border">Time-bound</td></tr>
                <tr><td className="px-4 py-2 border-b border-border">Decay in search</td><td className="px-4 py-2 border-b border-border">None</td><td className="px-4 py-2 border-b border-border">Recency-based decay</td></tr>
                <tr><td className="px-4 py-2 border-b border-border">Linking</td><td className="px-4 py-2 border-b border-border">Can be referenced by bubbles</td><td className="px-4 py-2 border-b border-border">Auto-linked to related memories</td></tr>
                <tr><td className="px-4 py-2 border-b border-border">Typical count</td><td className="px-4 py-2 border-b border-border">Dozens per user</td><td className="px-4 py-2 border-b border-border">Grows with conversations</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Reference */}
        <section id="reference" className="space-y-6 mb-12 scroll-mt-8">
          <h2 className="text-2xl font-semibold text-foreground">Reference</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/30 font-medium text-foreground">
                  <th className="px-4 py-2 border-b border-border text-left">API</th>
                  <th className="px-4 py-2 border-b border-border text-left">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground text-sm">
                <tr><td className="px-4 py-2 border-b border-border font-mono">configure(**kwargs)</td><td className="px-4 py-2 border-b border-border">Set global config. Call before other ops.</td></tr>
                <tr><td className="px-4 py-2 border-b border-border font-mono">create_table()</td><td className="px-4 py-2 border-b border-border">Create DB tables. Idempotent.</td></tr>
                <tr><td className="px-4 py-2 border-b border-border font-mono">SessionLocal()</td><td className="px-4 py-2 border-b border-border">Return a new DB session.</td></tr>
                <tr><td className="px-4 py-2 border-b border-border font-mono">Memory(db)</td><td className="px-4 py-2 border-b border-border">Main memory interface; accepts a session.</td></tr>
                <tr><td className="px-4 py-2 border-b border-border font-mono">memory.add(messages, conversation_id)</td><td className="px-4 py-2 border-b border-border">Extract and store memories from the latest turn.</td></tr>
                <tr><td className="px-4 py-2 border-b border-border font-mono">memory.search(query, conversation_id, …)</td><td className="px-4 py-2 border-b border-border">Search by semantic similarity and optional connections.</td></tr>
                <tr><td className="px-4 py-2 border-b border-border font-mono">memory.update(memory_id, text)</td><td className="px-4 py-2 border-b border-border">Update a memory’s text and embedding.</td></tr>
                <tr><td className="px-4 py-2 border-b border-border font-mono">memory.delete(memory_id)</td><td className="px-4 py-2 border-b border-border">Soft-delete and remove from vector index.</td></tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="https://pypi.org/project/contextmemory/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 underline transition-colors">PyPI — contextmemory</a>
            <a href="https://github.com/samiksha0shukla/context-memory" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 underline transition-colors">GitHub — context-memory</a>
          </div>
        </section>
      </main>

      {/* Footer - same as landing */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Built with ContextMemory - AI Memory Made Visual</p>
            <div className="flex items-center gap-6">
              <a href="https://x.com/contextmemory" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="X (Twitter)">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="https://linkedin.com/company/contextmemory" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
              <a href="mailto:hello@contextmemory.ai" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Email"><Mail className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
