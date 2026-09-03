import React from 'react';
import { getAnalytics, type Bucket } from '@/lib/analytics';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Auswertung – Deine Gratis-Glace' };

const fmtMs = (ms: number): string =>
  ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`;
const pct = (x: number): string => `${Math.round(x * 100)} %`;
const fmtDate = (d: Date): string =>
  new Intl.DateTimeFormat('de-CH', { dateStyle: 'short', timeStyle: 'short' }).format(d);

function Bars({ items, unit = '' }: { items: Bucket[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.length === 0) return <p className="text-sm text-slate-400">Noch keine Daten.</p>;
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label} className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3 text-sm">
          <span className="truncate text-slate-600" title={i.label}>
            {i.label}
          </span>
          <span className="h-5 rounded bg-slate-100">
            <span
              className="block h-5 rounded bg-orange-400"
              style={{ width: `${(i.count / max) * 100}%` }}
            />
          </span>
          <span className="text-right font-medium text-slate-800">
            {i.count}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default async function AuswertungPage() {
  const a = await getAnalytics();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Nexplore</p>
          <h1 className="text-3xl font-bold text-slate-900">Auswertung</h1>
        </div>
        <p className="text-sm text-slate-500">
          {a.totalCount} Einträge{a.botCount > 0 ? ` · ${a.botCount} als Bot erkannt` : ''}
        </p>
      </header>

      {process.env.ANALYTICS_PASSWORD ? null : (
        <p className="mb-6 rounded-xl bg-amber-100 px-4 py-2 text-sm text-amber-800">
          Diese Seite ist ungeschützt. Setze <code>ANALYTICS_PASSWORD</code> (und optional{' '}
          <code>ANALYTICS_USER</code>) in <code>.env.prod</code>, um sie mit Basic-Auth zu sperren.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Kpi label="Einträge" value={String(a.totalCount)} />
        <Kpi
          label="Ø Ausfülldauer"
          value={fmtMs(a.kpi.avgDurationMs)}
          sub={`Median ${fmtMs(a.kpi.medianDurationMs)}`}
        />
        <Kpi label="Newsletter" value={pct(a.kpi.newsletterRate)} sub="angehakt" />
        <Kpi
          label="Bedingungen geöffnet"
          value={pct(a.kpi.termsOpenedRate)}
          sub={a.kpi.avgTermsViewMs ? `Ø ${fmtMs(a.kpi.avgTermsViewMs)} gelesen` : undefined}
        />
        <Kpi label="Datenschutz „Ja“" value={pct(a.kpi.privacyYesRate)} />
        <Kpi label="Ø Erfahrung" value={`${a.kpi.avgExperience} J.`} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card title="Einträge pro Tag">
          <Bars items={a.perDay.map((d) => ({ label: d.label, count: d.count }))} />
        </Card>
        <Card title="Rolle">
          <Bars items={a.byRole} />
        </Card>
        <Card title="Lieblings-Glace (Mehrfach)">
          <Bars items={a.byFlavor} />
        </Card>
        <Card title="Warum hier?">
          <Bars items={a.byVisitReason} />
        </Card>
        <Card title="Betriebssystem">
          <Bars items={a.byOs} />
        </Card>
        <Card title="Browser">
          <Bars items={a.byBrowser} />
        </Card>
        <Card title="Gerätetyp">
          <Bars items={a.byDevice} />
        </Card>
        <Card title="Zeitzone">
          <Bars items={a.byTimezone} />
        </Card>
        <Card title="Apps auf dem Handy">
          <Bars items={a.byAppCount} />
        </Card>
        <Card title="Passwortmanager">
          <Bars items={a.byPasswordManager} />
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Feld-Performance (Ø Zeit bis Antwort)">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-2 pr-4">Feld</th>
                  <th className="py-2 pr-4 text-right">Ø bis Antwort</th>
                  <th className="py-2 pr-4 text-right">Max</th>
                  <th className="py-2 pr-4 text-right">Ø Fokuszeit</th>
                  <th className="py-2 pr-4 text-right">Ø Änderungen</th>
                  <th className="py-2 text-right">n</th>
                </tr>
              </thead>
              <tbody>
                {a.fieldPerformance.map((f) => (
                  <tr key={f.fieldId} className="border-t border-slate-100">
                    <td className="py-2 pr-4 text-slate-700">{f.label}</td>
                    <td className="py-2 pr-4 text-right font-medium">{fmtMs(f.avgTimeToAnswerMs)}</td>
                    <td className="py-2 pr-4 text-right text-slate-500">{fmtMs(f.maxTimeToAnswerMs)}</td>
                    <td className="py-2 pr-4 text-right text-slate-500">{fmtMs(f.avgFocusMs)}</td>
                    <td className="py-2 pr-4 text-right text-slate-500">{f.avgChangeCount}</td>
                    <td className="py-2 text-right text-slate-400">{f.responses}</td>
                  </tr>
                ))}
                {a.fieldPerformance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-3 text-slate-400">
                      Noch keine Feld-Telemetrie.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Letzte Einträge (Vorname & Firma maskiert)">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-2 pr-4">Zeit</th>
                  <th className="py-2 pr-4">Vorname</th>
                  <th className="py-2 pr-4">Firma</th>
                  <th className="py-2 pr-4">Rolle</th>
                  <th className="py-2 pr-4">Glace</th>
                  <th className="py-2 pr-4">Erf.</th>
                  <th className="py-2 pr-4">Dauer</th>
                  <th className="py-2 pr-4">Gerät</th>
                  <th className="py-2 pr-4">NL</th>
                  <th className="py-2 pr-4">AGB</th>
                  <th className="py-2">Code</th>
                </tr>
              </thead>
              <tbody>
                {a.recent.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 align-top">
                    <td className="whitespace-nowrap py-2 pr-4 text-slate-500">{fmtDate(r.createdAt)}</td>
                    <td className="py-2 pr-4 font-mono">{r.firstName}</td>
                    <td className="py-2 pr-4 font-mono">{r.company}</td>
                    <td className="py-2 pr-4 text-slate-600">{r.role}</td>
                    <td className="py-2 pr-4 text-slate-600">{r.flavors}</td>
                    <td className="py-2 pr-4 text-slate-600">{r.experience}</td>
                    <td className="whitespace-nowrap py-2 pr-4 text-slate-600">
                      {typeof r.durationMs === 'number' ? fmtMs(r.durationMs) : '—'}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      {[r.os, r.browser].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="py-2 pr-4">{r.newsletter ? '✓' : '–'}</td>
                    <td className="py-2 pr-4">
                      {r.termsOpened
                        ? `✓${typeof r.termsViewMs === 'number' ? ` ${fmtMs(r.termsViewMs)}` : ''}`
                        : '–'}
                    </td>
                    <td className="whitespace-nowrap py-2 font-mono text-xs text-slate-500">
                      {r.pickupCode ?? '—'}
                      {r.isBot ? ' 🤖' : ''}
                    </td>
                  </tr>
                ))}
                {a.recent.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-3 text-slate-400">
                      Noch keine Einträge.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
