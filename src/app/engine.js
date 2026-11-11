/* Bible Languages Studio engine 1.0.0 - by Larry Dalton.
   Biblical Hebrew (pointed and Paleo-Hebrew) and Koine Greek. Shared by the browser studio and the Node tests.
   No network access. Text shaping uses HarfBuzz (harfbuzzjs, MIT), passed in with setShaper(). */
(function (root) {
'use strict';
var B = { version: '1.0.0' };

/* ============================================================ Hebrew letters */
var HEB_LET = 'אבגדהוזחטיכךלמםנןסעפףצץקרשת';
var FINAL = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' }, UNFINAL = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
var PALEO = { 'א': '𐤀', 'ב': '𐤁', 'ג': '𐤂', 'ד': '𐤃', 'ה': '𐤄', 'ו': '𐤅', 'ז': '𐤆', 'ח': '𐤇', 'ט': '𐤈', 'י': '𐤉', 'כ': '𐤊', 'ך': '𐤊', 'ל': '𐤋', 'מ': '𐤌', 'ם': '𐤌', 'נ': '𐤍', 'ן': '𐤍', 'ס': '𐤎', 'ע': '𐤏', 'פ': '𐤐', 'ף': '𐤐', 'צ': '𐤑', 'ץ': '𐤑', 'ק': '𐤒', 'ר': '𐤓', 'ש': '𐤔', 'ת': '𐤕' };
var PALEO_REV = {}; Object.keys(PALEO).forEach(function (k) { if (!UNFINAL[k]) PALEO_REV[PALEO[k]] = k; });
var PHN_SEP = '𐤟';
function isHeb(ch) { return ch >= '֐' && ch <= '׿'; }
function isGrk(ch) { return (ch >= 'Ͱ' && ch <= 'Ͽ') || (ch >= 'ἀ' && ch <= '῿'); }
B.stripCantillation = function (s) { return s.replace(/[\u0591-\u05AF\u05BD\u05C6]/g, ''); };
B.stripPoints = function (s) { return B.stripCantillation(s).replace(/[ְ-ׇּֿׁׂׅׄ]/g, ''); };
/* consonants in the old (Paleo-Hebrew) alphabet, as Unicode Phoenician; words divided by the word-separator dot */
B.toPaleo = function (s, sep) {
  var out = '', t = B.stripPoints(s).replace(/[־]/g, ' ');
  Array.from(t).forEach(function (ch) { out += PALEO[ch] || (/\s/.test(ch) ? ch : ''); });
  out = out.replace(/\s+/g, ' ').trim();
  return sep ? out.replace(/ /g, ' ' + PHN_SEP + ' ') : out;
};
B.fromPaleo = function (s) {
  var w = Array.from(s.replace(/𐤟/g, ' ')).map(function (ch) { return PALEO_REV[ch] || (ch === ' ' ? ' ' : ''); }).join('');
  return w.split(' ').map(finalForms).join(' ').replace(/\s+/g, ' ').trim();
};
function finalForms(w) { // last consonant in final form, others in medial form
  var a = Array.from(w), last = -1;
  a.forEach(function (ch, i) { if (UNFINAL[ch]) a[i] = UNFINAL[ch]; if (HEB_LET.indexOf(ch) >= 0) last = i; });
  if (last >= 0 && FINAL[a[last]]) a[last] = FINAL[a[last]];
  return a.join('');
}
B.finalForms = finalForms;
/* join Bible words into a line: no space after maqaf */
B.joinWords = function (ws) { return ws.join(' ').replace(/\u05BE\s+/g, '\u05BE'); };

/* ------------------------------------------------ pointed Hebrew -> simple transliteration (SBL general style) */
var PT = { SHVA: 'ְ', HE: 'ֱ', HA: 'ֲ', HO: 'ֳ', HIRIQ: 'ִ', TSERE: 'ֵ', SEGOL: 'ֶ', PATAH: 'ַ', QAMATS: 'ָ', HOLAM: 'ֹ', HOLAMV: 'ֺ', QUBUTS: 'ֻ', DAGESH: 'ּ', SHIN: 'ׁ', SIN: 'ׂ', QQ: 'ׇ' };
var VOWEL = { 'ֱ': 'e', 'ֲ': 'a', 'ֳ': 'o', 'ִ': 'i', 'ֵ': 'e', 'ֶ': 'e', 'ַ': 'a', 'ָ': 'a', 'ֹ': 'o', 'ֺ': 'o', 'ֻ': 'u', 'ׇ': 'o' };
var CONS = { 'א': "'", 'ב': ['b', 'v'], 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': ['k', 'kh'], 'ך': ['k', 'kh'], 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': "'", 'פ': ['p', 'f'], 'ף': ['p', 'f'], 'צ': 'ts', 'ץ': 'ts', 'ק': 'q', 'ר': 'r', 'ת': 't' };
function clusters(word) { // [{c: consonant, m: marks string}]
  var out = [];
  Array.from(B.stripCantillation(word.normalize('NFD'))).forEach(function (ch) {
    if (HEB_LET.indexOf(ch) >= 0) out.push({ c: ch, m: '' });
    else if (out.length && /[ְ-ׇ]/.test(ch)) out[out.length - 1].m += ch;
  });
  return out;
}
B.translitHebrew = function (text) {
  return text.split(/(\s+|־)/).map(function (word) {
    if (/^\s+$/.test(word)) return word; if (word === '־') return '-';
    var cl = clusters(word), s = '', prevVowel = false, prevLong = false;
    for (var i = 0; i < cl.length; i++) {
      var c = cl[i].c, m = cl[i].m, dag = m.indexOf(PT.DAGESH) >= 0, last = i === cl.length - 1;
      var next = cl[i + 1];
      // vav as vowel letter
      if (c === 'ו' && (m === PT.HOLAM || m === PT.HOLAMV) && i > 0) { s += 'o'; prevVowel = true; prevLong = true; continue; }
      if (c === 'ו' && m === PT.DAGESH && i > 0 && !/[ְ-ֻ]/.test(cl[i - 1].m)) { s += 'u'; prevVowel = true; prevLong = true; continue; }
      if (c === 'ו' && m === PT.DAGESH && i === 0) { s += 'u'; prevVowel = true; continue; }
      // yod / he / aleph as vowel letters (no vowel of their own)
      if (c === 'י' && !/[ְ-ּ]/.test(m) && i > 0 && /[ִֵֶ]/.test(cl[i - 1].m)) { s = s.replace(/[ie]$/, function (v) { return v === 'i' ? 'i' : 'e'; }); prevLong = true; continue; }
      if (c === 'ה' && last && !dag && !/[ְ-ֻ]/.test(m) && i > 0) { continue; }
      if (c === 'א' && !/[ְ-ֻ]/.test(m) && i > 0) { continue; }
      var t = CONS[c] || ''; if (c === 'ש') t = m.indexOf(PT.SIN) >= 0 ? 's' : 'sh';
      if (Array.isArray(t)) t = dag || !prevVowel ? t[0] : t[1];
      if (dag && prevVowel && i > 0 && c !== 'ה') t = t.length === 2 && t !== 'sh' && t !== 'ch' && t !== 'ts' ? t : t + t; // dagesh forte doubles
      if (dag && prevVowel && i > 0 && t.length > 1 && (t === 'shsh' || t === 'tsts' || t === 'chch')) t = t.slice(0, t.length / 2) + t.slice(0, t.length / 2);
      if (c === 'א' || c === 'ע') t = i === 0 ? '' : "'";
      s += t;
      var v = '';
      Object.keys(VOWEL).forEach(function (k) { if (m.indexOf(k) >= 0) v = VOWEL[k]; });
      if (c === 'ח' && last && m.indexOf(PT.PATAH) >= 0) { s = s.slice(0, -2) + 'ach'; prevVowel = true; continue; } // furtive patah
      if (!v && m.indexOf(PT.SHVA) >= 0) { // vocal shva: word start, under a doubled letter, or after another shva
        var vocal = i === 0 || (dag && i > 0) || (i > 0 && cl[i - 1].m.indexOf(PT.SHVA) >= 0 && !last);
        v = vocal && !last ? 'e' : '';
      }
      s += v; prevVowel = !!v; prevLong = false;
    }
    return s;
  }).join('');
};

/* ------------------------------------------------ Latin letters -> pointed Hebrew (simple romanisation) */
var ROM_C = [['sh', 'שׁ'], ['ch', 'ח'], ['kh', 'כ'], ['ts', 'צ'], ['tz', 'צ'], ['ph', 'פ'], ['th', 'ת'], ['b', 'בּ'], ['v', 'ב'], ['g', 'ג'], ['d', 'ד'], ['h', 'ה'], ['w', 'ו'], ['z', 'ז'], ['ḥ', 'ח'], ['ṭ', 'ט'], ['y', 'י'], ['k', 'כּ'], ['l', 'ל'], ['m', 'מ'], ['n', 'נ'], ['s', 'ס'], ['ś', 'שׂ'], ['š', 'שׁ'], ['ṣ', 'צ'], ['p', 'פּ'], ['f', 'פ'], ['q', 'ק'], ['r', 'ר'], ['t', 'ת'], ['j', 'ג׳'], ["'", 'א'], ['ʾ', 'א'], ['ʿ', 'ע'], ['`', 'ע'], ['c', 'ק'], ['x', 'כּס']];
var ROM_V = { a: 'ַ', 'ā': 'ָ', e: 'ֶ', 'ē': 'ֵ', i: 'ִ', 'ī': 'ִ', o: 'ֹ', 'ō': 'ֹ', u: 'ֻ', 'ū': 'ֻ' };
B.romanToHebrew = function (word) {
  var w = word.toLowerCase(), out = [], i = 0, needCarrier = true;
  while (i < w.length) {
    var hit = null;
    for (var k = 0; k < ROM_C.length; k++) if (w.substr(i, ROM_C[k][0].length) === ROM_C[k][0]) { hit = ROM_C[k]; break; }
    if (hit) { out.push({ c: hit[1], v: '' }); i += hit[0].length; needCarrier = false; continue; }
    var ch = w[i];
    if (ROM_V[ch] !== undefined) {
      if (!out.length || out[out.length - 1].v) out.push({ c: 'א', v: '' });   // vowel needs a consonant to sit on
      var cur = out[out.length - 1];
      if (ch === 'o' || ch === 'ō') { if (out.length > 1 || cur.c !== 'א') { cur.v = ''; out.push({ c: 'וֹ', v: '-' }); } else cur.v = 'ֹ'; }
      else if (ch === 'u' || ch === 'ū') { if (out.length > 1 || cur.c !== 'א') { out.push({ c: 'וּ', v: '-' }); cur.v = cur.v || ''; } else cur.v = 'ֻ'; }
      else if ((ch === 'i' || ch === 'ī') && i === w.length - 1) { cur.v = 'ִ'; out.push({ c: 'י', v: '-' }); }
      else if ((ch === 'a' || ch === 'e') && i === w.length - 1 && out.length > 1) { cur.v = ch === 'a' ? 'ָ' : 'ֶ'; out.push({ c: 'ה', v: '-' }); }
      else cur.v = ROM_V[ch];
      i++; continue;
    }
    i++;
  }
  var s = '';
  out.forEach(function (x, j) {
    var c = x.c;
    if (j === out.length - 1 && FINAL[c[0]]) c = FINAL[c[0]] + c.slice(1).replace('ּ', '');
    var v = x.v === '-' ? '' : x.v;
    if (!v && j < out.length - 1 && out[j + 1].v !== '-' && j > 0) v = 'ְ'; // closed syllable -> shva
    if (!v && j === 0 && out.length > 1 && out[1].v !== '-') v = 'ְ';
    if (FINAL[c[0]] === undefined && UNFINAL[c[0]] && j === out.length - 1 && c.length === 1) v = v === 'ְ' ? '' : v;
    s += c + v;
  });
  return s.normalize('NFC');
};

/* ============================================================ Greek */
var BETA = { a: 'α', b: 'β', g: 'γ', d: 'δ', e: 'ε', z: 'ζ', h: 'η', q: 'θ', i: 'ι', k: 'κ', l: 'λ', m: 'μ', n: 'ν', c: 'ξ', o: 'ο', p: 'π', r: 'ρ', s: 'σ', t: 'τ', u: 'υ', f: 'φ', x: 'χ', y: 'ψ', w: 'ω', v: 'ϝ' };
var BETA_D = { ')': '̓', '(': '̔', '/': '́', '\\': '̀', '=': '͂', '+': '̈', '|': 'ͅ' };
/* Beta Code (TLG/Perseus convention, upper or lower case) -> polytonic Greek */
B.betaToGreek = function (s) {
  var out = '', i = 0, pendingCap = false, capMarks = '';
  while (i < s.length) {
    var ch = s[i], lo = ch.toLowerCase();
    if (ch === '*') { pendingCap = true; capMarks = ''; i++; while (i < s.length && BETA_D[s[i]] !== undefined) { capMarks += BETA_D[s[i]]; i++; } continue; }
    if (BETA[lo]) {
      var g = BETA[lo]; if (pendingCap) { g = g.toUpperCase(); pendingCap = false; }
      var marks = capMarks; capMarks = ''; i++;
      while (i < s.length && BETA_D[s[i]] !== undefined) { marks += BETA_D[s[i]]; i++; }
      out += g + marks; continue;
    }
    if (ch === ':') out += '·'; else if (ch === ';') out += ';'; else out += ch;
    i++;
  }
  out = out.replace(/σ(?=[\s.,·;:!?)\]'’]|$)/g, 'ς').replace(/σ́?(?=[\s.,·;:!?)\]]|$)/g, function (m) { return m.replace('σ', 'ς'); });
  return out.normalize('NFC');
};
B.stripAccents = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC'); };
var GTR = { 'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'ē', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'ph', 'χ': 'ch', 'ψ': 'ps', 'ω': 'ō', 'ϝ': 'w' };
/* polytonic Greek -> SBL transliteration */
B.translitGreek = function (text) {
  return text.split(/(\s+)/).map(function (word) {
    if (/^\s*$/.test(word)) return word;
    var d = word.normalize('NFD'), out = '', cap = false, rough = false, chars = [];
    Array.from(d).forEach(function (ch) {
      if (/[̀-ͯ]/.test(ch)) { if (chars.length) chars[chars.length - 1].m += ch; return; }
      chars.push({ c: ch, m: '' });
    });
    for (var i = 0; i < chars.length; i++) {
      var c = chars[i].c, lo = c.toLowerCase(), m = chars[i].m, nxt = chars[i + 1] ? chars[i + 1].c.toLowerCase() : '';
      if (!GTR[lo]) { out += c; continue; }
      var t = GTR[lo];
      if (lo === 'γ' && /[γκξχ]/.test(nxt)) t = 'n';
      if (lo === 'υ' && i > 0 && /[αεηο]/.test(chars[i - 1].c.toLowerCase())) t = 'u';
      if (lo === 'υ' && /[ι]/.test(nxt)) t = 'u';
      if (lo === 'ρ' && (i === 0 || m.indexOf('̔') >= 0)) t = 'rh';
      if (m.indexOf('̔') >= 0 && lo !== 'ρ') rough = true;
      if (m.indexOf('ͅ') >= 0) t += 'i';
      if (c !== lo && !out) cap = true;
      out += t;
    }
    if (rough) out = 'h' + out;
    if (cap) out = out.charAt(0).toUpperCase() + out.slice(1);
    return out;
  }).join('');
};
B.finalSigma = function (s) { return s.replace(/σ(?=$|[^Ͱ-Ͽἀ-῿̀-ͯ])/g, 'ς'); };

/* ============================================================ data loading */
var D = { keyLemma: null, trHeb: null, trGrk: null, enHeb: null, enGrk: null, lexHeb: null, lexGrk: null, formsHeb: null, formsGrk: null, cmu: null, formsHebBy: null, formsGrkBy: null };
B.load = function (name, obj) {
  D[name] = obj;
  if (name === 'formsHeb') { D.formsHebBy = {}; Object.keys(obj).forEach(function (k) { var st = k.split('|')[0], m = /\{(H\d+[A-Za-z]?)\}/.exec(st); var main = m ? m[1] : st; (D.formsHebBy[main] = D.formsHebBy[main] || []).push(k); }); }
  if (name === 'formsGrk') { D.formsGrkBy = {}; Object.keys(obj).forEach(function (k) { var l = k.split('|')[0]; (D.formsGrkBy[l] = D.formsGrkBy[l] || []).push(k); }); }
  if (name === 'cmu' && typeof obj === 'string') { var m = {}; obj.split('\n').forEach(function (l) { var t = l.indexOf('\t'); if (t > 0) m[l.slice(0, t)] = l.slice(t + 1); }); D.cmu = m; }
  return true;
};
B.data = D;
function asciiKey(t) { return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, ''); }

/* ============================================================ English words and names by sound */
var AH = { AA: 'a', AE: 'a', AH: 'a', AO: 'o', AW: 'au', AY: 'ai', EH: 'e', ER: 'er', EY: 'ei', IH: 'i', IY: 'i', OW: 'o', OY: 'oi', UH: 'u', UW: 'u' };
function phonesOf(word) {
  var w = word.toLowerCase().replace(/[^a-z']/g, '');
  if (D.cmu && D.cmu[w]) return { src: 'pronunciation', ph: D.cmu[w].split(' ') };
  return { src: 'spelling rules', ph: spellPhones(w) };
}
function spellPhones(w) { // rough letter-to-sound rules for words the dictionary does not know
  var out = [], i = 0, R = [['tion', ['SH', 'AH0', 'N']], ['ph', ['F']], ['sh', ['SH']], ['ch', ['CH']], ['th', ['TH']], ['ck', ['K']], ['qu', ['K', 'W']], ['ee', ['IY1']], ['oo', ['UW1']], ['ou', ['AW1']], ['ai', ['EY1']], ['ay', ['EY1']], ['ea', ['IY1']], ['oa', ['OW1']], ['a', ['AE1']], ['e', ['EH1']], ['i', ['IH1']], ['o', ['AA1']], ['u', ['AH1']], ['y', ['IY0']], ['b', ['B']], ['c', ['K']], ['d', ['D']], ['f', ['F']], ['g', ['G']], ['h', ['HH']], ['j', ['JH']], ['k', ['K']], ['l', ['L']], ['m', ['M']], ['n', ['N']], ['p', ['P']], ['r', ['R']], ['s', ['S']], ['t', ['T']], ['v', ['V']], ['w', ['W']], ['x', ['K', 'S']], ['z', ['Z']]];
  while (i < w.length) {
    var hit = R.find(function (r) { return w.substr(i, r[0].length) === r[0]; });
    if (!hit) { i++; continue; }
    if (hit[0] === 'e' && i === w.length - 1 && out.length) { i++; continue; } // silent final e
    out = out.concat(hit[1]); i += hit[0].length;
  }
  return out;
}
var HC = { B: 'בּ', CH: 'צ׳', D: 'ד', DH: 'ד', F: 'פ', G: 'ג', HH: 'ה', JH: 'ג׳', K: 'ק', L: 'ל', M: 'מ', N: 'נ', NG: 'נג', P: 'פּ', R: 'ר', S: 'ס', SH: 'שׁ', T: 'ט', TH: 'ת', V: 'ב', W: 'ו', Y: 'י', Z: 'ז', ZH: 'ז׳' };
var HV = { AA: 'ָ', AE: 'ַ', AH: 'ַ', AO: 'וֹ', AW: 'ַוּ', AY: 'ַי', EH: 'ֶ', ER: 'ֶר', EY: 'ֵי', IH: 'ִ', IY: 'ִי', OW: 'וֹ', OY: 'וֹי', UH: 'וּ', UW: 'וּ' };
/* An English word or name written in pointed Hebrew letters by its sound */
B.hebrewBySound = function (word) {
  var p = phonesOf(word), units = [];
  p.ph.forEach(function (x) { var b = x.replace(/\d/, ''); if (HC[b]) units.push({ c: HC[b] }); else if (HV[b]) { if (!units.length || units[units.length - 1].v !== undefined) units.push({ c: 'א' }); units[units.length - 1].v = HV[b]; } });
  var s = '';
  units.forEach(function (u, i) {
    var c = u.c, last = i === units.length - 1;
    if (last && FINAL[c[0]]) c = FINAL[c[0]] + c.slice(1).replace('ּ', '');
    var v = u.v;
    if (v === undefined) v = !last ? 'ְ' : '';
    if (last && (v === 'ָ' || v === 'ַ')) v = 'ָה';
    if (/^[ְ-ֻ]/.test(v) || v === '') s += c + v; else s += c + v;
  });
  // a vowel letter (vav/yod) may already carry the vowel: drop the empty carrier shva before it
  s = s.replace(/ְ(?=וֹ|וּ)/g, '');
  return { text: s.normalize('NFC'), source: p.src };
};
var GC = { B: 'β', CH: 'τσ', D: 'δ', DH: 'δ', F: 'φ', G: 'γ', HH: '', JH: 'τζ', K: 'κ', L: 'λ', M: 'μ', N: 'ν', NG: 'γγ', P: 'π', R: 'ρ', S: 'σ', SH: 'σ', T: 'τ', TH: 'θ', V: 'β', W: 'ου', Y: 'ι', Z: 'ζ', ZH: 'ζ' };
var GV = { AA: 'α', AE: 'α', AH: 'α', AO: 'ο', AW: 'αυ', AY: 'αι', EH: 'ε', ER: 'ερ', EY: 'ει', IH: 'ι', IY: 'ι', OW: 'ω', OY: 'οι', UH: 'ου', UW: 'ου' };
/* An English word or name written in Greek letters by its sound, with breathing and accent */
B.greekBySound = function (word) {
  var p = phonesOf(word), s = '', rough = p.ph.length && p.ph[0] === 'HH', stressAt = -1;
  p.ph.forEach(function (x) {
    var b = x.replace(/\d/, '');
    if (GV[b]) { if (/1/.test(x) && stressAt < 0) stressAt = s.length; s += GV[b]; }
    else s += GC[b] || '';
  });
  if (!s) return { text: '', source: p.src };
  if (stressAt < 0) stressAt = s.search(/[αεηιουω]/);
  // accent on the stressed vowel (second vowel of a diphthong), breathing on an initial vowel
  var a = Array.from(s), vi = stressAt;
  if (a[vi + 1] && /[ιυ]/.test(a[vi + 1]) && /[αεο]/.test(a[vi])) vi++;
  if (a[vi]) a[vi] += '́';
  if (/[αεηιουω]/.test(a[0][0])) { var bi = /[αεο]/.test(a[0][0]) && a[1] && /^[ιυ]/.test(a[1]) ? 1 : 0; a[bi] = a[bi][0] + (rough ? '̔' : '̓') + a[bi].slice(1); }
  var t = B.finalSigma(a.join('')).normalize('NFC');
  return { text: t.charAt(0).toUpperCase() + t.slice(1), source: p.src };
};

/* ============================================================ typed input -> script */
/* Hebrew input: Hebrew letters as typed; Latin letters are looked up among Bible words first, then romanised */
B.hebrewFromInput = function (text) {
  var words = [];
  text.replace(/[\r\n]+/g, ' ').split(/\s+/).filter(Boolean).forEach(function (tok) {
    if (Array.from(tok).some(isHeb)) { words.push({ src: tok, text: tok, how: 'as typed' }); return; }
    if (Array.from(tok).some(function (c) { return c >= '\u{10900}' && c <= '\u{1091F}'; })) { words.push({ src: tok, text: B.fromPaleo(tok), how: 'from Paleo-Hebrew letters' }); return; }
    var k = asciiKey(tok);
    if (D.trHeb && D.trHeb[k]) { words.push({ src: tok, text: D.trHeb[k], how: 'Bible word with this transliteration' }); return; }
    words.push({ src: tok, text: B.romanToHebrew(tok), how: 'romanised letter by letter' });
  });
  return words;
};
B.greekFromInput = function (text) {
  var words = [];
  text.replace(/[\r\n]+/g, ' ').split(/\s+/).filter(Boolean).forEach(function (tok) {
    if (Array.from(tok).some(isGrk)) { words.push({ src: tok, text: tok.normalize('NFC'), how: 'as typed' }); return; }
    if (/[()\/\\=|*+]/.test(tok)) { words.push({ src: tok, text: B.betaToGreek(tok), how: 'Beta Code' }); return; }
    var k = asciiKey(tok);
    if (D.trGrk && D.trGrk[k]) { words.push({ src: tok, text: D.trGrk[k], how: 'Bible word with this transliteration' }); return; }
    words.push({ src: tok, text: B.finalSigma(B.betaToGreek(tok.toLowerCase().replace(/ph/g, 'f').replace(/th/g, 'q').replace(/ch/g, 'x').replace(/ps/g, 'y').replace(/ē/g, 'h').replace(/ō/g, 'w'))), how: 'letter by letter (no accents)' });
  });
  return words;
};

/* ============================================================ morphology codes in plain English */
var HSTEM = { q: 'Qal', N: 'Niphal', p: 'Piel', P: 'Pual', h: 'Hiphil', H: 'Hophal', t: 'Hithpael', o: 'Polel', O: 'Polal', r: 'Hithpolel', m: 'Poel', M: 'Poal', k: 'Palel', K: 'Pulal', Q: 'Qal passive', l: 'Pilpel', L: 'Polpal', f: 'Hithpalpel', D: 'Nithpael', j: 'Pealal', i: 'Pilel', u: 'Hothpaal', c: 'Tiphil', v: 'Hishtaphel', w: 'Nithpalel', y: 'Nithpoel', z: 'Hithpoel' };
var HASTEM = { q: 'Peal', Q: 'Peil', u: 'Hithpeel', p: 'Pael', P: 'Ithpaal', M: 'Hithpaal', a: 'Aphel', h: 'Haphel', s: 'Saphel', e: 'Shaphel', H: 'Hophal', i: 'Ithpeel', t: 'Hishtaphel', v: 'Ishtaphel', w: 'Hithaphel', o: 'Polel', z: 'Ithpoel', r: 'Hithpolel', f: 'Hithpalpel', b: 'Hephal', c: 'Tiphel', m: 'Poel', l: 'Palpel', L: 'Ithpalpel', O: 'Ithpolel', G: 'Ittaphal' };
var HCONJ = { p: 'perfect', q: 'sequential perfect', i: 'imperfect', w: 'sequential imperfect', h: 'cohortative', j: 'jussive', v: 'imperative', r: 'participle', s: 'passive participle', a: 'infinitive absolute', c: 'infinitive construct' };
var HP = { '1': '1st', '2': '2nd', '3': '3rd' }, HG = { m: 'masc.', f: 'fem.', b: 'both genders', c: 'common' }, HN = { s: 'sing.', p: 'plural', d: 'dual' }, HS = { a: 'absolute', c: 'construct', d: 'determined' };
function hebPart(p, aram) {
  if (!p) return '';
  var t = p[0], r = p.slice(1);
  switch (t) {
    case 'V': { var st = (aram ? HASTEM : HSTEM)[r[0]] || r[0], cj = HCONJ[r[1]] || r[1], rest = r.slice(2), pn = '';
      if (/[123]/.test(rest[0])) pn = HP[rest[0]] + ' ' + (HG[rest[1]] || '') + ' ' + (HN[rest[2]] || '');
      else if (rest) pn = (HG[rest[0]] || '') + ' ' + (HN[rest[1]] || '') + ' ' + (HS[rest[2]] || '');
      return ('verb, ' + st + ' ' + cj + (pn.trim() ? ', ' + pn : '')).replace(/\s+/g, ' ').trim(); }
    case 'N': { var k = { c: 'noun', g: 'gentilic noun', t: 'title', p: 'proper name' }[r[0]] || 'noun'; if (r[0] === 'p') return 'proper name' + ({ m: ' (person, male)', f: ' (person, female)', l: ' (place)', t: ' (title)' }[r[1]] || '');
      return (k + ', ' + (HG[r[1]] || '') + ' ' + (HN[r[2]] || '') + ' ' + (HS[r[3]] || '')).replace(/\s+/g, ' ').trim(); }
    case 'A': return ('adjective' + ({ c: '', o: ' (ordinal)', g: ' (gentilic)', a: ' (cardinal number)' }[r[0]] || '') + ', ' + (HG[r[1]] || '') + ' ' + (HN[r[2]] || '') + ' ' + (HS[r[3]] || '')).replace(/\s+/g, ' ').trim();
    case 'P': return (({ p: 'personal pronoun', d: 'demonstrative pronoun', f: 'indefinite pronoun', i: 'interrogative pronoun', r: 'relative pronoun' }[r[0]] || 'pronoun') + (r[1] ? ', ' + (HP[r[1]] || '') + ' ' + (HG[r[2]] || '') + ' ' + (HN[r[3]] || '') : '')).replace(/\s+/g, ' ').trim();
    case 'R': return r === 'd' ? 'preposition + article' : 'preposition';
    case 'C': return 'conjunction';
    case 'D': return 'adverb';
    case 'T': return ({ d: 'definite article', o: 'object marker', a: 'affirmation', e: 'exhortation', i: 'interrogative', j: 'interjection', m: 'demonstrative', n: 'negative', r: 'relative' }[r[0]] || 'particle');
    case 'S': return r[0] === 'p' ? 'suffix: ' + ((HP[r[1]] || '') + ' ' + (HG[r[2]] || '') + ' ' + (HN[r[3]] || '')).trim() : r[0] === 'd' ? 'directional ending' : r[0] === 'h' ? 'paragogic he' : r[0] === 'n' ? 'paragogic nun' : 'suffix';
    default: return p;
  }
}
/* STEPBible/OSHB Hebrew code, e.g. "HR/Ncfsa" or "HVqp3ms" */
B.decodeHebrewMorph = function (code) {
  if (!code) return '';
  var aram = code[0] === 'A';
  return code.slice(1).split('/').map(function (p) { return hebPart(p, aram); }).filter(Boolean).join(' + ') + (aram ? ' (Aramaic)' : '');
};
var GCASE = { N: 'nominative', G: 'genitive', D: 'dative', A: 'accusative', V: 'vocative' }, GNUM = { S: 'sing.', P: 'plural' }, GGEN = { M: 'masc.', F: 'fem.', N: 'neut.' };
var GTENSE = { P: 'present', I: 'imperfect', F: 'future', A: 'aorist', R: 'perfect', L: 'pluperfect', '2': '2nd', X: 'perfect', Y: 'pluperfect' }, GVOICE = { A: 'active', M: 'middle', P: 'passive', E: 'middle/passive', D: 'middle deponent', O: 'passive deponent', N: 'middle/passive deponent', Q: 'impersonal active', X: 'no voice' }, GMOOD = { I: 'indicative', S: 'subjunctive', O: 'optative', M: 'imperative', D: 'imperative', N: 'infinitive', P: 'participle', R: 'imperative participle' };
/* Robinson code (NT), e.g. "V-AAI-3S", "N-ASM", "T-NSM" */
B.decodeGreekMorph = function (code) {
  if (!code) return '';
  var p = code.split('-'), t = p[0];
  var POS = { N: 'noun', A: 'adjective', T: 'article', V: 'verb', P: 'personal pronoun', R: 'relative pronoun', C: 'reciprocal pronoun', D: 'demonstrative pronoun', K: 'correlative pronoun', I: 'interrogative pronoun', X: 'indefinite pronoun', Q: 'correlative or interrogative pronoun', F: 'reflexive pronoun', S: 'possessive pronoun', ADV: 'adverb', CONJ: 'conjunction', COND: 'conditional', PRT: 'particle', PREP: 'preposition', INJ: 'interjection', ARAM: 'Aramaic word', HEB: 'Hebrew word', 'N-PRI': 'indeclinable proper noun', 'A-NUI': 'indeclinable number', 'N-LI': 'indeclinable letter', 'N-OI': 'indeclinable noun' };
  if (t === 'V') {
    var tvm = p[1] || '', m = /^(2?[PIFARLXY])([AMPEDONQX])([ISOMDNPR])$/.exec(tvm) || /^(2?[PIFARL])([A-Z])([A-Z])/.exec(tvm);
    var s = 'verb';
    if (m) s += ', ' + (m[1][0] === '2' ? '2nd ' + GTENSE[m[1][1]] : GTENSE[m[1]]) + ' ' + (GVOICE[m[2]] || '') + ' ' + (GMOOD[m[3]] || '');
    var rest = p[2] || '';
    if (/^[123]/.test(rest)) s += ', ' + HP[rest[0]] + ' ' + (GNUM[rest[1]] || '');
    else if (rest) s += ', ' + (GCASE[rest[0]] || '') + ' ' + (GNUM[rest[1]] || '') + ' ' + (GGEN[rest[2]] || '');
    return s.replace(/\s+/g, ' ').trim();
  }
  if (POS[code]) return POS[code];
  var s2 = POS[t] || t, cng = p[1] || '';
  if (/^[123]/.test(cng)) { s2 += ', ' + HP[cng[0]] + ' person'; cng = cng.slice(1); }
  if (cng && GCASE[cng[0]]) s2 += ', ' + GCASE[cng[0]] + ' ' + (GNUM[cng[1]] || '') + ' ' + (GGEN[cng[2]] || '');
  if (p[2] === 'C') s2 += ' (comparative)'; if (p[2] === 'S') s2 += ' (superlative)';
  return s2.replace(/\s+/g, ' ').trim();
};
/* Morpheus code (Septuagint), e.g. "V- 3AAI-S--" or "N- ----NSM-" */
B.decodeLxxMorph = function (code) {
  if (!code) return '';
  var pp = code.split(' '), pos = pp[0], c = pp[1] || '--------';
  var POS = { 'N-': 'noun', 'NP': 'proper name', 'A-': 'adjective', 'V-': 'verb', 'RA': 'article', 'RP': 'personal pronoun', 'RD': 'demonstrative pronoun', 'RR': 'relative pronoun', 'RI': 'interrogative/indefinite pronoun', 'RX': 'pronoun', 'C-': 'conjunction', 'P-': 'preposition', 'D-': 'adverb', 'I-': 'interjection', 'X-': 'particle', 'M-': 'number' };
  var s = POS[pos] || pos.replace('-', '');
  var per = c[0], ten = c[1], voi = c[2], moo = c[3], cas = c[4], num = c[5], gen = c[6], deg = c[7];
  var T = { P: 'present', I: 'imperfect', F: 'future', A: 'aorist', X: 'perfect', Y: 'pluperfect' }, V = { A: 'active', M: 'middle', P: 'passive', E: 'middle/passive' }, M = { I: 'indicative', S: 'subjunctive', O: 'optative', D: 'imperative', N: 'infinitive', P: 'participle' };
  var bits = [];
  if (T[ten]) bits.push((T[ten] + ' ' + (V[voi] || '') + ' ' + (M[moo] || '')).trim());
  if (/[123]/.test(per)) bits.push(HP[per] + ' ' + ({ S: 'sing.', P: 'plural', D: 'dual' }[num] || ''));
  else if (GCASE[cas]) bits.push(GCASE[cas] + ' ' + ({ S: 'sing.', P: 'plural', D: 'dual' }[num] || '') + ' ' + (GGEN[gen] || ''));
  if (deg === 'C') bits.push('comparative'); if (deg === 'S') bits.push('superlative');
  return (s + (bits.length ? ', ' + bits.join(', ') : '')).replace(/\s+/g, ' ').trim();
};

/* ============================================================ English -> Biblical Hebrew / Koine Greek drafts */
var IRR = { am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', saw: 'see', seen: 'see', went: 'go', gone: 'go', gave: 'give', given: 'give', made: 'make', came: 'come', ate: 'eat', knew: 'know', known: 'know', spoke: 'speak', said: 'say', heard: 'hear', took: 'take', taken: 'take', built: 'build', wrote: 'write', written: 'write', sent: 'send', brought: 'bring', found: 'find', told: 'tell', kept: 'keep', left: 'leave', led: 'lead', fell: 'fall', rose: 'rise', sat: 'sit', stood: 'stand', slew: 'slay', killed: 'kill', loved: 'love', created: 'create', blessed: 'bless', men: 'man', women: 'woman', children: 'child', sons: 'son', feet: 'foot', people: 'people', gods: 'god', kings: 'king', lives: 'life', has: 'have', had: 'have', did: 'do', does: 'do', began: 'begin', became: 'become', ran: 'run', drank: 'drink', sang: 'sing', thought: 'think', taught: 'teach', bought: 'buy', sold: 'sell', died: 'die', dwelt: 'dwell', believed: 'believe', forgave: 'forgive', judged: 'judge', reigned: 'reign', saved: 'save', called: 'call', answered: 'answer' };
function lemmas(w) {
  var out = [w]; if (IRR[w]) out.unshift(IRR[w]);
  if (/ies$/.test(w)) out.push(w.slice(0, -3) + 'y'); if (/es$/.test(w)) out.push(w.slice(0, -2)); if (/s$/.test(w)) out.push(w.slice(0, -1));
  if (/ied$/.test(w)) out.push(w.slice(0, -3) + 'y');
  if (/ed$/.test(w)) { out.push(w.slice(0, -2)); out.push(w.slice(0, -1)); if (/(.)\1ed$/.test(w)) out.push(w.slice(0, -3)); }
  if (/ing$/.test(w)) { out.push(w.slice(0, -3)); out.push(w.slice(0, -3) + 'e'); }
  return out;
}
var PRON = { i: '1cs', me: '1cs', you: '2ms', he: '3ms', him: '3ms', she: '3fs', her: '3fs', it: '3ms', we: '1cp', us: '1cp', they: '3mp', them: '3mp' };
var POSS = { my: '1cs', your: '2ms', his: '3ms', her: '3fs', its: '3ms', our: '1cp', their: '3mp' };
var DETS = { the: 1, a: 1, an: 1 };
var PREPS = { in: 'in', into: 'into', on: 'on', upon: 'on', to: 'to', unto: 'to', for: 'for', from: 'from', with: 'with', over: 'over', under: 'under', before: 'before', after: 'after', by: 'by', out: 'from', through: 'through' };
var STOPV = { the: 1, a: 1, an: 1, and: 1, of: 1, not: 1, no: 1 };
/* English word -> dictionary keys: lang 'heb'|'grk', pos 'v' (verb) | 'n' | 'adj' | '' */
var SYN = { heb: { jesus: 'H3442G', christ: 'H4899', messiah: 'H4899', anointed: 'H4899', spirit: 'H7307G', holy: 'H6944', beginning: 'H7225G' }, grk: { messiah: 'G5547', anointed: 'G5547' } };
function lookupEn(word, lang, pos, cap) {
  var lexx = lang === 'heb' ? D.lexHeb : D.lexGrk, wl = word.toLowerCase();
  if (lexx && lang === 'heb' && cap && wl === 'lord') return { key: 'H3068G', e: lexx.H3068G, lemma: 'lord', plural: false };
  if (lexx && (pos === 'n' || !pos) && SYN[lang][wl] && lexx[SYN[lang][wl]]) return { key: SYN[lang][wl], e: lexx[SYN[lang][wl]], lemma: wl, plural: false };
  var idx = lang === 'heb' ? D.enHeb : D.enGrk, lex = lang === 'heb' ? D.lexHeb : D.lexGrk;
  if (!idx || !lex) return null;
  var ls = lemmas(word.toLowerCase());
  for (var i = 0; i < ls.length; i++) {
    var cands = [];
    if (pos === 'v') cands = (idx['to ' + ls[i]] || []).concat(idx[ls[i]] || []);
    else if (pos === 'adj') cands = (idx[ls[i]] || []).concat(idx['to be ' + ls[i]] || []);
    else cands = idx[ls[i]] || [];
    var ptc = null;
    var fq = function (k) { var x = lex[k]; return x ? +(x[lang === 'heb' ? 4 : 5] || 0) : -1; }, seen = {};
    cands = cands.filter(function (k) { return seen[k] ? false : (seen[k] = 1); });
    var head0 = cands.length ? (pos === 'v' ? (idx['to ' + ls[i]] || []).length : 0) : 0; // keep 'to X' verb senses ahead of the rest
    cands = cands.slice(0, head0).sort(function (a, b) { return fq(b) - fq(a); }).concat(cands.slice(head0).sort(function (a, b) { return fq(b) - fq(a); }));
    for (var j = 0; j < cands.length; j++) {
      var e = lex[cands[j]]; if (!e) continue;
      var p = e[2] || '';
      var ok = !pos || (pos === 'v' ? /:V|^V/.test(p) : pos === 'n' ? /:N|^N/.test(p) && !/N-PRI|:N--?P/.test(p) : /:A|^A|:V/.test(p));
      if (!ok && !ptc && pos === 'n' && lang === 'heb' && /:V/.test(p) && hebForm(cands[j], /^HVqrms[ac]/)) ptc = { key: cands[j], e: e, lemma: ls[i], plural: false, participle: true };
      if (ok && ptc && fq(ptc.key) >= 10 * Math.max(1, fq(cands[j]))) return ptc; // a common participle beats a rare noun
      if (ok) return { key: cands[j], e: e, lemma: ls[i], plural: pos === 'n' && ls[i] !== word.toLowerCase() };
    }
    if (ptc) return ptc; // a participle ("shepherd" = one who tends) only when no noun fits
  }
  return null;
}
B.lookupEnglish = lookupEn;
function predAdj(w, lang) { // after "is": a true adjective, or a verb only when no noun fits ("God is love" -> noun)
  var a = lookupEn(w, lang, 'adj'); if (a && /:V|^V/.test(a.e[2] || '') && lookupEn(w, lang, 'n')) return null; return a;
}
function hebForm(key, morphRe, prefixRe) { // best attested form of a Hebrew word for a grammar pattern
  var ks = (D.formsHebBy && D.formsHebBy[key]) || [];
  for (var i = 0; i < ks.length; i++) {
    var parts = ks[i].split('|'), st = parts[0], m = parts[1];
    if (morphRe.test(m) && (prefixRe ? prefixRe.test(st) : st.indexOf('/') < 0)) return D.formsHeb[ks[i]].replace(/\//g, '');
  }
  return null;
}
function grkLemmas(lemma, key) {
  var out = [lemma];
  if (key && D.keyLemma) [key, key.replace(/[A-Z]$/, '')].forEach(function (k) { (D.keyLemma[k] || []).forEach(function (l) { if (out.indexOf(l) < 0) out.push(l); }); });
  return out;
}
function grkForm(lemma, morphRe, key) {
  var ls = grkLemmas(lemma, key);
  for (var j = 0; j < ls.length; j++) {
    var ks = (D.formsGrkBy && D.formsGrkBy[ls[j]]) || [];
    for (var i = 0; i < ks.length; i++) if (morphRe.test(ks[i].split('|')[1])) return D.formsGrk[ks[i]];
  }
  return null;
}
B.hebForm = hebForm; B.grkForm = grkForm;
function acute(w) { return w.normalize('NFD').replace(/̀/g, '́').normalize('NFC'); } // final grave -> acute

/* Parse an English sentence into subject, verb, object and phrases (shared by both languages) */
function parseEnglish(s, lang) {
  var orig = {}; s.replace(/[A-Za-z']+/g, function (w) { orig[w.toLowerCase()] = w; });
  var low = s.toLowerCase().replace(/n't\b/g, ' not').replace(/'m\b/g, ' am').replace(/'re\b/g, ' are').replace(/'s\b/g, ' is');
  var ws = low.replace(/[^a-z' ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  var neg = false, tense = 'past', fut = false;
  ws = ws.filter(function (w) { if (w === 'not' || w === 'never') { neg = true; return false; } if (w === 'will' || w === 'shall') { fut = true; return false; } return !/^(do|does|did|so|very|truly|indeed|also)$/.test(w); });
  var pps = [], core = [], lead = null;
  if (PREPS[ws[0]] && ws.length > 2) { // "In the beginning God created ...": a leading phrase of one noun (+ "of" noun)
    var j0 = 1; while (j0 < ws.length && (DETS[ws[j0]] || POSS[ws[j0]])) j0++;
    j0++; if (ws[j0] === 'of') { j0++; while (j0 < ws.length && DETS[ws[j0]]) j0++; j0++; }
    lead = { p: PREPS[ws[0]], ws: ws.slice(1, j0) }; ws = ws.slice(j0);
  }
  for (var i = 0; i < ws.length; i++) {
    if (PREPS[ws[i]] && i > 0) { var j = i + 1; while (j < ws.length && !PREPS[ws[j]]) j++; pps.push({ p: PREPS[ws[i]], ws: ws.slice(i + 1, j) }); i = j - 1; continue; }
    core.push(ws[i]);
  }
  var vi = -1, verb = null, isBe = false;
  for (var k = 0; k < core.length; k++) {
    var w = core[k];
    if (lemmas(w)[0] === 'be') { vi = k; isBe = true; break; }
    if (k === 0 && PRON[w]) continue;
    if (STOPV[w] || POSS[w] || (k > 0 && (DETS[core[k - 1]] || POSS[core[k - 1]]))) continue;
    var v = lookupEn(w, lang, 'v');
    if (v && (k > 0 || core.length === 1)) { vi = k; verb = v; break; }
  }
  if (verb) { var vw = core[vi]; tense = fut ? 'fut' : (/ed$/.test(vw) || IRR[vw] && IRR[vw] !== vw && !/s$/.test(vw)) ? 'past' : 'pres'; }
  if (isBe) tense = /^(was|were)$/.test(core[vi]) ? 'past' : 'pres';
  return { lead: lead, orig: orig, neg: neg, tense: tense, pps: pps, core: core, vi: vi, verb: verb, isBe: isBe, subjWs: vi > 0 ? core.slice(0, vi) : [], restWs: vi >= 0 ? core.slice(vi + 1) : core };
}
function nounPhrase(ws, orig, lang) {
  ws = ws.filter(function (w) { return !DETS[w]; });
  if (!ws.length) return null;
  var ai = ws.indexOf('and');
  if (ai > 0 && ai < ws.length - 1) { var parts = [], cur = []; ws.forEach(function (w) { if (w === 'and') { if (cur.length) parts.push(cur); cur = []; } else cur.push(w); }); if (cur.length) parts.push(cur); var nps = parts.map(function (p) { return nounPhrase(p, orig, lang); }).filter(Boolean); return nps.length > 1 ? { coord: nps, plural: true } : nps[0]; }
  var oi = ws.indexOf('of');
  if (oi > 0 && oi < ws.length - 1) { var hd = nounPhrase(ws.slice(0, oi), orig, lang), gn = nounPhrase(ws.slice(oi + 1), orig, lang); if (hd && gn && !hd.pron && !hd.coord) { hd.of = gn; return hd; } }
  if (ws.length === 1 && PRON[ws[0]]) return { pron: PRON[ws[0]], en: ws[0] };
  var poss = null, adjs = [], head = null, i = 0, def = false;
  for (; i < ws.length; i++) {
    if (POSS[ws[i]]) { poss = POSS[ws[i]]; continue; }
    if (i < ws.length - 1) { var a = lookupEn(ws[i], lang, 'adj'); if (a) { adjs.push({ en: ws[i], a: a }); continue; } }
    head = ws[i]; break;
  }
  if (!head) return null;
  if (i < ws.length - 1) { var first = nounPhrase(ws.slice(0, i + 1), orig, lang), more = ws.slice(i + 1).map(function (w) { return nounPhrase([w], orig, lang); }).filter(Boolean); return more.length ? { appos: [first].concat(more) } : first; }
  var cap = orig[head] && /^[A-Z]/.test(orig[head]);
  var n = lookupEn(head, lang, 'n', cap);
  var nm = !n || cap ? lookupEn(head, lang, '', cap) : null;
  if (cap && nm && /N-PRI|:N--?P|-P$/.test(nm.e[2] || '')) n = nm;
  if (cap && !n && nm) n = nm;
  return { head: head, en: head, n: n, plural: n ? n.plural : false, poss: poss, adjs: adjs, cap: cap };
}

/* ---- Biblical Hebrew */
var H_INDEP = { '1cs': 'אֲנִי', '2ms': 'אַתָּה', '3ms': 'הוּא', '3fs': 'הִיא', '1cp': 'אֲנַחְנוּ', '3mp': 'הֵם' };
var H_SUF = { '1cs': '1cs', '2ms': '2ms', '3ms': '3ms', '3fs': '3fs', '1cp': '1cp', '3mp': '3mp' };
var H_PREP = { in: ['H9003', 'בְּ'], on: ['H5921A', 'עַל'], to: ['H9005', 'לְ'], for: ['H9005', 'לְ'], into: ['H9005', 'לְ'], from: ['H4480A', 'מִן'], with: ['H5973A', 'עִם'], over: ['H5921A', 'עַל'], under: ['H8478A', 'תַּחַת'], before: ['H6440G', 'לִפְנֵי'], after: ['H0310A', 'אַחֲרֵי'], by: ['H9003', 'בְּ'], through: ['H9003', 'בְּ'] };
var H_PSUF = { // prepositions with pronoun suffixes, as the Hebrew Bible writes them
  'בְּ': { '1cs': 'בִּי', '2ms': 'בְּךָ', '3ms': 'בּוֹ', '3fs': 'בָּהּ', '1cp': 'בָּנוּ', '3mp': 'בָּהֶם' },
  'לְ': { '1cs': 'לִי', '2ms': 'לְךָ', '3ms': 'לוֹ', '3fs': 'לָהּ', '1cp': 'לָנוּ', '3mp': 'לָהֶם' },
  'עִם': { '1cs': 'עִמִּי', '2ms': 'עִמְּךָ', '3ms': 'עִמּוֹ', '3fs': 'עִמָּהּ', '1cp': 'עִמָּנוּ', '3mp': 'עִמָּם' },
  'מִן': { '1cs': 'מִמֶּנִּי', '2ms': 'מִמְּךָ', '3ms': 'מִמֶּנּוּ', '3fs': 'מִמֶּנָּה', '1cp': 'מִמֶּנּוּ', '3mp': 'מֵהֶם' },
  'עַל': { '1cs': 'עָלַי', '2ms': 'עָלֶיךָ', '3ms': 'עָלָיו', '3fs': 'עָלֶיהָ', '1cp': 'עָלֵינוּ', '3mp': 'עֲלֵיהֶם' },
  'לִפְנֵי': { '1cs': 'לְפָנַי', '2ms': 'לְפָנֶיךָ', '3ms': 'לְפָנָיו', '3fs': 'לְפָנֶיהָ', '1cp': 'לְפָנֵינוּ', '3mp': 'לִפְנֵיהֶם' },
  'אַחֲרֵי': { '1cs': 'אַחֲרַי', '2ms': 'אַחֲרֶיךָ', '3ms': 'אַחֲרָיו', '3fs': 'אַחֲרֶיהָ', '1cp': 'אַחֲרֵינוּ', '3mp': 'אַחֲרֵיהֶם' },
  'תַּחַת': { '1cs': 'תַּחְתַּי', '2ms': 'תַּחְתֶּיךָ', '3ms': 'תַּחְתָּיו', '3fs': 'תַּחְתֶּיהָ', '1cp': 'תַּחְתֵּינוּ', '3mp': 'תַּחְתֵּיהֶם' }
};
function hebNoun(np, opt) { // opt: {def, cst, prefix: 'H9003' etc.}; returns the best attested form
  if (!np || !np.n) return null;
  var k = np.n.key, e = np.n.e, P = np.n.participle ? 'Vqr[mf]?' : 'N[cgt]?[mfbc]?', A = np.n.participle ? 'Vqr[mf]?' : 'A[ac]?[mfc]?';
  var nums = np.plural ? ['[pd]', 's'] : ['s', '[pd]'], form = null, prefixed = false, how = 'attested form', isName = /N--?P|-P$/.test(e[2] || '');
  if (isName) P = 'Np[mflt]?';
  for (var t = 0; t < nums.length && !form; t++) {
    var num = nums[t];
    if (np.poss) { var pg = np.poss; form = hebForm(k, new RegExp('^H' + P + num + 'c/Sp' + pg[0] + (pg[1] === 'c' ? '[bc]' : pg[1]) + pg[2]), /^\{H[^}]*\}\/H90/); if (form) break; }
    if (opt.prefix && opt.def) { form = hebForm(k, new RegExp('^HRd/' + P + num + 'a'), new RegExp('^' + opt.prefix + '/')); if (form) { prefixed = true; break; } }
    if (opt.prefix && !opt.def) { form = hebForm(k, new RegExp('^HR/' + P + num + (opt.cst ? 'c' : 'a?')), new RegExp('^' + opt.prefix + '/\\{')); if (form) { prefixed = true; break; } }
    if (opt.def && !opt.prefix) { form = hebForm(k, new RegExp('^HTd/' + P + num + 'a'), /^H9009\//); if (form) break; }
    form = hebForm(k, new RegExp('^H' + P + num + (opt.cst ? 'c' : isName ? '' : 'a')));
  }
  if (!form && isName) form = hebForm(k, /^HNp/);
  if (!form) { how = 'dictionary form'; form = (e[0] || '').replace(/\s/g, ''); }
  if (opt.def && !opt.prefix && !/^הַ|^הָ|^הֶ/.test(form) && !np.poss && !isName) form = 'הַ' + form;
  return { text: form, how: how, gloss: e[3], key: k, prefixed: prefixed, isName: isName };
}
function draftHebrew(s) {
  var P = parseEnglish(s, 'heb'), out = [], notes = [], ok = 0, total = 0;
  function W(text, en, how, gloss, key, guess) { out.push({ text: text, en: en, how: how, gloss: gloss || '', key: key || '' }); total++; if (!guess) ok++; }
  function nameWord(w) { var h = B.hebrewBySound(P.orig[w] || w); W(h.text, w, 'not in dictionary: by sound', '', '', true); }
  function np(npx, opt) {
    if (!npx) return;
    if (npx.coord) { npx.coord.forEach(function (c, i) { var before = out.length; np(c, opt); if (i && out[before]) { out[before].text = 'וְ' + out[before].text; out[before].how += ' + "and" prefix'; } }); return; }
    if (npx.appos) { npx.appos.forEach(function (c) { np(c, opt); }); return; }
    if (npx.pron) { W(H_INDEP[npx.pron] || '', npx.en, 'pronoun'); return; }
    if (npx.of) { var g = npx.of; npx.of = null; np(npx, { cst: true, prefix: opt.prefix }); np(g, { def: true }); notes.push('"of": the first noun in the construct state, the second after it (construct chain)'); return; }
    if (!npx.n) { nameWord(npx.head); return; }
    var isName = /N--?P|-P$/.test(npx.n.e[2] || '') || npx.n.key === 'H3068G';
    var def = opt.def !== false && !npx.poss && !isName && !opt.cst;
    var f = hebNoun(npx, { def: def && !opt.indef, cst: opt.cst, prefix: opt.prefix });
    var t = f.text;
    if (opt.prefix && !f.prefixed) { var pr = Object.keys(H_PREP).filter(function (k) { return H_PREP[k][0] === opt.prefix; })[0], pf = (H_PREP[pr] || ['', ''])[1]; if (def && /^הַ/.test(t)) { t = pf.replace('ְ', 'ַ') + t.slice(2); } else t = pf + t; }
    W(t, npx.head, f.how + (opt.cst ? ' (construct)' : def ? ' (with "the")' : ''), f.gloss, f.key, f.how !== 'attested form');
    npx.adjs.forEach(function (a) {
      var ak = a.a.key, af = hebForm(ak, new RegExp('^HA[ac]?[mfc]' + (npx.plural ? 'p' : 's') + 'a')) || (D.lexHeb[ak] || [''])[0];
      if (def) { var adef = hebForm(ak, new RegExp('^HTd/A[ac]?[mfc]' + (npx.plural ? 'p' : 's') + 'a'), /^H9009\//); af = adef || 'הַ' + af; }
      W(af, a.en, 'adjective after the noun', (D.lexHeb[ak] || [])[3], ak);
    });
  }
  var subj = P.subjWs.length ? nounPhrase(P.subjWs, P.orig, 'heb') : null;
  var person = subj && subj.pron ? subj.pron : subj && (subj.plural || subj.coord) ? '3mp' : '3ms';
  if (P.lead) P.pps.unshift(Object.assign({ first: true }, P.lead));
  function pp(p) { var hp = H_PREP[p.p]; var npp = nounPhrase(p.ws, P.orig, 'heb'); if (!hp) return; if (npp && npp.pron && H_PSUF[hp[1]] && H_PSUF[hp[1]][npp.pron]) { W(H_PSUF[hp[1]][npp.pron], p.p + ' ' + npp.en, 'preposition with a pronoun suffix'); return; } var d = p.ws.indexOf('the') >= 0 ? true : false; if (/^H90/.test(hp[0])) np(npp, { prefix: hp[0], def: d }); else { W(hp[1], p.p, 'preposition'); np(npp, { def: d }); } }
  P.pps.filter(function (p) { return p.first; }).forEach(pp);
  if (P.isBe) {
    var pr = P.restWs.filter(function (w) { return !DETS[w]; }), adj = pr.length === 1 ? predAdj(pr[0], 'heb') : null;
    if (subj) np(subj, { def: P.subjWs.indexOf('the') >= 0 });
    if (P.neg) W('לֹא', 'not', 'negation');
    if (adj) { var af = hebForm(adj.key, new RegExp('^HA[ac]?[mfc]' + (/p$/.test(person) ? 'p' : 's') + 'a')) || adj.e[0]; W(af, pr[0], 'adjective as the predicate', adj.e[3], adj.key); }
    else { var pn = nounPhrase(pr, P.orig, 'heb'); if (pn) np(pn, { def: P.restWs.indexOf('the') >= 0 }); }
    notes.push('"is" is not written: a Hebrew nominal sentence (subject, then predicate)');
  } else if (P.verb) {
    var obj = null, ind = null, rest = P.restWs.slice();
    if (rest.length > 1 && /^(me|you|him|her|us|them)$/.test(rest[0])) { ind = PRON[rest[0]]; rest = rest.slice(1); }
    obj = rest.length ? nounPhrase(rest, P.orig, 'heb') : null;
    var vk = P.verb.key, conj = P.tense === 'past' ? 'p' : 'i';
    var gcl = person[1] === 'c' ? '[cbm]' : person[1] === 'm' ? '[mcb]' : person[1];
    var vf = hebForm(vk, new RegExp('^HV[a-zA-Z]' + conj + person[0] + gcl + person[2] + '$'));
    if (!vf) vf = hebForm(vk, new RegExp('^HV[a-zA-Z]' + conj + person[0])); // any gender/number for this person
    if (!vf) vf = hebForm(vk, new RegExp('^HV[a-zA-Z]' + conj));
    var vhow = vf ? 'verb, ' + (conj === 'p' ? 'perfect (past)' : 'imperfect (present/future)') : 'verb, dictionary form';
    // biblical word order: verb, subject, object
    W((P.neg ? 'לֹא ' : '') + (vf || P.verb.e[0]), P.core[P.vi], vhow, P.verb.e[3], vk, !vf);
    if (subj && !subj.pron) np(subj, { def: P.subjWs.indexOf('the') >= 0 });
    if (ind) { var lf = { '1cs': 'לִי', '2ms': 'לְךָ', '3ms': 'לוֹ', '3fs': 'לָהּ', '1cp': 'לָנוּ', '3mp': 'לָהֶם' }[ind]; W(lf, 'to ' + Object.keys(PRON).filter(function (k) { return PRON[k] === ind; })[0], 'preposition לְ with pronoun ending'); }
    if (obj) {
      if (obj.pron) { var of = { '1cs': 'אֹתִי', '2ms': 'אֹתְךָ', '3ms': 'אֹתוֹ', '3fs': 'אֹתָהּ', '1cp': 'אֹתָנוּ', '3mp': 'אֹתָם' }[obj.pron]; W(of, obj.en, 'object marker with pronoun ending'); }
      else { var definite = rest.indexOf('the') >= 0 || !!obj.poss || obj.cap || (obj.n && /N--?P|-P$/.test(obj.n.e[2] || '')); if (definite) W('אֶת', '', 'object marker (before a definite object)'); np(obj, { def: rest.indexOf('the') >= 0 }); }
    }
    notes.push('Hebrew order: verb, subject, object; ' + (conj === 'p' ? 'the perfect for past events' : 'the imperfect for present or future'));
  } else {
    var all = nounPhrase(P.core, P.orig, 'heb'); if (all) np(all, { def: P.core.indexOf('the') >= 0 ? undefined : false }); else P.core.forEach(nameWord);
    notes.push('no verb found: written as a phrase');
  }
  P.pps.filter(function (p) { return !p.first; }).forEach(pp);
  if (!out.length) { s.split(/\s+/).forEach(function (w) { var c = w.replace(/[^A-Za-z]/g, ''); if (c) nameWord(c); }); notes.push('no structure recognised: written by sound'); }
  var conf = total ? ok / total * 0.65 : 0;
  return { english: s, words: out, text: out.map(function (w) { return w.text; }).join(' ').replace(/\s+/g, ' ').trim(), notes: notes, confidence: Math.round(conf * 100) / 100 };
}

/* ---- Koine Greek */
var G_ART = { NSM: 'ὁ', GSM: 'τοῦ', DSM: 'τῷ', ASM: 'τὸν', NSF: 'ἡ', GSF: 'τῆς', DSF: 'τῇ', ASF: 'τὴν', NSN: 'τὸ', GSN: 'τοῦ', DSN: 'τῷ', ASN: 'τὸ', NPM: 'οἱ', GPM: 'τῶν', DPM: 'τοῖς', APM: 'τοὺς', NPF: 'αἱ', GPF: 'τῶν', DPF: 'ταῖς', APF: 'τὰς', NPN: 'τὰ', GPN: 'τῶν', DPN: 'τοῖς', APN: 'τὰ' };
var G_PRON = { '1cs': { N: 'ἐγώ', G: 'μου', D: 'μοι', A: 'με' }, '2ms': { N: 'σύ', G: 'σου', D: 'σοι', A: 'σε' }, '3ms': { N: 'αὐτός', G: 'αὐτοῦ', D: 'αὐτῷ', A: 'αὐτόν' }, '3fs': { N: 'αὐτή', G: 'αὐτῆς', D: 'αὐτῇ', A: 'αὐτήν' }, '1cp': { N: 'ἡμεῖς', G: 'ἡμῶν', D: 'ἡμῖν', A: 'ἡμᾶς' }, '3mp': { N: 'αὐτοί', G: 'αὐτῶν', D: 'αὐτοῖς', A: 'αὐτούς' } };
var G_PREP = { in: ['ἐν', 'D'], into: ['εἰς', 'A'], to: ['πρὸς', 'A'], for: ['ὑπὲρ', 'G'], from: ['ἀπὸ', 'G'], with: ['μετὰ', 'G'], on: ['ἐπὶ', 'G'], over: ['ἐπὶ', 'G'], under: ['ὑπὸ', 'A'], before: ['ἔμπροσθεν', 'G'], after: ['μετὰ', 'A'], by: ['ὑπὸ', 'G'], through: ['διὰ', 'G'] };
var G_PERS = { '1cs': '1S', '2ms': '2S', '3ms': '3S', '3fs': '3S', '1cp': '1P', '3mp': '3P' };
var G_BE = { '1cs': { pres: 'εἰμι', past: 'ἤμην' }, '2ms': { pres: 'εἶ', past: 'ἦς' }, '3ms': { pres: 'ἐστιν', past: 'ἦν' }, '3fs': { pres: 'ἐστιν', past: 'ἦν' }, '1cp': { pres: 'ἐσμεν', past: 'ἦμεν' }, '3mp': { pres: 'εἰσιν', past: 'ἦσαν' } };
function grkGender(lemma, key) { // from attested noun forms
  var ls = grkLemmas(lemma, key);
  for (var j = 0; j < ls.length; j++) { var ks = (D.formsGrkBy && D.formsGrkBy[ls[j]]) || []; for (var i = 0; i < ks.length; i++) { var m = /^N-[NGDAV][SP]([MFN])/.exec(ks[i].split('|')[1]); if (m) return m[1]; } }
  var lex = (D.lexGrk && key && D.lexGrk[key]) || null; if (lex) { var mm = /N-([MFN])/.exec(lex[2] || ''); if (mm) return mm[1]; }
  return 'M';
}
function grkNoun(npx, kase) {
  var e = npx.n.e, lem = e[0], key = npx.n.key, num = npx.plural ? 'P' : 'S', g = grkGender(lem, key);
  var f = grkForm(lem, new RegExp('^N-' + kase + num + g), key) || grkForm(lem, new RegExp('^N-' + kase + num), key) || (npx.plural ? null : grkForm(lem, new RegExp('^N-PRI'), key)) || null;
  return { text: f || lem, how: f ? 'attested form' : 'dictionary form', gender: g, num: num, key: npx.n.key, gloss: e[3] };
}
function draftGreek(s) {
  var P = parseEnglish(s, 'grk'), out = [], notes = [], ok = 0, total = 0;
  function W(text, en, how, gloss, key, guess) { out.push({ text: text, en: en, how: how, gloss: gloss || '', key: key || '' }); total++; if (!guess) ok++; }
  function nameWord(w) { var g = B.greekBySound(P.orig[w] || w); W(g.text, w, 'not in dictionary: by sound', '', '', true); }
  function np(npx, kase, opt) {
    opt = opt || {};
    if (!npx) return;
    if (npx.coord) { npx.coord.forEach(function (c, i) { if (i) W('καὶ', 'and', 'conjunction'); np(c, kase, opt); }); return; }
    if (npx.appos) { npx.appos.forEach(function (c) { np(c, kase, opt); }); return; }
    if (npx.pron) { W(G_PRON[npx.pron][kase] || '', npx.en, 'pronoun'); return; }
    var gen = npx.of; npx.of = null;
    if (!npx.n) { nameWord(npx.head); if (gen) np(gen, 'G'); return; }
    var f = grkNoun(npx, kase);
    var isName = /N-PRI|:N--?P|-P$/.test(npx.n.e[2] || '');
    var art = opt.noArt ? '' : (G_ART[kase + f.num + f.gender] || '');
    if (art && (opt.def !== false || isName || npx.poss || npx.cap)) W(art, 'the', 'article (' + { N: 'subject', G: 'of', D: 'to/in', A: 'object' }[kase] + ')');
    W(f.text, npx.head, f.how + ', ' + { N: 'nominative', G: 'genitive', D: 'dative', A: 'accusative' }[kase], f.gloss, f.key, f.how !== 'attested form');
    npx.adjs.forEach(function (a) { var al = a.a.e[0], af = grkForm(al, new RegExp('^A-' + kase + f.num + f.gender), a.a.key) || al; W(af, a.en, 'adjective, agreeing with the noun', a.a.e[3], a.a.key); });
    if (npx.poss) W(G_PRON[npx.poss].G, Object.keys(POSS).filter(function (k) { return POSS[k] === npx.poss; })[0], 'pronoun (genitive: "of me")');
    if (gen) { np(gen, 'G'); notes.push('"of" written with the genitive case'); }
  }
  var subj = P.subjWs.length ? nounPhrase(P.subjWs, P.orig, 'grk') : null;
  var person = subj && subj.pron ? subj.pron : subj && (subj.plural || subj.coord) ? '3mp' : '3ms';
  if (P.lead) P.pps.unshift(Object.assign({ first: true }, P.lead));
  function pp(p) { var gp = G_PREP[p.p]; if (!gp) return; W(gp[0], p.p, 'preposition (with the ' + { G: 'genitive', D: 'dative', A: 'accusative' }[gp[1]] + ')'); np(nounPhrase(p.ws, P.orig, 'grk'), gp[1], { def: p.ws.indexOf('the') >= 0 ? undefined : false }); }
  P.pps.filter(function (p) { return p.first; }).forEach(pp);
  if (P.isBe) {
    var pr = P.restWs.filter(function (w) { return !DETS[w]; }), adj = pr.length === 1 ? predAdj(pr[0], 'grk') : null;
    if (subj) np(subj, 'N', { def: P.subjWs.indexOf('the') >= 0 ? undefined : false });
    if (P.neg) W('οὐκ', 'not', 'negation');
    W(G_BE[person][P.tense === 'past' ? 'past' : 'pres'], 'is', 'verb "to be" (εἰμί)');
    if (adj) { var g = subj && subj.n ? grkGender(subj.n.e[0], subj.n.key) : 'M', af = grkForm(adj.e[0], new RegExp('^A-N' + (/p$/.test(person) ? 'P' : 'S') + g), adj.key) || adj.e[0]; W(af, pr[0], 'adjective, nominative', adj.e[3], adj.key); }
    else { var pn = nounPhrase(pr, P.orig, 'grk'); if (pn) np(pn, 'N', { def: P.restWs.indexOf('the') >= 0 || !!pn.poss ? undefined : false }); }
    notes.push('"to be" takes the nominative on both sides');
  } else if (P.verb) {
    var ind = null, rest = P.restWs.slice();
    if (rest.length > 1 && /^(me|you|him|her|us|them)$/.test(rest[0])) { ind = PRON[rest[0]]; rest = rest.slice(1); }
    var obj = rest.length ? nounPhrase(rest, P.orig, 'grk') : null, lem = P.verb.e[0];
    var T = P.tense === 'past' ? 'A' : P.tense === 'fut' ? 'F' : 'P', pn2 = G_PERS[person];
    var vf = grkForm(lem, new RegExp('^V-2?' + T + '[A-Z]I-' + pn2), P.verb.key) || (T === 'A' ? grkForm(lem, new RegExp('^V-[IR][A-Z]I-' + pn2), P.verb.key) : null);
    if (subj && !subj.pron) np(subj, 'N', { def: P.subjWs.indexOf('the') >= 0 ? undefined : false });
    if (P.neg) W(vf && /^[αεηιουωἀἐἠἰὀὐὠἁἑἡἱὁὑὡ]/.test(B.stripAccents(vf)) ? 'οὐκ' : 'οὐ', 'not', 'negation');
    W(vf ? acute(vf) : lem, P.core[P.vi], vf ? 'verb, ' + { A: 'aorist (past)', F: 'future', P: 'present' }[T] + ' indicative' : 'verb, dictionary form', P.verb.e[3], P.verb.key, !vf);
    if (ind) W(G_PRON[ind].D, 'to ' + rest[0], 'pronoun (dative: "to me")');
    if (obj) np(obj, 'A', { def: P.restWs[P.restWs.indexOf(obj.head) - 1] === 'the' || obj.poss || obj.coord ? undefined : false });
    notes.push('subject in the nominative, object in the accusative; the verb ending shows the subject');
  } else {
    var all = nounPhrase(P.core, P.orig, 'grk'); if (all) np(all, 'N', { def: P.core.indexOf('the') >= 0 ? undefined : false }); else P.core.forEach(nameWord);
    notes.push('no verb found: written as a phrase');
  }
  P.pps.filter(function (p) { return !p.first; }).forEach(pp);
  if (!out.length) { s.split(/\s+/).forEach(function (w) { var c = w.replace(/[^A-Za-z]/g, ''); if (c) nameWord(c); }); notes.push('no structure recognised: written by sound'); }
  var ENC = /^(μου|σου|μοι|σοι|με|σε|ἐστιν|εἰμι|ἐσμεν|εἰσιν|ἐστε)$/;
  out.forEach(function (w, i) { var nx = out[i + 1]; if (!nx || ENC.test(nx.text)) w.text = acute(w.text); });
  var conf = total ? ok / total * 0.7 : 0;
  return { english: s, words: out, text: out.map(function (w) { return w.text; }).join(' '), notes: notes, confidence: Math.round(conf * 100) / 100 };
}
/* English -> lang 'heb' (Biblical Hebrew) | 'grk' (Koine Greek); one draft per sentence */
B.translate = function (text, lang) {
  var sents = (text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*/g) || []).map(function (s) { return lang === 'heb' ? draftHebrew(s.trim()) : draftGreek(s.trim()); });
  var conf = sents.length ? sents.reduce(function (a, s) { return a + s.confidence; }, 0) / sents.length : 0;
  var joined = sents.map(function (s) { return s.text + (lang === 'heb' ? '׃' : '.'); }).join(' ');
  return { lang: lang, sentences: sents, text: joined, confidence: Math.round(conf * 100) / 100 };
};

/* ============================================================ shaping, layout and SVG */
var HB = null, FONTS = {}, GL = null, PATHS = {}, BBOX = {}, DMAP = {}, DUPS = {};
// for marks drawn identically, the more common one when position cannot tell them apart
var PUNCT_PREF = ['\u02BC'];
// prepositive dehi is drawn before (to the right of) its letter, as in printed Bibles, so it cannot be mistaken for tipcha
var MARK_SHIFT = { '\u05AD': [150, 0] };
var MARK_PREF = ['\u0596', '\u05B4', '\u05AA', '\u05A8', '\u05A4', '\u059C', '\u05C1'];
var SCRIPTS = { heb: { font: 'heb', rtl: true, lh: 2.1, gap: 0.38 }, phn: { font: 'phn', rtl: true, lh: 1.7, gap: 0.45 }, grk: { font: 'grk', rtl: false, lh: 1.8, gap: 0.32 } };
B.SCRIPTS = SCRIPTS;
B.setShaper = function (hb) { HB = hb; };
B.loadGlyphs = function (g) { GL = g; return true; };
B.loadFont = function (key, bytes) {
  var blob = HB.createBlob(bytes), face = HB.createFace(blob, 0), font = HB.createFont(face);
  FONTS[key] = { blob: blob, face: face, font: font }; PATHS[key] = {}; BBOX[key] = {}; DMAP[key] = null;
  return true;
};
B.THEMES = {
  parchment: { bg: '#f3e7cc', ink: '#2b1d0e' },
  scroll: { bg: '#e8d9b0', ink: '#3a2412' },
  stone: { bg: '#d9d6cf', ink: '#1d1d1f' },
  night: { bg: '#121826', ink: '#f2e6c9' }
};
function pathOf(key, g) { var c = PATHS[key]; if (c[g] === undefined) c[g] = FONTS[key].font.glyphToPath(g) || ''; return c[g]; }
function bboxOf(key, g) {
  var c = BBOX[key]; if (c[g]) return c[g];
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  flatten(pathOf(key, g)).forEach(function (p) { p.forEach(function (q) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }); });
  return (c[g] = x0 > x1 ? null : [x0, y0, x1, y1]);
}
function shiftMarks(key, gs) {
  gs.forEach(function (g) { var t = GL[key].glyphs[g.g], sh = t && MARK_SHIFT[t[0]]; if (sh) { g.dx += sh[0]; g.dy += sh[1]; } });
  return gs;
}
function shape(key, text, rtl) {
  var buf = HB.createBuffer(); buf.addText(text); buf.guessSegmentProperties();
  if (rtl !== undefined) buf.setDirection(rtl ? 'rtl' : 'ltr');
  HB.shape(FONTS[key].font, buf); var o = buf.json(); buf.destroy(); return o;
}
function prepare(text, script, opts) {
  text = text.replace(/\r/g, '');
  if (script === 'phn') return text.split('\n').map(function (l) { return Array.from(l).some(isHeb) ? B.toPaleo(l, opts.sep) : l; }).join('\n');
  if (script === 'heb') { if (opts.noCant) text = B.stripCantillation(text); if (opts.noPoints) text = B.stripPoints(text); return text; }
  return text.normalize('NFC');
}
/* Lay out text: script 'heb' | 'grk' | 'phn'; size = pixels per em; width = page width in px */
B.layout = function (text, opts) {
  opts = opts || {};
  var script = opts.script || 'heb', sc = SCRIPTS[script], key = sc.font, upm = GL[key].upm, size = opts.size || 48, s = size / upm;
  var margin = Math.round(size * 0.6), maxw = (opts.width || 900) - 2 * margin, gap = sc.gap * size, lh = sc.lh * size;
  var lines = [], t = prepare(text, script, opts);
  t.split('\n').forEach(function (para) {
    var words = para.split(/\s+/).filter(Boolean), cur = [], curW = 0;
    words.forEach(function (w) {
      var gs = shiftMarks(key, shape(key, w, sc.rtl)), ww = gs.reduce(function (a, g) { return a + g.ax; }, 0) * s;
      if (cur.length && curW + gap + ww > maxw) { lines.push(cur); cur = []; curW = 0; }
      cur.push({ w: w, gs: gs, width: ww }); curW += (cur.length > 1 ? gap : 0) + ww;
    });
    lines.push(cur);
  });
  var H = Math.round(margin * 2 + lh * Math.max(1, lines.length)), W = opts.width || 900, out = [];
  lines.forEach(function (ws, li) {
    var base = margin + lh * li + lh * 0.62, total = ws.reduce(function (a, w) { return a + w.width; }, 0) + gap * Math.max(0, ws.length - 1);
    var x = sc.rtl ? W - margin : margin;
    if (opts.align === 'center') x = sc.rtl ? (W + total) / 2 : (W - total) / 2;
    ws.forEach(function (w) {
      var left = sc.rtl ? x - w.width : x, pen = 0;
      w.gs.forEach(function (g) { out.push({ key: key, g: g.g, x: left + (pen + g.dx) * s, y: base - g.dy * s, px: left + pen * s, by: base, dx: g.dx, dy: g.dy, s: s, line: li }); pen += g.ax; });
      x = sc.rtl ? x - w.width - gap : x + w.width + gap;
    });
  });
  return { glyphs: out, W: W, H: H, size: size, script: script };
};
function f6(n) { return Math.round(n * 1e6) / 1e6; }
B.render = function (text, opts) {
  opts = opts || {}; var th = B.THEMES[opts.theme || 'parchment'], L = B.layout(text, opts);
  // each letter: pen position on the baseline, then the font's offset for that glyph (marks sit on their letter this way)
  var parts = L.glyphs.map(function (g) { var d = pathOf(g.key, g.g); return d ? '<path d="' + d + '" transform="matrix(' + f6(g.s) + ' 0 0 ' + f6(-g.s) + ' ' + f6(g.px) + ' ' + f6(g.by) + ') translate(' + g.dx + ' ' + g.dy + ')"/>' : ''; }).join('');
  var meta = '<metadata>' + JSON.stringify({ generator: 'Bible Languages Studio ' + B.version, author: 'Larry Dalton', script: L.script, note: 'provenance only; the reader uses the letter outlines' }).replace(/</g, '&lt;') + '</metadata>';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + L.W + '" height="' + L.H + '" viewBox="0 0 ' + L.W + ' ' + L.H + '">' + meta + '<rect width="' + L.W + '" height="' + L.H + '" fill="' + th.bg + '"/><g fill="' + th.ink + '">' + parts + '</g></svg>';
};
function dmap(key) {
  if (DMAP[key]) return DMAP[key];
  // identical outlines (Latin o and Greek omicron): prefer the Greek or Hebrew letter
  var m = {}, native = function (g) { var t = GL[key].glyphs[g][0] || ''; return Array.from(t).some(function (c) { return isGrk(c) || isHeb(c) || (c >= '\u{10900}' && c <= '\u{1091F}'); }); };
  var dup = {};
  Object.keys(GL[key].glyphs).forEach(function (g) { var d = pathOf(key, +g); if (!d) return; (dup[d] = dup[d] || []).push(+g); if (m[d] === undefined || (native(+g) && !native(m[d])) || PUNCT_PREF.indexOf(GL[key].glyphs[g][0]) >= 0) m[d] = +g; });
  DUPS[key] = {}; Object.keys(dup).forEach(function (d) { if (dup[d].length > 1 && GL[key].glyphs[dup[d][0]][2]) dup[d].forEach(function (g) { DUPS[key][g] = dup[d]; }); });
  return (DMAP[key] = m);
}
/* A mark whose outline is shared with another mark (e.g. pashta and qadma): the font places them differently on the
   same letter, so shape the letter with each candidate and keep the one whose offset matches the drawing */
function disambiguate(m, base) {
  var cands = DUPS[m.key] && DUPS[m.key][m.g];
  if (!cands || !HB) return;
  var best = null, bd = 1e9;
  cands.forEach(function (g) {
    var t = GL[m.key].glyphs[g][0]; if (!t) return;
    var o = shiftMarks(m.key, shape(m.key, base.text + t, m.key !== 'grk')), mg = o.filter(function (x) { return x.g === g; })[0], bg = o.filter(function (x) { return !GL[m.key].glyphs[x.g] || !GL[m.key].glyphs[x.g][2]; })[0];
    // compare the mark's offset relative to its letter (the letter itself may be shifted in context)
    var d = mg ? Math.abs((mg.dx - (bg ? bg.dx : 0)) - (m.tdx - (base.tdx || 0))) + Math.abs((mg.dy - (bg ? bg.dy : 0)) - (m.tdy - (base.tdy || 0))) : 1e6, pref = MARK_PREF.indexOf(t) >= 0 ? -0.5 : 0;
    if (d + pref < bd) { bd = d + pref; best = t; }
  });
  if (best) m.text = best;
}
/* Rebuild text from glyphs placed on lines: bases in reading order, marks attached to the base they sit on */
function assemble(items, script, size) {
  var sc = SCRIPTS[script], lines = {};
  items.forEach(function (it) { var k = Math.round(it.y / (size * 0.5)); (lines[k] = lines[k] || []).push(it); });
  var outLines = [];
  Object.keys(lines).map(Number).sort(function (a, b) { return a - b; }).forEach(function (k) {
    var its = lines[k], bases = its.filter(function (i) { return !i.mark; }).sort(function (a, b) { return (a.pen !== undefined ? a.pen - b.pen : a.x - b.x) || a.i - b.i; }), marks = its.filter(function (i) { return i.mark; });
    bases.forEach(function (b) { b.marks = []; if (b.pen === undefined) b.pen = b.x; });
    marks.forEach(function (m) {
      // the mark was drawn from the pen position of its letter: the letter's start (right-to-left) or its end (left-to-right)
      var best = null, bd = 1e9;
      bases.forEach(function (b) { var anchor = m.pen !== undefined ? (sc.rtl ? b.pen : b.pen + b.w) : b.x + b.w / 2, d = Math.abs((m.pen !== undefined ? m.pen : m.cx) - anchor); if (d < bd - 1e-6) { bd = d; best = b; } });
      if (best) { best.marks.push(m); disambiguate(m, best); }
    });
    var words = [], cur = '';
    bases.forEach(function (b, i) {
      if (i && b.x - (bases[i - 1].x + bases[i - 1].w) > size * 0.18) { words.push(cur); cur = ''; }
      cur += b.text + b.marks.sort(function (a, c) { return sc.rtl ? c.i - a.i : a.i - c.i; }).map(function (m) { return m.text; }).join('');
    });
    if (cur) words.push(cur);
    words = words.map(function (w) { return sc.rtl ? Array.from(w.normalize('NFD')).reduce(function (acc, ch) { if (/[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/.test(ch) && acc.length) acc[acc.length - 1] += ch; else acc.push(ch); return acc; }, []).reverse().join('') : w; });
    if (sc.rtl) words.reverse();
    var lineText = words.join(' ').normalize('NFC');
    if (!sc.rtl) lineText = lineText.replace(/(^|\s)[\u02BC\u1FBD\u2019]/g, '$1\u1FBF'); // an apostrophe-shaped mark before a word is the breathing (psili)
    outLines.push(lineText);
  });
  return outLines.join('\n');
}
/* Read an SVG made by this studio from its letter outlines (the metadata is ignored) */
B.readSVG = function (svg) {
  svg = svg.replace(/<metadata>[\s\S]*?<\/metadata>/g, '');
  var re = /<path[^>]*?\sd="([^"]+)"[^>]*?transform="matrix\(([^)]+)\)(?:\s*translate\(([^)]+)\))?"/g, m, items = [], unknown = 0, fontCount = {};
  var keys = Object.keys(FONTS);
  while ((m = re.exec(svg))) {
    var d = m[1], t = m[2].split(/[\s,]+/).map(Number), hit = null;
    for (var i = 0; i < keys.length && !hit; i++) { var g = dmap(keys[i])[d]; if (g !== undefined) hit = [keys[i], g]; }
    if (!hit) { unknown++; continue; }
    var info = GL[hit[0]].glyphs[hit[1]], bb = bboxOf(hit[0], hit[1]) || [0, 0, 0, 0], s = t[0], tr = m[3] ? m[3].split(/[\s,]+/).map(Number) : [0, 0];
    var pen = t[4], ox = pen + tr[0] * s;
    fontCount[hit[0]] = (fontCount[hit[0]] || 0) + 1;
    var isMark = !!info[2] && /^[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0300-\u036f]+$/.test(info[0]); // maqaf and sof pasuq are letters' neighbours, not marks
    items.push({ i: items.length, key: hit[0], g: hit[1], tdx: tr[0], tdy: tr[1], text: info[0], mark: isMark, pen: pen, x: isMark ? ox + bb[0] * s : ox, w: isMark ? (bb[2] - bb[0]) * s : info[1] * s, cx: ox + (bb[0] + bb[2]) / 2 * s, y: t[5], s: s });
  }
  if (!items.length) return { ok: false, reason: unknown ? 'This SVG uses outlines that are not from this studio\'s fonts.' : 'No letters were found in this SVG.' };
  var key = Object.keys(fontCount).sort(function (a, b) { return fontCount[b] - fontCount[a]; })[0];
  var script = key === 'heb' ? 'heb' : key === 'phn' ? 'phn' : 'grk', size = items[0].s * GL[key].upm;
  var text = assemble(items.filter(function (i) { return i.key === key; }), script, size);
  return finishRead({ ok: true, text: text, script: script, how: 'svg', confidence: 1, unknown: unknown });
};
function finishRead(r) {
  if (!r.ok) return r;
  if (r.script === 'heb') { r.translit = B.translitHebrew(r.text); r.paleo = B.toPaleo(r.text); }
  else if (r.script === 'phn') { r.hebrew = B.fromPaleo(r.text); r.translit = B.translitHebrew(r.hebrew); }
  else r.translit = B.translitGreek(r.text);
  r.words = lookupWords(r.script === 'phn' ? r.hebrew : r.text, r.script === 'grk' ? 'grk' : 'heb');
  return r;
}
/* dictionary matches for words that were read back */
function lookupWords(text, lang) {
  return text.split(/\s+/).filter(Boolean).map(function (w) {
    var o = { text: w };
    if (lang === 'heb') {
      var bare = B.stripPoints(w).replace(/[־׃׀]/g, ''), pointed = B.stripCantillation(w).replace(/[־׃]/g, '');
      var hit = D.byHebForm && (D.byHebForm[pointed] || D.byHebBare[bare]);
      if (hit) { o.key = hit; var e = D.lexHeb && D.lexHeb[hit]; if (e) { o.lemma = e[0]; o.gloss = e[3]; } }
    } else {
      var k = B.stripAccents(w).toLowerCase().replace(/[^α-ω]/g, '').replace(/ς/g, 'σ'), hit2 = D.byGrkForm && D.byGrkForm[k];
      if (hit2) { o.key = hit2; var e2 = D.lexGrk && D.lexGrk[hit2]; if (e2) { o.lemma = e2[0]; o.gloss = e2[3]; } }
    }
    return o;
  });
}
B.indexForms = function () { // reverse indexes for reading: attested form -> dictionary key
  D.byHebForm = {}; D.byHebBare = {}; D.byGrkForm = {};
  if (D.formsHeb) [true, false].forEach(function (hebOnly) { Object.keys(D.formsHeb).forEach(function (k) { var st = k.split('|')[0], mo = k.split('|')[1] || '', m = /\{(H\d+[A-Za-z]?)\}/.exec(st); if (!m || (mo[0] === 'H') !== hebOnly) return; var f = D.formsHeb[k].replace(/\//g, ''); if (!D.byHebForm[f]) D.byHebForm[f] = m[1]; var b = B.stripPoints(f); if (!D.byHebBare[b]) D.byHebBare[b] = m[1]; }); });
  if (D.formsGrk && D.keyLemma) {
    var lem2key = {}; Object.keys(D.keyLemma).forEach(function (k) { D.keyLemma[k].forEach(function (l) { if (!lem2key[l]) lem2key[l] = k; }); });
    Object.keys(D.formsGrk).forEach(function (k) { var l = k.split('|')[0], key = lem2key[l]; if (!key) return; var f = B.stripAccents(D.formsGrk[k]).toLowerCase().replace(/[^α-ως]/g, '').replace(/ς/g, 'σ'); if (!D.byGrkForm[f]) D.byGrkForm[f] = key; });
  }
};

/* ============================================================ rasterising and the image reader */
function flatten(d) {
  var toks = d.match(/[MLQCZHV]|-?[0-9.]+(?:e-?\d+)?/g) || [], polys = [], cur = null, x = 0, y = 0, i = 0, cmd = null;
  function num() { return parseFloat(toks[i++]); }
  while (i < toks.length) {
    if (/[MLQCZHV]/.test(toks[i])) cmd = toks[i++];
    if (cmd === 'M') { x = num(); y = num(); cur = [[x, y]]; polys.push(cur); cmd = 'L'; }
    else if (cmd === 'L') { x = num(); y = num(); cur.push([x, y]); }
    else if (cmd === 'H') { x = num(); cur.push([x, y]); }
    else if (cmd === 'V') { y = num(); cur.push([x, y]); }
    else if (cmd === 'Q') { var x1 = num(), y1 = num(), x2 = num(), y2 = num(); for (var t = 1; t <= 4; t++) { var u = t / 4; cur.push([(1 - u) * (1 - u) * x + 2 * (1 - u) * u * x1 + u * u * x2, (1 - u) * (1 - u) * y + 2 * (1 - u) * u * y1 + u * u * y2]); } x = x2; y = y2; }
    else if (cmd === 'C') { var a1 = num(), a2 = num(), b1 = num(), b2 = num(), x3 = num(), y3 = num(); for (var t2 = 1; t2 <= 6; t2++) { var v = t2 / 6, w0 = (1 - v) * (1 - v) * (1 - v), w1 = 3 * (1 - v) * (1 - v) * v, w2 = 3 * (1 - v) * v * v, w3 = v * v * v; cur.push([w0 * x + w1 * a1 + w2 * b1 + w3 * x3, w0 * y + w1 * a2 + w2 * b2 + w3 * y3]); } x = x3; y = y3; }
    else if (cmd === 'Z') cmd = null;
    else i++;
  }
  return polys;
}
function rasterInto(img, W, H, polys) { // non-zero fill of polygons (already in pixel space) into img
  var y0 = H, y1 = 0;
  polys.forEach(function (p) { p.forEach(function (q) { if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }); });
  y0 = Math.max(0, Math.floor(y0)); y1 = Math.min(H - 1, Math.ceil(y1));
  for (var yy = y0; yy <= y1; yy++) {
    var sy = yy + 0.5, xs = [];
    polys.forEach(function (p) { for (var k = 0; k < p.length; k++) { var a = p[k], b = p[(k + 1) % p.length]; if ((a[1] <= sy) !== (b[1] <= sy)) xs.push({ x: a[0] + (sy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]), w: b[1] > a[1] ? 1 : -1 }); } });
    xs.sort(function (a, b) { return a.x - b.x; });
    var wind = 0;
    for (var q = 0; q < xs.length - 1; q++) { wind += xs[q].w; if (wind !== 0) { var xa = Math.max(0, Math.ceil(xs[q].x - 0.5)), xb = Math.min(W - 1, Math.floor(xs[q + 1].x - 0.5)); for (var xx = xa; xx <= xb; xx++) img[yy * W + xx] = 1; } }
  }
}
/* text -> ink mask, drawn the same way as the SVG */
B.renderMask = function (text, opts) {
  var L = B.layout(text, opts), W = L.W, H = L.H, img = new Uint8Array(W * H);
  L.glyphs.forEach(function (g) { var d = pathOf(g.key, g.g); if (!d) return; rasterInto(img, W, H, flatten(d).map(function (p) { return p.map(function (q) { return [g.x + q[0] * g.s, g.y - q[1] * g.s]; }); })); });
  return { W: W, H: H, data: img };
};
function inkMask(id) { // ImageData -> ink mask (background = most common colour)
  var W = id.width, H = id.height, d = id.data, hist = {}, best = 0, bg = 0;
  for (var i = 0; i < W * H; i += 7) { var k = ((d[i * 4] >> 4) << 8) | ((d[i * 4 + 1] >> 4) << 4) | (d[i * 4 + 2] >> 4); hist[k] = (hist[k] || 0) + 1; if (hist[k] > best) { best = hist[k]; bg = k; } }
  var br = ((bg >> 8) << 4) + 8, bgc = (((bg >> 4) & 15) << 4) + 8, bb = ((bg & 15) << 4) + 8;
  var m = new Uint8Array(W * H), far = 0, sum = 0, n = 0;
  for (var j = 0; j < W * H; j++) { var dr = d[j * 4] - br, dg = d[j * 4 + 1] - bgc, db = d[j * 4 + 2] - bb, dist = Math.sqrt(dr * dr + dg * dg + db * db); if (dist > far) far = dist; }
  var thr = Math.max(40, far * 0.45);
  for (var q = 0; q < W * H; q++) { var er = d[q * 4] - br, eg = d[q * 4 + 1] - bgc, eb = d[q * 4 + 2] - bb; if (Math.sqrt(er * er + eg * eg + eb * eb) > thr && d[q * 4 + 3] > 64) m[q] = 1; }
  return { W: W, H: H, data: m };
}
function components(M) {
  var W = M.W, H = M.H, d = M.data, lab = new Int32Array(W * H), comps = [], stack = [];
  for (var i = 0; i < W * H; i++) {
    if (!d[i] || lab[i]) continue;
    var c = { x0: W, y0: H, x1: 0, y1: 0, n: 0, px: [] }, id = comps.length + 1; lab[i] = id; stack.push(i);
    while (stack.length) {
      var p = stack.pop(), x = p % W, y = (p - x) / W; c.n++; c.px.push(p);
      if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; var q = Y * W + X; if (d[q] && !lab[q]) { lab[q] = id; stack.push(q); } }
    }
    if (c.n >= 2) comps.push(c);
  }
  return comps;
}
function median(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }
/* ink mask -> lines -> letters, each letter with the marks above, below and inside it */
function analyse(M, rtl) {
  var comps = components(M), W = M.W, H = M.H, rows = new Int32Array(H);
  comps.forEach(function (c) { for (var y = c.y0; y <= c.y1; y++) rows[y] += 1; });
  var bands = [], inb = false, start = 0;
  for (var y = 0; y <= H; y++) { var on = y < H && rows[y] > 0; if (on && !inb) { start = y; inb = true; } else if (!on && inb) { bands.push([start, y - 1]); inb = false; } }
  // merge bands separated by tiny gaps (vowel points just under the letters)
  // thin bands of marks (vowel points below, accents above) join the nearest band of letters
  var bigH = Math.max.apply(null, bands.map(function (b) { return b[1] - b[0] + 1; }).concat([1]));
  var mb = bands.map(function (b) { return b.slice(); }), changed = true;
  while (changed && mb.length > 1) {
    changed = false;
    for (var bi = 0; bi < mb.length; bi++) {
      var h0 = mb[bi][1] - mb[bi][0] + 1, b0 = mb[bi];
      var tallest = Math.max.apply(null, comps.filter(function (c) { return c.y0 >= b0[0] && c.y1 <= b0[1]; }).map(function (c) { return c.y1 - c.y0 + 1; }).concat([0]));
      if (h0 >= 0.45 * bigH && tallest >= 0.5 * bigH) continue;
      var up = bi > 0 ? mb[bi][0] - mb[bi - 1][1] : 1e9, dn = bi < mb.length - 1 ? mb[bi + 1][0] - mb[bi][1] : 1e9;
      var tgt = up <= dn ? bi - 1 : bi + 1, gap = Math.min(up, dn);
      if (gap < 0.6 * bigH) { mb[tgt] = [Math.min(mb[tgt][0], mb[bi][0]), Math.max(mb[tgt][1], mb[bi][1])]; mb.splice(bi, 1); changed = true; break; }
    }
  }
  var lines = [];
  mb.forEach(function (b) {
    var cs = comps.filter(function (c) { return c.y0 >= b[0] && c.y1 <= b[1]; });
    if (!cs.length) return;
    var hmax = Math.max.apply(null, cs.map(function (c) { return c.y1 - c.y0 + 1; }));
    var tall = cs.filter(function (c) { return c.y1 - c.y0 + 1 >= 0.38 * hmax; });
    var top = median(tall.map(function (c) { return c.y0; })), bot = median(tall.map(function (c) { return c.y1; })), bodyH = Math.max(4, bot - top + 1);
    var letters = [], marks = [];
    // a letter drawn in separate bars (Greek capital Xi): wide flat pieces stacked in the same columns
    var flat = cs.filter(function (c) { return (c.x1 - c.x0 + 1) > 0.3 * bodyH && (c.y1 - c.y0 + 1) < 0.34 * bodyH; }), used = {};
    flat.forEach(function (c, i) {
      if (used[i]) return; var grp = [c];
      flat.forEach(function (d2, j) { if (j <= i || used[j]) return; var ov = Math.min(c.x1, d2.x1) - Math.max(c.x0, d2.x0) + 1; if (ov > 0.6 * Math.min(c.x1 - c.x0, d2.x1 - d2.x0)) { grp.push(d2); used[j] = 1; } });
      if (grp.length >= 3) { used[i] = 1; var u = { x0: 1e9, y0: 1e9, x1: -1, y1: -1, n: 0, px: [] }; grp.forEach(function (g) { u.x0 = Math.min(u.x0, g.x0); u.y0 = Math.min(u.y0, g.y0); u.x1 = Math.max(u.x1, g.x1); u.y1 = Math.max(u.y1, g.y1); u.n += g.n; u.px = u.px.concat(g.px); }); if (u.y1 - u.y0 + 1 > 0.6 * bodyH) { cs = cs.filter(function (x) { return grp.indexOf(x) < 0; }); cs.push(u); } }
    });
    cs.forEach(function (c) {
      var h = c.y1 - c.y0 + 1, ov = Math.min(c.y1, bot) - Math.max(c.y0, top) + 1;
      if (ov >= 0.3 * bodyH && h >= 0.25 * bodyH) letters.push(c); else marks.push(c);
    });
    // letters: merge components that share columns (e.g. the separate leg of he)
    letters.sort(function (a, b) { return a.x0 - b.x0; });
    var spans = [];
    letters.forEach(function (c) {
      var last = spans[spans.length - 1];
      if (last) { var ov2 = Math.min(last.x1, c.x1) - Math.max(last.x0, c.x0) + 1, nar = Math.min(last.x1 - last.x0, c.x1 - c.x0) + 1; if (ov2 > 0.45 * nar) { last.comps.push(c); last.x0 = Math.min(last.x0, c.x0); last.x1 = Math.max(last.x1, c.x1); last.y0 = Math.min(last.y0, c.y0); last.y1 = Math.max(last.y1, c.y1); return; } }
      spans.push({ x0: c.x0, x1: c.x1, y0: c.y0, y1: c.y1, comps: [c], above: [], below: [], inside: [], left: [] });
    });
    var puncts = [];
    // marks close together (the dots of tsere, segol, shva) move as one group
    var belowM = marks.filter(function (m) { return (m.y0 + m.y1) / 2 > bot; }), clusters = [];
    belowM.sort(function (a, b) { return a.x0 - b.x0; }).forEach(function (m) {
      var c = clusters[clusters.length - 1];
      if (c && m.x0 - c.x1 < 0.12 * bodyH && Math.abs((m.y0 + m.y1) / 2 - (c.y0 + c.y1) / 2) < 0.35 * bodyH) { c.list.push(m); c.x1 = Math.max(c.x1, m.x1); c.y0 = Math.min(c.y0, m.y0); c.y1 = Math.max(c.y1, m.y1); }
      else clusters.push({ x0: m.x0, x1: m.x1, y0: m.y0, y1: m.y1, list: [m] });
    });
    clusters.forEach(function (c) {
      var cx = (c.x0 + c.x1) / 2, best = null, bd = 1e9;
      spans.forEach(function (sp) { var d = cx < sp.x0 ? sp.x0 - cx : cx > sp.x1 ? cx - sp.x1 : 0; if (d < bd) { bd = d; best = sp; } });
      if (best && bd < bodyH * 0.9) c.list.forEach(function (m) { best.below.push(m); });
    });
    marks = marks.filter(function (m) { return belowM.indexOf(m) < 0; });
    marks.forEach(function (m) {
      var cx = (m.x0 + m.x1) / 2, cy = (m.y0 + m.y1) / 2, best = null, bd = 1e9;
      if (rtl && cy < top && (m.y1 - m.y0) < 0.3 * bodyH && (m.x1 - m.x0) < 0.3 * bodyH) { // a dot above Hebrew letters: holam belongs to the letter to its right
        var cand = spans.filter(function (sp) { return cx >= sp.x0 - 0.3 * bodyH && cx <= sp.x1 + 0.05 * bodyH; });
        if (cand.length) { var pick = cand.reduce(function (a, b) { return Math.abs(cx - (a.x0)) <= Math.abs(cx - (b.x0)) ? a : b; }); pick.above.push(m); return; }
      }
      var over = spans.some(function (sp) { return cx >= sp.x0 - 0.04 * bodyH && cx <= sp.x1 + 0.04 * bodyH; });
      if (!over) { puncts.push(m); return; } // between letters: punctuation (or a breathing before a capital)
      spans.forEach(function (sp) { var d = cx < sp.x0 ? sp.x0 - cx : cx > sp.x1 ? cx - sp.x1 : 0; if (d < bd) { bd = d; best = sp; } });
      if (!best || bd > bodyH * 0.9) return;
      var grp = cy < top ? 'above' : cy > bot ? 'below' : 'inside';
      if (grp === 'inside' && (cx < best.x0 || cx > best.x1)) grp = cy < (top + bot) / 2 ? 'above' : 'below';
      best[grp].push(m);
    });
    // punctuation: small marks between letters, grouped when they share columns
    puncts.sort(function (a, b) { return a.x0 - b.x0; });
    var pg = [];
    puncts.forEach(function (m) { var last = pg[pg.length - 1]; if (last && m.x0 <= last.x1 + 0.08 * bodyH) { last.comps.push(m); last.x1 = Math.max(last.x1, m.x1); last.y0 = Math.min(last.y0, m.y0); last.y1 = Math.max(last.y1, m.y1); } else pg.push({ x0: m.x0, x1: m.x1, y0: m.y0, y1: m.y1, comps: [m], punct: true }); });
    if (rtl) spans.reverse();
    lines.push({ top: top, bot: bot, bodyH: bodyH, spans: spans, puncts: pg });
  });
  return { lines: lines, W: W, H: H, comps: comps };
}
var GX = 16, GY = 26, MX = 12, MY = 10;
function grid(M, pxList, x0, y0, x1, y1, gx, gy) { // pixels -> blurred occupancy grid of the box
  var g = new Float32Array(gx * gy), w = Math.max(1, x1 - x0 + 1), h = Math.max(1, y1 - y0 + 1);
  pxList.forEach(function (p) { var x = p % M.W, y = (p - x) / M.W; if (x < x0 || x > x1 || y < y0 || y > y1) return; var gx2 = Math.min(gx - 1, Math.floor((x - x0) / w * gx)), gy2 = Math.min(gy - 1, Math.floor((y - y0) / h * gy)); g[gy2 * gx + gx2] += 1; });
  var cell = (w / gx) * (h / gy); for (var i = 0; i < g.length; i++) g[i] = Math.min(1, g[i] / cell);
  var o = new Float32Array(gx * gy);
  for (var yy = 0; yy < gy; yy++) for (var xx = 0; xx < gx; xx++) { var s2 = 0, n = 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var X = xx + dx, Y = yy + dy; if (X >= 0 && Y >= 0 && X < gx && Y < gy) { var wt = dx || dy ? 0.5 : 1; s2 += g[Y * gx + X] * wt; n += wt; } } o[yy * gx + xx] = s2 / n; }
  return o;
}
function sim(a, b) { var num = 0, den = 0; for (var i = 0; i < a.length; i++) { num += Math.min(a[i], b[i]); den += Math.max(a[i], b[i]); } return den ? num / den : 0; }
function letterDesc(M, line, sp) {
  var px = []; sp.comps.forEach(function (c) { px = px.concat(c.px); });
  var bh = line.bodyH, y0 = Math.round(line.top - 0.55 * bh), y1 = Math.round(line.bot + 0.55 * bh);
  return { bh: bh, g: grid(M, px, sp.x0, y0, sp.x1, y1, GX, GY), w: (sp.x1 - sp.x0 + 1) / bh, up: (line.top - sp.y0) / bh, dn: (sp.y1 - line.bot) / bh, nc: sp.comps.length };
}
function markDesc(M, line, sp, list) {
  if (!list.length) return null;
  // specks left by anti-aliasing are not separate marks
  var big = Math.max.apply(null, list.map(function (c) { return c.n; }));
  if (list.length > 1) list = list.filter(function (c) { return c.n >= 0.15 * big; });
  var x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, px = [];
  list.forEach(function (c) { x0 = Math.min(x0, c.x0); y0 = Math.min(y0, c.y0); x1 = Math.max(x1, c.x1); y1 = Math.max(y1, c.y1); px = px.concat(c.px); });
  var bh = line.bodyH, cx = ((x0 + x1) / 2 - (sp.x0 + sp.x1) / 2) / Math.max(1, sp.x1 - sp.x0 + 1);
  // a square box around the marks keeps their proportions
  var side = Math.max(x1 - x0, y1 - y0) + 1, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  var sx = 0, sy = 0, sxy = 0, sxx = 0, np2 = px.length; px.forEach(function (p) { var x = p % M.W, y = (p - x) / M.W; sx += x; sy += y; sxy += x * y; sxx += x * x; });
  var vx = sxx / np2 - (sx / np2) * (sx / np2), cov = sxy / np2 - (sx / np2) * (sy / np2), sl = vx > 0.5 ? Math.max(-2, Math.min(2, cov / vx)) : 0;
  return { bh: bh, sl: sl, g: grid(M, px, Math.round(mx - side / 2), Math.round(my - side / 2), Math.round(mx + side / 2), Math.round(my + side / 2), MX, MY), n: list.length, w: (x1 - x0 + 1) / bh, h: (y1 - y0 + 1) / bh, cx: cx, dy: list === sp.below ? (y0 - line.bot) / bh : (line.top - y1) / bh };
}
function markSim(a, b) {
  if (!a && !b) return 1; if (!a || !b) return 0;
  return sim(a.g, b.g) - 1.6 * Math.abs(a.w - b.w) - 1.6 * Math.abs(a.h - b.h) - 0.2 * Math.min(3, Math.abs(a.n - b.n)) - 0.3 * Math.abs(a.cx - b.cx) - 0.3 * Math.abs(a.sl - b.sl);
}
/* templates: every letter and every mark combination is drawn with the studio's fonts and analysed the same way */
var TPL = {};
var HEB_VOWELS = ['ְ', 'ֱ', 'ֲ', 'ֳ', 'ִ', 'ֵ', 'ֶ', 'ַ', 'ָ', 'ֻ'];
var GRK_ABOVE = ['̓', '̔', '́', '̀', '͂', '̓́', '̓̀', '̓͂', '̔́', '̔̀', '̔͂', '̈', '̈́', '̈̀'];
function buildTemplates(script) {
  if (TPL[script]) return TPL[script];
  var sc = SCRIPTS[script], letters = [], marks = [], size = 64;
  [26, 34, 44, 56, 72].forEach(function (sz) { size = sz; buildAt(); });
  var pieces = function (t) { var n = 0; Array.from(t).forEach(function (c) { n += c === '\u0308' ? 2 : /[\u0300-\u036f]/.test(c) ? 1 : 0; }); return n; };
  if (script === 'grk') marks = marks.filter(function (m) { return !m.d || m.grp === 'below' || m.d.n === pieces(m.text); });
  return (TPL[script] = { letters: letters, marks: marks });
  function buildAt() {
  // everything is drawn on lines of ordinary text, so the letter band is measured exactly as it is in a real image
  function line(items) { // items: strings, one per "word"; returns the analysed spans in reading order
    var o = { script: script, size: size, width: 60000 }, M = B.renderMask(items.join(' '), o), A = analyse(M, sc.rtl), Lay = B.layout(items.join(' '), o);
    return { M: M, ln: A.lines[0], lay: Lay };
  }
  function spanAt(R, gl) { // the analysed letter that contains a laid-out glyph
    var bb = bboxOf(gl.key, gl.g); if (!bb || !R.ln) return null;
    var x0 = gl.x + bb[0] * gl.s, x1 = gl.x + bb[2] * gl.s, best = null, bo = 0;
    R.ln.spans.forEach(function (sp) { var ov = Math.min(sp.x1, x1) - Math.max(sp.x0, x0); if (ov > bo) { bo = ov; best = sp; } });
    return best;
  }
  var bases = script === 'heb' ? Array.from('אבגדהוזחטיכךלמםנןסעפףצץקרשת') : script === 'phn' ? Array.from('𐤀𐤁𐤂𐤃𐤄𐤅𐤆𐤇𐤈𐤉𐤊𐤋𐤌𐤍𐤎𐤏𐤐𐤑𐤒𐤓𐤔𐤕') : Array.from('αβγδεζηθικλμνξοπρσςτυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ');
  var punct = script === 'heb' ? ['׃', '׀'] : script === 'phn' ? ['𐤟'] : ['.', ',', '·', ';'];
  // each letter between two ordinary letters, so the line's letter band is the usual one
  var ctx = script === 'heb' ? 'מ' : script === 'phn' ? '𐤌' : 'ν', words = [];
  bases.forEach(function (ch) { words.push(ctx, ch); }); words.push(ctx);
  var L = line(words), gl = L.lay.glyphs.filter(function (g) { return !GL[g.key].glyphs[g.g] || !GL[g.key].glyphs[g.g][2]; });
  bases.forEach(function (ch, i) { var sp = spanAt(L, gl[2 * i + 1]); if (sp) letters.push({ ch: ch, d: letterDesc(L.M, L.ln, sp) }); });
  if (script === 'heb') { var pq = line(['ב׀ב']); if (pq.ln && pq.ln.spans.length === 3) letters.push({ ch: '׀', d: letterDesc(pq.M, pq.ln, pq.ln.spans[1]) }); }
  if (script === 'heb') {
    var carriers = ['ב', 'ל', 'מ', 'נ', 'ד'];
    carriers.forEach(function (c) {
      var items = HEB_VOWELS.map(function (v) { return c + v; }), R = line(items.concat(['שמ']));
      if (!R.ln) return;
      HEB_VOWELS.forEach(function (v, i) { var sp = R.ln.spans[i]; if (sp && sp.below.length) marks.push({ grp: 'below', text: v, d: markDesc(R.M, R.ln, sp, sp.below) }); });
    });
  }
  if (script === 'grk') {
    ['α', 'ε', 'ο', 'ω', 'η', 'ι', 'υ'].forEach(function (c) {
      var ms = GRK_ABOVE.filter(function (m) { return !/̈/.test(m) || /[ιυ]/.test(c); });
      var R = line(ms.map(function (m) { return (c + m).normalize('NFC'); }).concat(['μν']));
      if (!R.ln) return;
      ms.forEach(function (m, i) { var sp = R.ln.spans[i]; if (sp && sp.above.length) marks.push({ grp: 'above', text: m, d: markDesc(R.M, R.ln, sp, sp.above) }); });
    });
    var CAPM = ['\u0313', '\u0314', '\u0313\u0301', '\u0314\u0301', '\u0313\u0300', '\u0314\u0300', '\u0313\u0342', '\u0314\u0342'];
    ['Α', 'Ε', 'Η', 'Ι', 'Ο', 'Υ', 'Ω'].forEach(function (c) {
      var ms = CAPM.filter(function (m) { return c !== 'Υ' || /\u0314/.test(m); }), ws2 = [];
      ms.forEach(function (m) { ws2.push('ν', (c + m).normalize('NFC') + 'ν'); }); ws2.push('ν');
      var R = line(ws2);
      if (!R.ln) return;
      ms.forEach(function (m, i) {
        // the marks stand just before the capital, above the letter band
        var wordSpans = R.ln.spans.filter(function (x) { return true; }), cap = null;
        var glc = R.lay.glyphs.filter(function (g) { var t = GL[g.key].glyphs[g.g]; return t && !t[2] && t[0].normalize('NFD')[0] === c; })[i];
        cap = glc ? spanAt(R, glc) : null; if (!cap) return;
        var grp = R.ln.puncts.filter(function (g) { return g.x1 <= cap.x0 + 2 && g.x1 > cap.x0 - R.ln.bodyH; })[0];
        if (grp) marks.push({ grp: 'cap', text: m, d: markDesc(R.M, R.ln, cap, grp.comps) });
      });
    });
    var R2 = line(['ᾳ', 'ῃ', 'ῳ', 'μν']); if (R2.ln) [0, 1, 2].forEach(function (i) { var sp = R2.ln.spans[i]; if (sp && sp.below.length) marks.push({ grp: 'below', text: 'ͅ', d: markDesc(R2.M, R2.ln, sp, sp.below) }); });
  }
  }
}
B._templates = function (script) { var t = buildTemplates(script); return t.letters.length + t.marks.length; };
function nearSize(list, bh) { var near = list.filter(function (t) { return t.d && t.d.bh >= bh * 0.72 && t.d.bh <= bh * 1.38; }); return near.length ? near : list; }
function classifyLetter(T, d) {
  var res = [];
  nearSize(T.letters, d.bh).forEach(function (t) { var s2 = sim(d.g, t.d.g) - 0.5 * Math.abs(d.w - t.d.w) - 0.6 * Math.abs(d.up - t.d.up) - 0.6 * Math.abs(d.dn - t.d.dn) - 0.12 * Math.min(2, Math.abs(d.nc - t.d.nc)); res.push({ ch: t.ch, s: s2 }); });
  res.sort(function (a, b) { return b.s - a.s; });
  return res;
}
function classifyMarks(T, grp, d, cap) {
  if (!d) return { text: '', s: 1 };
  var best = { text: '', s: -1 };
  var all = [];
  nearSize(T.marks.filter(function (t) { return t.grp === grp; }), d.bh).forEach(function (t) { var s2 = markSim(d, t.d); all.push([t.text, s2]); if (s2 > best.s + 0.02 || (Math.abs(s2 - best.s) <= 0.02 && t.text.length < best.text.length)) best = { text: t.text, s: Math.max(s2, best.s) }; });
  if (B.debugM) { all.sort(function (a, b) { return b[1] - a[1]; }); B.debugM.push([grp, d.w.toFixed(2), d.h.toFixed(2), d.n].concat(all.slice(0, 4).map(function (x) { return escape(x[0]) + ':' + x[1].toFixed(2); }))); }
  return best;
}
function hebAbove(sp, base, line) { // dots above a Hebrew letter: holam, shin dot, sin dot
  if (!sp.above.length) return '';
  var out = '';
  sp.above.forEach(function (m) {
    var h = (m.y1 - m.y0 + 1) / line.bodyH, w = (m.x1 - m.x0 + 1) / line.bodyH;
    if (h > 0.35 || w > 0.35) return; // not a dot: cantillation is not read
    var cx = ((m.x0 + m.x1) / 2 - sp.x0) / Math.max(1, sp.x1 - sp.x0);
    if (base === 'ש') out += cx > 0.5 ? 'ׁ' : 'ׂ';
    else out += 'ֹ';
  });
  return out;
}
function punctText(g, ln, script) {
  var bh = ln.bodyH, h = (g.y1 - g.y0 + 1) / bh, w = (g.x1 - g.x0 + 1) / bh, cy = ((g.y0 + g.y1) / 2 - ln.top) / bh, n = g.comps.length;
  if (script === 'heb') { if (n >= 2 && h > 0.35) return '׃'; if (n === 1 && w > h * 1.3 && cy < 0.5) return '־'; if (n === 1 && h > 0.5) return '׀'; return h > 0.3 ? '׃' : ''; }
  if (script === 'phn') return '𐤟';
  if (g.apostrophe) return '\u02BC';
  // Greek
  if (n >= 2) return ';';
  var comma = (g.y1 - ln.bot) / bh > 0.12;
  if (comma) return ',';
  if (cy < 0.6) return '·';
  return '.';
}
function readMask(M, script) {
  var sc = SCRIPTS[script], T = buildTemplates(script), A = analyse(M, sc.rtl), scores = [], lines = [], unc = 0, nLetters = 0, trailing = '';
  if (!T.letters.length) return { text: '', median: 0, unc: 0, n: 0, lines: 0 };
  A.lines.forEach(function (ln) {
    // 1. letters (two letters that touch are split where the ink is thinnest, if both halves then read well)
    var widths = ln.spans.map(function (sp) { return sp.x1 - sp.x0 + 1; }), mw = median(widths), out = [];
    ln.spans.forEach(function (sp) {
      var r0 = classifyLetter(T, letterDesc(M, ln, sp));
      if (r0[0].s > 0.66 || (sp.x1 - sp.x0 + 1) < 1.3 * mw) { out.push(sp); return; }
      var px = []; sp.comps.forEach(function (c) { px = px.concat(c.px); });
      var col = {}; px.forEach(function (p) { var x = p % M.W; col[x] = (col[x] || 0) + 1; });
      var best = null;
      for (var cx = sp.x0 + Math.round((sp.x1 - sp.x0) * 0.25); cx <= sp.x0 + Math.round((sp.x1 - sp.x0) * 0.75); cx++) {
        var L1 = px.filter(function (p) { return p % M.W < cx; }), R1 = px.filter(function (p) { return p % M.W >= cx; });
        if (L1.length < 4 || R1.length < 4) continue;
        var mk = function (list) { var b = { x0: 1e9, y0: 1e9, x1: -1, y1: -1, px: list }; list.forEach(function (p) { var x = p % M.W, y = (p - x) / M.W; b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y); }); return { x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, comps: [b], above: [], below: [], inside: [] }; };
        var a = mk(L1), b2 = mk(R1), ra = classifyLetter(T, letterDesc(M, ln, a))[0].s, rb = classifyLetter(T, letterDesc(M, ln, b2))[0].s, sc2 = Math.min(ra, rb) - 0.02 * (col[cx] || 0);
        if (!best || sc2 > best.s) best = { s: sc2, a: a, b: b2, m: Math.min(ra, rb) };
      }
      if (best && best.m > r0[0].s + 0.12) {
        ['above', 'below', 'inside'].forEach(function (g) { sp[g].forEach(function (m) { var c = (m.x0 + m.x1) / 2; (c < best.b.x0 ? best.a : best.b)[g].push(m); }); });
        if (sc.rtl) out.push(best.b, best.a); else out.push(best.a, best.b);
      } else out.push(sp);
    });
    ln.spans = out;
    ln.spans.forEach(function (sp) { var r = classifyLetter(T, letterDesc(M, ln, sp)); sp.ch = r[0].ch; sp.score = r[0].s; sp.close = r[1] && r[0].s - r[1].s < 0.02; if (B.debug) B.debug.push([r.slice(0, 3).map(function (x) { return x.ch + x.s.toFixed(2); }).join(' '), sp.x0, sp.x1, sp.comps.length, sp.below.length, sp.inside.length, sp.above.length]); });
    // 2. Hebrew: a dot inside the columns of shin is its shin/sin dot
    if (script === 'heb') ln.spans.forEach(function (sp) {
      sp.above = sp.above.filter(function (m) { var cx = (m.x0 + m.x1) / 2, sh = ln.spans.filter(function (o) { return o !== sp && o.ch === 'ש' && cx >= o.x0 && cx <= o.x1; })[0]; if (sh) { sh.above.push(m); return false; } return true; });
    });
    // 3. Greek: breathings and accents standing before a capital belong to it
    var puncts = ln.puncts.slice();
    if (script === 'grk') puncts = puncts.filter(function (g) {
      if (g.y1 >= ln.top + 0.2 * ln.bodyH) return true;
      var nxt = ln.spans.filter(function (sp) { return sp.x0 >= g.x1 - 2 && sp.x0 - g.x1 < ln.bodyH * 0.6; }).sort(function (a, b) { return a.x0 - b.x0; })[0];
      if (nxt && nxt.ch !== nxt.ch.toLowerCase()) { nxt.capMarks = (nxt.capMarks || []).concat(g.comps); return false; }
      // otherwise it belongs to the nearest letter (a breathing that leans past a narrow iota), unless it stands clear after a word
      var near = null, nd = 1e9;
      ln.spans.forEach(function (sp) { var d = g.x1 < sp.x0 ? sp.x0 - g.x1 : g.x0 > sp.x1 ? g.x0 - sp.x1 : 0; if (d < nd) { nd = d; near = sp; } });
      var after = ln.spans.filter(function (sp) { return sp.x1 <= g.x0 + 1 && g.x0 - sp.x1 < ln.bodyH * 0.25; })[0];
      var before = ln.spans.filter(function (sp) { return sp.x0 >= g.x1 - 1 && sp.x0 - g.x1 < ln.bodyH * 0.25; })[0];
      if (near && nd < ln.bodyH * 0.3 && !(after && !before)) { near.above = near.above.concat(g.comps); return false; }
      g.apostrophe = true; return true; // after a word: the elision mark
    });
    var seq = ln.spans.concat(puncts);
    seq.sort(function (a, b) { return sc.rtl ? b.x1 - a.x1 : a.x0 - b.x0; });
    var words = [], cur = '', prev = null;
    seq.forEach(function (sp) {
      if (sp.punct) { var pt = punctText(sp, ln, script); if (pt === '־') { cur += pt; prev = null; return; } if (script === 'phn') { if (cur) words.push(cur); cur = ''; words.push(pt); prev = null; return; } cur += pt; prev = sp; return; }
      if (prev) { var gap = sc.rtl ? prev.x0 - sp.x1 : sp.x0 - prev.x1; if (gap > ln.bodyH * 0.42) { words.push(cur); cur = ''; } }
      var ch = sp.ch; scores.push(sp.score); nLetters++;
      if (sp.score < 0.55 || sp.close) unc++;
      var marks = '';
      if (script === 'heb') {
        if (sp.inside.length && ch === 'ך') { var km = classifyMarks(T, 'below', markDesc(M, ln, sp, sp.inside)); marks += km.s > 0.2 ? km.text : '\u05B0'; }
        else if (sp.inside.length) marks += '\u05BC';
        marks += hebAbove(sp, ch, ln);
        var bl = sp.below.filter(function (m) { return (m.y1 - m.y0 + 1) / ln.bodyH < 0.45; });
        if (bl.length) { var bm = classifyMarks(T, 'below', markDesc(M, ln, sp, bl)); if (bm.s > 0.2) marks += bm.text; else unc++; }
        if (ch === 'ו' && marks === 'ֹ') { ch = 'וֹ'; marks = ''; }
      } else if (script === 'grk') {
        if (sp.above.length) {
          var md = markDesc(M, ln, sp, sp.above), am = classifyMarks(T, 'above', md, false);
          if (ch !== ch.toLowerCase()) { var am2 = classifyMarks(T, 'cap', md, false); if (am2.s > am.s) am = am2; }
          if (am.s > 0.15) marks += am.text; else unc++;
        }
        if (sp.capMarks) { var cm = classifyMarks(T, 'cap', markDesc(M, ln, sp, sp.capMarks), false); if (cm.s > 0.1) marks += cm.text; else unc++; }
        if (sp.below.length) { if (/[αηωΑΗΩ]/.test(ch)) marks += '\u0345'; else trailing = ','; }
      }
      if (script === 'grk') marks = Array.from(marks).sort(function (a, b) { var r = function (c) { return /[\u0313\u0314]/.test(c) ? 0 : /\u0308/.test(c) ? 1 : /\u0345/.test(c) ? 3 : 2; }; return r(a) - r(b); }).join('');
      cur += (ch + marks).normalize('NFC') + trailing;
      trailing = '';
      prev = sp;
    });
    if (cur) words.push(cur);
    lines.push(words.join(' '));
  });
  var text = lines.join('\n');
  if (script === 'grk') text = B.finalSigma(text);
  return { text: text, median: median(scores), unc: unc, n: nLetters, lines: A.lines.length };
}
/* Read text from an image (ImageData) drawn with the studio's fonts: script 'heb' | 'grk' | 'phn' | 'auto' */
B.readImage = function (id, script) {
  var M = inkMask(id), ink = 0;
  for (var i = 0; i < M.data.length; i++) ink += M.data[i];
  if (ink / M.data.length > 0.35) return { ok: false, reason: 'Too much of the image is ink for written text (it looks like a photograph or texture).' };
  if (ink < 20) return { ok: false, reason: 'No writing was found in the image.' };
  var tries = script && script !== 'auto' ? [script] : ['heb', 'grk', 'phn'], best = null;
  tries.forEach(function (sc) { var r = readMask(M, sc); if (!best || r.median > best.median) { best = r; best.script = sc; } });
  if (!best.n) return { ok: false, reason: 'No letters were found in the image.' };
  if (best.median < 0.6) return { ok: false, reason: 'The shapes do not match the studio\'s Hebrew, Greek or Paleo-Hebrew letters closely enough (median match ' + best.median.toFixed(2) + '). The reader reads text set in the studio\'s fonts; it does not guess.', median: best.median };
  return finishRead({ ok: true, text: best.text, script: best.script, how: 'image', confidence: Math.round(best.median * 100) / 100, uncertain: best.unc, letters: best.n });
};
B._readMask = readMask; B._analyse = analyse; B._tpl = function (s) { return buildTemplates(s); };

root.BL = B;
if (typeof module !== 'undefined') module.exports = B;
})(typeof window !== 'undefined' ? window : this);
