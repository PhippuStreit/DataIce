# Data Model: Glace-Formular

## Core entities

### Submission

Represents one completed or partially completed form instance.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | required | primary key |
| sessionId | UUID | required | browser session correlation |
| correlationId | UUID | required | submission-level trace ID |
| createdAt | datetime | required | start of flow |
| updatedAt | datetime | required | last change |
| submittedAt | datetime | optional | set upon final submit |
| completedAt | datetime | optional | final completion timestamp |
| status | enum | required | draft, submitted, expired, abandoned |
| firstName | string | optional | limited, user-supplied |
| company | string | optional | company picker / free value |
| role | enum | required | mapped from fixed options |
| yearsExperience | enum | required | mapped from fixed options |
| postalCode | string | required | first 2 digits only |
| iceCream | enum | required | fixed options |
| transport | enum | required | fixed options |
| os | enum | required | iPhone / Android |
| appCount | enum | required | option bucket |
| passwordManager | enum | required | yes / no / unknown |
| privacyReading | enum | required | always / sometimes / never / unknown |
| phoneNumber | string | optional | optional contact |
| iceName | string | optional | optional alias / gaming field |
| newsletterConsent | boolean | required | false until double opt-in |
| newsletterConfirmedAt | datetime | optional | confirmation timestamp |
| termsAccepted | boolean | required | required check |

### FieldInteraction

Represents a user event tied to one field or button during a form session.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | required | primary key |
| submissionId | UUID | optional | links to draft/submission |
| sessionId | UUID | required | session correlation |
| correlationId | UUID | required | overall flow trace |
| fieldId | string | required | e.g. field_3_role |
| fieldLabel | string | required | display label |
| fieldType | string | required | select, text, checkbox, button |
| interactionType | string | required | focus, select, click, next, submit |
| startedAt | datetime | required | event start |
| endedAt | datetime | required | event end |
| durationMs | integer | required | endedAt - startedAt |
| value | string | optional | only non-sensitive values |

### Session

Represents an active browser workflow and allows persistence/resume behavior.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| sessionId | UUID | required | primary key |
| createdAt | datetime | required | session start |
| lastActivityAt | datetime | required | activity heartbeat |
| expiresAt | datetime | required | inactivity timeout |
| userAgent | string | optional | device diagnostics |
| platform | string | optional | mobile / desktop |
| screenSize | string | optional | viewport metadata |
| draftStatus | enum | required | active, expired, resumed |

## Relationships

- One session can have many submissions or draft attempts.
- One submission has many field interactions.
- Each field interaction is linked to one session and one optional submission.

## Validation rules

- `firstName` required when creating a final submission.
- `company` required when final submission is created.
- `termsAccepted` must be true for final submit.
- `postalCode` must be numeric and trimmed to 2 digits in the business logic for the relevant question.
- `newsletterConsent` must remain false until confirmed via e-mail confirmation.
- Unfinished submissions remain in `draft` status and must expire after the inactivity timeout.

## State transitions

- `draft` -> `submitted` on successful final submit
- `draft` -> `expired` after inactivity timeout
- `draft` -> `abandoned` when user exits without submitting
- `submitted` -> `retained` within legal retention period
- `submitted` -> `deleted` after retention purge or admin-driven removal
