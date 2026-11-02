# platsbanken-cli

Search Platsbanken (Arbetsförmedlingen, Sweden) through the open JobTech JobSearch API.
Zero runtime dependencies. `bun install` only pulls TypeScript dev types.

```bash
bun run src/cli.ts search -q "butik" -l "Växjö" --format table
bun run src/cli.ts detail <id> --format plain
bun run src/cli.ts --help
```

## Tests

```bash
bun run typecheck
bun run test                       # offline, against synthetic fixtures in tests/fixtures/
PLATSBANKEN_LIVE=1 bun run test    # also runs tests/live.test.ts against the real API
```

The field mapping has not yet been checked against a live response. See
`../SKILL.md` (Notes) and `../url-reference.md`.
