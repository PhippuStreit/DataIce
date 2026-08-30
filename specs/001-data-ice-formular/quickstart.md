# Quickstart: Validation Guide

## Prerequisites

- Node.js 20 LTS
- npm or pnpm
- SQLite for local development
- Optional PostgreSQL for production parity

## Setup

1. Install dependencies.
2. Configure environment variables for database connection and log level.
3. Run Prisma migration for the initial schema.
4. Start the Next.js app in development mode.

## Validation scenarios

### 1. Form loads on mobile

- Open the app on a narrow viewport.
- Confirm the form renders in single-column flow.
- Verify buttons are at least 48px tall and touch-friendly.
- Confirm the field order matches the Bauanleitung sequence.

Expected result: the form is readable and usable without text-heavy input patterns.

### 2. Draft resume flow

- Start a submission, fill a few fields, then simulate a session timeout or reload.
- Confirm the app restores the draft from server-side storage.
- Resume or restart the form and verify the correct state is restored.

Expected result: the user can continue the form without data loss.

### 3. Final submission

- Complete all required fields and accept terms.
- Submit the form.
- Verify the stored record appears in the database with correct values and timestamps.

Expected result: submission succeeds and persisted values match the chosen answers.

### 4. Telemetry verification

- Trigger a field focus/select and continue to the next field.
- Confirm the telemetry log includes fieldId, interactionType, durationMs, and correlationId.

Expected result: per-field telemetry is stored and linked to the same session.

### 5. Consent and privacy behavior

- Submit a form with newsletter checked but without double-opt-in confirmation.
- Verify the marketing flag remains inactive until confirmation occurs.
- Confirm the app does not log sensitive values in plain text.

Expected result: consent is not activated prematurely and stored data stays privacy-conscious.
