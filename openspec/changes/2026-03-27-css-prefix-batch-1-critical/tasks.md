# Tasks: Prefix Critical CSS Classes — Batch 1

## Phase 1: Root Cause Investigation

- [ ] T-1: Identify exact class name collisions by inspecting elevator.js and bfs.js
  - **Why**: Confirm which classes are referenced in JS and which are CSS-only
  - **Files**: `tools/algoviz/elevator.js`, `tools/algoviz/bfs.js`
  - **Verify**: Document full list of class references per file

## Phase 2: Regression Test

- [ ] T-2: Create test page loading both elevator + bfs visualizations
  - **Why**: Prove style collision bug exists before fix
  - **Files**: `tools/algoviz/test-simultaneous-algos.html` (new)
  - **Verify**: Screenshot showing visual overlap/misalignment before fix

## Phase 3: Implementation

- [ ] T-3: Prefix elevator-style.css — all 8 classes
  - **Why**: Eliminate collision risk for elevator visualization
  - **Files**: `tools/algoviz/elevator-style.css`
  - **Verify**: `grep -n "\.algo-elevator" elevator-style.css` shows all refactored classes

- [ ] T-4: Update elevator.js — className references
  - **Why**: Sync JS selectors to new prefixed class names
  - **Files**: `tools/algoviz/elevator.js`
  - **Verify**: Visual test: elevator algo still renders and animates correctly

- [ ] T-5: Prefix bfs-style.css — all 7 classes
  - **Why**: Eliminate collision risk for BFS visualization
  - **Files**: `tools/algoviz/bfs-style.css`
  - **Verify**: `grep -n "\.algo-bfs" bfs-style.css` shows all refactored classes

- [ ] T-6: Update bfs.js — className references
  - **Why**: Sync JS selectors to new prefixed class names
  - **Files**: `tools/algoviz/bfs.js`
  - **Verify**: Visual test: BFS algo still renders and animates correctly

## Phase 4: Verification

- [ ] T-7: Re-run simultaneous load test (T-2) — verify no style bleeding
  - **Why**: Confirm fix resolves original bug
  - **Files**: `tools/algoviz/test-simultaneous-algos.html`
  - **Verify**: Screenshot showing both algos render independently without overlap

- [ ] T-8: Manual interaction test — elevator buttons, BFS mode selection
  - **Why**: Ensure user interactions still work after prefixing
  - **Verify**: Buttons respond, animations trigger, step-through works

