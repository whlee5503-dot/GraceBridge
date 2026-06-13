// src/hooks/useGeoLocation.ts
// Phase 3 — GPS 좌표 훅 (권한 거부 시 서울 시청 기본값 fallback)

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

// 서울 시청 기본값 (GPS 권한 거부 시 fallback)
const FALLBACK_LOCATION: GeoLocation = {
  lat: 37.5665,
  lng: 126.9780,
  accuracy: null,
}

export function useGeoLocation(): UseGeoLocationResult {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [trigger, setTrigger]   = useState(0)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('geolocation_not_supported')
      setLocation(FALLBACK_LOCATION)
      return
    }

    setLoading(true)
    setError(null)

    const timeoutId = setTimeout(() => {
      setError('geolocation_timeout')
      setLocation(FALLBACK_LOCATION)
      setLoading(false)
    }, 10000)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId)
        setLocation({
          lat:      pos.coords.latitude,
          lng:      pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setLoading(false)
      },
      (err) => {
        clearTimeout(timeoutId)
        // 권한 거부 등 에러 시 서울 시청 fallback
        setError(err.code === 1 ? 'geolocation_denied' : 'geolocation_error')
        setLocation(FALLBACK_LOCATION)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    )

    return () => clearTimeout(timeoutId)
  }, [trigger])

  const retry = () => setTrigger(t => t + 1)

  return { location, loading, error, retry }
}
