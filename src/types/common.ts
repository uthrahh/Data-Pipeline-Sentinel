/**
 * Shared primitive types used across the domain model.
 */

export type Region = "NAC" | "EU" | "ANZ" | "AME" | "APAC" | "GLOBAL";

export type Environment = "PROD" | "UAT" | "DEV";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type CheckStatus = "PASS" | "WARNING" | "FAIL" | "NOT_AVAILABLE" | "PENDING";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}
