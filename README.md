# Wortgarten

A personal German vocabulary garden with German examples, English and Chinese translations, source sentences, learning labels, search, categories, and browser pronunciation.

## Open the app

For offline use, download `Wortgarten.html` and open it in a modern browser. No installation is needed. Pronunciation depends on the browser and installed German voices.

The online version is deployed with GitHub Pages after Pages is enabled for this repository.

New words automatically record their local **Added on** date. You can adjust it in the word editor. Editing and backup transfers preserve the date. All words present at the start of date tracking use **17 October 2026**, including existing browser-saved words (applied once). Later additions retain their own dates. Open **Filters** below the search box to combine an inclusive date range with a learning-source label, category, and text search. Source options update automatically as you add labels.

## Self-check and learning progress

Open **Self-check** to practise the words selected by your notebook search, date, source, and category filters. Choose German → English/Chinese, English/Chinese → German, verb tenses, or a mixture, with 10, 20, or all available questions. Difficult words are prioritized; **Review difficult words** restricts practice to words that need review.

Type an answer, select **Check answer**, then compare it with the reference and save it as **Correct** or **Needs review**. Matching ignores case, terminal punctuation, extra spaces, Swiss ss/ß differences, and optional English “to”. This is reference matching, not AI semantic grading: you decide whether an unlisted synonym is valid. **I don’t know** must be recorded as a miss. Each question can be recorded only once.

The initial vocabulary includes short English/Chinese meanings and all seven verbs’ complete third-person singular **Präsens**, **Präteritum**, and **Perfekt** forms (including reflexive and separable parts). New words can supply these under **Edit → Self-check answers**. Separate alternatives with `|`. Missing verb forms are never guessed.

**Learning progress** shows overall and per-word correct/total accuracy, plus separate scores for both translation directions and each verb tense. “Mastered” requires at least 3 attempts per translation direction and 2 per verb tense; every required skill must have at least 80% accuracy and its latest 2 answers correct. A skill with at least 2 attempts becomes **Needs review** below 60% or after 2 consecutive misses. These are practice indicators rather than a guarantee of long-term recall.

Progress stays in this browser. **Export backup** includes word metadata and practice history; importing merges attempts by unique ID, so importing the same backup repeatedly does not inflate accuracy. Existing word-only backups remain compatible. Ordinary edits and renaming a word preserve its practice identity. Practice is recorded only after you confirm a result; unanswered questions do not count.

Run the dependency-free practice checks with `node --test tests/practice.test.cjs` (Node.js 18+).

## Your words and backups

Words added or edited in the app are saved in that browser's local storage. They are not committed to Git, uploaded to GitHub, or synchronized across devices. The local HTML and the online site use separate storage.

To move your words online, open the local app in the browser where you saved them, select **Export backup**, then open the online app and select **Import backup**. Import merges new word/category pairs; it does not overwrite existing cards. Use **Edit** to transfer changes to an existing card, and keep the original backup.

The embedded vocabulary in this repository is published with the website. Keep personal exports and credentials out of Git; common backup files are ignored.

## Edit and build

Editable files:

- `source/words.json`: embedded vocabulary, including grammar, translations, examples, and learning labels.
- `source/app.js`: notebook logic, filters, interface translations, and backups.
- `source/quiz.js`: self-check sessions, grading, practice history, and learning progress.
- `source/index.template.html`: HTML and styles.
- `source/build.py`: dependency-free Python build script.

After editing the source, rebuild the offline app:

```sh
python3 source/build.py
```

The build script preserves changed output in `Wortgarten.html.build.bak`. Preserve or rename an existing backup before rebuilding again. New embedded card IDs merge into existing browser data; existing browser edits and deletions are retained.

To preview the online build:

```sh
python3 source/build.py --output _site/index.html
python3 -m http.server 8000 --bind 127.0.0.1 --directory _site
```

Open http://localhost:8000. This preview also has separate browser storage.

## Deploy with GitHub Pages

1. Push this repository to GitHub with `main` as the default branch.
2. Open **Settings → Pages** and select **GitHub Actions** as the source.
3. Open **Actions → Build and publish Wortgarten → Run workflow** if the initial push happened before Pages was enabled.

Every subsequent push to `main` builds `source/` into `_site/index.html` and publishes only that generated website. The deployment never uploads local backups or the whole repository as the website artifact. GitHub Free requires a public repository for Pages.

For future vocabulary updates, edit `source/words.json`, rebuild the offline HTML, and commit and push both. The included `skills/add-german-word/` helper can also embed a card directly into the offline HTML; synchronize such additions back to `source/words.json` before publishing.
