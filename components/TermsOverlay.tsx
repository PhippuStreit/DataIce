'use client';

import React, { useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function TermsOverlay({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Glace-Nutzungsbedingungen"
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-soft sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">Glace-Nutzungsbedingungen</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600"
          >
            Schliessen
          </button>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-slate-700">
          <p>
            <strong>§1 Geltungsbereich.</strong> Diese Bedingungen gelten für den Bezug von genau einer (1)
            Gratis-Glace am Nexplore-Stand. Eine zweite Glace ist physikalisch möglich, moralisch aber
            Gegenstand hitziger Debatten.
          </p>
          <p>
            <strong>§2 Der Kompliment-Paragraph.</strong> Mit der Annahme der Glace verpflichtest du dich,
            noch heute am Event einer Person ein <strong>ehrliches, freundliches Kompliment</strong> zu
            machen. Kein generisches &laquo;schöner Lanyard&raquo; &ndash; etwas Echtes. Die Einhaltung wird
            nicht kontrolliert, aber das Universum führt Buch.
          </p>
          <p>
            <strong>§3 Schleckordnung.</strong> Die Glace ist von oben nach unten zu konsumieren. Wer von
            unten anfängt, akzeptiert das Risiko klebriger Finger und stillschweigender Blicke.
          </p>
          <p>
            <strong>§4 Sortenwahl.</strong> Spargelglace ist eine legitime Wahl und wird hier nicht
            kommentiert. Okay, ein bisschen: mutig.
          </p>
          <p>
            <strong>§5 Haftung.</strong> Nexplore haftet nicht für Brain-Freeze, spontane Gute-Laune-Anfälle
            oder den unwiderstehlichen Drang, danach über digitale Transformation zu sprechen.
          </p>
          <p>
            <strong>§6 Datenschutz light.</strong> Was du ins Formular tippst, schauen wir uns an &ndash;
            neugierig, aber wohlwollend. Details in der Datenschutzerklärung, die niemand liest (siehe auch
            deine Antwort weiter oben).
          </p>
          <p>
            <strong>§7 Schlussbestimmung.</strong> Sollte ein Paragraph unwirksam sein, bleibt die Glace
            trotzdem gültig. Es gilt Schweizer Recht und der gesunde Menschenverstand, im Zweifel Letzterer.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-white"
        >
          Verstanden
        </button>
      </div>
    </div>
  );
}
