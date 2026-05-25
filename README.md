# Infographic Studio — Ultra Premium Mobile Build

A mobile-first HTML/CSS/JS infographic editor designed for fast, clean, premium infographic production.

## Run locally

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

## Main workflow

1. Pick a layout from **Design**.
2. Add blocks from **Insert**.
3. Set colors, background, and snap behavior from **Brand**.
4. Tap any block to edit it.
5. Use **Polish** as the final cleanup pass.
6. Use **Export** to preview, export PNG, or export PDF.

## Ultra premium upgrades in this build

- Floating selected-block toolbar for duplicate, front/back, and delete.
- Magnetic alignment guides while dragging blocks.
- Presentation-style preview mode before exporting.
- Richer visual template thumbnails.
- Stronger Pro Polish layout cleanup.
- More premium app shell and infographic output styling.

## Export notes

PNG and PDF export use `html2canvas` and `jsPDF` from CDN links in `index.html`. Keep internet access on when exporting unless you bundle those libraries locally.

## Official logo workflow

Logo areas are blank by default. Upload only the real official logos manually using the Logos block or Brand/Insert workflow.
