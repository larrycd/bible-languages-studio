# Credits and licences

Bible Languages Studio software (engine, studio, server, installer, build tools, infographic) © 2026 Larry Dalton.

It includes third-party material, each under its own licence. Licence texts and change notes are in `src/app/licenses/`.

| Component | Where | Licence |
|---|---|---|
| **STEPBible Data** ([github.com/STEPBible/STEPBible-Data](https://github.com/STEPBible/STEPBible-Data)), www.STEPBible.org based on work at Tyndale House Cambridge: TAHOT (Westminster Leningrad Codex with OSHB morphology), TAGNT (SBL Greek New Testament words), TBESG (Abbott-Smith based Greek lexicon), TBESH (lemma, transliteration, part of speech and gloss only) | `src/app/data/text/ot_*.json`, `nt_*.json`, `src/app/data/lex/heb.json`, `grk.json` and the indexes built from them | CC BY 4.0 |
| **Swete's Septuagint**, First1KGreek transcription with generated morphology, via the QuantForge LXX project | `src/app/data/text/lxx_*.json` and the Greek forms index | CC BY-SA 4.0 |
| **Brown-Driver-Briggs Hebrew Lexicon** (unabridged, CSV by Eliran Wong) | `src/app/data/lex/bdb_*.json` | Public domain |
| **Noto Serif Hebrew, Noto Serif (Latin + Greek subset), Noto Sans Phoenician**, © The Noto Project Authors | `src/app/fonts/`; outlines also used in `src/app/data/glyphs.json` | SIL Open Font License 1.1 |
| **HarfBuzz** (harfbuzzjs 0.4.12) text shaper | `src/app/vendor/` | MIT (Old MIT for HarfBuzz) |
| **CMU Pronouncing Dictionary**, © Carnegie Mellon University | `src/app/data/cmu.tsv` | BSD (2-clause style) |

Notes

- The TBESH definitions column (Abridged BDB by Online Bible) is **not** included; it needs separate permission. Hebrew definitions come from the public-domain unabridged BDB.
- STEPBible asks that people looking for the raw data be pointed to [github.com/STEPBible](https://github.com/STEPBible). The files here are converted, indexed JSON for the studio, not the raw data; for the original tables use the STEPBible repository.
- Because the Septuagint files are derived from CC BY-SA material, `src/app/data/text/lxx_*.json` and `src/app/data/lex/forms_grk.json` are shared under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The changes made are listed in `src/app/licenses/LXX-CC-BY-SA-4.0.txt`.
- Rahlfs' Septuagint was **not** used (its CCAT distribution requires a user declaration).
