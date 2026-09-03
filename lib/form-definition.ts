export type FormField = {
  id: string;
  label: string;
  type: 'text' | 'select' | 'radio' | 'checkbox' | 'slider';
  required?: boolean;
  options?: string[];
  multiple?: boolean;
  columns?: 1 | 2;
  hint?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  unit?: string;
};

export const formFields: FormField[] = [
  { id: 'firstName', label: 'Wer bist du?', type: 'text', required: true, placeholder: 'Vorname' },
  { id: 'company', label: 'Für welche Firma?', type: 'text', required: true, placeholder: 'Firma' },
  {
    id: 'role',
    label: 'Welche Rolle hast du?',
    type: 'select',
    required: true,
    columns: 1,
    options: [
      'Geschäftsführung / CEO',
      'Mitglied der Geschäftsleitung',
      'Bereichs- / Abteilungsleitung',
      'Projekt- / Programmleitung',
      'Fachspezialist:in / Expert:in',
      'Lehrperson / Dozent:in / Trainer:in',
      'Lernende:r / Studierende:r',
      'Andere Funktion',
    ],
  },
  { id: 'yearsExperience', label: 'Wie viele Jahre Erfahrung?', type: 'slider', required: true, min: 1, max: 60, unit: 'Jahre' },
  { id: 'postalCode', label: 'Postleitzahl', type: 'text', required: true, placeholder: 'PLZ' },
  { id: 'favoriteFlavor', label: 'Deine Lieblings-Glace?', type: 'select', required: true, multiple: true, hint: 'Mehrfachauswahl möglich', options: ['Spargelglace', 'Vegan', 'Rahmglace', 'Sorbet'] },
  { id: 'visitReason', label: 'Warum bist du hier?', type: 'select', required: true, options: ['Networking', 'Digitale Transformation', 'KI', 'Horizonterweiterung'] },
  { id: 'appCount', label: 'Wie viele Apps auf deinem Handy nutzt du?', type: 'select', required: true, options: ['1-5', '6-10', '11-20', '20+'] },
  { id: 'passwordManager', label: 'Nutzt du einen Passwortmanager?', type: 'select', required: true, options: ['Ja', 'Nein', 'Ich weiss nicht'] },
  { id: 'privacyReading', label: 'Datenschutzerklärung gelesen?', type: 'select', required: true, options: ['Ja', 'Nein'] },
  { id: 'phoneNumber', label: 'Handynummer', type: 'text', hint: 'optional', placeholder: '+41 79 ...' },
  { id: 'newsletter', label: 'Newsletter abonnieren', type: 'checkbox' },
  { id: 'termsAccepted', label: 'Ich akzeptiere die Bedingungen', type: 'checkbox', required: true },
];

// Wird aus dem Browser ermittelt, nicht abgefragt.
export const autoFields = ['operatingSystem'] as const;
