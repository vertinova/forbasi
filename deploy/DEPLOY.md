# FORBASI Deployment Guide

## VPS Information
- **Host**: 72.61.140.193
- **User**: root
- **Domain**: forbasi.or.id

## Directory Structure on VPS
```
/var/www/forbasi-pb-frontend/dist  → Frontend (Vite build)
/var/www/forbasi-pb-backend/       → Backend (Node.js)
/var/www/forbasi-pb-backend/uploads/ → Upload files (signatures, backgrounds, etc.)
```

## Prerequisites
- SSH access to VPS
- rsync or scp installed locally

---

## Deploy Backend

```bash
# 1. SSH to VPS
ssh root@72.61.140.193

# 2. Navigate to backend
cd /var/www/forbasi-pb-backend

# 3. Pull latest code
git pull origin main

# 4. Install dependencies
npm install --production

# 5. Restart PM2
pm2 restart forbasi-pb-backend
```

---

## Deploy Frontend

```bash
# 1. Build locally
cd frontend
npm run build

# 2. Sync to VPS
scp -r dist/* root@72.61.140.193:/var/www/forbasi-pb-frontend/dist/
```

---

## Sync Uploads Folder

⚠️ **IMPORTANT**: The uploads folder contains critical files for KTA PDF generation:
- `config/kta_template_bg.png` - KTA background template
- `pb_kta_configs/` - PB signature files
- `pengda_kta_configs/` - Pengda signature files  
- `pengcab_kta_configs/` - Pengcab signature files
- `barcodes/`, `qrcodes/` - Generated barcodes/QR codes
- `generated_kta/`, `generated_kta_pb/`, `generated_kta_pengda/` - Generated KTA PDFs

### Using PowerShell (Windows)
```powershell
cd c:\laragon\www\forbasi-js
.\deploy\sync-uploads.ps1
```

### Using Bash (Linux/Mac/WSL)
```bash
cd /path/to/forbasi-js
bash deploy/sync-uploads.sh
```

### Manual Sync with rsync
```bash
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'prisma' \
  backend/uploads/ root@72.61.140.193:/var/www/forbasi-pb-backend/uploads/
```

### Manual Sync with scp
```bash
# Sync specific folder
scp -r backend/uploads/config/* root@72.61.140.193:/var/www/forbasi-pb-backend/uploads/config/

# Sync all uploads
scp -r backend/uploads/* root@72.61.140.193:/var/www/forbasi-pb-backend/uploads/
```

---

## Verify Uploads on VPS

```bash
ssh root@72.61.140.193 "ls -la /var/www/forbasi-pb-backend/uploads/"
ssh root@72.61.140.193 "ls -la /var/www/forbasi-pb-backend/uploads/config/"
```

---

## Auto-Download Fallback

The backend has auto-download fallback for missing files:
- Signature files: Downloaded from `https://forbasi.or.id/forbasi/php/uploads/`
- Background image: Downloaded from `https://forbasi.or.id/uploads/config/`

However, it's best to sync all files beforehand for reliability.

---

## Auto-Deploy Webhook

A GitHub webhook server automatically deploys the backend on every push to `main`.

### First-time Setup (run once from local)

```bash
bash deploy/setup-webhook.sh
```

This will:
1. Copy `webhook-server.js` to `/var/www/webhook-server.js` on the VPS
2. Register it as a PM2 service (`forbasi-webhook`) on port 9000
3. Update and reload the Nginx config
4. Print the GitHub Webhook settings to configure

### GitHub Webhook Settings

| Field         | Value                               |
|---------------|-------------------------------------|
| Payload URL   | `https://forbasi.or.id/webhook`     |
| Content type  | `application/json`                  |
| Secret        | value of `WEBHOOK_SECRET` on VPS    |
| Events        | Just the push event                 |

### Health Check

```bash
# From VPS or browser
curl https://forbasi.or.id/webhook/ping
```

### Webhook Logs

```bash
ssh root@72.61.140.193 "pm2 logs forbasi-webhook --lines 50"
```

### Manual Restart

```bash
ssh root@72.61.140.193 "pm2 restart forbasi-webhook"
```

---

## PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs forbasi-pb-backend

# Restart
pm2 restart forbasi-pb-backend

# Full restart with memory clear
pm2 kill && pm2 start ecosystem.config.js
```

---

## Nginx Configuration

The nginx config is in this folder: [nginx-forbasi.conf](./nginx-forbasi.conf)

To update nginx:
```bash
# Copy config to VPS
scp deploy/nginx-forbasi.conf root@72.61.140.193:/etc/nginx/sites-available/forbasi

# Test and reload
ssh root@72.61.140.193 "nginx -t && systemctl reload nginx"
```
