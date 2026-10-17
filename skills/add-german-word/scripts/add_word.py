#!/usr/bin/env python3
"""Embed a vocabulary card in a standalone Wortgarten HTML file."""
import argparse, json, re, shutil
from pathlib import Path
from datetime import date
PATTERN = re.compile(r'(<script type="application/json" id="vocabulary-data">\s*)(.*?)(\s*</script>)', re.S)
TYPES = {'adj','noun','verb','adv','prep','other'}
def add_word(html_path, card_path):
    path, card_path = Path(html_path), Path(card_path)
    card = json.loads(card_path.read_text(encoding='utf-8'))
    for key in ('id','word','type','en','cn','de'):
        if not isinstance(card.get(key), str) or not card[key].strip():
            raise ValueError(f'Required nonempty string: {key}')
    if card['type'] not in TYPES:
        raise ValueError('type must be adj, noun, verb, adv, prep or other')
    fields = {'id','word','type','pron','en','cn','de','exen','excn','sourceDe','sourceEn','sourceCn','learningLabel','addedOn'}
    if set(card)-fields:
        raise ValueError(f'Unknown fields: {set(card)-fields}')
    if any(not isinstance(value,str) for value in card.values()):
        raise ValueError('All field values must be strings')
    if card.get('addedOn'):
        if date.fromisoformat(card['addedOn']).isoformat() != card['addedOn']:
            raise ValueError('addedOn must be YYYY-MM-DD')
    else:
        card['addedOn'] = date.today().isoformat()
    text = path.read_text(encoding='utf-8')
    match = PATTERN.search(text)
    if not match:
        raise ValueError('Standalone vocabulary-data block not found; use the offline Wortgarten HTML')
    words = json.loads(match[2])
    if any(w['id']==card['id'] or (w['word']==card['word'] and w['type']==card['type']) for w in words):
        raise ValueError('Card already exists; keep its ID and edit it deliberately instead')
    words.append(card)
    data = json.dumps(words,ensure_ascii=False,indent=2).replace('<',r'\u003c')
    updated = text[:match.start(2)] + data + text[match.end(2):]
    backup = path.with_suffix(path.suffix+'.bak')
    if backup.exists():
        raise ValueError(f'Backup already exists: {backup}; rename it before updating')
    shutil.copy2(path,backup)
    temporary = path.with_suffix(path.suffix+'.tmp')
    temporary.write_text(updated,encoding='utf-8')
    temporary.replace(path)
    print(f'Added {card["word"]}; {len(words)} embedded cards. Backup: {backup}')
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('html');p.add_argument('card_json');a=p.parse_args()
    try:add_word(a.html,a.card_json)
    except (ValueError,OSError) as e:p.exit(1,f'Error: {e}\n')
