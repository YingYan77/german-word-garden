# Wortgarten — offline German vocabulary

1. Extract this ZIP into a folder on your computer.
2. Double-click Wortgarten.html to open it in Chrome, Edge, Firefox or Safari.
   No installation, internet connection or account is needed for the vocabulary notebook.
3. Use “Add a word” to add words, meanings, categories and examples.
   Use the language selector for English, German or Chinese.

TRANSFER WORDS FROM THE ONLINE WEBSITE
The HTML includes all 21 cards added in our conversation, through die Gegenwart.
Words you added or edited yourself in the online website are stored in your browser,
not in these downloaded files. To transfer them:
- Open the online website in the browser where you used it.
- Click Export backup and keep the JSON file.
- Open Wortgarten.html and click Import backup to merge additional words.
Import skips existing word/category pairs; it does not replace their meanings or examples.
If you edited one of the original 21 cards online, copy those edits with the offline
Edit button as well. Keep the original export as a complete record.

IMPORTANT ABOUT SAVING
The Add/Edit form saves to this browser's local storage, not into Wortgarten.html.
Use Export backup regularly, especially before moving computers or clearing browser data.
Keep the HTML at the same path and use the same browser/profile. Local file storage
behavior varies between browsers, and moving/renaming the file can make saved data
unavailable. If that happens, import your backup. If storage is blocked, use another
browser or serve this folder with a local web server (see below).
A downloaded copy is independent of the online website; there is no automatic sync.
Pronunciation uses your browser's speech engine. Offline German speech depends on
having a German voice installed on your computer.

OPTIONAL: USE A LOCAL WEB SERVER (requires Python 3)
Open a terminal in this folder and run:
  python3 -m http.server 8000 --bind 127.0.0.1
On Windows, use: py -m http.server 8000 --bind 127.0.0.1
Open http://localhost:8000/Wortgarten.html and keep that address/port unchanged.
Keep the terminal running while using the app. Ctrl+C stops the server.
File-open and localhost versions have different browser storage; transfer via backup.

EMBED A NEW WORD IN THE HTML ITSELF
Use the included skills/add-german-word/SKILL.md with an AI assistant that can edit
local files, or create a card JSON with its documented schema and run:
  python3 skills/add-german-word/scripts/add_word.py Wortgarten.html new-word.json
The helper creates a backup before modifying the HTML. Refresh the file to load the
new card. It works without extra Python packages.
The skill is included as a portable folder; it has not been installed in your account.
You may ask a local coding assistant: “Use the add-german-word skill in this folder
to add [WORD] from [SENTENCE] to Wortgarten.html, including DE/EN/中文 examples.”

## Build from source

The editable code is in source/:
- index.template.html: page structure and CSS styling.
- app.js: translations, rendering, forms, searching, browser persistence and backups.
- words.json: all 21 initial vocabulary cards in UTF-8 JSON.
- build.py: combines the three files into a standalone Wortgarten.html.

From the extracted Wortgarten-Offline folder, run:
  python3 source/build.py
On Windows:
  py source/build.py
No npm packages or build dependencies are needed. Open or refresh Wortgarten.html.
For a separate output file:
  python3 source/build.py --output My-Wortgarten.html

When the source/ folder is present, add new cards to source/words.json and rebuild,
so subsequent builds retain them. The skill's add_word.py helper instead modifies
the generated HTML directly; copy any cards embedded that way back to words.json
before rebuilding. Browser-only additions are separate; retain exported backups.
For existing card IDs, edits to embedded data do not overwrite browser-saved edits.
The build script backs up changed HTML to Wortgarten.html.build.bak, and refuses
to overwrite an existing backup. Preserve or rename that backup before another build.
