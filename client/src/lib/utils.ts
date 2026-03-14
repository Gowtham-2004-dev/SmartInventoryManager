import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numValue);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(dateObj);
}

export function formatShortDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getStockStatus(quantity: number, minStock: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  const ratio = quantity / minStock;
  
  if (ratio < 0.5) {
    return { 
      label: 'Critical', 
      color: 'text-red-800', 
      bgColor: 'bg-red-100' 
    };
  } else if (ratio < 1) {
    return { 
      label: 'Low', 
      color: 'text-yellow-800', 
      bgColor: 'bg-yellow-100' 
    };
  } else if (ratio > 2) {
    return { 
      label: 'Overstock', 
      color: 'text-blue-800', 
      bgColor: 'bg-blue-100' 
    };
  } else {
    return { 
      label: 'Healthy', 
      color: 'text-green-800', 
      bgColor: 'bg-green-100' 
    };
  }
}

export function calculateDaysUntilReorder(quantity: number, minStock: number, avgDailySales: number): number {
  if (avgDailySales <= 0) return 30; // If no sales data, default to 30 days
  const excessStock = Math.max(0, quantity - minStock);
  return Math.round(excessStock / avgDailySales);
}
