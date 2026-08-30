# Research: Glace-Formular nach Bauanleitung

## Decision

- Implement the form as a fixed, product-defined mobile web flow in Next.js 14 with App Router.
- Use a single, hard-coded field sequence matching the Bauanleitung.
- Persist responses and draft sessions server-side through Prisma + SQLite locally / PostgreSQL in production.
- Track field-level interactions with session and correlation identifiers, but keep telemetry limited to field metadata and durations instead of raw browser-level noise.
- Treat newsletter consent as a double-opt-in flow and keep deletion handling in admin/manual workflow for the initial release.

## Rationale

The constitution makes the core decisions binding: fixed form, mobile-first UI, data minimalism, observability, and security. The current feature spec already defines the exact fields, sequence, and tracking goals, so the research focus is on clarifying implementation patterns rather than changing product intent.

Using a fixed form avoids runtime schema generation and keeps the project simpler and more reliable. A server-side draft model is the best fit for resumed sessions without forcing device-specific storage complexity. Field-level telemetry is sufficiently rich to support product insights while avoiding the noise of low-value browser event logging.

## Alternatives considered

1. User-configurable form builder
   - Rejected because it violates the constitution and the “fixed form” requirement.

2. Client-only draft storage (localStorage / IndexedDB)
   - Rejected because it does not provide consistent resume behavior across devices and creates complexity around recovery and validation.

3. Full browser event capture for every tap and render
   - Rejected because it creates noisy telemetry and poor signal-to-noise ratio.

4. Immediate newsletter opt-in without confirmation
   - Rejected because it is weaker on consent clarity and compliance risk.

5. Self-service deletion in v1
   - Deferred as a later product addition; initial requirement is manual admin handling due to scope simplicity and privacy controls.

## Open technical patterns

- Drafts: store incomplete submissions as draft records keyed to sessionId with expiration after inactivity timeout.
- Validation: use Zod schemas to validate required fields and allowed options for each question.
- Telemetry: emit events per field with eventType, fieldId, durationMs, timestamp, and correlationId without storing raw highly sensitive texts.
- Privacy: redact or avoid logging PII values beyond what is necessary for correlation and controlled internal analysis.
