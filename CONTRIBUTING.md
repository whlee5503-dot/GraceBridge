# Contributing to GraceBridge

Thank you for helping. GraceBridge is open source (MIT) and is meant to be adapted by people who know their own region. This guide explains how.

## Ways to help

- **Adapt GraceBridge for a country or community** (emergency numbers, health facility data, validated translations).
- **Report a problem**, especially anything that could mislead or harm a person being screened.
- **Improve the code, documentation, or accessibility.**
- **Collaborate with the maintainer.** Open an issue titled "Collaboration" and describe your organization and goal, or write to contact@phtlab.org for a private conversation.

## Safety rules (please read first)

GraceBridge screens people for depression and malnutrition. A wrong number, a wrong facility, or a wrong translation can cause real harm. Therefore:

1. **Scoring.** Do not change `src/lib/scoring.ts` unless you cite the published standard (Kroenke & Spitzer 2001 for PHQ-9, Rubenstein et al. 2001 for MNA-SF) and explain why in your pull request. Safety handling that goes beyond the standard scoring (for example, PHQ-9 item 9) lives in `src/components/ScreeningForm.tsx`, not in `scoring.ts`.
2. **PHQ-9 item 9.** Any positive answer must continue to force the High (red) level and show the safety card. Do not remove or weaken this.
3. **Contacts and facility data.** Every emergency number and every facility must come from an official or clearly reliable source and must have been checked (call the number, confirm the address and hours). Never guess, never copy from another country, never use placeholder numbers.
4. **Translations.** PHQ-9 and MNA-SF translations must be clinically validated versions. Machine translation is not acceptable for these instruments. UI-only strings can be translated normally.
5. **No personal data.** Do not add features that collect names, ages, contact details, exact locations, or any other personal information.

## Adding a country

Follow the checklist in the README section "Adapting GraceBridge to Your Region":

1. Set `VITE_COUNTRY_CODE` for your deployment.
2. Add the country's crisis lines to `src/lib/crisisLines.ts`.
3. Add `public/referral-data/XX.json` (schema in the README).
4. Review `WARN_KM` and `OUT_OF_COVERAGE_KM` in `src/lib/appConfig.ts`.
5. Add validated translations if the country needs a new language.
6. Test the scenarios listed in the README.

In your pull request, include for each emergency number and each facility: the source (URL or document), the date you verified it, and how you verified it (for example, "called on 2026-01-15"). A pull request without this information will not be merged.

## Development setup

```bash
git clone https://github.com/whlee5503-dot/GraceBridge.git
cd GraceBridge
npm install
```

Create `.env.local` with your own Supabase test project and country code (see the README), then:

```bash
npm run dev      # local development
npm run build    # production build, must pass before you open a pull request
```

Never commit secret keys. `.env.local` is git-ignored.

## Pull request checklist

- [ ] `npm run build` passes.
- [ ] Safety scenarios tested: item 9 positive, location denied, no country configured.
- [ ] No contacts or facility data without a recorded source and verification date.
- [ ] No change to scoring rules without a cited standard.
- [ ] New or changed UI text added to both `en.json` and `ko.json` (or marked as needing translation).
- [ ] Documentation updated if behavior changed.

## Reporting problems

Open an issue on GitHub. For anything that could affect people's safety (wrong emergency numbers, wrong facility data, a result that hides a risk), say so in the title so it can be handled first.

For security vulnerabilities, please do not open a public issue. Email contact@phtlab.org instead.

Maintainer: Won Ho Lee, [PHT Lab](https://phtlab.org).

## Conduct

Be respectful and assume good faith. People using this tool may be in vulnerable situations, so discussions should keep their safety and dignity first.

## License

By contributing, you agree that your contributions are licensed under the MIT License.