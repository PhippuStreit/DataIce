#!/bin/bash
# ACHTUNG: Löscht ALLE Einträge in Submission, FieldStat, FieldInteraction, Session.
# Nicht umkehrbar.
#
# Nutzung (auf dem Server, im Repo-Verzeichnis):
#   ./scripts/wipe-data.sh              # fragt nach + macht vorher ein CSV-Backup
#   ./scripts/wipe-data.sh --yes        # ohne Rückfrage (Backup trotzdem)
#   ./scripts/wipe-data.sh --no-backup  # ohne Backup
#
# Struktur (Tabellen, Schema) bleibt. Nur Zeilen werden entfernt.

set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-dataice-db}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-dataice}"

FORCE=0
BACKUP=1
for arg in "$@"; do
  case "$arg" in
    --yes|-y)     FORCE=1 ;;
    --no-backup)  BACKUP=0 ;;
    -h|--help)    sed -n '2,13p' "$0"; exit 0 ;;
    *) echo "Unbekanntes Argument: $arg" >&2; exit 1 ;;
  esac
done

run_sql() { docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" "$@"; }

counts() {
  run_sql -q <<'SQL'
SELECT 'Submission'       AS tabelle, count(*) AS zeilen FROM "Submission"
UNION ALL SELECT 'FieldStat',        count(*) FROM "FieldStat"
UNION ALL SELECT 'FieldInteraction', count(*) FROM "FieldInteraction"
UNION ALL SELECT 'Session',          count(*) FROM "Session"
ORDER BY tabelle;
SQL
}

echo "Aktueller Stand:"
counts

if [ "$FORCE" -ne 1 ]; then
  echo
  read -r -p 'ALLE diese Zeilen unwiderruflich loeschen? Tippe LOESCHEN: ' answer
  if [ "$answer" != "LOESCHEN" ]; then
    echo "Abgebrochen."
    exit 1
  fi
fi

if [ "$BACKUP" -eq 1 ]; then
  echo "-> Backup vor dem Loeschen ..."
  if ! "$(dirname "$0")/export-data.sh"; then
    echo "Backup fehlgeschlagen. Abbruch (mit --no-backup ueberspringen)." >&2
    exit 1
  fi
fi

echo "-> Loesche ..."
run_sql -q <<'SQL'
TRUNCATE TABLE "Submission", "Session" RESTART IDENTITY CASCADE;
SQL

echo "Fertig. Neuer Stand:"
counts
