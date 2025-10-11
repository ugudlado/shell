# Implementation Plan: [FEATURE_NAME]

## Technical Overview
High-level technical approach and architecture decisions.

## Technology Stack
- **Backend**:
- **Frontend**:
- **Database**:
- **Testing**:
- **Deployment**:

## System Architecture

### Components
List the main components that need to be built or modified:

1.
2.
3.

### Dependencies
External libraries, services, or systems this feature depends on:

-
-
-

## API Design

### Endpoints
If this feature requires new API endpoints:

```
POST /api/v2/[resource]
GET /api/v2/[resource]
PUT /api/v2/[resource]/:id
DELETE /api/v2/[resource]/:id
```

### Request/Response Schemas
Key data structures:

```typescript
interface FeatureRequest {
  // Define request structure
}

interface FeatureResponse {
  // Define response structure
}
```

## Data Model

### Database Changes
New tables, columns, or modifications needed:

```sql
-- Example table
CREATE TABLE feature_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Relationships
How this feature's data relates to existing data:

-
-

## Frontend Components

### New Components
Components that need to be created:

1. `FeatureComponent` - Purpose and location
2. `FeatureForm` - Purpose and location
3. `FeatureList` - Purpose and location

### Modified Components
Existing components that need updates:

-
-

## Testing Strategy

### Unit Tests
What needs unit test coverage:

-
-

### Integration Tests
API endpoints and workflows to test:

-
-

### E2E Tests
User journeys to automate:

-
-

## Security Considerations
Authentication, authorization, and data protection requirements:

-
-

## Performance Requirements
Expected load, response times, and optimization needs:

-
-

## Migration & Deployment
Steps needed to deploy this feature safely:

1.
2.
3.

## Rollback Plan
How to safely revert if issues arise:

1.
2.
3.