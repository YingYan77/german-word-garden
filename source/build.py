#!/usr/bin/env python3
"""Build the offline Wortgarten HTML from editable source. Requires Python 3 only."""
import argparse,json
from pathlib import Path

def build(output=None):
    source=Path(__file__).resolve().parent
    target=Path(output).resolve() if output else source.parent/'Wortgarten.html'
    words=json.loads((source/'words.json').read_text(encoding='utf-8'))
    if not isinstance(words,list):
        raise ValueError('words.json must contain a JSON array')
    seen=set()
    for w in words:
        for key in ('id','word','type','en','cn','de'):
            if not isinstance(w.get(key),str) or not w[key].strip():
                raise ValueError(f'Missing nonempty string: {key}')
        if w['id'] in seen:
            raise ValueError(f'Duplicate card ID: {w["id"]}')
        seen.add(w['id'])
        if w['type'] not in {'noun','adj','verb','adv','prep','other'}:
            raise ValueError(f'Invalid category: {w["type"]}')
    template=(source/'index.template.html').read_text(encoding='utf-8')
    if template.count('<!-- WORTGARTEN_SCRIPTS -->')!=1:
        raise ValueError('Template must contain one WORTGARTEN_SCRIPTS marker')
    data=json.dumps(words,ensure_ascii=False,indent=2).replace('<',r'\u003c')
    js=(source/'app.js').read_text(encoding='utf-8')
    if '</script' in js.lower():
        raise ValueError('Escape literal closing script tags in app.js before embedding')
    scripts='<script type="application/json" id="vocabulary-data">\n'+data+'\n</script>\n<script>\n'+js+'\n</script>'
    result=template.replace('<!-- WORTGARTEN_SCRIPTS -->',scripts)
    if target.exists() and target.read_text(encoding='utf-8')!=result:
        backup=target.with_suffix(target.suffix+'.build.bak')
        if backup.exists():
            raise ValueError(f'Preserve or rename existing backup before rebuilding: {backup}')
        backup.write_bytes(target.read_bytes())
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(result,encoding='utf-8')
    print(f'Built {target} with {len(words)} embedded cards.')

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--output',help='Optional output file; default: ../Wortgarten.html')
    args=p.parse_args()
    try:build(args.output)
    except (ValueError,OSError) as e:p.exit(1,f'Error: {e}')
