# Feature Specification: Auswertung der Formulardaten

**Feature Branch**: `002-auswertung`

**Created**: 2026-09-03

**Last Updated**: 2026-09-04

**Status**: Umgesetzt

**Input**: User description: "Eine intelligente Seite bauen, wo die Daten ausgewertet werden können. Firma und Vorname darin mit den zwei ersten Buchstaben und Rest * ausfüllen."

Aufbauend auf [001-data-ice-formular](../001-data-ice-formular/spec.md) und dessen
Besucher-Telemetrie (Submission-Kontext, `FieldStat`, `FieldInteraction`). Diese Datei
enthält bewusst nur diese eine Feature-Spec, keine dauerhafte Session-Historie – neue
Anpassungen werden direkt in Requirements/Ist-Stand nachgeführt und unten im Änderungsverlauf
vermerkt.

## Clarifications

### Session 2026-09-03

- Vorname und Firma werden in der Auswertung maskiert: erste zwei Zeichen, jeder weitere Buchstabe als `*` (`Philippe` → `Ph******`, `AB` → `AB`).
- Die Seite wird per HTTP-Basic-Auth geschützt, aktiv sobald `ANALYTICS_PASSWORD` gesetzt ist. Ohne Passwort ist sie offen erreichbar und zeigt einen Warnhinweis.
- Keine Schreibzugriffe: die Seite ist rein lesend.
- `TEST_FIRST_NAMES` (`lib/analytics.ts`) filtert bekannte Test-Submissions case-insensitiv aus allen Auswertungsteilen (KPIs, Verteilungen, Feld-Performance, Tabelle) heraus.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Überblick über die erfassten Einträge (Priority: P1)

Eine verantwortliche Person bei Nexplore öffnet `/auswertung` und sieht auf einen
Blick, wie viele Formulare ausgefüllt wurden, wie lange die Leute im Schnitt
brauchten und wie sich die Antworten verteilen.

**Why this priority**: Ohne Übersicht ist die gesammelte Datenmenge wertlos.

**Independent Test**: Seite aufrufen, nachdem mindestens ein Formular abgeschickt
wurde; KPIs und Verteilungen erscheinen und stimmen mit der Datenbank überein.

**Acceptance Scenarios**:

1. **Given** es liegen Submissions vor, **When** `/auswertung` geöffnet wird, **Then** erscheinen Gesamtzahl, Ø/Median Ausfülldauer und die Verteilungen (Rolle, Glacesorten, Warum-hier, OS, Browser, Gerät, Zeitzone).
2. **Given** eine Submission enthält Vorname "Philippe" und Firma "Nexplore", **When** die Tabelle der letzten Einträge angezeigt wird, **Then** stehen dort `Ph******` und `Ne*****`, nie die Klarwerte.
3. **Given** es liegen noch keine Submissions vor, **When** die Seite geöffnet wird, **Then** werden leere Zustände statt Fehler angezeigt.

### User Story 2 - Feld-Performance verstehen (Priority: P2)

Die verantwortliche Person will wissen, welche Felder die Nutzer aufhalten, um
das Formular zu verbessern.

**Why this priority**: UX-Optimierung ist der Hauptzweck der Feld-Telemetrie aus 001.

**Independent Test**: Nach einigen Durchläufen zeigt die Feld-Performance-Tabelle
Ø/Max Zeit bis Antwort und Ø Fokuszeit je Feld.

**Acceptance Scenarios**:

1. **Given** `FieldStat`-Daten liegen vor, **When** die Auswertung geöffnet wird, **Then** erscheint pro Feld Ø Zeit bis Antwort, Max, Ø Fokuszeit, Ø Änderungen und Anzahl Antworten, nach Ø Zeit absteigend sortiert.

### User Story 3 - Zugriff beschränken (Priority: P2)

Die Seite enthält (maskierte) Personendaten und technischen Kontext und darf
nicht für jeden im Internet offen sein.

**Why this priority**: Datenschutz; die Daten aus 001 enthalten IP-Adressen und Verhaltensprofile.

**Independent Test**: `ANALYTICS_PASSWORD` setzen, Seite ohne Credentials aufrufen
→ 401; mit korrekten Credentials → 200.

**Acceptance Scenarios**:

1. **Given** `ANALYTICS_PASSWORD` ist gesetzt, **When** `/auswertung` ohne gültigen `Authorization`-Header aufgerufen wird, **Then** antwortet der Server mit 401 und `WWW-Authenticate: Basic`.
2. **Given** `ANALYTICS_PASSWORD` ist nicht gesetzt, **When** die Seite geöffnet wird, **Then** ist sie erreichbar und zeigt einen sichtbaren Warnhinweis.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-A01**: Das System MUSS unter `/auswertung` eine serverseitig gerenderte, rein lesende Übersicht der Formulardaten bereitstellen.
- **FR-A02**: Vorname und Firma MÜSSEN maskiert dargestellt werden: die ersten zwei Zeichen im Klartext, jeder weitere Buchstabe als `*`. Werte mit ≤2 Zeichen bleiben unverändert.
- **FR-A03**: Die Seite MUSS KPIs zeigen: Gesamtzahl, Ø und Median Ausfülldauer, Newsletter-Quote, AGB-geöffnet-Quote inkl. Ø Lesezeit, Datenschutz-„Ja"-Quote, Ø Berufserfahrung.
- **FR-A04**: Die Seite MUSS Verteilungen zeigen: Einträge pro Tag, Rolle, Glacesorten (Mehrfachauswahl aufgesplittet), Warum-hier, Betriebssystem, Browser, Gerätetyp, Zeitzone, App-Anzahl, Passwortmanager.
- **FR-A05**: Die Seite MUSS eine Feld-Performance-Tabelle aus `FieldStat` zeigen (Ø/Max Zeit bis Antwort, Ø Fokuszeit, Ø Änderungen, n je Feld).
- **FR-A06**: Die Seite MUSS die jüngsten Einträge (max. 100) tabellarisch zeigen, inkl. maskiertem Vorname/Firma, Rolle, Glacesorten, Erfahrung, Ausfülldauer, Gerät/Browser, Newsletter, AGB-geöffnet inkl. Lesezeit, Pickup-Code und Bot-Kennzeichnung.
- **FR-A07**: Die Seite MUSS bei fehlenden Daten leere Zustände statt Fehler anzeigen und immer aktuelle Daten laden (kein Build-Time-Caching).
- **FR-A08**: Der Zugriff MUSS per HTTP-Basic-Auth geschützt werden, sobald `ANALYTICS_PASSWORD` gesetzt ist; Benutzername aus `ANALYTICS_USER` (Default `nexplore`). Ohne Passwort ist die Seite offen und MUSS einen Warnhinweis anzeigen.
- **FR-A09**: Die Seite DARF keine unmaskierten direkt identifizierenden Personendaten anzeigen, die über die ersten zwei Zeichen von Vorname/Firma hinausgehen; Telefonnummer und IP-Adresse werden NICHT dargestellt.
- **FR-A10**: Bekannte Test-/Entwicklungs-Submissions MÜSSEN aus allen Auswertungsteilen ausgeschlossen werden (`TEST_FIRST_NAMES`, case-insensitiver Vorname-Abgleich), damit KPIs und Verteilungen nur echte Formulardurchläufe widerspiegeln.

### Key Entities

Nur lesend aus 001: `Submission`, `FieldStat`, `FieldInteraction`.

## Success Criteria *(mandatory)*

- **SC-A01**: Nach einem abgeschickten Formular sind dessen Werte (maskiert) innerhalb eines Reloads in der Auswertung sichtbar.
- **SC-A02**: Kein Klarname und keine vollständige Firma erscheint irgendwo auf der Seite.
- **SC-A03**: Mit gesetztem `ANALYTICS_PASSWORD` ist die Seite ohne Credentials nicht abrufbar.

## Umsetzung (Ist-Stand)

- Seite: `app/auswertung/page.tsx` (Server Component, `dynamic = 'force-dynamic'`).
- Aggregation + Maskierung: `lib/analytics.ts` (`mask()`, `getAnalytics()`, `TEST_FIRST_NAMES`).
- Zugriffsschutz: `middleware.ts`, Matcher `/auswertung/:path*`.
- Konfiguration: `ANALYTICS_USER` / `ANALYTICS_PASSWORD` (via `.env.prod` → `docker-compose.prod.yml`).

## Änderungshistorie

| Datum | Änderung |
|---|---|
| 2026-09-03 | Erste Umsetzung: KPIs, Verteilungen, Feld-Performance-Tabelle, maskierte Einträge-Tabelle, Basic-Auth-Schutz. |
| 2026-09-04 | Test-Submissions (`TEST_FIRST_NAMES`) aus der Auswertung gefiltert (FR-A10); Dokument an das Format von 001 angeglichen. |
