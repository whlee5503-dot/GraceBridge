// src/hooks/useGeoLocation.ts
// Phase 3 — GPS 좌표 훅
// 위치를 얻지 못하면 location=null 과 error 코드를 돌려준다.
// (이전 버전의 "서울 시청 기본값 fallback"은 다른 지역 사용자에게 잘못된 기관을
//  안내할 수 있어 제거했다.)

import { useState, useEffect } from 'react'

export interface GeoLocation {
  lat: number
  lng: number
  accuracy: number | null
}

interface UseGeoLocationResult {
  location: GeoLocation | null
  loading: boolean
  error: string | null
  retry: () => void
}

export function useGeoLocation(): UseGeoLocationResult {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('geolocation_not_supported')
      setLocation(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const timeoutId = setTimeout(() => {
      setError('geolocation_timeout')
      setLocation(null)
      setLoading(false)
    }, 10000)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId)
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setLoading(false)
      },
      (err) => {
        clearTimeout(timeoutId)
        setError(err.code === 1 ? 'geolocation_denied' : 'geolocation_error')
        setLocation(null)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    )

    return () => clearTimeout(timeoutId)
  }, [trigger])

  const retry = () => setTrigger(t => t + 1)

  return { location, loading, error, retry }
}