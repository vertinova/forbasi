#!/bin/bash
UDIR="/var/www/forbasi-pb-backend/uploads"
for d in kta_files lisensi pb_kta_configs pengcab_kta_configs pengcab_payment_proofs pengda_kta_configs pengda_payment_proofs qrcodes barcodes; do
  COUNT=$(find "$UDIR/$d" -type f 2>/dev/null | wc -l)
  SIZE=$(du -sh "$UDIR/$d" 2>/dev/null | cut -f1)
  echo "$d: $COUNT files ($SIZE)"
done
