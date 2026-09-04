# Feature Specification: Glace-Formular

**Feature Branch**: `001-glace-formular`

**Created**: 2026-08-30

**Last Updated**: 2026-09-04

**Status**: Umgesetzt

**Input**: User description: "Umsetzung des bereits definierten Glace-Formulars aus der Bauanleitung als feste digitale Lösung. Das Formular selbst ist fertig definiert und wird nicht vom Nutzer erstellt, sondern direkt als feste Programmierung gemäß Bauanleitung umgesetzt. Es soll für mobile Nutzung optimiert sein, eine einfache Datenbank hinter sich haben und intern leicht wartbar bleiben, ohne dass ein komplexer dynamischer Builder gebaut wird. Das UI soll sehr einfach zum Ausfüllen sein: möglichst nur Clicks, Buttons und Auswahlen – keine Texteingabe. Alle Interaktionen werden getracked: Feldaufruf, Zeit pro Feld (bis Weiterdrücken), Interaktionstyp, Zeitstempel."

Die ursprüngliche Bauanleitung war der Ausgangspunkt der Umsetzung. Feldliste, Optionen
und UX wurden seither mehrfach angepasst (siehe [Änderungshistorie](#änderungshistorie));
massgeblich ist der in diesem Dokument beschriebene aktuelle Stand, nicht mehr die
ursprüngliche Bauanleitung wörtlich.

## Clarifications

### Session 2026-08-30

- Q1: Sollen unvollständige Formulardaten lokal auf dem Gerät gespeichert werden, und können Nutzer einen unterbrochenen Durchlauf in einer neuen Session fortsetzen? → A: Serverseitige Entwurfsspeicherung.
- Q2: Welches Telemetrie-Eventmodell soll für den Formularablauf getrackt werden? → A: Pro-Feld-Events, Zeit-im-Feld sowie Button-/Auswahl-Interaktionen mit Session-Correlation-ID.
- Q3: Wie sollen unvollständige Sessions nach Inaktivität oder Rückkehr behandelt werden? → A: Auto-Save mit 10–15 Minuten Inaktivitäts-Timeout; Nutzer können fortsetzen oder neu starten; Abbruch wird als Telemetrie erfasst.
- Q4: Wie wird die Marketing-Einwilligung nach dem letzten Klick gehandhabt? → A: Double-Opt-In per Bestätigungsmail vorgesehen (siehe FR-015 – in der aktuellen Umsetzung noch nicht gebaut, dort als bekannte Lücke vermerkt).
- Q5: Wie sieht der Lösch-Workflow für personenbezogene Daten aus? → A: Kein Self-Service-Löschen in der ersten Version; Daten bleiben bis zur definierten Aufbewahrungsdauer, Entfernung nur durch manuelle Admin-Aktion.

## Formulardefinition (aktueller Stand)

Das Formular ist eine feste, direkt programmierte Formularliste (`lib/form-definition.ts`) –
keine nutzer-konfigurierbare Oberfläche. Die Schritte werden dynamisch aus dieser Liste
gebildet, sodass jeder Schritt auf einem Handy ohne Scrollen passt (`lib/form-steps.ts`,
siehe UX-006).

### Kopf

- Titel: "Deine Gratis-Glace"
- Untertitel: "Fast geschafft. Ein paar kurze Angaben, dann kannst du schöpfen."
- Header: Nexplore-Logo (`public/nexplore.svg` – Platzhalter-Wortmarke, durch offizielles Asset zu ersetzen)

### Felder (Formular-Reihenfolge)

| # | Feld-ID | Frage | Typ | Pflicht | Optionen | Zweck |
|---|---|---|---|---|---|---|
| 1 | `firstName` | Wer bist du? | Text | Ja | – | Personalisierung; zusammen mit Firma der Re-Identifikations-Schlüssel |
| 2 | `company` | Für welche Firma? | Text | Ja | – | Firma + Vorname = Klarname |
| 3 | `role` | Welche Rolle hast du? | Auswahl, 1 Spalte | Ja | Geschäftsführung/CEO · Mitglied der GL · Bereichs-/Abteilungsleitung · Projekt-/Programmleitung · Fachspezialist:in/Expert:in · Lehrperson/Dozent:in/Trainer:in · Lernende:r/Studierende:r · Andere Funktion | Entscheidungsbefugnis, Segmentierung |
| 4 | `yearsExperience` | Wie viele Jahre Erfahrung? | Slider 1–60 | Ja | – | Alters-Proxy ohne direkte Altersfrage |
| 5 | `postalCode` | Postleitzahl | Text, numerische Tastatur | Ja | – | Wohnregion-/Kaufkraft-Proxy |
| 6 | `favoriteFlavor` | Deine Lieblings-Glace? | Auswahl, Mehrfachauswahl | Ja | Spargelglace · Vegan · Rahmglace · Sorbet | Harmloser Frontend-Block, Themen-Trigger |
| 7 | `visitReason` | Warum bist du hier? | Auswahl | Ja | Networking · Digitale Transformation · KI · Horizonterweiterung | Interessens-Segment |
| – | `operatingSystem` | *(keine Frage)* | automatisch | – | wird aus Browser ermittelt (FR-018) | Tech-Segment ohne Nutzerfrage |
| 8 | `appCount` | Wie viele Apps auf deinem Handy nutzt du? | Auswahl | Ja | 1-5 · 6-10 · 11-20 · 20+ | Digitale Intensität |
| 9 | `passwordManager` | Nutzt du einen Passwortmanager? | Auswahl | Ja | Ja · Nein · Ich weiss nicht | Sicherheitsreife-Proxy |
| 10 | `privacyReading` | Datenschutzerklärung gelesen? | Auswahl | Ja | Ja · Nein (beide erlauben den Abschluss) | Selbstauskunft AGB-Verhalten |
| 11 | `phoneNumber` | Handynummer | Text, Tel-Tastatur | Nein (optional) | z. B. „+41 79 …“ | Optionaler Personendaten-Ask |
| 12 | `newsletter` | Newsletter abonnieren | Checkbox, **vorausgewählt** | – | – | Opt-out statt Opt-in |
| 13 | `termsAccepted` | Ich akzeptiere die [Glace-Nutzungsbedingungen](#) | Checkbox | Ja | Link öffnet Overlay mit humoristischem Inhalt | Pflichtbestätigung, Öffnungsrate messbar |

Pflichtfelder sind im Label mit „*" markiert; „Weiter"/„Absenden" bleibt deaktiviert, bis
alle Pflichtfelder des aktuellen Schritts ausgefüllt sind (UX-006).

### Abschluss-Screen

Nach erfolgreichem Absenden statt Auto-Reset: "Merci viumau", Nexplore-Logo, ein zufällig
generierter Abhol-Code (`GLACE-XXXX-XXXX`, gespeichert als `pickupCode`) als QR-Code plus
Klartext, und ein Link zu `https://www.nexplore.ch`.

### Gegenüber der ursprünglichen Bauanleitung entfernt oder ersetzt

- „BONUS – Glace-Name" (Vorname-Buchstabe + Haustiername + Aufwachs-Strasse, `iceName`):
  Frage entfernt (Sicherheitsfragen-Kombination war die Pointe der Bauanleitung, wurde aber
  nicht produktiv gestellt). DB-Spalte bleibt `String?` für Altdaten.
- „iPhone oder Android?": nicht mehr gefragt, wird automatisch aus dem Browser erkannt.
- „Wie bist du hergekommen?" (Mobilität): nicht umgesetzt.
- Ursprüngliche Rollen-, Erfahrungs- und Sortenoptionen der Bauanleitung: durch die Liste
  oben ersetzt (mehrfach im Projektverlauf angepasst).
- Reserve-Fragen der Bauanleitung (Zahlungsmittel, Becher/Cornet, Kaffee/Tee): nie umgesetzt.

### Nicht abgefragte Themen (bewusst)

Die Bauanleitung untersagt keine direkte Frage nach Alter, Gesundheit, Religion, Politik
oder Herkunft, definiert sie aber als abgeleitete, nicht erhobene Informationen. Das
Formular fragt bewusst nicht nach: Foto-Upload, direktem Alter, Gesundheit, Religion,
Politik, Herkunft.

### Regeln zur Umsetzung

- Das Formular wird als feste, direkt gecodete Produktfunktion umgesetzt.
- Nur das zuständige Team darf fachliche oder technische Anpassungen an der Formularstruktur vornehmen.
- Das System bietet keine Endnutzer-Funktion zum Erstellen von Formularen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Glace-Formular fest programmieren (Priority: P1)

Das System implementiert das Glace-Formular als feste, direkt programmierte Lösung. Der
Nutzer kann das Formular nicht selbst definieren oder anlegen; die fachliche Struktur ist
im Produkt vorgegeben und fest hinterlegt.

**Why this priority**: Das Formular bildet den Kern der Anwendung.

**Independent Test**: Ein Nutzer kann das Formular öffnen und prüfen, ob alle Felder und
Pflichtbereiche in der richtigen Reihenfolge und Logik dargestellt werden.

**Acceptance Scenarios**:

1. **Given** die Formulardefinition liegt vor, **When** die Anwendung geöffnet wird, **Then** erscheint das Formular in derselben Struktur, Reihenfolge und Logik wie oben definiert.
2. **Given** das Formular mehrere Schritte umfasst, **When** der Nutzer die Oberfläche prüft, **Then** sind die Felder fachlich logisch gruppiert und nachvollziehbar aufgebaut.
3. **Given** die Formularimplementierung im System hinterlegt ist, **When** das Formular geöffnet wird, **Then** bleibt die Definition stabil und wird ohne Nutzer-konfigurierbare Erstellung verwendet.

---

### User Story 2 - Formular auf Handy nutzbar machen (Priority: P1)

Ein Nutzer muss das Formular auf einem Handy schnell und ohne Verwirrung ausfüllen können.

**Why this priority**: Das Formular wird im realen Einsatz mobil verwendet.

**Independent Test**: Ein Nutzer kann das Formular am Handy vollständig ausfüllen, ohne
dass Felder unklar, zu klein oder aufwendig zu bedienen sind, und ohne dass ein Schritt
gescrollt werden muss.

**Acceptance Scenarios**:

1. **Given** das Formular auf einem mobilen Gerät geöffnet wird, **When** der Nutzer mit den Feldern interagiert, **Then** sind die Eingabefelder ausreichend gross und touchfreundlich.
2. **Given** ein Schritt mehrere Felder enthält, **When** der Nutzer ihn öffnet, **Then** passt der Schritt ohne Scrollen auf den Bildschirm (dynamische Schrittaufteilung, UX-006a).
3. **Given** ein Nutzer ein Feld ausfüllt, **When** er weiter navigiert, **Then** bleibt der fachliche Ablauf konsistent und nachvollziehbar.

---

### User Story 3 - Daten erfassen und speichern (Priority: P1)

Ein Nutzer muss die im Formular eingegebenen Werte erfassen und in einer Datenbank
hinterlegen können.

**Why this priority**: Das Formular ist nur wertvoll, wenn die Daten tatsächlich erfasst
und dauerhaft gespeichert werden.

**Independent Test**: Ein Nutzer kann ein Formular ausfüllen und abschicken; anschliessend
sind die Daten in der Datenbank hinterlegt und können erneut abgerufen werden.

**Acceptance Scenarios**:

1. **Given** das Formular vollständig ausgefüllt wurde, **When** der Nutzer absendet, **Then** werden die Daten in der Datenbank persistiert.
2. **Given** eine gespeicherte Submission vorliegt, **When** sie erneut abgerufen wird, **Then** erscheinen die Werte korrekt.
3. **Given** ein Pflichtfeld ist leer, **When** der Nutzer weiter/absenden will, **Then** bleibt der Button deaktiviert (UX-006).

---

### User Story 4 - Wartbare, feste Formularlogik (Priority: P2)

Das Entwicklungsteam pflegt das Glace-Formular klar und wartbar. Änderungen erfolgen
technisch sauber im Code, nicht über ein Builder-Tool für Endnutzer.

**Why this priority**: Das Setup soll bewusst einfach bleiben.

**Independent Test**: Eine verantwortliche Person kann eine kleine Änderung am Formular
(z. B. eine neue Option) sauber vornehmen, ohne eine generische Builder-Architektur
aufzubauen.

**Acceptance Scenarios**:

1. **Given** eine kleine Anpassung am Formular nötig ist, **When** das Entwicklungsteam `lib/form-definition.ts` ändert, **Then** erscheint die Änderung im Formular und wird in der Datenerfassung berücksichtigt, ohne weitere Codeänderungen an der Schrittlogik.
2. **Given** ein neues Feld wird ergänzt, **When** das Formular neu geladen wird, **Then** ordnet `lib/form-steps.ts` es automatisch scrollfrei in die Schritte ein.

---

### Edge Cases

- Wie reagiert das System auf unvollständige oder fehlerhafte Formulareinträge? → Schritt-Gate (UX-006) verhindert das Weiterkommen serverseitig zusätzlich validiert (`lib/validation.ts`).
- Wie verhalten sich unvollständige Durchläufe, wenn ein Nutzer zurückkehrt oder abbricht?
- Wie wird ein abgebrochener oder verlassener Durchlauf in der Telemetrie erfasst?
- Was passiert, wenn Telemetrie-Daten fehlerhaft oder unvollständig sind? → Darf das Speichern der Antworten nie verhindern (siehe TRK-Anforderungen, "best effort").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Das System MUSS das Glace-Formular als feste, digitale Formularstruktur gemäss obiger Feldliste abbilden.
- **FR-002**: Die Reihenfolge und fachliche Logik des Formulars MÜSSEN dieser Feldliste entsprechen.
- **FR-003**: Das Formular MUSS für den Einsatz auf Handys optimiert und touchfreundlich bedienbar sein.
- **FR-004**: Das System MUSS eingegebene Daten in einer Datenbank speichern und persistent hinterlegen.
- **FR-005**: Die gespeicherten Werte MÜSSEN für spätere Nutzung, Auswertung oder Wiedereinlesung verfügbar sein.
- **FR-006**: Das Formular MUSS bei unvollständigen oder fehlerhaften Eingaben mit verständlichen Meldungen reagieren.
- **FR-007**: Das Formular MUSS als feste, direkt programmierte Anwendung umgesetzt werden und darf nicht durch den regulären Nutzer konfiguriert oder selbst erstellt werden.
- **FR-008**: Das Setup MUSS bewusst einfach gehalten sein und keine komplexe generische Builder-Architektur erfordern.
- **FR-009**: Die Lösung MUSS sich auf die fachliche Formulardefinition fokussieren und keine unnötige technische Komplexität aufbauen.
- **FR-010**: Das System MUSS die Datenerfassung robust genug machen, dass sie im praktischen Einsatz zuverlässig funktioniert.
- **FR-011**: Das System MUSS unvollständige Formularangaben automatisch als Entwurf speichern, damit ein unterbrochener Durchlauf in einer späteren Session fortgesetzt oder neu gestartet werden kann. Der Inaktivitäts-Timeout MUSS zwischen 10 und 15 Minuten liegen. Das Schritt-Gate aus UX-006 (kein "Weiter" bei unvollständigem Schritt) bleibt davon unberührt.
- **FR-012**: Das System MUSS zurückkehrende Besucher in die Lage versetzen, einen bestehenden Entwurf wieder aufzunehmen oder neu zu starten, ohne bisher eingegebene Daten zu verlieren. Nach erfolgreichem Absenden (Abschluss-Screen, UX-007) gilt der Durchlauf als beendet; ein neuer Durchlauf beginnt über einen Reload.
- **FR-013**: Das System MUSS den Abbruch oder das Verlassen einer Session als Telemetrie-Event erfassen, damit Abbruchrate und Wiederaufnahmepfad messbar sind.
- **FR-014**: Kleine Änderungen am Formular MÜSSEN nur durch das zuständige Entwicklungsteam erfolgen, nicht durch Endnutzer.
- **FR-015**: Die Newsletter-Zustimmung wird direkt aus dem Checkbox-Zustand beim Absenden übernommen (Checkbox ist standardmässig **vorausgewählt**, Opt-out statt Opt-in). **Bekannte Lücke:** ein Double-Opt-In (Bestätigungsmail) ist NICHT implementiert – vor einem Marketing-Versand ist zu prüfen, ob eine nachträgliche Bestätigung ergänzt werden muss.
- **FR-016**: In der ersten Version gibt es keinen Selbstbedienungs-Delete-Flow; personenbezogene Daten bleiben bis zum Ablauf der definierten Aufbewahrungsdauer gespeichert und werden nur durch manuelle Admin-Aktion bereinigt.
- **FR-017**: Die Anwendung MUSS unter Nexplore-Branding auftreten: Nexplore-Logo im Formular-Header und im Abschluss-Screen, Nexplore im Seitentitel. Das ausgelieferte Logo (`public/nexplore.svg`) ist eine Platzhalter-Wortmarke und durch das offizielle Asset zu ersetzen.
- **FR-018**: Das Betriebssystem DARF nicht als Formularfrage erscheinen; es MUSS clientseitig aus dem Browser ermittelt (User-Agent / `navigator.userAgentData`) und mit dem Datensatz gespeichert werden. Ist keine Erkennung möglich, wird "Unbekannt" gespeichert.
- **FR-019**: Die Berufserfahrung MUSS über einen Slider von 1 bis 60 (Jahre) erfasst werden.
- **FR-020**: Nutzertexte MÜSSEN Schweizer Schreibweise verwenden (kein "ß").

### UI/UX Requirements – Interaction Pattern

- **UX-001**: Das Formular SOLL so einfach wie möglich zum Ausfüllen sein; Texteingaben MÜSSEN minimiert werden.
- **UX-002**: Alle Felder, die es zulassen, SOLLEN durch Buttons, Auswahlen oder einfache Klick-Interaktionen bedienbar sein, statt Free-Text-Input zu fordern.
- **UX-003**: Wo Text notwendig ist (z. B. Vorname, Postleitzahl), SOLLEN Eingabemasken mit kleinem Zeichenumfang, Platzhaltern und passendem `autocomplete`/`inputmode` eingesetzt werden.
- **UX-004**: Die Bedienelemente MÜSSEN gut erreichbar und sichtbar sein; Buttons SOLLEN mindestens 48px hoch sein.
- **UX-005**: Das Formular SOLL auf Smartphones schnell, ohne Ruckeln und mit minimaler kognitiver Last bedienbar sein.
- **UX-006**: Pflichtfelder MÜSSEN im Label mit "*" gekennzeichnet sein. Der "Weiter"-Button (bzw. "Absenden" im letzten Schritt) MUSS deaktiviert bleiben, bis alle Pflichtfelder des aktuellen Schritts ausgefüllt sind. Jede getroffene Auswahl gilt als ausgefüllt – auch "Nein" bei `privacyReading`.
- **UX-006a**: Die Schritte MÜSSEN dynamisch aus der Feldliste gebildet werden (`lib/form-steps.ts`), sodass jeder Schritt auf einem typischen Handy-Bildschirm ohne Scrollen passt. Text-/Slider-Felder werden gebündelt, optionsreiche Felder erhalten ggf. einen eigenen Schritt, Checkboxen kommen zusammen. Optionslisten werden je nach Labellänge/Anzahl ein- oder zweispaltig dargestellt.
- **UX-007**: Nach erfolgreichem Absenden MUSS ein Abschluss-Screen erscheinen: "Merci viumau", Nexplore-Logo, Abhol-Code als QR-Code plus Klartext, und ein Link/Button zu `https://www.nexplore.ch`. Das Formular DARF nicht automatisch zurückgesetzt oder neu gestartet werden.
- **UX-008**: Enter in einem Textfeld MUSS den aktuellen Schritt bestätigen (= "Weiter", bzw. "Absenden" im letzten Schritt), sofern der Schritt vollständig ist.

### Tracking & Telemetry Requirements

- **TRK-001**: Das System MUSS jede relevante Benutzerinteraktion als explizites Event tracken, inklusive Feldansicht, Feldfokus, Auswahl, Button-Klick, Formular-Weitergang und Formular-Abschluss. Für jeden Event MÜSSEN Feld-ID, Feldbezeichnung, Feldtyp, Interaktionstyp, Zeitstempel und Session-/Correlation-ID erfasst werden.
- **TRK-002**: Für jedes Feld MUSS die Zeit im Feld gemessen werden: von der Sichtbarkeit bis zur Antwort (`timeToAnswerMs`) sowie die kumulierte Fokus-/Tippdauer (`focusMs`).
- **TRK-003**: Das System MUSS alle Tracking-Daten mit einer eindeutigen Session- bzw. Correlation-ID korrelieren, um den vollständigen Formulardurchlauf eines Nutzers nachzuverfolgen.
- **TRK-004**: Tracking-Daten MÜSSEN strukturiert sein (Event-ID, Session-/Correlation-ID, Feld-ID/-Label/-Typ, Event-Typ, Zeitstempel, Dauer, Wert). Die Daten MÜSSEN keine direkt identifizierenden Personendaten über Vorname + Firma hinaus enthalten.
- **TRK-005**: Telemetrie-Daten MÜSSEN persistent in der Datenbank gespeichert werden (`FieldInteraction`, `FieldStat`, `Session`).
- **TRK-006**: Telemetrie MUSS "best effort" sein: fehlerhafte oder fehlende Tracking-Daten DÜRFEN das Speichern der Formularantworten nie verhindern.
- **TRK-007**: Das System SOLL aggregierte Statistiken bereitstellen: durchschnittliche Feldausfüllzeiten, Fokuszeiten, Änderungshäufigkeit und Antwortzahl pro Feld (siehe [002-auswertung](../002-auswertung/spec.md)).

Zusätzlich erfasst das System pro Submission technischen Besucher-Kontext (IP-Adresse roh,
User-Agent, geparster Browser/OS/Gerätetyp, Bildschirm-/Viewport-Grösse, Sprache(n),
Zeitzone, Referrer, Verbindungstyp u. a.) – **ohne Anonymisierung und ohne Consent-Gate**;
Offenlegung/Aufbewahrung liegt in der Verantwortung von Nexplore (siehe FR-016).

### Key Entities *(include if feature involves data)*

- **Submission**: Ein abgeschlossenes Formular-Ausfüllszenario – Antworten, Besucher-Kontext (IP, Gerät, Sprache, Zeitzone …), Abhol-Code, Nutzungsbedingungen-Interaktion und Verhaltens-Aggregate.
- **FieldInteraction**: Roher Event-Stream (view/focus/blur/change/select/next/submit) je Feld und Submission, mit Sequenz und Zeitstempel.
- **FieldStat**: Aggregat pro (Submission, Feld) – Zeit bis Antwort, Fokuszeit, Änderungs-/Fokus-Anzahl, Endwert.
- **Session**: Eine logische Einheit eines Formular-Durchlaufs mit eindeutiger Session-ID und Kontext.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Das Glace-Formular wird gemäss der obigen Feldliste als digitale Oberfläche umgesetzt.
- **SC-002**: Das Formular kann auf mobilen Geräten zuverlässig und ohne Bedienungsprobleme genutzt werden, jeder Schritt ohne Scrollen.
- **SC-003**: Alle eingegebenen Daten werden in der Datenbank korrekt gespeichert und bleiben für spätere Nutzung verfügbar.
- **SC-004**: Das Glace-Formular bleibt eine feste, im Code implementierte Lösung, änderbar nur durch das zuständige Team.
- **SC-005**: Das System bleibt im Aufbau bewusst einfach und auf die fachlich korrekte Datenerfassung fokussiert.
- **SC-006**: Das Formular kommt mit minimalen Texteingaben aus (Vorname, Firma, Postleitzahl, optional Handynummer).
- **SC-007**: Jede Benutzerinteraktion wird getrackt: Feldaufruf, Dauer pro Feld, Interaktionstyp und Zeitstempel sind im Telemetrie-System vorhanden.
- **SC-008**: Für jedes Formularfeld ist die durchschnittliche Ausfüllzeit messbar und abrufbar (siehe 002-auswertung).
- **SC-009**: Tracking-Daten sind strukturiert und mit der Submission korreliert, sodass der komplette Formulardurchlauf nachverfolgbar ist.
- **SC-010**: Das System stellt aggregierte Statistiken bereit (siehe 002-auswertung).

## Assumptions

- Die ursprüngliche Bauanleitung war der fachliche Ausgangspunkt; massgeblich ist der
  aktuelle, dokumentierte Stand (siehe Formulardefinition oben).
- Der reguläre Nutzer kann das Formular nicht selbst erstellen oder konfigurieren; dies
  liegt in der Verantwortung des Produkt-/Entwicklungsteams.
- Die Lösung soll einfach, robust und mobil nutzbar sein, ohne generischen Formbuilder.
- Unvollständige Formulare werden serverseitig als Entwürfe gespeichert (FR-011); diese
  Draft-Persistenz ist als Anforderung dokumentiert, ihr Implementierungsstand ist bei
  Bedarf gegen den Code zu verifizieren.
- Telemetrie-Daten enthalten keine direkt identifizierenden Daten über Vorname + Firma
  hinaus im Sinne von TRK-004; der zusätzlich erfasste technische Kontext (IP, Gerät,
  Verhalten) ist davon bewusst ausgenommen (siehe Telemetrie-Absatz oben) und unterliegt
  eigenen Datenschutz-Pflichten.
- Newsletter-Consent wird aus dem (vorausgewählten) Checkbox-Zustand übernommen; ein
  Double-Opt-In ist **nicht** implementiert (bekannte Lücke, FR-015).
- Für die erste Version gibt es keinen Selbstbedienungs-Delete-Flow; Daten werden gemäss
  der definierten Aufbewahrungsdauer aufbewahrt und nur manuell durch Admins bereinigt.

## Änderungshistorie

| Datum | Änderung |
|---|---|
| 2026-08-30 | Clarifications: Draft-Speicherung, Telemetrie-Modell, Inaktivitäts-Timeout, Double-Opt-In-Absicht, Delete-Flow. |
| 2026-09-02 | Titel "Deine Gratis-Glace", Pflichtfeld-Markierung + Schritt-Gate, Abschluss-Screen statt Auto-Reset, Nexplore-Branding. |
| 2026-09-02 | Feldüberarbeitung: Erfahrungs-Slider (1–60), CH-Schreibweise (kein "ß"), neue `visitReason`-Optionen, `operatingSystem` automatisch erkannt, Label-Änderungen bei `appCount`/`passwordManager`, `iceName` entfernt, `privacyReading` blockiert den Abschluss nicht mehr. |
| 2026-09-02 | Besucher-Telemetrie implementiert: IP, User-Agent, Geräte-/Netzkontext, `FieldStat`/`FieldInteraction`, echte Session-/Correlation-IDs. |
| 2026-09-02 | Abhol-QR-Code (`pickupCode`), `favoriteFlavor` mit Mehrfachauswahl, Newsletter vorausgewählt, Nutzungsbedingungen-Overlay inkl. Tracking (`termsOpened`/`termsViewMs`). |
| 2026-09-03 | Neue `role`-Optionen, dynamische scrollfreie Schrittaufteilung (`lib/form-steps.ts`), Handynummer optional, Enter-Submit + Mobile-Autofill/Autocomplete. |
| 2026-09-03 | Auswertung als eigene Spezifikation ausgelagert: [002-auswertung](../002-auswertung/spec.md). |
| 2026-09-04 | Dokument aufgeräumt: Formulardefinition auf aktuellen Code-Stand gebracht (vorher noch die ursprüngliche, längst überholte Bauanleitung), alle Session-Einträge konsolidiert, FR-015 an tatsächliches Verhalten angepasst (Double-Opt-In als bekannte Lücke markiert statt als erfüllt behauptet). |
