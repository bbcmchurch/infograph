# Quality Audit and Fixes

## Functional fixes

- Fixed a runtime error in the Edit panel caused by a missing `escapeHtml()` function.
- Added safe text escaping for edit fields to prevent broken inputs when text contains symbols such as `<`, `>`, `&`, quotes, or apostrophes.
- Improved export reliability with try/catch/finally so the canvas always returns to normal even if rendering fails.
- Added export-library checks for html2canvas and jsPDF.
- Improved PNG export by using Blob downloads instead of very large base64 links.
- Added drag history capture so moved blocks can be undone.
- Made keyboard nudging undoable.
- Added automatic Edit-panel switching after tapping a canvas block.
- Added automatic fit-to-screen on first load and viewport resize.

## UI/UX improvements

- Simplified the mobile header on very small screens.
- Kept Save/Load available in Export while removing extra top-bar pressure on phones.
- Improved touch-first workflow: tap block, edit immediately.
- Added clearer focus states for accessibility.
- Made small-phone Insert tools more compact.
- Added PWA manifest metadata for a more app-like mobile launch.

## Output-quality improvements

- Strengthened Polish behavior so it normalizes grid alignment, z-order, logo area, contact bar, overflow, and sensible font sizing.
- Kept export visuals clean by hiding selection affordances during render.
- Preserved blank logo slots for official/manual logo placement.
