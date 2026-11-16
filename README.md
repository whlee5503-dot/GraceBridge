# GraceBridge

> **Bridging Faith and Health**

GraceBridge is a Progressive Web App (PWA) that helps faith community volunteers screen vulnerable people for depression, malnutrition, and chronic conditions, and connect them to nearby health services.

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.20702386.svg)](https://doi.org/10.5281/zenodo.20702386)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-blue.svg)](https://web.dev/progressive-web-apps/)
[![DPGA](https://img.shields.io/badge/DPGA-First%20Design-orange.svg)](https://digitalpublicgoods.net/)

---

## Table of Contents

- [Overview](#overview)
- [Intended Use and Limitations](#intended-use-and-limitations)
- [Clinical Tools](#clinical-tools)
- [Do No Harm by Design](#do-no-harm-by-design)
- [Privacy by Design](#privacy-by-design)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Adapting GraceBridge to Your Region](#adapting-gracebridge-to-your-region)
- [Language and Localization Roadmap](#language-and-localization-roadmap)
- [Contributing and Collaboration](#contributing-and-collaboration)
- [Roadmap](#roadmap)
- [Test Bed](#test-bed)
- [Data Governance Roadmap](#data-governance-roadmap)
- [License](#license)

---

## Overview

GraceBridge targets low-resource settings where access to health care is limited. Church volunteers, with no medical background, can:

1. Screen community members with standard clinical tools (PHQ-9, MNA-SF).
2. See color-coded risk results (Green / Yellow / Orange / Red).
3. Find nearby registered health facilities and, when someone reports thoughts of death or self-harm, see local crisis lines.

**Target populations:** elderly people living alone, homeless people, migrant workers, and other marginalized groups.

**Target environments:** low- and middle-income countries (LMICs), rural areas, and underserved urban communities.

---

## Intended Use and Limitations

**GraceBridge is a screening aid for trained or supervised volunteers. It is not a diagnostic tool, not a medical device, and not a replacement for assessment by a health professional.** Every result screen says so.

**This repository is a reference implementation, not a ready-to-use service for every country.** The public site at https://gracebridge.phtlab.org is a **demonstration deployment configured for South Korea**. Emergency numbers, health facility data, and some wording depend on the country. Before GraceBridge is used with real people anywhere else, someone who knows the local situation must adapt it (see [Adapting GraceBridge to Your Region](#adapting-gracebridge-to-your-region)). Until a country is configured, the app deliberately shows **no** emergency numbers or facilities rather than another country's.

Known limitations:

- Facility data currently exists only for South Korea and covers Seoul only (15 facilities, data dated 2025-06-13). See the status table below.
- The map uses OpenStreetMap tiles and needs an internet connection. Screening itself works offline.
- Clinical translations are available for English and Korean only.

---

## Clinical Tools

| Tool | Purpose | Score Range | Standard |
|---|---|---|---|
| PHQ-9 | Depression screening | 0–27 | Kroenke & Spitzer (2001) |
| MNA-SF | Nutrition screening | 0–14 | Rubenstein et al. (2001) |
| Chronic Conditions | Checklist | Yes/No | WHO chronic disease list |

The scoring rules in `src/lib/scoring.ts` follow the published standards and must not be changed without a citation to the standard (see [CONTRIBUTING.md](CONTRIBUTING.md)).

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

## Do No Harm by Design

GraceBridge asks people about depression, so mistakes can cause real harm. These safeguards are built into the app:

1. **PHQ-9 item 9 (thoughts of death or self-harm).** Any answer other than "not at all" forces the overall risk level to **High (red)**, regardless of the total score, and shows a safety card first. The card gives volunteers four plain steps (stay with the person, ask directly and calmly, call emergency services if there is immediate danger, reduce access to means) and the crisis lines of the configured country. The standard PHQ-9 total score itself is not altered. The reassuring "no action required" text is never shown when item 9 is positive.
2. **No other country's contacts.** Crisis lines and facilities come only from the country configured for the deployment (`VITE_COUNTRY_CODE`). If no country is configured, or no data exists for it, the app shows a generic message ("contact your local emergency number or nearest health facility") and never falls back to another country's numbers.
3. **No fake location.** If the device location is unavailable, the app does not assume one. Facilities are listed without distances and the user is told why.
4. **Distance checks.** If the nearest registered facility is more than 30 km away, the app warns the user to call before travelling. If it is more than 100 km away, the app shows no facilities and says so. Both limits can be changed in `src/lib/appConfig.ts`.
5. **Screening, not diagnosis.** Stated at the start and on every result screen.
6. **Clinically validated translations only.** A language is not enabled for end users until validated PHQ-9 and MNA-SF translations exist (see the language roadmap).
7. **Verified contacts only.** Emergency numbers and facility data must come from official sources and be verified before a country is enabled (see the checklist below).
8. **Anonymous by structure.** See Privacy by Design.

---

## Privacy by Design

GraceBridge is built so that collecting personally identifiable information (PII) is **structurally impossible**:

| Data | Stored |
|---|---|
| session_id (device-generated UUID) | ✅ |
| church_code | ✅ |
| region_code (country code of the deployment) | ✅ |
| PHQ-9 / MNA-SF scores, risk level | ✅ |
| Name, age, gender, contact | ❌ Never |
| Device location | ❌ Never stored or sent |

Results are stored anonymously in Supabase with Row Level Security (RLS): insert only, no read-back by default.

The device location is used only inside the browser to sort nearby facilities. It is not sent to the GraceBridge server. The map itself loads tiles from OpenStreetMap, which can see which map area is requested.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS |
| PWA | vite-plugin-pwa + Workbox (offline-first) |
| Deployment | Cloudflare Pages + Functions |
| Local DB | IndexedDB (offline queue) |
| Server DB | Supabase (PostgreSQL + RLS) |
| Referral data | Static JSON files in `public/referral-data/` loaded by the client; optional Cloudflare Pages Function (`/api/referral-db`) with a Cloudflare KV cache | cache; falls back to static files in `public/referral-data/` |
| i18n | i18next (en ✅ / ko ✅ / id, fr, sw: partial UI strings only, disabled pending clinical translation) |
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

Create a `.env.local` file in the project root (it is git-ignored):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-key
VITE_COUNTRY_CODE=KR
```

| Variable | Meaning |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable (anon) key. Never use a secret/service-role key in this app. |
| `VITE_COUNTRY_CODE` | ISO 3166-1 alpha-2 code of the country this deployment is configured for. If empty, no country-specific emergency numbers or facilities are shown. |

The file `.env.production` in this repository sets `VITE_COUNTRY_CODE=KR` for the public demonstration site. **If you deploy for another country, change it** and complete the steps in [Adapting GraceBridge to Your Region](#adapting-gracebridge-to-your-region).

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

### Demonstration site
🌐 https://gracebridge.phtlab.org (configured for South Korea)

### Deploy Your Own

1. Fork this repository.
2. Create your own Supabase project and apply the table and RLS policy used by `src/lib/supabase.ts` (insert only).
3. Connect the fork to Cloudflare Pages. Build command: `npm run build`. Output directory: `dist`.
4. Provide the build-time variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_COUNTRY_CODE` (for example in your Pages project settings, or by editing `.env.production` in your fork).
5. Complete the country adaptation checklist below **before** anyone uses the deployment.

---

## Adapting GraceBridge to Your Region

GraceBridge was built for low-resource settings, but **country-specific data cannot be generated automatically and is not guessed by the app**. Adding a country takes more than one file. Anyone can do this work: implementing organizations, health workers, researchers, or developers. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to submit it, and open an issue or write to contact@phtlab.org if you would like to work with the maintainer.

### Current status

| Country | Crisis lines | Referral facilities | Clinically validated UI languages |
|---|---|---|---|
| South Korea (KR) | ✅ 3 lines, checked against Korean government sources on 2026-11-15 | ⚠️ 15 facilities, Seoul only, data dated 2025-06-13 | Korean, English |
| Any other country | ❌ none | ❌ none | English |

### Checklist for a new country

1. **Set the country code.** Use `VITE_COUNTRY_CODE=XX` (ISO 3166-1 alpha-2).
2. **Add crisis and emergency lines** to `src/lib/crisisLines.ts`, keyed by country code. Use official sources, call each number to confirm it works, and record the source and date in your pull request. Never copy numbers from another country.
3. **Add the referral database** `public/referral-data/XX.json`:

```json
{
  "countryCode": "XX",
  "countryName": "Example Country",
  "updatedAt": "YYYY-MM-DD",
  "facilities": [
    {
      "id": "xx-001",
      "name": "Example Health Center",
      "type": "health_center",
      "address": "Street, City",
      "lat": 0.0,
      "lng": 0.0,
      "phone": "+000-00-0000000",
      "hours": "Mon-Fri 08:00-16:00",
      "free": true,
      "services": ["General health", "Mental health", "Nutrition"]
    }
  ]
}
```

   `type` is one of `clinic`, `hospital`, `health_center`, `pharmacy`, `ngo`. Every entry must be verified (phone number, address, opening hours, whether mental health and nutrition services are offered) and the source and verification date recorded in your pull request.
4. **Check the distance limits** in `src/lib/appConfig.ts` (`WARN_KM`, `OUT_OF_COVERAGE_KM`). In rural areas facilities can be far apart, so the defaults may need to change.
5. **Add translations** in `src/i18n/locales/{lang}.json`. PHQ-9 and MNA-SF must use **clinically validated versions** in that language; machine translation is not acceptable.
6. **Review the clinical cut-offs.** PHQ-9 and MNA-SF cut-offs follow the published standards. If local validation studies recommend different cut-offs, discuss this in an issue before changing anything.
7. **Test before use.** Check at least: item 9 answered positively (safety card shows the right numbers), location denied, location far from all facilities, offline use, and the country unset.

---

## Language and Localization Roadmap

GraceBridge's i18n architecture supports adding any language without code changes: only a new locale JSON file is required. However, **clinical instruments (PHQ-9, MNA-SF) require clinically validated translations**, not machine translation, before a language can be safely enabled for end users.

### Current State
- **English (en)** — ✅ Complete, including clinical instruments
- **Korean (ko)** — ✅ Complete, including clinical instruments
- **Indonesian (id)**: partial UI strings (about two thirds of the interface). The PHQ-9/MNA-SF questions and the new safety and result texts are **not clinically validated**. The language selector is intentionally disabled in the current release until a validated translation is secured, so that no volunteer or screened individual is served an unverified clinical instrument.
- **French (fr) / Kiswahili (sw)**: partial UI strings only (about half of the interface). Clinical instruments and the safety texts are not translated or validated, and these languages are not enabled.

### How New Languages Are Added
GraceBridge intends to grow its language coverage through **collaboration with domain experts** in each target region, for example licensed clinicians, public health researchers, or organizations holding validated local-language versions of PHQ-9/MNA-SF. A screening tool that misjudges depression or malnutrition because of a poor translation could cause real harm, so translation quality is treated as a clinical-safety requirement, not a UI task.

Implementing organizations or translators interested in contributing a validated language pack are welcome to open an issue or pull request on this repository.

---

## Contributing and Collaboration

GraceBridge is open source (MIT). Anyone can fix a problem, improve it for their region, or propose a collaboration with the maintainer.

- **Adapting it for your country or community:** follow the checklist above and [CONTRIBUTING.md](CONTRIBUTING.md).
- **Validated translations or local clinical expertise:** open an issue describing the language, the validated instrument version, and its source.
- **Bugs, safety concerns, wrong phone numbers or facility data:** open an issue. Safety and data-accuracy issues are treated as high priority.
- **Working together:** if you represent an implementing organization and want help adapting or piloting GraceBridge, open an issue titled "Collaboration", or write to contact@phtlab.org for a private conversation.

### Maintainer

GraceBridge is developed and maintained by Won Ho Lee at [PHT Lab](https://phtlab.org) ([ORCID](https://orcid.org/0009-0005-1866-8257)).

- Bugs, safety concerns, and data corrections: please open a GitHub issue so others can see and help.
- Collaboration proposals and private inquiries: contact@phtlab.org

---

## Roadmap

| Phase | Status | Goal |
|---|---|---|
| Phase 0 | ✅ Done | EpiAid fork + core files |
| Phase 1 | ✅ Done | scoring.ts + ScreeningForm UI |
| Phase 2 | ✅ Done | Privacy utilities + dashboard |
| Phase 3 | ✅ Done | Referral map + GPS + KR referral data |
| Phase 4 | ✅ Done | Cloudflare deployment (demonstration site) |
| Phase 5 | 🔄 In Progress | DPGA application: Level I passed, under review |
| Phase 6 | 🔲 Planned | Country adaptations with local partners (verified contacts, facility data, validated translations) |
| Phase 7 | 🔲 Planned | Expand Korean facility data beyond Seoul |

GraceBridge has not yet been piloted with real users. Field pilots with implementing partners are part of Phase 6.

---

## Test Bed

🧪 **DPGA Verification Test Bed**: https://gracebridge.phtlab.org/test-bed

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
- All screening data is **fully anonymous**: no names, ages, or contact information stored
- Only `session_id` (device-generated UUID), `church_code`, `region_code`, and scores are saved
- Data is stored in Supabase with Row Level Security (insert-only policy)
- The project maintainer can view aggregate anonymous statistics for monitoring purposes only

### Short-term (Pre-DPGA)
- Organization-specific dashboard URL per `church_code`
- Each organization can view only their own anonymous aggregate statistics
- No cross-organization data access

### Medium-term (Post-DPGA)
- Self-hosted deployment option
- Organizations can run their own Supabase instance
- Complete data sovereignty: the maintainer has zero access to field data
- Deployment guide for independent hosting

### Long-term
- DHIS2 / OpenMRS integration option for health system partners
- Federated data model: each country deployment is fully independent
- No central data collection required

> **Note for DPGA reviewers**: The current architecture ensures that even in the MVP state, no personally identifiable information is ever collected or stored. The roadmap above describes planned improvements to organizational data sovereignty, not privacy compliance (which is already implemented by design).