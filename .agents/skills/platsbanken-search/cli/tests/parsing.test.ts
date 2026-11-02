import { describe, expect, test } from "bun:test"
import { join } from "path"
import { parseAd, parseSearch, publishedAfter } from "../src/helpers"
import { normalizeId } from "../src/commands/detail"
import { buildUrl } from "../src/commands/search"

const fixture = async (name: string) => Bun.file(join(import.meta.dir, "fixtures", name)).json()

describe("parseSearch", () => {
  test("maps hits and skips malformed ones", async () => {
    const { total, cards } = parseSearch(await fixture("search.json"))
    expect(total).toBe(3)
    expect(cards.map((c) => c.id)).toEqual(["90000001", "90000002", "90000004"])
    const [a, b, c] = cards
    expect(a).toEqual({
      id: "90000001",
      title: "Butiksmedarbetare deltid",
      company: "Exempelbutiken AB",
      location: "Växjö, Kronobergs län",
      date: "2026-10-30T08:00:00",
      url: "https://arbetsformedlingen.se/platsbanken/annonser/90000001",
      deadline: "2026-11-20T23:59:59",
      employmentType: "Vanlig anställning",
      workingHours: "Deltid",
      drivingLicenseRequired: false,
      ownCarRequired: false,
    })
    expect(b.location).toBe("Kronobergs län")
    expect(b.drivingLicenseRequired).toBe(true)
    expect(b.url).toBe("https://arbetsformedlingen.se/platsbanken/annonser/90000002")
    // Missing values are null, never omitted.
    expect(c.company).toBeNull()
    expect(c.location).toBeNull()
    expect(c.drivingLicenseRequired).toBeNull()
    expect(Object.keys(c)).toEqual(Object.keys(a))
  })

  test("rejects a body without hits", () => {
    expect(() => parseSearch({ total: { value: 0 } })).toThrow()
  })
})

describe("parseAd", () => {
  test("extracts requirements and normalises the description", async () => {
    const ad = parseAd(await fixture("ad.json"))!
    expect(ad.drivingLicenseRequired).toBe(true)
    expect(ad.drivingLicenses).toEqual(["B"])
    expect(ad.requiredLanguages).toEqual(["Svenska"])
    expect(ad.vacancies).toBe(2)
    expect(ad.duration).toBe("Tills vidare")
    expect(ad.applyUrl).toBe("https://example.com/ansok")
    expect(ad.description).toBe("Vi söker en butiksmedarbetare.\n\nDu arbetar i kassan & med påfyllning.")
  })

  test("returns null for a body without id/headline", () => {
    expect(parseAd({})).toBeNull()
  })
})

describe("normalizeId", () => {
  test.each([
    ["90000001", "90000001"],
    [" 90000001 ", "90000001"],
    ["https://arbetsformedlingen.se/platsbanken/annonser/90000001", "90000001"],
    ["arbetsformedlingen.se/platsbanken/annonser/90000001/", "90000001"],
    ["https://www.arbetsformedlingen.se/platsbanken/annonser/90000001", "90000001"],
  ])("accepts %p", (input, id) => expect(normalizeId(input)).toBe(id))

  test.each([
    "https://example.com/platsbanken/annonser/90000001",
    "https://arbetsformedlingen.se.evil.io/platsbanken/annonser/90000001",
    "https://arbetsformedlingen.se@evil.io/platsbanken/annonser/90000001",
    "https://arbetsformedlingen.se/annat/90000001",
    "abc",
  ])("rejects %p", (input) => expect(normalizeId(input)).toBeNull())
})

describe("buildUrl", () => {
  const now = new Date("2026-11-02T12:00:00Z")
  test("puts location in q, pages by 20, sorts newest first", () => {
    const u = new URL(buildUrl({ query: "butik", location: "Växjö", page: 3, format: "json" }, now))
    expect(u.origin + u.pathname).toBe("https://jobsearch.api.jobtechdev.se/search")
    expect(u.searchParams.get("q")).toBe("butik Växjö")
    expect(u.searchParams.get("offset")).toBe("40")
    expect(u.searchParams.get("limit")).toBe("20")
    expect(u.searchParams.get("sort")).toBe("pubdate-desc")
    expect(u.searchParams.has("published-after")).toBe(false)
  })
  test("maps --jobage to published-after", () => {
    const u = new URL(buildUrl({ query: "städ", jobage: 7, page: 1, format: "json" }, now))
    expect(u.searchParams.get("published-after")).toBe("2026-10-26T12:00:00")
    expect(publishedAfter(1, now)).toBe("2026-11-01T12:00:00")
  })
})
