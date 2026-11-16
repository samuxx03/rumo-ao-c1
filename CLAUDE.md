# Rumo ao C1: notes for Claude

Personal web app for going from B2 to C1 in **Brazilian** Portuguese in 60 days (program started 2026-11-16).
The owner speaks Spanish at C1 and English; the interface mixes Portuguese labels with short English explanations.

## Files
- `index.html`: layout and all CSS (design tokens in `:root`, light + dark themes).
- `data.js`: all content (`window.PT_DATA`): decks of cards, drill topics, drills, writing tasks, conversation scenarios.
- `lessons.js`: grammar lessons (`window.PT_LESSONS`), one per drill topic id.
- `app.js`: everything else (vanilla JS, no framework, no build step).
- `tests/`: jsdom smoke tests. Run `npm install` once, then `npm test`. Keep them passing; add a test for each new feature.

## Two ways the app runs
1. **As a Claude artifact** (claude.ai). Capabilities come from `window.claude.use(name)`: `sample` (AI), `db` (cloud save), `user`, `tts`, `dictation`. No API key needed.
2. **As a normal web page** (GitHub Pages or opening `index.html`). `window.claude` doesn't exist: AI uses the Anthropic API with a key stored in localStorage (gear menu), voice uses Web Speech, progress is saved in localStorage only.
Every feature must work, or degrade gracefully, in both modes. Never hard-code an API key.

## Conventions
- Build DOM with the `h()` helper; never put AI or user text into innerHTML.
- State lives in `S` and is saved with `save()`. Card ids are `deck + ":" + slug(pt)`, so changing a card's `pt` resets its review history.
- AI calls go through `AI.json(prompt)` / `AI.text(...)`, asking for JSON only, Brazilian (not European) norms, explanations in `L()`.
- Content must be accurate Brazilian Portuguese. Point out differences from Spanish where useful.
- Keep AI usage low: cache results, keep prompts short, prefer built-in content.

## Related
- Product plan and learnings for the future public app: private repo `samuxx03/language-app-plan` (METHOD.md, ANALYSIS.md, PRODUCT.md, LEARNINGS.md, IDEAS.md, open-source-stack.md).
