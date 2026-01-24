import Image from "next/image";
import Link from "next/link";

export function Logo({ size = 32, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
      {/* CM Brain Logo Image */}
      <div className="relative" style={{ width: size, height: size }}>
        <Image
          src="/contextmemorylogo.png"
          alt="ContextMemory Logo"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>

      {showText && (
        <span className="text-xl font-semibold text-foreground">
          ContextMemory
        </span>
      )}
    </Link>
  );
}
