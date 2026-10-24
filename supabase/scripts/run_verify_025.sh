#!/usr/bin/env bash
set -euo pipefail

# Split verify script at the migration marker and inject 025.sql between halves.
csplit -f /tmp/v025_ -b '%02d.sql' /tmp/verify_025.sql '/Migration 025 is applied by the runner/' '{*}'
# csplit keeps the matched line in the second file; strip marker from part 01 and keep rest from first TRUNCATE
{
  cat /tmp/v025_00.sql
  cat /tmp/025.sql
  # skip marker line then emit remainder
  tail -n +2 /tmp/v025_01.sql
} > /tmp/run.sql

psql -U postgres -v ON_ERROR_STOP=1 -f /tmp/run.sql
