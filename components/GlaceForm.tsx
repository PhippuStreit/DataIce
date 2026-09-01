'use client';

import React, { useMemo, useState } from 'react';
import { formFields, type FormField } from '@/lib/form-definition';

const initialData: Record<string, string | boolean> = {
  firstName: '',
  company: '',
  role: '',
  yearsExperience: '',
  postalCode: '',
  favoriteFlavor: '',
  visitReason: '',
  operatingSystem: '',
  appCount: '',
  passwordManager: '',
  privacyReading: '',
  phoneNumber: '',
  iceName: '',
  newsletter: false,
  termsAccepted: false,
};

export default function GlaceForm() {
  const [data, setData] = useState<Record<string, string | boolean>>(initialData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const steps = useMemo(
    () => [
      ['firstName', 'company', 'role', 'yearsExperience'],
      ['postalCode', 'favoriteFlavor', 'visitReason', 'operatingSystem'],
      ['appCount', 'passwordManager', 'privacyReading', 'phoneNumber'],
      ['iceName', 'newsletter', 'termsAccepted'],
    ],
    [],
  );

  const visibleFields = steps[currentStep];

  const updateField = (key: string, value: string | boolean) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const isFieldComplete = (field: FormField): boolean => {
    if (!field.required) return true;
    const value = data[field.id];
    if (field.type === 'checkbox') return value === true;
    // privacyReading zählt nur als ausgefüllt, wenn "Ja" gewählt wurde
    if (field.id === 'privacyReading') return value === 'Ja';
    return typeof value === 'string' && value.trim().length > 0;
  };

  const isStepValid = visibleFields.every((fieldId) =>
    isFieldComplete(formFields.find((item) => item.id === fieldId)!),
  );

  const goNext = () => {
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const goBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      sessionId: 'mobile-session',
      correlationId: 'corr-mobile',
      data: {
        ...data,
        newsletter: Boolean(data.newsletter),
        termsAccepted: Boolean(data.termsAccepted),
      },
    };

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.details
          ? result.details.map((d: any) => `${d.path}: ${d.message}`).join(' | ')
          : result.message || 'Es gab einen Fehler beim Absenden.';
        setSubmitError(errorMsg);
        return;
      }

      setIsSubmitted(true);
    } catch (error) {
      setSubmitError('Verbindung fehlgeschlagen. Bitte versuche es erneut.');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  if (isSubmitted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-8">
        <div className="w-full rounded-3xl bg-white p-8 text-center shadow-soft">
          <img src="/nexplore.svg" alt="Nexplore" className="mx-auto h-8 w-auto" />
          <h1 className="mt-8 text-4xl font-bold text-slate-900">Merci viumau</h1>
          <p className="mt-4 text-slate-600">Deine Angaben sind gespeichert.</p>
          <a
            href="https://www.nexplore.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-2xl bg-orange-500 px-6 py-3 font-semibold text-white"
          >
            www.nexplore.ch
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-8">
      <div className="w-full rounded-3xl bg-white p-5 shadow-soft">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <img src="/nexplore.svg" alt="Nexplore" className="h-6 w-auto" />
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Deine Gratis-Glace</h1>
          </div>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
            {currentStep + 1}/{steps.length}
          </span>
        </div>

        <div className="mb-6 flex gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full ${index <= currentStep ? 'bg-orange-500' : 'bg-orange-100'}`}
            />
          ))}
        </div>

        <div className="space-y-4">
          {visibleFields.map((fieldId) => {
            const field = formFields.find((item) => item.id === fieldId)!;
            const value = data[fieldId] ?? '';

            if (field.type === 'checkbox') {
              return (
                <label key={field.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3">
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) => updateField(field.id, event.target.checked)}
                    className="mt-1 h-5 w-5 accent-orange-500"
                  />
                  <span className="text-sm text-slate-700">
                    {field.label}
                    {field.required && <span className="text-orange-500"> *</span>}
                  </span>
                </label>
              );
            }

            return (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {field.label}
                  {field.required && <span className="text-orange-500"> *</span>}
                </label>
                {field.options ? (
                  <div className="grid grid-cols-2 gap-2">
                    {field.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`touch-button ${value === option ? 'touch-button-selected' : ''}`}
                        onClick={() => updateField(field.id, option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    value={String(value)}
                    onChange={(event) => updateField(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none ring-0 placeholder:text-slate-400 focus:border-orange-400"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={currentStep === 0}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 disabled:opacity-40"
          >
            Zurück
          </button>
          {isLastStep ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isStepValid}
              className="flex-1 rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? 'Wird gespeichert...' : 'Absenden'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={!isStepValid}
              className="flex-1 rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Weiter
            </button>
          )}
        </div>

        {submitError && (
          <div className="mt-4 rounded-2xl bg-red-100 p-4 text-red-800">
            {submitError}
          </div>
        )}
      </div>
    </main>
  );
}
