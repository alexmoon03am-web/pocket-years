# Pocket Years v1.3.1 · Interactive Life

This development branch starts at Life Expanded commit `698a1ce`. It installs as version 1.3.1 with version code 20 and package ID `studio.pocketyears.game`.

## Activities in this build

| Challenge | Where to find it | Outcome |
| --- | --- | --- |
| Prison Escape | Activities → Prison while serving a sentence | Collect an exit marker, make it past patrols and reach a cycling gate. Failure adds one or two years. Escape leaves an outstanding warrant and a choice to surrender. Recapture restores the unserved sentence and adds a year. |
| Burglary | Activities → Crime | Collect one or more prizes under a turn limit and carrying cap. High-value tiles raise alert. A successful haul pays at most 950 ledger units before historical scaling. Capture, expiry or withdrawal opens the existing court hearing. |
| Driving Test | Activities → Travel & driving, or Interactive activities where a license test is offered | Answer randomized questions about the fictional course, then park facing the correct direction without accumulating too many faults. Passing grants the existing license. Age requirements vary by the simulated jurisdiction. |
| Career Challenge | Occupation, or Interactive activities when working or managing a business | Complete a briefing order, light-switch puzzle or shift budget. Results change performance and reputation. Strong work can earn a small bonus or help a locally owned business sign a client, subject to the existing client cap. |
| Field Route Drill | Occupation during eligible uniformed or period service | Use adjacent obstacle counts and limited probes to reach the flag. Performance affects the existing work record and reputation. |
| Track Reaction Drill and Rehearsal Cues | Activities → Interactive activities from age 12 | Hit timed lane or pitch cues, or practice untimed three-cue sequences. Landed cues build running or music skills and feed existing competitive sports and performance progression. New injuries restrict sports attempts. |
| Period commissions | Activities → Interactive activities in supported years | Market, art, factory, model flight and habitat commissions use local period themes. Early commissions advance historical training. Adult commissions pay within a small cap. |
| Three Colors | Activities → Interactive activities in the fictional towns of Cedar Bay, Briar Glen and Sunfield, from age 21 and calendar year 1975 | Choose one of three equally likely colors. A match pays twice the stake including its return. At most 50 units can be staked per simulated year using the existing in-game currency. |

Each activity has a yearly attempt limit. The seeded arcade layouts are original. Court, licensing and training rules are game abstractions.

## Controls and settings

Open the game menu and choose **Minigame settings**. Casual, Standard and Challenging change board sizes, limits, prompts or cue windows depending on the game. Prison security can raise the challenge further. Relevant preparation helps, including current job performance, discipline, past results and fitness.

Grid games support direct adjacent-tile taps, directional buttons and keyboard arrows. Buttons-only mode removes tile taps. Coordinates, landmark symbols, textual status and an optional tutorial provide additional navigation cues. Reduced motion uses untimed cues for new performance rounds. A saved timed round played with reduced motion signals the cue with static text. Cue tones are generated locally. Vibration is opt-in and depends on WebView and device support.

With interactive play disabled, a seeded skill check uses the same eligibility, fee, consequence and annual attempt rules. Settings are saved with the character slot. The original archive and save container remain compatible.

## Save behavior

An attempt autosaves its seed, configuration, accepted actions and pause status. Backgrounding the app pauses the attempt. Reopening an interrupted attempt resumes from its last committed action, with a fresh cue window if applicable. During an attempt, normal life actions and aging wait until it is finished. Restart reuses the same board once per attempt, except Three Colors, which settles on the first pick. Ending an attempt early shows its consequences before confirmation.

Both gameplay and the save layer check revision numbers. The latter keeps a device-local minimum revision for each life. That prevents routine save imports and restores from replaying earlier moves, fees or payouts on the same installation. Current-state backups remain usable, and a paused attempt can be exported to another device. An older backup for the same life will be rejected if it precedes minigame progress recorded on this device. This local safeguard cannot carry across cleared app storage or enforce integrity against manually rewritten files.

## Remaining work

1. Extend the single-building burglary mode to multi-stage heists and additional player-selected contracts. Expand the fictional drills into fuller service and mission progression.
2. Add more driving exercises and motorsport, individual sports mechanics, production and concert performance, and deeper period crafts and exploration.
3. Broaden optional recreation and the workplace catalog with more puzzle types and longer assignments.
4. Test installation over the release APK on a physical Android phone. Check actual touch latency, assistive technology, sound, vibration, Back and lifecycle behavior, frame pacing and available storage on midrange devices.

## Verification

The final signed APK has SHA-256 `e474808f124510800a5e32b73dfd78b0c03d8de585a59862fea8f10ac7e929d5`. Its v1 and v2 signatures, portrait manifest, native Back branches and picker passed verification. The version code increases from 19 to 20. The signer, package and save key match distributed copies of v1.2.3 and v1.3.0. All 163 bundled assets and resources matched the working source byte for byte. The build requests vibration permission and has no internet permission.

- **41 of 41 regression suites passed** against scripts extracted from the APK. The existing life regression completed 720 lives and 53,587 birthdays, and matched 575 saved replays. The historical suite covered 900 consecutive birthdays, 22 generations and 36 reimports. The authentic v1.2.3 migration retained the student loan, pending event, family and graduation.
- **7,400 generated challenges had playable solutions.** This includes 3,600 escape and burglary boards, 1,200 driving courses and 2,600 career and training challenges. The stealth sample covered 2,467 distinct shapes, and 227 of 300 randomized routes led to capture. Tests also checked moving guards, gate periods, cue windows and the distribution of 1,200 card draws.
- **192 further lives completed 13,188 birthdays and 8,537 minigame attempts**, including 370 paused exports and reimports. The scripted policies deliberately sought risky activities and repeated escapes, so outcomes describe a stress test. This panel exercised medieval London, modern Cedar Bay and future Kyoto with interactive games enabled and disabled. Role-gated field drills were tested independently. [Cohort data](lifetime-results.json)
- The offline interface host dispatched the rendered tile taps, arrows, controls and timed cue buttons. It covered duplicate taps, settings, returning from a paused run, WebView-style reload and Back events, static reduced-motion cues and the existing route from a failed attempt to court.
- Tests exposed two edge cases. A guard could jump straight back to a patrol tile after pursuit, and a resumed timed drill lost its visual cue after switching to reduced motion. Guards now take legal steps back to patrols. Existing timed runs display a static cue while newly started rounds use untimed controls.

The host has no Android emulator or handset. Chromium startup was blocked by an operating-system socket restriction. The interface evidence comes from actual shipped rendering code and simulated inputs. Device installation, frame rate, vibration and native Back interactions still need a phone check.

## Reproduce

From the repository root:

```sh
python3 tools/verify_apk.py builds/Pocket-Years-v1.3.1.apk --upgrade-from builds/Pocket-Years-v1.3.0.apk
unzip -q builds/Pocket-Years-v1.3.1.apk -d /tmp/pocket-years-1.3.1
python3 tools/run_regressions.py --assets /tmp/pocket-years-1.3.1/assets
POCKET_ASSET_DIR=/tmp/pocket-years-1.3.1/assets node qa/v1.3.1/lifetimes.cjs
```

Rebuild with the repository's Python build command, a JDK, and an existing PKCS#12 release identity. The release workflow compares its signer with the reference APK before signing. [Build flags](../v1.3/milestone.md#android-build)
