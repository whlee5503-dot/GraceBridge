import { useState, useEffect } from 'react'
import { getAll } from '../lib/offlineQueue'
import type { PendingScreening } from '../lib/offlineQueue'

export function useScreenings() {
  const [screenings, setScreenings] = useState<PendingScreening[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAll()
      .then(setScreenings)
      .finally(() => setLoading(false))
  }, [])

  const refresh = () => {
    setLoading(true)
    getAll()
      .then(setScreenings)
      .finally(() => setLoading(false))
  }

  return { screenings, loading, refresh }
}
