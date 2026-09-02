#!/bin/bash
# CSV-Export aller Formulardaten aus der laufenden Postgres-Instanz.
# Nutzung (auf dem Server, im Repo-Verzeichnis):
#   ./scripts/export-data.sh
# Ergebnis: ./exports/<timestamp>/*.csv  +  ein tar.gz daneben.

set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-dataice-db}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-dataice}"

TS="$(date +%Y%m%d_%H%M%S)"
OUT="exports/${TS}"
mkdir -p "$OUT"

dump() { # <name> <sql>
  echo "  -> $1.csv"
  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
    -c "\copy ($2) TO STDOUT WITH CSV HEADER" > "${OUT}/$1.csv"
}

echo "Export nach ${OUT}/"

dump submissions        'SELECT * FROM "Submission" ORDER BY "createdAt"'
dump field_stats        'SELECT * FROM "FieldStat" ORDER BY "submissionId","stepIndex"'
dump field_interactions 'SELECT * FROM "FieldInteraction" ORDER BY "submissionId","sequence"'
dump sessions           'SELECT * FROM "Session" ORDER BY "createdAt"'

# Eine breite Zeile pro Submission inkl. Feld-Zeiten (pivotiert)
dump submissions_wide '
  SELECT s.*,
         fs_stats.stats AS field_timings_json
  FROM "Submission" s
  LEFT JOIN (
    SELECT "submissionId",
           json_object_agg("fieldId",
             json_build_object(
               ''timeToAnswerMs'', "timeToAnswerMs",
               ''focusMs'', "focusMs",
               ''changeCount'', "changeCount",
               ''finalValue'', "finalValue"
             )) AS stats
    FROM "FieldStat" GROUP BY "submissionId"
  ) fs_stats ON fs_stats."submissionId" = s.id
  ORDER BY s."createdAt"'

tar -czf "exports/dataice_export_${TS}.tar.gz" -C exports "${TS}"
echo
echo "Fertig: exports/dataice_export_${TS}.tar.gz"
echo "Vom Mac holen:"
echo "  scp appuser@88.198.172.8:'~/DataIce/exports/dataice_export_${TS}.tar.gz' ~/Downloads/"
