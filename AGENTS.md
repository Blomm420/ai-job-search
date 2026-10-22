---
framework_version: 1.0.2
---

# Agent Guidelines: AI Job Search

This workspace is structured to manage job search activities, scraper tools, CVs, cover letters, and interview preparation.

## Thin-Pointer Design (Single Source of Truth)

To prevent duplication and configuration drift across different AI agent frameworks (Claude Code, Google Antigravity, Codex, Cursor, Gemini CLI, etc.), this workspace uses a unified thin-pointer design. All agent runtimes should load the canonical specifications and candidate profiles from the files and directories below:

1. **Personal Candidate Profile:**
   - The candidate profile, contact details, education, and target preferences are defined in [CLAUDE.md](CLAUDE.md) and the individual profile methodology files under [.claude/skills/job-application-assistant/](.claude/skills/job-application-assistant/) (specifically `01-*.md` etc.).
2. **Canonical Workflow Specifications:**
   - The step-by-step instructions and triggers for tasks (setup, scrape, rank, apply, upskill, interview) are defined in the [.claude/](.claude/) directory (specifically under `.claude/skills/` and `.claude/commands/`).
   - Do not duplicate these rules or specifications. Treat `.claude/` files as the single source of truth.
3. **Portal Search Skills:**
   - Job-portal search CLIs live under [.agents/skills/](.agents/skills/) in the portable Agent Skills format (with a `SKILL.md` per portal). Codex and Antigravity discover these automatically; the `/scrape` workflow in [.claude/skills/job-scraper/](.claude/skills/job-scraper/) orchestrates them.

## Cursor Cloud specific instructions

This repository is a job-search framework. There is no dev server and no `start` process.

The image install puts Bun on `/usr/local/bin` (login shells skip `~/.bashrc`), installs the Debian TeX Live set from `.github/workflows/ci.yml` (`texlive-luatex`, `texlive-latex-extra`, `texlive-xetex`, `texlive-fonts-extra`, `texlive-fonts-recommended`, `poppler-utils`), and installs `openpyxl==3.1.5`, `PyYAML`, and `pypdf` with `python3 -m pip install --user`. System site-packages are not writable.

Do not send live requests to job portals. CI typechecks the portal CLIs and runs their fixture tests only; automated LinkedIn requests violate that skill's terms.

Checks that prove the environment:

- `python3 tools/lint_skills.py`
- `python3 tools/security_guards.py`
- `python3 -m unittest discover -s tests -t . -v`
- In each `.agents/skills/*/cli`: `bun test` when `tests/*.test.ts` exists. `bun run typecheck` passes for `freehire-search` and `linkedin-search`. The four Danish CLIs fail typecheck with the versions `bun install` resolves today (TypeScript 5.9.3, `@types/bun` 1.3.14, `@types/node` 16.9.1): `Response`, `URL`, and `Headers` lose their members. That is a dependency-typing failure, not a missing compiler. Do not reinstall TeX or Bun to chase it.
- `cd cv && lualatex -interaction=nonstopmode -halt-on-error main_example.tex`
- `cd cover_letters && xelatex -interaction=nonstopmode -halt-on-error cover_example.tex`
- `python3 tools/verify_pdf.py` on both PDFs with `--min-chars 100`

`tools/check_framework_version.py` and the upstream placeholder and exact page-count PDF assertions apply only to `MadsLorentzen/ai-job-search`. This fork is personalized. A one-page CV is correct.
