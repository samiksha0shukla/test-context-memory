import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate bubble radius based on importance score
 * Range: 24px (low importance) to 56px (high importance)
 */
export function getBubbleRadius(importance: number): number {
  const minRadius = 24;
  const maxRadius = 56;
  const clampedImportance = Math.max(0, Math.min(1, importance));
  return minRadius + clampedImportance * (maxRadius - minRadius);
}

/**
 * Get bubble color based on type and age
 */
export function getBubbleColor(
  type: "semantic" | "bubble",
  createdAt?: string
): string {
  if (type === "semantic") {
    return "hsl(36, 100%, 70%)"; // Amber
  }

  // For episodic bubbles, calculate age-based color
  if (createdAt) {
    const daysAgo = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysAgo <= 7) {
      return "hsl(142, 76%, 36%)"; // Active green
    } else if (daysAgo <= 30) {
      return "hsl(45, 93%, 47%)"; // Warm yellow
    } else {
      return "hsl(217, 91%, 60%)"; // Cold blue
    }
  }

  return "hsl(214, 100%, 70%)"; // Default blue
}

/**
 * Calculate connection opacity based on strength
 */
export function getConnectionOpacity(strength: number): number {
  const minOpacity = 0.05;
  const maxOpacity = 0.35;
  const clampedStrength = Math.max(0, Math.min(1, strength));
  return minOpacity + clampedStrength * (maxOpacity - minOpacity);
}

/**
 * Calculate connection line thickness based on strength
 */
export function getConnectionThickness(strength: number): number {
  const minThickness = 1;
  const maxThickness = 4;
  const clampedStrength = Math.max(0, Math.min(1, strength));
  return minThickness + clampedStrength * (maxThickness - minThickness);
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const date = new Date(timestamp).getTime();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
