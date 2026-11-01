# Manga UI restyle — TEST BUILD ONLY (Juno, Oct 31 2026)
Board step 1 (Title and UI). Fallback/original UI untouched in ../ (ui.css, SPEC.md, *.html, renders/). Not live; nothing ships without Charlie's sign-off.
Files: manga.css, title.html, dialogue.html, choice.html, dialogue_long.html (200-char stress test), renders/.
Copy: exact from ../../../ui-copy.md (tagline = approved #2 "Before he rose, he had to fall."; choices = The Boulders A/B/C; prompt empty).

## Look (matches Mira's adult Azriel/Devon samples)
Crisp ink: 3px solid #16151a borders (1.5px inner), hard 4–5px offset ink shadow (manga panel frame), square corners.
Flat muted color, no gradients. Screentone: 6px dot grid, 10% ink (`--tone`), applied to BG and title panel only; never behind body text.

| Token | Hex | Use |
|---|---|---|
| --ink | #16151a | borders, text, name plate, primary button |
| --paper | #f4efe4 | text box, buttons, panels (ink on paper ≈ 16:1) |
| --paper-2 | #e8e1d2 | hover |
| --maroon | #5e2328 | tagline banner, ▼/▶ markers, focus ring (paper on maroon ≈ 11:1) |
| --olive #4b5340, --denim #1f2742, --sand #c9a77c, --sky #9fb0b8 | | BG placeholder / accents from sample wardrobe |

## Type
Display: Zen Antique / Shippori Mincho (fallback Georgia) — title, 42–76px. **Fonts must be self-hosted; renders show the Georgia fallback.**
Body: Nunito — dialogue 18–21px, buttons 18–20px, name plate 18px bold tracked. Nothing < 18px.

## Components
- Title: ink-framed paper panel with tone holding the title; tagline = maroon "tape" banner rotated -1.5°, paper italic bold. Menu: Begin (ink, inverted), Continue, Settings; 49–52px tall.
- Text box: paper panel, bottom-centered, width min(66ch + padding, 100% − 24px), `max-height: calc(33.33vh − 26px)` so box + name-plate overhang + shadow ≤ 1/3 screen. Text overflow scrolls inside the box.
- Name plate: solid ink tab with slanted right edge, paper text, overlapping top-left border.
- Log/Auto/Menu: same ink buttons, 48px min, 3px offset shadow; press = shadow collapses.
- Choices: full ink-framed paper buttons, max 560px, 56px min, maroon ▶ marker, left-aligned, wrap cleanly.

## Measured (headless Chrome, pixel scan of ink border incl. name plate + shadow)
| Render | Box h / screen | Ratio |
|---|---|---|
| dialogue 390x844 | 178/844 | 0.211 |
| dialogue 1280x720 | 200/720 | 0.278 |
| stress 200 chars 390x844 | 260/844 | 0.308 |
| stress 200 chars 1280x720 | 219/720 | 0.304 |
**Line length (Robert, Oct 31): 60–70 characters is a MAXIMUM, not a target. Phones wrap shorter.** Desktop measure ≈ 60–66 chars/line (`--measure: 66ch`); phones wrap at ≈ 30–40 chars at 18px, which is expected.

## Screens added Oct 31 (same tokens)
- **Ch1 card** (chapter1.html): toned paper panel, double ink frame (outer 3px + inner 1.5px inset rule), "Chapter 1" in an ink tab (18px, tracked caps via CSS), title 40–68px display, meta 18px maroon.
- **Save/Load** (saveload.html): Save/Load tabs (selected = inverted ink) + Back. Slot cards are ink-framed buttons, 96px min tall, 96x72 thumbnail + name + meta; empty slots use paper-2 thumb. Grid auto-fills ≥280px columns (1 column on phone, 3 at 1280).
- **Settings** (settings.html): rows label + control (stack on ≤520px). Sliders: 48px hit area, square ink thumb 28px. Toggles/segments are ink buttons, selected = inverted, `aria-pressed`. Live sample line uses the dialogue font size. Text size options should scale `--fs-body` (suggest Normal 18–21 / Large +2px / Largest +4px; never below 18).
- **Help** (help.html): Controls card + Support lines card. Support text is copied from team docs (story-bible.md "Content handling"; research/vn-best-practices.md "Real support resources"), shown with a maroon **pending** tag until Hope/Charlie approve, plus an empty `[SUPPORT LINE – pending Hope]` slot. Resources stay outside the story world.
- Long screens (Settings, Help on phone; Help at 1280) scroll inside `.screen`.

## Checks (automated, headless Chrome, all 7 screens × 2 sizes)
Every visible text node ≥ 18px; every button/link/input ≥ 48×48; no horizontal overflow. Result: 0 failures.

## Content warning start screen — [COPY PENDING CHARLIE'S APPROVAL]
warning.html. Whole screen: copy pending Charlie's approval (Hope's copy as relayed by Robert, Oct 31; story-bible.md line 137 calls for the screen). **"Support resources" link: specifically pending Charlie** (hope-ch1.md marks the support line "Charlie to decide").
- Title: Content warning
- Body: This story is drawn from real life. It's told with care, and nothing is shown graphically. Take breaks whenever you need to.
- Themes (bulleted, in order): A loved one's long illness and death / Grief and loss, including the death of a friend / Alcohol and substance use / Overdose (later chapters)
- Footer: quiet text link "Support resources" → help.html (left, 18px ink-soft underlined, no border/fill, 48px tall tap area) + primary "Continue" (right). Separate, non-overlapping hit areas; at 1280 they share one row, at 390 the link sits above Continue (wraps).
- Nothing from the cut Telling Grandpa screen.
- Checked: text ≥18px, targets ≥48px, both sizes.
