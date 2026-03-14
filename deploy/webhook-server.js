/**
 * FORBASI Auto-Deploy Webhook Server
 *
 * Listens on port 9000 for GitHub push webhooks and auto-deploys
 * both the backend and frontend on the VPS.
 *
 * Setup:
 *   pm2 start /var/www/webhook-server.js --name forbasi-webhook
 *   pm2 save
 *
 * GitHub Webhook Settings:
 *   Payload URL : https://forbasi.or.id/webhook
 *   Content type: application/json
 *   Secret      : (same value as WEBHOOK_SECRET in this file / env var)
 *   Events      : Just the push event
 */

'use strict';

const http   = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

// ---------------------------------------------------------------------------
// Config — override via environment variables on the VPS:
//   export WEBHOOK_SECRET="your-secret-here"
//   export WEBHOOK_BRANCH="main"
// ---------------------------------------------------------------------------
const PORT           = parseInt(process.env.WEBHOOK_PORT   || '9001', 10);
const SECRET         = process.env.WEBHOOK_SECRET          || '';
const ALLOWED_BRANCH = process.env.WEBHOOK_BRANCH          || 'main';

const BACKEND_DIR    = '/var/www/forbasi-pb-backend';
const FRONTEND_DIR   = '/var/www/forbasi-pb-frontend';

if (!SECRET) {
  console.error('[webhook] FATAL: WEBHOOK_SECRET env variable is not set. Exiting.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Deploy commands
// ---------------------------------------------------------------------------
const DEPLOY_BACKEND = [
  `cd ${BACKEND_DIR}`,
  'git pull origin main',
  'npm install --production',
  'npx prisma generate',
  'pm2 restart forbasi-pb-backend',
].join(' && ');

const DEPLOY_FRONTEND = [
  // Frontend dist is synced separately (npm run build + scp).
  // Only pull here in case there are server-side assets in the repo.
  `cd ${FRONTEND_DIR}`,
  'git pull origin main 2>/dev/null || true',
].join(' && ');

function runDeploy(label, command) {
  console.log(`[webhook] Running deploy: ${label}`);
  exec(command, { timeout: 120_000 }, (err, stdout, stderr) => {
    if (err) {
      console.error(`[webhook] ${label} FAILED:`, stderr || err.message);
    } else {
      console.log(`[webhook] ${label} OK:\n${stdout}`);
    }
  });
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------
function verifySignature(body, sigHeader) {
  if (!sigHeader) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex');
  const expBuf   = Buffer.from(expected);
  const sigBuf   = Buffer.from(sigHeader);
  if (expBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(expBuf, sigBuf);
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------
const server = http.createServer((req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/webhook/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', service: 'forbasi-webhook' }));
  }

  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404).end('Not Found');
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const sig = req.headers['x-hub-signature-256'] || '';

    if (!verifySignature(body, sig)) {
      console.warn('[webhook] Invalid signature from', req.socket.remoteAddress);
      res.writeHead(401).end('Unauthorized');
      return;
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400).end('Bad Request');
      return;
    }

    // Handle GitHub ping event
    const event = req.headers['x-github-event'] || '';
    if (event === 'ping') {
      console.log(`[webhook] Ping received: ${payload.zen || ''}`);
      res.writeHead(200).end('pong');
      return;
    }

    const pushedBranch = (payload.ref || '').replace('refs/heads/', '');
    if (pushedBranch !== ALLOWED_BRANCH) {
      console.log(`[webhook] Ignored push to branch: ${pushedBranch}`);
      res.writeHead(200).end('Ignored');
      return;
    }

    console.log(`[webhook] Push to ${pushedBranch} by ${payload.pusher?.name || 'unknown'} — deploying...`);
    res.writeHead(200).end('Deploying');

    // Run backend deploy; frontend deploy is best done manually via build+scp
    runDeploy('backend', DEPLOY_BACKEND);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[webhook] Listening on 127.0.0.1:${PORT}  branch=${ALLOWED_BRANCH}`);
});
