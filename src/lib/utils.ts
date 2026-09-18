import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export const INDUSTRIES = [
  "Fitness",
  "Ecommerce",
  "Real Estate",
  "Beauty",
  "Healthcare",
  "Education",
  "Local Services",
  "Restaurant",
  "Coaching",
] as const;

export const BRAND_TONES = [
  { value: "professional", label: "Professional" },
  { value: "energetic", label: "Energetic" },
  { value: "friendly", label: "Friendly" },
  { value: "luxury", label: "Luxury" },
  { value: "bold", label: "Bold" },
] as const;

export const COMMUNICATION_STYLES = [
  { value: "friendly", label: "Friendly & approachable" },
  { value: "expert", label: "Expert & authoritative" },
  { value: "casual", label: "Casual & conversational" },
  { value: "inspirational", label: "Inspirational" },
] as const;

export const PLANS = [
  {
    id: "TRIAL",
    name: "Free Trial",
    price: 0,
    period: "14 days",
    features: [
      "3 AI ad generations",
      "1 active campaign",
      "Basic lead inbox",
      "WhatsApp AI (limited)",
    ],
  },
  {
    id: "STARTER",
    name: "Starter",
    price: 49,
    period: "month",
    features: [
      "20 AI ad generations / mo",
      "5 active campaigns",
      "Lead management",
      "WhatsApp nurturing",
      "Performance sync",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: 129,
    period: "month",
    popular: true,
    features: [
      "Unlimited AI ad generations",
      "Unlimited campaigns",
      "Advanced lead scoring",
      "Priority WhatsApp agent",
      "Media editing tools",
      "RAG-enhanced creatives",
    ],
  },
  {
    id: "AGENCY",
    name: "Agency",
    price: 299,
    period: "month",
    features: [
      "Everything in Pro",
      "Multi-brand workspaces",
      "Admin analytics",
      "Priority support",
      "Custom brand templates",
    ],
  },
] as const;
