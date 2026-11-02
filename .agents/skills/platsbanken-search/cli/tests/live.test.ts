import { describe, expect, test } from "bun:test"
import { parseJSON, runCLI } from "./helpers"

// Live smoke test against the real JobTech API. Opt-in so CI and offline runs
// stay deterministic: PLATSBANKEN_LIVE=1 bun run test
const live = process.env.PLATSBANKEN_LIVE === "1"

describe.skipIf(!live)("live API", () => {
  test("search returns real ads with id/title/url, and detail reads one", async () => {
    const res = parseJSON<{ results: { id: string; title: string; url: string }[] }>(
      await runCLI(["search", "-q", "butik", "-l", "Växjö", "-n", "5"]),
    )
    expect(res.results.length).toBeGreaterThan(0)
    for (const r of res.results) {
      expect(r.id).toBeTruthy()
      expect(r.title).toBeTruthy()
      expect(r.url).toStartWith("https://")
    }
    const ad = parseJSON<{ description: string | null }>(await runCLI(["detail", res.results[0].id]))
    expect(ad.description).toBeTruthy()
  })
})
