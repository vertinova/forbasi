#!/bin/bash
# =============================================================================
# upload-all-production.sh
# Upload file dari uploadsproduction/ ke VPS — hanya file yang belum ada
# Uses tar+ssh for efficiency (only 3 password prompts total)
#
# Jalankan dari Git Bash:
#   cd /c/laragon/www/forbasi/forbasi-app
#   bash deploy/upload-all-production.sh
# =============================================================================

set -euo pipefail

VPS="root@72.61.140.193"
LOCAL_DIR="uploadsproduction"
REMOTE_DIR="/var/www/forbasi-pb-backend/uploads"

if [ ! -d "$LOCAL_DIR" ]; then
  echo "ERROR: Folder $LOCAL_DIR tidak ditemukan!"
  exit 1
fi

FOLDERS=(
  "barcodes"
  "lisensi"
  "pb_kta_configs"
  "pb_to_pengda_payment_proofs"
  "pengcab_kta_configs"
  "pengcab_payment_proofs"
  "pengda_kta_configs"
  "pengda_payment_proofs"
  "qrcodes"
  "kta_files"
  "generated_kta"
  "generated_kta_pb"
  "generated_kta_pengda"
)

echo "============================================"
echo " FORBASI Upload Production Files to VPS"
echo " Target: $VPS:$REMOTE_DIR"
echo " Mode: Only upload files that don't exist"
echo "============================================"
echo ""

# Step 1: Get existing files from VPS
echo "==> [Password 1/3] Fetching existing file list from VPS..."
REMOTE_FILES=$(ssh "$VPS" "find $REMOTE_DIR -type f -printf '%P\n' 2>/dev/null || true")
REMOTE_COUNT=$(echo "$REMOTE_FILES" | grep -c '[^ ]' || true)
echo "   Found $REMOTE_COUNT files on VPS"
echo ""

# Step 2: Build list of missing files
echo "==> Scanning local folders for missing files..."
MISSING_LIST=""
TOTAL_LOCAL=0
TOTAL_MISSING=0

for folder in "${FOLDERS[@]}"; do
  if [ ! -d "$LOCAL_DIR/$folder" ]; then
    continue
  fi

  folder_local=0
  folder_missing=0

  while IFS= read -r local_file; do
    [ -z "$local_file" ] && continue
    rel_path="${local_file#$LOCAL_DIR/}"
    folder_local=$((folder_local + 1))

    if ! echo "$REMOTE_FILES" | grep -qxF "$rel_path"; then
      MISSING_LIST="${MISSING_LIST}${rel_path}"$'\n'
      folder_missing=$((folder_missing + 1))
    fi
  done < <(find "$LOCAL_DIR/$folder" -type f 2>/dev/null)

  TOTAL_LOCAL=$((TOTAL_LOCAL + folder_local))
  TOTAL_MISSING=$((TOTAL_MISSING + folder_missing))

  if [ "$folder_missing" -gt 0 ]; then
    echo "   $folder: $folder_missing new / $folder_local total"
  else
    echo "   $folder: OK ($folder_local already on VPS) ✓"
  fi
done

echo ""
echo "   TOTAL: $TOTAL_MISSING files to upload (out of $TOTAL_LOCAL local)"
echo ""

if [ "$TOTAL_MISSING" -eq 0 ]; then
  echo "============================================"
  echo " Nothing to upload — VPS is up to date! ✓"
  echo "============================================"
  exit 0
fi

# Step 3: Create tar of missing files and upload via pipe
echo "==> [Password 2/3] Uploading $TOTAL_MISSING files via tar stream..."
echo "$MISSING_LIST" | grep -v '^$' | tar -cf - -C "$LOCAL_DIR" -T - | \
  ssh "$VPS" "cd $REMOTE_DIR && tar -xf - --no-same-owner"

echo ""
echo "==> [Password 3/3] Verifying upload..."
AFTER_COUNT=$(ssh "$VPS" "find $REMOTE_DIR -type f | wc -l")

echo ""
echo "============================================"
echo " Upload selesai!"
echo " Uploaded: $TOTAL_MISSING new files"
echo " VPS now has: $AFTER_COUNT files total"
echo "============================================"
