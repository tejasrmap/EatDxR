import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseFirebaseDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? new Date() : timestamp;
  }
  if (typeof timestamp?.toDate === "function") {
    try {
      const d = timestamp.toDate();
      return isNaN(d.getTime()) ? new Date() : d;
    } catch {
      return new Date();
    }
  }
  if (timestamp?.seconds !== undefined) {
    const d = new Date(timestamp.seconds * 1000);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  try {
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch {
    return new Date();
  }
}

export function safeFormatDate(date: any, formatStr: string = "MMM dd, yyyy"): string {
  try {
    const d = parseFirebaseDate(date);
    return format(d, formatStr);
  } catch {
    return "Recent";
  }
}
