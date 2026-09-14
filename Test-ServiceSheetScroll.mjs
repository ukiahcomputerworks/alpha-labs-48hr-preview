import { chromium } from 'file:///C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://127.0.0.1:4175';
const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
  for (const width of [1440,390]) {
    const page = await browser.newPage({viewport:{width,height:844}});
    for (const route of ['soil-sludge-sediment-haz-waste-characterization','drinking-bottled-water-program','wastewater-recycled-water-storm-water-ground-water-program-work']) {
      await page.goto(`${base}/${route}/`,{waitUntil:'networkidle'});
      const sheets = page.locator('.service-sheet-scroll');
      assert.ok(await sheets.count());
      for (let i=0;i<await sheets.count();i++) {
        const sheet=sheets.nth(i);
        await sheet.scrollIntoViewIfNeeded();
        await sheet.locator('img').evaluate(img=>img.decode());
        const result=await sheet.evaluate(el=>{
          const img=el.querySelector('img');
          const expected=Number(img.getAttribute('width'))||img.naturalWidth;
          el.scrollLeft=el.scrollWidth;
          const rect=el.getBoundingClientRect();
          return {expected,actual:img.getBoundingClientRect().width,contained:rect.left>=0 && rect.right<=innerWidth,overflow:el.scrollWidth>el.clientWidth,scrolled:el.scrollLeft>0,pageOverflow:document.documentElement.scrollWidth>innerWidth};
        });
        assert.ok(Math.abs(result.expected-result.actual)<=2,JSON.stringify(result));
        assert.equal(result.pageOverflow,false);
        assert.equal(result.contained,true,JSON.stringify(result));
        if(width===390) assert.ok(result.overflow && result.scrolled);
        if(result.overflow) {
          await sheet.evaluate(el=>el.scrollLeft=0);
          await sheet.focus();
          await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(250);
          assert.ok(await sheet.evaluate(el=>el.scrollLeft>0));
        }
      }
      if(route.startsWith('soil')) {
        await sheets.first().scrollIntoViewIfNeeded();
        await sheets.first().evaluate(el=>el.scrollLeft=0);
        await page.screenshot({path:`C:/Users/Admin/AppData/Local/Temp/alpha-sheet-${width}.png`});
      }
    }
    await page.close();
  }
  console.log('PASS: all 12 service sheets retain authored width, scroll horizontally and via keyboard, and cause no page overflow at desktop and phone widths.');
} finally { await browser.close(); }
