# Sync uploads folder to VPS
# Run this script from the project root directory

$VPS_HOST = "72.61.140.193"
$VPS_USER = "root"
$VPS_PATH = "/var/www/forbasi-pb-backend/uploads"
$LOCAL_PATH = "backend/uploads"

Write-Host "=== FORBASI Uploads Sync Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if local uploads folder exists
if (-not (Test-Path $LOCAL_PATH)) {
    Write-Host "ERROR: Local uploads folder not found at $LOCAL_PATH" -ForegroundColor Red
    exit 1
}

Write-Host "Local uploads folder: $LOCAL_PATH" -ForegroundColor Green
Write-Host "VPS destination: ${VPS_USER}@${VPS_HOST}:${VPS_PATH}" -ForegroundColor Green
Write-Host ""

# List folders that will be synced
Write-Host "Folders to sync:" -ForegroundColor Yellow
Get-ChildItem -Path $LOCAL_PATH -Directory | ForEach-Object {
    $count = (Get-ChildItem -Path $_.FullName -File -Recurse | Measure-Object).Count
    Write-Host "  - $($_.Name) ($count files)" -ForegroundColor White
}
Write-Host ""

# Confirm
$confirm = Read-Host "Continue with sync? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Sync cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting sync..." -ForegroundColor Cyan

# Create uploads directory on VPS if it doesn't exist
Write-Host "Creating directory structure on VPS..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${VPS_PATH}"

# Use SCP to sync the uploads folder
# We sync specific important folders
$folders = @(
    "config",
    "pb_kta_configs",
    "pengda_kta_configs", 
    "pengcab_kta_configs",
    "barcodes",
    "qrcodes",
    "generated_kta",
    "generated_kta_pb",
    "generated_kta_pengda",
    "kta_files",
    "landing",
    "lisensi"
)

foreach ($folder in $folders) {
    $localFolder = Join-Path $LOCAL_PATH $folder
    if (Test-Path $localFolder) {
        Write-Host "Syncing $folder..." -ForegroundColor Yellow
        
        # Create folder on VPS
        ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${VPS_PATH}/${folder}"
        
        # Sync using scp (recursive)
        $fileCount = (Get-ChildItem -Path $localFolder -File -Recurse | Measure-Object).Count
        if ($fileCount -gt 0) {
            scp -r "${localFolder}/*" "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/${folder}/"
            Write-Host "  Synced $fileCount files" -ForegroundColor Green
        } else {
            Write-Host "  Empty folder, skipped" -ForegroundColor Gray
        }
    } else {
        Write-Host "Folder $folder not found locally, skipping..." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Sync Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Verifying on VPS..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_HOST} "ls -la ${VPS_PATH}/"

Write-Host ""
Write-Host "Don't forget to restart the backend service:" -ForegroundColor Yellow
Write-Host "  ssh ${VPS_USER}@${VPS_HOST} 'pm2 restart forbasi-pb-backend'" -ForegroundColor White
