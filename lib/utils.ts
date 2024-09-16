import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export const formatCreationTime = (timestamp: string) => {
  return format(new Date(timestamp), 'PPpp'); // Example format: Jan 1, 2023, 12:00 PM
};