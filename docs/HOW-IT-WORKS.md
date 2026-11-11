# How it works

Bible Languages Studio is a single web page (`src/app/index.html` + `engine.js`) served on your own computer by a small PowerShell server on port 8769. Nothing is sent over the internet.

## Texts

| Text | Source | Notes |
|---|---|---|
| Hebrew OT | STEPBible TAHOT (Westminster Leningrad Codex, OSHB morphology) | Every word with its morpheme splits, transliteration, gloss, extended Strong's number and morphology code. |
| Greek NT | STEPBible TAGNT, filtered to the SBL Greek New Testament | Gloss, Strong's number, Robinson morphology. |
| Septuagint | Swete's edition (First1KGreek transcription), QuantForge LXX morphology | 55 books. **Ecclesiastes is missing** from this source. It is an OCR transcription: the build removes stray digits and Latin look-alike letters and unifies elision marks, but some OCR errors remain. Psalm numbering follows the Septuagint; the side-by-side view maps it to the Hebrew. |

`tools/build_data.py` turns the sources into one JSON file per book (`chapter → verse → words`), the dictionaries and the indexes (English → lemma, Hebrew → Septuagint Greek from Abbott-Smith's "in LXX" notes, attested word forms, concordance).

## Dictionaries

- **Hebrew and Aramaic:** STEPBible TBESH for lemma, transliteration, part of speech and gloss; the full **unabridged Brown-Driver-Briggs** (public domain) for definitions, with verse references made clickable.
- **Greek:** STEPBible TBESG, based on **Abbott-Smith**, *A Manual Greek Lexicon of the New Testament*.

## Scripts and drawing

Text is shaped with HarfBuzz (WebAssembly) using Noto Serif Hebrew, Noto Serif (Greek) and Noto Sans Phoenician, so vowels, cantillation, dagesh, breathings and accents are placed by the fonts' own rules. Paleo-Hebrew is the 22-letter alphabet of the Siloam inscription; final forms, vowels and cantillation are dropped, and words are separated with the ancient word divider.

Each exported SVG draws every glyph as a path with its pen position, so the reader can rebuild the exact text later.

## Translation drafts

The drafts are rule-based. Each English word is looked up in the dictionaries (more common words first), and then given **a form the Bible actually uses** for the grammar needed: a Hebrew perfect for the past, a construct form before "of", a suffix for "my", an article-prefixed form for "the"; a Greek accusative for an object, an aorist for the past, and so on. Hebrew drafts put the verb first and mark a definite object with אֶת; "is" becomes a nominal sentence. Greek drafts use articles, cases and εἰμί.

They are a **starting point**, not a fluent translation: idioms, word order nuances, imperatives and most subordinate clauses are not handled. Each draft shows a confidence and how every word was chosen.
