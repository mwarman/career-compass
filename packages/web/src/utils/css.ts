import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for constructing className strings conditionally.
 * It combines the functionality of `clsx` for conditional class names and `twMerge` for merging Tailwind CSS classes.
 * @param inputs - An array of class values to be combined.
 * @returns A string of merged class names.
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};
