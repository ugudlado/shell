---
description: Prepare a release with changelog and git tag
gitignored: true
project: true
---

## Arguments

$ARGUMENTS — The version tag to create, e.g. v1.3.0 or 1.3.0

Use the Agent tool to spawn a haiku-agent with the following prompt, passing the version argument above:

---

# Release Prep — Autonomous Agent Task

Prepare a release for version: [VERSION from arguments]. Normalize to x.y.z for changelog headings and vx.y.z for git tags.

## Process

### 1. Determine Range

Find the latest existing git tag and list commits between it and HEAD:

```bash
git describe --tags --abbrev=0 2>/dev/null
```

Then list commits in that range:

```bash
git log <LAST_TAG>..HEAD --oneline
```

If no previous tag exists, use all commits.

### 2. Analyze Commits

Read each commit message and diff to classify changes into these categories:

- Added, marked with + prefix: New features, new endpoints, new UI elements. Typically from feat commits.
- Changed, marked with * prefix: Refactors, redesigns, improvements, behavior changes. From refactor/chore/perf commits or feat commits that modify existing behavior.
- Fixed, marked with ! prefix: Bug fixes. From fix commits.
- Removed, marked with - prefix: Deleted features, removed code paths.

Rules:
- Include the Linear ticket ID in parentheses when present
- Keep descriptions concise, one line per change, technical but clear
- Group by app/package using subheadings like ### Mobile, ### API, etc. Skip grouping if all changes are in one app.
- Within each group, order entries: + first, then *, then !, then -

### 3. Draft Changelog Entry

Present the draft to the user in this format:

```
## [x.y.z] - YYYY-MM-DD

+ Added feature description (XX-123)
+ Another added feature (XX-456)

* Changed something (XX-123)
* Another change (XX-456)

! Fixed a bug (XX-123)

- Removed something (XX-123)
```

WAIT for user approval before writing.

### 4. Draft Store Release Notes

Also draft a user-friendly store release notes block for Play Store / App Store. This goes in the `## Store Release Notes` section at the bottom of CHANGELOG.md.

Format:
```
### vx.y.z (Current Release)
\```
[One-line hook sentence about the release theme]

What's New:
• Feature name — short user-friendly description
• ...

Improvements:
• Short description of improvement or fix
• ...
\```
```

Rules:
- Write for end users, not developers — no ticket IDs, no technical jargon
- Lead each bullet with a feature name or short phrase, then a dash and description
- Group new features under "What's New:" and improvements/fixes under "Improvements:"
- Keep it scannable — aim for 6-10 bullets total
- Total store release notes content (inside the code fence) MUST be under 500 characters
- Update the previous release heading from "(Current Release)" to just the version

Present alongside the changelog draft for approval.

### 5. Update CHANGELOG.md

Insert the approved changelog entry under the Unreleased heading. Keep the Unreleased heading empty above it. Also insert or update the store release notes block in the Store Release Notes section.

### 6. Commit and Tag

Stage and commit the changelog, then create the tag:

```bash
git add CHANGELOG.md
```

Commit with message: docs: Update changelog for vx.y.z release

Then create the tag:

```bash
git tag vx.y.z
```

### 7. Report

Output:
- Release version
- Number of changelog entries
- Tag name created
- Remind user to run git push origin main --tags to publish
