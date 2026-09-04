# Implementation Plan: Auswertung der Formulardaten

**Branch**: `002-auswertung` | **Date**: 2026-09-03 | **Spec**: [spec.md](spec.md)

**Status**: Umgesetzt (Plan retroactiv dokumentiert — Feature wurde direkt implementiert,
dieser Plan hält die getroffenen Entscheidungen für Nachvollziehbarkeit fest.)

## Summary

Eine rein lesende, serverseitig gerenderte Übersichtsseite unter `/auswertung`, die die
in [001-data-ice-formular](../001-data-ice-formular/spec.md) erfassten `Submission`-,
`FieldStat`- und `FieldInteraction`-Daten aggregiert: KPIs, Verteilungen, Feld-Performance
und eine Tabelle der jüngsten Einträge mit maskiertem Vorname/Firma. Keine neue
Datenhaltung, kein Schreibzugriff, kein separater API-Layer — eine Next.js Server
Component liest direkt über Prisma.

## Technical Context

**Language/Version**: TypeScript, Next.js 14 App Router (React Server Components)

**Primary Dependencies**:
- Next.js 14 (Server Component, kein Client-JS für die Datenanzeige)
- Prisma ORM (liest `Submission`, `FieldStat`)
- Tailwind CSS (bestehendes Design-System der App)

**Storage**: PostgreSQL (produktiv) — dieselbe Datenbank wie 001, keine neuen Tabellen.

**Testing**: kein dediziertes Testsetup für diese Seite; manuell gegen echte/Test-Daten
verifiziert (siehe Acceptance Scenarios in spec.md).

**Target Platform**: Server-gerendert, im Browser (Desktop bevorzugt für Tabellen, aber
responsive).

**Project Type**: Ergänzende Seite innerhalb der bestehenden Next.js-App aus 001.

**Performance Goals**: Ladezeit dominiert durch zwei Prisma-Queries (`findMany` +
`groupBy`); kein Caching (`dynamic = 'force-dynamic'`), da Live-Daten gefordert sind
(FR-A07).

**Constraints**:
- Keine unmaskierten Klarnamen/Firmen (FR-A02, FR-A09)
- Keine Telefonnummer/IP-Adresse in der Anzeige (FR-A09)
- Zugriff nur mit Credentials, sobald `ANALYTICS_PASSWORD` gesetzt ist (FR-A08)
- Reine Leseoperation, keine Schreibpfade

**Scale/Scope**: Eine Seite, ein Aggregations-Modul, ein Middleware-Gate. Erwartete
Datenmenge: einige hundert Submissions pro Event.

## Architecture Decision

### 1. Datenzugriff
- Ein Modul `lib/analytics.ts` kapselt alle Prisma-Queries und die Aggregationslogik
  (`getAnalytics()`), inklusive Maskierung (`mask()`) und Test-Daten-Filter
  (`TEST_FIRST_NAMES`).
- Keine eigene REST-/API-Route: die Seite ist eine Server Component, die `getAnalytics()`
  direkt beim Rendern aufruft. Kein Client-seitiger Datenabruf nötig, keine
  Client/Server-Vertragsdefinition (kein `contracts/`-Ordner für dieses Feature).

### 2. Zugriffsschutz
- `middleware.ts` mit Matcher `/auswertung/:path*` prüft HTTP Basic Auth gegen
  `ANALYTICS_USER`/`ANALYTICS_PASSWORD` (Env-Variablen). Ohne gesetztes Passwort bleibt
  die Seite offen, zeigt aber einen Warnhinweis auf der Seite selbst (FR-A08).
- Bewusst keine eigene Login-Seite/Session — Basic Auth ist für ein internes,
  kurzlebiges Event-Dashboard ausreichend und am wartungsärmsten.

### 3. Darstellung
- Serverseitig gerenderte Tabellen/Balken (reines HTML/CSS, keine Chart-Bibliothek) für
  minimale Bundle-Grösse und weil die Datenmengen klein sind.
- Maskierung (`mask()`) passiert serverseitig vor dem Rendern — der Klarname verlässt nie
  den Server-Prozess in Richtung Client.

## Project Structure

```text
app/
├── auswertung/
│   └── page.tsx          # Server Component, dynamic = 'force-dynamic'
lib/
├── analytics.ts           # getAnalytics(), mask(), TEST_FIRST_NAMES
middleware.ts               # Basic-Auth-Gate für /auswertung/:path*
```

## Structure Decision

Kein eigenständiger Service, keine neue Datenbanktabelle, keine API-Route. Die Auswertung
ist bewusst als dünne Lese-Schicht über den bestehenden Daten aus 001 gebaut — passend zum
Grundsatz aus 001 (FR-008/FR-009), keine unnötige technische Komplexität aufzubauen.

## Constitution Check

- Rein lesend, keine neue Schreib-Oberfläche: pass
- Keine Klarnamen/Personendaten über die Maskierung hinaus sichtbar: pass
- Zugriffsschutz vorhanden, mit sichtbarem Warnhinweis falls nicht konfiguriert: pass
- Keine neue technische Komplexität (kein eigener API-Layer, keine Chart-Library): pass

## Complexity Tracking

Keine Abweichungen von der einfachen Architektur nötig.
