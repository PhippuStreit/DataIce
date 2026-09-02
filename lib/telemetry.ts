// Client-seitige Telemetrie: Browser-/Gerätekontext + Feld-Interaktions-Tracking.
// Wird von components/GlaceForm.tsx genutzt und im Submit-Payload mitgeschickt.

import { formFields, type FormField } from '@/lib/form-definition';

export type ClientContext = {
  screenWidth?: number;
  screenHeight?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  pixelRatio?: number;
  colorDepth?: number;
  touchCapable?: boolean;
  maxTouchPoints?: number;
  orientation?: string;
  clientLanguages?: string;
  timezone?: string;
  utcOffsetMinutes?: number;
  clientTime?: string;
  referrer?: string;
  entryUrl?: string;
  connectionType?: string;
  connectionDownlink?: number;
  deviceMemoryGb?: number;
  hardwareConcurrency?: number;
  userAgent?: string;
};

export type FieldEvent = {
  sequence: number;
  stepIndex: number | null;
  fieldId: string;
  fieldName: string;
  eventType: 'view' | 'focus' | 'blur' | 'change' | 'select' | 'next' | 'submit';
  interactionType: string;
  at: string;
  value: string | null;
};

export type FieldStat = {
  fieldId: string;
  fieldName: string;
  interactionType: string;
  stepIndex: number | null;
  firstViewedAt: string | null;
  answeredAt: string | null;
  timeToAnswerMs: number;
  focusMs: number;
  changeCount: number;
  focusCount: number;
  finalValue: string | null;
};

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

export function collectClientContext(): ClientContext {
  if (typeof window === 'undefined') return {};
  const nav = window.navigator as Navigator & {
    connection?: { effectiveType?: string; downlink?: number };
    deviceMemory?: number;
  };
  const ctx: ClientContext = {};

  try {
    ctx.screenWidth = num(window.screen?.width);
    ctx.screenHeight = num(window.screen?.height);
    ctx.viewportWidth = num(window.innerWidth);
    ctx.viewportHeight = num(window.innerHeight);
    ctx.pixelRatio = num(window.devicePixelRatio);
    ctx.colorDepth = num(window.screen?.colorDepth);
    ctx.maxTouchPoints = num(nav.maxTouchPoints);
    ctx.touchCapable = (nav.maxTouchPoints ?? 0) > 0 || 'ontouchstart' in window;
    ctx.orientation =
      window.screen?.orientation?.type ??
      (window.matchMedia?.('(orientation: portrait)')?.matches ? 'portrait' : 'landscape');
    ctx.userAgent = nav.userAgent;
    ctx.clientLanguages = Array.isArray(nav.languages) ? nav.languages.join(',') : nav.language;
    ctx.hardwareConcurrency = num(nav.hardwareConcurrency);
    ctx.deviceMemoryGb = num(nav.deviceMemory);
    ctx.connectionType = nav.connection?.effectiveType;
    ctx.connectionDownlink = num(nav.connection?.downlink);
    ctx.referrer = document.referrer || undefined;
    ctx.entryUrl = window.location?.href;

    const now = new Date();
    ctx.clientTime = now.toISOString();
    ctx.utcOffsetMinutes = -now.getTimezoneOffset();
    ctx.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Telemetrie darf das Formular nie brechen.
  }

  return ctx;
}

const fieldName = (fieldId: string): string =>
  formFields.find((f: FormField) => f.id === fieldId)?.label ?? fieldId;

const interactionType = (fieldId: string): string =>
  formFields.find((f: FormField) => f.id === fieldId)?.type ?? 'unknown';

export function createFieldTracker(steps: string[][]) {
  const events: FieldEvent[] = [];
  const startedAt = Date.now();
  let seq = 0;

  const stepOf = (fieldId: string): number | null => {
    const i = steps.findIndex((group) => group.includes(fieldId));
    return i === -1 ? null : i;
  };

  const push = (fieldId: string, eventType: FieldEvent['eventType'], value: string | null) => {
    events.push({
      sequence: seq++,
      stepIndex: stepOf(fieldId),
      fieldId,
      fieldName: fieldName(fieldId),
      eventType,
      interactionType: interactionType(fieldId),
      at: new Date().toISOString(),
      value,
    });
  };

  return {
    view(fieldIds: string[]) {
      fieldIds.forEach((id) => push(id, 'view', null));
    },
    focus(fieldId: string) {
      push(fieldId, 'focus', null);
    },
    blur(fieldId: string) {
      push(fieldId, 'blur', null);
    },
    change(fieldId: string, value: string | boolean) {
      const type = interactionType(fieldId);
      push(fieldId, type === 'select' ? 'select' : 'change', String(value));
    },
    step(stepIndex: number) {
      events.push({
        sequence: seq++,
        stepIndex,
        fieldId: '__step__',
        fieldName: `Schritt ${stepIndex + 1}`,
        eventType: 'next',
        interactionType: 'navigation',
        at: new Date().toISOString(),
        value: String(stepIndex),
      });
    },
    submit() {
      events.push({
        sequence: seq++,
        stepIndex: null,
        fieldId: '__submit__',
        fieldName: 'Absenden',
        eventType: 'submit',
        interactionType: 'navigation',
        at: new Date().toISOString(),
        value: null,
      });
    },
    build(finalData: Record<string, string | boolean>) {
      const stats = buildStats(events, finalData);
      return {
        totalDurationMs: Date.now() - startedAt,
        interactionCount: events.length,
        events,
        stats,
      };
    },
  };
}

export type FieldTracker = ReturnType<typeof createFieldTracker>;

function buildStats(
  events: FieldEvent[],
  finalData: Record<string, string | boolean>,
): FieldStat[] {
  const byField = new Map<string, FieldEvent[]>();
  events
    .filter((ev) => !ev.fieldId.startsWith('__'))
    .forEach((ev) => {
      const list = byField.get(ev.fieldId) ?? [];
      list.push(ev);
      byField.set(ev.fieldId, list);
    });

  const stats: FieldStat[] = [];
  Array.from(byField.entries()).forEach(([fieldId, list]) => {
    const firstView = list.find((e) => e.eventType === 'view')?.at ?? null;
    const changes = list.filter((e) => e.eventType === 'change' || e.eventType === 'select');
    const answeredAt = changes.length ? changes[changes.length - 1].at : null;
    const focusEvents = list.filter((e) => e.eventType === 'focus');

    let focusMs = 0;
    let openFocus: number | null = null;
    list.forEach((e) => {
      if (e.eventType === 'focus') openFocus = new Date(e.at).getTime();
      if (e.eventType === 'blur' && openFocus != null) {
        focusMs += new Date(e.at).getTime() - openFocus;
        openFocus = null;
      }
    });

    const timeToAnswerMs =
      firstView && answeredAt
        ? Math.max(0, new Date(answeredAt).getTime() - new Date(firstView).getTime())
        : 0;

    stats.push({
      fieldId,
      fieldName: list[0].fieldName,
      interactionType: list[0].interactionType,
      stepIndex: list[0].stepIndex,
      firstViewedAt: firstView,
      answeredAt,
      timeToAnswerMs,
      focusMs,
      changeCount: changes.length,
      focusCount: focusEvents.length,
      finalValue: fieldId in finalData ? String(finalData[fieldId]) : null,
    });
  });

  return stats;
}
