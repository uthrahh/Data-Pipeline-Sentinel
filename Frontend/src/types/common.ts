/**
 * Shared primitive types used across the domain model.
 */

/**
 * The ten countries this SAP pipeline environment runs in — each with 3
 * pipelines (Material Master, Procurement, Sales & Manufacturing), for 30
 * pipelines total. Fixed by product scope — see config/sapPipelineConfig.ts
 * for display labels.
 */
export type CountryCode = "US" | "CA" | "MX" | "GB" | "DE" | "FR" | "SG" | "IN" | "AU" | "JP";

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
