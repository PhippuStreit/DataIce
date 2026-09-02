import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Hits the DB on every call – never prerender at build time.
export const dynamic = 'force-dynamic';

export async function GET() {
  const [statRows, submissionCount] = await Promise.all([
    prisma.fieldStat.groupBy({
      by: ['fieldId', 'fieldName'],
      _avg: { timeToAnswerMs: true, focusMs: true, changeCount: true },
      _max: { timeToAnswerMs: true },
      _count: { fieldId: true },
    }),
    prisma.submission.count(),
  ]);

  const fieldMetrics = statRows.map((row) => ({
    fieldId: row.fieldId,
    fieldName: row.fieldName,
    avgTimeToAnswerMs: Math.round(row._avg.timeToAnswerMs ?? 0),
    maxTimeToAnswerMs: row._max.timeToAnswerMs ?? 0,
    avgFocusMs: Math.round(row._avg.focusMs ?? 0),
    avgChangeCount: Math.round((row._avg.changeCount ?? 0) * 100) / 100,
    responses: row._count.fieldId,
  }));

  return NextResponse.json({ submissionCount, fieldMetrics });
}
