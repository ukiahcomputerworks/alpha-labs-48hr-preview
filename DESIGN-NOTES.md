# Alpha Labs visual system and source notes

## Baseline direction

The first release intentionally mirrors the current Alpha Labs visual language: a compact 960-pixel centered page, blue patterned surround, white header with the existing branded header artwork, deep-blue navigation with a gold rule, rotating laboratory imagery, a two-column content/sidebar layout and a muted blue locations band. This recognizable baseline makes live meeting changes easy to see.

## Role treatments

| Role | Treatment |
| --- | --- |
| Primary title | Source Sans Pro/Arial, 30px, semibold, Alpha blue |
| Section title | Source Sans Pro/Arial, 25px, semibold, Alpha blue |
| Body | Source Sans Pro/Arial, 16px, 1.55 line height, charcoal |
| Navigation | Deep-blue bar, white semibold text, gold active/hover state, 44px minimum target |
| Word link | Deep-blue text, gold underline, visible gold focus outline |
| Card | Flat white or light gray surface, restrained gray border or blue top rule |
| Graphics | Current Alpha Labs header and laboratory images, original aspect ratios retained |
| Header | Existing branded artwork on white with separate Client Data Access control |

## Route-by-component matrix

| Route | Header | Navigation | Slider | Main content | Sidebar | Locations | Footer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Shared | Shared | Shared | Home, services, company, regulatory, forms, careers and contact sections | Shared | Shared | Shared |

## Responsive behavior

- Desktop reference: 1440px viewport with the 960px centered source-site geometry.
- Phone reference: 390px viewport with wrapping navigation, one-column content and two-to-one-column locations.
- All interactive targets are at least 44px high and preserve visible keyboard focus.

## Public sources and asset provenance

- Current public site, navigation, company copy and locations: `https://www.alpha-labs.com/`
- Services: `https://www.alpha-labs.com/services-listing`
- Company mission and certifications: `https://www.alpha-labs.com/company`
- Contact: `https://www.alpha-labs.com/contact-us-alpha-analytical-laboratories-inc`
- Header, slider, WaterTrax, flask, Aquafornia, payment and favicon assets: current public Alpha Labs WordPress media/theme paths, downloaded 2026-09-02.

## Deliberate exclusions

- No working contact form, CAPTCHA, analytics, WordPress scripts or data collection.
- No claim that Alpha Labs approved this staged site.
- No changes to Alpha Labs production systems.
- No credentials, prices, availability or regulatory claims beyond the current public source.
