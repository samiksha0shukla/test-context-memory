"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, User, Mail, X, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// UserProfile Component - Sage Green Theme
function UserProfile() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  if (!user) return null;

  // Get initials from user name
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push("/");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-[hsl(150,30%,25%)] hover:bg-[hsl(150,30%,30%)] transition-colors"
      >
        {/* Avatar with initials */}
        <div className="w-8 h-8 rounded-full bg-[hsl(150,40%,40%)] flex items-center justify-center text-white text-sm font-medium">
          {initials}
        </div>
        <span className="text-white text-sm font-medium hidden md:block max-w-[120px] truncate">
          {user.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[hsl(150,25%,20%)] border border-[hsl(150,20%,30%)] shadow-xl z-50 overflow-hidden">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-[hsl(150,20%,30%)]">
              <p className="text-white font-medium truncate">{user.name}</p>
              <p className="text-[hsl(150,20%,60%)] text-sm truncate">{user.email}</p>
            </div>
            
            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-[hsl(150,15%,80%)] hover:bg-[hsl(150,25%,25%)] hover:text-white transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[hsl(150,15%,80%)] hover:bg-[hsl(150,25%,25%)] hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Navbar Component
function Navbar({ onAuthClick }: { onAuthClick: (isLogin: boolean) => void }) {
  const navLinks = ["Home", "Products", "Docs", "Demo"];
  const { isAuthenticated } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-display text-xl font-semibold text-foreground tracking-tight">
          ContextMemory
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link}
              href={link === "Demo" ? "/demo" : `#${link.toLowerCase()}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <UserProfile />
          ) : (
            <>
              <button 
                onClick={() => onAuthClick(true)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </button>
              <button 
                onClick={() => onAuthClick(false)}
                className="text-sm font-medium rounded-full px-4 py-2 border border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-200"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// Hero Component
function Hero({ onGetStarted, isAuthenticated }: { onGetStarted: () => void; isAuthenticated: boolean }) {
  const router = useRouter();
  
  const handleClick = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      onGetStarted();
    }
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/hero-mountains.jpeg"
          alt="Mountain landscape"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Gradient Overlay - Creates the fade effect from top */}
      <div className="absolute inset-0 hero-gradient-overlay" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 -mt-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-foreground animate-fade-in-up leading-tight">
            Give Your AI Agents
            <br />
            <span className="text-gradient">Context + Memory</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-lg md:text-xl text-muted-foreground font-medium animate-fade-in-up-delay">
            Not just storage, but understanding.
          </p>

          {/* CTA Button */}
          <div className="mt-10 animate-fade-in-up-delay-2">
            <button 
              onClick={handleClick}
              className="glass-button group inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-medium text-foreground"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Auth Modal Component
function AuthModal({ 
  isOpen, 
  onClose, 
  initialMode 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  initialMode: boolean;
}) {
  const [isLogin, setIsLogin] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  // Sync isLogin with initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode);
      setError("");
      setName("");
      setEmail("");
      setPassword("");
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signIn({ email, password });
        onClose();
        router.push("/dashboard");
      } else {
        if (!name.trim()) {
          setError("Name is required");
          setLoading(false);
          return;
        }
        await signUp({ name, email, password });
        onClose();
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="glass-card w-full max-w-md rounded-3xl p-8 relative z-10 mx-4">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-foreground/10 transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-foreground mb-2">
            {isLogin ? "Login" : "Sign Up"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin 
              ? "Welcome back, please login to your account" 
              : "Create your account to get started"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field (Sign Up only) */}
          {!isLogin && (
            <div className="relative">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full px-4 py-3.5 pr-12 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
          )}

          {/* Email Field */}
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input w-full px-4 py-3.5 pr-12 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>

          {/* Password Field */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="glass-input w-full px-4 py-3.5 pr-12 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[hsl(150,35%,18%)] to-[hsl(150,30%,28%)] text-white font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        {/* Toggle Form */}
        <p className="text-center mt-6 text-muted-foreground">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="font-semibold text-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

// Main Landing Page
export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalLogin, setAuthModalLogin] = useState(true);
  const { isAuthenticated } = useAuth();

  const handleAuthClick = (isLogin: boolean) => {
    setAuthModalLogin(isLogin);
    setAuthModalOpen(true);
  };

  const handleGetStarted = () => {
    setAuthModalLogin(false); // Open signup form
    setAuthModalOpen(true);
  };

  return (
    <div className="relative">
      <Navbar onAuthClick={handleAuthClick} />
      <Hero onGetStarted={handleGetStarted} isAuthenticated={isAuthenticated} />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalLogin}
      />
    </div>
  );
}
