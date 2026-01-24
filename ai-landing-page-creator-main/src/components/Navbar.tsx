import { Button } from "@/components/ui/button";

const Navbar = () => {
  const navLinks = ["Home", "Products", "Docs"];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="font-display text-xl font-semibold text-foreground tracking-tight">
          ContextMemory
        </a>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Sign in
          </Button>
          <Button variant="outline" size="sm" className="text-sm font-medium rounded-full px-4 border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-200">
            Sign up
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
