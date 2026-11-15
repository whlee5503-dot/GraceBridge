// src/lib/crisisLines.ts
// Country-keyed crisis / emergency numbers shown when PHQ-9 item 9 is positive.
// Add a new country by adding a key; keep numbers verified against official sources.
//
// KR verified 2026-11-15:
//  - 109: Suicide prevention counseling line (MOHW), 24h, unified Jan 2024 (replaced 1393)
//  - 1577-0199: Mental health crisis counseling line, 24h
//  - 119: Emergency / ambulance

export interface CrisisLine {
    number: string
    labelKey: string
    defaultLabel: string
}

export const CRISIS_LINES: Record<string, CrisisLine[]> = {
    KR: [
        {
            number: '109',
            labelKey: 'screening.result.safety.line109',
            defaultLabel: 'Suicide prevention hotline (24h)',
        },
        {
            number: '1577-0199',
            labelKey: 'screening.result.safety.line15770199',
            defaultLabel: 'Mental health crisis line (24h)',
        },
        {
            number: '119',
            labelKey: 'screening.result.safety.line119',
            defaultLabel: 'Emergency / ambulance',
        },
    ],
}

export function getCrisisLines(countryCode: string): CrisisLine[] | null {
    return CRISIS_LINES[countryCode] ?? null
}