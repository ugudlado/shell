---
name: diagram
description: "Generate visual diagrams (flowchart, sequence, class, state, ER, C4) via draw.io. Use when user asks for a diagram, visualization, or architecture overview."
user-invocable: true
args:
  - name: type
    description: "Diagram type: flowchart, sequence, class, state, er, c4 (optional — auto-detected)"
    required: false
  - name: subject
    description: What to diagram (optional)
    required: false
---

## Orchestration

1. Parse `$ARGUMENTS` for diagram type and subject
2. Spawn `architect` agent to analyze the codebase and produce diagram content
3. Render via draw.io MCP (mermaid or CSV format)
4. Present the diagram to the user
