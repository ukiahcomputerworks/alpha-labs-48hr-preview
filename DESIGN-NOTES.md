# Alpha Labs mirror design and source record

## Approved reference

The current public site at `https://www.alpha-labs.com/` is the sole baseline reference. The staged release preserves its WordPress Genesis theme, header, navigation, slider, content/sidebar layouts, typography, colors, imagery, responsive rules and route structure rather than introducing a new visual system before the owner meeting.

## Shared component roles

| Role | Reference treatment |
| --- | --- |
| Header | Current Alpha Labs header artwork and Client Data Access control |
| Navigation | Current Genesis primary navigation and active-page behavior |
| Primary and section titles | Current theme typography, weights, sizes and Alpha blue |
| Body and word links | Current Source Sans Pro theme styles and states |
| Cards/sidebar | Current widgets, borders, spacing and image treatments |
| Slider | Current Soliloquy markup, imagery and behavior |
| Footer and locations | Current live-site widgets, contact details and copyright |

## Route-by-component matrix

Every route in `mirror-manifest.json` uses the public site's own shared header, navigation and footer markup. Page-specific content, sidebar presence and active navigation state are retained from the corresponding live route. The injected `styles.css` is one site-wide override layer for owner-requested meeting changes.

## Responsive targets

- Desktop acceptance: 1440 by 900 pixels.
- Phone acceptance: 390 by 844 pixels.
- No unintended horizontal overflow, broken visual assets, console errors, heading skips or unnamed controls.

## Provenance

- Page and post inventory: the current `wp-sitemap-posts-page-1.xml` and `wp-sitemap-posts-post-1.xml` files.
- HTML, theme CSS/JavaScript, media and public facts: `https://www.alpha-labs.com/`, fetched 2026-09-02.
- No private Alpha Labs system, account or data source is used.

## Deliberate exceptions

- Every mirrored route adds `noindex, nofollow`.
- Form submission is disabled on the staged copy to prevent production data entry.
- Internal HTML page navigation remains inside the GitHub Pages mirror. Client Data Access, PDFs and other non-page resources continue to use their current public destinations.
