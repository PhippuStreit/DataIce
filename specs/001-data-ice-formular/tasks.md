# Tasks: Glace-Formular nach Bauanleitung

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/form-contract.md](contracts/form-contract.md)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize the project skeleton and shared tooling before any form logic is implemented.

- [ ] T001 Create the project structure in `app/`, `components/`, `lib/`, `prisma/`, `types/`, and `tests/`
- [ ] T002 [P] Initialize the Next.js 14 + TypeScript project and add `next`, `react`, `react-dom`, `tailwindcss`, `prisma`, `zod`, and test dependencies in `package.json`
- [ ] T003 [P] Configure TypeScript, Tailwind, and environment defaults in `tsconfig.json`, `tailwind.config.ts`, `.env.example`, and `next.config.mjs`
- [ ] T004 [P] Add base app shell, global styling, and mobile-first layout tokens in `app/layout.tsx`, `app/globals.css`, and `app/page.tsx`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared schema, validation, persistence, and telemetry foundations used by all user stories.

- [ ] T005 Define the Prisma schema and migration model for `Submission`, `FieldInteraction`, and `Session` in `prisma/schema.prisma`
- [ ] T006 [P] Create the shared validation schema and option constants in `lib/validation.ts` and `lib/form-schema.ts`
- [ ] T007 [P] Create the database client and repository helpers in `lib/db.ts` and `lib/submission-service.ts`
- [ ] T008 Create the structured logging utility and correlation/session helpers in `lib/logger.ts`
- [ ] T009 Implement the fixed-form definition registry in `lib/form-definition.ts` so field order, labels, and option lists are product-defined and not user-editable
- [ ] T010 [P] Create the shared form-type contracts in `types/form.ts` and `types/telemetry.ts`

**Checkpoint**: Foundation ready; user stories can begin in parallel after this phase completes.

## Phase 3: User Story 1 - Fixed Glace form definition (Priority: P1)

**Goal**: Implement the hard-coded form structure from the Bauanleitung without a user-configurable builder.

**Independent Test**: Open the form and verify the required sections, order, field labels, and required fields match the product specification.

### Implementation for User Story 1

- [ ] T011 [P] [US1] Create the section layout and fixed question flow in `components/FormSection.tsx` and `components/GlaceForm.tsx`
- [ ] T012 [US1] Render all fields from the Bauanleitung in the correct order and grouping in `app/page.tsx` and `components/FieldInput.tsx`
- [ ] T013 [US1] Add required-field logic, option mapping, and form-state management in `components/GlaceForm.tsx` and `lib/form-definition.ts`
- [ ] T014 [US1] Add final consent step and checkbox validation for terms/newsletter handling in `components/GlaceForm.tsx`

**Checkpoint**: User Story 1 is independently testable and the fixed form matches the spec.

## Phase 4: User Story 2 - Mobile-first interaction UX (Priority: P1)

**Goal**: Ensure the form is touch-friendly, clear, and practical on phones with minimal text input.

**Independent Test**: Open the form on a mobile viewport and confirm all interactive elements are usable without text-heavy or confusing flows.

### Implementation for User Story 2

- [ ] T015 [P] [US2] Add touch-friendly sizing and mobile spacing rules in `app/globals.css`
- [ ] T016 [US2] Implement button-first controls and reduced text inputs for name / postcode in `components/FieldInput.tsx`
- [ ] T017 [US2] Add inline error messaging and inline validation feedback in `components/FieldInput.tsx` and `components/ErrorBanner.tsx`
- [ ] T018 [US2] Add progress/context clarity for multi-step sections in `components/ProgressBar.tsx` and `components/GlaceForm.tsx`

**Checkpoint**: User Story 2 is independently testable on a mobile viewport.

## Phase 5: User Story 3 - Persistence, validation, and submission flow (Priority: P1)

**Goal**: Persist form submissions and drafts, validate server-side input, and provide a reliable submit endpoint.

**Independent Test**: Submit a complete form and verify the record is stored and retrievable through the API with the correct values.

### Implementation for User Story 3

- [ ] T019 [P] [US3] Implement the submission API contract in `app/api/submit/route.ts`
- [ ] T020 [US3] Validate request payloads and enforce required fields in `lib/validation.ts`
- [ ] T021 [US3] Persist the final submission and related metadata through Prisma in `lib/submission-service.ts`
- [ ] T022 [US3] Add draft save/resume flow and inactivity timeout handling in `lib/session-store.ts` and `app/api/drafts/route.ts`
- [ ] T023 [US3] Add API error response handling and user-facing error formatting in `app/api/submit/route.ts` and `components/ErrorBanner.tsx`

**Checkpoint**: User Story 3 is independently testable against the stored data and submit contract.

## Phase 6: User Story 4 - Telemetry and analytics (Priority: P2)

**Goal**: Record field-level interaction timing and correlation metadata without storing excessive personal data.

**Independent Test**: Complete a form session and confirm each field interaction emits telemetry with correlation/session tracing and timing metrics.

### Implementation for User Story 4

- [ ] T024 [P] [US4] Implement client-side telemetry event capture in `components/GlaceForm.tsx` and `lib/telemetry.ts`
- [ ] T025 [US4] Attach session and correlation IDs, field metadata, action type, and duration values to each event in `lib/telemetry.ts`
- [ ] T026 [US4] Persist field interactions to the database and expose aggregate stats in `app/api/stats/route.ts`
- [ ] T027 [US4] Enforce privacy rules so telemetry excludes direct sensitive values beyond required identifiers in `lib/telemetry.ts` and `lib/logger.ts`

**Checkpoint**: User Story 4 is independently testable by reviewing stored telemetry and aggregate metrics.

## Phase 7: Final Polish & Cross-Cutting Concerns

**Purpose**: Finish the product with documentation, security checks, and final validation across all stories.

- [ ] T028 [P] Add project documentation and setup instructions in `README.md` and `specs/001-data-ice-formular/quickstart.md`
- [ ] T029 [P] Validate the environment configuration and secrets handling in `.env.example` and deployment docs
- [ ] T030 [P] Run the validation scenarios from `specs/001-data-ice-formular/quickstart.md` for mobile UX, drafts, submission, and telemetry
- [ ] T031 Harden error handling, privacy logging, and retention-policy guardrails in `lib/logger.ts`, `lib/submission-service.ts`, and `app/api/submit/route.ts`
- [ ] T032 Final cleanup: remove dead code, verify no user-configurable builder remains, and confirm all required file paths match the implementation plan

## Dependencies & Execution Order

### Phase dependency order

- Phase 1: Setup
- Phase 2: Foundational
- Phase 3: User Story 1
- Phase 4: User Story 2
- Phase 5: User Story 3
- Phase 6: User Story 4
- Phase 7: Polish

### Story dependency rules

- User Story 1 depends on the Foundational phase.
- User Story 2 depends on Foundation and the fixed-form definition from User Story 1.
- User Story 3 depends on Foundation and the validated fixed-form interaction flow.
- User Story 4 depends on the persisted submission flow and the telemetry model.

## Parallel Execution Examples

### Phase 1 parallel work

- `T002` initialize project dependencies
- `T003` configure TypeScript and Tailwind
- `T004` add base app shell and global styling

### User Story 1 parallel work

- `T011` section layout and fixed question flow
- `T013` validation and state logic
- `T014` final consent step

### User Story 3 parallel work

- `T019` submission API
- `T020` server validation
- `T021` persist submission records

## Implementation Strategy

### MVP first

1. Complete Phase 1 and Phase 2.
2. Finish User Story 1 to establish a valid fixed form.
3. Validate the form on mobile before moving on to analytics and persistence.
4. Complete User Story 3 to ensure real data storage works.
5. Add User Story 4 telemetry as a behavior-tracking layer after the core flow is stable.
6. Finish with Phase 7 polish and cross-cutting validation.

### Incremental delivery

- Story 1 gives the core product value: the fixed form works.
- Story 2 gives the targeted mobile experience.
- Story 3 adds persistence and real backend behavior.
- Story 4 adds analytics and observability without changing the fixed form contract.
