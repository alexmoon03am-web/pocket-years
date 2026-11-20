# Pocket Years world locations

The offline directory contains 4,564 real cities and settlements in 243 countries and territories. It includes all 193 UN member states, the Holy See and the State of Palestine. Taiwan, Kosovo and inhabited territories are also selectable. Countries, territories and small communities have their own entries. The game's three original fictional US towns retain their previous save identifiers. [United Nations country names](https://unstats.un.org/unsd/ungegn/sessions/3rd_session_2023/documents/GEGN.2_2023_116_CRP116.pdf)

## Geographic sources

- The Natural Earth 1:10m populated places dataset is in the public domain. The build takes up to 12 of its largest places in each destination and includes additional entries marked as capitals or world cities, or with a population estimate of at least 100,000. The estimates prioritize options in the picker. [Natural Earth populated places](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/) · [Terms of use](https://www.naturalearthdata.com/about/terms-of-use/)
- Additional city and settlement names come from GeoNames, the DataHub World Cities extract maintained by DataHub and contributors, and GeoNames largest-settlement lists for smaller countries. These data are adapted under CC BY 4.0. The game filters records, joins country codes, combines alternate spellings, updates selected English names and keeps stable game identifiers. [GeoNames](https://www.geonames.org/) · [DataHub World Cities](https://datahub.io/core/world-cities) · [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)
- Country and territory names use DataHub Country Codes, ISO 3166 identifiers and English display names adapted from Unicode CLDR. DataHub lists ODC-PDDL, CC BY 4.0 and Unicode License v3 in the dataset metadata. The Unicode copyright and permission notice is included in the shipped geography.js module and the standalone HTML. [Country Codes](https://datahub.io/core/country-codes) · [Unicode CLDR](https://cldr.unicode.org/) · [Unicode license](https://www.unicode.org/license.txt)
- The directory excludes Antarctic and remote territories without a permanent civilian town suitable for this game. Small island states use actual towns, villages or districts. Tokelau's inhabited settlements are also described by its government. [Government of Tokelau](https://www.tokelau.org.nz/About%2BUs/Villages.html)

## Rebuilding the directory

The committed places-data.js is self-contained. The Android and HTML builds consume this same module. Blueprints for the original towns and known older save keys are in geography.js and the generator. The city database does not require internet access at build or play time.

To regenerate from upstream, supply the Natural Earth populated places simple GeoJSON, DataHub World Cities CSV, DataHub Country Codes CSV and the iso-codes distribution's iso_3166-1.json to the following command. The Git blob identifiers for the three upstream datasets used here are 4da9c6b27b5cd41d7c930ea9cd0c1f84548b65fb, 5950fcccc14e44fbbd25b4042ff077b91c63dca6 and 2756ebd48579e93f05155a134eeae88aa4a8f125, respectively.

```sh
python3 tools/build_geography.py ne_10m_populated_places_simple.geojson world-cities.csv country-codes.csv /usr/share/iso-codes/json/iso_3166-1.json
node tools/test_geography.cjs
```

## Game rules

A living adult may move their household once per age for 1,800 game dollars after resolving pending decisions. Custody and a balance below the fee prevent the move. International newcomers also need a current permit or adequate funds and a qualifying settlement route. Recent convictions can delay clearance. Citizens and permanent residents can return. The same fee applies to domestic and international moves. Related territories can share a domestic moving group. These are simplified game rules.

The home city updates immediately. The household setting can bring a partner and dependent children, while independent adult relatives keep their own address. A solo move leaves the household in place. Local indices adjust wages, taxes, household costs, property prices and lending. Companies and properties retain their operating location. The offline model uses simulated economics and immigration policy. Birthplace, financial balances after the fee, possessions, mortgages, and the original purchase city of newly acquired homes persist. Older deeds without a city use the recorded location at the age of purchase when the household first moves. An older inherited deed with no location uses the city the household is leaving. Rent and upkeep continue for property held elsewhere. The living-cost ledger assesses a housing expense when the household owns no home in its new city and the normal age, school and custody rules allow that expense.
