import { prisma } from '@/lib/db';
import { formFields } from '@/lib/form-definition';

// Vorname / Firma: erste zwei Buchstaben, Rest als "*".
export function mask(value: string | null | undefined): string {
  const v = (value ?? '').trim();
  if (v.length <= 2) return v;
  return v.slice(0, 2) + '*'.repeat(v.length - 2);
}

export type Bucket = { label: string; count: number };

const tally = (values: (string | null | undefined)[]): Bucket[] => {
  const map = new Map<string, number>();
  for (const raw of values) {
    const v = (raw ?? '').trim() || '—';
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
};

const splitMulti = (values: (string | null | undefined)[]): Bucket[] => {
  const flat: string[] = [];
  for (const raw of values) {
    (raw ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => flat.push(s));
  }
  return tally(flat);
};

const fieldLabel = (id: string) => formFields.find((f) => f.id === id)?.label ?? id;

// Eigene Test-Durchläufe (Entwicklung/QA), nicht Teil der echten Auswertung.
const TEST_FIRST_NAMES = ['phippu'];

export async function getAnalytics() {
  const excluded = TEST_FIRST_NAMES.length
    ? await prisma.submission.findMany({
        where: {
          OR: TEST_FIRST_NAMES.map((name) => ({
            firstName: { equals: name, mode: 'insensitive' as const },
          })),
        },
        select: { id: true },
      })
    : [];
  const excludedIds = excluded.map((e) => e.id);
  const notExcluded = { id: { notIn: excludedIds } };

  const [rows, fieldStats, totalCount] = await Promise.all([
    prisma.submission.findMany({
      where: notExcluded,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        firstName: true,
        company: true,
        role: true,
        favoriteFlavor: true,
        visitReason: true,
        yearsExperience: true,
        appCount: true,
        passwordManager: true,
        privacyReading: true,
        newsletter: true,
        termsAccepted: true,
        termsOpened: true,
        termsViewMs: true,
        totalDurationMs: true,
        operatingSystem: true,
        osName: true,
        browserName: true,
        deviceType: true,
        timezone: true,
        clientLanguages: true,
        pickupCode: true,
        isBot: true,
        ipAddress: true,
      },
    }),
    prisma.fieldStat.groupBy({
      by: ['fieldId'],
      where: { submissionId: { notIn: excludedIds } },
      _avg: { timeToAnswerMs: true, focusMs: true, changeCount: true },
      _max: { timeToAnswerMs: true },
      _count: { fieldId: true },
    }),
    prisma.submission.count({ where: notExcluded }),
  ]);

  const nums = <T,>(arr: T[], pick: (t: T) => number | null | undefined): number[] =>
    arr.map(pick).filter((n): n is number => typeof n === 'number' && Number.isFinite(n));

  const avg = (arr: number[]): number =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const median = (arr: number[]): number => {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
  };

  // Submissions pro Tag
  const perDayMap = new Map<string, number>();
  for (const r of rows) {
    const day = r.createdAt.toISOString().slice(0, 10);
    perDayMap.set(day, (perDayMap.get(day) ?? 0) + 1);
  }
  const perDay = Array.from(perDayMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const experienceYears = nums(rows, (r) => Number(r.yearsExperience));

  const fieldPerformance = fieldStats
    .map((s) => ({
      fieldId: s.fieldId,
      label: fieldLabel(s.fieldId),
      avgTimeToAnswerMs: Math.round(s._avg.timeToAnswerMs ?? 0),
      maxTimeToAnswerMs: s._max.timeToAnswerMs ?? 0,
      avgFocusMs: Math.round(s._avg.focusMs ?? 0),
      avgChangeCount: Math.round((s._avg.changeCount ?? 0) * 100) / 100,
      responses: s._count.fieldId,
    }))
    .sort((a, b) => b.avgTimeToAnswerMs - a.avgTimeToAnswerMs);

  return {
    totalCount,
    botCount: rows.filter((r) => r.isBot).length,
    kpi: {
      avgDurationMs: avg(nums(rows, (r) => r.totalDurationMs)),
      medianDurationMs: median(nums(rows, (r) => r.totalDurationMs)),
      newsletterRate: rows.length ? rows.filter((r) => r.newsletter).length / rows.length : 0,
      termsOpenedRate: rows.length ? rows.filter((r) => r.termsOpened).length / rows.length : 0,
      avgTermsViewMs: avg(nums(rows.filter((r) => r.termsOpened), (r) => r.termsViewMs)),
      privacyYesRate: rows.length ? rows.filter((r) => r.privacyReading).length / rows.length : 0,
      avgExperience: avg(experienceYears),
    },
    perDay,
    byRole: tally(rows.map((r) => r.role)),
    byFlavor: splitMulti(rows.map((r) => r.favoriteFlavor)),
    byVisitReason: tally(rows.map((r) => r.visitReason)),
    byAppCount: tally(rows.map((r) => r.appCount)),
    byPasswordManager: tally(rows.map((r) => r.passwordManager)),
    byOs: tally(rows.map((r) => r.osName || r.operatingSystem)),
    byBrowser: tally(rows.map((r) => r.browserName)),
    byDevice: tally(rows.map((r) => r.deviceType)),
    byTimezone: tally(rows.map((r) => r.timezone)),
    fieldPerformance,
    recent: rows.slice(0, 100).map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      firstName: mask(r.firstName),
      company: mask(r.company),
      role: r.role,
      flavors: r.favoriteFlavor,
      experience: r.yearsExperience,
      durationMs: r.totalDurationMs,
      os: r.osName || r.operatingSystem,
      browser: r.browserName,
      device: r.deviceType,
      timezone: r.timezone,
      newsletter: r.newsletter,
      termsOpened: r.termsOpened,
      termsViewMs: r.termsViewMs,
      pickupCode: r.pickupCode,
      isBot: r.isBot,
    })),
  };
}

export type Analytics = Awaited<ReturnType<typeof getAnalytics>>;
