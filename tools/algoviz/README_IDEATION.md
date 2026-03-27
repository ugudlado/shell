# AlgoViz Feature Ideation — March 26, 2026

This directory contains ideation work for two new AlgoViz features.

## Quick Links

### Documentation
- **[IDEATION_SUMMARY.md](IDEATION_SUMMARY.md)** — Executive summary of both features
- **[FEATURE_IDEAS_2026.md](FEATURE_IDEAS_2026.md)** — Detailed analysis and comparisons

### Feature 1: Huffman Coding (feature-rapid)
- **[Specification](openspec/changes/2026-03-26-huffman-new-proposal/spec.md)** — Full requirements, acceptance criteria
- **[Design](openspec/changes/2026-03-26-huffman-new-proposal/design.md)** — Architecture, data structures, visualization
- **[Tasks](openspec/changes/2026-03-26-huffman-new-proposal/tasks.md)** — Implementation breakdown (6 phases, 90 min)

### Feature 2: Dijkstra Bug Fix (bugfix)
- **[Specification](openspec/changes/2026-03-26-dijkstra-input-zero-weight-fix/spec.md)** — Bug description, fix, testing
- **[Tasks](openspec/changes/2026-03-26-dijkstra-input-zero-weight-fix/tasks.md)** — Fix procedure and verification (15 min)

---

## At a Glance

| Feature | Type | Time | Algorithm Class | Status |
|---------|------|------|-----------------|--------|
| **Huffman Coding** | feature-rapid | 60-90 min | Compression + Greedy + Tree | Ready |
| **Dijkstra Bug** | bugfix | 10-15 min | Input Validation | Ready |

---

## Key Points

### Huffman Coding
✅ **New algorithm class** — First compression algorithm in AlgoViz
✅ **Visually compelling** — Frequency table → Tree building → Encoding table
✅ **Real-world** — Used in ZIP, JPEG, PNG file formats
✅ **Educational** — Teaches greedy algorithms and binary trees
✅ **Single session** — Complete feature-rapid implementation in 60-90 min

### Dijkstra Bug Fix
✅ **Real issue** — Spec says 0-999 valid, but UI blocks 0
✅ **High impact** — Enables zero-weight edge testing
✅ **Quick fix** — 1-line change in dijkstra.js (line 278)
✅ **Low risk** — Backward compatible, no side effects
✅ **Fast** — 10-15 min with full testing

---

## Implementation Checklist

### Pre-Implementation
- [ ] Read IDEATION_SUMMARY.md for executive overview
- [ ] Review spec.md for your chosen feature
- [ ] Review design.md (Huffman) or understand bug (Dijkstra)
- [ ] Review tasks.md for step-by-step breakdown

### Recommended Order
**Option 1 (Sequential):**
1. Dijkstra bugfix first (10 min) — quick win
2. Huffman feature second (90 min) — main effort

**Option 2 (Parallel):**
- Developer A: Huffman (90 min)
- Developer B: Dijkstra (10 min), then assist with Huffman
- Total: ~90 min (parallel)

### Post-Implementation
- [ ] All tests pass (npm test, npm run lint, npm run format:check)
- [ ] Manual testing verified (per tasks.md)
- [ ] Git commits created with detailed messages
- [ ] Code review passed
- [ ] Navigation updated in all .html files

---

## File Structure

```
/home/user/shell/tools/algoviz/
├── README_IDEATION.md (this file)
├── IDEATION_SUMMARY.md (executive summary)
├── FEATURE_IDEAS_2026.md (detailed analysis)
├── CLAUDE.md (architecture guidelines)
├── FEATURE_PROPOSAL.md (historical notes)
│
└── openspec/changes/
    ├── 2026-03-26-huffman-new-proposal/
    │   ├── spec.md (110 lines)
    │   ├── design.md (250+ lines)
    │   └── tasks.md (450+ lines)
    │
    ├── 2026-03-26-dijkstra-input-zero-weight-fix/
    │   ├── spec.md (200+ lines)
    │   └── tasks.md (300+ lines)
    │
    └── [other existing changes...]
```

---

## Questions & Answers

**Q: Can I do both features in parallel?**
A: Yes. Dijkstra bug (10 min) is independent of Huffman (90 min). One developer can fix Dijkstra while another builds Huffman.

**Q: Do I need to write tests for Huffman?**
A: feature-rapid type requires manual testing only (no automated tests). Unit tests are nice-to-have but not required. Dijkstra bug includes regression test recommendation.

**Q: What's the current state of AlgoViz?**
A: 11 existing algorithms: Levenshtein, Elevator/SCAN, BFS, Knapsack, Bubble Sort, BST, Merge Sort, Binary Search, DFS, LCS, Dijkstra. Hash Table has code but incomplete. Huffman will be #12.

**Q: What if I get stuck?**
A: Refer to CLAUDE.md (architecture guidelines) and tasks.md (troubleshooting section). Both documents include gotchas and debugging tips.

**Q: How do I verify CSS prefixes are correct?**
A: From CLAUDE.md: `grep -P 'class="(?!huffman-)' huffman-style.css` should return NO matches (empty result).

**Q: Can I reuse existing code patterns?**
A: Yes. The existing algorithms (BFS, Dijkstra, BST, Merge Sort) are good reference implementations. Follow their IIFE pattern and file organization.

**Q: What about browser compatibility?**
A: Use vanilla JavaScript (no frameworks). Test on Chrome, Firefox, Safari. Canvas API is well-supported.

---

## Success Criteria

### Huffman Coding (feature-rapid)
✅ All acceptance criteria checked
✅ 8 manual test cases pass
✅ npm run lint && npm run format:check pass
✅ Navigation added to all .html files
✅ No external dependencies

### Dijkstra Bug (bugfix)
✅ 1-line fix applied (dijkstra.js line 278)
✅ npm run lint && npm run format:check pass
✅ npm test passes
✅ 5 integration test scenarios pass
✅ No regressions in existing functionality

---

## Time Breakdown

### Huffman Coding (60-90 min)
- Algorithm implementation: 20-30 min
- HTML structure: 10-15 min
- UI implementation: 25-35 min
- Styling: 10-15 min
- Testing & integration: 15-20 min

### Dijkstra Bug (10-15 min)
- Apply fix: 1-2 min
- Lint/format: 3-5 min
- Testing: 5-10 min

### Total: ~100-110 minutes

---

## References

- **AlgoViz Architecture**: [CLAUDE.md](CLAUDE.md)
- **Code Quality Rules**: [CLAUDE.md](CLAUDE.md) (Code Rules section)
- **Existing Algorithms**: View any of the `[algo]-algorithm.js` files for patterns
- **UI Pattern**: View `bfs.js` for playback control pattern, `dijkstra.js` for graph visualization

---

## Contact & Questions

For clarifications on specifications, refer to:
1. spec.md (for requirements)
2. design.md (for architecture decisions)
3. tasks.md (for implementation details)
4. IDEATION_SUMMARY.md (for overall strategy)

---

**Generated by:** Ideator Agent
**Date:** 2026-03-26
**Status:** Ready for Implementation
**Last Updated:** 2026-03-26
