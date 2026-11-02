---
name: platsbanken-search
version: 1.0.0
description: >
  Use this skill to search Platsbanken, Arbetsförmedlingen's public job board
  for Sweden, through the open JobTech JobSearch API, or to read the full text
  of one Platsbanken ad. Invoke for Swedish vacancies in any sector, for example
  butik, städ, lokalvård, kök, restaurang, servering, café and service jobs in
  Växjö or other Swedish municipalities. Trigger phrases: Platsbanken,
  Arbetsförmedlingen, lediga jobb, sök jobb, jobbannonser, lediga tjänster,
  jobb i Växjö, search Swedish jobs, Swedish job board, job openings in Sweden.
context: fork
enabled: false  # UNVERIFIED: flip to true once `PLATSBANKEN_LIVE=1 bun run test` passes (see Notes)
allowed-tools: Bash(bun run .agents/skills/platsbanken-search/cli/src/cli.ts *)
---

# Platsbanken Search Skill

Search live job ads from **Platsbanken** (Arbetsförmedlingen, Sweden) through the
**JobTech JobSearch API**, the open API that Arbetsförmedlingen publishes for this
data. No login, no API key, and **zero runtime dependencies**. It runs with just `bun`.

> ⚠️ **Not yet verified against the live API.** This skill was generated in an
> environment whose network policy blocked `jobsearch.api.jobtechdev.se`. The
> request and field mapping follow the API's documented shape, and the offline
> tests pass against synthetic fixtures, but no live response has been checked.
> It ships with `enabled: false`, so `/scrape` skips it. See **Notes** for how to verify.

## When to use this skill

- Find open ads in a Swedish municipality (e.g. Växjö) for a role or sector
- Restrict to ads published in the last N days
- Read one ad in full, including whether it requires a driving licence or own car, and its language requirements

## Commands

### Search ads

```bash
bun run .agents/skills/platsbanken-search/cli/src/cli.ts search -q "<keywords>" [flags]
```

- `--query <text>` / `-q <text>`: **required.** Yrke, titel or keyword, in Swedish.
- `--location <text>` / `-l <text>`: a municipality or town, e.g. `"Växjö"`. It is added to the free-text query, which the API matches against place names.
- `--jobage <days>`: published within N days (mapped to `published-after`). Omit it for all open ads.
- `--page <n>`: page number (1-indexed, 20 ads per page).
- `--limit <n>` / `-n <n>`: cap results emitted (client-side).
- `--format json|table|plain`: default `json`.

Each result has `id`, `title`, `company`, `location`, `date`, `url`, plus
`deadline`, `employmentType`, `workingHours`, `drivingLicenseRequired` and
`ownCarRequired`. A value the ad does not state is `null`.

### Fetch one ad

```bash
bun run .agents/skills/platsbanken-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

Takes the numeric ad id from `search`, or a full
`https://arbetsformedlingen.se/platsbanken/annonser/<id>` URL. URLs on other hosts are
rejected. Returns the description, employment type, working hours, duration, deadline,
number of vacancies, driving-licence and own-car requirements, must-have languages, and the
apply link.

## Usage examples

```bash
# Butiksjobb i Växjö
bun run .agents/skills/platsbanken-search/cli/src/cli.ts search -q "butik" -l "Växjö" --format table

# Lokalvård i Växjö, senaste veckan
bun run .agents/skills/platsbanken-search/cli/src/cli.ts search -q "lokalvård" -l "Växjö" --jobage 7 --format table

# Köksbiträde och disk i Växjö
bun run .agents/skills/platsbanken-search/cli/src/cli.ts search -q "köksbiträde" -l "Växjö" --format table

# Restaurang och servering, sida 2
bun run .agents/skills/platsbanken-search/cli/src/cli.ts search -q "restaurangbiträde" -l "Växjö" --page 2 --format table

# Hela annonsen
bun run .agents/skills/platsbanken-search/cli/src/cli.ts detail 29812345 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default: programmatic use, passing ids to `detail` |
| `table` | Quick scanning, with a KÖRKORT column (ja / nej / ?) |
| `plain` | Reading one ad in full (`detail`) |

Errors go to **stderr** as `{ "error": "...", "code": "..." }`, with exit code `1`.

## Notes

- **Deal-breaker fields.** `drivingLicenseRequired` and `ownCarRequired` come straight from
  the ad's structured fields. `null` means the ad does not say. It does not mean "not
  required": read the description with `detail` before treating a job as reachable without a car.
- **Location is free text.** The API's structured `municipality` filter takes a taxonomy
  concept id, not a name. The CLI puts the place name in `q` instead. A query can therefore
  also match ads that only mention the town in their text.
- **Verifying the skill.** Allow `jobsearch.api.jobtechdev.se` in the environment's network
  settings, then run `cd .agents/skills/platsbanken-search/cli && PLATSBANKEN_LIVE=1 bun run test`
  and one `search ... --format table` by hand. If fields come back `null` or wrong, fix the
  paths in `cli/src/helpers.ts` and in `url-reference.md`. When it passes, set `enabled: true`
  above and replace the synthetic fixtures with trimmed live captures.
- The CLI retries 429/5xx with exponential backoff. Keep volume low anyway.
