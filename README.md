# Rumo ao C1

A personal web app for going from **B2 to C1 in Brazilian Portuguese in 60 days**. It covers the parts that textbooks skip: how Brazilians actually talk (*não dá*, *dá pra*, *cair a ficha*, *deu ruim*), idioms and metaphors, word building, and the grammar that separates B2 from C1.

No build step, no framework, no server. Three files: `index.html`, `data.js` and `app.js`.

## What's inside

| Section | What it does |
|---|---|
| **Hoje** | Daily plan (cards, 15 drills, 1 text, 1 conversation), streak, 60-day heatmap, weak spots, week-by-week roadmap |
| **Cartões** | 282 flashcards with spaced repetition, in 6 decks: *Dar, ficar, rolar & cia* · *Gírias* · *Expressões & metáforas* · *Vocabulário C1 formal* · *Conectores* · *Falsos amigos (espanhol)*. Each card has a register tag (gíria / informal / neutro / formal), a real example and a usage note. Includes audio and an AI button for more examples and nuance |
| **Importar** | Paste a **Language Reactor** export, YouTube subtitles, an article or a word list, and the AI turns the best B2→C1 items into cards. Export everything to Anki as TSV |
| **Gramática** | 134 exercises in 12 topics: future subjunctive, hypotheses, present subjunctive, personal infinitive, perfeito composto, mais-que-perfeito, perfeito × imperfeito, regência, crase, pronoun placement (speech vs. writing), word formation, informal → formal. The AI generates new exercises on demand |
| **Tutor IA** | *Escrever:* 12 writing tasks in the style of CELPE-Bras (formal email, WhatsApp, opinion article…), corrected with an estimated CEFR level, error list, corrected text and a C1 rewrite. *Conversar:* 8 role-plays (boteco in Rio, WhatsApp in São Paulo, job interview, call center, debate, landlord in BH, doctor, free chat) with voice and a correction report at the end |
| **Meus erros** | Every mistake the tutor finds is saved, grouped by type, and turned into exercises until you get it right twice |

## Run it

**Option 1: open the file.** Download the repo and open `index.html` in Chrome or Edge. Everything except the AI works offline.

**Option 2: GitHub Pages (recommended, works on your phone).**
1. Push this folder to a GitHub repository.
2. In the repo, go to **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Open `https://<your-user>.github.io/<repo-name>/`.

## Turn on the AI (GitHub / local version)

The AI features (corrections, conversation, importing, new exercises, explanations) use Claude.

1. Create an API key at [console.anthropic.com](https://console.anthropic.com).
2. In the app, click the gear icon and paste the key into **Anthropic API key**.

The key is stored only in your browser's `localStorage` and is sent only to `api.anthropic.com`. This is fine for a personal app. Don't publish a version with a key built in, and don't use it on a shared computer.

When the app runs as a Claude artifact, it uses Claude directly, so no key is needed and progress syncs to your Claude account.

## Voice

- **Listening:** the speaker buttons use your system's Brazilian Portuguese voice (Web Speech API). On Windows and macOS you may need to install a "Português (Brasil)" voice in the system settings.
- **Speaking:** the microphone button uses speech recognition in Chrome or Edge.

## Using it with Language Reactor

[Language Reactor](https://www.languagereactor.com) is a Chrome extension that adds dual subtitles and a pop-up dictionary to YouTube and Netflix. A good daily loop:

1. Watch a Brazilian YouTube video or Netflix series with Language Reactor and save words and phrases you don't know. Saving and exporting are Pro features.
2. Export your saved items (CSV or Anki format), open the file, copy everything.
3. In **Cartões → Adicionar e importar**, paste it and click **Extrair cartões**.
4. Review them in **Cartões** with the rest of your deck.

A free, open-source alternative for this step is [asbplayer](https://github.com/killergerbah/asbplayer): it works on most streaming sites and lets you copy subtitle lines as you watch.

## Add your own content

All content lives in `data.js`. A card looks like this:

```js
c("dar uma olhada", "to take a look", "Você pode dar uma olhada no meu texto?", "Can you take a look at my text?", "informal", "'Dar uma + -ada' = a quick action.")
```

A fill-in exercise:

```js
d("fut-subj", "Se eu ___ (ter) tempo amanhã, passo aí.", "tiver", "tiveram → tiver.")
```

Card IDs come from the Portuguese text, so editing the `pt` field resets that card's review history.

## Project structure

```
index.html   layout and styles (light and dark themes)
data.js      all decks, exercises, writing tasks and conversation scenarios
app.js       spaced repetition, drills, AI tutor, voice, storage
```

Progress is saved in the browser (`localStorage`). Use **Settings → Copiar backup** to move it between devices.

## Ideas for next steps

- Shadowing mode: play a sentence, record yourself, compare
- Regional decks: carioca, paulista, mineiro, nordestino
- Song and series lessons built from subtitles you paste
- A timed CELPE-Bras simulation

## License

MIT
