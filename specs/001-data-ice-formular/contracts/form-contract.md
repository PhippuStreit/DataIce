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
    "yearsExperience": "5-15",
    "postalCode": "36",
    "iceCream": "vanille",
    "transport": "auto",
    "os": "iphone",
    "appCount": "20-50",
    "passwordManager": "ja",
    "privacyReading": "manchmal",
    "phoneNumber": "+41790000000",
    "iceName": "S-Minou-Bergstrasse",
    "newsletterConsent": false,
    "termsAccepted": true
  },
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
- `newsletterConsent` must not be active until double-opt-in confirmation is completed.

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
