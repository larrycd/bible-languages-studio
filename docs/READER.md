# Reader and test results

## SVG

The studio's SVGs are read exactly from the glyph outlines and pen positions (never from embedded metadata). Marks with identical outlines are told apart by reshaping each candidate with the base letter and comparing the offsets. In a 3,000-word random sample (seed 4242) every word came back exactly: Hebrew with vowels and cantillation 1,022/1,022, Paleo-Hebrew 1,022/1,022, Greek NT 663/663, Septuagint 1,315/1,315.

## PNG and JPEG

1. The image is turned into an ink mask; text lines and letter shapes are found.
2. Each letter is matched against templates drawn by the same fonts at five sizes; vowel points, dagesh, shin/sin dots, breathings, accents and iota subscripts are matched separately and attached to the right letter.
3. The script (Hebrew, Paleo-Hebrew or Greek) is chosen automatically. Images whose shapes do not match well enough, or that are mostly ink (photographs, textures), are refused.

Cantillation marks are **not** read from images: they are too small and too many look alike. Export SVG to keep them.

### Unseen test (80 random verses, seed 9090, never used for tuning)

PNG and JPEG, 0.6× to 2× scale, four styles. Full output: [`test/results-unseen.txt`](../test/results-unseen.txt).

| Script | Exact | All letters right | Misses flagged as uncertain |
|---|---|---|---|
| Hebrew with vowels | 15 / 20 | 18 / 20 | 5 / 5 |
| Paleo-Hebrew | 20 / 20 | 20 / 20 | – |
| Greek NT | 16 / 20 | 18 / 20 | 4 / 4 |
| Septuagint Greek | 14 / 20 | 17 / 20 | 6 / 6 |

Most misses are a single small mark: a Greek breathing or accent, a missing or doubled Hebrew vowel, or a comma read as an iota subscript. At 0.75× Hebrew ח and ת were sometimes confused, and two small Greek lines had one garbled word. Larger images read better.

### Refusal

All 10 non-Bible images in `test/neg/` (Latin text, noise, an icon, hieroglyphs, cuneiform, pIqaD, Heptapod) were refused. These images were also used to set the threshold, so this is not an independent test.
