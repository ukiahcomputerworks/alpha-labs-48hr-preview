import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const base = (process.argv[2] || 'http://127.0.0.1:4175').replace(/\/$/, '');
const inventory = JSON.parse(readFileSync(new URL('./client-resource-inventory.json', import.meta.url)));
const expected = inventory.documents.map(item => item.url).sort();
const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try {
  for (const width of [1440,390,320]) {
    const page = await browser.newPage({viewport:{width,height:1000}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base+'/forms/',{waitUntil:'networkidle'});
    const documents = await page.locator('.client-kit a').evaluateAll(links=>links.map(link=>link.href).filter(href=>/\.(pdf|xlsx?)$/i.test(href)).sort());
    assert.deepEqual(documents,expected,'Every original customer document must remain available exactly once in the kit');
    for (const id of ['billing','service-guides','bottled-water','public-water','homeowners','wastewater-soil','lab-documents']) {
      const folder = page.locator('#'+id);
      await folder.locator('summary').focus();
      await page.keyboard.press('Enter');
      assert.equal(await folder.getAttribute('open'),'','Keyboard opens '+id);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),true,'No overflow with '+id+' open at '+width);
      await page.keyboard.press('Enter');
    }
    await page.locator('.kit-routes a[href="#billing"]').click();
    await page.waitForFunction(()=>document.querySelector('#billing').open);
    assert.equal(await page.locator('#billing').getAttribute('open'),'');
    await page.locator('#billing summary').click();
    await page.locator('.kit-routes a[href="#billing"]').click();
    await page.waitForFunction(()=>document.querySelector('#billing').open);
    assert.equal(await page.locator('#billing').getAttribute('open'),'','A repeated shortcut must reopen its folder');
    await page.goto(base+'/forms/#hazardous-waste',{waitUntil:'networkidle'});
    assert.equal(await page.locator('#wastewater-soil').getAttribute('open'),'');
    const top = await page.locator('#hazardous-waste').evaluate(el=>el.getBoundingClientRect().top);
    assert.ok(top>=-1 && top<1000,'Deep link reveals and scrolls to the requested document');
    await page.screenshot({path:'C:/Users/Admin/AppData/Local/Temp/alpha-kit-open-'+width+'.png'});
    await page.goto(base+'/forms/',{waitUntil:'networkidle'});
    await page.screenshot({path:'C:/Users/Admin/AppData/Local/Temp/alpha-kit-top-'+width+'.png'});
    assert.deepEqual(errors,[],'No script errors');
    await page.close();
  }
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await page.goto(base+'/forms/#homeowners',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#homeowners').getAttribute('open'),'');
  assert.equal(await page.locator('#homeowners .kit-folder__body').evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.close();
  console.log('PASS: 28 original documents, seven folders, keyboard controls, repeated shortcuts, direct resource links, reduced motion, and 1440/390/320 layouts.');
} finally {await browser.close();}
