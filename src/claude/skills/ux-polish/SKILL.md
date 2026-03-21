---
name: ux-polish
description: Systematic UX polish pass — fixes issues found by /critique. Checks and improves interaction states, spacing, motion, copy, color, typography, responsiveness, and edge cases. Use after /critique identifies problems, or before shipping any UI feature.
user-invokable: true
args:
  - name: area
    description: Specific area or component to polish (optional — defaults to current feature)
    required: false
---

Apply a systematic polish pass to the UI. This skill *fixes*, not just evaluates — work through each dimension and make concrete improvements.

**Prerequisite**: Run `/critique` first if you haven't. Polish without direction wastes effort. If critique findings exist, use them to prioritize which dimensions need the most work.

**Rule**: Polish is the last step before shipping, not the first. The feature must be functionally complete.

## Polish Dimensions

Work through these in order. Skip dimensions that are already clean — don't polish for the sake of it.

### 1. Interaction States

Every interactive element needs all applicable states:

- **Default** — base appearance
- **Hover** — visible change (color, shadow, scale, underline)
- **Focus** — keyboard-accessible ring, never `outline: none` without replacement
- **Active** — pressed feedback (scale down, darker color)
- **Disabled** — reduced opacity, `cursor: not-allowed`, no pointer events
- **Loading** — spinner, skeleton, or progress indicator — never just frozen UI
- **Error** — red/destructive styling, error message adjacent
- **Success** — confirmation color + message, guides next step

Check: open DevTools, tab through every interactive element. Does each one look intentional in every state?

### 2. Spacing & Alignment

- Enforce a consistent spacing scale (4px / 8px / 16px / 24px / 32px / 48px / 64px)
- Remove arbitrary pixel values — replace with scale tokens
- Align elements to the grid — check with a ruler overlay or DevTools
- Check padding symmetry: left/right should match unless intentionally asymmetric
- Verify text doesn't touch container edges (minimum 16px horizontal padding)

### 3. Typography

- Line length: body text 45-75 characters per line — add `max-w` if too wide
- Line height: 1.4-1.6 for body, 1.1-1.2 for headings
- Hierarchy: ≥2px difference between adjacent heading levels
- Weight: bold (700) for primary actions, medium (500) for secondary, regular (400) for body
- No more than 2 typefaces in a single view
- Check letter-spacing on all-caps labels (0.05-0.1em)

### 4. Color & Contrast

- WCAG AA minimum: 4.5:1 for body text, 3:1 for large text and UI components
- Check with browser DevTools accessibility panel or `getComputedStyle` contrast
- Accent color appears on ≤3 elements per screen — if more, it's lost meaning
- No pure `#000` or `#fff` — use near-black/near-white with hue
- Semantic colors: red for errors only, green for success only — don't use for decoration
- Test in grayscale: does meaning survive without color?

### 5. Motion & Micro-interactions

Apply purposeful motion — not decoration:

```css
/* State changes */
transition: all 150-300ms ease-out;

/* Entrances */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Always respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Timing guide:
- 100-150ms — instant feedback (button press, toggle)
- 200-300ms — state changes (expand, collapse, tab switch)
- 300-500ms — layout shifts (drawer open, modal appear)

Only use `transform` and `opacity` — never animate `width`, `height`, `top`, `left` (causes layout thrash).

No bounce or elastic easing — use `ease-out` or `cubic-bezier(0.16, 1, 0.3, 1)`.

### 6. Copy & Microcopy

- Button labels: verb + noun ("Save changes", "Delete project") not just "Submit"
- Error messages: what went wrong + how to fix it ("Email already in use — try signing in instead")
- Empty states: what the space is for + a call to action ("No projects yet — create your first one")
- Loading copy: specific over generic ("Loading your projects..." not "Loading...")
- Consistent capitalization: pick Title Case or Sentence case for labels and stick to it
- Remove filler words: "Please", "Simply", "Just", "Easily" — users don't need to be managed
- Shorten everything by 30% — then check if it still makes sense

### 7. Edge Cases & States

- **Empty state**: styled, not blank. Includes icon/illustration + explanation + CTA
- **Loading state**: skeleton screens or spinners — never a frozen, content-less layout
- **Error state**: visible, specific error message + recovery path
- **Overflow**: what happens with very long names, large numbers, many items? Test with 0, 1, and 100+ items
- **Network errors**: offline state handled — don't silently fail
- **Permissions**: what does a user without access see? Not a broken component

### 8. Responsiveness

Test at three breakpoints minimum:
- Mobile: 375px
- Tablet: 768px
- Desktop: 1280px

Check:
- Text doesn't overflow or truncate unexpectedly
- Touch targets ≥ 44px × 44px on mobile
- No horizontal scroll on mobile
- Fixed elements don't cover interactive content
- Tables/data grids degrade gracefully (horizontal scroll or card layout)

### 9. Code Quality

- Remove `console.log` and debug artifacts
- Delete unused imports and dead code
- Replace magic numbers with named constants or design tokens
- Ensure TypeScript types are specific (no `any`)
- Extract repeated style patterns into shared classes/components
- Check no `!important` unless overriding third-party

## Polish Report

After working through applicable dimensions, output a concise summary:

```
## Polish Pass Complete

### Fixed
- [dimension]: [what was changed and why]
- [dimension]: [what was changed and why]

### Still Needs Attention
- [issue]: [why it wasn't fixed in this pass — e.g., needs design decision]

### Verified Clean
- [dimension]: already meeting standard, no changes needed
```

Keep fixes atomic — one concern per change. Don't refactor surrounding code while polishing a button state.
