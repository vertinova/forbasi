/**
 * Generic Regional Proxy Routes
 * Proxies requests to regional backend's External API.
 * 
 * /api/regional-proxy/:region/*  →  https://{region}.forbasi.or.id/api/external/*
 * 
 * All requests require JWT auth + Pengda role (role_id: 3).
 * File uploads are handled via multer temp storage.
 */
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { proxyRequest } = require('../controllers/regionalProxyController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Multer temp storage for file forwarding
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(os.tmpdir(), 'forbasi-regional-proxy');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `proxy_${Date.now()}_${Math.random().toString(16).slice(2, 10)}${ext}`);
  }
});

const upload = multer({
  storage: tempStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Auth: Pengda (role_id: 3)
const auth = [authenticate, authorize(3)];

// Wildcard proxy — handles any method and path
// upload.any() accepts any file field name
router.all('/:region/*', auth, upload.any(), proxyRequest);

module.exports = router;
