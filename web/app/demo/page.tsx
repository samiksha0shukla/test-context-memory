"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { DEMO_DATA } from "@/lib/demo-data";
import { useAuth } from "@/contexts/AuthContext";

// Dynamic import for the demo-specific graph component
const DemoGraph = dynamic(
  () => import("@/components/visualization/DemoGraph").then((mod) => mod.DemoGraph),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full">
    <div className="text-muted-foreground">Loading visualization...</div>
  </div> }
);

export default function DemoPage() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Simplified Demo Navbar */}
      <nav className="flex items-center justify-between h-14 px-6 border-b border-border/50 bg-card/50 backdrop-blur-sm flex-shrink-0">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-4">
          <Logo size={28} showText={false} />
          <div className="h-5 w-px bg-border/60" />
          <h1 className="text-sm font-semibold text-foreground">Demo Mode</h1>
        </div>

        {/* Right: Create Your Own / Dashboard Button */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden md:block">
            Explore the memory visualization
          </span>
          <AuthActionButton />
        </div>
      </nav>

      {/* Full-width Memory Graph with Static Data */}
      <div className="flex-1 overflow-hidden w-full h-full">
        <DemoGraph data={DEMO_DATA} />
      </div>
    </div>
  );
}

function AuthActionButton() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;

  if (isAuthenticated) {
    return (
      <Link href="/dashboard">
        <Button size="sm">
          Create Your Own
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    );
  }

  return (
    <Link href="/signup">
      <Button size="sm">
        Create Your Own
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </Link>
  );
}
