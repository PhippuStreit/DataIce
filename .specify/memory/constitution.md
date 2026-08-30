# Data Ice Constitution

**Purpose**: Fixed, mobile-first Glace form based on the Bauanleitung. Product-defined, not user-configurable.

## Rules

1. **Fixed form** — Form structure, fields, order, wording, and logic are product-defined. No builder, no schema config, no user customization.
2. **Mobile first** — Optimized for phone use. Touch-friendly, readable on small screens, simple navigation. UI uses clicks/buttons/selections only, no text input where avoidable.
3. **Data minimal** — Only required data. No direct questions on health, religion, politics, origin. No sensitive data in logs.
4. **Real validation** — All fields validated by type. Required fields blocked with clear feedback. Responses stored and retrievable.
5. **Observable** — Structured logs for requests, validation, submission, errors. Correlation IDs on submissions. Actionable diagnostics.
6. **Tracked and measured** — Every user action is tracked: field view time, time-to-complete per field, interaction type, timestamps. Field completion timing drives UX research and optimization.
7. **Simple** — Smallest implementation that works. No abstraction or features without concrete need. Frontend + API + DB.
8. **Secure** — Validate inputs. Secrets in env vars. HTTPS production. No stack traces to users.

## Scope
- One fixed form for Glace.
- Mobile-first, hand-held optimized.
- Database persistence.
- Form follows Bauanleitung exactly.
- No form editor or schema builder.

## Technology Stack (Binding Decisions)

**Language & Runtime**:
- TypeScript
- Node.js 20 LTS
- React 18+

**Frontend**:
- Next.js 14 with App Router
- Tailwind CSS for styling
- Client-side interaction tracking

**Backend**:
- Next.js API routes or Server Actions
- Zod for validation

**Database**:
- PostgreSQL (production)
- SQLite (local development)

**ORM**:
- Prisma

**Testing**:
- Vitest (unit tests)
- React Testing Library (component tests)
- Playwright (mobile UI & e2e tests)

**Deployment**:
- Vercel (preferred) or containerized on own server

## Quality Gates
Every change must satisfy:
- Spec match ✓
- Real behavior tests ✓
- Logging/error handling ✓
- Privacy intact ✓
- No unnecessary complexity ✓
- Security basics met ✓

## Logging & Observability Standards

**Format**: Structured JSON logs with consistent fields
**Required fields per log entry**: timestamp, level, correlationId, sessionId, event, message, duration (if applicable)

**What MUST be logged**:
- Form submission start/end (with correlationId)
- Each field validation result (fieldId, value, valid/invalid, error message)
- Field interaction events (fieldId, interactionType, durationMs, timestamp)
- API errors and failures (endpoint, statusCode, errorMessage)
- Database operations (operation, table, success/failure, duration)

**Log levels**:
- Development: DEBUG (all events)
- Production: INFO (submissions, errors) + ERROR (failures only)

**Correlation & Session IDs**:
- correlationId: UUID per form submission, attached to all related logs
- sessionId: UUID per browser session, tracks multi-step interactions

## Data Model & Core Entities

**Submission**:
- id (UUID)
- sessionId (UUID)
- correlationId (UUID)
- createdAt, submittedAt, completedAt (timestamps)
- firstName, company, role, yearsExperience, postalCode, iceCream, transport, os, appCount, passwordManager, privacyReading, phoneNumber, iceName
- newsletter (boolean)
- termsAccepted (boolean)

**FieldInteraction** (tracking):
- id
- submissionId / correlationId (foreign key)
- fieldId (e.g. "field_1_firstName")
- fieldName (display name)
- interactionType (click, select, textInput, navigate)
- startedAt, endedAt (timestamps)
- durationMs (endedAt - startedAt)
- value (optional, only if not sensitive)

**Session**:
- sessionId (UUID)
- createdAt, lastActivityAt
- userAgent, platform, screenSize
- interactions count

## Error Handling Standards

**Validation Errors** (user-facing):
- Clear, simple language in German
- Example: "Bitte wähle deine Firma" (not "Field company required")
- Shown inline or near field

**API Errors** (server):
- Return structured error response: `{ error: "error_code", message: "user-facing message" }`
- Log full error with stack trace (ERROR level)
- Never expose stack traces to client

**Offline Fallback**:
- Client-side queue for failed submissions
- Retry on reconnection
- Notify user of unsent data

## Data Retention & Privacy Policy

**Submission data** (form responses):
- Retention: 2 years from submission date (configurable)
- Deletion: Hard delete after retention period
- PII: firstName + company = identifying; kept only as needed

**Telemetry data** (field interactions):
- Retention: 90 days from submission (for UX analysis)
- Aggregation: After 30 days, store only aggregated stats (avg duration per field)
- Deletion: Individual records deleted after 90 days

**Logs**:
- Retention: 30 days in production
- No PII in logs except correlationId and sessionId
- Exclude field values from logs (only fieldId, type, duration)

**User deletion**:
- Data deletion via admin UI or API endpoint
- Cascading delete: submission + all related interactions
- Audit log entry for deletion

## API Contract Principles

**POST /api/submit**:
```json
{
  "correlationId": "UUID",
  "sessionId": "UUID",
  "data": { /* form fields */ },
  "interactions": [ /* FieldInteraction array */ ]
}
```

**GET /api/stats**:
```json
{
  "fieldMetrics": [
    {
      "fieldId": "field_1_firstName",
      "avgDurationMs": 1234,
      "completionRate": 0.98,
      "errorCount": 5
    }
  ]
}
```

**Error response**:
```json
{
  "status": 400,
  "error": "validation_failed",
  "message": "Bitte füllen Sie alle Pflichtfelder aus"
}
```

## Environment & Secrets Management

**Environment variables** (required):

*Development*:
- `NODE_ENV=development`
- `DATABASE_URL=sqlite:./dev.db` (or PostgreSQL connection string)
- `LOG_LEVEL=debug`

*Production*:
- `NODE_ENV=production`
- `DATABASE_URL=<PostgreSQL DSN from secure vault>`
- `LOG_LEVEL=info`
- `ALLOWED_ORIGINS=<production domain>`
- `SESSION_SECRET=<random 32+ char secret>`

**Secrets handling**:
- Never commit `.env` files
- Use `.env.example` with placeholder values
- Production secrets in environment only, not in code
- Rotate secrets annually

**Version**: 1.4.0 | **Ratified**: 2026-08-30
