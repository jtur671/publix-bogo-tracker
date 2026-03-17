import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compute days remaining from a date string, always fresh at render time.
 *  Returns negative values for expired deals (e.g. -1 = expired yesterday). */
export function daysLeft(validTo: string): number {
  const end = new Date(validTo);
  const now = new Date();
  // Compare local calendar dates (matches how dates display via toLocaleDateString)
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((endDay.getTime() - nowDay.getTime()) / 86400000);
}
