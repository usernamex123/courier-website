import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names and tailwind classes cleanly, 
 * resolving any style conflicts.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}