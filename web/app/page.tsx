"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, Sparkles, Shield, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size={32} />
          <div className="flex items-center gap-4">
            {isLoading ? null : isAuthenticated ? (
              <Link href="/dashboard">
                <Button>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <h1 className="text-5xl font-bold tracking-tight">
            AI Conversations with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Perfect Memory
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            ContextMemory remembers everything from your conversations. Watch your
            memories grow as beautiful, interconnected bubbles in a living knowledge graph.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {isLoading ? null : isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg">
                  Open Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg">
                    Start Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/signin">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
            {/* Try Demo button - always visible */}
            <Link href="/demo">
              <Button size="lg" variant="secondary" className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30">
                <Sparkles className="w-4 h-4 mr-2" />
                Try Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Semantic Memory</h3>
            <p className="text-muted-foreground">
              Automatically extracts and stores facts, preferences, and knowledge from your
              conversations.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Visual Memory Graph</h3>
            <p className="text-muted-foreground">
              See your memories as beautiful, interactive bubbles. Explore connections and
              relationships between ideas.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your Data, Your Key</h3>
            <p className="text-muted-foreground">
              Use your own OpenRouter API key. Your data stays private and secure, under
              your control.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>Built with ContextMemory - AI Memory Made Visual</p>
        </div>
      </footer>
    </div>
  );
}
