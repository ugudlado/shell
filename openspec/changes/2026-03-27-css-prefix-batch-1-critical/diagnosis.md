# Diagnosis: Unprefix CSS Classes — Batch 1 (Critical)

## Symptoms

Two AlgoViz visualizations have unprefixed CSS classes with high collision risk:

1. **elevator-style.css** — 100% unprefixed (all bare classes)
   - Classes: `.rope`, `.car`, `.button`, `.animation-state`, `.controls`, `.floor-select`, `.velocity-display`, `.step-label`
   - Risk: Extreme — common names likely colliding with other algos or global styles

2. **bfs-style.css** — 83% unprefixed
   - Classes: `.mode-buttons`, `.grid-container`, `.grid-cell`, `.visited-cell`, `.path-cell`, `.edge`, `.step-info`
   - Risk: High — `.grid-*` and `.visited-*` prefixes likely colliding

## Root Cause

CSS classes were designed as isolated per-visualization files without namespace prefixes. AlgoViz layout combines multiple algo files in a single page (through `<script src="algo-name.js">` pattern), causing class collisions when multiple visualizations load simultaneously or in sequence.

Prefixing pattern in other files: `.algo-<name>-<element>` (e.g., `.algo-bubble-bar-chart`).

## Impact

- **Visual bugs**: Styles from one algo bleeding into another (wrong colors, layouts breaking)
- **Interaction bugs**: Event handlers targeting wrong elements when multiple algos active
- **Hard to debug**: Collisions only appear under specific page load order/combinations
- **Maintainability**: Risky to add new visualizations without careful CSS naming review

