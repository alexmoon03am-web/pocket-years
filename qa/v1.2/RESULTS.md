# Pocket Years v1.2 — Release and playtest report

Android version 1.2, build 15. Based on the released v1.1 source at `80f78a18f88c6f2c5e936c3f1c8bbc37d1716e14`. Tests used the JavaScript extracted from the signed v1.2 APK. The baseline scripts matched the signed v1.1 APK byte for byte.

## What changed for players

- **Careers and businesses.** New jobs have entry salaries and pay bands. Raises share an annual review, role experience matters, and professional credentials and specialist training gate better jobs. Changing employers no longer stacks raises. Business staffing, client demand, payroll and management limit how quickly a small operation can expand.
- **Households and debt.** Dependence on family, income, savings, rent and the local economy affect the annual budget. Household Accounts previews unmet costs. Players can seek shared accommodation, cut grocery costs, apply for in-kind support, negotiate a settlement or restructure loans. Secured lenders warn before selling collateral after three missed installments. Insolvency is available in the game's modern system. It costs assets and restricts credit. Fines and study loans survive it.
- **Health and family.** Historical households face different risks in early childhood, childbirth and hazardous occupations. Local outbreaks, household resources and available treatment affect outcomes. Guided is the default. Historical Realism can be selected and inherited. Trusts, wills and continuation as a surviving child are retained.
- **Markets through time.** The long-run price index no longer freezes near 2120. Wages, quoted goods, upkeep, investments and valuations use local changes in price levels. Original purchase records and loan balances survive loading an older life. A property's location premium is no longer compounded again every birthday.
- **Future chapters.** The orbital period begins in 2050, the Planetary Almanac in 2150 and the Long-voyage Atlas in 2500. Chapters have distinct careers, training, transport, properties, enterprises, healthcare, activities and local developments. The same family can cross both boundaries while keeping its deeds. Fictional breakthroughs unlock further content within each chapter.
- **Everyday fixes.** Price confirmations, receipts and ledger entries use the correct period currency. Duplicate taps on an event, purchase or birthday are guarded. Group visits retain individual relationship gains while limiting repeat boosts to the player. United religious branches share management of their original institutions. A stale scheduled event no longer hides another event due that year.

## Build and regression verification

The final offline suite passed **31 of 31** test programs. The matched balance benchmark completed **1,056 v1.2 lifetimes and 69,178 birthdays in four cities**, alongside 852 v1.1 controls. These counts exclude duplicate-seed checks and separate dynasty trials. The game, worldwide location database and new artwork are bundled in the APK. The v1.1 and v1.2 package identity and signing certificate matched, the Android version code increased, and the native save key matched. The v1 and v2 APK signatures, packaged file digests, portrait orientation, compiled Back handling and local-only WebView settings were verified.

APK SHA-256: `140c63ad3734db21e43f55c4aff2e176aee46990746148311c208ecc8ba66c15`

Four representative suite outputs follow. The source ZIP includes the other test outputs and the seed-level data in `qa/v1.2`.

> PASS 720 completed lives, 53621 birthdays, 597 identical serialized futures. Oldest age 110.
> PASS 164 events, 497 individually checked choices. 99 distinct events appeared during play.
> PASS zero- and two-event years, exact outcome deltas, locked decisions, seed determinism, old saves, teen payroll and bounded stats.

> PASS public v0.8.1 save imports, preserves its calendar, cash, journal and settings, and resumes.
> PASS 900 consecutive birthdays across all six eras, 25 generations, 36 save imports and 2 naturally ended lines; largest export 483959 bytes.

> PASS membership refusal, extinction, saturation and regional disruption. Million-member milestone after 713 years, 21 successions and 253 declining years in 900 birthdays.

> PASS native document picker export/import, local origin, UTF-8, stalled chooser, process recreation, cancellation, invalid provider, oversize rejection and atomic pending files.

## UI and existing saves

The offline interface host exercised the application's shipped rendering code and dispatched actions to its visible buttons. A recorded playthrough used 252 rendered button clicks, resolved 37 decisions, crossed 1500, studied, worked, bought an asset with earned money, adopted 3 children, reloaded a save and continued as an heir. Separate menu tests compared quoted amounts to actual cash or wage changes, tested old confirmation buttons after a screen change, and replayed rapid taps. Currency audits covered **75 historical and future menu or confirmation screens**.

Migration fixtures include early releases through v1.1. The v1.1 case included a future property, tuition debt, a family business, a child and a custom religion. The suites verified the original money, debts, assets, relationships, pending decisions, historical ledger and journals, plus slot recovery and invalid backup rejection. Derived projections such as next month's household spending update to v1.2 rules. Prior settled transactions retain their recorded amounts.

## Performance and limitations

A host-side benchmark checked storage at 66 checkpoints. The largest checksummed backup in this run contained 24 archived lives and measured 483,959 bytes in 2100. Median save and load times were 3.94 and 10.55 ms. The 95th percentiles were 16.03 and 32.63 ms. These timings describe the test host and an in-memory storage implementation.

No physical Android phone or emulator was available for an install-over-v1.1 test. Android signing and package checks, compiled-activity checks, the JVM document-provider test and offline UI-host playthrough cover different parts of the app. Device frame rate, system file-picker appearance and the Android install/update prompt still need a handset check. The cloud browser could not open the local offline preview.

Financial outcomes below are policy simulations. The ordinary worker consistently seeks the highest-paying eligible job. It is a reproducible upper-pressure case for entry-level careers. The price index and mortality model are gameplay approximations. Future prices are expressed in fictional credits, and early prices use simplified historical denominations. A lineage can end with no surviving child. 

## Original playtest and comparison method

The v1.1 deep playtest reported 216 complete lives across nine birth years (16,034 birthdays). Its 30-seed London test of a worker pursuing the best eligible job found median age-35 pay of $112,098 and net worth of $634,100. Its unemployed control reached −$327,249. For this release, a 40-seed London replay was run against both versions. Those new baseline medians differ from the old report because the samples differ. The matched comparison below uses the new panel on both sides.

## Failures found and addressed during testing

- The first candidate reduced unemployment debt but still promoted ordinary workers too quickly. Entry pay, experience, performance and review rules were corrected before the final run.
- A later panel exposed modern careers being paid on a different scale from food, housing and period careers after 2050. This was tested again against the final release. The table below records the final outcomes.
- Six of 24 old employment scenarios initially changed the displayed wage by up to 5.3% in future chapters. The final migration keeps the agreed pay of an existing job across reloads. A new job uses the current scale. All 24 snapshots preserved pay and bank balance.
- Five older migration tests assumed prospective expenses would retain an obsolete formula. Their revised assertions check the current projection independently and still compare the rest of the snapshot, including prior transactions.
- A passive medieval worker could qualify for knighthood through unrelated job tenure. Specialist training and military or court service are now checked.
- A future school-building regression used a fixed donor grant that fell below the new location-specific price. The fixture now checks refusal one unit below the quote, then funds the construction at the local rate and reconciles the actual balance.
- A historical succession fixture assumed its chosen line could never die out. Its revised test checks natural extinction and also requires a complete surviving 900-year run with successful reimports. Separate dynasty tests report all founder attempts, including those that ended early.

## Matched v1.1 and v1.2 lifetime results

Full lifetimes from birth until recorded death. Each policy uses the same panel of birth seeds in each release. Percentiles at age 35 use only living characters. All values are engine accounting units before the historical display conversion. Repeated seeds across policies can share childhood outcomes.

## London, born 1991

| Policy | Age 35 survivors, v1.1 → v1.2 | v1.1 median wage | v1.2 wage, median (P10 to P90) | v1.1 median net worth | v1.2 net worth, median (P10 to P90) |
| --- | --- | --- | --- | --- | --- |
| ordinary | 38 → 39 | 122,208 | 87,624 (80,397 to 99,608) | 746,049 | 290,372 (265,763 to 313,258) |
| unemployed | 39 → 39 | 0 | 0 (0 to 0) | -329,337 | -7,757 (-8,422 to -7,333) |
| professional | 38 → 38 | 344,940 | 197,795 (183,053 to 226,749) | 1,496,143 | 429,549 (391,424 to 461,097) |
| wealthy | 38 → 39 | 122,208 | 87,624 (80,397 to 99,608) | 836,941 | 299,640 (270,882 to 348,132) |
| recovery | 39 → 39 | 120,800 | 72,029 (65,977 to 81,949) | -58,664 | 45,208 (33,870 to 56,272) |
| assistedRecovery | 39 → 39 | 120,800 | 72,029 (65,977 to 81,949) | -58,664 | 134,086 (119,082 to 149,633) |

The ordinary worker applies to the best-paying eligible job each year, without buying training, seeking raises or investing. The unemployed character declines employment and buys no discretionary goods. The professional borrows for science and medical degrees. The investor starts one firm with earned savings, seeks clients, reinvests and buys portfolio units. The two recovery paths begin looking for work at 30. The assisted path chooses budget cuts and eligible household aid and restructuring. All retain naturally occurring life events, inheritance and local market effects.

## First decades by birth year

| Birth year / mode | v1.1 under-18 deaths | v1.2 under-18 deaths | v1.1 / v1.2 median death ages | v1.2 age-35 net worth, median (P10 to P90) |
| --- | --- | --- | --- | --- |
| 1200 / guided | 1 / 32 | 0 / 32 | 76 / 57 | 148,273 (140,533 to 165,751) |
| 1200 / historical | 1 / 32 | 4 / 32 | 76 / 49 | 156,584 (140,739 to 172,570) |
| 1400 / guided | 1 / 32 | 0 / 32 | 77 / 62 | 149,570 (141,707 to 164,675) |
| 1400 / historical | 1 / 32 | 3 / 32 | 77 / 50 | 157,311 (149,643 to 173,273) |
| 1550 / guided | 0 / 32 | 1 / 32 | 74 / 70 | 145,645 (137,680 to 162,557) |
| 1550 / historical | 0 / 32 | 4 / 32 | 74 / 52 | 157,901 (143,549 to 178,118) |
| 1800 / guided | 1 / 32 | 1 / 32 | 83 / 69 | 134,383 (123,489 to 147,901) |
| 1910 / guided | 1 / 32 | 2 / 32 | 75 / 73 | 224,319 (217,998 to 243,459) |
| 1980 / guided | 1 / 32 | 1 / 32 | 78 / 79 | 230,876 (206,475 to 251,039) |
| 2026 / guided | 1 / 32 | 1 / 32 | 75 / 70 | 878,624 (824,951 to 970,576) |
| 2080 / guided | 1 / 32 | 1 / 32 | 82 / 77 | 1,728,570 (1,671,688 to 1,995,235) |
| 3000 / guided | 1 / 32 | 1 / 32 | 74 / 79 | 3,156,448 (2,955,698 to 3,949,635) |

## Purchasing power at age 35

| Calendar year | Basic outgoings / take-home, v1.1 | Before final calibration | v1.2 | Cheapest offered home, months of take-home in v1.2 | Home observations / living characters |
| --- | --- | --- | --- | --- | --- |
| 2015 | 62% | 74% | 74% | 17 | 31 / 31 |
| 2061 | 9% | 15% | 66% | 60 | 31 / 31 |
| 2115 | 4% | 15% | 65% | 66 | 15 / 31 |
| 3035 | 4% | 18% | 68% | 93 | 26 / 31 |

Basic outgoings cover food, housing and dependents. Eligible observations require positive earned income. Market quotes use the least expensive available home in the applicable period catalog. Commercial-only years have no home quote.

## Regional sensitivity

Twelve additional birth seeds per era and city were run on both releases. Each city retains its own salaries, market conditions and historical events. Figures below are v1.2 median essential outgoings as a percentage of take-home pay at age 35.

| City | 2015 | 2061 | 2115 | 3035 | Complete v1.1 / v1.2 lives |
| --- | --- | --- | --- | --- | --- |
| Kyoto | 58% | 51% | 49% | 48% | 108 / 144 |
| Cairo | 62% | 55% | 53% | 54% | 108 / 144 |
| Delhi | 63% | 57% | 57% | 58% | 108 / 144 |

## Continuity and adverse outcomes

- v1.1 completed 528 seeded policy lifetimes and 39,136 birthdays. 8/8 family lines reached 2100 from 1200. Their simulation used ordinary earned income, estate transfers and adoptions. Succession counts ranged from 17 to 20.
- v1.2 completed 624 seeded policy lifetimes and 42,389 birthdays. 4/8 family lines reached 2100 from 1200. Their simulation used ordinary earned income, estate transfers and adoptions. Succession counts ranged from 7 to 24.
- Unassisted recovery: 39 of 39 characters who were underwater at age 30 returned to nonnegative net worth. Median recovery age among these recoveries was 31.
- Assisted recovery: 38 of 38 characters who were underwater at age 30 returned to nonnegative net worth. Median recovery age among these recoveries was 31.
- Early under-18 deaths were 2/96 in v1.1, 1/96 in v1.2 guided mode and 11/96 under historical realism.
- Deepest net loss across the lifetime unemployment controls was -21,030 (seed 2415085369). Age-specific results and all sampled seeds remain in the raw report.

Source digest (SHA-256, alphabetically ordered JavaScript basenames and contents in the APK asset directory):

- v1.1: `203926bad08fd438ae6d548d4119e5da7d9e0acf191443728ff04a1590ddbf5a`
- v1.2: `98a7bc85b8459739ca8ee2fc196105cdb85fe188661ead1653a53fc0f9c1397e`


Direct long-run checks found a changing price index after 2120 and finite values through year 18,000. A separate 940-year property appraisal run checked the value every birthday against its local market and condition, with the original deed intact. Market prices in distant centuries are fictional. These are tests of stability and affordability, rather than calendar-year price forecasts.

## Run the regression suite

From the source project directory, use Python 3, Node.js 18 or later and a JDK 17 or later. The included APK builder and verifier also use the Python cryptography package. To target the packaged code, first unzip the APK into a temporary directory. To make a personal build, use your own signing identity.

```sh
python3 tools/run_regressions.py --assets /path/to/extracted-apk/assets --logs /tmp/pocket-years-qa
node tools/benchmark_balance.cjs --assets /path/to/v1.1/assets --output baseline.json
node tools/benchmark_balance.cjs --assets /path/to/extracted-apk/assets --compare baseline.json --verify-balance --output candidate.json
python3 tools/build_apk.py --out Pocket-Years-v1.2.apk --identity-dir /path/to/your/signing-directory
python3 tools/verify_apk.py Pocket-Years-v1.2.apk
```
