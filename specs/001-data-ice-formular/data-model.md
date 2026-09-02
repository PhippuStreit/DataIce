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
| yearsExperience | int (1–60) | required | slider value, stored as numeric string |
| postalCode | string | required | first 2 digits only |
| iceCream | enum | required | fixed options |
| transport | enum | required | fixed options |
| os | string | required | auto-detected from browser, not asked |
| appCount | enum | required | option bucket |
| passwordManager | enum | required | yes / no / unknown |
| privacyReading | enum | required | always / sometimes / never / unknown |
| phoneNumber | string | optional | optional contact |
| iceName | string | optional | deprecated 2026-09-02, no longer collected; column kept nullable |
| favoriteFlavor | string | required | Mehrfachauswahl, kommasepariert (Spargelglace/Vegan/Rahmglace/Sorbet) |
| newsletterConsent | boolean | required | Checkbox vorausgewählt (Entscheid 2026-09-02) |
| newsletterConfirmedAt | datetime | optional | confirmation timestamp |
| termsAccepted | boolean | required | required check |
| pickupCode | string | optional | zufälliger Abhol-Code `GLACE-XXXX-XXXX`, auch als QR im Abschluss-Screen |
| termsOpened | boolean | required | wurde das Nutzungsbedingungen-Overlay geöffnet |
| termsViewMs | int | optional | kumulierte Verweildauer im Overlay |

#### Erfasster Besucher-Kontext (implementiert 2026-09-02)

Zusätzlich zu den Antworten speichert jede `Submission` den technischen Kontext des Erfassers:

| Gruppe | Felder |
|---|---|
| Netz / Server | `ipAddress`, `forwardedFor`, `userAgent`, `acceptLanguage` |
| UA geparst | `browserName`, `browserVersion`, `engineName`, `osName`, `osVersion`, `deviceType`, `deviceVendor`, `deviceModel`, `isBot` |
| Gerät & Anzeige (Client) | `screenWidth/Height`, `viewportWidth/Height`, `pixelRatio`, `colorDepth`, `touchCapable`, `maxTouchPoints`, `orientation` |
| Sprache & Zeit | `clientLanguages`, `timezone`, `utcOffsetMinutes`, `clientTime` |
| Herkunft & Netz (Client) | `referrer`, `entryUrl`, `connectionType`, `connectionDownlink`, `deviceMemoryGb`, `hardwareConcurrency` |
| Verhaltens-Aggregate | `totalDurationMs`, `interactionCount` |

- `ipAddress` wird aus `X-Forwarded-For` / `X-Real-IP` (nginx) gelesen und **roh** gespeichert (keine Anonymisierung, Entscheid 2026-09-02).
- Alle Kontextfelder sind optional; fehlende/fehlerhafte Telemetrie darf das Speichern der Antworten nie verhindern.

### FieldStat (Aggregat pro Feld, implementiert 2026-09-02)

Eine Zeile pro `(submissionId, fieldId)`. Ableitung aus dem Event-Stream.

| Field | Type | Notes |
|---|---|---|
| submissionId | UUID | FK, cascade delete |
| fieldId / fieldName | string | |
| interactionType | string | text / select / slider / checkbox |
| stepIndex | int? | Formularschritt |
| firstViewedAt | datetime? | erstes `view`-Event |
| answeredAt | datetime? | letzte Werteänderung |
| timeToAnswerMs | int | answeredAt − firstViewedAt |
| focusMs | int | Summe aller Focus→Blur-Spannen (Tipp-/Verweildauer) |
| changeCount | int | Anzahl Werteänderungen |
| focusCount | int | Anzahl Focus-Ereignisse |
| finalValue | string? | Endwert |

### FieldInteraction

Roher Event-Stream: eine Zeile pro Ereignis während des Formulardurchlaufs
(implementiert 2026-09-02).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | required | primary key |
| submissionId | UUID | required | FK, cascade delete |
| sequence | int | required | Reihenfolge im Stream |
| stepIndex | int | optional | Formularschritt |
| fieldId | string | required | Feld-ID bzw. `__step__` / `__submit__` |
| fieldName | string | required | Label |
| eventType | string | required | view / focus / blur / change / select / next / submit |
| interactionType | string | required | text / select / slider / checkbox / navigation |
| startedAt | datetime | optional | Zeitpunkt des Events |
| endedAt | datetime | optional | = startedAt (Punktereignis) |
| durationMs | integer | required | 0 für Punktereignisse |
| value | string | optional | gewählter/eingegebener Wert |

### Session

Represents an active browser workflow and allows persistence/resume behavior.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| sessionId | UUID | required | unique |
| correlationId | UUID | optional | Flow-Trace |
| createdAt | datetime | required | session start |
| lastActivityAt | datetime | required | activity heartbeat |
| ipAddress | string | optional | roh |
| userAgent | string | optional | |
| browserName / osName / platform | string | optional | aus UA |
| screenSize / viewportSize | string | optional | `WxH` |
| timezone / languages | string | optional | |
| referrer / entryUrl | string | optional | |
| interactionCount | int | required | Events im letzten Durchlauf |
| submittedCount | int | required | Anzahl erfolgreicher Abgaben |

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
