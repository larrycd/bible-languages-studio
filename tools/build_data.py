# Bible Languages Studio - data builder (by Larry Dalton)
# Usage: python3 -I build_data.py <src dir> <out dir>
#   src: step/ (STEPBible-Data), lxx/ (QuantForge Swete LXX), bdb/ (unabridged BDB csv)
import sys, os, re, json, csv, unicodedata, glob
from collections import defaultdict, Counter

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
for d in ('text', 'lex', 'conc'): os.makedirs(os.path.join(OUT, d), exist_ok=True)
csv.field_size_limit(10 ** 9)

def dump(path, obj):
    with open(os.path.join(OUT, path), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))

OT = [('Gen','Genesis'),('Exo','Exodus'),('Lev','Leviticus'),('Num','Numbers'),('Deu','Deuteronomy'),('Jos','Joshua'),('Jdg','Judges'),('Rut','Ruth'),('1Sa','1 Samuel'),('2Sa','2 Samuel'),('1Ki','1 Kings'),('2Ki','2 Kings'),('1Ch','1 Chronicles'),('2Ch','2 Chronicles'),('Ezr','Ezra'),('Neh','Nehemiah'),('Est','Esther'),('Job','Job'),('Psa','Psalms'),('Pro','Proverbs'),('Ecc','Ecclesiastes'),('Sng','Song of Songs'),('Isa','Isaiah'),('Jer','Jeremiah'),('Lam','Lamentations'),('Ezk','Ezekiel'),('Dan','Daniel'),('Hos','Hosea'),('Jol','Joel'),('Amo','Amos'),('Oba','Obadiah'),('Jon','Jonah'),('Mic','Micah'),('Nam','Nahum'),('Hab','Habakkuk'),('Zep','Zephaniah'),('Hag','Haggai'),('Zec','Zechariah'),('Mal','Malachi')]
NT = [('Mat','Matthew'),('Mrk','Mark'),('Luk','Luke'),('Jhn','John'),('Act','Acts'),('Rom','Romans'),('1Co','1 Corinthians'),('2Co','2 Corinthians'),('Gal','Galatians'),('Eph','Ephesians'),('Php','Philippians'),('Col','Colossians'),('1Th','1 Thessalonians'),('2Th','2 Thessalonians'),('1Ti','1 Timothy'),('2Ti','2 Timothy'),('Tit','Titus'),('Phm','Philemon'),('Heb','Hebrews'),('Jas','James'),('1Pe','1 Peter'),('2Pe','2 Peter'),('1Jn','1 John'),('2Jn','2 John'),('3Jn','3 John'),('Jud','Jude'),('Rev','Revelation')]
# Swete LXX book -> matching Hebrew-Bible book (for side-by-side reading)
LXXMAP = {'Gen':'Gen','Exod':'Exo','Lev':'Lev','Num':'Num','Deut':'Deu','Josh':'Jos','Judg':'Jdg','Ruth':'Rut','1Kgdms':'1Sa','2Kgdms':'2Sa','3Kgdms':'1Ki','4Kgdms':'2Ki','1Chr':'1Ch','2Chr':'2Ch','2Esd':'Ezr','Esth':'Est','Ps':'Psa','Prov':'Pro','Song':'Sng','Job':'Job','Hos':'Hos','Amos':'Amo','Mic':'Mic','Joel':'Jol','Obad':'Oba','Jonah':'Jon','Nah':'Nam','Hab':'Hab','Zeph':'Zep','Hag':'Hag','Zech':'Zec','Mal':'Mal','Isa':'Isa','Jer':'Jer','Lam':'Lam','Ezek':'Ezk','DanTh':'Dan'}
LXXNAMES = {'1Kgdms':'1 Kingdoms (1 Samuel)','2Kgdms':'2 Kingdoms (2 Samuel)','3Kgdms':'3 Kingdoms (1 Kings)','4Kgdms':'4 Kingdoms (2 Kings)','1Esd':'1 Esdras','2Esd':'2 Esdras (Ezra–Nehemiah)','PssSol':'Psalms of Solomon','EpJer':'Letter of Jeremiah','Sus':'Susanna (Old Greek)','SusTh':'Susanna (Theodotion)','Dan':'Daniel (Old Greek)','DanTh':'Daniel (Theodotion)','Bel':'Bel and the Dragon (Old Greek)','BelTh':'Bel and the Dragon (Theodotion)','Sir':'Sirach','Wis':'Wisdom of Solomon','Odes':'Odes'}

PUNCT = re.compile('[,.;:\u00b7!?\u0387\u037e\u2019\'"\\[\\]()]')
CANT = re.compile('[֑-ֽ֯׀׃׆]')
def noCant(s): return CANT.sub('', s)

books = []
conc = defaultdict(lambda: defaultdict(list))   # corpus -> key -> [ref ints]
forms = {'heb': defaultdict(Counter), 'grk': defaultdict(Counter)}
freq = {'heb': Counter(), 'grk': Counter()}
engl = {'heb': defaultdict(Counter), 'grk': defaultdict(Counter)}

def refint(bi, c, v): return (bi << 16) | (c << 8) | v

# ------------------------------------------------------------------ Hebrew OT (STEPBible TAHOT)
heb_words = defaultdict(lambda: defaultdict(dict))
REF = re.compile(r'^(\w{3})\.(\d+)\.(\d+)(?:\((\d+)\.(\d+)\))?#(\d+)=(\S*)')
for f in sorted(glob.glob(os.path.join(SRC, 'step', 'Translators Amalgamated OT+NT', 'TAHOT*.txt'))):
    for line in open(f, encoding='utf-8-sig'):
        m = REF.match(line)
        if not m: continue
        cols = line.rstrip('\n').split('\t')
        b, c, v = m.group(1), int(m.group(2)), int(m.group(3))
        heb, tr, gloss, strongs, morph = cols[1], cols[2], cols[3], cols[4], cols[5]
        surf = heb.replace('\\', '')
        heb_words[b][c].setdefault(v, []).append([surf, tr, gloss, strongs, morph])

def mainStrong(strongs):
    m = re.search(r'\{(H\d+[A-Za-z]?)\}', strongs)
    return m.group(1) if m else (re.findall(r'H\d+[A-Za-z]?', strongs) or [''])[0]

bi = 0
for code, name in OT:
    chs = heb_words[code]
    if not chs: print('missing OT book', code); continue
    out = {}
    for c in sorted(chs):
        out[c] = {v: chs[c][v] for v in sorted(chs[c])}
        for v, ws in chs[c].items():
            for w in ws:
                k = mainStrong(w[3])
                if k:
                    conc['ot'][k].append(refint(bi, c, v)); freq['heb'][k] += 1
                    segs = w[3].split('\\')[0].split('/'); gs = w[2].split('/')
                    mi = next((i for i, x in enumerate(segs) if '{' in x), 0)
                    g = re.sub(r'<[^>]*>|[\[\]]', '', gs[mi] if mi < len(gs) else w[2]).strip().lower()
                    if g: engl['heb'][g][k] += 1
                forms['heb'][w[3].split('\\')[0] + '|' + w[4]][noCant(w[0])] += 1
    dump('text/ot_%s.json' % code, out)
    books.append({'id': code, 'name': name, 'corpus': 'ot', 'lang': 'heb', 'ch': [max(out[c]) for c in sorted(out)]})
    bi += 1

# ------------------------------------------------------------------ Greek NT (STEPBible TAGNT, SBLGNT words)
nt_words = defaultdict(lambda: defaultdict(dict))
NREF = re.compile(r'^(\w{3})\.(\d+)\.(\d+)#(\d+)=(\S*)')
for f in sorted(glob.glob(os.path.join(SRC, 'step', 'Translators Amalgamated OT+NT', 'TAGNT*.txt'))):
    for line in open(f, encoding='utf-8-sig'):
        m = NREF.match(line)
        if not m: continue
        cols = line.rstrip('\n').split('\t')
        if 'SBL' not in cols[5]: continue
        b, c, v = m.group(1), int(m.group(2)), int(m.group(3))
        gm = re.match(r'(.*?)\s*\(([^)]*)\)\s*$', cols[1])
        surf, tr = (gm.group(1), gm.group(2)) if gm else (cols[1].strip(), '')
        sg = cols[3].split('=')
        strong, morph = sg[0].strip(), (sg[1].strip() if len(sg) > 1 else '')
        lg = cols[4].split('=')
        lemma = lg[0].strip()
        surf = re.sub('[\u2019\u1fbd\u1fbf\'](?=[,.;:\u00b7]?$)', '\u02bc', surf.replace('\u00b6', '').strip())
        nt_words[b][c].setdefault(v, []).append([unicodedata.normalize('NFC', surf), tr, cols[2].strip(), strong, morph, unicodedata.normalize('NFC', lemma)])

grk_lemma_key = {}
keylem = defaultdict(set)
for code, name in NT:
    chs = nt_words[code]
    out = {}
    for c in sorted(chs):
        out[c] = {v: chs[c][v] for v in sorted(chs[c])}
        for v, ws in chs[c].items():
            for w in ws:
                k = re.sub(r'_.*', '', w[3])
                conc['nt'][k].append(refint(bi, c, v)); freq['grk'][k] += 1
                grk_lemma_key.setdefault(w[5], k)
                g = re.sub(r'<[^>]*>|\[.*?\]|[,.;:!?]', '', w[2]).strip().lower()
                if g: engl['grk'][g][k] += 1
                sf = PUNCT.sub('', w[0]); forms['grk'][w[5] + '|' + w[4]][sf if w[5][:1].isupper() else sf.lower()] += 1; keylem[k].add(w[5])
    dump('text/nt_%s.json' % code, out)
    books.append({'id': code, 'name': name, 'corpus': 'nt', 'lang': 'grk', 'ch': [max(out[c]) for c in sorted(out)]})
    bi += 1

# ------------------------------------------------------------------ Greek lexicon (STEPBible TBESG, Abbott-Smith based)
lexg = {}
for line in open(os.path.join(SRC, 'step', 'Lexicons', 'TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt'), encoding='utf-8-sig'):
    cols = line.rstrip('\n').split('\t')
    if len(cols) < 8 or not re.match(r'^G\d', cols[0]): continue
    key = cols[1].split('=')[0].strip()
    lemma = unicodedata.normalize('NFC', cols[3].strip())
    d = cols[7]
    d = re.sub(r"<ref='([^']*)'>([^<]*)</ref>", r'<a data-r="\1">\2</a>', d)
    d = re.sub(r'<(?!/?(b|i|br|a|sup|sub)\b)[^>]*>', '', d, flags=re.I)
    if key not in lexg: lexg[key] = [lemma, cols[4].strip(), cols[5].strip(), cols[6].strip(), d.strip()]
    grk_lemma_key.setdefault(lemma, key)
def stripAcc(s): return ''.join(ch for ch in unicodedata.normalize('NFD', s) if unicodedata.category(ch) != 'Mn').lower()
grk_plain = {}
for lem, k in list(grk_lemma_key.items()): grk_plain.setdefault(stripAcc(lem), k)

# ------------------------------------------------------------------ Septuagint (Swete, QuantForge, Morpheus)
def morpheus2rob(pos, p):
    T = {'P': 'P', 'I': 'I', 'F': 'F', 'A': 'A', 'X': 'R', 'Y': 'L'}; M = {'I': 'I', 'S': 'S', 'O': 'O', 'D': 'M', 'N': 'N', 'P': 'P'}
    if len(p) < 8: return None
    cng = p[4] + p[5] + p[6]
    if pos == 'N-' and p[4] != '-': return 'N-' + cng.replace('-', '')
    if pos == 'A-' and p[4] != '-': return 'A-' + cng.replace('-', '')
    if pos == 'RA' and p[4] != '-': return 'T-' + cng
    if pos == 'V-' and p[1] in T and p[3] in M:
        tvm = T[p[1]] + (p[2] if p[2] != '-' else 'A') + M[p[3]]
        if p[3] == 'N': return 'V-' + tvm
        if p[3] == 'P': return 'V-' + tvm + '-' + cng
        if p[0] in '123': return 'V-' + tvm + '-' + p[0] + p[5]
    return None
LAT_LOWER = str.maketrans('aeikopuvxy', 'αειкορυνχγ'.replace('к', 'κ'))
def cleanGreek(t):
    # OCR noise in the Swete transcription: verse numbers, superscripts, section marks; Latin look-alike letters inside Greek words
    t = re.sub('[0-9\u00b9\u00b2\u00b3\u2070-\u209f\u00a7\u00b6<>]', '', t)
    if re.search('[\u0370-\u03ff\u1f00-\u1fff]', t): t = t.translate(LAT_LOWER)
    t = re.sub('[\u1d2c-\u1d6a\u1d9b-\u1dbf-]', '', t)
    t = re.sub('^[\u2019\u1fbd\u1fbf\'\u02bc]', '\u1fbf', t)
    t = t[:1] + re.sub('[\u2019\u1fbd\u1fbf\'\u02bc]', '\u02bc', t[1:])
    return t.strip()
LAT2GRK = str.maketrans('ABEHIKMNOPTXYZ', 'ΑΒΕΗΙΚΜΝΟΡΤΧΥΖ')
lxxbooks = [l.rstrip('\n').split('\t') for l in open(os.path.join(SRC, 'lxx', 'data', 'books.tsv'), encoding='utf-8')][1:]
# accent-free form -> (form, lemma, pos, parse) learned from the analysed words, to fill in the untagged capitals
learned = defaultdict(Counter)
raw = {}
for code, abbr, name, tlg in lxxbooks:
    rows = []
    for line in open(os.path.join(SRC, 'lxx', 'data', 'morph-morpheus', '%03d-%s.txt' % (int(code), abbr)), encoding='utf-8'):
        p = line.rstrip('\n').split(' ')
        if len(p) < 9: continue
        ref, pos, parse, text, word, norm, lemma, lang, src = p[:9]
        text = cleanGreek(unicodedata.normalize('NFC', text.translate(LAT2GRK))); lemma = unicodedata.normalize('NFC', lemma)
        if not text: continue
        rows.append([ref, pos, parse, text, lemma, src])
        if src == 'morpheus': learned[stripAcc(word)][(lemma, pos, parse)] += 1
    raw[abbr] = (name, rows)
fixed = 0
lxx_lemmas = Counter()
for code, abbr, name, tlg in lxxbooks:
    nm, rows = raw[abbr]
    out = defaultdict(lambda: defaultdict(list))
    for ref, pos, parse, text, lemma, src in rows:
        c, v = int(ref[3:6]), int(ref[6:9])
        if src != 'morpheus':
            key = stripAcc(re.sub(r'[^\w]', '', text.translate(LAT2GRK)))
            if key in learned:
                (lemma, pos, parse), _ = learned[key].most_common(1)[0]; fixed += 1
            else: pos, parse, lemma = 'NP', '--------', lemma if lemma.lower() != lemma else lemma
        if re.fullmatch('[\u02bc\u1fbf\u1fbd]+', text):   # a lone elision mark belongs to the word before it
            if out[c][v]: out[c][v][-1][0] += '\u02bc'
            continue
        k = grk_lemma_key.get(lemma) or grk_plain.get(stripAcc(lemma)) or lemma
        rc = morpheus2rob(pos, parse)
        if rc and src == 'morpheus':
            sf = PUNCT.sub('', text); forms['grk'][lemma + '|' + rc][sf if lemma[:1].isupper() else sf.lower()] += 1; keylem[k].add(lemma)
        out[c][v].append([text, lemma, pos + ' ' + parse, k])
        lxx_lemmas[k] += 1
        conc['lxx'][k].append(refint(bi, c, v))
        rob = None
    o = {c: {v: out[c][v] for v in sorted(out[c])} for c in sorted(out)}
    dump('text/lxx_%s.json' % abbr, o)
    books.append({'id': 'LXX' + abbr, 'name': LXXNAMES.get(abbr, name), 'corpus': 'lxx', 'lang': 'grk', 'ch': [max(o[c]) if o[c] else 0 for c in sorted(o)], 'chn': sorted(o), 'heb': LXXMAP.get(abbr)})
    bi += 1
print('LXX capitals filled from analysed forms:', fixed)

# ------------------------------------------------------------------ Hebrew lexicon: Tyndale glosses (TBESH gloss column only) + full BDB
lexh = {}
for line in open(os.path.join(SRC, 'step', 'Lexicons', 'TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt'), encoding='utf-8-sig'):
    cols = line.rstrip('\n').split('\t')
    if len(cols) < 7 or not re.match(r'^H\d', cols[0]): continue
    key = cols[1].split('=')[0].strip()
    # the definitions column (Abridged BDB, Online Bible) is NOT used: it needs separate permission
    if key not in lexh: lexh[key] = [cols[3].strip(), cols[4].strip(), cols[5].strip(), cols[6].strip()]

BOOKNUM = {}
for i, (c, n) in enumerate(OT): BOOKNUM[i + 1] = c
rows = list(csv.reader(open(os.path.join(SRC, 'bdb', 'unabridged-BDB-Hebrew-lexicon.csv'), encoding='utf-8'), delimiter='\t'))[1:]
def cleanBDB(s):
    s = re.sub(r'<h1>.*?</h1>', '', s, flags=re.S)
    s = re.sub(r'<div class="navigation">.*?</div>', '', s, flags=re.S)
    s = re.sub(r'<ref [^>]*b="(\d+)" cBegin="(\d+)" vBegin="(\d+)"[^>]*>(.*?)</ref>', lambda m: '<a data-r="%s.%s.%s">%s</a>' % (BOOKNUM.get(int(m.group(1)), '?'), m.group(2), m.group(3), m.group(4)), s, flags=re.S)
    s = re.sub(r'<(bdbheb|bdbarc|reflink)>', '<span class="h">', s); s = re.sub(r'</(bdbheb|bdbarc|reflink)>', '</span>', s)
    s = re.sub(r'<grk>', '<span class="g">', s); s = re.sub(r'</grk>', '</span>', s)
    s = re.sub(r'<(highlight|highlightword|transliteration)>', '<i>', s); s = re.sub(r'</(highlight|highlightword|transliteration)>', '</i>', s)
    s = re.sub(r'<placeholder\d+\s*/?>', '', s)
    s = re.sub(r'<(?!/?(b|i|br|a|sup|sub|p|hr|span)\b)[^>]*>', '', s)
    return s.strip()
bdb = {}; bdb_by_strong = defaultdict(list)
for bid, sn, content in rows:
    bdb[bid] = cleanBDB(content)
    for s in re.findall(r'H\d+', sn or ''): bdb_by_strong['H%04d' % int(s[1:])].append(bid)
# chunk BDB into files of ~1 MB
chunk, size, ci, where = {}, 0, 0, {}
for bid in sorted(bdb, key=lambda x: int(x[3:])):
    chunk[bid] = bdb[bid]; size += len(bdb[bid]); where[bid] = ci
    if size > 1200000: dump('lex/bdb_%02d.json' % ci, chunk); chunk, size, ci = {}, 0, ci + 1
if chunk: dump('lex/bdb_%02d.json' % ci, chunk)
dump('lex/bdb_index.json', {'byStrong': bdb_by_strong, 'chunk': where})

# English -> word index (corpus glosses weighted by frequency, plus lexicon glosses)
for k, e in lexh.items():
    for g in re.split(r'[;,/]\s*', re.sub(r'[\[\]()<>]', '', e[3].lower())):
        g = g.strip()
        if g: engl['heb'][g][k] += 3
for k, e in lexg.items():
    for g in re.split(r'[;,/]\s*', re.sub(r'[\[\]()<>]', '', e[3].lower())):
        g = g.strip()
        if g: engl['grk'][g][k] += 3
dump('lex/heb.json', {k: v + [freq['heb'][k]] for k, v in lexh.items()})
dump('lex/grk.json', {k: v + [freq['grk'][k] + lxx_lemmas[k]] for k, v in lexg.items()})
dump('lex/en_heb.json', {g: [k for k, n in c.most_common(6)] for g, c in engl['heb'].items() if len(g) < 40})
dump('lex/en_grk.json', {g: [k for k, n in c.most_common(6)] for g, c in engl['grk'].items() if len(g) < 40})
# Hebrew -> Greek: Abbott-Smith's "in LXX chiefly for ..." notes
heb_index = defaultdict(list)
for k, e in lexh.items(): heb_index[noCant(unicodedata.normalize('NFC', e[0]))].append(k)
links = defaultdict(set)
for gk, e in lexg.items():
    m = re.search(r'\[in LXX[^\]]*\]', e[4])
    if not m: continue
    for hw in re.findall(r'[א-ת][֑-ׇא-ת]*', m.group(0)):
        for hk in heb_index.get(noCant(unicodedata.normalize('NFC', hw)), [])[:2]: links[hk].add(gk)
dump('lex/heb2grk.json', {k: sorted(v) for k, v in links.items()})
print('Hebrew->Greek LXX links', len(links))

# transliteration -> attested word (lets people type Bible words in Latin letters)
def asciiKey(t): return re.sub(r'[^a-z]', '', ''.join(ch for ch in unicodedata.normalize('NFD', t.lower()) if unicodedata.category(ch) != 'Mn'))
trh, trg = defaultdict(Counter), defaultdict(Counter)
for b in heb_words.values():
    for c in b.values():
        for ws in c.values():
            for w in ws:
                k = asciiKey(w[1].replace('sh', 'sh'))
                if k: trh[k][noCant(w[0]).replace('/', '')] += 1
for b in nt_words.values():
    for c in b.values():
        for ws in c.values():
            for w in ws:
                k = asciiKey(w[1])
                if k: trg[k][re.sub(r'[,.;:·!?\u0387\u037e’\'"\[\]()]', '', w[0])] += 1
dump('lex/tr_heb.json', {k: c.most_common(1)[0][0] for k, c in trh.items()})
dump('lex/tr_grk.json', {k: c.most_common(1)[0][0] for k, c in trg.items()})
# forms for drafting
def best(c): return c.most_common(1)[0][0]
def ordered(fm): return {k: best(c) for k, c in sorted(fm.items(), key=lambda kv: -sum(kv[1].values()))}
dump('lex/forms_heb.json', ordered(forms['heb']))
dump('lex/forms_grk.json', ordered(forms['grk']))
dump('lex/grk_keylemma.json', {k: sorted(v) for k, v in keylem.items()})

# concordance (refs packed base-36)
def b36(n):
    s = ''
    while True:
        n, r = divmod(n, 36); s = '0123456789abcdefghijklmnopqrstuvwxyz'[r] + s
        if not n: return s
for corp in ('ot', 'nt', 'lxx'):
    dump('conc/%s.json' % corp, {k: ' '.join(b36(r) for r in sorted(set(v))) for k, v in conc[corp].items()})
dump('books.json', books)
print('books', len(books), 'OT words', sum(len(w) for b in heb_words.values() for c in b.values() for w in c.values()),
      'NT words', sum(len(w) for b in nt_words.values() for c in b.values() for w in c.values()), 'lexh', len(lexh), 'lexg', len(lexg), 'bdb', len(bdb))
