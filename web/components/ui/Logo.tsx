import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export function Logo({ size = 48, showText = true }: LogoProps) {
  return (
    <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity group">
      {/* Logo Container - using mix-blend-mode to remove the light background */}
      <div 
        className="relative flex items-center justify-center"
        style={{ 
          width: size, 
          height: size,
        }}
      >
        {/* The logo with blend mode to remove background */}
        <Image
          src="/contextmemorylogo.png"
          alt="ContextMemory Logo"
          width={size}
          height={size}
          className="object-contain mix-blend-multiply dark:mix-blend-screen dark:invert"
          style={{
            filter: "contrast(1.1)",
          }}
          priority
        />
      </div>

      {showText && (
        <span className="text-xl font-semibold text-foreground tracking-tight group-hover:text-foreground/90 transition-colors">
          ContextMemory
        </span>
      )}
    </Link>
  );
}
