// node gen.js '<json stats>' -> info.html   (Bible Languages Studio infographic)
const fs=require('fs'),path=require('path');const ST=JSON.parse(process.argv[2]||'{}');
require('../test/hb.js')().then(B=>{
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const strip=s=>s.replace(/<metadata>[\s\S]*?<\/metadata>/,'');
const T=f=>JSON.parse(fs.readFileSync(path.join(__dirname,'../src/app/data/text',f)));
const gen=T('ot_Gen.json')['1']['1'],jhn=T('nt_Jhn.json')['1']['1'],lxx=T('lxx_Gen.json')['1']['1'];
const heb=B.joinWords(gen.map(w=>w[0].replace(/\//g,''))),grk=jhn.map(w=>w[0]).join(' '),sept=lxx.map(w=>w[0]).join(' ');
const R=(t,o)=>strip(B.render(t,Object.assign({width:700,size:40},o)));
const th=B.translate('In the beginning God created the heavens and the earth.','heb'),tg=B.translate('In the beginning God created the heavens and the earth.','grk');
const nh=['Larry','Dalton'].map(w=>B.hebrewBySound(w).text).join(' '),ng=['Larry','Dalton'].map(w=>B.greekBySound(w).text).join(' ');
const w0=gen[0];
const html=`<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:BLHebrew;src:url(../src/app/fonts/BLHebrew.ttf)}@font-face{font-family:BLGreek;src:url(../src/app/fonts/BLGreek.ttf)}@font-face{font-family:BLPaleo;src:url(../src/app/fonts/BLPaleo.ttf)}
body{margin:0;overflow:hidden;background:#120f0b;color:#f1e7d6;font:20px/1.45 "Segoe UI","DejaVu Sans",sans-serif;width:1600px}.w{padding:52px 60px}
h1{font:700 64px Georgia,"DejaVu Serif",serif;margin:0}.sub{color:#c4b096;font-size:24px;margin-top:6px}.by{color:#d6b37a;font-weight:700}
h2{color:#d6b37a;text-transform:uppercase;letter-spacing:3px;font-size:22px;margin:38px 0 16px;border-bottom:2px solid #3a2f24;padding-bottom:8px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px}.g2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.card{background:#1b1611;border:1px solid #3a2f24;border-radius:14px;padding:18px}.card h3{margin:0 0 6px;font-size:23px}.k{color:#d6b37a;font-size:15px;text-transform:uppercase;letter-spacing:2px}
.card svg{max-width:100%;height:auto;display:block;border-radius:8px;margin-top:8px}.note{color:#c4b096;font-size:17px;margin-top:10px}
.mono{font:19px Consolas,"DejaVu Sans Mono",monospace;color:#e8d8bd}.heb{font-family:BLHebrew;direction:rtl}.grk{font-family:BLGreek}.phn{font-family:BLPaleo;direction:rtl}
.big{font-size:34px}.num{font:700 40px Georgia,serif;color:#ecd3a3}.stat{text-align:center}.stat div{color:#c4b096;font-size:16px}
table{border-collapse:collapse;width:100%;font-size:19px}td{padding:9px 12px;border-bottom:1px solid #3a2f24;vertical-align:top}td.n{font-weight:700;color:#fff;white-space:nowrap}
.foot{color:#8f8170;font-size:15px;margin-top:34px;border-top:1px solid #3a2f24;padding-top:14px}
</style></head><body><div class="w">
<div style="display:flex;justify-content:space-between;align-items:flex-end"><div><h1>Bible Languages Studio</h1><div class="sub">Biblical Hebrew &middot; Paleo-Hebrew &middot; Koine Greek &mdash; read, write and study &middot; <span class="by">by Larry Dalton</span></div></div>
<div class="heb big" style="color:#ecd3a3">בְּרֵאשִׁית <span class="grk">Ἐν ἀρχῇ</span></div></div>
<h2>One verse, three scripts</h2>
<div class="g3">
<div class="card"><div class="k">Hebrew with vowels and cantillation</div><h3>Genesis 1:1 &middot; Leningrad Codex</h3>${R(heb,{script:'heb',theme:'parchment',size:36,width:640})}</div>
<div class="card"><div class="k">Paleo-Hebrew</div><h3>The same consonants, old script</h3>${R(B.toPaleo(heb,true),{script:'phn',theme:'stone',size:34,width:640})}<div class="note">The alphabet of the Siloam inscription, before the square letters.</div></div>
<div class="card"><div class="k">Koine Greek</div><h3>Genesis 1:1 in the Septuagint</h3>${R(sept,{script:'grk',theme:'scroll',size:32,width:640})}<div class="note">and John 1:1:</div>${R(grk,{script:'grk',theme:'night',size:28,width:640})}</div>
</div>
<h2>The whole Bible, word by word</h2>
<div class="g2">
<div class="card"><div class="k">Click any word</div>
<div class="heb big" style="margin:6px 0">${esc(B.stripCantillation(w0[0].replace(/\//g,'')))}</div>
<table><tr><td class="n">Transliteration</td><td class="mono">${esc(B.translitHebrew(w0[0].replace(/\//g,'')))}</td></tr>
<tr><td class="n">Grammar</td><td>${esc(B.decodeHebrewMorph(w0[4]))}</td></tr>
<tr><td class="n">Dictionary</td><td><span class="heb" style="font-size:24px">רֵאשִׁית</span> re.shit &mdash; first, beginning (H7225G)</td></tr>
<tr><td class="n">Also</td><td>Brown-Driver-Briggs entry, every occurrence in the OT, Septuagint and NT, the Greek words the Septuagint uses for it</td></tr></table></div>
<div class="card"><div class="k">Texts and dictionaries</div>
<div class="g3" style="margin-top:8px"><div class="stat"><span class="num">${ST.otWords||'305,648'}</span><div>Hebrew &amp; Aramaic words, 39 OT books</div></div><div class="stat"><span class="num">${ST.lxxWords||'564,842'}</span><div>Septuagint words, ${ST.lxxBooks||55} books</div></div><div class="stat"><span class="num">${ST.ntWords||'136,944'}</span><div>Greek NT words, 27 books</div></div></div>
<div class="g2" style="margin-top:14px"><div class="stat"><span class="num">${ST.lexh||'11,682'}</span><div>Hebrew &amp; Aramaic entries (Brown-Driver-Briggs)</div></div><div class="stat"><span class="num">${ST.lexg||'11,035'}</span><div>Greek entries (Abbott-Smith)</div></div></div>
<div class="note">Interlinear view, Septuagint beside the Hebrew, concordance across all three texts.</div></div>
</div>
<h2>Write and translate</h2>
<div class="g3">
<div class="card"><div class="k">English &rarr; Biblical Hebrew</div><h3>"In the beginning God created the heavens and the earth."</h3><div class="heb" style="font-size:30px">${esc(th.text)}</div><div class="note">Verb first, object marker אֶת, words in the forms the Hebrew Bible uses.</div></div>
<div class="card"><div class="k">English &rarr; Koine Greek</div><h3>The same sentence</h3><div class="grk" style="font-size:25px">${esc(tg.text)}</div><div class="note">Cases, articles and verb endings taken from the Greek Bible.</div></div>
<div class="card"><div class="k">Names by sound</div><h3>Larry Dalton</h3><div class="heb" style="font-size:32px">${esc(nh)}</div><div class="grk" style="font-size:28px">${esc(ng)}</div><div class="phn" style="font-size:30px">${esc(B.toPaleo(nh))}</div><div class="note">Bible names keep their Bible spelling: Michael &rarr; מִיכָאֵל.</div></div>
</div>
<h2>Reading it back (measured)</h2>
<table>
<tr><td class="n">SVG, exact</td><td>${ST.svg||'?'}</td></tr>
<tr><td class="n">PNG and JPEG</td><td>${ST.img||'?'}</td></tr>
<tr><td class="n">Not Bible scripts</td><td>${ST.neg||'?'}</td></tr>
</table>
<div class="foot">Hebrew OT (Westminster Leningrad Codex, OSHB morphology), Greek NT (SBLGNT) and Greek lexicon: STEPBible.org / Tyndale House, CC BY 4.0. Septuagint: Swete, via the QuantForge LXX project, CC BY-SA 4.0. Brown-Driver-Briggs: public domain. Fonts: Noto Serif Hebrew, Noto Serif, Noto Sans Phoenician (OFL). Shaping: HarfBuzz (MIT). Translations are rule-based drafts.</div>
</div></body></html>`;
fs.writeFileSync(process.argv[3]||path.join(__dirname,'info.html'),html);});
