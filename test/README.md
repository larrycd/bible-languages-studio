# Tests

Install the test tools once: `npm install harfbuzzjs@0.4.12 playwright` (and `npx playwright install chromium`).

- `node rt.js`: SVG read-back of sample verses.
- `node corpusrt.js 3000 4242`: SVG read-back of random words from all four texts (Hebrew with cantillation, Paleo-Hebrew, NT, LXX). The README figure (4,022 / 4,022) is this run.
- `node imgtest.js fresh.json`: render verses in Chromium, export PNG/JPEG and read them back. `fresh.json` is the 80-case set reported in the README (seed 9090, never used for tuning); `results-unseen.txt` is its output. `dev2.json` is the development set used while tuning. Make new cases with `node gencases.js 80 1234 > new.json`.
- `node neg.js`: check that the non-Bible images in `neg/` are refused.
- The studio's own **Self-test** tab runs the built-in checks in the browser.
