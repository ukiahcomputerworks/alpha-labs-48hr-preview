import { readFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const baseUrl = (process.argv[2] || 'http://127.0.0.1:4174').replace(/\/$/, '');
const manifest = JSON.parse(readFileSync(new URL('./mirror-manifest.json', import.meta.url), 'utf8'));
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'compact-desktop', width: 1440, height: 800 },
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
    const page = await browser.newPage({ viewport, hasTouch: viewport.name === 'phone' });

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

        if (route === '/') {
          const homeStoryState = await page.evaluate(() => {
            const hero = document.querySelector('.alpha-after-dark');
            const cta = document.querySelector('[data-home-business-cta]');
            const ctaStyle = cta && getComputedStyle(cta);
            const homeHeading = document.querySelector('.entry-content > h1');
            const specsHeading = document.querySelector('.entry-content > h2');
            const bodyCopy = [...document.querySelectorAll('.entry-content > p, .entry-content li')];
            const actionCards = [...document.querySelectorAll('.alpha-action-rail > a')];
            const referenceH1 = document.createElement('h1');
            const referenceH2 = document.createElement('h2');
            referenceH1.style.cssText = referenceH2.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none';
            document.body.append(referenceH1, referenceH2);
            const homeHeadingStyle = homeHeading && getComputedStyle(homeHeading);
            const specsHeadingStyle = specsHeading && getComputedStyle(specsHeading);
            const referenceH1Size = getComputedStyle(referenceH1).fontSize;
            const referenceH2Size = getComputedStyle(referenceH2).fontSize;
            const bodyFontSize = parseFloat(getComputedStyle(document.body).fontSize);
            const bodyCopyReadable = bodyCopy.every((node) => {
              const style = getComputedStyle(node);
              return style.color === 'rgb(255, 255, 255)' && parseFloat(style.fontSize) > bodyFontSize;
            });
            const actionRailTreatment = actionCards.length === 4 && actionCards.every((card) => {
              const numberStyle = getComputedStyle(card.querySelector('.alpha-action-rail__number'));
              const promptStyle = getComputedStyle(card.querySelector('strong'));
              const supportingStyle = getComputedStyle(card.querySelector('small'));
              return numberStyle.backgroundImage.includes('gradient')
                && promptStyle.backgroundImage.includes('gradient')
                && numberStyle.webkitTextFillColor === 'rgba(0, 0, 0, 0)'
                && promptStyle.webkitTextFillColor === 'rgba(0, 0, 0, 0)'
                && supportingStyle.color === 'rgb(255, 255, 255)'
                && parseFloat(supportingStyle.fontSize) >= 13;
            });
            const actionRailStaggered = new Set(actionCards.map((card) => getComputedStyle(card.querySelector('strong')).animationDelay)).size === 4;
            referenceH1.remove();
            referenceH2.remove();
            return {
              heroTitleMarkup: hero?.querySelector('h1')?.innerHTML || '',
              storyText: document.querySelector('.entry-content')?.textContent.replace(/\s+/g, ' ').trim() || '',
              ctaHref: cta?.href || '',
              ctaIsGold: Boolean(ctaStyle && ctaStyle.backgroundImage.includes('gradient')),
              ctaIsAngled: Boolean(ctaStyle && ctaStyle.clipPath !== 'none'),
              headingsAreGold: Boolean(homeHeadingStyle && specsHeadingStyle && homeHeadingStyle.backgroundImage.includes('gradient') && specsHeadingStyle.backgroundImage.includes('gradient') && homeHeadingStyle.webkitTextFillColor === 'rgba(0, 0, 0, 0)' && specsHeadingStyle.webkitTextFillColor === 'rgba(0, 0, 0, 0)'),
              headingSizesPreserved: Boolean(homeHeadingStyle && specsHeadingStyle && homeHeadingStyle.fontSize === referenceH1Size && specsHeadingStyle.fontSize === referenceH2Size),
              bodyCopyReadable,
              actionRailTreatment,
              actionRailStaggered,
            };
          });
          if (homeStoryState.heroTitleMarkup !== "The science is serious.<br><span>The experience doesn't have to be.</span>") failures.push(`${viewport.name} ${route}: approved Alpha After Dark hero changed`);
          if (!homeStoryState.storyText.includes("Since 1975, Alpha Labs has been California’s quiet powerhouse") || !homeStoryState.storyText.includes("We don’t just run tests; we craft certainty.")) failures.push(`${viewport.name} ${route}: approved homepage story is incomplete`);
          if (!homeStoryState.ctaHref.endsWith('/contact-us-alpha-analytical-laboratories-inc/') || !homeStoryState.ctaIsGold || !homeStoryState.ctaIsAngled) failures.push(`${viewport.name} ${route}: homepage business CTA is not the shared gold angled control`);
          if (!homeStoryState.headingsAreGold || !homeStoryState.headingSizesPreserved) failures.push(`${viewport.name} ${route}: homepage headings are not gold or their established sizes changed`);
          if (!homeStoryState.bodyCopyReadable) failures.push(`${viewport.name} ${route}: homepage body copy is not solid white and larger than the base text`);
          if (!homeStoryState.actionRailTreatment || !homeStoryState.actionRailStaggered) failures.push(`${viewport.name} ${route}: homepage action rail is missing the gold-and-white treatment or independent shimmer timing`);
        }

        if (route === '/contact-us-alpha-analytical-laboratories-inc/') {
          const mapWidth = await page.locator('.california-map').evaluate((map) => map.getBoundingClientRect().width);
          const expectedMapWidth = viewport.name === 'phone' ? 320.32 : 358.4;
          if (Math.abs(mapWidth - expectedMapWidth) > 1) {
            failures.push(`${viewport.name} ${route}: California locator width is ${mapWidth}px instead of ${expectedMapWidth}px`);
          }

          const locations = [
            ['Ukiah', 'ukiah', 'ELAP #1551', 'tel:+17074680401', 'pano=hrSOhWrCACuB3DL7BAOeWw'],
            ['Petaluma', 'petaluma', 'ELAP #2303', 'tel:+17077693128', 'pano=6tT44-bsUzYURf0uz4lkwg'],
            ['Elk Grove', 'elk-grove', 'ELAP #2922', 'tel:+19166865190', 'pano=Kzeu8duDrdPRLF1ls2HtdQ'],
            ['Livermore', 'livermore', 'ELAP #2728', 'tel:+19258286226', 'pano=eiwmjrYIy4pXrqJ8vMRZyg'],
            ['Signal Hill', 'signal-hill', 'ELAP #3091', 'tel:+14242675032', 'pano=ADsf5U4F_86DB1IFNYfwpA'],
            ['Vista', 'vista', 'ELAP #3055', 'tel:+17605363352', 'pano=PBBjY1xAnGrsFhH8jSf_cA'],
          ];

          for (const [buttonName, panelName, elap, phoneHref, streetNeedle] of locations) {
            await page.getByRole('button', { name: buttonName, exact: true }).click();
            await page.waitForTimeout(430);
            const locatorState = await page.evaluate((expectedPanel) => {
              const heading = document.querySelector(`[data-location-panel="${expectedPanel}"] h3`);
              const panel = document.querySelector(`[data-location-panel="${expectedPanel}"]`);
              const ledger = document.querySelector('[data-location-ledger]');
              const uvInk = [...panel.querySelectorAll('.uv-ink')];
              return ({
                activePins: document.querySelectorAll('.alpha-map-pin.is-active').length,
                visiblePanels: [...document.querySelectorAll('[data-location-panel]')]
                  .filter((candidate) => candidate.dataset.locationState === 'active')
                  .map((panel) => panel.dataset.locationPanel),
                placeholderHidden: document.querySelector('[data-location-placeholder]')?.getAttribute('aria-hidden') === 'true',
                headingFitsOneLine: Boolean(heading && heading.scrollWidth <= heading.clientWidth + 1 && getComputedStyle(heading).whiteSpace === 'nowrap'),
                ledgerState: ledger?.dataset.locationState,
                uvMode: ledger?.dataset.uvMode,
                activePanelExposed: panel?.getAttribute('aria-hidden') === 'false' && !panel?.inert,
                inactivePanelsProtected: [...document.querySelectorAll('[data-location-panel]')].filter((candidate) => candidate !== panel).every((candidate) => candidate.getAttribute('aria-hidden') === 'true' && candidate.inert),
                uvInkCount: uvInk.length,
                uvInkFullyVisible: uvInk.every((ink) => getComputedStyle(ink).webkitTextFillColor !== 'rgba(0, 0, 0, 0)'),
                elap: panel?.querySelector('.location-intelligence__status .uv-ink')?.textContent.trim(),
                phoneHref: panel?.querySelector('.phone-link')?.getAttribute('href'),
                streetHref: panel?.querySelector('.street-view-link')?.getAttribute('href'),
              });
            }, panelName);

            if (locatorState.activePins !== 1 || locatorState.visiblePanels.length !== 1 || locatorState.visiblePanels[0] !== panelName || !locatorState.placeholderHidden || locatorState.ledgerState !== 'ready') {
              failures.push(`${viewport.name} ${route}: ${buttonName} did not release only its matching location panel`);
            }
            if (!locatorState.headingFitsOneLine) failures.push(`${viewport.name} ${route}: ${buttonName} location heading does not fit on one line`);
            if (!locatorState.activePanelExposed || !locatorState.inactivePanelsProtected || locatorState.uvInkCount !== 3) failures.push(`${viewport.name} ${route}: ${buttonName} panel accessibility state or UV field count is incorrect`);
            if (locatorState.elap !== elap || locatorState.phoneHref !== phoneHref || !locatorState.streetHref?.includes(streetNeedle)) failures.push(`${viewport.name} ${route}: ${buttonName} verified contact data or destination changed`);
            if (viewport.name === 'phone' && (locatorState.uvMode !== 'full' || !locatorState.uvInkFullyVisible)) failures.push(`${viewport.name} ${route}: ${buttonName} touch fallback did not fully reveal the docket`);
          }

          if (viewport.name !== 'phone') {
            await page.getByRole('button', { name: 'Ukiah', exact: true }).click();
            await page.waitForTimeout(430);
            const ledgerBox = await page.locator('[data-location-ledger]').boundingBox();
            const scrollBeforeLamp = await page.evaluate(() => window.scrollY);
            await page.mouse.move(ledgerBox.x + ledgerBox.width * .58, ledgerBox.y + ledgerBox.height * .58);
            await page.waitForTimeout(80);
            const lampState = await page.evaluate(() => {
              const ledger = document.querySelector('[data-location-ledger]');
              const panel = ledger.querySelector('[data-location-state="active"]');
              return {
                active: ledger.classList.contains('is-uv-active'),
                panelX: panel.style.getPropertyValue('--uv-panel-x'),
                panelY: panel.style.getPropertyValue('--uv-panel-y'),
                inkCoordinates: [...panel.querySelectorAll('.uv-ink')].every((ink) => ink.style.getPropertyValue('--uv-local-x') && ink.style.getPropertyValue('--uv-local-y')),
                scrollY: window.scrollY,
              };
            });
            if (!lampState.active || !lampState.panelX || !lampState.panelY || !lampState.inkCoordinates) failures.push(`${viewport.name} ${route}: pointer movement did not update the UV lamp coordinates`);
            if (Math.abs(lampState.scrollY - scrollBeforeLamp) > 1) failures.push(`${viewport.name} ${route}: moving the UV lamp changed the page scroll position`);

            const elkGroveButton = page.getByRole('button', { name: 'Elk Grove', exact: true });
            await elkGroveButton.focus();
            await elkGroveButton.press('Enter');
            await page.waitForTimeout(430);
            const keyboardState = await page.evaluate(() => {
              const panel = document.querySelector('[data-location-panel="elk-grove"]');
              return {
                headingFocused: document.activeElement === panel.querySelector('h3'),
                fullyReadable: [...panel.querySelectorAll('.uv-ink')].every((ink) => getComputedStyle(ink).webkitTextFillColor !== 'rgba(0, 0, 0, 0)'),
              };
            });
            if (!keyboardState.headingFocused || !keyboardState.fullyReadable) failures.push(`${viewport.name} ${route}: keyboard selection did not focus and fully reveal the released dossier`);
          }
        }

        if (route === '/regulatory/') {
          const agencies = ['epa', 'drinking-water', 'calrecycle', 'water-board', 'dtsc', 'carb'];
          const initialPlaceholderVisible = await page.locator('[data-agency-placeholder]').isVisible();
          if (!initialPlaceholderVisible) failures.push(`${viewport.name} ${route}: sealed agency placeholder is not visible initially`);

          const regulatoryFrameState = await page.evaluate(() => {
            const entry = document.querySelector('.entry');
            const vault = document.querySelector('.agency-vault');
            const masthead = document.querySelector('.agency-vault__masthead');
            const entryStyle = entry && getComputedStyle(entry);
            const vaultRect = vault && vault.getBoundingClientRect();
            const mastheadRect = masthead && masthead.getBoundingClientRect();
            return {
              outerBorderRemoved: Boolean(entryStyle && parseFloat(entryStyle.borderTopWidth) === 0 && parseFloat(entryStyle.borderRightWidth) === 0 && parseFloat(entryStyle.borderBottomWidth) === 0 && parseFloat(entryStyle.borderLeftWidth) === 0),
              mastheadCutsTopRule: Boolean(vaultRect && mastheadRect && mastheadRect.top >= vaultRect.top - 1 && mastheadRect.top <= vaultRect.top + 2),
            };
          });
          if (!regulatoryFrameState.outerBorderRemoved) failures.push(`${viewport.name} ${route}: obsolete outer page frame is still visible`);
          if (!regulatoryFrameState.mastheadCutsTopRule) failures.push(`${viewport.name} ${route}: masthead labels do not interrupt the vault top rule`);

          const initialAlignment = await page.evaluate(() => {
            const firstAgency = document.querySelector('[data-agency-target]')?.getBoundingClientRect();
            const card = document.querySelector('.agency-intelligence')?.getBoundingClientRect();
            return firstAgency && card ? Math.abs(firstAgency.top - card.top) : Number.POSITIVE_INFINITY;
          });
          if (viewport.name !== 'phone' && initialAlignment > 2) failures.push(`${viewport.name} ${route}: first agency and dossier card are misaligned by ${initialAlignment}px`);

          for (const agency of agencies) {
            await page.locator(`[data-agency-target="${agency}"]`).click();
            await page.waitForTimeout(viewport.name !== 'phone' ? 1350 : 720);
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

            if (viewport.name !== 'phone') {
              const desktopCardVisibility = await page.locator('.agency-intelligence').evaluate((card) => {
                const rect = card.getBoundingClientRect();
                return { top: rect.top, bottom: rect.bottom, viewport: window.innerHeight };
              });
              if (desktopCardVisibility.top < -1 || desktopCardVisibility.bottom > desktopCardVisibility.viewport + 1) {
                failures.push(`${viewport.name} ${route}: ${agency} dossier is clipped outside the viewport (${JSON.stringify(desktopCardVisibility)})`);
              }
            }

            if (viewport.name === 'phone') {
              const mobileCardState = await page.evaluate(() => {
                const card = document.querySelector('.agency-intelligence')?.getBoundingClientRect();
                return card ? { top: card.top, viewport: innerHeight } : null;
              });
              if (!mobileCardState || mobileCardState.top < -2 || mobileCardState.top >= mobileCardState.viewport) {
                failures.push(`${viewport.name} ${route}: ${agency} did not bring the released dossier into view`);
              }
            }
          }

          if (viewport.name !== 'phone') {
            await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
            await page.waitForTimeout(120);
            const scrollBeforeCarbClick = await page.evaluate(() => window.scrollY);
            await page.locator('[data-agency-target="carb"]').click();
            await page.waitForTimeout(1350);
            const centeredCardState = await page.locator('.agency-intelligence').evaluate((card) => {
              const rect = card.getBoundingClientRect();
              return {
                entirelyVisible: rect.top >= -1 && rect.bottom <= window.innerHeight + 1,
                centerDelta: Math.abs((rect.top + rect.height / 2) - window.innerHeight / 2),
                scrollY: window.scrollY,
              };
            });
            if (!centeredCardState.entirelyVisible || centeredCardState.centerDelta > 20) failures.push(`${viewport.name} ${route}: Air Resources Board dossier was not centered entirely in the viewport (${JSON.stringify(centeredCardState)})`);
            if (centeredCardState.scrollY >= scrollBeforeCarbClick - 2) failures.push(`${viewport.name} ${route}: bottom agency click did not scroll back to the centered dossier (before ${scrollBeforeCarbClick}px, after ${centeredCardState.scrollY}px)`);
          }
        }

        results.push({ viewport: viewport.name, route, ...state });
      } catch (error) {
        failures.push(`${viewport.name} ${route}: ${error.message}`);
      }
    }

    await page.close();
  }

  const reducedMotionPage = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  try {
    await reducedMotionPage.goto(`${baseUrl}/contact-us-alpha-analytical-laboratories-inc/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await reducedMotionPage.getByRole('button', { name: 'Ukiah', exact: true }).click();
    await reducedMotionPage.waitForTimeout(80);
    const reducedMotionState = await reducedMotionPage.evaluate(() => {
      const ledger = document.querySelector('[data-location-ledger]');
      const panel = document.querySelector('[data-location-panel="ukiah"]');
      return {
        ledgerState: ledger?.dataset.locationState,
        uvMode: ledger?.dataset.uvMode,
        scanAnimation: getComputedStyle(document.querySelector('.location-intelligence__scan')).animationName,
        fullyReadable: [...panel.querySelectorAll('.uv-ink')].every((ink) => getComputedStyle(ink).webkitTextFillColor !== 'rgba(0, 0, 0, 0)'),
      };
    });
    if (reducedMotionState.ledgerState !== 'ready' || reducedMotionState.uvMode !== 'full' || reducedMotionState.scanAnimation !== 'none' || !reducedMotionState.fullyReadable) {
      failures.push(`reduced-motion /contact-us-alpha-analytical-laboratories-inc/: full-reveal fallback failed (${JSON.stringify(reducedMotionState)})`);
    }
  } finally {
    await reducedMotionPage.close();
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
