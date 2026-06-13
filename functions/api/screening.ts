// functions/api/screening.ts
// Cloudflare Pages Function — 스크리닝 결과 Supabase 저장

import type { EventContext } from '@cloudflare/workers-types'

interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

interface ScreeningPayload {
  session_id:    string
  church_code:   string
  region_code:   string
  phq9_score:    number
  mnasf_score:   number
  chronic_count: number
  risk_level:    string
}

export async function onRequestPost(
  context: EventContext<Env, string, Record<string, unknown>>
) {
  const { env, request } = context

  // CORS 헤더
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }

  try {
    const payload: ScreeningPayload = await request.json()

    // PII 차단 — session_id가 UUID 형식인지 확인
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(payload.session_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid session_id format' }),
        { status: 400, headers }
      )
    }

    // Supabase insert
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/screenings`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        session_id:    payload.session_id,
        church_code:   payload.church_code,
        region_code:   payload.region_code,
        phq9_score:    payload.phq9_score,
        mnasf_score:   payload.mnasf_score,
        chronic_count: payload.chronic_count,
        risk_level:    payload.risk_level,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(
        JSON.stringify({ error: 'Supabase error', detail: err }),
        { status: 502, headers }
      )
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 201, headers }
    )

  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers }
    )
  }
}

// CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
