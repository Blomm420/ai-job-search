# Search Queries for Job Scraper

<!-- SETUP: Customize these queries based on your skills, target roles, and location -->

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first. Shipped country-agnostic CLIs include `linkedin-search` and `freehire-search`; Danish demos and any skill you add with `/add-portal` are included the same way. You do **not** need a matching `site:` line below for those CLIs to run.

The `site:` query templates in this file are the **WebSearch fallback** — for portals without a CLI, company career pages, or when a CLI fails.

**Language scope:** write every query category in every language listed in your CLAUDE.md Languages table (typically 1-2, sometimes more). A posting requiring a language you have *not* declared, as a job condition, is excluded before scoring; a posting requiring a *higher level* than you declared in a language you *do* work in is flagged for your own judgment, not excluded — see `04-job-evaluation.md`'s Language Gate, the single source of truth for this rule. Translate each category's keywords rather than machine-translating word-for-word (e.g. "Frontend Developer" -> "Desarrollador Frontend", not a literal word-for-word translation) if you work in more than one language.

## This fork's market

Queries are in Swedish, the only declared language. Area: Växjö / Norrhult, Kronobergs län. Targets: butik, städ, kök, restaurang, service. Deltid and heltid both count. Drop anything that requires a driver's license or a car.

Enabled CLI that fits: `linkedin-search`, personal use only, low volume. Pass the location explicitly, for example `--location "Växjö, Sweden"`. Run a separate call for Norrhult when the first call is only Växjö.

```bash
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "butiksmedarbetare" -l "Växjö, Sweden" --jobage 14 --format json
```

`freehire-search` is enabled in this repo and covers tech roles. Skip its hits unless the posting is actually butik, städ, kök, restaurang or service.

The four Danish portals (`jobindex-search`, `jobnet-search`, `jobbank-search`, `jobdanmark-search`) ship with `enabled: false`. Leave them disabled.

No CLI is shipped for Arbetsförmedlingen / Platsbanken. Use the `site:` lines below, or `/add-portal` on the board you want. Read the generated CLI before you run it.

## Search Sites

Primary:
- **arbetsformedlingen.se / Platsbanken** - Sweden's public job board. No shipped CLI; WebSearch fallback below.
- **linkedin.com/jobs** - also covered by `linkedin-search` (`-l "Växjö, Sweden"`)

Secondary (company career pages and other boards via WebSearch, not shipped CLIs):
- `site:` searches for a named employer once a posting is in play
- Other Swedish boards only as a WebSearch fallback (for example Indeed or Blocket Jobb). Do not treat them as installed CLIs.

## Query Categories

Queries are grouped by priority. This profile has one working language, Swedish, so each category is written in Swedish. Combine each query with Växjö, Norrhult, or Kronoberg.

**Organize by function, not job title.** The same work is posted under several titles. Each priority below is a function, with several titles as variants.

### Priority 1: Butik och service

The main target. No documented shop experience; these are search targets, not proof of fit.

```
site:arbetsformedlingen.se butiksmedarbetare Växjö
site:arbetsformedlingen.se butiksbiträde Kronoberg
site:arbetsformedlingen.se "service" deltid Växjö
site:linkedin.com/jobs "butiksmedarbetare" Växjö
```

### Priority 2: Städ

```
site:arbetsformedlingen.se lokalvårdare Växjö
site:arbetsformedlingen.se städare Kronoberg
site:arbetsformedlingen.se städ Norrhult OR Växjö
site:linkedin.com/jobs städare Växjö
```

### Priority 3: Kök och restaurang

```
site:arbetsformedlingen.se köksbiträde Växjö
site:arbetsformedlingen.se diskare OR restaurangbiträde Kronoberg
site:arbetsformedlingen.se servering OR café Växjö
site:linkedin.com/jobs "köksbiträde" Växjö
```

### Priority 4: Omsorg (documented experience, not the stated first choice)

Only surface these as adjacent. The documented job is skötare on a dementia ward. Do not describe it as the goal of the search.

```
site:arbetsformedlingen.se skötare demens Kronoberg
site:arbetsformedlingen.se vårdbiträde Växjö
site:linkedin.com/jobs skötare Växjö
```

## Location Filter

Keep a job only when the workplace is a reasonable kollektivtrafik trip from Växjö or Norrhult. There is no driver's license and no car.
- Växjö
- Norrhult
- Other places in Kronobergs län that kollektivtrafik actually reaches from one of those two (check; do not assume)
- A posting that requires körkort or egen bil (exclude)
- A workplace that cannot be reached without a car, or that requires moving (exclude)

## Language Filter

Your working languages and levels are in CLAUDE.md's Languages table. When filtering scraped results, apply `04-job-evaluation.md`'s Language Gate: a posting requiring a language you haven't declared at all is excluded; a posting requiring a higher level than you declared in a language you do work in is not excluded, flag it clearly instead (see `job-scraper/SKILL.md`'s Step 3 "Quick Fit Assessment" for how the flag surfaces in `/scrape` output). Postings simply *written* in a language you don't work in, that don't require it on the job, are fine.

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. For example:
- "/scrape [focus_area]" -> relevant category queries + custom focus-specific queries
