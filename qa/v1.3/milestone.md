# Life Expanded · v1.3 milestone

The development branch starts at public v1.2.3, commit `8baa84a`. Existing portraits, themes, journals, estate rules, financial accounting and character saves are the foundations of this update.

## Initial gap analysis and release decisions

| Area requested | Public v1.2.3 baseline | v1.3 priority |
| --- | --- | --- |
| Education | Age-based schools, campus rosters, grade, five named university/professional courses and a general trade route | Build admissions, credit, funding, varied credentials and progression into the existing enrollment record. |
| Careers | Interviews, employment contracts, pay grades, finance, regional/period jobs and sector actions | Extend the job catalog in place and connect real educational requirements to employment. |
| School relationships | Persistent teachers and classmates, ordinary relationship actions, clubs | Give peers and teachers ongoing roles in school life, decisions and discipline. |
| Specialized careers | Acting, music and sport already have paid occupations but little project-level progression | Add training, selection, contracts, delivery choices and real income through the existing ledger. |
| Story and replay | Conditional stories, a delay queue, memorials and award history | Give educational and career decisions later consequences and optional challenges. |
| Interface | Portrait journal, central age control, themed navigation and blocked decision sheets | Join the historical and modern school and job menus to the new playable systems. |
| Households, justice, health and civilization | Estates, pregnancy, relationships, court, prison, treatments, immigration, historical economies and religions all exist | Regression-test these alongside the new work. Larger changes are tracked below. |
| Persistence and release | Checksummed save slots and backups, compact dynasty archive, signed offline Android package | Validate new state, import legacy fixtures, compare old and new signing certificates and test the packaged assets. |

An existing save keeps its version 4 container and slot. Personal transcripts, school cases, accepted offer locations, study pensions, seasonal contracts and challenge progress are optional fields. A life that predates these systems can use them as play continues. A deceased character’s compact archive stores earned qualifications and completed seasons separately from the heir’s own record.

## Ordered follow-up backlog

1. Expand family law and child development with custody agreements, support transfers and shared parenting decisions linked to the estate ledger.
2. Give trials, legal representation, parole, reentry, and non-operational fictional criminal organizations deeper regional and historical progression.
3. Add a complete electoral cycle and a period-specific military service career with postings, transfer requests and retirement.
4. Extend business management with individual staff, products, competition and insolvency. Expand entertainment representation, music publishing and sports leagues beyond short contracts.
5. Add wider character-creation circumstances, intergenerational preferences, richer mental health and recovery stories, and related lifestyle and household challenges.
6. Playtest the installation, Android Back stack, file picker, touch responsiveness and long sessions on physical midrange hardware.

## Android build

The development APK is in [builds/Pocket-Years-v1.3.0.apk](../../builds/Pocket-Years-v1.3.0.apk). The release uses package `studio.pocketyears.game`, version code 19, minimum Android API 26, and the distributed v1.2.3 signing identity. The package contains the game, art, and world data. The Android manifest requests no permissions.

Run the automated suite with `python tools/run_regressions.py`. To replay it against an APK, extract its assets directory and pass that directory with `--assets`. The release builder uses the included AOSP dx compiler, a JDK with the compiler module, and Python with cryptography. Its release mode requires an existing keystore and a reference signed APK. Keep the signing inputs outside the source tree.

```sh
python tools/build_apk.py --out builds/Pocket-Years-v1.3.0.apk \
  --release-keystore "$POCKET_RELEASE_KEYSTORE" \
  --password-file "$POCKET_RELEASE_PASSWORD_FILE" \
  --upgrade-from "$POCKET_PREVIOUS_APK"
python tools/verify_apk.py builds/Pocket-Years-v1.3.0.apk --upgrade-from "$POCKET_PREVIOUS_APK"
```
