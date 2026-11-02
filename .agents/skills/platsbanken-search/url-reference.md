# Platsbanken / JobTech JobSearch API reference

**Status: verified against live responses on 2026-11-02** (search for "butik Växjö" and
`/ad/31642313`). When the API changes, correct this file together with `cli/src/helpers.ts`.

- Licence: the OpenAPI spec (`/swagger.json`) states "Ads are licensed under CC0".
- `robots.txt` on the API host returns 404, so no paths are disallowed.
- No API key. No published rate limit was found; the CLI backs off on 429/5xx.
- Docs: https://gitlab.com/arbetsformedlingen/job-ads/jobsearch/jobsearch-api/-/blob/main/docs/AdFields.md

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

Not used: `municipality` / `region` (these take taxonomy concept ids, not names; Växjö kommun is `mmot_H3A_auW`, Kronobergs län is `tF3y_MF9_h5G`).

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
| `description` (detail) | `description.text` (plain text with newlines; `text_formatted` holds HTML) |
| `duration` (detail) | `duration.label` |
| `vacancies` (detail) | `number_of_vacancies` |
| `applyUrl` (detail) | `application_details.url` |
| `requiredLanguages` (detail) | `must_have.languages[].label` |
| `drivingLicenses` (detail) | `driving_license[].label` |

A hit without `id` or `headline` is skipped. Other missing values become `null`.
