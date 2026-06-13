// functions/api/sync.ts
// Cloudflare Pages Function — 오프라인 큐 일괄 sync

import type { EventContext } from '@cloudflare/workers-types'

interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

interface ScreeningRecord {
  session_id:    string
  church_code:   string
  region_code:   string
  phq9_score:    number
  mnasf_score:   number
  chronic_count: number
  risk_level:    string
}

interface SyncPayload {
  records: ScreeningRecord[]
}

export async function onRequestPost(
  context: EventContext<Env, string, Record<string, unknown>>
) {
  const { env, request } = context

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }

  try {
    const { records }: SyncPayload = await request.json()

    if (!Array.isArray(records) || records.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No records provided' }),
        { status: 400, headers }
      )
    }

    // 최대 100건 제한 (abuse 방지)
    if (records.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Too many records (max 100)' }),
        { status: 400, headers }
      )
    }

    // PII 차단 — session_id UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const clean = records.filter(r => uuidRegex.test(r.session_id))

    if (clean.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid records after validation' }),
        { status: 400, headers }
      )
    }

    // Supabase bulk insert
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/screenings`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify(clean.map(r => ({
        session_id:    r.session_id,
        church_code:   r.church_code,
        region_code:   r.region_code,
        phq9_score:    r.phq9_score,
        mnasf_score:   r.mnasf_score,
        chronic_count: r.chronic_count,
        risk_level:    r.risk_level,
      }))),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(
        JSON.stringify({ error: 'Supabase error', detail: err }),
        { status: 502, headers }
      )
    }

    return new Response(
      JSON.stringify({ ok: true, synced: clean.length }),
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
