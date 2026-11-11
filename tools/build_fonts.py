# Bible Languages Studio - fonts and glyph tables (by Larry Dalton)
# Usage: python3 -I build_fonts.py <vendor dir> <app dir>
# Subsets Noto Serif to Latin + Greek, copies Noto Serif Hebrew and Noto Sans Phoenician, and writes
# data/glyphs.json: for every glyph the text it stands for (from cmap and GSUB), its advance and whether it is a mark.
import sys, os, json, shutil, unicodedata
from fontTools.ttLib import TTFont
from fontTools import subset

V, APP = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(APP, 'fonts'), exist_ok=True)
grk_out = os.path.join(APP, 'fonts', 'BLGreek.ttf')
opts = subset.Options(); opts.layout_features = ['*']; opts.name_IDs = ['*']; opts.notdef_outline = True; opts.glyph_names = True
ranges = list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + list(range(0x2B0, 0x370)) + list(range(0x370, 0x400)) + list(range(0x1F00, 0x2000)) + list(range(0x2000, 0x2070)) + [0x1E00 + i for i in range(0x100)]
f = TTFont(os.path.join(V, 'NotoSerif-Regular.ttf'))
s = subset.Subsetter(opts); s.populate(unicodes=ranges); s.subset(f); f.save(grk_out)
shutil.copy(os.path.join(V, 'NotoSerifHebrew-Regular.ttf'), os.path.join(APP, 'fonts', 'BLHebrew.ttf'))
shutil.copy(os.path.join(V, 'NotoSansPhoenician-Regular.ttf'), os.path.join(APP, 'fonts', 'BLPaleo.ttf'))

def table(path):
    t = TTFont(path); order = t.getGlyphOrder(); gid = {g: i for i, g in enumerate(order)}
    txt = {}
    pref = (lambda cp: 0 if (0x370 <= cp < 0x400 or 0x1F00 <= cp < 0x2000 or 0x590 <= cp < 0x600 or 0x10900 <= cp < 0x10920) else 1)
    for cp, g in sorted(t.getBestCmap().items(), key=lambda kv: (pref(kv[0]), kv[0])): txt.setdefault(g, chr(cp))
    # follow GSUB single/ligature/alternate substitutions until nothing new is learned
    if 'GSUB' in t:
        lookups = t['GSUB'].table.LookupList.Lookup
        for _ in range(4):
            for lk in lookups:
                for st in lk.SubTable:
                    if lk.LookupType == 7: st = st.ExtSubTable
                    tp = getattr(st, 'LookupType', lk.LookupType)
                    if tp == 1:
                        for a, b in st.mapping.items():
                            if a in txt and b not in txt: txt[b] = txt[a]
                    elif tp == 2:
                        for a, seq in st.mapping.items():
                            if a in txt:
                                for j, b in enumerate(seq):
                                    if b not in txt: txt[b] = txt[a] if j == 0 else ''
                    elif tp == 3:
                        for a, alts in st.alternates.items():
                            for b in alts:
                                if a in txt and b not in txt: txt[b] = txt[a]
                    elif tp == 4:
                        for first, ligs in st.ligatures.items():
                            for lg in ligs:
                                comps = [first] + list(lg.Component)
                                if all(c in txt for c in comps) and lg.LigGlyph not in txt: txt[lg.LigGlyph] = ''.join(txt[c] for c in comps)
    for g in order:   # alternates named like 'uni05B4.alt'
        if g not in txt and '.' in g and g.split('.')[0] in txt: txt[g] = txt[g.split('.')[0]]
    hmtx = t['hmtx'].metrics
    gdef = t['GDEF'].table.GlyphClassDef.classDefs if 'GDEF' in t and t['GDEF'].table.GlyphClassDef else {}
    out = {}
    for g, s in txt.items():
        mark = gdef.get(g) == 3 or all(unicodedata.category(ch) == 'Mn' for ch in s)
        out[gid[g]] = [unicodedata.normalize('NFC', s) if not mark else s, hmtx[g][0], 1 if mark else 0]
    return {'upm': t['head'].unitsPerEm, 'asc': t['hhea'].ascent, 'desc': t['hhea'].descent, 'glyphs': out}

data = {k: table(os.path.join(APP, 'fonts', fn)) for k, fn in (('heb', 'BLHebrew.ttf'), ('grk', 'BLGreek.ttf'), ('phn', 'BLPaleo.ttf'))}
with open(os.path.join(APP, 'data', 'glyphs.json'), 'w', encoding='utf-8') as fo: json.dump(data, fo, ensure_ascii=False, separators=(',', ':'))
for k, d in data.items(): print(k, len(d['glyphs']), 'glyphs with text')
print('Greek font', os.path.getsize(grk_out), 'bytes')
