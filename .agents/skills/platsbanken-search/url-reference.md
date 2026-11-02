# Platsbanken / JobTech JobSearch API reference

**Status: unverified.** Written from the API's published documentation, not from a
captured live response. The generating environment's network policy blocked every
JobTech and Arbetsförmedlingen host. Check each path below against a live response
before relying on it, and correct this file together with `cli/src/helpers.ts`.

Things that were also not checked live: `robots.txt` on the API host, the API's terms of
use and data licence, and rate limits. Look them up at https://jobtechdev.se before
enabling the skill.

## Endpoints

| Purpose | Request |
|---------|---------|
| Search | `GET https://jobsearch.api.jobtechdev.se/search?<params>` |
| One ad | `GET https://jobsearch.api.jobtechdev.se/ad/<id>` (404 when removed or unknown) |
| Public ad page | `https://arbetsformedlingen.se/platsbanken/annonser/<id>` |

Headers sent: `Accept: application/json`, `User-Agent: Mozilla/5.0 (compatible; platsbanken-search-cli/1.0)`. No API key.

## Search parameters used

| Param | CLI flag | Notes |
|-------|----------|-------|
| `q` | `--query` + `--location` | Free text. Place names in it are matched against location fields. |
| `published-after` | `--jobage <days>` | `YYYY-MM-DDTHH:MM:SS` (UTC), computed as now minus N days. |
| `offset` | `--page` | `(page - 1) * 20` |
| `limit` | fixed `20` | The API maximum is 100. |
| `sort` | fixed `pubdate-desc` | Newest first. |

Not used: `municipality` / `region` (these take taxonomy concept ids, not names).

## Response fields

Search: `{ total: { value }, positions, hits: [ <ad> ... ] }`. `/ad/<id>` returns a single `<ad>`.

| Output field | Ad path |
|--------------|---------|
| `id` | `id` (string; numbers are coerced) |
| `title` | `headline` |
| `company` | `employer.name` |
| `location` | `workplace_address.municipality` (else `.city`) + `, ` + `workplace_address.region` |
| `date` | `publication_date` |
| `url` | `webpage_url`, falling back to the public ad page |
| `deadline` | `application_deadline` |
| `employmentType` | `employment_type.label` |
| `workingHours` | `working_hours_type.label` |
| `drivingLicenseRequired` | `driving_license_required` (boolean) |
| `ownCarRequired` | `access_to_own_car` (boolean) |
| `description` (detail) | `description.text` (plain text with newlines) |
| `duration` (detail) | `duration.label` |
| `vacancies` (detail) | `number_of_vacancies` |
| `applyUrl` (detail) | `application_details.url` |
| `requiredLanguages` (detail) | `must_have.languages[].label` |
| `drivingLicenses` (detail) | `driving_license[].label` |

A hit without `id` or `headline` is skipped. Other missing values become `null`.
