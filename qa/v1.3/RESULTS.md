# Pocket Years v1.3.0 test results

We tested JavaScript extracted from the signed Android package on the host using the shipped engine, real rendering code, save parser and bundled data. The public v1.2.3 source at `8baa84a` passed all 30 of its original regression programs. The release candidate passed **38 of 38 regression programs**.

Across the three candidate panels, **2,240 complete lifetimes and 158,541 birthdays** were simulated. This total excludes replay controls, dynasty runs and focused fixtures. Multiple policies can start with the same birth seed. These results describe scripted exploratory and stress-test choices.

## Coverage

- The random-life panel completed 720 lives and 53,587 birthdays. Replaying 575 birthdays after a reload produced identical states. The oldest character reached 110. The suite verified 557 choices across 184 events, and 110 distinct events appeared during play.
- Focused suites checked 79 courses, 179 new modern/future openings, 29 period roles and 18 career categories. Acting, music and sport included checks that quoted fees reached the household ledger, that custody and injuries restricted play, and that recording income expired. Story checks covered 20 new events, 60 selections, six dated follow-ups and saved challenge progress.
- Matched balance panel of 624 candidate lives and 624 released controls. Birth years span 1200–3000. The London policies include unemployment, ordinary employment, professional education, investment and reemployment with and without assistance.
- New pathways panel of 896 lives and 63,163 birthdays across London, Cairo, Delhi and Kyoto. 1,439 admissions, 78 refusals, 1,241 earned qualifications, 15,656 workplace decisions and 716 validated save reloads. Every cohort includes an additional deterministic repeat of its first seed. Qualification, application and workplace decisions use normal engine entry points.
- Regression coverage also includes the prior suites for inheritance, courts, prison release, addiction, property, investment, hardship, religion, pets, worldwide migration and historical and future prices. The legacy playthrough suites exercise inputs in the HTML interface host, including navigation, duplicate taps, Android-style Back and decision acknowledgment.
- 24 successions, 24 archived graduates, 27 credentialed hires and 24 successor reloads across six independently seeded family lines. The parent’s transcript, dates, journal, family and estate survived archive and reload. Children pursued qualifications independently. A separate family completed 900 consecutive birthdays across all six eras, with 22 generations and 36 save imports. Its largest export was 490,234 bytes. Separately, 5/8 candidate families and 7/8 baseline families reached year 2100 in the ordinary-income family panel. The other lines ended with no eligible child.
- A fixture exported through the public v1.2.3 game contains an unfinished science course, an outstanding tuition loan, 75 journal entries, persistent NPCs and a pending event. Migration preserved the original decision, balance, debt, scheduled graduation and family history. The player graduated once. A tampered backup was rejected and a prior slot generation restored.

## Measured education outcomes

Each row starts 64 babies. Some die before finishing school. Studious policies seek aid or loans and attend tutorials. The low-effort policy is intentionally adverse. The return-to-study policy shares its birth seeds and childhood decisions, then changes behavior after dismissal. Dismissals count decisions over a lifetime.

| Birth year | City | Study policy | Completed full path | Withdrawals | Dismissals |
| --- | --- | --- | ---: | ---: | ---: |
| 1200 | Kyoto | workshop craft | 60/64 | 0 | 0 |
| 1550 | Cairo | market books | 62/64 | 0 | 0 |
| 1800 | Delhi | timber framing | 63/64 | 0 | 0 |
| 1910 | London | biology → clinical medicine | 61/64 | 0 | 0 |
| 1991 | Cairo | nursing associate → nursing bachelor | 62/64 | 0 | 0 |
| 2000 | London | biology → clinical medicine | 61/64 | 0 | 0 |
| 2026 | Kyoto | workshop craft | 64/64 | 0 | 0 |
| 2026 | Delhi | civil engineering → engineering master → engineering doctorate | 62/64 | 0 | 0 |
| 2026 | London | Voluntary withdrawal | 0/64 | 64 | 0 |
| 2026 | Delhi | Consistently slack off | 0/64 | 0 | 64 |
| 2026 | Delhi | Return after dismissal | 64/64 | 0 | 64 |
| 2080 | Kyoto | orbital systems | 62/64 | 0 | 0 |
| 2500 | Cairo | orbital systems → space master → space doctorate | 61/64 | 0 | 0 |
| 3000 | London | nursing associate → nursing bachelor | 62/64 | 0 | 0 |

Among the London medical-track lives, 61/64 reached pediatric practice using the employment and interview system. This policy explicitly pursues that specialty. Detailed cohort results, individual job distributions at age 35 and dynasty seeds are in [balance-results.json](balance-results.json).

## Balance against v1.2.3

Medians below apply to survivors of each policy at age 35, in the game’s ledger units. There are 40 starting lives per London policy, born in 1991. The ordinary policy always seeks the highest-paying eligible job. It deliberately puts pressure on the career gates. Cash transfers, inheritance, world events and debt still apply.

| London policy | Prior annual pay | v1.3 annual pay | Prior net worth | v1.3 net worth |
| --- | ---: | ---: | ---: | ---: |
| Highest eligible wage | 87,624 | 85,199 | 290,372 | 291,366 |
| Unemployed | 0 | 0 | -36,094 | -36,094 |
| Clinical education | 197,795 | 225,355 | 423,904 | 494,896 |
| Worker and investor | 87,624 | 85,413 | 299,640 | 300,661 |
| Return to work at 30 | 72,029 | 70,961 | 18,814 | 20,229 |
| Return with household relief | 72,029 | 70,961 | 132,410 | 134,830 |

## Defects found during development

- The first adverse nursing panel recorded 1,039 dismissals in 64 lives. Students could return to the same course with no change in preparation. Dismissal now requires a year away and recovered marks for readmission to the same field and level. The free revision action improves grades and discipline. The final low-effort group recorded 64 dismissals and 0 completions. In the matched returning group 64/64 completed the course.
- A preliminary maximum-wage run placed 37 of 39 ordinary survivors in league officiating and all 38 clinically qualified survivors in anesthesiology. Relevant sports and clinical experience requirements improved access rules, but players chasing the highest wage then clustered in wholesale sales. Employers offering the new occupations now quote pay within a bounded range. The final comparison below uses the same starting seeds and policies. Annual pay still depends on location, experience and qualifications.
- Enrolling after retirement could interrupt a pension. Retired students now retain exactly the same pension, receive zero employment wages, and resume retirement on graduation, dismissal or withdrawal. The regression checks transfers, repeated applications, custody and save reloads.
- A failed assessment postponed graduation and could inadvertently replace a student’s classmates. Rosters for the new programs now identify the original enrollment and campus. Probation keeps existing peers, while a genuine institutional transfer changes the roster.
- Updating the More menu to 1.3 exposed a hardcoded 1.2 assertion. The regression now derives the expected version from Android build metadata.

## Wage-maximizing careers at age 35

| Policy | Top role before employer offers | Top role in final package | Distinct final outcomes |
| --- | --- | --- | ---: |
| Ordinary worker | Wholesale representative (35/40) | Events coordinator (19/37) | 8 |
| Clinical education | Anesthesiologist (38/38) | Anesthesiologist (23/37) | 5 |

The panel deliberately selected the highest-paying eligible job. These counts show how that policy behaves for one city and birth cohort. They do not measure the career preferences of human players.

## APK verification

The APK has SHA-256 `5501a059b8e5bf40a52638952e452161896d4925f9582ee32f24fa242f7d423a`. The package verifier confirmed both v1 and v2 signatures, the same signing certificate and package name as v1.2.3, portrait activity and compatible save key. Build 19 follows build 18. All 158 checked assets and resources matched the source byte for byte.

## Interface playthrough and storage

On the offline interface host, 216 clicks on rendered buttons took a character born in 1492 from birth through succession. The player resolved 31 decisions, took a job, bought an asset, adopted 3 children, crossed into the Renaissance, reopened an autosave and continued as an heir after 61 birthdays.

The separate storage benchmark measured 37 checkpoints. Its largest backup was 490,234 UTF-8 bytes with 21 archived lives. Median host save and load were 8.95 ms and 15.17 ms. These timings use an in-memory storage adapter.

## Device and performance limits

All figures above are host simulation results. The environment provided no Android handset, running emulator, or test of installing the update over v1.2.3 on a device. The standalone Chromium executable could not start here and the separate cloud browser disallowed the local-file preview. The interface host does exercise modal behavior and real rendered button handlers. Device-specific readability, frame rate, file picker and Android system Back behavior still need a handset check.

## Reproduce

Use Python 3, Node.js and the JDK. Extract the final APK and set `POCKET_ASSET_DIR` to its extracted `assets` folder. Export the v1.2.3 Git commit into a separate directory for the matched baseline. The raw policies and cohorts use fixed seeds.

```sh
git archive -o /tmp/pocket-baseline.tar 8baa84a
mkdir -p /tmp/pocket-baseline /tmp/pocket-v13
tar -xf /tmp/pocket-baseline.tar -C /tmp/pocket-baseline
unzip -q builds/Pocket-Years-v1.3.0.apk -d /tmp/pocket-v13
export POCKET_ASSET_DIR=/tmp/pocket-v13/assets
python3 tools/run_regressions.py --assets "$POCKET_ASSET_DIR" --logs /tmp/pocket-v13-logs
node tools/benchmark_balance.cjs --assets /tmp/pocket-baseline/app/src/main/assets --output /tmp/pocket-base.json
node tools/benchmark_balance.cjs --assets "$POCKET_ASSET_DIR" --compare /tmp/pocket-base.json --output /tmp/pocket-candidate.json
node qa/v1.3/pathway_lifetimes.cjs 64 > /tmp/pocket-paths.json
node qa/v1.2/playthrough.cjs
node qa/v1.2/measure_saves.cjs
```
