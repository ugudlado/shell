# PRD Examples for Different Scenarios

## 🎯 Feature Example: User Authentication System

### Workflow Applied
1. **Container** - Set up `auth-feature` environment
2. **Context** - Read project-context.md, found existing auth patterns
3. **PRD** - Created `PRD_auth-feature.md` with initial requirements
4. **Plan Mode** - Refined PRD through 3 iterations:
   - V1: Basic login/logout
   - V2: Added password reset, session management
   - V3: Added OAuth integration, security requirements
5. **Implement** - Built according to approved PRD v3
6. **Test** - Validated all auth flows, documented in PRD
7. **Document** - Finalized PRD with deployment notes

### PRD Updates During Development
- **Research Phase**: Documented existing auth libraries, security patterns
- **Design Phase**: Evaluated JWT vs sessions, chose JWT with rationale
- **Implementation**: Updated progress daily, noted integration challenges
- **Testing**: Documented test scenarios, edge cases discovered
- **Deployment**: Added monitoring requirements, rollback procedures

## 🐛 Bug Fix Example: Payment Processing Error

### Workflow Applied
1. **Container** - Set up `fix-payment-error` environment
2. **Context** - Read project-context.md, payment service architecture
3. **PRD** - Created `PRD_fix-payment-error.md` with error reproduction
4. **Plan Mode** - Refined PRD through root cause analysis:
   - V1: Symptom description
   - V2: Added 5 Whys analysis, identified race condition
   - V3: Final fix approach with testing strategy
5. **Implement** - Applied fix, added retry mechanism
6. **Test** - Validated fix under load, documented results
7. **Document** - Added monitoring alerts, prevention measures

### PRD Updates During Debugging
- **Investigation**: Documented debugging steps, hypotheses tested
- **Root Cause**: 5 Whys analysis revealed database connection pooling issue
- **Solution**: Compared 3 approaches, chose connection pool optimization
- **Testing**: Documented load testing results, performance improvements
- **Prevention**: Added monitoring, alerting rules

## 🔄 Refactor Example: Database Layer Optimization

### Workflow Applied
1. **Container** - Set up `db-optimization` environment
2. **Context** - Read project-context.md, current DB architecture
3. **PRD** - Created `PRD_db-optimization.md` with performance analysis
4. **Plan Mode** - Refined PRD through architecture review:
   - V1: Performance problem identification
   - V2: Added query analysis, bottleneck identification
   - V3: Comprehensive refactoring plan with migration strategy
5. **Implement** - Refactored in phases, maintained compatibility
6. **Test** - Performance benchmarks, regression testing
7. **Document** - Updated architecture docs, migration guide

### PRD Updates During Refactoring
- **Analysis**: Documented current performance metrics, query patterns
- **Design**: Evaluated ORM vs raw SQL, chose hybrid approach
- **Implementation**: Tracked migration progress, compatibility issues
- **Testing**: Documented before/after performance comparisons
- **Knowledge**: Captured patterns for future DB optimization

## 📊 Context Switching Example

### Scenario: Agent A → Agent B Handoff
**Agent A** (Claude) worked on authentication feature for 2 days, then **Agent B** (Gemini) took over:

#### Agent A's Final PRD Update:
```markdown
### Context Switching Notes
- **Handoff Summary**: OAuth integration 80% complete, Google/GitHub working, Apple pending
- **Current State**: Unit tests passing, integration tests failing on Apple OAuth
- **Next Steps**: Debug Apple OAuth scope issues, add error handling for edge cases
- **Blockers**: Apple developer account access needed for testing
- **Key Files**: src/auth/oauth.js, tests/auth/oauth.test.js
- **Debugging Notes**: Apple returns different user object structure
```

#### Agent B's First PRD Update:
```markdown
### Context Switching Notes
- **Received From**: Agent A (Claude) - OAuth integration handoff
- **Current Understanding**: Apple OAuth failing due to user object structure differences
- **Investigation Plan**: Review Apple OAuth docs, compare user objects
- **Questions Resolved**: Found Apple uses 'sub' instead of 'id' for user identifier
- **Progress**: Fixed Apple OAuth, all tests passing
```

## 🎯 Best Practices Demonstrated

### PRD as Living Document
- **Initial**: High-level requirements
- **Planning**: Detailed design, task breakdown
- **Development**: Progress tracking, issue resolution
- **Testing**: Results, edge cases discovered
- **Deployment**: Rollout plan, monitoring setup
- **Post-Deploy**: Lessons learned, follow-up items

### Knowledge Preservation
- **Decisions**: Why we chose approach X over Y
- **Discoveries**: What we learned about the codebase
- **Pitfalls**: What didn't work and why
- **Patterns**: Reusable solutions identified
- **Context**: Why this feature was needed

### Agent Collaboration
- **Handoff Notes**: Clear state transfer
- **Progress Summary**: What's done, what's pending
- **Blockers**: What needs external help
- **Key Insights**: Important discoveries to preserve
- **Next Steps**: Clear actionable items

---
*These examples show how PRD documents serve as the single source of truth for any development work, enabling seamless collaboration and knowledge preservation across agents and time.*