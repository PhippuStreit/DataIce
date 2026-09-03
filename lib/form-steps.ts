// Verteilt die Formularfelder dynamisch auf Schritte, sodass ein Schritt
// auf einem Handy-Bildschirm ohne Scrollen passt.
// Regel: Text-/Slider-Felder werden gebündelt, Felder mit Optionslisten
// bekommen je nach Höhe einen eigenen Schritt, Checkboxen kommen zusammen.

import { formFields, type FormField } from '@/lib/form-definition';

// Geschätzte Höhe des Karten-Innenraums für Felder (px), konservativ.
const BUDGET = 380;
const LONG_LABEL = 16;

export function estimateFieldHeight(field: FormField): number {
  if (field.type === 'checkbox') return 60;

  let height = 46; // Label
  if (field.hint) height += 16;

  if (field.type === 'text') return height + 50;
  if (field.type === 'slider') return height + 76;

  // select / radio (Buttons)
  const options = field.options ?? [];
  const longLabel = options.some((o) => o.length > LONG_LABEL);
  const columns = field.columns ?? (field.multiple || longLabel || options.length > 4 ? 1 : 2);
  const rows = Math.ceil(options.length / columns);
  const rowHeight = longLabel ? 54 : 48;
  return height + rows * (rowHeight + 8);
}

type Kind = 'input' | 'consent';
const kindOf = (field: FormField): Kind => (field.type === 'checkbox' ? 'consent' : 'input');

export function buildSteps(fields: FormField[] = formFields): string[][] {
  const steps: string[][] = [];
  let current: string[] = [];
  let currentHeight = 0;
  let currentKind: Kind | null = null;

  for (const field of fields) {
    const kind = kindOf(field);
    const height = estimateFieldHeight(field);
    const wouldExceed = currentHeight + height > BUDGET;

    if (current.length > 0 && (kind !== currentKind || wouldExceed)) {
      steps.push(current);
      current = [];
      currentHeight = 0;
    }

    current.push(field.id);
    currentHeight += height;
    currentKind = kind;
  }

  if (current.length > 0) steps.push(current);
  return steps;
}
