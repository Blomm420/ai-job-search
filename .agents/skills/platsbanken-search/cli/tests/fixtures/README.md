# Fixtures

`search.json` and `ad.json` are **synthetic**. They were written by hand from the
JobTech JobSearch API's documented response shape (see `../../../url-reference.md`),
not captured from the live API, because the host was unreachable from the
environment where this skill was generated. Employer names and ids are invented.
`search.json` also carries deliberately malformed hits (missing headline, a bare
string, null employer) to test that one bad hit does not break the rest.

Replace them with trimmed live captures once `PLATSBANKEN_LIVE=1 bun run test`
has passed against the real API.
