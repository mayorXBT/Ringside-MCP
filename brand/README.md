# Ringside brand kit

One gap-shield mark across product and media. The open lower contour is deliberate; the inner ring represents the private balance, and the periwinkle stem indicates an owner-controlled opening.

- `mark-light.svg` / `mark-dark.svg`: standalone mark.
- `logo-light.svg` / `logo-dark.svg`: mark and wordmark.
- `intro-1920x1080.png` / `outro-1920x1080.png`: pitch video title cards.
- `colors.md`: palette, type, and usage guidance.
- `fonts/`: Geist Sans with its bundled license.

Preferred line: **Private payments for agents. Controls for owners.**

`render-assets.cjs` regenerates the PNG artwork from the SVG mark and Geist files. It needs Chromium, Playwright, and Sharp; set `PLAYWRIGHT_MODULE`, `SHARP_MODULE`, and `CHROMIUM_PATH` if they are installed elsewhere.
