// src/lib/appConfig.ts
// Deployment-level configuration.
//
// COUNTRY_CODE: ISO 3166-1 alpha-2 code of the country this deployment is configured for
// (e.g. "KR"). Set it with the VITE_COUNTRY_CODE environment variable.
// If it is not set, the app shows NO country-specific emergency numbers or facilities,
// so that people are never given another country's contacts by mistake.

export const COUNTRY_CODE: string =
    ((import.meta.env.VITE_COUNTRY_CODE as string | undefined) ?? '').trim().toUpperCase()

// Referral map distance rules (km to the nearest registered facility).
// Above WARN_KM the user is warned; above OUT_OF_COVERAGE_KM no facilities are shown.
// Adjust per deployment context (rural areas may need larger values).
export const WARN_KM = 30
export const OUT_OF_COVERAGE_KM = 100