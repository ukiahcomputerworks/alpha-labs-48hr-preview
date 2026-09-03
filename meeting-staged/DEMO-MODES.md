# Instant Meeting Demo Modes

All demonstration variants are prepublished. The active mode is stored only in the current browser, so changing modes does not require a Git commit or GitHub Pages rebuild.

## Cue mapping

- Reset for another test: `?demo-action=reset`
- Apply banner now: `?demo-action=banner`
- Create a job form for a lab tech: navigate to `/careers/?demo-action=jobs`

The action parameter is removed from the address bar after it is consumed. The selected modes persist across refreshes and internal page navigation on the same browser.

## Published variants

- Original mode: production banner and original Careers copy.
- Banner mode: water-transition background with the production-quality transparent logo layer.
- Jobs mode: original Careers content is replaced at runtime with the staged Laboratory Technician opening and demonstration application form.
