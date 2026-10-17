# Wortgarten

A personal German vocabulary garden with German examples, English and Chinese translations, source sentences, learning labels, search, categories, and browser pronunciation.

## Open the app

For offline use, download `Wortgarten.html` and open it in a modern browser. No installation is needed. Pronunciation depends on the browser and installed German voices.

The online version is deployed with GitHub Pages after Pages is enabled for this repository.

New words automatically record their local **Added on** date. You can adjust it in the word editor. Editing and backup transfers preserve the date. Older words without a recorded date show **Unknown** until you enter one.

## Your words and backups

Words added or edited in the app are saved in that browser's local storage. They are not committed to Git, uploaded to GitHub, or synchronized across devices. The local HTML and the online site use separate storage.

To move your words online, open the local app in the browser where you saved them, select **Export backup**, then open the online app and select **Import backup**. Import merges new word/category pairs; it does not overwrite existing cards. Use **Edit** to transfer changes to an existing card, and keep the original backup.

The embedded vocabulary in this repository is published with the website. Keep personal exports and credentials out of Git; common backup files are ignored.

## Edit and build

Editable files:

- `source/words.json`: embedded vocabulary, including grammar, translations, examples, and learning labels.
- `source/app.js`: application logic and interface translations.
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
