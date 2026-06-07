// src/lib/referralDB.ts
// DPGA-First: 국가 코드 기반 플러그인 구조
// 어느 나라든 /public/referral-data/{countryCode}.json 만 추가하면 작동

export interface ReferralFacility {
  id: string;
  name: string;
  type: 'clinic' | 'hospital' | 'health_center' | 'pharmacy' | 'ngo';
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  hours?: string;
  free: boolean;
  services: string[];
}

export interface ReferralDB {
  countryCode: string;
  countryName: string;
  updatedAt: string;
  facilities: ReferralFacility[];
}

// ── 국가 코드 기반 로드 (DPGA-First 핵심) ───────────────────────
const cache: Record<string, ReferralDB> = {};

export async function loadReferralDB(countryCode: string): Promise<ReferralDB | null> {
  const code = countryCode.toUpperCase();

  // 캐시 확인
  if (cache[code]) return cache[code];

  try {
    const res = await fetch(`/referral-data/${code}.json`);
    if (!res.ok) return null;
    const data: ReferralDB = await res.json();
    cache[code] = data;
    return data;
  } catch {
    return null;
  }
}

// ── GPS 기반 가까운 시설 정렬 ────────────────────────────────────
export function getNearbyFacilities(
  facilities: ReferralFacility[],
  userLat: number,
  userLng: number,
  limit = 5,
): (ReferralFacility & { distanceKm: number })[] {
  return facilities
    .map(f => ({
      ...f,
      distanceKm: haversineKm(userLat, userLng, f.lat, f.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

// ── Haversine 공식 (두 좌표 간 거리 계산) ────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ── 사용자 GPS 위치 가져오기 ─────────────────────────────────────
export function getUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { timeout: 10000, maximumAge: 60000 },
    );
  });
}
