# Kom igång på svenska

Den här förgreningen av [AI Job Search](README.md) är förberedd för jobbsök i **Växjö / Norrhult (Kronobergs län)**: butik, städ, kök, restaurang och service, **deltid eller heltid**. Profilen som redan ligger i repot använder bara de uppgifterna, plus arbete som skötare på demensavdelning (Forsagården, Forsa), skogslinje på Ösby och hantverk/finsnickeri på NVU Fagersta. Svenska är enda angivna språket. Inget körkort och ingen bil.

Repot är **publikt**. Namn, telefon, e-post, gatuadress och personnummer ska inte committas. Se [Kontaktuppgifter](#kontaktuppgifter).

Den engelska [README](README.md) beskriver ramverket som det ser ut upstream, inklusive författarens egen jobbsökning. Den här filen beskriver hur **den här** förgreningen används.

## Förutsättningar

- [Claude Code](https://claude.com/claude-code) (CLI). Det finns ingen gratisnivå: Claude Pro/Max/Team eller Anthropic API-krediter. Andra agenter kan läsa samma instruktioner via [AGENTS.md](AGENTS.md).
- Python 3.10 eller nyare (`python3 --version`).
- [Bun](https://bun.sh) för jobbsök-CLI:erna.
- LaTeX med `lualatex` och `xelatex`. På Debian/Ubuntu: `sudo apt install texlive-full`, eller en mindre installation enligt [SETUP.md](SETUP.md#minimal-tex-install-tinytexbasictex). CV:t kompileras med `lualatex`. Personligt brev kompileras med `xelatex`, för `cover.cls` använder `fontspec`.
- Valfritt: `pip install pypdf` så att textlagret i PDF:en kan kontrolleras. Annars fungerar Poppler (`sudo apt install poppler-utils`).

## Installera och starta

Från reporoten:

```bash
python3 tools/install_portal_clis.py
```

Kommandot kör `bun install` i varje portal-CLI under `.agents/skills/*/cli/`. `linkedin-search` har inga körberoenden. `bun install` där hämtar bara TypeScript-typer.

Starta sedan Claude Code i repot:

```bash
claude
```

Arbetsflödena är snedstreckskommandon inuti Claude Code (`/apply`, `/scrape`, `/interview`). Samma specifikationer ligger som markdown under `.claude/commands/` och `.claude/skills/`. En annan agent som läser [AGENTS.md](AGENTS.md) ska följa dem. Du kan skriva på svenska, till exempel "utvärdera den här annonsen".

## Var CV och profil ska ligga

| Vad | Var | I git? |
|-----|-----|--------|
| Fakta som redan är ifyllda (ort, måljobb, utbildning, Forsagården) | `CLAUDE.md` och `.claude/skills/job-application-assistant/01-candidate-profile.md` | Ja. Inga kontaktuppgifter. |
| Ditt riktiga CV, betyg, intyg | `documents/cv/`, `documents/diplomas/` | Nej. Se `documents/README.md`. |
| Namn, telefon, e-post, gatuadress | `profile.local.md` (kopiera exemplet) | Nej. |
| Anpassat CV per jobb | `cv/main_<foretag>_<roll>.tex` | Nej. |
| Personligt brev per jobb | `cover_letters/cover_<foretag>_<roll>.tex` | Nej. |
| Arkiv när en ansökan är skapad | `documents/applications/<foretag>_<roll>/` | Nej. |
| Master-CV:t som arbetsflödet utgår från | `cv/main_example.tex` | Ja, med platshållare för kontakt. |

Lägg det riktiga CV:t som PDF eller `.tex` i `documents/cv/`. Kör sedan `/setup` om du vill att Claude läser det och föreslår tillägg. `/setup` ska inte skriva telefon, e-post, gatuadress eller personnummer i filer som spåras av git.

## Kontaktuppgifter

```bash
cp profile.local.example.md profile.local.md
```

Fyll i `profile.local.md` lokalt. Den filen är gitignorerad. När ett CV eller brev skrivs läses uppgifterna därifrån och hamnar bara i de genererade filerna, som också är gitignorerade.

Skriv inte in personnummer någonstans i repot, inte ens i `profile.local.md`. Det hör hemma i arbetsgivarens formulär, inte på disk i den här mappen.

Kontrollera innan du committar:

```bash
git status
git check-ignore -v profile.local.md documents/cv/mitt-cv.pdf
```

## Arbetsflöden

### Utvärdera en annons

Klistra in länken eller hela annonstexten:

```text
/apply https://...
```

eller, om sidan inte går att hämta:

```text
/apply
<klistra in hela annonsen>
```

Första steget är alltid en bedömning mot profilen: kompetens, erfarenhet, logistik, språk. Annonsen körs genom `python3 tools/posting_guard.py` innan den läses som innehåll. Körkortskrav, bilkrav, arbetsplats utan kollektivtrafik och andra språk än svenska är nej. Butik, städ, kök och restaurang är mål, inte meriter du redan har. Bedömningen ska säga det rakt ut.

Vill du bara ha bedömningen, skriv "utvärdera den här annonsen" och be att inget CV skrivs än.

### Anpassa CV

När du vill gå vidare skriver arbetsflödet `cv/main_<foretag>_<roll>.tex` på svenska, från `cv/main_example.tex` och profilen. Rubrikerna ska vara svenska (`Arbetslivserfarenhet`, `Utbildning`, `Språk`, `Referenser`). Kontaktuppgifter tas från `profile.local.md`.

Profilen är kort. En sida är rätt längd. Lägg inte till påhittade punkter för att fylla två sidor.

Kompilera:

```bash
cd cv && lualatex -interaction=nonstopmode main_<foretag>_<roll>.tex && cd ..
```

### Personligt brev

Brevet skrivs på **svenska**, till just det jobbet, och får inte hitta på meriter. Hälsning: `Hej,` eller `Hej [förnamn],`. Avslut: `Med vänlig hälsning,`. Datum skrivs ut på svenska, till exempel `19 oktober 2026`, eftersom `\today` utan språkpaket ger engelsk månad.

Filen blir `cover_letters/cover_<foretag>_<roll>.tex`. Kompilera:

```bash
cd cover_letters && xelatex -interaction=nonstopmode cover_<foretag>_<roll>.tex && cd ..
```

Brevet ska vara en sida, med namnteckningen synlig.

`cover_letters/cover_example.tex` är en strukturmall och ett kompileringstest, inte ett brev att skicka.

### Intervjuförberedelse

När en ansökan finns i spåraren:

```text
/interview
```

Förberedelsen utgår från annonsen, CV:t och brevet som skickades. STAR-exemplen i `07-interview-prep.md` har medvetet tomma moment. Fyll dem själv. Arbetsflödet ska inte hitta på vad du gjorde på Forsagården.

## Söka annonser

```text
/scrape
```

`/scrape` läser `.claude/skills/job-scraper/search-queries.md` och kör de portaler som är påslagna.

- **LinkedIn** (`linkedin-search`) fungerar för Växjö. Automatisk hämtning strider mot LinkedIns villkor, så håll volymen låg. Exempel:

  ```bash
  bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "butiksmedarbetare" -l "Växjö, Sweden" --jobage 14 --format table
  ```

- **freehire.me** är påslagen men gäller teknikjobb. Träffar därifrån är inte måljobben, om de inte råkar vara service.
- **Danska portaler** (Jobindex, Jobnet, Jobbank, Jobdanmark) är avstängda. Låt dem vara avstängda.
- **Platsbanken / Arbetsförmedlingen** har inget färdigt CLI. Sökfrågorna i `search-queries.md` är WebSearch-reserven. Vill du ha ett eget CLI, kör `/add-portal` mot den sidan och läs koden innan du kör den.

`/rank` betygsätter en hög nyhittade annonser. `/outcome` bokför vad som hände sen.

## Sådant som inte får hittas på

- Arbetsuppgifter, datum, betyg eller omfattning som inte står i profilen
- Erfarenhet av butik, städ, kök eller restaurang
- Körkort, bil, truckkort, hygienpass eller andra intyg
- Andra språk än svenska
- Personlighetsomdömen ("serviceinriktad", "noggrann") utan att du själv har sagt dem
- Fakta om arbetsgivaren som inte är hämtade och kontrollerade utanför annonstexten

## Mer

Längre installationsdetaljer, TinyTeX och hur du hämtar uppdateringar från upstream: [SETUP.md](SETUP.md). Ramverkets engelska översikt: [README.md](README.md).
