import { describe, expect, test } from "bun:test"
import { parseJSON, runCLI } from "./helpers"
import { runWithFixtures } from "./mock"

const expectError = (r: { exitCode: number; stdout: string; stderr: string }, code: string) => {
  expect(r.exitCode).toBe(1)
  expect(r.stdout).toBe("")
  expect(JSON.parse(r.stderr).code).toBe(code)
}

describe("search", () => {
  test("json output has the portal-skill shape", async () => {
    const { result, requests } = await runWithFixtures(["search", "-q", "butik", "-l", "Växjö", "--jobage", "7", "-n", "2"])
    const out = parseJSON<{ meta: Record<string, unknown>; results: Record<string, unknown>[] }>(result)
    expect(out.meta).toEqual({ count: 2, page: 1, total: 3 })
    for (const r of out.results) {
      for (const k of ["id", "title", "company", "location", "date", "url"]) expect(r).toHaveProperty(k)
    }
    expect(requests).toHaveLength(1)
    expect(requests[0].searchParams.get("q")).toBe("butik Växjö")
    expect(requests[0].searchParams.has("published-after")).toBe(true)
  })

  test("table and plain formats render", async () => {
    const table = (await runWithFixtures(["search", "-q", "butik", "--format", "table"])).result
    expect(table.exitCode).toBe(0)
    expect(table.stdout).toContain("Butiksmedarbetare deltid")
    expect(table.stdout).toContain("KÖRKORT")
    const plain = (await runWithFixtures(["search", "-q", "butik", "--format", "plain"])).result
    expect(plain.stdout).toContain("körkort krävs: ja")
  })

  test("a non-retried HTTP error is a JSON error on stderr", async () => {
    // 400 is not retried, so this stays fast.
    const { result } = await runWithFixtures(["search", "-q", "butik"], 400)
    expectError(result, "SEARCH_FAILED")
  })

  test.each([
    [["search"], "NO_QUERY"],
    [["search", "-q"], "NO_QUERY"],
    [["search", "-q", ""], "NO_QUERY"],
    [["search", "-q", "butik", "--bogus", "x"], "UNKNOWN_FLAG"],
    [["search", "-q", "butik", "--jobage", "0.5"], "BAD_ARG"],
    [["search", "-q", "butik", "--page", "0"], "BAD_ARG"],
    [["search", "-q", "butik", "--format", "xml"], "BAD_ARG"],
    [["search", "-q", "butik", "-l"], "BAD_ARG"],
    [["nope"], "BAD_CMD"],
  ])("%p exits 1 with %s", async (args, code) => {
    expectError(await runCLI(args as string[]), code as string)
  })
})

describe("detail", () => {
  test("json and plain from an ad URL", async () => {
    const { result, requests } = await runWithFixtures([
      "detail",
      "https://arbetsformedlingen.se/platsbanken/annonser/90000001",
    ])
    const ad = parseJSON<Record<string, unknown>>(result)
    expect(ad.requiredLanguages).toEqual(["Svenska"])
    expect(requests[0].pathname).toBe("/ad/90000001")
    const plain = (await runWithFixtures(["detail", "90000001", "--format", "plain"])).result
    expect(plain.stdout).toContain("Körkort krävs: ja (B)")
    expect(plain.stdout).toContain("Språkkrav: Svenska")
    expect(plain.stdout).toContain("Du arbetar i kassan & med påfyllning.")
  })

  test("404 is NOT_FOUND", async () => {
    expectError((await runWithFixtures(["detail", "90000009"], 404)).result, "NOT_FOUND")
  })

  test.each([
    [["detail"], "NO_ID"],
    [["detail", "https://example.com/platsbanken/annonser/90000001"], "BAD_ID"],
    [["detail", "90000001", "--format", "table"], "BAD_ARG"],
  ])("%p exits 1 with %s", async (args, code) => {
    expectError(await runCLI(args as string[]), code as string)
  })
})
