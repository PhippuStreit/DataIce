export type FormField = {
  id: string;
  label: string;
  type: 'text' | 'select' | 'radio' | 'checkbox';
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export const formFields: FormField[] = [
  { id: 'firstName', label: 'Wer bist du?', type: 'text', required: true, placeholder: 'Vorname' },
  { id: 'company', label: 'Für welche Firma?', type: 'text', required: true, placeholder: 'Firma' },
  { id: 'role', label: 'Welche Rolle hast du?', type: 'select', required: true, options: ['Marketing', 'Vertrieb', 'Operations', 'Management'] },
  { id: 'yearsExperience', label: 'Wie viele Jahre Erfahrung?', type: 'select', required: true, options: ['0-2', '3-5', '6-10', '10+'] },
  { id: 'postalCode', label: 'Postleitzahl', type: 'text', required: true, placeholder: 'PLZ' },
  { id: 'favoriteFlavor', label: 'Deine Lieblings-Glace?', type: 'select', required: true, options: ['Vanille', 'Schokolade', 'Erdbeere', 'Straciatella'] },
  { id: 'visitReason', label: 'Warum bist du hier?', type: 'select', required: true, options: ['Neu', 'Wiederholung', 'Geschäftlich', 'Empfehlung'] },
  { id: 'operatingSystem', label: 'Betriebssystem?', type: 'select', required: true, options: ['iOS', 'Android', 'Windows', 'macOS'] },
  { id: 'appCount', label: 'Wie viele Apps nutzt du?', type: 'select', required: true, options: ['1-5', '6-10', '11-20', '20+'] },
  { id: 'passwordManager', label: 'Passwortmanager?', type: 'select', required: true, options: ['Ja', 'Nein', 'Ich weiß nicht'] },
  { id: 'privacyReading', label: 'Datenschutzerklärung gelesen?', type: 'select', required: true, options: ['Ja', 'Nein'] },
  { id: 'phoneNumber', label: 'Handynummer', type: 'text', required: true, placeholder: '+41 79 ...' },
  { id: 'iceName', label: 'Name deiner Glace', type: 'text', required: true, placeholder: 'Glace-Name' },
  { id: 'newsletter', label: 'Newsletter abonnieren', type: 'checkbox' },
  { id: 'termsAccepted', label: 'Ich akzeptiere die Bedingungen', type: 'checkbox', required: true },
];
