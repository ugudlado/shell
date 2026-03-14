---
description: Generate visual diagrams (flowchart, sequence, class, state, ER, C4) via draw.io. Supports single diagrams and before/after comparisons.
gitignored: true
project: true
---

## Request

$ARGUMENTS

Use the Agent tool to spawn a haiku-agent with the following prompt, passing the request above:

---

# Diagram Generation — Autonomous Agent Task

Generate diagrams for the following request: [REQUEST from arguments]

## Instructions

You are a diagram generation assistant. Analyze the user's request and generate Mermaid diagrams, rendering them via draw.io.

### Step 1: Determine Mode

Analyze the request to determine the mode:

- **Single diagram**: User wants to visualize something (architecture, flow, relationships, state machine)
- **Before/after comparison**: User mentions "before and after", "change impact", "refactor", "how it changes", or provides a diff/PR context

### Step 2: Analyze the Target

Read relevant code files and understand what needs to be diagrammed:
- For architecture: identify key components, services, and their relationships
- For flows: trace the execution path through the code
- For changes: identify the current state and proposed/completed changes

### Step 3: Select Diagram Type

Choose the best Mermaid diagram type based on what's being visualized:

| What You're Showing | Diagram Type | Syntax |
|---------------------|-------------|--------|
| Control flow, request handling, pipelines | Flowchart | `graph TD` or `graph LR` |
| API calls, service interactions, auth flows | Sequence | `sequenceDiagram` |
| Object relationships, module dependencies | Class | `classDiagram` |
| State machines, lifecycle, status transitions | State | `stateDiagram-v2` |
| Database schemas, data relationships | ER | `erDiagram` |
| High-level system architecture | C4 Context | `C4Context` |

### Step 4: Generate Mermaid

Write clean, readable Mermaid syntax:
- Use meaningful node names (not A, B, C — use actual component/function names)
- Keep diagrams focused — show the relevant parts, not the entire system
- Use subgraphs to group related components
- Add labels on edges to show what flows between components
- For before/after: generate TWO separate Mermaid diagrams

### Step 5: Render via Draw.io

Use `mcp__drawio__open_drawio_mermaid` to open each diagram:

- **Single diagram**: One call to open the diagram
- **Before/after**: Two calls — first for "before" state, then for "after" state. They open as separate tabs in draw.io.

### Step 6: Persist (if in specs context)

If a `specs/active/` directory exists in the current worktree:
- Create `specs/active/diagrams/` directory if it doesn't exist
- Save `.mmd` files there (e.g., `architecture.mmd`, `before.mmd`, `after.mmd`)
- These become reviewable artifacts alongside spec.md and tasks.md

If NOT in a specs context: skip file persistence unless the user explicitly requests saving.

### Step 7: Explain

Provide a brief text explanation of what the diagram shows:
- For single diagrams: describe the key components and relationships
- For before/after: highlight the key differences between the two states
