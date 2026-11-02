# Fixtures

`search.json` and `ad.json` are **synthetic**. They were written by hand from the
JobTech JobSearch API's documented response shape (see `../../../url-reference.md`),
not captured from the live API. Employer names and ids are invented. Their field
paths were checked against a live `/search` and `/ad/<id>` response on 2026-11-02.
`search.json` also carries deliberately malformed hits (missing headline, a bare
string, null employer) to test that one bad hit does not break the rest.

`PLATSBANKEN_LIVE=1 bun run test` exercises the real API.
