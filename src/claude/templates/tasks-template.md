# Implementation Tasks: [FEATURE_NAME]

## Task Execution Order

Tasks are numbered in dependency order. Tasks marked with [P] can be executed in parallel with other [P] tasks in the same group.

## Setup Tasks

### T001: Project Setup
- **Description**: Initialize feature branch and development environment
- **Files**: N/A (git operations)
- **Dependencies**: None
- **Parallel**: No

### T002: Install Dependencies [P]
- **Description**: Add any new dependencies required for this feature
- **Files**: `package.json`, `pnpm-lock.yaml`
- **Dependencies**: T001
- **Parallel**: Yes

## Test Tasks (TDD Approach)

### T003: Create API Contract Tests [P]
- **Description**: Write tests for API endpoints before implementation
- **Files**: `tests/api/[feature].test.ts`
- **Dependencies**: T002
- **Parallel**: Yes

### T004: Create Component Tests [P]
- **Description**: Write tests for frontend components before implementation
- **Files**: `client/src/components/[feature]/[Component].test.tsx`
- **Dependencies**: T002
- **Parallel**: Yes

### T005: Create Integration Tests [P]
- **Description**: Write E2E tests for user workflows
- **Files**: `tests/e2e/[feature].spec.ts`
- **Dependencies**: T002
- **Parallel**: Yes

## Core Implementation Tasks

### T006: Database Schema
- **Description**: Create/modify database tables and relationships
- **Files**: `shared/schema.ts`, migration files
- **Dependencies**: T003
- **Parallel**: No

### T007: Data Repository Layer
- **Description**: Implement data access methods
- **Files**: `server/repositories/[feature]Repository.ts`
- **Dependencies**: T006
- **Parallel**: No

### T008: Business Logic Services
- **Description**: Implement core business logic
- **Files**: `server/services/[feature]Service.ts`
- **Dependencies**: T007
- **Parallel**: No

### T009: API Controllers [P]
- **Description**: Implement API endpoint handlers
- **Files**: `server/controllers/[feature]Controller.ts`
- **Dependencies**: T008
- **Parallel**: Yes

### T010: API Routes [P]
- **Description**: Define API routes and middleware
- **Files**: `server/routes/[feature].routes.ts`
- **Dependencies**: T009
- **Parallel**: Yes

### T011: Frontend Components [P]
- **Description**: Implement React components
- **Files**: `client/src/components/[feature]/`
- **Dependencies**: T004
- **Parallel**: Yes

### T012: Frontend State Management [P]
- **Description**: Implement Zustand stores and hooks
- **Files**: `client/src/stores/[feature]Store.ts`
- **Dependencies**: T011
- **Parallel**: Yes

### T013: Frontend Integration [P]
- **Description**: Connect components to API and state
- **Files**: Component files, hook files
- **Dependencies**: T010, T012
- **Parallel**: Yes

## Integration Tasks

### T014: Route Integration
- **Description**: Add routes to main router
- **Files**: `server/app.ts`, `client/src/App.tsx`
- **Dependencies**: T010, T013
- **Parallel**: No

### T015: Permission Integration
- **Description**: Add authorization checks if needed
- **Files**: Middleware files, permission services
- **Dependencies**: T014
- **Parallel**: No

### T016: Database Migration
- **Description**: Run database migrations in development
- **Files**: N/A (migration commands)
- **Dependencies**: T015
- **Parallel**: No

## Polish Tasks

### T017: Unit Test Coverage [P]
- **Description**: Ensure all services and utilities have unit tests
- **Files**: Various `.test.ts` files
- **Dependencies**: T016
- **Parallel**: Yes

### T018: Performance Optimization [P]
- **Description**: Add caching, optimize queries, etc.
- **Files**: Service files, component files
- **Dependencies**: T016
- **Parallel**: Yes

### T019: Error Handling [P]
- **Description**: Add comprehensive error handling and user feedback
- **Files**: Controllers, components, error boundaries
- **Dependencies**: T016
- **Parallel**: Yes

### T020: Documentation [P]
- **Description**: Update API docs and component documentation
- **Files**: README updates, inline documentation
- **Dependencies**: T016
- **Parallel**: Yes

## Parallel Execution Groups

**Group 1** (After T002): T003, T004, T005
**Group 2** (After T008): T009, T010, T011, T012
**Group 3** (After T010, T012): T013
**Group 4** (After T016): T017, T018, T019, T020

## Task Execution Approach

**Use `/implement [LINEAR-ID]` workflow** - Handles TDD implementation with automatic quality gates and parallel execution.

The workflow automatically:
- Executes tasks in dependency order
- Runs parallel tasks concurrently
- Applies PR review toolkit (4 parallel quality gates)
- Ensures ≥9/10 code reviews and ≥90% test coverage

For manual task execution (if needed):
```bash
# Backend tasks
Skill("backend-engineer")  # Auto-loads project patterns
Task(description="Task description", subagent_type="sonnet-agent", prompt="...")

# Frontend tasks
Skill("frontend-engineer")  # Auto-loads project patterns
Task(description="Task description", subagent_type="sonnet-agent", prompt="...")

# Complex analysis
Task(description="Architecture review", subagent_type="opus-agent", prompt="...")

# Fast operations
Task(description="Quick fix", subagent_type="haiku-agent", prompt="...")
```