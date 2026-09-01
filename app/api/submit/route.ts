import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { submissionSchema } from '@/lib/validation';

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

    const { sessionId, correlationId, data } = parsed.data;

    const submission = await prisma.submission.create({
      data: {
        sessionId,
        correlationId,
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
        iceName: data.iceName,
        newsletter: Boolean(data.newsletter),
        termsAccepted: Boolean(data.termsAccepted),
      },
    });

    if (Array.isArray(body.interactions) && body.interactions.length > 0) {
      await prisma.fieldInteraction.createMany({
        data: body.interactions.map((interaction: any) => ({
          submissionId: submission.id,
          fieldId: interaction.fieldId,
          fieldName: interaction.fieldName,
          interactionType: interaction.interactionType,
          startedAt: interaction.startedAt ? new Date(interaction.startedAt) : new Date(),
          endedAt: interaction.endedAt ? new Date(interaction.endedAt) : new Date(),
          durationMs: Number(interaction.durationMs ?? 0),
          value: interaction.value ?? null,
        })),
      });
    }

    logger.info('submission.created', {
      submissionId: submission.id,
      correlationId,
      sessionId,
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
