import { AD_URL, jsonFetch, parseAd, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

const AF_HOST = /(^|\.)arbetsformedlingen\.se$/i

/**
 * Accept a bare numeric ad id or a Platsbanken ad URL
 * (arbetsformedlingen.se/platsbanken/annonser/<id>). URLs on any other host
 * are rejected, so an employer's apply link cannot fetch an unrelated ad.
 */
export function normalizeId(input: string): string | null {
  const trimmed = input.trim()
  if (/^\d{4,}$/.test(trimmed)) return trimmed
  const hasScheme = /^https?:\/\//i.test(trimmed)
  if (!hasScheme && !/^[a-z0-9.-]+\.[a-z]{2,}\//i.test(trimmed)) return null
  let parsed: URL
  try {
    parsed = new URL(hasScheme ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
  if (!AF_HOST.test(parsed.hostname)) return null
  const m = parsed.pathname.match(/\/platsbanken\/annonser\/(\d{4,})\/?$/)
  return m ? m[1] : null
}

const yn = (v: boolean | null) => (v === null ? "anges inte" : v ? "ja" : "nej")

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = normalizeId(opts.id)
  if (!id) {
    writeError(`Could not parse a Platsbanken ad id from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    const body = await jsonFetch(`${AD_URL}/${id}`)
    const job = body === null ? null : parseAd(body)
    if (!job) {
      writeError("Ad not found (removed, expired, or wrong id)", "NOT_FOUND")
      return 1
    }
    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "—"}`,
        "",
        job.employmentType ? `Anställning: ${job.employmentType}` : "",
        job.workingHours ? `Omfattning: ${job.workingHours}` : "",
        job.duration ? `Varaktighet: ${job.duration}` : "",
        job.date ? `Publicerad: ${job.date}` : "",
        job.deadline ? `Sista ansökningsdag: ${job.deadline}` : "",
        `Körkort krävs: ${yn(job.drivingLicenseRequired)}${job.drivingLicenses.length ? ` (${job.drivingLicenses.join(", ")})` : ""}`,
        `Egen bil krävs: ${yn(job.ownCarRequired)}`,
        job.requiredLanguages.length ? `Språkkrav: ${job.requiredLanguages.join(", ")}` : "",
        "",
        job.description || "(ingen beskrivning)",
        "",
        `URL: ${job.url}`,
        job.applyUrl ? `Ansök: ${job.applyUrl}` : "",
      ].filter((l, i, a) => l !== "" || (a[i - 1] ?? "") !== "")
      process.stdout.write(lines.join("\n").trim() + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
