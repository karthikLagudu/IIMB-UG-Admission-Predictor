import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(value: number | null | undefined, digits = 6): string {
  return value == null ? "—" : value.toFixed(digits);
}

export function normalizeScoreOutOf100(value: number | null | undefined, maxScore: number | null | undefined): number | null {
  if (value == null || maxScore == null || !Number.isFinite(value) || !Number.isFinite(maxScore) || maxScore <= 0) return null;
  return (value / maxScore) * 100;
}

export function formatScoreOutOf100(value: number | null | undefined, maxScore: number | null | undefined, digits = 2): string {
  const normalizedScore = normalizeScoreOutOf100(value, maxScore);
  return normalizedScore == null ? "—" : `${formatScore(normalizedScore, digits)} / 100`;
}

export function formatProbability(value: number | null | undefined): string {
  return value == null ? "—" : `${(value * 100).toFixed(1)}%`;
}

export function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
