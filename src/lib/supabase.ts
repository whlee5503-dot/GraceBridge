// src/lib/supabase.ts
// DPGA Privacy-by-Design: 익명 데이터만 저장
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── 익명 스크리닝 결과 저장 ───────────────────────────────────────
export interface ScreeningPayload {
  session_id:    string
  church_code:   string
  region_code:   string
  phq9_score:    number
  mnasf_score:   number
  chronic_count: number
  has_high_risk: boolean
  risk_level:    'green' | 'yellow' | 'orange' | 'red'
}

export async function saveScreeningResult(payload: ScreeningPayload): Promise<{
  success: boolean
  error?: string
}> {
  const { error } = await supabase
    .from('screening_results')
    .insert(payload)

  if (error) {
    console.error('Supabase insert error:', error.message)
    return { success: false, error: error.message }
  }
  return { success: true }
}
