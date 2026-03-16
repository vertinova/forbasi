require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const db = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const ktaRoutes = require('./src/routes/kta');
const licenseRoutes = require('./src/routes/license');
const kejurnasRoutes = require('./src/routes/kejurnas');
const kejurdaRoutes = require('./src/routes/kejurda');
const notificationRoutes = require('./src/routes/notifications');
const adminRoutes = require('./src/routes/admin');
const publicRoutes = require('./src/routes/public');
const configRoutes = require('./src/routes/config');
const regionalRoutes = require('./src/routes/regional');
const pbPaymentRoutes = require('./src/routes/pbPayment');
const landingRoutes = require('./src/routes/landing');
const regionalLandingRoutes = require('./src/routes/regionalLanding');
const regionalRekomendasiRoutes = require('./src/routes/regionalRekomendasi');
const eventRoutes = require('./src/routes/event');
const externalRoutes = require('./src/routes/external');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'frame-ancestors': ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
    },
  },
}));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://forbasi.or.id',
      'http://forbasi.or.id',
    ];
    // Allow all *.forbasi.or.id subdomains
    if (/^https?:\/\/([a-z0-9-]+\.)?forbasi\.or\.id$/.test(origin) || allowed.includes(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti.' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Terlalu banyak percobaan login, coba lagi nanti.' }
});
app.use('/api/auth/login', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files (uploads) — auto-regenerate missing KTA PDFs & fetch missing files from production
app.use('/uploads', async (req, res, next) => {
  const relPath = req.path.replace(/^\/+/, '');
  const filePath = path.join(__dirname, 'uploads', relPath);
  const fs = require('fs');

  // If file exists locally, serve it directly
  if (fs.existsSync(filePath)) return next();

  // For kta_files (logos, documents) — try fetching from production server
  if (req.path.startsWith('/kta_files/') || req.path.startsWith('/payment_proofs/')) {
    try {
      const prodUrl = `https://forbasi.or.id/forbasi/php/uploads${req.path}`;
      const https = require('https');
      const fetched = await new Promise((resolve, reject) => {
        https.get(prodUrl, { timeout: 10000 }, (resp) => {
          if (resp.statusCode !== 200) return reject(new Error(`Status ${resp.statusCode}`));
          const chunks = [];
          resp.on('data', c => chunks.push(c));
          resp.on('end', () => resolve(Buffer.concat(chunks)));
          resp.on('error', reject);
        }).on('error', reject);
      });
      if (fetched.length > 0) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, fetched);
        return next();
      }
    } catch (err) {
      // File not found on production either, continue to next handler
    }
  }

  // Auto-regenerate missing KTA PDFs
  const match = req.path.match(/^\/generated_kta(?:_pb|_pengda)?\/(KTA_(?:PB_|Pengcab_|Pengda_)?(.+?)_(\d+)\.pdf)$/i);
  if (!match) return next();

  // File missing — try to regenerate
  try {
    const appId = parseInt(match[3]);
    const subDir = req.path.split('/')[1]; // generated_kta_pb, generated_kta_pengda, or generated_kta
    const role = subDir === 'generated_kta_pb' ? 'pb' : subDir === 'generated_kta_pengda' ? 'pengda' : 'pengcab';
    const db = require('./src/config/database');
    const [rows] = await db.query(
      `SELECT ka.*, u.club_name, u.username, p.name as province_name, c.name as city_name
       FROM kta_applications ka
       JOIN users u ON ka.user_id = u.id
       LEFT JOIN provinces p ON ka.province_id = p.id
       LEFT JOIN cities c ON ka.city_id = c.id
       WHERE ka.id = ?`,
      [appId]
    );
    if (!rows.length) return next();
    const { generateKtaPdf } = require('./src/utils/pdfGenerator');
    const result = await generateKtaPdf(rows[0], { role });
    const KtaApplication = require('./src/models/KtaApplication');
    const col = role === 'pb' ? 'generated_kta_file_path_pb'
      : role === 'pengda' ? 'generated_kta_file_path_pengda'
      : 'generated_kta_file_path';
    await KtaApplication.update(appId, { [col]: result.filepath });
    if (result.barcode_id) await KtaApplication.update(appId, { kta_barcode_unique_id: result.barcode_id });
  } catch (err) {
    console.error('Auto-regenerate KTA PDF failed:', err.message);
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/kta', ktaRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/kejurnas', kejurnasRoutes);
app.use('/api/kejurda', kejurdaRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/config', configRoutes);
app.use('/api/regional', regionalRoutes);
app.use('/api/pb-payment', pbPaymentRoutes);
app.use('/api/landing', landingRoutes);
app.use('/api/regional-landing', regionalLandingRoutes);
app.use('/api/regional-rekomendasi', regionalRekomendasiRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/external', externalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Version check (served from frontend's version.json in production, 
// but also available as API endpoint for flexibility)
app.get('/api/version', (req, res) => {
  const versionFile = path.join(__dirname, '..', 'forbasi-pb-frontend', 'dist', 'version.json');
  const fallback = path.join(__dirname, 'version.json');
  const fs = require('fs');
  
  for (const f of [versionFile, fallback]) {
    try {
      if (fs.existsSync(f)) {
        const data = JSON.parse(fs.readFileSync(f, 'utf8'));
        return res.json({ success: true, ...data });
      }
    } catch { /* try next */ }
  }
  res.json({ success: true, version: '1.0.0' });
});

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Test DB connection
    const connection = await db.getConnection();
    console.log('✅ Database connected');
    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 FORBASI API running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message || err);
    if (err.code) console.error('   Error code:', err.code);
    process.exit(1);
  }
}

startServer();

module.exports = app;
