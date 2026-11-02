import { join } from "path"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { runCLI, type CLIResult } from "./helpers"

/**
 * Run the real CLI with fetch redirected to a local server that serves the
 * synthetic fixtures. Records every URL the CLI requested.
 */
export async function runWithFixtures(
  args: string[],
  status = 200,
): Promise<{ result: CLIResult; requests: URL[] }> {
  const requests: URL[] = []
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const url = new URL(request.url)
      requests.push(url)
      if (status !== 200) return new Response("{}", { status })
      const file = url.pathname === "/search" ? "search.json" : "ad.json"
      return new Response(Bun.file(join(import.meta.dir, "fixtures", file)))
    },
  })
  const dir = mkdtempSync(join(tmpdir(), "platsbanken-fixture-"))
  const preload = join(dir, "fetch.ts")
  writeFileSync(
    preload,
    `
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.origin !== "https://jobsearch.api.jobtechdev.se") throw new Error("Unexpected request " + url);
      return originalFetch(${JSON.stringify(server.url.origin)} + url.pathname + url.search, init);
    };
  `,
  )
  try {
    return { result: await runCLI(args, preload), requests }
  } finally {
    server.stop(true)
    rmSync(dir, { recursive: true, force: true })
  }
}
