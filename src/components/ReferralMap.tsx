// src/components/ReferralMap.tsx
// Phase 3 — Leaflet 기반 의료기관 지도 + GPS 거리순 목록

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Clock, Loader2, AlertTriangle, Navigation } from 'lucide-react'
import { useGeoLocation } from '../hooks/useGeoLocation'
import { loadReferralDB, getNearbyFacilities } from '../lib/referralDB'
import type { ReferralFacility } from '../lib/referralDB'

interface FacilityWithDistance extends ReferralFacility {
  distanceKm: number
}

interface ReferralMapProps {
  countryCode?: string
  riskLevel?: 'green' | 'yellow' | 'orange' | 'red'
  onClose?: () => void
}

export default function ReferralMap({
  countryCode = 'KR',
  riskLevel = 'green',
  onClose,
}: ReferralMapProps) {
  const { t } = useTranslation()
  const mapRef     = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)

  const { location, loading: gpsLoading, error: gpsError, retry } = useGeoLocation()
  const [facilities, setFacilities] = useState<FacilityWithDistance[]>([])
  const [dbLoading, setDbLoading]   = useState(true)
  const [selected, setSelected]     = useState<string | null>(null)

  // ── 시설 DB 로드 ───────────────────────────────────────────────
  useEffect(() => {
    if (!location) return
    ;(async () => {
      setDbLoading(true)
      const db = await loadReferralDB(countryCode)
      if (db) {
        const nearby = getNearbyFacilities(db.facilities, location.lat, location.lng, 8)
        setFacilities(nearby)
      }
      setDbLoading(false)
    })()
  }, [location, countryCode])

  // ── Leaflet 지도 초기화 ────────────────────────────────────────
  useEffect(() => {
    if (!location || !mapRef.current || facilities.length === 0) return
    if (leafletMap.current) {
      leafletMap.current.remove()
      leafletMap.current = null
    }

    import('leaflet/dist/leaflet.css').catch(() => {})
      import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([location.lat, location.lng], 13)
      leafletMap.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      // 내 위치 마커
      const myIcon = L.divIcon({
        html: '<div style="width:14px;height:14px;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 0 6px rgba(37,99,235,0.6)"></div>',
        iconSize: [14, 14] as [number, number],
        iconAnchor: [7, 7] as [number, number],
        className: '',
      })
      L.marker([location.lat, location.lng], { icon: myIcon })
        .addTo(map)
        .bindPopup(t('referral.myLocation', '내 위치'))

      // 시설 마커
      const color = (riskLevel === 'red' || riskLevel === 'orange') ? '#DC2626' : '#16A34A'
      facilities.forEach(f => {
        const icon = L.divIcon({
          html: '<div style="width:12px;height:12px;border-radius:50%;background:' + color + ';border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
          iconSize: [12, 12] as [number, number],
          iconAnchor: [6, 6] as [number, number],
          className: '',
        })
        L.marker([f.lat, f.lng], { icon })
          .addTo(map)
          .bindPopup('<b>' + f.name + '</b><br>' + f.address + (f.phone ? '<br>' + f.phone : ''))
      })
    })

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }
    }
  }, [location, facilities, riskLevel, t])

  // ── 지도 중심 이동 ─────────────────────────────────────────────
  const flyTo = (f: FacilityWithDistance) => {
    setSelected(f.id)
    leafletMap.current?.flyTo([f.lat, f.lng], 15, { duration: 0.8 })
  }

  const isLoading = gpsLoading || dbLoading

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900" style={{ minHeight: "100vh" }}>

      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">
            {t('referral.title', '가까운 의료기관')}
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold px-2"
          >
            ×
          </button>
        )}
      </div>

      {/* GPS 에러 배너 */}
      {gpsError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 text-yellow-800 dark:text-yellow-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{t('referral.locationFallback', 'GPS를 가져올 수 없어 서울 시청 기준으로 표시합니다.')}</span>
          <button onClick={retry} className="ml-auto underline text-xs">
            {t('referral.retry', '재시도')}
          </button>
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">{t('referral.loading', '주변 의료기관을 찾는 중...')}</p>
        </div>
      )}

      {/* 지도 + 목록 */}
      {!isLoading && (
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Leaflet 지도 */}
          <div ref={mapRef} className="w-full" style={{ height: '40vh', minHeight: '240px', zIndex: 0 }} />

          {/* 시설 목록 */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {facilities.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">
                {t('referral.noFacilities', '주변에 등록된 시설이 없습니다.')}
              </p>
            ) : (
              facilities.map(f => (
                <button
                  key={f.id}
                  onClick={() => flyTo(f)}
                  className={
                    'w-full text-left rounded-lg border p-3 transition-all ' +
                    (selected === f.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300')
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {f.name}
                        </p>
                        {f.free && (
                          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {t('referral.free', '무료')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {f.address}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {f.phone && (
                          <a
                            href={'tel:' + f.phone}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400"
                          >
                            <Phone className="w-3 h-3" />
                            {f.phone}
                          </a>
                        )}
                        {f.hours && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {f.hours}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        <Navigation className="w-3 h-3" />
                        {f.distanceKm < 1
                          ? Math.round(f.distanceKm * 1000) + 'm'
                          : f.distanceKm.toFixed(1) + 'km'}
                      </div>
                    </div>
                  </div>
                  {f.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {f.services.slice(0, 3).map(s => (
                        <span
                          key={s}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
