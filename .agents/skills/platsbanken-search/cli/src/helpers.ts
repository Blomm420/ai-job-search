// Data source: JobTech JobSearch API (Arbetsförmedlingen), the open API behind
// Platsbanken. No authentication required. Both endpoints return JSON, so no
// HTML parsing is needed. Field paths are documented in ../../url-reference.md.

export const API_BASE = "https://jobsearch.api.jobtechdev.se"
export const SEARCH_URL = `${API_BASE}/search`
export const AD_URL = `${API_BASE}/ad`
export const PUBLIC_AD_URL = "https://arbetsformedlingen.se/platsbanken/annonser"
/** Ads requested per page. The API caps `limit` at 100; 20 keeps volume low. */
export const PAGE_SIZE = 20

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; platsbanken-search-cli/1.0)"

/** Fetch JSON with exponential backoff + jitter on 429/5xx. Returns null on a 404. */
export async function jsonFetch(url: string): Promise<unknown | null> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    const text = await response.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error("Response was not valid JSON")
    }
  }
  throw new Error("Request failed after max retries")
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  deadline: string | null
  employmentType: string | null
  workingHours: string | null
  /** true/false as stated in the ad; null when the ad does not say. */
  drivingLicenseRequired: boolean | null
  ownCarRequired: boolean | null
}

export interface JobDetail extends JobCard {
  description: string | null
  duration: string | null
  vacancies: number | null
  applyUrl: string | null
  /** Languages listed under the ad's must-have requirements. */
  requiredLanguages: string[]
  /** Driving-licence classes listed in the ad (e.g. "B"). */
  drivingLicenses: string[]
}

type Obj = Record<string, unknown>

function obj(v: unknown): Obj | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null
}

function str(v: unknown): string | null {
  if (typeof v === "number") return String(v)
  return typeof v === "string" && v.trim() ? v.trim() : null
}

function bool(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null
}

function label(v: unknown): string | null {
  return str(obj(v)?.label)
}

function labels(v: unknown): string[] {
  return Array.isArray(v) ? v.map(label).filter((s): s is string => s !== null) : []
}

/** "Växjö" or "Växjö, Kronobergs län" from workplace_address. */
function location(v: unknown): string | null {
  const a = obj(v)
  if (!a) return null
  const place = str(a.municipality) ?? str(a.city)
  const region = str(a.region)
  if (place && region && region !== place) return `${place}, ${region}`
  return place ?? region
}

export function publicUrl(id: string): string {
  return `${PUBLIC_AD_URL}/${encodeURIComponent(id)}`
}

/** Map one API hit to a JobCard. Returns null when id or headline is missing. */
export function parseHit(hit: unknown): JobCard | null {
  const h = obj(hit)
  if (!h) return null
  const id = str(h.id)
  const title = str(h.headline)
  if (!id || !title) return null
  return {
    id,
    title,
    company: str(obj(h.employer)?.name),
    location: location(h.workplace_address),
    date: str(h.publication_date),
    url: str(h.webpage_url) ?? publicUrl(id),
    deadline: str(h.application_deadline),
    employmentType: label(h.employment_type),
    workingHours: label(h.working_hours_type),
    drivingLicenseRequired: bool(h.driving_license_required),
    ownCarRequired: bool(h.access_to_own_car),
  }
}

/**
 * Parse a /search response. Each hit is parsed on its own, so one malformed
 * hit is skipped instead of breaking the rest.
 */
export function parseSearch(body: unknown): { total: number | null; cards: JobCard[] } {
  const b = obj(body)
  if (!b || !Array.isArray(b.hits)) {
    throw new Error("Unexpected search response: no hits array")
  }
  const totalRaw = obj(b.total)?.value
  const total = typeof totalRaw === "number" ? totalRaw : null
  const cards: JobCard[] = []
  for (const hit of b.hits) {
    try {
      const card = parseHit(hit)
      if (card) cards.push(card)
    } catch {
      // skip a malformed hit
    }
  }
  return { total, cards }
}

/** Parse an /ad/<id> response into a JobDetail. */
export function parseAd(body: unknown): JobDetail | null {
  const card = parseHit(body)
  const b = obj(body)
  if (!card || !b) return null
  const desc = obj(b.description)
  const mustHave = obj(b.must_have)
  const vacancies = b.number_of_vacancies
  const text = str(desc?.text)
  return {
    ...card,
    description: text ? text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n") : null,
    duration: label(b.duration),
    vacancies: typeof vacancies === "number" ? vacancies : null,
    applyUrl: str(obj(b.application_details)?.url),
    requiredLanguages: labels(mustHave?.languages),
    drivingLicenses: labels(b.driving_license),
  }
}

/** Posting age in days -> published-after timestamp (UTC, second precision). */
export function publishedAfter(days: number, now: Date = new Date()): string {
  const d = new Date(now.getTime() - days * 86_400_000)
  return d.toISOString().slice(0, 19)
}
