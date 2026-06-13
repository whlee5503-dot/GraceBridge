# GraceBridge

> **Bridging Faith and Health**

GraceBridge is a Progressive Web App (PWA) that empowers church volunteers to screen vulnerable populations for depression, malnutrition, and chronic conditions, then instantly refer them to nearby healthcare services.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-blue.svg)](https://web.dev/progressive-web-apps/)
[![DPGA](https://img.shields.io/badge/DPGA-First%20Design-orange.svg)](https://digitalpublicgoods.net/)

---

## Table of Contents

- [Overview](#overview)
- [Clinical Tools](#clinical-tools)
- [Privacy by Design](#privacy-by-design)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Country Expansion](#country-expansion)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

GraceBridge targets low-resource settings where healthcare access is limited. Church volunteers — with no medical background — can:

1. Screen community members using validated clinical tools (PHQ-9, MNA-SF)
2. View color-coded risk results (Green / Yellow / Orange / Red)
3. Connect high-risk individuals to nearby health facilities via GPS map

**Target populations:** Elderly living alone, homeless individuals, migrant workers, and other marginalized groups.

**Target environments:** Low- and middle-income countries (LMICs), rural areas, and underserved urban communities.

---

## Clinical Tools

| Tool | Purpose | Score Range | Standard |
|---|---|---|---|
| PHQ-9 | Depression screening | 0–27 | Kroenke & Spitzer (2001) |
| MNA-SF | Nutrition screening | 0–14 | Rubenstein et al. (2001) |
| Chronic Conditions | Checklist | Yes/No | WHO chronic disease list |

### PHQ-9 Risk Levels
| Score | Level | Action |
|---|---|---|
| 0–4 | 🟢 Green | No action needed |
| 5–9 | 🟡 Yellow | Monitor |
| 10–14 | 🟠 Orange | Professional consultation |
| 15–19 | 🔴 Red | Referral required |
| 20–27 | 🔴 Red+ | Urgent referral |

### MNA-SF Risk Levels
| Score | Level | Action |
|---|---|---|
| 12–14 | 🟢 Green | No action needed |
| 8–11 | 🟡 Yellow | Dietary guidance |
| 0–7 | 🔴 Red | Referral required |

---

## Privacy by Design

GraceBridge is architected so that collecting personally identifiable information (PII) is **structurally impossible**:

| Data | Stored |
|---|---|
| session_id (device-generated UUID) | ✅ |
| church_code | ✅ |
| region_code | ✅ |
| PHQ-9 / MNA-SF scores | ✅ |
| Name, age, gender, contact | ❌ Never |

All data is stored anonymously in Supabase with Row Level Security (RLS) — insert only, no read-back by default.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS |
| PWA | vite-plugin-pwa + Workbox (offline-first) |
| Deployment | Cloudflare Pages + Functions |
| Local DB | IndexedDB (offline queue) |
| Server DB | Supabase (PostgreSQL + RLS) |
| Referral Cache | Cloudflare KV |
| i18n | i18next (en ✅ / ko ✅ / id 🔲 / fr 🔲 / sw 🔲) |
| State | Zustand |
| Mapping | Leaflet + OpenStreetMap |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/whlee5503-dot/GraceBridge.git
cd GraceBridge
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

---

## Deployment

GraceBridge is deployed on **Cloudflare Pages** with automatic deployment on push to `main`.

### Live URL
🌐 https://gracebridge.pages.dev

### Deploy Your Own

1. Fork this repository
2. Connect to Cloudflare Pages
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

---

## Country Expansion

GraceBridge uses a **pluggable referral database** — adding a new country requires only one JSON file.

### Add a New Country

1. Create `/public/referral-data/{COUNTRY_CODE}.json`:

```json
{
  "countryCode": "ID",
  "countryName": "Indonesia",
  "updatedAt": "2025-01-01",
  "facilities": [
    {
      "id": "id-001",
      "name": "Puskesmas Menteng",
      "type": "health_center",
      "address": "Jl. Raden Saleh No.45, Jakarta",
      "lat": -6.1944,
      "lng": 106.8378,
      "phone": "+62-21-3148xxx",
      "hours": "Mon-Fri 08:00-16:00",
      "free": true,
      "services": ["General health", "Mental health", "Nutrition"]
    }
  ]
}
```

2. Add i18n translations in `/src/i18n/locales/{lang}.json`

> ⚠️ PHQ-9 and MNA-SF translations must use **clinically validated versions** — machine translation is not acceptable.

---

## Roadmap

| Phase | Status | Goal |
|---|---|---|
| Phase 0 | ✅ Done | EpiAid fork + core files |
| Phase 1 | ✅ Done | scoring.ts + ScreeningForm UI |
| Phase 2 | ✅ Done | ResultsPage + privacy.ts + Dashboard |
| Phase 3 | ✅ Done | ReferralMap + GPS + KR referral DB |
| Phase 4 | 🔄 In Progress | Cloudflare deploy + pilot |
| Phase 5 | 🔲 Planned | DPGA application |
| Phase 6 | 🔲 Planned | Indonesia expansion |

---

## Test Bed

🧪 **DPGA Verification Test Bed**: https://gracebridge.pages.dev/test-bed

Validates clinical scoring accuracy, privacy-by-design, referral DB structure, and API endpoints.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

GraceBridge is free and open source. It will always remain free for use in low-resource settings.

---

*"Grace로 사람들을 건강한 삶으로 연결(Bridge)한다"*

**DPGA-First · Privacy-by-Design · Offline-First · Open Source (MIT)**

---

## Data Governance Roadmap

GraceBridge is designed with a privacy-first architecture. Below is the planned evolution of data governance to ensure transparency for DPGA reviewers and potential implementing organizations.

### Current State (MVP)
- All screening data is **fully anonymous** — no names, ages, or contact information stored
- Only `session_id` (device-generated UUID), `church_code`, `region_code`, and scores are saved
- Data is stored in Supabase with Row Level Security (insert-only policy)
- The project maintainer can view aggregate anonymous statistics for monitoring purposes only

### Short-term (Phase 5 — Pre-DPGA)
- Organization-specific dashboard URL per `church_code`
- Each organization can view only their own anonymous aggregate statistics
- No cross-organization data access

### Medium-term (Post-DPGA)
- Self-hosted deployment option
- Organizations can run their own Supabase instance
- Complete data sovereignty — maintainer has zero access to field data
- Deployment guide for independent hosting

### Long-term
- DHIS2 / OpenMRS integration option for health system partners
- Federated data model — each country deployment is fully independent
- No central data collection required

> **Note for DPGA reviewers**: The current architecture ensures that even in the MVP state, no personally identifiable information is ever collected or stored. The roadmap above describes planned improvements to organizational data sovereignty, not privacy compliance (which is already implemented by design).
