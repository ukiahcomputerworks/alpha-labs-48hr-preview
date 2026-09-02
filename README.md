# Alpha Labs 48-hour website rescue

Independent, route-for-route static mirror of the public Alpha Analytical Laboratories website for fast owner-directed changes during a meeting.

## Live staged site

`https://ukiahcomputerworks.github.io/alpha-labs-48hr-preview/`

## Meeting workflow

1. Open the staged URL on the owner's device.
2. Apply the requested content or style change to the mirrored page or `styles.css`.
3. Run `Publish-MeetingChange.ps1 -Message '<concise change>'`.
4. Refresh the cache-busted URL returned by the script after the exact GitHub Pages build succeeds.

## Mirror maintenance

`Sync-PublicMirror.ps1` reads the two current WordPress post/page sitemaps, downloads every listed public HTML route, rewrites internal page navigation to this GitHub Pages site, adds `noindex, nofollow`, injects the shared meeting override layer and disables all local form submissions. Running it regenerates mirrored HTML and should be intentional because it can replace page-level meeting edits.

`Test-PublicMirror.ps1` verifies the complete 35-route inventory locally and can verify every published route after a GitHub Pages build.

## Boundaries

- The staged site contains only current public Alpha Labs material.
- WordPress theme assets, media and scripts remain read-only references to public `alpha-labs.com` resources so the visual baseline stays identical.
- Forms are visually preserved but submission is intercepted on the staged copy; no visitor data is collected.
- Alpha Labs' WordPress instance, DNS, domain, production hosting, forms, email, accounts and Client Data Access remain unchanged.
- Production adoption requires the owner's content, asset-rights, accessibility, privacy, form, hosting and domain approval.
