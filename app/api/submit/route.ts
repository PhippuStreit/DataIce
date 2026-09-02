import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { submissionSchema } from '@/lib/validation';
import { readServerContext } from '@/lib/server-context';

const toDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const int = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;

const float = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submissionSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn('submit.validation_failed', {
        error: parsed.error.issues.map((issue) => issue.message),
        fields: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      });

      return NextResponse.json(
        {
          status: 400,
          error: 'validation_failed',
          message: 'Bitte prüfe deine Eingaben und fülle alle Pflichtfelder aus.',
          details: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
        },
        { status: 400 },
      );
    }

    const { sessionId, correlationId, data, context, events, fieldStats, totalDurationMs, interactionCount } =
      parsed.data;
    const server = readServerContext(request);
    const ctx = context ?? {};

    const submission = await prisma.submission.create({
      data: {
        sessionId,
        correlationId,
        completedAt: new Date(),

        firstName: data.firstName,
        company: data.company,
        role: data.role,
        yearsExperience: data.yearsExperience,
        postalCode: data.postalCode,
        favoriteFlavor: data.favoriteFlavor,
        visitReason: data.visitReason,
        operatingSystem: data.operatingSystem,
        appCount: data.appCount,
        passwordManager: data.passwordManager,
        privacyReading: data.privacyReading === 'Ja',
        phoneNumber: data.phoneNumber,
        newsletter: Boolean(data.newsletter),
        termsAccepted: Boolean(data.termsAccepted),

        // Server-seitig
        ipAddress: server.ipAddress,
        forwardedFor: server.forwardedFor,
        userAgent: server.userAgent ?? ctx.userAgent ?? null,
        acceptLanguage: server.acceptLanguage,
        browserName: server.browserName,
        browserVersion: server.browserVersion,
        engineName: server.engineName,
        osName: server.osName,
        osVersion: server.osVersion,
        deviceType: server.deviceType,
        deviceVendor: server.deviceVendor,
        deviceModel: server.deviceModel,
        isBot: server.isBot,

        // Client-seitig: Gerät & Anzeige
        screenWidth: int(ctx.screenWidth),
        screenHeight: int(ctx.screenHeight),
        viewportWidth: int(ctx.viewportWidth),
        viewportHeight: int(ctx.viewportHeight),
        pixelRatio: float(ctx.pixelRatio),
        colorDepth: int(ctx.colorDepth),
        touchCapable: typeof ctx.touchCapable === 'boolean' ? ctx.touchCapable : null,
        maxTouchPoints: int(ctx.maxTouchPoints),
        orientation: ctx.orientation ?? null,

        // Sprache & Zeit
        clientLanguages: ctx.clientLanguages ?? null,
        timezone: ctx.timezone ?? null,
        utcOffsetMinutes: int(ctx.utcOffsetMinutes),
        clientTime: toDate(ctx.clientTime),

        // Herkunft & Netz
        referrer: ctx.referrer ?? null,
        entryUrl: ctx.entryUrl ?? null,
        connectionType: ctx.connectionType ?? null,
        connectionDownlink: float(ctx.connectionDownlink),
        deviceMemoryGb: float(ctx.deviceMemoryGb),
        hardwareConcurrency: int(ctx.hardwareConcurrency),

        // Aggregate
        totalDurationMs: int(totalDurationMs),
        interactionCount: int(interactionCount) ?? 0,
      },
    });

    // Telemetrie: darf das Speichern nicht gefährden.
    try {
      const eventRows = (events ?? []).map((ev, index) => ({
        submissionId: submission.id,
        sequence: int(ev.sequence) ?? index,
        stepIndex: int(ev.stepIndex),
        fieldId: ev.fieldId,
        fieldName: ev.fieldName ?? ev.fieldId,
        eventType: ev.eventType,
        interactionType: ev.interactionType ?? 'unknown',
        startedAt: toDate(ev.at),
        endedAt: toDate(ev.at),
        durationMs: 0,
        value: ev.value ?? null,
      }));

      // Legacy-interactions weiterhin übernehmen
      const legacyRows = (body.interactions ?? []).map((i: any, index: number) => ({
        submissionId: submission.id,
        sequence: 10000 + index,
        stepIndex: null,
        fieldId: i.fieldId,
        fieldName: i.fieldName ?? i.fieldId,
        eventType: 'change',
        interactionType: i.interactionType ?? 'unknown',
        startedAt: toDate(i.startedAt) ?? new Date(),
        endedAt: toDate(i.endedAt) ?? new Date(),
        durationMs: Number(i.durationMs ?? 0),
        value: i.value ?? null,
      }));

      const allRows = [...eventRows, ...legacyRows];
      if (allRows.length > 0) {
        await prisma.fieldInteraction.createMany({ data: allRows });
      }

      if ((fieldStats ?? []).length > 0) {
        await prisma.$transaction(
          fieldStats!.map((s) =>
            prisma.fieldStat.upsert({
              where: { submissionId_fieldId: { submissionId: submission.id, fieldId: s.fieldId } },
              create: {
                submissionId: submission.id,
                fieldId: s.fieldId,
                fieldName: s.fieldName ?? s.fieldId,
                interactionType: s.interactionType ?? 'unknown',
                stepIndex: int(s.stepIndex),
                firstViewedAt: toDate(s.firstViewedAt),
                answeredAt: toDate(s.answeredAt),
                timeToAnswerMs: int(s.timeToAnswerMs) ?? 0,
                focusMs: int(s.focusMs) ?? 0,
                changeCount: int(s.changeCount) ?? 0,
                focusCount: int(s.focusCount) ?? 0,
                finalValue: s.finalValue ?? null,
              },
              update: {
                timeToAnswerMs: int(s.timeToAnswerMs) ?? 0,
                focusMs: int(s.focusMs) ?? 0,
                changeCount: int(s.changeCount) ?? 0,
                focusCount: int(s.focusCount) ?? 0,
                finalValue: s.finalValue ?? null,
              },
            }),
          ),
        );
      }

      await prisma.session.upsert({
        where: { sessionId },
        create: {
          sessionId,
          correlationId,
          ipAddress: server.ipAddress,
          userAgent: server.userAgent ?? ctx.userAgent ?? null,
          browserName: server.browserName,
          osName: server.osName,
          platform: server.deviceType,
          screenSize:
            ctx.screenWidth && ctx.screenHeight ? `${ctx.screenWidth}x${ctx.screenHeight}` : null,
          viewportSize:
            ctx.viewportWidth && ctx.viewportHeight
              ? `${ctx.viewportWidth}x${ctx.viewportHeight}`
              : null,
          timezone: ctx.timezone ?? null,
          languages: ctx.clientLanguages ?? null,
          referrer: ctx.referrer ?? null,
          entryUrl: ctx.entryUrl ?? null,
          interactionCount: int(interactionCount) ?? 0,
          submittedCount: 1,
          lastActivityAt: new Date(),
        },
        update: {
          interactionCount: int(interactionCount) ?? 0,
          submittedCount: { increment: 1 },
          lastActivityAt: new Date(),
        },
      });
    } catch (telemetryError) {
      logger.warn('submission.telemetry_failed', {
        submissionId: submission.id,
        error: telemetryError instanceof Error ? telemetryError.message : 'Unknown error',
      });
    }

    logger.info('submission.created', {
      submissionId: submission.id,
      correlationId,
      sessionId,
      ip: server.ipAddress,
      browser: server.browserName,
      os: server.osName,
    });

    return NextResponse.json({
      ok: true,
      submissionId: submission.id,
      message: 'Dein Formular wurde gespeichert.',
    });
  } catch (error) {
    logger.error('submission.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        status: 500,
        error: 'internal_error',
        message: 'Die Speicherung war leider nicht möglich. Bitte versuche es erneut.',
      },
      { status: 500 },
    );
  }
}
