// functions/api/referral-db.ts
// Cloudflare Pages Function — 국가별 Referral DB 조회 (KV 캐시)

import type { EventContext } from '@cloudflare/workers-types'

interface Env {
  REFERRAL_DB?: KVNamespace
}

export async function onRequestGet(
  context: EventContext<Env, string, Record<string, unknown>>
) {
  const { env, request } = context

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=86400',
  }

  try {
    const url         = new URL(request.url)
    const countryCode = url.searchParams.get('country')?.toUpperCase()

    if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid country code' }),
        { status: 400, headers }
      )
    }

    // ── KV 캐시 확인 ───────────────────────────────────────────
    if (env.REFERRAL_DB) {
      const cached = await env.REFERRAL_DB.get(countryCode)
      if (cached) {
        return new Response(cached, { status: 200, headers })
      }
    }

    // ── KV 없으면 public 파일에서 직접 서빙 ───────────────────
    // Cloudflare Pages는 /public 파일을 정적으로 서빙하므로
    // 클라이언트가 /referral-data/{code}.json 직접 호출 가능
    return new Response(
      JSON.stringify({ error: 'Not found', country: countryCode }),
      { status: 404, headers }
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
