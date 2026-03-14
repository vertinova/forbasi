#!/bin/bash
# Sync uploads folder to VPS
# Run: bash deploy/sync-uploads.sh

VPS_HOST="72.61.140.193"
VPS_USER="root"
VPS_PATH="/var/www/forbasi-pb-backend/uploads"
LOCAL_PATH="backend/uploads"

echo "=== FORBASI Uploads Sync Script ==="
echo ""

# Check if local uploads folder exists
if [ ! -d "$LOCAL_PATH" ]; then
    echo "ERROR: Local uploads folder not found at $LOCAL_PATH"
    exit 1
fi

echo "Local uploads folder: $LOCAL_PATH"
echo "VPS destination: ${VPS_USER}@${VPS_HOST}:${VPS_PATH}"
echo ""

# Create directory on VPS
echo "Creating directory structure on VPS..."
ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${VPS_PATH}"

# Sync using rsync (preferred - preserves permissions, efficient delta sync)
if command -v rsync &> /dev/null; then
    echo "Using rsync for efficient sync..."
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude 'prisma' \
        "${LOCAL_PATH}/" "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/"
else
    echo "rsync not found, using scp..."
    # Sync specific important folders
    FOLDERS=(
        "config"
        "pb_kta_configs"
        "pengda_kta_configs"
        "pengcab_kta_configs"
        "barcodes"
        "qrcodes"
        "generated_kta"
        "generated_kta_pb"
        "generated_kta_pengda"
        "kta_files"
        "landing"
        "lisensi"
    )
    
    for folder in "${FOLDERS[@]}"; do
        if [ -d "${LOCAL_PATH}/${folder}" ]; then
            echo "Syncing ${folder}..."
            ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${VPS_PATH}/${folder}"
            scp -r "${LOCAL_PATH}/${folder}/"* "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/${folder}/" 2>/dev/null || true
        fi
    done
fi

echo ""
echo "=== Sync Complete ==="
echo ""
echo "Verifying on VPS..."
ssh ${VPS_USER}@${VPS_HOST} "ls -la ${VPS_PATH}/"

echo ""
echo "Files in config folder:"
ssh ${VPS_USER}@${VPS_HOST} "ls -la ${VPS_PATH}/config/"

echo ""
echo "Restart backend service:"
echo "  ssh ${VPS_USER}@${VPS_HOST} 'pm2 restart forbasi-pb-backend'"
