/**
 * Single source of truth for whether the app is pulling from the live
 * Databricks-backed API or the built-in mock fixtures. Hardcoded false on
 * this branch by design: this is a static site with no backend connection
 * at all (see the 30-pipeline / sap_demo-grounded fixtures under
 * data/mock/) — no env var can accidentally point it at a live backend.
 * The live, Databricks-backed version of this app lives on other branches
 * (`initial`), which keep the env-var-driven version of this file.
 */
export const USE_LIVE_API = false;
