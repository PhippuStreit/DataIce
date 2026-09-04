# Tasks: Auswertung der Formulardaten

**Input**: [spec.md](spec.md), [plan.md](plan.md)

**Prerequisites**: plan.md, spec.md, sowie die Datenmodelle aus
[001-data-ice-formular/data-model.md](../001-data-ice-formular/data-model.md)
(`Submission`, `FieldStat`, `FieldInteraction`)

**Status**: Alle Tasks umgesetzt (retroactiv dokumentiert).

## Phase 1: Foundational

**Purpose**: Aggregations- und Zugriffsschicht bereitstellen, bevor die Seite gebaut wird.

- [x] T001 Aggregations-Modul mit `mask()` und `getAnalytics()` in `lib/analytics.ts` anlegen
- [x] T002 [P] Basic-Auth-Middleware mit Matcher `/auswertung/:path*` in `middleware.ts` anlegen, gesteuert über `ANALYTICS_USER`/`ANALYTICS_PASSWORD`
- [x] T003 [P] `ANALYTICS_USER`/`ANALYTICS_PASSWORD` in `docker-compose.prod.yml` und `.env.production.example` verdrahten

**Checkpoint**: Aggregation und Zugriffsschutz stehen unabhängig von der Seite bereit.

## Phase 2: User Story 1 - Überblick über die erfassten Einträge (Priority: P1)

**Goal**: KPIs und Verteilungen auf einen Blick.

**Independent Test**: `/auswertung` nach mindestens einer Submission öffnen; KPIs und
Verteilungen erscheinen und stimmen mit der Datenbank überein.

### Implementation for User Story 1

- [x] T004 [US1] Server Component `app/auswertung/page.tsx` mit `dynamic = 'force-dynamic'` anlegen, ruft `getAnalytics()` auf
- [x] T005 [US1] KPI-Kacheln (Gesamtzahl, Ø/Median Ausfülldauer, Newsletter-Quote, AGB-geöffnet-Quote + Ø Lesezeit, Datenschutz-„Ja“-Quote, Ø Erfahrung) in `app/auswertung/page.tsx`
- [x] T006 [US1] Verteilungs-Balken (Einträge/Tag, Rolle, Glacesorten, Warum-hier, OS, Browser, Gerät, Zeitzone, App-Anzahl, Passwortmanager) in `app/auswertung/page.tsx`
- [x] T007 [US1] Maskierung von Vorname/Firma (`mask()`) in der Einträge-Tabelle anwenden
- [x] T008 [US1] Leere Zustände statt Fehler bei fehlenden Daten in `app/auswertung/page.tsx`

**Checkpoint**: User Story 1 eigenständig testbar.

## Phase 3: User Story 2 - Feld-Performance verstehen (Priority: P2)

**Goal**: Welche Felder halten Nutzer auf?

**Independent Test**: Nach einigen Durchläufen zeigt die Feld-Performance-Tabelle Ø/Max
Zeit bis Antwort und Ø Fokuszeit je Feld.

### Implementation for User Story 2

- [x] T009 [US2] `FieldStat.groupBy` (Ø/Max Zeit bis Antwort, Ø Fokuszeit, Ø Änderungen, n) in `lib/analytics.ts` (`fieldPerformance`)
- [x] T010 [US2] Feld-Performance-Tabelle, absteigend nach Ø Zeit sortiert, in `app/auswertung/page.tsx`

**Checkpoint**: User Story 2 eigenständig testbar.

## Phase 4: User Story 3 - Zugriff beschränken (Priority: P2)

**Goal**: Seite nicht offen für jeden im Internet.

**Independent Test**: `ANALYTICS_PASSWORD` setzen, Seite ohne Credentials aufrufen → 401;
mit korrekten Credentials → 200.

### Implementation for User Story 3

- [x] T011 [US3] HTTP-Basic-Auth-Check inkl. `WWW-Authenticate`-Header in `middleware.ts`
- [x] T012 [US3] Sichtbarer Warnhinweis auf der Seite, wenn `ANALYTICS_PASSWORD` nicht gesetzt ist, in `app/auswertung/page.tsx`

**Checkpoint**: User Story 3 eigenständig testbar (401/200-Verhalten).

## Phase 5: Polish

- [x] T013 [P] Test-/Entwicklungs-Submissions (`TEST_FIRST_NAMES`, case-insensitiv) aus allen Auswertungsteilen filtern (FR-A10) in `lib/analytics.ts`
- [x] T014 CSV-Export-Skript (`scripts/export-data.sh`) und Datenlösch-Skript (`scripts/wipe-data.sh`) als Begleitwerkzeuge zur Auswertung ergänzt

## Dependencies & Execution Order

- Phase 1 (Foundational) blockiert alle User Stories.
- User Story 1 und User Story 2 sind unabhängig voneinander (beide lesen `getAnalytics()`,
  aber unterschiedliche Felder davon) und können parallel entwickelt werden.
- User Story 3 (Zugriffsschutz) ist unabhängig von 1 und 2 und kann jederzeit parallel
  laufen.
- Phase 5 (Polish) baut auf allen drei User Stories auf.

## Implementation Strategy

### MVP first

1. Phase 1 abschliessen (Aggregation + Zugriffsschutz-Grundgerüst).
2. User Story 1 (Überblick) fertigstellen — liefert den Kernnutzen der Seite.
3. User Story 3 (Zugriffsschutz) direkt danach, bevor die Seite irgendwo verlinkt wird.
4. User Story 2 (Feld-Performance) ergänzen.
5. Polish: Test-Daten-Filter, Begleit-Skripte.
