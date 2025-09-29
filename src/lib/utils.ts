import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const inputDate = new Date(date);
  
  // Reset time to start of day for accurate comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const compareDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
  
  const diffTime = today.getTime() - compareDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays === -1) {
    return "Tomorrow";
  } else if (diffDays > 1 && diffDays <= 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < -1 && diffDays >= -7) {
    return `In ${Math.abs(diffDays)} days`;
  } else {
    // For dates more than a week away, show the actual date
    return inputDate.toLocaleDateString();
  }
}

export function formatDateWithTime(date: Date | string): string {
  const inputDate = new Date(date);
  const relativeDate = formatRelativeDate(date);
  
  if (relativeDate === "Today" || relativeDate === "Yesterday") {
    return `${relativeDate} at ${inputDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  return `${relativeDate}`;
}