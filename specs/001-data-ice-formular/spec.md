# Feature Specification: Glace-Formular nach Bauanleitung

**Feature Branch**: `001-glace-formular`

**Created**: 2026-08-30

**Status**: Draft

## Clarifications

### Session 2026-08-30
- Q: How should incomplete sessions be handled after inactivity or return visits? → A: Unvollständige Antworten werden automatisch als Entwurf gespeichert; Inaktivitäts-Timeout 10–15 Minuten; zurückkehrende Besucher können den Verlauf fortsetzen oder neu starten; Verlassens-/Abbruch-Sessions werden als Telemetrie-Event erfasst.

**Input**: User description: "Umsetzung des bereits definierten Glace-Formulars aus der Bauanleitung als feste digitale Lösung. Das Formular selbst ist fertig definiert und wird nicht vom Nutzer erstellt, sondern direkt als feste Programmierung gemäß Bauanleitung umgesetzt. Es soll für mobile Nutzung optimiert sein, eine einfache Datenbank hinter sich haben und intern leicht wartbar bleiben, ohne dass ein komplexer dynamischer Builder gebaut wird. Das UI soll sehr einfach zum Ausfüllen sein: möglichst nur Clicks, Buttons und Auswahlen – keine Texteingabe. Alle Interaktionen werden getracked: Feldaufruf, Zeit pro Feld (bis Weiterdrücken), Interaktionstyp, Zeitstempel."

## Formulardefinition gemäß Bauanleitung (Source of Truth)

Die in dieser Spezifikation definierte Formulardefinition ist die verbindliche Grundlage der Umsetzung. Die Feldstruktur, Reihenfolge, Pflichtangaben und fachlichen Aussagen werden direkt aus der Bauanleitung übernommen und nicht als nutzer-konfigurierbare Oberfläche modelliert.

Die Anwendung implementiert das Glace-Formular als feste, technisch umgesetzte Formularliste. Die nachstehende Feldliste entspricht dem Text der Bauanleitung und bildet die fachliche Grundlage für die Produktumsetzung.

### Titel und Untertitel des Formulars
- Titel: "🍦 Dein Gratis-Glace – nur noch 20 Sekunden!"
- Untertitel: "Fast geschafft. Ein paar kurze Angaben, dann kannst du schöpfen."

### Abschnitt 1: "Damit wir wissen, wer da ist"
1. Wie heisst du? (Vorname)
   - Typ: Text, kurz
   - Pflicht: Ja
   - Platzhalter: "z. B. Sabine"
   - Zweck: Personalisierung und erster Datenpunkt; zusammen mit Feld 2 bildet es den Re-Identifikations-Schlüssel.

2. Wo arbeitest du? (Firma / Organisation)
   - Typ: Dropdown
   - Pflicht: Ja
   - Optionen: Teilnehmende Firmen + Schulen alphabetisch, zuletzt "andere"
   - Zweck: Vorname + Firma = Klarname; daraus entsteht ein echter Personendatensatz.

### Abschnitt 2: "Ein paar Fragen zum Spass"
3. Und was machst du dort?
   - Typ: Auswahl
   - Pflicht: Ja
   - Optionen:
     - Lernende:r / Studierende:r
     - Fachkraft
     - Team- oder Projektleitung
     - Kader / GL
     - selbständig
   - Zweck: Kaufkraft und Entscheidungsbefugnis; maßgeblich für B2B-Lead-Wert.

4. Seit wann bist du im Berufsleben?
   - Typ: Auswahl
   - Pflicht: Ja
   - Optionen:
     - unter 5 Jahren
     - 5–15
     - 15–25
     - über 25 Jahre
   - Zweck: Alter auf ±5 Jahre ohne direkte Altersfrage; stärkster Einzel-Effekt im Formular.

5. Deine Postleitzahl – nur die ersten zwei Ziffern reichen! (Machen wir nächstes Jahr einen Stand in deiner Region?)
   - Typ: Text, 2 Zeichen
   - Pflicht: Ja
   - Platzhalter: "z. B. 36"
   - Zweck: Wohnregion und Kaufkraft-Proxy.

6. Deine Lieblings-Glacesorte?
   - Typ: Auswahl
   - Pflicht: Ja
   - Optionen:
     - Vanille
     - Schoggi
     - Erdbeer
     - Stracciatella
     - Pistache
     - veganes Sorbet
   - Zweck: Harmloser Frontend-Block, zugleich Inferenz-Beweis und Themen-Trigger.

8. Wie bist du heute hergekommen?
   - Typ: Auswahl
   - Pflicht: Ja
   - Optionen:
     - Auto
     - ÖV
     - Velo
     - zu Fuss
   - Zweck: Mobilität, Umwelt- und Lifestyle-Proxy, grobe Distanz zum Wohnort.

9. iPhone oder Android?
   - Typ: Auswahl
   - Pflicht: Ja
   - Optionen:
     - iPhone
     - Android
   - Zweck: Tech-Segment, Alters- und Kaufkraft-Proxy.

10. Wie viele Apps hast du etwa auf dem Handy?
   - Typ: Auswahl
   - Pflicht: Ja
   - Optionen:
     - unter 20
     - 20–50
     - über 50
   - Zweck: Digitale Intensität; Proxy für technische Alltagssituation.

11. Cyber-Symposium halt 😉 – nutzt du einen Passwortmanager?
   - Typ: Auswahl
   - Pflicht: Ja
   - Optionen:
     - ja
     - nein
     - was ist das?
   - Zweck: Sicherheitsreife; zusammen mit Feld 14 ein Angriffsprofil.

12. Liest du eigentlich Datenschutzerklärungen?
   - Typ: Auswahl
   - Pflicht: Ja
   - Optionen:
     - Immer
     - Manchmal
     - Nie
     - Was ist das?
   - Zweck: Meta-Frage; Selbstauskunft über AGB-Verhalten.

### Abschnitt 3: "Fast geschafft!"
13. Damit wir dich rufen, wenn dein Glace bereit ist: deine Handynummer 📱
   - Typ: Text
   - Pflicht: Nein (optional)
   - Platzhalter: "z. B. 079 …"
   - Zweck: optionaler Personendaten-Ask; genau deshalb starkes Signal.

14. BONUS – dein Glace-Name! Erster Buchstabe deines Vornamens + Name deines ersten Haustiers + Strasse, in der du aufgewachsen bist
   - Typ: Text
   - Pflicht: Nein (optional)
   - Platzhalter: "z. B. S-Minou-Bergstrasse"
   - Zweck: Cyber-Pointe; drei der häufigsten Passwort-Sicherheitsfragen in einem einzigen Feld.

### Abschluss-Checkboxen
15. Newsletter
   - Typ: Checkbox
   - Standardwert: Vorausgewählt
   - Wortlaut: "Ja, Nexplore darf mich zu künftigen Anlässen einladen."
   - Zweck: Opt-out statt Opt-in; als Dark Pattern im Referat bewusst eingebaut.

16. Nutzungsbedingungen
   - Typ: Checkbox
   - Pflicht: Ja
   - Wortlaut: "Ich habe die 14-seitigen Glace-Nutzungsbedingungen gelesen und akzeptiert."
   - Zweck: Pflichtbestätigung mit eigenem Link; Öffnungsrate messen.

### Nicht abgefragte Themen (explizit bewusst ausgelassen)
Die Bauanleitung untersagt keine direkte Frage nach Alter, Gesundheit, Religion, Politik oder Herkunft, sondern definiert sie als abgeleitete Informationen, nicht als erhobene Daten. Das Formular fragt bewusst nicht nach:
- Foto-Upload
- direktem Alter
- Gesundheit
- Religion
- Politik
- Herkunft

### Reserveliste – nur falls Zeit und Geduld reichen
- Freitext: "Warum verdienst du heute ein Glace? (ein Satz)"
- "Wenn's was gekostet hätte: Twint, bar oder Karte?"
- "Becher oder Cornet?"
- "Kaffee oder Tee?"

Diese Felder sind zwar im Dokument als mögliche Zusatzfragen bezeichnet, aber nicht Teil der Kern-Formulardefinition und werden nur optional für eine Erweiterung berücksichtigt.

### Regeln zur Umsetzung
- Das Formular wird als feste, direkt gecodete Produktfunktion umgesetzt.
- Die Reihenfolge der Abschnitte und Felder entspricht der Bauanleitung.
- Nur das zuständige Team darf fachliche oder technische Anpassungen an der Formularstruktur vornehmen.
- Das System darf keine Endnutzer-Funktion zum Erstellen von Formularen anbieten.
- Die Frage 7 aus der Bauanleitung ist bewusst nicht Bestandteil der Produktumsetzung und gilt als gestrichen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Glace-Formular fest programmieren (Priority: P1)

Das System muss das Glace-Formular als feste, direkt programmierte Lösung gemäß der Bauanleitung implementieren. Der Nutzer kann das Formular nicht selbst definieren oder anlegen; die fachliche Struktur ist im Produkt vorgegeben und fest hinterlegt.

**Why this priority**: Die Bauanleitung definiert das Produkt. Das Formular wird als feste digitale Umsetzung implementiert und bildet den Kern der Anwendung.

**Independent Test**: Ein Nutzer kann das Formular öffnen und prüfen, ob alle vorgesehenen Abschnitte, Felder und Pflichtbereiche in der richtigen Reihenfolge und Logik dargestellt werden.

**Acceptance Scenarios**:

1. **Given** die Bauanleitung für das Glace-Formular vorliegt, **When** die Anwendung umgesetzt wird, **Then** erscheint das Formular in derselben Struktur, Reihenfolge und Logik wie in der Anleitung definiert.
2. **Given** das Formular mehrere Bereiche umfasst, **When** der Nutzer die Oberfläche prüft, **Then** sind die Inhalte fachlich logisch gruppiert und nachvollziehbar aufgebaut.
3. **Given** die Formularimplementierung im System hinterlegt ist, **When** das Formular geöffnet wird, **Then** bleibt die Definition stabil und wird ohne Nutzer-konfigurierbare Erstellung verwendet.

---

### User Story 2 - Formular auf Handy nutzbar machen (Priority: P1)

Ein Nutzer muss das Formular auf einem Handy oder mobilen Gerät schnell und ohne Verwirrung ausfüllen können. Die Oberfläche soll für die Praxis im Feld geeignet sein.

**Why this priority**: Das Formular wird im realen Einsatz mobil verwendet. Eine gute Handy-Nutzung ist daher essenziell.

**Independent Test**: Ein Nutzer kann das Formular am Handy vollständig ausfüllen, ohne dass Felder unklar, zu klein oder aufwendig zu bedienen sind.

**Acceptance Scenarios**:

1. **Given** das Formular auf einem mobilen Gerät geöffnet wird, **When** der Nutzer mit den Feldern interagiert, **Then** sind die Eingabefelder ausreichend groß und touchfreundlich.
2. **Given** das Formular viele Inhalte hat, **When** der Nutzer scrollt und eingibt, **Then** bleibt die Struktur lesbar und die Bedienung verständlich.
3. **Given** ein Nutzer ein Feld ausfüllt, **When** er weiter navigiert, **Then** bleibt der fachliche Ablauf konsistent und nachvollziehbar.

---

### User Story 3 - Daten erfassen und speichern (Priority: P1)

Ein Nutzer muss die im Formular eingegebenen Werte erfassen und in einer Datenbank hinterlegen können. Die Speicherung muss zuverlässig und für spätere Auswertung nutzbar sein.

**Why this priority**: Das Formular ist nur wertvoll, wenn die Daten tatsächlich erfasst und dauerhaft gespeichert werden.

**Independent Test**: Ein Nutzer kann ein Formular ausfüllen und abschicken; anschließend sind die Daten in der Datenbank hinterlegt und können erneut abgerufen werden.

**Acceptance Scenarios**:

1. **Given** das Formular vollständig oder teilweise ausgefüllt wurde, **When** der Nutzer speichert oder absendet, **Then** werden die Daten in der Datenbank persistiert.
2. **Given** eine gespeicherte Eingabe vorliegt, **When** der Nutzer die Daten erneut aufruft, **Then** erscheinen die Werte korrekt im Formularkontext.
3. **Given** die Eintragung unvollständig ist, **When** der Nutzer speichert, **Then** wird diese fehlende Information erkannt und entsprechend behandelt.

---

### User Story 4 - Wartbare, feste Formularlogik (Priority: P2)

Das Entwicklungsteam muss das Glace-Formular in einer klaren und wartbaren Weise pflegen können. Änderungen am Formular sollen technisch sauber im Code oder in einer einfachen internen Konfiguration erfolgen, aber nicht vom regulären Nutzer über ein Builder-Tool erstellt werden.

**Why this priority**: Das Setup soll bewusst einfach bleiben. Erweiterungen sind technisch möglich, aber keine Nutzerfunktion.

**Independent Test**: Eine verantwortliche Fach- oder Entwicklungsperson kann eine kleine Änderung am Formular sauber vornehmen, ohne eine generische Builder-Architektur aufzubauen.

**Acceptance Scenarios**:

1. **Given** eine kleine Anpassung am Formular nötig ist, **When** das Entwicklungsteam die Umsetzung ändert, **Then** kann die Anpassung ohne große technische Komplexität erfolgen.
2. **Given** ein neues Feld oder eine Änderung am Ablauf erforderlich ist, **When** die Definition im Code oder in der internen Konfiguration angepasst wird, **Then** erscheint die Änderung im Formular und wird in der Datenerfassung berücksichtigt.
3. **Given** das Formular in der Anwendung angepasst wurde, **When** es erneut geladen wird, **Then** bleibt die Struktur konsistent, nachvollziehbar und nutzbar.

---

### Edge Cases

- Was passiert, wenn ein Feld in der Bauanleitung fehlt oder eine Definition unvollständig ist?
- Wie reagiert das System auf unvollständige oder fehlerhafte Formulareinträge?
- Was passiert, wenn das Formular nachträglich angepasst werden muss?
- Wie verhalten sich Daten, wenn die Struktur geändert wird, aber bereits Einträge existieren?
- Wie läuft die Nutzung auf einem mobilen Endgerät bei Unterbrechungen oder erneutem Öffnen ab?
- Wie verhalten sich unvollständige Durchläufe, wenn ein Nutzer nach kurzer Zeit zurückkehrt oder die Session abbricht?
- Wie gehen das automatische Speichern, der Inaktivitäts-Timeout und die Wiederaufnahme nach einem Abbruch technisch und UX-seitig vor?
- Wie wird ein abgebrochener oder verlassener Durchlauf in der Telemetrie erfasst, damit die Abbruchrate messbar bleibt?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Das System MUSS das Glace-Formular gemäß der vorhandenen Bauanleitung als digitale Formularstruktur abbilden.
- **FR-002**: Die Reihenfolge, Gruppierung und fachliche Logik des Formulars MÜSSEN der Bauanleitung entsprechen.
- **FR-003**: Das Formular MUSS für den Einsatz auf Handys optimiert sein und touchfreundlich bedienbar sein.
- **FR-004**: Das System MUSS eingegebene Daten in einer Datenbank speichern und persistent hinterlegen.
- **FR-005**: Die gespeicherten Werte MÜSSEN für spätere Nutzung, Auswertung oder Wiedereinlesung verfügbar sein.
- **FR-006**: Das Formular MUSS bei unvollständigen oder fehlerhaften Eingaben mit verständlichen Meldungen reagieren.
- **FR-007**: Das Formular MUSS als feste, direkt programmierte Anwendung umgesetzt werden und darf nicht durch den regulären Nutzer konfiguriert oder selbst erstellt werden.
- **FR-008**: Das Setup MUSS bewusst einfach gehalten sein und keine komplexe generische Builder-Architektur erfordern.
- **FR-009**: Die Lösung MUSS direkt auf die fachliche Formulardefinition aus der Bauanleitung fokussieren und keine unnötige technische Komplexität aufbauen.
- **FR-010**: Das System MUSS die Datenerfassung robust genug machen, dass sie im praktischen Einsatz zuverlässig funktioniert.
- **FR-011**: Das System MUSS unvollständige Formularangaben automatisch als Entwurf speichern, damit ein unterbrochener Durchlauf in einer späteren Session fortgesetzt oder neu gestartet werden kann. Der Timeout für Inaktivität MUSS zwischen 10 und 15 Minuten liegen, damit die Session bei längerer Untätigkeit sauber verworfen oder neu gestartet werden kann.
- **FR-012**: Das System MUSS zurückkehrende Besucher in der Lage versetzen, einen bestehenden Entwurf wieder aufzunehmen oder den Ablauf neu zu starten, ohne bisher eingegebene Daten zu verlieren.
- **FR-013**: Das System MUSS den Abbruch oder Verlassen einer Session als Telemetrie-Event erfassen, damit die Abbruchrate und der Wiederaufnahmepfad messbar sind.
- **FR-014**: Kleine Änderungen am Formular MÜSSEN nur durch das zuständige Entwicklungsteam oder die verantwortliche fachliche Stelle erfolgen, nicht durch Endnutzer.
- **FR-015**: Newsletter-Consent MUSS erst nach erfolgreichem Double-Opt-In aktiviert werden; unbestätigte Einwilligungen DÜRFEN nicht als Marketing-Subscription gelten.
- **FR-016**: In der ersten Version gibt es keinen Selbstbedienungs-Delete-Flow; personenbezogene Daten bleiben bis zum Ablauf der definierten Aufbewahrungsdauer gespeichert und werden nur durch manuelle Admin-Action bereinigt.

### UI/UX Requirements – Interaction Pattern

- **UX-001**: Das Formular SOLL so einfach wie möglich zum Ausfüllen sein; Texteingaben MÜSSEN minimiert werden.
- **UX-002**: Alle Felder, die es zulassen, SOLLEN durch Buttons, Dropdown-Auswahlen, oder einfache Klick-Interaktionen bedienbar sein, statt Free-Text-Input zu fordern.
- **UX-003**: Wo Text notwendig ist (z. B. Vorname, Postleitzahl), SOLLEN Eingabemasken mit kleinem Zeichenumfang und Platzhaltern eingesetzt werden, um die Eingabedauer zu minimieren.
- **UX-004**: Die Bedienelemente MÜSSEN gut erreichbar und sichtbar sein; Buttons SOLLEN mindestens 48px im Quadrat sein.
- **UX-005**: Das Formular SOLL auf Smartphones schnell, ohne Rucken, und mit minimaler kognitiver Last bedienbar sein.

### Tracking & Telemetry Requirements

- **TRK-001**: Das System MUSS jede relevante Benutzerinteraktion als explizites Event trackEN, inklusive Feldansicht, Feldfocus, Auswahl, Button-Klick, Formular-Weitergang und Formular-Abschluss. Für jeden Event MÜSSEN Feld-ID, Feldbezeichnung, Feldtyp, Interaktionstyp, Zeitstempel und Session- oder Correlation-ID erfasst werden.
- **TRK-002**: Für jedes Feld MUSS die Zeit im Feld gemessen werden: von der Sichtbarkeit des Feldes bis zum nächsten relevanten Übergang (z. B. Weiterklick, Auswahländerung, Absenden). Diese Dauer MUSS als time_on_field_ms zusammen mit dem Event-Stream gespeichert werden.
- **TRK-003**: Das System MUSS alle Tracking-Daten mit einer eindeutigen Session- bzw. Correlation-ID korrelieren, um den vollständigen Formulardurchlauf eines Nutzers nachzuverfolgen und per-field Events mit Auswahl- und Button-Interaktionen sauber zusammenzuführen.
- **TRK-004**: Tracking-Daten MÜSSEN strukturiert sein: event_id, session_id, correlation_id, form_id, field_id, field_label, field_type, event_type, interaction_kind, option_value, timestamp, duration_ms, source (client/server). Die Daten MÜSSEN keine direkt identifizierenden Personendaten über Vorname + Firma hinaus enthalten.
- **TRK-005**: Telemetry-Daten MÜSSEN persistent in der Datenbank oder in einem strukturierten Log gespeichert werden für Auswertung und UX-Optimierung.
- **TRK-006**: Die gesammelten Tracking-Daten DÜRFEN keinen direkt identifizierenden Personendaten enthalten, die über Vorname + Firma hinausgehen; Sensitivdaten MÜSSEN gefiltert oder anonymisiert werden.
- **TRK-007**: Das System SOLL aggregierte Statistiken zur Verfügung stellen: durchschnittliche Feldausfüllzeiten pro Feld, Verweilzeiten nach Feldtyp, Ausfallquoten pro Feld und Klick-/Auswahlmuster pro Interaktionsart.

### Key Entities *(include if feature involves data)*

- **Glace-Formular**: Das bereits definierte Formular aus der Bauanleitung, dessen Struktur und Inhalte digital umgesetzt werden.
- **Formularbereich**: Logische Gruppierung von Feldern im Formular.
- **Formularfeld**: Ein einzelnes Eingabefeld mit Bezeichnung, Typ und Validierungslogik.
- **Eingabe**: Der vom Nutzer eingetragene Wert für ein bestimmtes Feld.
- **Datensatz**: Die Gesamtheit der erfassten Daten für ein Formularausfüllen.
- **Datenbank**: Speicherung der Formulardaten zur späteren Nutzung und Auswertung.
- **Telemetry-Datensatz**: Tracking-Daten für eine Nutzer-Interaktion (Feldaufruf, Zeit, Interaktionstyp, Zeitstempel).
- **Session**: Eine logische Einheit eines Formular-Durchlaufs mit eindeutiger Session-ID.
- **Submission**: Ein abgeschlossenes oder abgebrochenes Formular-Ausfüllszenario mit allen Telemetry-Daten und Nutzereingaben.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Das Glace-Formular wird gemäß der Bauanleitung als digitale Oberfläche umgesetzt und entspricht fachlich der vorgegebenen Definition.
- **SC-002**: Das Formular kann auf mobilen Geräten zuverlässig und ohne Bedienungsprobleme genutzt werden.
- **SC-003**: Alle eingegebenen Daten werden in der Datenbank korrekt gespeichert und bleiben für die spätere wiederholte Nutzung verfügbar.
- **SC-004**: Das Glace-Formular bleibt als feste, im Code implementierte Lösung bestehen und kann nur durch die zuständige Organisation mit klarer fachlicher und technischer Wartung angepasst werden.
- **SC-005**: Das System bleibt im Aufbau bewusst einfach und fokussiert auf die fachlich korrekte Datenerfassung.
- **SC-006**: Das Formular wird möglichst ohne Texteingaben aufgebaut; Textfelder sind auf notwendige Fälle (Vorname, Postleitzahl) begrenzt.
- **SC-007**: Jede Benutzerinteraktion wird getracked: Feldaufruf, Dauer pro Feld, Interaktionstyp und Zeitstempel sind im Telemetry-System vorhanden.
- **SC-008**: Für jedes Formularfeld ist die durchschnittliche Ausfüllzeit messbar und abrufbar.
- **SC-009**: Tracking-Daten sind strukturiert und korreliert mit der Submission-ID, sodass der komplette Formularausfülldurchlauf nachverfolgbar ist.
- **SC-010**: Das System stellt aggregierte Statistiken bereit: durchschnittliche Feldausfüllzeiten, Verweilzeiten nach Feldtyp, Abbruchlquoten pro Feld.

## Clarifications

### Session 2026-08-30
- Q1: Should incomplete form data be persisted locally on the device, and can users resume an interrupted form in a new session? → A: Server-side draft storage (option C)
- Q2: What telemetry event model should be tracked for the form flow? → A: Track per-field events, time-on-field, and button/selection interactions with a session correlation ID.
- Q3: How should incomplete sessions be handled after inactivity or return visits? → A: Auto-save drafts with a 10–15 minute inactivity timeout; users can resume or restart the flow; abandonment is tracked as telemetry.
- Q4: How should marketing consent be handled after the final click? → A: Require a confirmation email before the user is stored as a marketing subscriber (double opt-in, option C).
- Q5: What is the deletion workflow for personal data requests? → A: No self-service delete flow in the initial release; personal data is kept until the defined retention period and any removal outside that schedule requires manual admin action (option D).

## Assumptions

- Die Bauanleitung ist die verbindliche Definition des Formularelements.
- Das Formular ist bereits fachlich klar definiert und muss als feste Implementierung technisch umgesetzt werden.
- Es gibt keine Notwendigkeit für einen komplexen dynamischen Formbuilder im ersten Schritt.
- Der reguläre Nutzer kann das Formular nicht selbst erstellen oder konfigurieren; dies liegt in der Verantwortung der Produkt- bzw. Entwicklungsteam-Seite.
- Die Lösung soll einfach, robust und mobil nutzbar sein.
- Hinter dem Formular steht eine Datenbank zur Sammlung und Speicherung der erfassten Daten.
- Unvollständige Formulare werden serverseitig als Entwürfe gespeichert, damit Nutzer einen unterbrochenen Durchlauf in einer neuen Session fortsetzen können.
- Das Tracking erfolgt auf dem Browser/Client-Seitig und wird mit jedem Formular-Submit an das Backend gesendet.
- Telemetry-Daten enthalten keine direkt identifizierenden Daten über die Anmeldung hinaus (Vorname + Firma); weitere Personalisierung erfolgt durch aggregierte Auswertung.
- Newsletter-Consent wird erst nach erfolgreicher Double-Opt-In-Bestätigung aktiviert; unbestätigte Einwilligungen werden nicht für Marketing genutzt.
- Für die erste Version gibt es keinen Selbstbedienungs-Delete-Flow; Daten werden gemäß der gesetzlichen/produktseitigen Aufbewahrungsdauer aufbewahrt und nur manuell durch Admins bereinigt.
