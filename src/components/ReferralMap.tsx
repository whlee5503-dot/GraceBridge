// src/components/ReferralMap.tsx
// Phase 3 — Leaflet 기반 의료기관 지도 + GPS 거리순 목록
// Safety rules:
//  - No hard-coded fallback location (a wrong location means wrong facilities).
//  - Country comes from deployment config (VITE_COUNTRY_CODE); not configured => no data shown.
//  - Warn when the nearest facility is far; hide facilities when out of coverage.

import { useEffect, useMemo, useRef, useState, createElement } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Clock, Loader2, AlertTriangle, Navigation } from 'lucide-react'
import { useGeoLocation } from '../hooks/useGeoLocation'
import { loadReferralDB, getNearbyFacilities } from '../lib/referralDB'
import type { ReferralFacility, ReferralDB } from '../lib/referralDB'
import { COUNTRY_CODE, WARN_KM, OUT_OF_COVERAGE_KM } from '../lib/appConfig'

interface FacilityWithDistance extends ReferralFacility {
  distanceKm: number | null   // null when the user's location is unknown
}

interface ReferralMapProps {
  countryCode?: string
  riskLevel?: 'green' | 'yellow' | 'orange' | 'red'
  onClose?: () => void
}

const LIST_ALL_LIMIT = 20

// tel: link built with createElement (plain anchor, stops click from selecting the card)
function PhoneLink({ phone }: { phone: string }) {
  return createElement(
    'a',
    {
      href: 'tel:' + phone,
      onClick: (e: { stopPropagation: () => void }) => e.stopPropagation(),
      className: 'flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400',
    },
    createElement(Phone, { className: 'w-3 h-3' }),
    phone,
  )
}

export default function ReferralMap({
  countryCode = COUNTRY_CODE,
  riskLevel = 'green',
  onClose,
}: ReferralMapProps) {
  const { t } = useTranslation()
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)

  const { location, loading: gpsLoading, error: gpsError, retry } = useGeoLocation()
  const [db, setDb] = useState<ReferralDB | null>(null)
  const [dbLoading, setDbLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  // ── 시설 DB 로드 (위치와 무관) ──────────────────────────────────
  useEffect(() => {
    let cancelled = false
    if (!countryCode) {
      setDb(null)
      setDbLoading(false)
      return
    }
    setDbLoading(true)
    loadReferralDB(countryCode).then(d => {
      if (cancelled) return
      setDb(d)
      setDbLoading(false)
    })
    return () => { cancelled = true }
  }, [countryCode])

  // ── 위치가 있으면 가까운 순, 없으면 거리 없이 전체 목록 ─────────
  const nearby: FacilityWithDistance[] = useMemo(() => {
    if (!db || !location) return []
    return getNearbyFacilities(db.facilities, location.lat, location.lng, 8)
  }, [db, location])

  const listWithoutDistance: FacilityWithDistance[] = useMemo(() => {
    if (!db || location) return []
    return db.facilities.slice(0, LIST_ALL_LIMIT).map(f => ({ ...f, distanceKm: null }))
  }, [db, location])

  const nearestKm = nearby.length > 0 ? nearby[0].distanceKm : null
  const outOfCoverage = nearestKm !== null && nearestKm > OUT_OF_COVERAGE_KM
  const farWarning = nearestKm !== null && !outOfCoverage && nearestKm > WARN_KM
  const shownFacilities = location ? (outOfCoverage ? [] : nearby) : listWithoutDistance
  const showMap = !!location && !outOfCoverage && nearby.length > 0

  // ── Leaflet 지도 초기화 ────────────────────────────────────────
  useEffect(() => {
    if (!showMap || !location || !mapRef.current) return
    if (leafletMap.current) {
      leafletMap.current.remove()
      leafletMap.current = null
    }

    import('leaflet/dist/leaflet.css').catch(() => { })
    import('leaflet').then(L => {
      if (!mapRef.current) return
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current).setView([location.lat, location.lng], 13)
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
        .bindPopup(t('referral.myLocation', 'My location'))

      // 시설 마커
      const color = (riskLevel === 'red' || riskLevel === 'orange') ? '#DC2626' : '#16A34A'
      nearby.forEach(f => {
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
  }, [showMap, location, nearby, riskLevel, t])

  // ── 지도 중심 이동 ─────────────────────────────────────────────
  const flyTo = (f: FacilityWithDistance) => {
    setSelected(f.id)
    leafletMap.current?.flyTo([f.lat, f.lng], 15, { duration: 0.8 })
  }

  const isLoading = gpsLoading || dbLoading

  // 메시지 한 줄 카드
  const notice = (text: string) => (
    <div className="flex-1 flex items-center justify-center px-6 py-10">
      <p className="text-center text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{text}</p>
    </div>
  )

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900" style={{ minHeight: '100vh' }}>

      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">
            {t('referral.title', 'Nearby health facilities')}
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

      {/* 국가 미설정 */}
      {!countryCode && notice(
        t('referral.notConfigured', 'This deployment has no country configured, so no facility data is shown. Contact your local emergency number or nearest health facility.')
      )}

      {countryCode && (
        <>
          {/* 위치 실패 배너 */}
          {gpsError && !location && !isLoading && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 text-yellow-800 dark:text-yellow-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{t('referral.locationUnavailable', 'Your location is unavailable, so distances cannot be shown. Facilities are listed without distance.')}</span>
              <button onClick={retry} className="ml-auto underline text-xs">
                {t('referral.retry', 'Retry')}
              </button>
            </div>
          )}

          {/* 거리 경고 */}
          {farWarning && nearestKm !== null && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 text-yellow-800 dark:text-yellow-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{t('referral.farWarning', 'The nearest registered facility is about {{km}} km away. Call to confirm before travelling.', { km: Math.round(nearestKm) })}</span>
            </div>
          )}

          {/* 로딩 */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm">{t('referral.loading', 'Finding nearby facilities...')}</p>
            </div>
          )}

          {/* 이 국가의 데이터 없음 */}
          {!isLoading && !db && notice(
            t('referral.noCountryData', 'No facility data is available for this country yet. Contact your local emergency number or nearest health facility.')
          )}

          {/* 서비스 범위 밖 */}
          {!isLoading && db && outOfCoverage && nearestKm !== null && notice(
            t('referral.outOfCoverage', 'No registered facility within {{limit}} km of your location (nearest: about {{km}} km). Contact your local emergency number or nearest health facility.', { limit: OUT_OF_COVERAGE_KM, km: Math.round(nearestKm) })
          )}

          {/* 지도 + 목록 */}
          {!isLoading && db && !outOfCoverage && (
            <div className="flex flex-col flex-1 overflow-hidden">

              {showMap && (
                <div ref={mapRef} className="w-full" style={{ height: '40vh', minHeight: '240px', zIndex: 0 }} />
              )}

              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {shownFacilities.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-6">
                    {t('referral.noFacilities', 'No registered facilities nearby.')}
                  </p>
                ) : (
                  shownFacilities.map(f => (
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
                                {t('referral.free', 'Free')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {f.address}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {f.phone && <PhoneLink phone={f.phone} />}
                            {f.hours && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {f.hours}
                              </span>
                            )}
                          </div>
                        </div>
                        {f.distanceKm !== null && (
                          <div className="flex flex-col items-end flex-shrink-0">
                            <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                              <Navigation className="w-3 h-3" />
                              {f.distanceKm < 1
                                ? Math.round(f.distanceKm * 1000) + 'm'
                                : f.distanceKm.toFixed(1) + 'km'}
                            </div>
                          </div>
                        )}
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
        </>
      )}
    </div>
  )
}