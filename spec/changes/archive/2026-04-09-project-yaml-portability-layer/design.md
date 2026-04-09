# Design: Project YAML Portability Layer

## Selected Approach
New step contract + bootstrap schema entry. S complexity. 1 new file, 1 modified.

## Stack-to-Config Mapping

| Stack | tech_stack | verify commands | conventions |
|---|---|---|---|
| node-ts | [typescript, node] | [type-check, test, lint] | [Minimal diffs, Spec-first] |
| node | [javascript, node] | [test, lint] | [Minimal diffs, Spec-first] |
| python | [python] | [test, lint] | [Minimal diffs, Spec-first] |
| rust | [rust] | [test, clippy] | [Minimal diffs, Spec-first] |
| go | [go] | [test, vet] | [Minimal diffs, Spec-first] |
| config/docs | [yaml, markdown] | [] | [Minimal diffs, Spec-first, Evidence-based] |

Web projects add: UI review convention, green_base stays 9.

## Open Questions
- None.
