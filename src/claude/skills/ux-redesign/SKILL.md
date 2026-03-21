---
name: ux-redesign
description: Generate fresh UI redesign concepts when the current design direction is fundamentally off — not just rough, but wrong. Produces 2-3 distinct aesthetic concepts with strong POV before picking one to build. Use when /critique reveals structural or directional problems, when the design feels generically AI-generated, or when the user asks for a redesign, fresh take, or new direction.
user-invokable: true
args:
  - name: area
    description: The component, page, or feature to redesign (optional — describe what you want reimagined)
    required: false
---

Generate redesign concepts for a UI that needs a fundamentally new direction — not polish, but rethinking. This skill produces divergent concepts before converging on one to build.

**When to use this vs. other design skills:**
- `/critique` → evaluates what's wrong and why
- `/ux-polish` → fixes specific issues in the current direction
- `/ux-redesign` → when the direction itself is the problem — start fresh
- `taste` → governs how to build once direction is chosen
- `frontend-design` → builds production UI following established direction

**Prerequisite**: Have a clear understanding of what the current design is trying to achieve. Read the existing UI, understand the user goals, and note what critique flagged before generating concepts.

---

## Phase 1: Understand the Design Problem

Before generating concepts, answer these:

1. **What is this UI actually for?** (the job it does for the user, not the technical function)
2. **Who is the user and what do they feel when they use it?** (overwhelmed, confident, playful, focused?)
3. **What is the current design failing at?** (from critique findings, or describe the issue)
4. **What is the core visual metaphor or tone this should have?** (clinical precision, warm community, raw power, quiet luxury, etc.)
5. **What constraints exist?** (tech stack, existing component library, brand colors, accessibility requirements)

Document your answers. Concepts must solve the actual problem — not just look different.

---

## Phase 2: Generate 3 Distinct Concepts

Each concept must have a **strong, specific aesthetic POV** — not variations of the same idea. Push for genuine contrast between concepts.

### Concept Format

For each concept, describe:

**Name**: A short evocative label (e.g., "Cockpit", "Editorial", "Warm System")

**Aesthetic Direction**:
- Typography: specific font family + weight + size approach
- Color: palette logic (neutral base + accent strategy, specific color names)
- Layout: structural approach (asymmetric, grid, card-free, dense, airy)
- Motion: intensity and character (instant + crisp, fluid + springy, cinematic)
- Texture/Surface: flat, layered, frosted, editorial whitespace

**Key Design Decisions** (3-4 specific choices that define this concept):
- e.g., "Data rows with no card containers — just 1px dividers on zinc-100"
- e.g., "Left-rail navigation that collapses to icon-only at md breakpoint"
- e.g., "Single saturated accent (emerald-500) on a near-white base — everything else grayscale"

**What Problem It Solves**: How this direction addresses the core failure identified in Phase 1

**What It Sacrifices**: Every strong direction gives something up — name it honestly

**ASCII Sketch** (optional but encouraged for complex layouts):
```
┌─────────────────────────────────────────┐
│  NAV                                    │
├────────┬────────────────────────────────┤
│        │  PRIMARY CONTENT               │
│ SIDE   │                                │
│ RAIL   │  ────────────────              │
│        │  ────────────────              │
│        │                                │
└────────┴────────────────────────────────┘
```

---

### Concept Archetypes (reference — don't copy, use as creative starting points)

**Cockpit / Dense Data**
All information visible at once. No cards — borders and dividers only. Monospace numbers. Zinc/slate neutrals. Tight spacing. Every pixel earns its place.

**Editorial / High Contrast**
Massive typography. Lots of negative space. Black and white with one accent. Asymmetric layouts. Feels like a design magazine. Strong visual hierarchy through scale, not color.

**Warm System**
Off-white background with warm undertones. Rounded but not bubbly. Sand/terracotta/amber accents. Feels human and approachable without being playful. Like a premium productivity app.

**Raw / Brutalist**
Borders everywhere. No shadows. System fonts or very literal sans. Grid exposed. UI elements feel like UI elements — no visual fiction. Surprisingly distinctive when done with discipline.

**Quiet Luxury**
Almost nothing. Lots of white. One serif headline. Interaction reveals depth. Feels expensive because it wastes space. Works for premium products where data density isn't the goal.

**Command Line / Developer**
Dark base. Monospace throughout or for data. Terminal-inspired spacing. Green, amber, or cyan accent on near-black. No decoration — function as aesthetic.

---

## Phase 3: Pick One

After presenting all 3 concepts, recommend one and explain why — based on the design problem, user type, and constraints. Be direct: "Concept 2 (Editorial) solves the hierarchy problem most cleanly and fits the product's premium positioning."

Ask for user confirmation before proceeding to build.

**Decision criteria:**
- Which concept most directly solves the failure identified in Phase 1?
- Which fits the actual user (not the designer's preference)?
- Which is buildable within constraints?
- Which is most distinct from what was there before?

---

## Phase 4: Build It

Once a concept is chosen:

1. Load the `taste` skill — use it as the governing standard for implementation
2. Use `frontend-design` to build the actual component/page
3. Apply the `ux-polish` skill before shipping

**Do not start building until the concept is approved.** Concept divergence (generating options) and implementation convergence (building one thing) are separate phases. Mixing them wastes effort.

---

## Anti-Patterns in Redesign

**Don't generate safe variations.** Three concepts that are all "clean, minimal, and modern" aren't three concepts — they're one concept with different shades of blue. Push for genuine contrast.

**Don't redesign just to redesign.** If `/ux-polish` can fix the problem, use that. Redesign is for when the direction is wrong, not when the execution is rough.

**Don't ignore constraints.** A redesign that requires switching the entire component library isn't a viable concept — note constraints in Phase 1 and work within them.

**Don't present wireframes as final direction.** Concepts should communicate aesthetic intent clearly enough that the user knows what they're approving. Use specific typography names, color values, and layout descriptions — not "modern and clean."
