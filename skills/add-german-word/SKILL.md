---
name: add-german-word
description: Add a German vocabulary word or phrase and source sentence to the user's offline Wortgarten HTML, with German examples, English and Chinese translations, grammar and word category. Use when asked to add another word to the downloaded Wortgarten vocabulary notebook.
---

# Add a German word to offline Wortgarten

Locate the user-provided `Wortgarten.html` or ask for the local file if unavailable. Work locally; do not publish a hosted Site unless requested. Expect a standalone HTML containing `<script type="application/json" id="vocabulary-data">`.

1. Read the embedded vocabulary JSON. Check for the same lemma and category before adding. Preserve all existing cards, user edits, styles and interface translations.
2. Normalize the requested form to its dictionary entry. Include a noun's article and plural, a verb's principal forms and reflexive/separable structure, or an adjective's base form. Explain the inflected form from the user's sentence.
3. Supply English and simplified Chinese meanings, two or more German examples covering relevant common senses, and matching translations. Retain the supplied source sentence separately; correct clear typos and explain the correction. Do not invent missing source text or infer that a quoted historical description is current travel information.
4. Create a UTF-8 JSON object with the schema below, using a unique, stable ASCII ID. Use `other` for phrases. Preserve Swiss ss spelling and mention ß alternatives when useful.
5. Run the bundled helper with literal paths:
   `python3 <skill-directory>/scripts/add_word.py <path-to-Wortgarten.html> <path-to-new-card.json>`
   The helper makes an `.html.bak` backup and rejects duplicates. If that backup already exists, preserve it under another name before retrying. Never overwrite an existing backup silently.
6. Parse the resulting embedded JSON, verify the new card and unchanged old entries, and check JavaScript syntax with Node when available. For meaningful changes, run a browser or DOM-stub check if supported. Test merge behavior with existing browser data.
7. Return the updated HTML or local path and a concise DE/EN/中文 explanation. Tell the user to refresh the same file. Do not claim installation, cloud synchronization, or access to their browser data.

## Card schema

Required strings: `id`, `word`, `type`, `en`, `cn`, `de`.
Optional strings: `pron`, `exen`, `excn`, `sourceDe`, `sourceEn`, `sourceCn`, `learningLabel`, `addedOn`.
Use `addedOn` as a calendar date (`YYYY-MM-DD`); the helper defaults new cards to the current local date. Preserve it when editing.
Category: `adj`, `noun`, `verb`, `adv`, `prep`, `other`.
Use `\n` within the example strings to pair multiple examples in the same order.

```json
{
  "id": "lernen-verb",
  "word": "lernen",
  "type": "verb",
  "pron": "lernen → lernt → lernte → hat gelernt",
  "en": "To learn; to study.",
  "cn": "学习；学会。",
  "de": "Ich lerne Deutsch.\nWir lernen jeden Tag neue Wörter.",
  "exen": "I am learning German.\nWe learn new words every day.",
  "excn": "我在学德语。\n我们每天学习新单词。",
  "sourceDe": "Ich lerne Deutsch.",
  "sourceEn": "I am learning German.",
  "sourceCn": "我在学德语。"
}
```

## Persistence behavior

Embedded cards are starter data. Browser edits are in localStorage, not written back to the HTML. The offline app merges newly embedded IDs once, preserves existing cards, and remembers deletions. Editing the JSON of an existing ID does not replace a browser-saved version. For that case, use the app's Edit button or deliberately migrate only the intended fields. Do not reset localStorage or invent a new ID merely to bypass edits/deletions.

Export a backup before substantial changes. JSON import merges new word/category pairs and does not overwrite existing ones. Explain this when the user expects import to replace a card. An export reflects browser data and is the authoritative backup for their later additions.
