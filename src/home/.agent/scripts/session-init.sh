#!/bin/bash
# Minimal Session Initialization - High-value automation only
# Rules live in AGENT_RULES.md, this just handles project state

echo "🔍 Project Session State"
echo "========================"

# 1. Current Branch (HIGH VALUE)
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "📍 Current branch: $CURRENT_BRANCH"

# 2. Ticket-Based PRD Discovery (HIGH VALUE)
BRANCH_PRD_FOUND=""
TICKET_NUMBER=""

# Extract ticket number from branch name
if [ "$CURRENT_BRANCH" != "unknown" ]; then
    TICKET_NUMBER=$(echo "$CURRENT_BRANCH" | grep -o '[A-Z]\{3\}-[0-9]\+' | head -1)

    if [ -n "$TICKET_NUMBER" ]; then
        echo "🎫 Detected ticket: $TICKET_NUMBER"
        echo "💡 Use Linear MCP to fetch details: mcp__linear__get_issue({\"id\": \"${TICKET_NUMBER}\"})"

        # Search for PRD containing this ticket number in docs/
        MATCHING_PRD=$(fd "PRD_*.md" docs/ -x rg -l "$TICKET_NUMBER" {} 2>/dev/null | head -1)

        if [ -n "$MATCHING_PRD" ]; then
            BRANCH_PRD_FOUND="$MATCHING_PRD"
            echo "✅ Found ticket-based PRD: $MATCHING_PRD"
            status=$(rg -o "\*\*Status\*\*: [^[:space:]]*" "$MATCHING_PRD" 2>/dev/null | sed 's/**Status**: //' || echo "Unknown")
            container=$(rg -o "Container ID: \`[^`]*\`" "$MATCHING_PRD" 2>/dev/null | sed 's/Container ID: `\(.*\)`/\1/' || echo "No container")
            echo "  Status: $status | Container: $container"
        else
            # Fallback: check for exact branch name match
            DOCS_PRD="docs/PRD_${CURRENT_BRANCH}.md"
            if [ -f "$DOCS_PRD" ]; then
                BRANCH_PRD_FOUND="$DOCS_PRD"
                echo "✅ Found branch-specific PRD: $DOCS_PRD"
                status=$(rg -o "\*\*Status\*\*: [^[:space:]]*" "$DOCS_PRD" 2>/dev/null | sed 's/**Status**: //' || echo "Unknown")
                container=$(rg -o "Container ID: \`[^`]*\`" "$DOCS_PRD" 2>/dev/null | sed 's/Container ID: `\(.*\)`/\1/' || echo "No container")
                echo "  Status: $status | Container: $container"
            fi
        fi
fi

# 3. Project Overview (MEDIUM VALUE)
echo ""
echo "📂 Project Structure:"
eza --tree -L 2 --group-directories-first 2>/dev/null || tree -L 2 -d 2>/dev/null || echo "  Use 'ls' to explore"

# 4. Recent Activity (LOW VALUE)
RECENT_FILES=$(fd -t f --changed-within 1d 2>/dev/null | head -5)
if [ -n "$RECENT_FILES" ]; then
    echo ""
    echo "📝 Recent changes (last 24h):"
    echo "$RECENT_FILES" | while read -r file; do
        echo "  • $file"
    done
fi

# 5. Quick Reminders (MEDIUM VALUE)
echo ""
echo "⚡ Remember:"
echo "  • Follow AGENT_RULES.md (read first if new session)"
echo "  • PRD → Branch → Container → Work"
echo "  • Check docs/project-context.md for project specifics"
echo "  • Use Linear MCP for ticket context when available"
echo "  • Never code without plan approval"

echo ""
echo "Ready! Next steps:"
echo "  1. Read ~/.agent/AGENT_RULES.md (generic rules)"
echo "  2. Read docs/project-context.md (project-specific context)"
echo "  3. Select/create PRD, then proceed with work"
