# Implementation Plan: Glace-Formular nach Bauanleitung

**Branch**: `001-glace-formular` | **Date**: 2026-08-30 | **Spec**: [spec.md](spec.md)

## Summary

Die Lösung ist eine feste, mobile Web-App zur Abbildung des Glace-Formulars aus der Bauanleitung. Es gibt keinen nutzer-konfigurierbaren Builder. Das Formular wird als feste, technisch umgesetzte Produktfunktion programmiert und die eingetragenen Daten werden in einer Datenbank gespeichert.

Die Architektur ist bewusst klein und robust gehalten: eine einzelnes Frontend für mobile Nutzung, eine einfache Server- oder API-Schicht für Validierung und Speicherung sowie eine relationale Datenbank als zentrale Datenspeicherung.

## Technical Context

**Language/Version**: TypeScript, React 18+, Node.js 20 LTS

**Primary Dependencies**:
- Next.js 14 / App Router
- React
- Tailwind CSS
- Prisma ORM
- PostgreSQL (Produktiv) / SQLite (lokal, einfach)
- Zod für Validation

**Storage**:
- PostgreSQL für die produktive Nutzung
- SQLite als lokale, günstige Entwicklungs- und Test-Variante

**Testing**:
- Vitest
- React Testing Library
- Playwright für mobile UI-Checks

**Target Platform**:
- Mobile-first Web-App, optimiert für Smartphone-Nutzung
- Laufbar im Browser auf Handy und Desktop

**Project Type**:
- Web application

**Performance Goals**:
- Formular lädt schnell
- Touch-optimierte Bedienung
- Speicherung mit minimaler Latenz

**Constraints**:
- kein komplexer dynamischer Formbuilder
- feste Frage-Reihenfolge gemäß Bauanleitung
- Formulareingaben müssen persistiert werden
- einfache Wartbarkeit und geringe technische Komplexität

**Scale/Scope**:
- ein konkretes Formular mit fixer Struktur
- mehrere hundert bis tausend Datensätze im praktischen Einsatz
- keine generische Form-Engine erforderlich

## Architecture Decision

### 1. Frontend
- mobile-first React-UI
- feste, hart codierte Formularstruktur
- keine dynamische Felddefinition aus Nutzereingaben
- klare Sicht, schnelle Bedienung, geringe Scroll-Reibung

### 2. Backend/API
- einfache API oder Server Actions für:
  - Formularabruf
  - Validierung
  - Speichern eines Datensatzes
  - optionales Laden bestehender Einträge
- keine generische Konfigurations-Engine

### 3. Datenmodell
- Tabelle `responses` oder `glace_submissions`
- Felder für:
  - id
  - submitted_at
  - field_1_vorname
  - field_2_firma
  - field_3_rolle
  - field_4_berufsjahre
  - field_5_plz
  - field_6_glace_sorte
  - field_8_anreise
  - field_9_betriebssystem
  - field_10_app_anzahl
  - field_11_passwortmanager
  - field_12_datenschutzerklaerungen
  - field_13_handynummer
  - field_14_glace_name
  - newsletter
  - accepted_terms
  - optional metadata

### 4. Validierung
- Pflichtfelder nach Bauanleitung validieren
- String-/Optionen-Checks mit Zod
- klare Fehlermeldungen für mobile Nutzung

### 5. Deployment
- Entwicklung: local / Docker / Next.js dev server
- Produktion: Vercel oder eigener Container-Server
- Datenbank: PostgreSQL in produktiver Umgebung

## Project Structure

```text
app/
├── page.tsx
├── layout.tsx
├── globals.css
├── api/
│   └── submissions/
│       └── route.ts
├── form/
│   └── page.tsx
components/
├── GlaceForm.tsx
├── FormSection.tsx
├── FieldInput.tsx
├── ProgressBar.tsx
├── ErrorBanner.tsx
lib/
├── validation.ts
├── formSchema.ts
├── db.ts
prisma/
├── schema.prisma
└── seed.ts
types/
└── form.ts

```

## Structure Decision

Die Lösung wird als einfaches, mobiles Web-Produkt umgesetzt: ein zentrales Frontend mit fester Formularstruktur, eine kleine API-Schicht und eine einzelne Datenbanktabelle für die Speicherung. Es gibt keine generische CMS- oder Builder-Architektur.

## Constitution Check

- Scope is focused and not over-engineered: pass
- User-configurable form builder removed: pass
- Mobile-first implementation preserved: pass
- Database-backed storage included: pass
- Simple maintenance model: pass

## Complexity Tracking

Keine zusätzlichen Abweichungen erforderlich. Die Architekturebene bleibt bewusst einfach, um die feste Bauanleitungs-Umsetzung sauber und wartbar zu halten.
