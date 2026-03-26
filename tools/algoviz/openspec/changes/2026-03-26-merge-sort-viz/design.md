# Merge Sort Visualization — Design

## Algorithm Module Design

### Step Types

The algorithm records two types of steps:

1. **Split step**: Records when an array is divided into two halves
   - `type: "split"`
   - `array`: the array being split
   - `left`: left half indices
   - `right`: right half indices
   - `depth`: recursion depth (0 = root)

2. **Merge step**: Records each comparison and placement during merge
   - `type: "merge"`
   - `left`: left subarray
   - `right`: right subarray
   - `comparing`: `[leftIdx, rightIdx]` — indices being compared
   - `result`: merged result so far
   - `depth`: recursion depth
   - `explanation`: human-readable description

3. **Complete step**: Final sorted array
   - `type: "complete"`
   - `array`: fully sorted array
   - `comparisons`: total count
   - `mergeOps`: total merge operations

### API

```javascript
MergeSortAlgorithm.sort(inputArr)
// Returns: { steps: Step[], sortedArray: number[] }
```

Steps are recorded in execution order — first all splits going down the recursion tree, then merges coming back up.

## Visualization Design

### Layout Strategy

**Tree-based layout** inspired by web search insights:
- Top row: original full array
- Each row below shows subarrays at increasing recursion depth
- During divide phase: arrays split downward (push down)
- During merge phase: arrays combine upward (lift up) with comparison highlighting

### Visual Representation

Each subarray is rendered as a horizontal group of value boxes:
- Boxes are arranged in rows by recursion depth
- Active subarray highlighted with border glow
- During merge: two source subarrays highlighted, result building below/above

### Color Scheme (consistent with project dark theme)

| State | Color | Hex |
|-------|-------|-----|
| Unsorted | Gray | `#8b949e` |
| Active split | Blue | `#388bfd` |
| Left source (merge) | Cyan | `#39d353` |
| Right source (merge) | Orange | `#d29922` |
| Comparing | White border | `#ffffff` |
| Merged/Sorted | Green | `#2ea043` |

### Stats Panel

- Comparisons count
- Merge operations count
- Current recursion depth
- Step N / Total

### Responsiveness

- On small screens, reduce box sizes
- Horizontal scroll if tree gets too wide
- Same breakpoint pattern as existing pages (600px)

## Component Interaction

```
merge-sort.html
  ├── style.css (shared nav, base)
  ├── merge-sort-style.css (algorithm-specific)
  ├── merge-sort-algorithm.js (pure algorithm)
  └── merge-sort.js (visualization logic)
```

The visualization JS calls `MergeSortAlgorithm.sort()`, receives the step array, and drives the UI through step-by-step playback using the same play/pause/step pattern as bubble sort.
