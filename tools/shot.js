const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto('file://' + __dirname + '/info.html'); await p.waitForTimeout(800);
  await p.screenshot({ path: __dirname + '/Bible-Languages-Studio-How-It-Works.png', fullPage: true }); await b.close(); })();
