import {
  PAGE_SIZE,
  SEARCH_URL,
  jsonFetch,
  parseSearch,
  publishedAfter,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query: string
  location?: string
  jobage?: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

export function buildUrl(opts: SearchOpts, now: Date = new Date()): string {
  const params = new URLSearchParams()
  // The API reads place names inside the free-text query, so the location is
  // appended to q rather than sent as a concept-id filter.
  const q = [opts.query, opts.location].filter(Boolean).join(" ")
  params.set("q", q)
  if (opts.jobage !== undefined) params.set("published-after", publishedAfter(opts.jobage, now))
  params.set("offset", String((opts.page - 1) * PAGE_SIZE))
  params.set("limit", String(PAGE_SIZE))
  params.set("sort", "pubdate-desc")
  return `${SEARCH_URL}?${params.toString()}`
}

const yn = (v: boolean | null) => (v === null ? "?" : v ? "ja" : "nej")

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const header =
    "ID".padEnd(10) + " " + "TITLE".padEnd(40) + " " + "COMPANY".padEnd(24) + " " +
    "LOCATION".padEnd(22) + " " + "DATE".padEnd(10) + " KÖRKORT"
  const rows = cards.map((c) =>
    [
      c.id.padEnd(10),
      c.title.slice(0, 40).padEnd(40),
      (c.company || "—").slice(0, 24).padEnd(24),
      (c.location || "—").slice(0, 22).padEnd(22),
      (c.date || "—").slice(0, 10).padEnd(10),
      yn(c.drivingLicenseRequired),
    ].join(" "),
  )
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const body = await jsonFetch(buildUrl(opts))
    if (body === null) throw new Error("Search endpoint returned 404")
    const { total, cards: all } = parseSearch(body)
    const cards = opts.limit !== undefined ? all.slice(0, opts.limit) : all

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.date || "—"}\n` +
              `  körkort krävs: ${yn(c.drivingLicenseRequired)} · egen bil krävs: ${yn(c.ownCarRequired)}\n` +
              `  id: ${c.id}\n  ${c.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify({ meta: { count: cards.length, page: opts.page, total }, results: cards }, null, 2) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
