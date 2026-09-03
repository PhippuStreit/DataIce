import { z } from 'zod';

export const formDataSchema = z.object({
  firstName: z.string().min(1, 'Bitte gib deinen Vornamen ein.'),
  company: z.string().min(1, 'Bitte gib deinen Firmennamen ein.'),
  role: z.string().min(1, 'Bitte wähle deine Rolle.'),
  yearsExperience: z
    .string()
    .min(1, 'Bitte wähle deine Berufserfahrung.')
    .refine((value) => {
      const n = Number(value);
      return Number.isFinite(n) && n >= 1 && n <= 60;
    }, 'Bitte wähle einen Wert zwischen 1 und 60 Jahren.'),
  postalCode: z.string().min(1, 'Bitte gib deine Postleitzahl ein.'),
  favoriteFlavor: z.string().min(1, 'Bitte wähle deine Lieblings-Glace.'),
  visitReason: z.string().min(1, 'Bitte wähle einen Grund für deinen Besuch.'),
  // Wird clientseitig aus dem Browser ermittelt, nicht abgefragt.
  operatingSystem: z.string().min(1),
  appCount: z.string().min(1, 'Bitte wähle eine Anzahl.'),
  passwordManager: z.string().min(1, 'Bitte wähle eine Option.'),
  // Ja oder Nein sind beide gültig; blockiert den Abschluss nicht.
  privacyReading: z.string().min(1, 'Bitte wähle Ja oder Nein.'),
  phoneNumber: z.string().optional().default(''),
  newsletter: z.boolean().optional(),
  termsAccepted: z.boolean().refine((value) => value === true, {
    message: 'Bitte akzeptiere die Bedingungen.',
  }),
});

// Telemetrie ist optional und lenient: fehlerhafte Tracking-Daten dürfen
// das Speichern der Formularantworten nie verhindern.
const clientContextSchema = z
  .object({
    screenWidth: z.number().optional(),
    screenHeight: z.number().optional(),
    viewportWidth: z.number().optional(),
    viewportHeight: z.number().optional(),
    pixelRatio: z.number().optional(),
    colorDepth: z.number().optional(),
    touchCapable: z.boolean().optional(),
    maxTouchPoints: z.number().optional(),
    orientation: z.string().optional(),
    clientLanguages: z.string().optional(),
    timezone: z.string().optional(),
    utcOffsetMinutes: z.number().optional(),
    clientTime: z.string().optional(),
    referrer: z.string().optional(),
    entryUrl: z.string().optional(),
    connectionType: z.string().optional(),
    connectionDownlink: z.number().optional(),
    deviceMemoryGb: z.number().optional(),
    hardwareConcurrency: z.number().optional(),
    userAgent: z.string().optional(),
  })
  .partial()
  .passthrough();

const fieldEventSchema = z
  .object({
    sequence: z.number().optional(),
    stepIndex: z.number().nullable().optional(),
    fieldId: z.string(),
    fieldName: z.string().optional(),
    eventType: z.string(),
    interactionType: z.string().optional(),
    at: z.string().optional(),
    value: z.string().nullable().optional(),
  })
  .passthrough();

const fieldStatSchema = z
  .object({
    fieldId: z.string(),
    fieldName: z.string().optional(),
    interactionType: z.string().optional(),
    stepIndex: z.number().nullable().optional(),
    firstViewedAt: z.string().nullable().optional(),
    answeredAt: z.string().nullable().optional(),
    timeToAnswerMs: z.number().optional(),
    focusMs: z.number().optional(),
    changeCount: z.number().optional(),
    focusCount: z.number().optional(),
    finalValue: z.string().nullable().optional(),
  })
  .passthrough();

export const submissionSchema = z.object({
  sessionId: z.string().min(1),
  correlationId: z.string().min(1),
  data: formDataSchema,
  context: clientContextSchema.optional(),
  pickupCode: z.string().max(64).optional(),
  termsOpened: z.boolean().optional(),
  termsViewMs: z.number().optional(),
  totalDurationMs: z.number().optional(),
  interactionCount: z.number().optional(),
  events: z.array(fieldEventSchema).optional(),
  fieldStats: z.array(fieldStatSchema).optional(),
  // Legacy-Feld, weiterhin akzeptiert:
  interactions: z
    .array(
      z.object({
        fieldId: z.string(),
        fieldName: z.string(),
        interactionType: z.string(),
        startedAt: z.string().optional(),
        endedAt: z.string().optional(),
        durationMs: z.number().optional(),
        value: z.string().optional(),
      }),
    )
    .optional(),
});
