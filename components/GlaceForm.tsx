'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { formFields, type FormField } from '@/lib/form-definition';
import { buildSteps } from '@/lib/form-steps';
import { collectClientContext, createFieldTracker, type FieldTracker } from '@/lib/telemetry';
import TermsOverlay from '@/components/TermsOverlay';

const newId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    // ignore
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

// Zufälliger Abhol-Code für die Bestätigung am Stand.
const newPickupCode = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `GLACE-${block()}-${block()}`;
};

const initialData: Record<string, string | boolean> = {
  firstName: '',
  company: '',
  role: '',
  yearsExperience: '',
  postalCode: '',
  favoriteFlavor: '',
  visitReason: '',
  appCount: '',
  passwordManager: '',
  privacyReading: '',
  phoneNumber: '',
  newsletter: true,
  termsAccepted: false,
};

// Betriebssystem aus dem Browser ableiten statt abfragen.
const detectOperatingSystem = (): string => {
  if (typeof navigator === 'undefined') return 'Unbekannt';
  const uaPlatform = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform;
  if (uaPlatform) return uaPlatform;
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unbekannt';
};

export default function GlaceForm() {
  const [data, setData] = useState<Record<string, string | boolean>>(initialData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);

  const pickupCodeRef = useRef<string>();
  if (!pickupCodeRef.current) pickupCodeRef.current = newPickupCode();

  // Nutzungsbedingungen-Interaktion
  const termsOpenedRef = useRef(false);
  const termsViewMsRef = useRef(0);
  const termsOpenAtRef = useRef<number | null>(null);

  const steps = useMemo(() => buildSteps(), []);

  const idsRef = useRef<{ sessionId: string; correlationId: string }>();
  if (!idsRef.current) {
    idsRef.current = { sessionId: newId(), correlationId: newId() };
  }
  const contextRef = useRef<ReturnType<typeof collectClientContext>>({});
  const trackerRef = useRef<FieldTracker>();
  if (!trackerRef.current) {
    trackerRef.current = createFieldTracker(steps);
  }

  useEffect(() => {
    contextRef.current = collectClientContext();
  }, []);

  const visibleFields = steps[currentStep];

  // Feld-Ansicht tracken, sobald ein Schritt sichtbar wird.
  useEffect(() => {
    trackerRef.current?.view(steps[currentStep]);
  }, [currentStep, steps]);

  const updateField = (key: string, value: string | boolean) => {
    trackerRef.current?.change(key, value);
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const isFieldComplete = (field: FormField): boolean => {
    if (!field.required) return true;
    const value = data[field.id];
    if (field.type === 'checkbox') return value === true;
    return typeof value === 'string' && value.trim().length > 0;
  };

  const isStepValid = visibleFields.every((fieldId) =>
    isFieldComplete(formFields.find((item) => item.id === fieldId)!),
  );

  const goNext = () => {
    trackerRef.current?.step(currentStep);
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const goBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const openTerms = () => {
    termsOpenedRef.current = true;
    termsOpenAtRef.current = Date.now();
    trackerRef.current?.terms('open');
    setShowTerms(true);
  };

  const closeTerms = () => {
    if (termsOpenAtRef.current != null) {
      termsViewMsRef.current += Date.now() - termsOpenAtRef.current;
      termsOpenAtRef.current = null;
    }
    trackerRef.current?.terms('close');
    setShowTerms(false);
  };

  // Mehrfachauswahl: kommaseparierter String im State.
  const toggleMulti = (fieldId: string, option: string) => {
    const current = String(data[fieldId] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const next = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    updateField(fieldId, next.join(', '));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Falls die Bedingungen beim Absenden noch offen sind: Zeit mitzählen.
    if (termsOpenAtRef.current != null) {
      termsViewMsRef.current += Date.now() - termsOpenAtRef.current;
      termsOpenAtRef.current = null;
    }

    trackerRef.current?.submit();
    const telemetry = trackerRef.current?.build(data);

    const payload = {
      sessionId: idsRef.current!.sessionId,
      correlationId: idsRef.current!.correlationId,
      data: {
        ...data,
        operatingSystem: detectOperatingSystem(),
        newsletter: Boolean(data.newsletter),
        termsAccepted: Boolean(data.termsAccepted),
      },
      context: contextRef.current,
      pickupCode: pickupCodeRef.current,
      termsOpened: termsOpenedRef.current,
      termsViewMs: termsViewMsRef.current,
      totalDurationMs: telemetry?.totalDurationMs,
      interactionCount: telemetry?.interactionCount,
      events: telemetry?.events,
      fieldStats: telemetry?.stats,
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

  // QR-Code für die Abhol-Bestätigung erzeugen, sobald das Formular abgeschickt ist.
  useEffect(() => {
    if (!isSubmitted) return;
    QRCode.toString(pickupCodeRef.current ?? '', {
      type: 'svg',
      margin: 1,
      width: 200,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then(setQrSvg)
      .catch(() => setQrSvg(null));
  }, [isSubmitted]);

  if (isSubmitted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-8">
        <div className="w-full rounded-3xl bg-white p-8 text-center shadow-soft">
          <img src="/nexplore.svg" alt="Nexplore" className="mx-auto h-8 w-auto" />
          <h1 className="mt-8 text-4xl font-bold text-slate-900">Merci viumau</h1>
          <p className="mt-4 text-slate-600">Deine Angaben sind gespeichert.</p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Zeig das am Stand vor:</p>
            {qrSvg ? (
              <div
                className="mx-auto mt-3 h-44 w-44 [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <div className="mx-auto mt-3 h-44 w-44 animate-pulse rounded-xl bg-slate-200" />
            )}
            <p className="mt-3 font-mono text-sm tracking-wider text-slate-900">
              {pickupCodeRef.current}
            </p>
          </div>

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
                    {field.id === 'termsAccepted' ? (
                      <>
                        Ich akzeptiere die{' '}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            openTerms();
                          }}
                          className="font-medium text-orange-600 underline"
                        >
                          Glace-Nutzungsbedingungen
                        </button>
                      </>
                    ) : (
                      field.label
                    )}
                    {field.required && <span className="text-orange-500"> *</span>}
                  </span>
                </label>
              );
            }

            if (field.type === 'slider') {
              const min = field.min ?? 0;
              const max = field.max ?? 100;
              const hasValue = typeof value === 'string' && value !== '';
              const current = hasValue ? Number(value) : min;
              return (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {field.label}
                    {field.required && <span className="text-orange-500"> *</span>}
                  </label>
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={1}
                      value={current}
                      onChange={(event) => updateField(field.id, event.target.value)}
                      onPointerDown={() => {
                        if (!hasValue) updateField(field.id, String(current));
                      }}
                      onFocus={() => trackerRef.current?.focus(field.id)}
                      onBlur={() => trackerRef.current?.blur(field.id)}
                      className="h-2 w-full accent-orange-500"
                    />
                    <span className="w-20 shrink-0 text-right text-lg font-semibold text-slate-900">
                      {hasValue ? `${current}${field.unit ? ` ${field.unit}` : ''}` : '–'}
                    </span>
                  </div>
                  {!hasValue && (
                    <p className="text-xs text-slate-400">Regler bewegen, um zu wählen ({min}–{max}).</p>
                  )}
                </div>
              );
            }

            const multiSelected = String(value)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);

            const opts = field.options ?? [];
            const longOptionLabel = opts.some((o) => o.length > 16);
            const optionColumns =
              field.columns ?? (field.multiple || longOptionLabel || opts.length > 4 ? 1 : 2);

            return (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {field.label}
                  {field.required && <span className="text-orange-500"> *</span>}
                </label>
                {field.hint && <p className="text-xs text-slate-400">{field.hint}</p>}
                {field.options ? (
                  <div className={`grid gap-2 ${optionColumns === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {field.options.map((option) => {
                      const selected = field.multiple
                        ? multiSelected.includes(option)
                        : value === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          className={`touch-button ${selected ? 'touch-button-selected' : ''}`}
                          onClick={() =>
                            field.multiple
                              ? toggleMulti(field.id, option)
                              : updateField(field.id, option)
                          }
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    value={String(value)}
                    onChange={(event) => updateField(field.id, event.target.value)}
                    onFocus={() => trackerRef.current?.focus(field.id)}
                    onBlur={() => trackerRef.current?.blur(field.id)}
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

      <TermsOverlay open={showTerms} onClose={closeTerms} />
    </main>
  );
}
