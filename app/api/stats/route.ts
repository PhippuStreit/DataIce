import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Hits the DB on every call – never prerender at build time.
export const dynamic = 'force-dynamic';

export async function GET() {
  const interactionRows = await prisma.fieldInteraction.groupBy({
    by: ['fieldId'],
    _avg: {
      durationMs: true,
    },
    _count: {
      fieldId: true,
    },
  });

  const fieldMetrics = interactionRows.map((row) => ({
    fieldId: row.fieldId,
    avgDurationMs: Math.round(row._avg.durationMs ?? 0),
    completionRate: 1,
    count: row._count.fieldId,
  }));

  return NextResponse.json({ fieldMetrics });
}
