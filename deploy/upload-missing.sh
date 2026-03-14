#!/bin/bash
# Upload missing files to VPS using tar (efficient single transfer)
# Run from: C:\laragon\www\forbasi\forbasi-app\uploadsproduction

UDIR="/var/www/forbasi-pb-backend/uploads"
VPS="root@72.61.140.193"

echo "==> Getting file list from VPS..."
REMOTE_KTA=$(ssh $VPS "find $UDIR/kta_files -type f -printf '%f\n' 2>/dev/null")

echo "==> Finding missing kta_files..."
MISSING_KTA=""
COUNT=0
for f in kta_files/*; do
  fname=$(basename "$f")
  if ! echo "$REMOTE_KTA" | grep -qxF "$fname"; then
    MISSING_KTA="$MISSING_KTA $f"
    COUNT=$((COUNT+1))
  fi
done
echo "   Found $COUNT missing kta_files"

if [ $COUNT -gt 0 ]; then
  echo "==> Creating tar of missing kta_files..."
  echo "$MISSING_KTA" | tr ' ' '\n' | grep -v '^$' | tar cf /tmp/missing_kta_files.tar -T -
  SIZE=$(du -h /tmp/missing_kta_files.tar | cut -f1)
  echo "   Archive: $SIZE"
  echo "==> Uploading and extracting on VPS..."
  cat /tmp/missing_kta_files.tar | ssh $VPS "cd $UDIR && tar xf -"
  echo "   Done: kta_files"
  rm /tmp/missing_kta_files.tar
fi

echo ""
echo "==> Collecting 2026 generated KTA files..."
GENERATED_2026=""
G_COUNT=0
for d in generated_kta generated_kta_pb generated_kta_pengda; do
  for f in $d/*; do
    [ -f "$f" ] || continue
    mtime=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null)
    # 2026-01-01 = 1735689600
    if [ "$mtime" -ge 1735689600 ]; then
      GENERATED_2026="$GENERATED_2026 $f"
      G_COUNT=$((G_COUNT+1))
    fi
  done
done
echo "   Found $G_COUNT files from 2026"

if [ $G_COUNT -gt 0 ]; then
  echo "==> Creating tar of 2026 generated KTA..."
  echo "$GENERATED_2026" | tr ' ' '\n' | grep -v '^$' | tar cf /tmp/generated_2026.tar -T -
  SIZE=$(du -h /tmp/generated_2026.tar | cut -f1)
  echo "   Archive: $SIZE"
  echo "==> Uploading and extracting on VPS..."
  cat /tmp/generated_2026.tar | ssh $VPS "cd $UDIR && tar xf -"
  echo "   Done: generated KTA 2026"
  rm /tmp/generated_2026.tar
fi

echo ""
echo "=== Upload complete ==="
