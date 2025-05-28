import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreColor(score: string): string {
  switch (score) {
    case "A":
      return "bg-green-500"
    case "B":
      return "bg-emerald-400"
    case "C":
      return "bg-yellow-500"
    case "D":
      return "bg-orange-500"
    case "F":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}
