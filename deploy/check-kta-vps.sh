#!/bin/bash
for d in generated_kta generated_kta_pb generated_kta_pengda; do
  DIR="/var/www/forbasi-pb-backend/uploads/$d"
  TOTAL=$(find "$DIR" -type f 2>/dev/null | wc -l)
  Y2025=$(find "$DIR" -type f ! -newermt '2026-01-01' 2>/dev/null | wc -l)
  Y2026=$(find "$DIR" -type f -newermt '2026-01-01' 2>/dev/null | wc -l)
  S2025=$(find "$DIR" -type f ! -newermt '2026-01-01' -exec du -cb {} + 2>/dev/null | tail -1 | awk '{printf "%.1f MB", $1/1048576}')
  S2026=$(find "$DIR" -type f -newermt '2026-01-01' -exec du -cb {} + 2>/dev/null | tail -1 | awk '{printf "%.1f MB", $1/1048576}')
  echo "$d => 2025: $Y2025 files ($S2025) | 2026: $Y2026 files ($S2026) | total: $TOTAL"
done
