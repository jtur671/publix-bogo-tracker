import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compute days remaining from a date string, always fresh at render time. */
export function daysLeft(validTo: string): number {
  // Extract just the date portion (YYYY-MM-DD) regardless of input format
  const dateOnly = validTo.slice(0, 10);
  const end = new Date(dateOnly + "T23:59:59");
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
