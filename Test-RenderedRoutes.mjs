import { readFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const baseUrl = (process.argv[2] || 'http://127.0.0.1:4174').replace(/\/$/, '');
const manifest = JSON.parse(readFileSync(new URL('./mirror-manifest.json', import.meta.url), 'utf8'));
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'phone', width: 390, height: 844 },
];

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const failures = [];
const results = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });

    for (const item of manifest) {
      const route = item.Route === '/' ? '/' : item.Route.endsWith('.html') ? item.Route : `${item.Route}/`;
      const url = `${baseUrl}${route}`;

      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(route === '/' ? 900 : 100);
        const state = await page.evaluate(() => {
          const title = document.querySelector('.entry-title, .entry-content h1');
          const titleStyle = title ? getComputedStyle(title) : null;
          const headerLogo = document.querySelector('.site-title a');
          const logoRect = headerLogo?.getBoundingClientRect();
          const heroLogo = document.querySelector('.alpha-after-dark__logo');
          const heroLogoRect = heroLogo?.getBoundingClientRect();
          const localBrokenImages = [...document.images].filter((image) => {
            if (!image.complete || image.naturalWidth > 0) return false;
            const source = image.currentSrc || image.src;
            return source.startsWith(location.origin) || source.includes('/assets/');
          }).length;

          return {
            statusTitle: document.title,
            viewportWidth: document.documentElement.clientWidth,
            documentWidth: document.documentElement.scrollWidth,
            localBrokenImages,
            headerLogoVisible: Boolean(logoRect && logoRect.width > 0 && logoRect.height > 0),
            heroLogoVisible: Boolean(heroLogoRect && heroLogoRect.width > 0 && heroLogoRect.height > 0),
            headerPresent: Boolean(document.querySelector('.site-header')),
            titleFont: titleStyle?.fontFamily || null,
            titleWeight: titleStyle?.fontWeight || null,
            titleLineHeight: titleStyle?.lineHeight || null,
            visibleStreetViewLabels: [...document.querySelectorAll('.street-view-link')]
              .filter((link) => link.textContent.trim().toLowerCase() === 'street view').length,
          };
        });

        if (!response || response.status() !== 200) failures.push(`${viewport.name} ${route}: HTTP ${response?.status() ?? 'none'}`);
        if (state.documentWidth > state.viewportWidth) failures.push(`${viewport.name} ${route}: horizontal overflow ${state.documentWidth}/${state.viewportWidth}`);
        if (state.localBrokenImages) failures.push(`${viewport.name} ${route}: ${state.localBrokenImages} broken local image(s)`);
        const headerlessLandingTemplate = route === '/landing-page/' && !state.headerPresent;
        if (!state.headerLogoVisible && !headerlessLandingTemplate && route !== '/') failures.push(`${viewport.name} ${route}: header logo is not visible`);
        if (route === '/' && state.headerLogoVisible) failures.push(`${viewport.name} ${route}: redundant home header logo is visible`);
        if (route === '/' && !state.heroLogoVisible) failures.push(`${viewport.name} ${route}: home hero logo is not visible`);
        if (state.visibleStreetViewLabels) failures.push(`${viewport.name} ${route}: standalone Street View label remains`);

        if (route === '/contact-us-alpha-analytical-laboratories-inc/') {
          const locations = [
            ['Ukiah', 'ukiah'],
            ['Petaluma', 'petaluma'],
            ['Elk Grove', 'elk-grove'],
            ['Livermore', 'livermore'],
            ['Signal Hill', 'signal-hill'],
            ['Vista', 'vista'],
          ];

          for (const [buttonName, panelName] of locations) {
            await page.getByRole('button', { name: buttonName, exact: true }).click();
            const locatorState = await page.evaluate((expectedPanel) => {
              const heading = document.querySelector(`[data-location-panel="${expectedPanel}"] h3`);
              return ({
                activePins: document.querySelectorAll('.alpha-map-pin.is-active').length,
                visiblePanels: [...document.querySelectorAll('[data-location-panel]')]
                  .filter((panel) => !panel.hidden)
                  .map((panel) => panel.dataset.locationPanel),
                placeholderHidden: document.querySelector('[data-location-placeholder]')?.hidden,
                headingFitsOneLine: Boolean(heading && heading.scrollWidth <= heading.clientWidth + 1 && getComputedStyle(heading).whiteSpace === 'nowrap'),
              });
            }, panelName);

            if (locatorState.activePins !== 1 || locatorState.visiblePanels.length !== 1 || locatorState.visiblePanels[0] !== panelName || !locatorState.placeholderHidden) {
              failures.push(`${viewport.name} ${route}: ${buttonName} did not release only its matching location panel`);
            }
            if (!locatorState.headingFitsOneLine) failures.push(`${viewport.name} ${route}: ${buttonName} location heading does not fit on one line`);
          }
        }

        if (route === '/regulatory/') {
          const agencies = ['epa', 'drinking-water', 'calrecycle', 'water-board', 'dtsc', 'carb'];
          const initialPlaceholderVisible = await page.locator('[data-agency-placeholder]').isVisible();
          if (!initialPlaceholderVisible) failures.push(`${viewport.name} ${route}: sealed agency placeholder is not visible initially`);

          for (const agency of agencies) {
            await page.locator(`[data-agency-target="${agency}"]`).click();
            await page.waitForTimeout(720);
            const agencyState = await page.evaluate((expectedPanel) => {
              const preview = document.querySelector(`[data-agency-panel="${expectedPanel}"] .agency-browser-preview`);
              return {
                activeTabs: document.querySelectorAll('.agency-tab.is-active').length,
                visiblePanels: [...document.querySelectorAll('[data-agency-panel]')]
                  .filter((panel) => !panel.hidden)
                  .map((panel) => panel.dataset.agencyPanel),
                placeholderHidden: document.querySelector('[data-agency-placeholder]')?.hidden,
                placeholderDisplayed: getComputedStyle(document.querySelector('[data-agency-placeholder]')).display !== 'none',
                previewTarget: preview?.getAttribute('target'),
                previewRel: preview?.getAttribute('rel') || '',
                logoLoaded: Boolean(document.querySelector(`[data-agency-target="${expectedPanel}"] img`)?.naturalWidth),
                transientArtifacts: document.querySelectorAll('.agency-signal, .agency-transfer-mark').length,
              };
            }, agency);

            if (agencyState.activeTabs !== 1 || agencyState.visiblePanels.length !== 1 || agencyState.visiblePanels[0] !== agency || !agencyState.placeholderHidden || agencyState.placeholderDisplayed) {
              failures.push(`${viewport.name} ${route}: ${agency} did not release only its matching agency dossier`);
            }
            if (agencyState.previewTarget !== '_blank' || !agencyState.previewRel.includes('noopener') || !agencyState.previewRel.includes('noreferrer')) {
              failures.push(`${viewport.name} ${route}: ${agency} official-site preview is not safely opened in a new tab`);
            }
            if (!agencyState.logoLoaded) failures.push(`${viewport.name} ${route}: ${agency} agency logo did not load`);
            if (agencyState.transientArtifacts) failures.push(`${viewport.name} ${route}: ${agency} transfer animation did not clean up`);
          }
        }

        results.push({ viewport: viewport.name, route, ...state });
      } catch (error) {
        failures.push(`${viewport.name} ${route}: ${error.message}`);
      }
    }

    await page.close();
  }

  if (failures.length) {
    console.error(JSON.stringify({ status: 'FAIL', failures }, null, 2));
    process.exitCode = 1;
  } else {
    const titleStyles = [...new Set(results.filter((result) => result.titleFont).map((result) => `${result.titleFont}|${result.titleWeight}|${result.titleLineHeight}`))];
    console.log(JSON.stringify({
      status: 'PASS',
      routes: manifest.length,
      renderedChecks: results.length,
      viewports,
      titleStyleVariants: titleStyles,
      horizontalOverflow: 0,
      brokenLocalImages: 0,
      standaloneStreetViewLabels: 0,
    }, null, 2));
  }
} finally {
  await browser.close();
}
