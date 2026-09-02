# Contracts: Glace-Formular API

## POST /api/submit

Request

```json
{
  "sessionId": "uuid",
  "correlationId": "uuid",
  "data": {
    "firstName": "Sabine",
    "company": "Nexplore",
    "role": "fachkraft",
    "yearsExperience": "12",
    "postalCode": "36",
    "favoriteFlavor": "Vegan, Sorbet",
    "os": "iOS",
    "appCount": "20-50",
    "passwordManager": "ja",
    "privacyReading": "manchmal",
    "phoneNumber": "+41790000000",
    "newsletter": true,
    "termsAccepted": true
  },
  "pickupCode": "GLACE-7Q2M-K4XR",
  "termsOpened": true,
  "termsViewMs": 8200,
  "context": { "timezone": "Europe/Zurich", "screenWidth": 390 },
  "events": [],
  "fieldStats": [],
  "interactions": [
    {
      "fieldId": "field_3_role",
      "fieldLabel": "Und was machst du dort?",
      "fieldType": "select",
      "interactionType": "select",
      "startedAt": "2026-08-30T12:00:00Z",
      "endedAt": "2026-08-30T12:00:03Z",
      "durationMs": 3000,
      "value": "fachkraft"
    }
  ]
}
```

Response

```json
{
  "status": "success",
  "submissionId": "uuid",
  "correlationId": "uuid"
}
```

Validation requirements:
- `termsAccepted` must be true.
- all required fields must be present and valid.
- `yearsExperience` is a slider value; integer 1–60 sent as string.
- `os` is set by the client from the browser (User-Agent / `navigator.userAgentData`); it is not a form question.
- `iceName` is no longer sent (deprecated 2026-09-02).
- `favoriteFlavor` is a comma-separated multi-select (Spargelglace / Vegan / Rahmglace / Sorbet).
- `newsletter` defaults to `true` (checkbox pre-checked).
- `pickupCode` is a client-generated random code shown as QR on the completion screen.
- `termsOpened` / `termsViewMs` track whether and how long the terms overlay was viewed.

## GET /api/stats

Response

```json
{
  "fieldMetrics": [
    {
      "fieldId": "field_3_role",
      "avgDurationMs": 4200,
      "completionRate": 0.97,
      "errorCount": 2
    }
  ]
}
```

## Error contract

```json
{
  "status": 400,
  "error": "validation_failed",
  "message": "Bitte füllen Sie alle Pflichtfelder aus."
}
```

## Notes

- System logs should keep only field IDs and aggregate durations, not raw sensitive values.
- Responses should be persisted server-side with correlation identifiers to support traceability.
