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
  privacyReading: z.string().refine((value) => value === 'Ja', {
    message: 'Bitte akzeptiere die Datenschutzerklärung.',
  }),
  phoneNumber: z.string().min(1, 'Bitte gib deine Handynummer ein.'),
  newsletter: z.boolean().optional(),
  termsAccepted: z.boolean().refine((value) => value === true, {
    message: 'Bitte akzeptiere die Bedingungen.',
  }),
});

export const submissionSchema = z.object({
  sessionId: z.string().min(1),
  correlationId: z.string().min(1),
  data: formDataSchema,
  interactions: z.array(z.object({
    fieldId: z.string(),
    fieldName: z.string(),
    interactionType: z.string(),
    startedAt: z.string().optional(),
    endedAt: z.string().optional(),
    durationMs: z.number().optional(),
    value: z.string().optional(),
  })).optional(),
});
